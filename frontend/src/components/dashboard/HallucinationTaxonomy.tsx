import { useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, AlertCircle, CheckCircle, HelpCircle, XCircle } from 'lucide-react';
import type { AnalysisResult } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface HallucinationTaxonomyProps {
  analysis: AnalysisResult;
}

type ChartType = 'pie' | 'bar';

export function HallucinationTaxonomy({ analysis }: HallucinationTaxonomyProps) {
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  
  const { taxonomy, claims } = analysis;
  const totalClaims = claims.length;
  
  const chartData = [
    { 
      name: 'Faithful', 
      value: taxonomy.faithful, 
      color: '#10b981',
      description: 'Claims directly supported by source text'
    },
    { 
      name: 'Extrapolated', 
      value: taxonomy.extrapolated, 
      color: '#f59e0b',
      description: 'Claims inferred or paraphrased from source'
    },
    { 
      name: 'Fabricated', 
      value: taxonomy.fabricated, 
      color: '#ef4444',
      description: 'Claims with no basis in source text'
    },
    { 
      name: 'Contradicted', 
      value: taxonomy.contradicted, 
      color: '#dc2626',
      description: 'Claims that contradict source text'
    },
  ].filter(d => d.value > 0);
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Faithful':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'Extrapolated':
        return <HelpCircle className="w-5 h-5 text-amber-400" />;
      case 'Fabricated':
        return <XCircle className="w-5 h-5 text-rose-400" />;
      case 'Contradicted':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalClaims) * 100).toFixed(1);
      
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="font-medium text-slate-200">{data.name}</p>
          <p className="text-2xl font-bold font-mono" style={{ color: data.color }}>
            {data.value} <span className="text-sm text-slate-400">({percentage}%)</span>
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-[200px]">{data.description}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <BarChart3 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Hallucination Taxonomy</h3>
            <p className="text-xs text-slate-400">Breakdown of claim classifications</p>
          </div>
        </div>
        
        {/* Chart Type Toggle */}
        <div className="flex bg-slate-800/50 rounded-lg p-1">
          <button
            onClick={() => setChartType('pie')}
            className={cn(
              "p-2 rounded-md transition-all",
              chartType === 'pie' ? "bg-slate-700 text-slate-200" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <PieChartIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={cn(
              "p-2 rounded-md transition-all",
              chartType === 'bar' ? "bg-slate-700 text-slate-200" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'pie' ? (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke={hoveredType === entry.name ? '#fff' : 'transparent'}
                      strokeWidth={hoveredType === entry.name ? 2 : 0}
                      onMouseEnter={() => setHoveredType(entry.name)}
                      onMouseLeave={() => setHoveredType(null)}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            ) : (
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 15%)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={90}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  radius={[0, 4, 4, 0]}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Statistics List */}
        <div className="space-y-3">
          {chartData.map((item, idx) => {
            const percentage = ((item.value / totalClaims) * 100).toFixed(1);
            const isHovered = hoveredType === item.name;
            
            return (
              <motion.div
                key={item.name}
                className={cn(
                  "p-3 rounded-lg border transition-all cursor-pointer",
                  isHovered 
                    ? "bg-slate-800 border-slate-600" 
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                )}
                onMouseEnter={() => setHoveredType(item.name)}
                onMouseLeave={() => setHoveredType(null)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-1.5 rounded-md"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      {getTypeIcon(item.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold font-mono" style={{ color: item.color }}>
                      {item.value}
                    </p>
                    <p className="text-xs text-slate-500">{percentage}%</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded-lg bg-slate-900/50">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Total Claims</p>
          <p className="text-2xl font-bold font-mono text-slate-200">{totalClaims}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-slate-900/50">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Faithful Rate</p>
          <p className="text-2xl font-bold font-mono text-emerald-400">
            {((taxonomy.faithful / totalClaims) * 100).toFixed(0)}%
          </p>
        </div>
        <div className="text-center p-3 rounded-lg bg-slate-900/50">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Hallucination Rate</p>
          <p className="text-2xl font-bold font-mono text-rose-400">
            {(((taxonomy.fabricated + taxonomy.contradicted) / totalClaims) * 100).toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
}
