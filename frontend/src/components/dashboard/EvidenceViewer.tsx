import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, AlertTriangle, CheckCircle, XCircle, HelpCircle, Eye } from 'lucide-react';
import type { DashboardData, Claim } from '@/types/dashboard';
import { getClaimTypeColor, getClaimTypeLabel } from '@/data/mockAnalysis';
import { cn } from '@/lib/utils';

interface EvidenceViewerProps {
  data: DashboardData;
}

export function EvidenceViewer({ data }: EvidenceViewerProps) {
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [hoveredClaimId, setHoveredClaimId] = useState<string | null>(null);
  
  const { sourceText, aiResponse, analysis } = data;
  
  const getClaimIcon = (type: string) => {
    switch (type) {
      case 'FAITHFUL':
        return <CheckCircle className="w-4 h-4" />;
      case 'EXTRAPOLATED':
        return <HelpCircle className="w-4 h-4" />;
      case 'FABRICATED':
        return <XCircle className="w-4 h-4" />;
      case 'CONTRADICTED':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return null;
    }
  };
  
  const renderHighlightedText = () => {
    const sentences = aiResponse.split(/(?<=[.!?])\s+/);
    let claimIndex = 0;
    
    return sentences.map((sentence, idx) => {
      const claim = analysis.claims[claimIndex];
      const isClaim = claim && sentence.includes(claim.text.substring(0, 30));
      
      if (isClaim && claim) {
        claimIndex++;
        const isHovered = hoveredClaimId === claim.id;
        const isSelected = selectedClaim?.id === claim.id;
        
        return (
          <motion.span
            key={idx}
            className={cn(
              "cursor-pointer rounded px-1 py-0.5 transition-all duration-200",
              "border-l-2"
            )}
            style={{
              backgroundColor: `${getClaimTypeColor(claim.type)}20`,
              borderLeftColor: getClaimTypeColor(claim.type),
              boxShadow: isHovered || isSelected ? `0 0 10px ${getClaimTypeColor(claim.type)}40` : 'none'
            }}
            onClick={() => setSelectedClaim(claim)}
            onMouseEnter={() => setHoveredClaimId(claim.id)}
            onMouseLeave={() => setHoveredClaimId(null)}
            whileHover={{ scale: 1.01 }}
          >
            {sentence}
          </motion.span>
        );
      }
      
      return <span key={idx}>{sentence} </span>;
    });
  };
  
  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100">Forensic Evidence Viewer</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Eye className="w-4 h-4" />
          <span>Click highlighted claims for details</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Document */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="uppercase tracking-wider font-medium">Source Document (Ground Truth)</span>
          </div>
          <div className="bg-slate-950/50 rounded-lg border border-slate-800 p-4 max-h-[400px] overflow-y-auto">
            <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
              {sourceText}
            </pre>
          </div>
        </div>
        
        {/* AI Response with Highlights */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="uppercase tracking-wider font-medium">AI Generated Response</span>
          </div>
          <div className="bg-slate-950/50 rounded-lg border border-slate-800 p-4 max-h-[400px] overflow-y-auto">
            <div className="text-sm text-slate-300 leading-relaxed">
              {renderHighlightedText()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Claim Type Legend</p>
        <div className="flex flex-wrap gap-3">
          {['FAITHFUL', 'EXTRAPOLATED', 'FABRICATED', 'CONTRADICTED'].map((type) => (
            <div 
              key={type}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700"
            >
              <span 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getClaimTypeColor(type) }}
              />
              <span className="text-xs text-slate-300">{getClaimTypeLabel(type)}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Claim Detail Modal */}
      <AnimatePresence>
        {selectedClaim && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-6 p-4 rounded-lg border"
            style={{ 
              backgroundColor: `${getClaimTypeColor(selectedClaim.type)}10`,
              borderColor: `${getClaimTypeColor(selectedClaim.type)}40`
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${getClaimTypeColor(selectedClaim.type)}20` }}
                >
                  <span style={{ color: getClaimTypeColor(selectedClaim.type) }}>
                    {getClaimIcon(selectedClaim.type)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">Claim Analysis</p>
                  <p className="text-xs text-slate-400">ID: {selectedClaim.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClaim(null)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Claim Text</p>
                <p className="text-sm text-slate-300 italic">"{selectedClaim.text}"</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Classification</p>
                  <span 
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium"
                    style={{ 
                      backgroundColor: `${getClaimTypeColor(selectedClaim.type)}20`,
                      color: getClaimTypeColor(selectedClaim.type)
                    }}
                  >
                    {getClaimTypeLabel(selectedClaim.type)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Confidence</p>
                  <p className="text-sm font-mono text-slate-300">
                    {(selectedClaim.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">NLI Scores</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 rounded bg-slate-900/50">
                    <p className="text-xs text-slate-500">Entailment</p>
                    <p className="text-sm font-mono text-emerald-400">
                      {(selectedClaim.nliScores.entailment * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-center p-2 rounded bg-slate-900/50">
                    <p className="text-xs text-slate-500">Contradiction</p>
                    <p className="text-sm font-mono text-rose-400">
                      {(selectedClaim.nliScores.contradiction * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-center p-2 rounded bg-slate-900/50">
                    <p className="text-xs text-slate-500">Neutral</p>
                    <p className="text-sm font-mono text-amber-400">
                      {(selectedClaim.nliScores.neutral * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
              
              {selectedClaim.sourceRef && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Source Reference</p>
                  <p className="text-sm font-mono text-emerald-400">{selectedClaim.sourceRef}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
