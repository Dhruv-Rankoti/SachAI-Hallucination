import { motion } from 'framer-motion';
import { Shield, Sparkles, Github, ExternalLink } from 'lucide-react';

export function DashboardHeader() {
  return (
    <header className="relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Logo & Title */}
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/30 rounded-xl blur-lg" />
              <div className="relative p-3 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">SachAI</h1>
                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                  BETA
                </span>
              </div>
              <p className="text-sm text-slate-400">Forensic Hallucination Detection</p>
            </div>
          </motion.div>
          
          {/* Tagline */}
          <motion.div 
            className="flex items-center gap-2 text-slate-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm italic">"Sach means Truth. We are the Truth-Layer for the AI era."</span>
          </motion.div>
          
          {/* Actions */}
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <a 
              href="https://github.com/RUCAIBox/HaluEval" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>HaluEval</span>
            </a>
            <a 
              href="#" 
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-sm text-emerald-400 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Documentation</span>
            </a>
          </motion.div>
        </div>
        
        {/* Stats Bar */}
        <motion.div 
          className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {[
            { label: 'Claims Analyzed', value: '6', color: 'text-emerald-400' },
            { label: 'NLI Model', value: 'DeBERTa-v3', color: 'text-cyan-400' },
            { label: 'Processing', value: '< 2s', color: 'text-amber-400' },
            { label: 'Accuracy', value: '94.2%', color: 'text-violet-400' },
          ].map((stat) => (
            <div 
              key={stat.label}
              className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-center"
            >
              <p className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </header>
  );
}
