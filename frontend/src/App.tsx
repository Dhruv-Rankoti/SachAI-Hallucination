import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { VeracityScoreGauge } from '@/components/dashboard/VeracityScoreGauge';
import { EvidenceViewer } from '@/components/dashboard/EvidenceViewer';
import { AlignmentHeatmap } from '@/components/dashboard/AlignmentHeatmap';
import { HallucinationTaxonomy } from '@/components/dashboard/HallucinationTaxonomy';
import { ClaimsList } from '@/components/dashboard/ClaimsList';
import { analyzeText } from '@/api/analyze';
import type { DashboardData } from '@/types/dashboard';
import { AlertTriangle, FileText, Zap, Search, Loader2 } from 'lucide-react';

function App() {
  const [source, setSource] = useState('');
  const [response, setResponse] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setError(null);
    setLoading(true);
    try {
      const result = await analyzeText(source, response);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const analysis = data?.analysis;

  return (
    <div className="min-h-screen bg-slate-950 grid-pattern">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Source Document</label>
            <textarea
              className="flex-1 min-h-[160px] p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm resize-none focus:outline-none focus:border-emerald-500/60 placeholder:text-slate-600"
              placeholder="Paste the ground-truth source text here…"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">AI Response</label>
            <textarea
              className="flex-1 min-h-[160px] p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm resize-none focus:outline-none focus:border-emerald-500/60 placeholder:text-slate-600"
              placeholder="Paste the AI-generated response to verify…"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-4">
            <button
              onClick={handleAnalyze}
              disabled={loading || !source.trim() || !response.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-semibold text-sm transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Analyzing…' : 'Analyze'}
            </button>
            {error && <p className="text-sm text-rose-400">{error}</p>}
          </div>
        </motion.div>

        {/* Results */}
        {analysis && (
          <>
            {analysis.riskIndex >= 60 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-4"
              >
                <div className="p-2 rounded-lg bg-rose-500/20">
                  <AlertTriangle className="w-6 h-6 text-rose-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-rose-400">High Hallucination Risk Detected</h3>
                  <p className="text-sm text-rose-300/80">
                    This AI response contains fabricated claims not supported by the source document.
                    Review flagged content before use in high-stakes environments.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-mono text-rose-400">{analysis.riskIndex}%</p>
                  <p className="text-xs text-rose-400/60 uppercase tracking-wider">Risk Index</p>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <VeracityScoreGauge analysis={analysis} />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <HallucinationTaxonomy analysis={analysis} />
                </motion.div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <EvidenceViewer data={data} />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <AlignmentHeatmap data={data} />
                </motion.div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6"
            >
              <ClaimsList claims={analysis.claims} />
            </motion.div>
          </>
        )}

        {/* How It Works */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <Zap className="w-5 h-5 text-violet-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100">How SachAI Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Claim Extraction', description: 'AI response is atomized into individual factual claims using spaCy sentencizer.', icon: FileText, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
              { step: '02', title: 'NLI Cross-Examination', description: 'Each claim is evaluated against every source sentence using DeBERTa NLI model.', icon: Zap, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
              { step: '03', title: 'Truth Classification', description: 'Claims are categorized as Faithful, Extrapolated, Fabricated, or Contradicted.', icon: AlertTriangle, color: 'text-rose-400', bgColor: 'bg-rose-500/10' },
              { step: '04', title: 'Risk Scoring', description: 'A composite risk index is calculated based on unsupported claim density.', icon: Zap, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
                className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${item.bgColor}`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className="text-xs font-mono text-slate-500">{item.step}</span>
                </div>
                <h3 className="font-medium text-slate-200 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <footer className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-slate-400">SachAI Forensic Engine v1.0</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <span>Built for Hackathon 2025</span>
              <span>•</span>
              <span>Powered by cross-encoder/nli-deberta-v3-small</span>
              <span>•</span>
              <span>HaluEval Benchmark</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
