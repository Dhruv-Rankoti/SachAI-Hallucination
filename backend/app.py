import os
import json
import spacy
import torch
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer, util
from transformers import pipeline

app = Flask(__name__)
CORS(app)

# --- Model Init ---
device = "cuda" if torch.cuda.is_available() else "cpu"
nlp_ner = spacy.load("en_core_web_sm")

MODEL_PATH = "/kaggle/input/notebooks/anirbandasbit/sentenceclassifier/output/model-best"
nlp_intent = spacy.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else nlp_ner

embedder = SentenceTransformer("all-MiniLM-L6-v2", device=device)
nli_judge = pipeline(
    "text-classification",
    model="cross-encoder/nli-deberta-v3-small",
    device=0 if device == "cuda" else -1,
)

# --- Pipeline Functions ---
def has_verb(tokens):
    return any(tok.pos_ in {"VERB", "AUX"} for tok in tokens)

def extract_claims(text):
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
                if has_verb(current_chunk) and has_verb(tokens[i + 1 :]):
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

def classify_intent(text):
    if not os.path.exists(MODEL_PATH):
        return "FACT"
    doc = nlp_intent(text)
    return max(doc.cats, key=doc.cats.get)

def get_nli_verdict(source_sentence, ai_claim):
    result = nli_judge({"text": source_sentence, "text_pair": ai_claim})
    label_map = {
        "contradiction": "Contradicted", "entailment": "Entailed", "neutral": "Neutral",
        "LABEL_0": "Contradicted", "LABEL_1": "Entailed", "LABEL_2": "Neutral",
    }
    key = result["label"].lower() if result["label"] not in label_map else result["label"]
    return label_map.get(key, result["label"]), round(result["score"], 4)

def check_numeric_drift(ai_claim_text, top_source_sentence):
    NUMERIC_LABELS = {"MONEY", "PERCENT", "DATE", "TIME", "CARDINAL", "QUANTITY"}
    claim_numbers = [e.text for e in nlp_ner(ai_claim_text).ents if e.label_ in NUMERIC_LABELS]
    if not claim_numbers:
        return "PASS"
    for num in claim_numbers:
        if num not in top_source_sentence:
            return f"Drift: '{num}' not found."
    return "PASS"

def build_alignment_matrix(ai_claims, source_sentences):
    claim_emb = embedder.encode(ai_claims, convert_to_tensor=True, device=device)
    source_emb = embedder.encode(source_sentences, convert_to_tensor=True, device=device)
    matrix = util.cos_sim(claim_emb, source_emb)
    result = []
    for i in range(len(ai_claims)):
        max_score, max_idx = torch.max(matrix[i], dim=0)
        result.append({
            "S_Max": round(max_score.item(), 4),
            "Source_Index": max_idx.item(),
            "Matched_Sentence": source_sentences[max_idx.item()],
            "matrix_row": [round(v.item(), 4) for v in matrix[i]],
        })
    return result

'''def evaluate_response(ai_claims, source_sentences):
    matrix_data = build_alignment_matrix(ai_claims, source_sentences)
    results = []
    for i, claim in enumerate(ai_claims):
        intent = classify_intent(claim)
        alibi = matrix_data[i]["Matched_Sentence"]
        s_max = matrix_data[i]["S_Max"]
        matrix_row = matrix_data[i]["matrix_row"]
        source_idx = matrix_data[i]["Source_Index"]

        ev = {"claim": claim, "intent": intent, "taxonomy": "TBD", "similarity": s_max,
              "alibi": alibi, "source_index": source_idx, "matrix_row": matrix_row}

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
            ev["taxonomy"] = "Grounded Opinion" if s_max > 0.7 else ("Weakly Grounded Opinion" if s_max > 0.4 else "Ungrounded Opinion")
        else:
            ev["taxonomy"] = "Relevant Suggestion" if s_max > 0.6 else "Irrelevant / Hallucinated Suggestion"

        results.append(ev)
    return results
'''
def evaluate_response(ai_claims, source_sentences):
    matrix_data = build_alignment_matrix(ai_claims, source_sentences)
    results = []

    for i, claim in enumerate(ai_claims):
        intent = classify_intent(claim)
        alibi = matrix_data[i]["Matched_Sentence"]
        s_max = matrix_data[i]["S_Max"]
        matrix_row = matrix_data[i]["matrix_row"]
        source_idx = matrix_data[i]["Source_Index"]

        ev = {
            "claim": claim,
            "intent": intent,
            "taxonomy": "TBD",
            "similarity": s_max,
            "alibi": alibi,
            "source_index": source_idx,
            "matrix_row": matrix_row,
        }

        # --- FACT HANDLING ---
        if intent.upper() == "FACT":
            nli, conf = get_nli_verdict(alibi, claim)

            # --- Forgiving Logic ---
            if nli == "Entailed":
                taxonomy = "Verified Fact"

            elif nli == "Contradicted":
                # Only penalize strong contradictions
                if conf > 0.75:
                    taxonomy = "Contradiction"
                else:
                    taxonomy = "Possibly Misaligned"

            else:  # Neutral
                if s_max > 0.75:
                    taxonomy = "Safe Inference"
                elif s_max > 0.5:
                    taxonomy = "Weak Inference"
                else:
                    taxonomy = "Likely Hallucination"

            ev.update({
                "taxonomy": taxonomy,
                "nli": nli,
                "confidence": conf
            })

        # --- OPINION HANDLING ---
        elif intent.upper() == "OPINION":
            if s_max > 0.75:
                ev["taxonomy"] = "Grounded Opinion"
            elif s_max > 0.5:
                ev["taxonomy"] = "Loosely Grounded Opinion"
            else:
                ev["taxonomy"] = "Ungrounded Opinion"

        # --- SUGGESTION / OTHER ---
        else:
            if s_max > 0.7:
                ev["taxonomy"] = "Relevant Suggestion"
            elif s_max > 0.4:
                ev["taxonomy"] = "Weak Suggestion"
            else:
                ev["taxonomy"] = "Irrelevant / Hallucinated Suggestion"

        results.append(ev)

    return results

@app.route("/analyze", methods=["POST"])
def analyze():
    body = request.get_json()
    source = body.get("source", "").strip()
    response = body.get("response", "").strip()

    if not source or not response:
        return jsonify({"error": "Both 'source' and 'response' are required."}), 400

    source_sentences = extract_claims(source)
    ai_claims = extract_claims(response)

    if not source_sentences or not ai_claims:
        return jsonify({"error": "Could not extract claims from the provided text."}), 422

    results = evaluate_response(ai_claims, source_sentences)
    return jsonify({
        "source_sentences": source_sentences,
        "ai_claims": ai_claims,
        "results": results,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
