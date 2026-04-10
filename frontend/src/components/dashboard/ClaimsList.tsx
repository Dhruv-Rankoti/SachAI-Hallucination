import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListFilter, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';
import type { Claim, ClaimType } from '@/types/dashboard';
import { getClaimTypeColor, getClaimTypeLabel } from '@/data/mockAnalysis';
import { cn } from '@/lib/utils';

interface ClaimsListProps {
  claims: Claim[];
}

export function ClaimsList({ claims }: ClaimsListProps) {
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);
  const [filter, setFilter] = useState<ClaimType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredClaims = claims.filter(claim => {
    const matchesFilter = filter === 'ALL' || claim.type === filter;
    const matchesSearch = searchTerm === '' || 
      claim.text.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });
  
  const toggleExpand = (claimId: string) => {
    setExpandedClaim(expandedClaim === claimId ? null : claimId);
  };
  
  const filters: { value: ClaimType | 'ALL'; label: string; color: string }[] = [
    { value: 'ALL', label: 'All Claims', color: '#64748b' },
    { value: 'FAITHFUL', label: 'Faithful', color: '#10b981' },
    { value: 'EXTRAPOLATED', label: 'Extrapolated', color: '#f59e0b' },
    { value: 'FABRICATED', label: 'Fabricated', color: '#ef4444' },
    { value: 'CONTRADICTED', label: 'Contradicted', color: '#dc2626' },
  ];
  
  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10">
            <ListFilter className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Claim Analysis</h3>
            <p className="text-xs text-slate-400">Individual claim verification results</p>
          </div>
        </div>
      </div>
      
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search claims..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ClaimType | 'ALL')}
            className="px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-slate-600"
          >
            {filters.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map(f => {
          const count = f.value === 'ALL' 
            ? claims.length 
            : claims.filter(c => c.type === f.value).length;
          const isActive = filter === f.value;
          
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                isActive 
                  ? "text-white" 
                  : "bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              )}
              style={{
                backgroundColor: isActive ? f.color : undefined
              }}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>
      
      {/* Claims List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredClaims.map((claim, idx) => {
            const isExpanded = expandedClaim === claim.id;
            const color = getClaimTypeColor(claim.type);
            
            return (
              <motion.div
                key={claim.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "border rounded-lg overflow-hidden transition-all",
                  isExpanded ? "border-slate-600" : "border-slate-800 hover:border-slate-700"
                )}
              >
                {/* Claim Header */}
                <button
                  onClick={() => toggleExpand(claim.id)}
                  className="w-full p-3 flex items-center gap-3 text-left bg-slate-900/30 hover:bg-slate-900/50 transition-colors"
                >
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-mono text-slate-500 flex-shrink-0">{claim.id}</span>
                  <p className="text-sm text-slate-300 flex-1 line-clamp-1">{claim.text}</p>
                  <span 
                    className="px-2 py-0.5 rounded text-xs font-medium flex-shrink-0"
                    style={{ 
                      backgroundColor: `${color}20`,
                      color: color
                    }}
                  >
                    {getClaimTypeLabel(claim.type)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>
                
                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div 
                        className="p-4 border-t border-slate-800"
                        style={{ backgroundColor: `${color}05` }}
                      >
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Classification</p>
                            <span 
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-sm font-medium"
                              style={{ 
                                backgroundColor: `${color}20`,
                                color: color
                              }}
                            >
                              {getClaimTypeLabel(claim.type)}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Confidence</p>
                            <p className="text-sm font-mono text-slate-300">
                              {(claim.confidence * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">NLI Scores</p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2 rounded bg-slate-900/50">
                              <p className="text-xs text-slate-500">Entailment</p>
                              <p className="text-sm font-mono text-emerald-400">
                                {(claim.nliScores.entailment * 100).toFixed(0)}%
                              </p>
                            </div>
                            <div className="text-center p-2 rounded bg-slate-900/50">
                              <p className="text-xs text-slate-500">Contradiction</p>
                              <p className="text-sm font-mono text-rose-400">
                                {(claim.nliScores.contradiction * 100).toFixed(0)}%
                              </p>
                            </div>
                            <div className="text-center p-2 rounded bg-slate-900/50">
                              <p className="text-xs text-slate-500">Neutral</p>
                              <p className="text-sm font-mono text-amber-400">
                                {(claim.nliScores.neutral * 100).toFixed(0)}%
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {claim.sourceRef && (
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Source Reference</p>
                            <p className="text-sm font-mono text-emerald-400">{claim.sourceRef}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filteredClaims.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <p>No claims match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
