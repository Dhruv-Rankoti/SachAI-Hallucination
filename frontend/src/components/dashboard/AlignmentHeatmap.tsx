import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Grid3X3, Info, Maximize2, Minimize2 } from 'lucide-react';
import type { DashboardData } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface AlignmentHeatmapProps {
  data: DashboardData;
}

export function AlignmentHeatmap({ data }: AlignmentHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{x: number, y: number} | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { analysis, aiResponse } = data;
  const { alignmentMatrix, claims, sourceSegments } = analysis;
  
  // Parse AI response into sentences
  const aiSentences = useMemo(() => {
    return aiResponse.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10).slice(0, 6);
  }, [aiResponse]);
  
  // Parse source into key sections
  const sourceSections = useMemo(() => {
    return sourceSegments.map(s => ({
      id: s.id,
      text: s.text.substring(0, 50) + '...'
    }));
  }, [sourceSegments]);
  
  const getCellColor = (value: number) => {
    if (value >= 0.7) return { bg: '#10b981', intensity: value };
    if (value >= 0.4) return { bg: '#f59e0b', intensity: value };
    if (value >= 0.2) return { bg: '#64748b', intensity: value };
    return { bg: '#ef4444', intensity: Math.max(0.3, 1 - value) };
  };
  
  const getCellLabel = (value: number) => {
    if (value >= 0.7) return 'Strong Match';
    if (value >= 0.4) return 'Partial Match';
    if (value >= 0.2) return 'Weak Match';
    return 'No Match';
  };
  
  const hoveredValue = hoveredCell ? alignmentMatrix[hoveredCell.y]?.[hoveredCell.x] : null;
  const hoveredClaim = hoveredCell ? claims[hoveredCell.y] : null;
  const hoveredSource = hoveredCell ? sourceSections[hoveredCell.x] : null;
  
  return (
    <div className={cn(
      "glass-panel rounded-xl p-6 transition-all duration-300",
      isExpanded && "col-span-full"
    )}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10">
            <Grid3X3 className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Alignment Heatmap</h3>
            <p className="text-xs text-slate-400">NLI Entailment Scores: AI Claims × Source Segments</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          {isExpanded ? <Minimize2 className="w-4 h-4 text-slate-400" /> : <Maximize2 className="w-4 h-4 text-slate-400" />}
        </button>
      </div>
      
      <div className={cn(
        "grid gap-6",
        isExpanded ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"
      )}>
        {/* Heatmap Grid */}
        <div className={cn("space-y-4", isExpanded && "lg:col-span-2")}>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Column Headers (Source) */}
              <div className="flex">
                <div className="w-48 flex-shrink-0" />
                <div className="flex gap-1">
                  {sourceSections.map((section, idx) => (
                    <div 
                      key={section.id}
                      className="w-16 flex-shrink-0 text-center"
                    >
                      <span className="text-xs text-slate-500 font-mono">S{idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Grid Rows */}
              <div className="space-y-1 mt-2">
                {aiSentences.map((sentence, rowIdx) => (
                  <div key={rowIdx} className="flex items-center gap-2">
                    {/* Row Label (AI Claim) */}
                    <div className="w-48 flex-shrink-0 text-right pr-2">
                      <span className="text-xs text-slate-400 truncate block" title={sentence}>
                        Claim {rowIdx + 1}: {sentence.substring(0, 25)}...
                      </span>
                    </div>
                    
                    {/* Cells */}
                    <div className="flex gap-1">
                      {alignmentMatrix[rowIdx]?.map((value, colIdx) => {
                        const color = getCellColor(value);
                        const isHovered = hoveredCell?.x === colIdx && hoveredCell?.y === rowIdx;
                        
                        return (
                          <motion.div
                            key={`${rowIdx}-${colIdx}`}
                            className={cn(
                              "w-16 h-10 rounded cursor-pointer transition-all duration-200 flex items-center justify-center",
                              isHovered && "ring-2 ring-white/50 z-10"
                            )}
                            style={{ 
                              backgroundColor: color.bg,
                              opacity: 0.3 + (color.intensity * 0.7)
                            }}
                            onMouseEnter={() => setHoveredCell({ x: colIdx, y: rowIdx })}
                            onMouseLeave={() => setHoveredCell(null)}
                            whileHover={{ scale: 1.05 }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: (rowIdx * 7 + colIdx) * 0.02 }}
                          >
                            <span className="text-xs font-mono font-medium text-white/90">
                              {(value * 100).toFixed(0)}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500" />
                <span className="text-xs text-slate-400">Strong Match (70%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500" />
                <span className="text-xs text-slate-400">Partial (40-70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-500" />
                <span className="text-xs text-slate-400">Weak (20-40%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-rose-500" />
                <span className="text-xs text-slate-400">No Match (&lt;20%)</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Cell Detail Panel */}
        <div className="bg-slate-950/50 rounded-lg border border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Cell Details</span>
          </div>
          
          {hoveredCell && hoveredValue !== null ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div 
                className="p-3 rounded-lg text-center"
                style={{ 
                  backgroundColor: `${getCellColor(hoveredValue).bg}20`,
                  border: `1px solid ${getCellColor(hoveredValue).bg}40`
                }}
              >
                <p className="text-3xl font-bold font-mono" style={{ color: getCellColor(hoveredValue).bg }}>
                  {(hoveredValue * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400 mt-1">{getCellLabel(hoveredValue)}</p>
              </div>
              
              {hoveredClaim && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">AI Claim</p>
                  <p className="text-sm text-slate-300 line-clamp-3">{hoveredClaim.text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span 
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ 
                        backgroundColor: `${getCellColor(hoveredClaim.confidence).bg}20`,
                        color: getCellColor(hoveredClaim.confidence).bg
                      }}
                    >
                      {hoveredClaim.type}
                    </span>
                  </div>
                </div>
              )}
              
              {hoveredSource && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Source Segment</p>
                  <p className="text-sm text-slate-300 line-clamp-3">{hoveredSource.text}</p>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Grid3X3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Hover over a cell to see details</p>
              <p className="text-xs mt-1 opacity-60">
                The heatmap shows how well each AI claim aligns with source segments
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Interpretation Guide */}
      <div className="mt-6 pt-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">How to Read This Heatmap</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
            <p className="text-slate-400">
              <span className="text-emerald-400 font-medium">Dark Green cells</span> indicate strong entailment - the AI claim is directly supported by the source.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
            <p className="text-slate-400">
              <span className="text-rose-400 font-medium">Red cells</span> show no alignment - the AI claim has no support in the source (potential hallucination).
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
            <p className="text-slate-400">
              <span className="text-amber-400 font-medium">Yellow cells</span> indicate partial matches - the claim may be extrapolated or paraphrased.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
