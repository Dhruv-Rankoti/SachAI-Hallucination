"""
hallucinator.py — Hallucination Detector Service
Run this as a separate process BEFORE starting the RAG system:

    python hallucinator.py

Exposes two endpoints:
    POST /analyze   — full claim-level analysis (source + response)
    GET  /health    — liveness check (RAG uses this to detect if service is up)

Fixes applied vs original app.py:
  1. get_nli_verdict: pipeline() can return list or dict — handled both
  2. Renamed from app.py to hallucinator.py — avoids collision with RAG's app.py
  3. Added /health endpoint for graceful degradation in RAG
  4. Added /intercept endpoint — verdict-only fast path used by the RAG middleware
  5. Startup model warm-up so first request isn't slow
  6. Configurable port (default 5001 to avoid Streamlit's 5000 conflict)
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
import torch
from sentence_transformers import SentenceTransformer, util
from transformers import pipeline

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# ── Config ────────────────────────────────────────────────────────────────────
PORT       = int(os.getenv("HALLUCINATOR_PORT", 5001))
THRESHOLD  = float(os.getenv("HALLUCINATION_THRESHOLD", "0.6"))

# Path to your custom spaCy intent classifier (optional).
# If not found, all claims default to FACT intent — still works fine.
MODEL_PATH = os.getenv(
    "INTENT_MODEL_PATH",
    "/kaggle/input/notebooks/anirbandasbit/sentenceclassifier/output/model-best",
)

# ── Model Init (runs once at startup) ─────────────────────────────────────────
log.info("Loading models…")
device = "cuda" if torch.cuda.is_available() else "cpu"
log.info(f"  Device: {device}")

log.info("  spaCy NER (en_core_web_sm)…")
nlp_ner = spacy.load("en_core_web_sm")

if os.path.exists(MODEL_PATH):
    log.info(f"  Custom intent classifier: {MODEL_PATH}")
    nlp_intent = spacy.load(MODEL_PATH)
else:
    log.info("  Intent model not found — defaulting all claims to FACT")
    nlp_intent = None

log.info("  SentenceTransformer (all-MiniLM-L6-v2)…")
embedder = SentenceTransformer("all-MiniLM-L6-v2", device=device)

log.info("  NLI judge (cross-encoder/nli-deberta-v3-small)…")
nli_judge = pipeline(
    "text-classification",
    model="cross-encoder/nli-deberta-v3-small",
    device=0 if device == "cuda" else -1,
)

# ── Warm-up: run a dummy inference so the first real request is fast ──────────
log.info("  Warming up NLI model…")
_ = nli_judge({"text": "The sky is blue.", "text_pair": "The sky is blue."})
log.info("Models ready.\n")


# ─────────────────────────────────────────────────────────────────────────────
# Pipeline helpers
# ─────────────────────────────────────────────────────────────────────────────

def has_verb(tokens: list) -> bool:
    return any(tok.pos_ in {"VERB", "AUX"} for tok in tokens)


def extract_claims(text: str) -> list[str]:
    """
    Split text into atomic claims by sentence, then sub-split on coordinating
    conjunctions only when both sides contain a verb (so "fast and reliable"
    stays as one chunk, but "it runs fast and it stores data" splits).
    """
    split_words = {"and", "but", "also", "however"}
    doc = nlp_ner(text)
    claims = []

    for sent in doc.sents:
        current_chunk = []
        tokens = list(sent)
        i = 0
        while i < len(tokens):
            token = tokens[i]
            if token.text.lower() in split_words and token.dep_ == "cc":
                if has_verb(current_chunk) and has_verb(tokens[i + 1:]):
                    if current_chunk:
                        claims.append(" ".join(t.text for t in current_chunk).strip())
                        current_chunk = []
                    i += 1
                    continue
            current_chunk.append(token)
            i += 1

        if current_chunk:
            claims.append(" ".join(t.text for t in current_chunk).strip())

    return [c for c in claims if len(c) > 5]


def classify_intent(text: str) -> str:
    """Returns FACT, OPINION, or SUGGESTION. Defaults to FACT if model absent."""
    if nlp_intent is None:
        return "FACT"
    doc = nlp_intent(text)
    return max(doc.cats, key=doc.cats.get)


def get_nli_verdict(source_sentence: str, ai_claim: str) -> tuple[str, float]:
    """
    Runs NLI between source and claim.
    FIX: pipeline() may return list[dict] or dict depending on version — handle both.
    """
    raw = nli_judge({"text": source_sentence, "text_pair": ai_claim})

    # Normalise to a single dict
    result = raw[0] if isinstance(raw, list) else raw

    label_map = {
        "contradiction": "Contradicted",
        "entailment":    "Entailed",
        "neutral":       "Neutral",
        "LABEL_0":       "Contradicted",
        "LABEL_1":       "Entailed",
        "LABEL_2":       "Neutral",
    }
    label = result.get("label", "neutral")
    key   = label if label in label_map else label.lower()
    return label_map.get(key, label), round(result.get("score", 0.0), 4)


def check_numeric_drift(ai_claim_text: str, top_source_sentence: str) -> str:
    """
    Flags claims that contain numbers not present in the matched source sentence.
    Catches hallucinated statistics, dates, and monetary values.
    """
    NUMERIC_LABELS = {"MONEY", "PERCENT", "DATE", "TIME", "CARDINAL", "QUANTITY"}
    claim_numbers  = [
        e.text for e in nlp_ner(ai_claim_text).ents
        if e.label_ in NUMERIC_LABELS
    ]
    if not claim_numbers:
        return "PASS"
    for num in claim_numbers:
        if num not in top_source_sentence:
            return f"Drift: '{num}' not found in source."
    return "PASS"


def build_alignment_matrix(ai_claims: list[str], source_sentences: list[str]) -> list[dict]:
    """
    Compute cosine similarity between every (claim, source_sentence) pair.
    Returns for each claim: best-matching source sentence + full similarity row.
    """
    claim_emb  = embedder.encode(ai_claims,        convert_to_tensor=True, device=device)
    source_emb = embedder.encode(source_sentences, convert_to_tensor=True, device=device)
    matrix     = util.cos_sim(claim_emb, source_emb)

    result = []
    for i in range(len(ai_claims)):
        max_score, max_idx = torch.max(matrix[i], dim=0)
        result.append({
            "S_Max":            round(max_score.item(), 4),
            "Source_Index":     max_idx.item(),
            "Matched_Sentence": source_sentences[max_idx.item()],
            "matrix_row":       [round(v.item(), 4) for v in matrix[i]],
        })
    return result


def evaluate_response(ai_claims: list[str], source_sentences: list[str]) -> list[dict]:
    """
    Core evaluation pipeline — assigns a taxonomy label to every claim:

    FACT claims:
        Numeric Drift      — claim contains a number not in the source
        Verified Fact      — NLI: Entailed by source
        Contradiction      — NLI: Contradicted by source
        Extrapolation      — NLI: Neutral but similarity > 0.6 (plausible but unverified)
        Fabrication        — NLI: Neutral and similarity ≤ 0.6 (pulled from thin air)

    OPINION claims:
        Grounded Opinion         — similarity > 0.7
        Weakly Grounded Opinion  — similarity 0.4–0.7
        Ungrounded Opinion       — similarity ≤ 0.4

    SUGGESTION claims:
        Relevant Suggestion               — similarity > 0.6
        Irrelevant / Hallucinated Suggestion — similarity ≤ 0.6
    """
    matrix_data = build_alignment_matrix(ai_claims, source_sentences)
    results = []

    for i, claim in enumerate(ai_claims):
        intent     = classify_intent(claim)
        alibi      = matrix_data[i]["Matched_Sentence"]
        s_max      = matrix_data[i]["S_Max"]
        matrix_row = matrix_data[i]["matrix_row"]
        source_idx = matrix_data[i]["Source_Index"]

        ev = {
            "claim":        claim,
            "intent":       intent,
            "taxonomy":     "TBD",
            "similarity":   s_max,
            "alibi":        alibi,
            "source_index": source_idx,
            "matrix_row":   matrix_row,
        }

        if intent.upper() == "FACT":
            drift = check_numeric_drift(claim, alibi)
            if drift != "PASS":
                ev.update({"taxonomy": "Numeric Drift", "error": drift})
            else:
                nli, conf = get_nli_verdict(alibi, claim)
                if nli == "Entailed":
                    taxonomy = "Verified Fact"
                elif nli == "Contradicted":
                    taxonomy = "Contradiction"
                else:
                    taxonomy = "Extrapolation" if s_max > 0.6 else "Fabrication"
                ev.update({"taxonomy": taxonomy, "nli": nli, "confidence": conf})

        elif intent.upper() == "OPINION":
            if s_max > 0.7:
                ev["taxonomy"] = "Grounded Opinion"
            elif s_max > 0.4:
                ev["taxonomy"] = "Weakly Grounded Opinion"
            else:
                ev["taxonomy"] = "Ungrounded Opinion"

        else:  # SUGGESTION
            ev["taxonomy"] = (
                "Relevant Suggestion" if s_max > 0.6
                else "Irrelevant / Hallucinated Suggestion"
            )

        results.append(ev)

    return results


def compute_verdict(results: list[dict]) -> dict:
    """
    Aggregate per-claim results into a single verdict dict.
    Used by both /analyze and /intercept.
    """
    faithful_labels = {"Verified Fact", "Grounded Opinion", "Relevant Suggestion"}
    bad_labels      = {
        "Contradiction", "Fabrication", "Numeric Drift",
        "Ungrounded Opinion", "Irrelevant / Hallucinated Suggestion",
    }

    total    = len(results)
    faithful = sum(1 for r in results if r.get("taxonomy") in faithful_labels)
    score    = round(faithful / total, 3) if total > 0 else 1.0
    flagged  = [r for r in results if r.get("taxonomy") in bad_labels]
    verdict  = "FAITHFUL" if score >= THRESHOLD else "HALLUCINATED"

    return {
        "verdict":            verdict,
        "faithfulness_score": score,
        "threshold":          THRESHOLD,
        "flagged_claims":     flagged,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """
    Liveness check — RAG's HallucinationDetector calls this on startup
    to decide whether to enable or silently skip checks.
    """
    return jsonify({"status": "ok", "device": device}), 200


@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Full analysis endpoint — returns per-claim breakdown + verdict.

    Body:  { "source": "...", "response": "..." }
    Returns:
    {
        "source_sentences": [...],
        "ai_claims":        [...],
        "results":          [...],        ← per-claim taxonomy
        "verdict":          "FAITHFUL" | "HALLUCINATED",
        "faithfulness_score": 0.0–1.0,
        "flagged_claims":   [...]
    }
    """
    body     = request.get_json(force=True)
    source   = (body.get("source",   "") or "").strip()
    response = (body.get("response", "") or "").strip()

    if not source or not response:
        return jsonify({"error": "Both 'source' and 'response' are required."}), 400

    source_sentences = extract_claims(source)
    ai_claims        = extract_claims(response)

    if not source_sentences:
        return jsonify({"error": "Could not extract any claims from 'source'."}), 422
    if not ai_claims:
        return jsonify({"error": "Could not extract any claims from 'response'."}), 422

    results = evaluate_response(ai_claims, source_sentences)
    verdict = compute_verdict(results)

    return jsonify({
        "source_sentences":  source_sentences,
        "ai_claims":         ai_claims,
        "results":           results,
        **verdict,           # verdict, faithfulness_score, threshold, flagged_claims
    })


