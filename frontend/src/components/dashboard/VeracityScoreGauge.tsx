import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import type { AnalysisResult } from '@/types/dashboard';
import { getRiskColor, getRiskLabel } from '@/data/mockAnalysis';

interface VeracityScoreGaugeProps {
  analysis: AnalysisResult;
}

export function VeracityScoreGauge({ analysis }: VeracityScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedRisk, setAnimatedRisk] = useState(0);
  
  const { trustScore, riskIndex, verdict, processingTime, modelUsed } = analysis;
  
  useEffect(() => {
    const scoreTimer = setTimeout(() => {
      const interval = setInterval(() => {
        setAnimatedScore(prev => {
          if (prev >= trustScore) {
            clearInterval(interval);
            return trustScore;
          }
          return prev + 1;
        });
      }, 20);
      return () => clearInterval(interval);
    }, 300);
    
    const riskTimer = setTimeout(() => {
      const interval = setInterval(() => {
        setAnimatedRisk(prev => {
          if (prev >= riskIndex) {
            clearInterval(interval);
            return riskIndex;
          }
          return prev + 1;
        });
      }, 15);
      return () => clearInterval(interval);
    }, 600);
    
    return () => {
      clearTimeout(scoreTimer);
      clearTimeout(riskTimer);
    };
  }, [trustScore, riskIndex]);
  
  const circumference = 2 * Math.PI * 80;
  const scoreStrokeDashoffset = circumference - (animatedScore / 100) * circumference;
  const riskStrokeDashoffset = circumference - (animatedRisk / 100) * circumference;
  
  const getVerdictIcon = () => {
    switch (verdict) {
      case 'FAITHFUL':
        return <ShieldCheck className="w-8 h-8 text-emerald-400" />;
      case 'HALLUCINATED':
        return <ShieldX className="w-8 h-8 text-rose-500" />;
      case 'PARTIAL':
        return <ShieldAlert className="w-8 h-8 text-amber-500" />;
      default:
        return <Shield className="w-8 h-8 text-slate-400" />;
    }
  };
  
  const getVerdictColor = () => {
    switch (verdict) {
      case 'FAITHFUL':
        return 'text-emerald-400';
      case 'HALLUCINATED':
        return 'text-rose-500';
      case 'PARTIAL':
        return 'text-amber-500';
      default:
        return 'text-slate-400';
    }
  };
  
  const getVerdictBg = () => {
    switch (verdict) {
      case 'FAITHFUL':
        return 'bg-emerald-500/10 border-emerald-500/30';
      case 'HALLUCINATED':
        return 'bg-rose-500/10 border-rose-500/30';
      case 'PARTIAL':
        return 'bg-amber-500/10 border-amber-500/30';
      default:
        return 'bg-slate-500/10 border-slate-500/30';
    }
  };
  
  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-emerald-500/10">
          <Shield className="w-5 h-5 text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-100">SachAI Trust Analysis</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Trust Score Gauge */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <svg width="200" height="200" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="hsl(222 47% 15%)"
                strokeWidth="12"
              />
              {/* Progress circle */}
              <motion.circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="url(#trustGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={scoreStrokeDashoffset}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: scoreStrokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold font-mono text-slate-100">
                {animatedScore}
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Trust Score</span>
            </div>
          </div>
          
          <motion.div 
            className={`mt-4 px-4 py-2 rounded-lg border ${getVerdictBg()} flex items-center gap-2`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            {getVerdictIcon()}
            <span className={`font-semibold ${getVerdictColor()}`}>{verdict}</span>
          </motion.div>
        </div>
        
        {/* Risk Index Gauge */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <svg width="200" height="200" className="transform -rotate-90">
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="hsl(222 47% 15%)"
                strokeWidth="12"
              />
              <motion.circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={getRiskColor(animatedRisk)}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={riskStrokeDashoffset}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: riskStrokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold font-mono text-slate-100">
                {animatedRisk}
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Risk Index</span>
            </div>
          </div>
          
          <motion.div 
            className="mt-4 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <span 
              className="font-semibold font-mono"
              style={{ color: getRiskColor(animatedRisk) }}
            >
              {getRiskLabel(animatedRisk)} RISK
            </span>
          </motion.div>
        </div>
      </div>
      
      {/* Analysis Metadata */}
      <motion.div 
        className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Processing Time</p>
          <p className="text-sm font-mono text-slate-300">{processingTime}s</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">NLI Model</p>
          <p className="text-sm font-mono text-slate-300 truncate" title={modelUsed}>
            {modelUsed.split('/').pop()}
          </p>
        </div>
      </motion.div>
      
      {/* Legend */}
      <motion.div 
        className="mt-4 pt-4 border-t border-slate-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        <p className="text-xs text-slate-500 mb-2">Risk Index Scale</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Low (0-40)</span>
          <span>Medium (40-60)</span>
          <span>High (60-80)</span>
          <span>Critical (80+)</span>
        </div>
      </motion.div>
    </div>
  );
}