@app.route("/intercept", methods=["POST"])
def intercept():
    """
    Fast-path endpoint — verdict only, no per-claim breakdown in response body.
    Slightly faster when you only need the go/no-go signal.

    Body:    { "source": "...", "response": "..." }
    Returns: { "verdict": "FAITHFUL"|"HALLUCINATED", "faithfulness_score": 0.87, ... }
    """
    body     = request.get_json(force=True)
    source   = (body.get("source",   "") or "").strip()
    response = (body.get("response", "") or "").strip()

    if not source or not response:
        return jsonify({"error": "Both 'source' and 'response' are required."}), 400

    # print("Source: ", source)
    # print("-----------------")
    print("Response: ", response)
    print("-----------------")

    source_sentences = extract_claims(source)
    ai_claims        = extract_claims(response)

    if not source_sentences or not ai_claims:
        # Can't check → assume faithful so we don't block the user
        return jsonify({"verdict": "FAITHFUL", "faithfulness_score": 1.0,
                        "note": "Could not extract claims — check skipped."}), 200

    results = evaluate_response(ai_claims, source_sentences)
    verdict = compute_verdict(results)
    # print("Verdict: ", verdict)
    return jsonify(verdict)


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    log.info(f"Starting Hallucination Detector on port {PORT}")
    log.info(f"Faithfulness threshold: {THRESHOLD}")
    app.run(host="0.0.0.0", port=PORT, debug=False)