import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Target, 
  AlertCircle, 
  Lightbulb,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, BehavioralProfile } from '../types';
import { getBehavioralProfile } from '../geminiService';

interface BehavioralIntelligenceProps {
  transactions: Transaction[];
  profile?: BehavioralProfile | null;
}

export const BehavioralIntelligence: React.FC<BehavioralIntelligenceProps> = ({ transactions, profile: initialProfile }) => {
  const [profile, setProfile] = useState<BehavioralProfile | null>(initialProfile || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRadar, setShowRadar] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [expandedArchetype, setExpandedArchetype] = useState<string | null>(null);

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
    }
  }, [initialProfile]);

  const fetchProfile = async () => {
    if (transactions.length === 0 || initialProfile) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getBehavioralProfile(transactions);
      if (result) {
        setProfile(result);
      } else {
        setError("Failed to generate behavioral profile.");
      }
    } catch (err) {
      setError("An error occurred while analyzing behavioral patterns.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [transactions.length]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-[32px] p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
        </div>
        <p className="mt-6 text-slate-500 font-medium animate-pulse text-center max-w-xs">
          Our behavioral finance AI is analyzing your transaction patterns across 14 financial archetypes...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-[32px] p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="text-rose-500 mb-4" size={48} />
        <p className="text-slate-900 font-bold text-lg">{error}</p>
        <button 
          onClick={fetchProfile}
          className="mt-6 flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
        >
          <RefreshCw size={18} /> Retry Analysis
        </button>
      </div>
    );
  }

  if (!profile) return null;

  const radarData = profile.archetypes.map(a => ({
    subject: a.archetype,
    score: a.score,
    fullMark: 100
  }));

  const renderPolarAngleAxis = ({ payload, x, y, cx, cy, verticalAnchor, index, visible, orientation, ...rest }: any) => {
    const data = radarData.find(d => d.subject === payload.value);
    const isTop = data && data.score > 60;
    
    return (
      <text
        {...rest}
        dominantBaseline="central"
        y={y + (y > cy ? 10 : -10)}
        x={x}
        fill={isTop ? "#2563eb" : "#64748b"}
        fontSize={isTop ? 11 : 9}
        fontWeight={isTop ? 900 : 600}
        textAnchor={x > cx ? 'start' : x < cx ? 'end' : 'middle'}
        className="cursor-pointer hover:fill-blue-600 transition-colors"
        onClick={() => setExpandedArchetype(payload.value)}
      >
        <tspan x={x} dy="0">{payload.value}</tspan>
        <tspan x={x} dy="12" fill={isTop ? "#2563eb" : "#94a3b8"} fontSize={10} fontWeight={900}>
          {data ? data.score : ''}
        </tspan>
      </text>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 61) return 'text-orange-600 bg-orange-50 border-orange-100';
    if (score >= 31) return 'text-blue-600 bg-blue-50 border-blue-100';
    return 'text-blue-300 bg-blue-50/30 border-blue-50';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 61) return 'Strong Pattern';
    if (score >= 31) return 'Moderate Tendency';
    return 'Weak Presence';
  };

  return (
    <div className="space-y-8">
      {/* Narrative Section */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <Brain size={24} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-[0.2em]">Financial Personality</h2>
            <h3 className="text-2xl font-black text-slate-900">Behavioral Intelligence Report</h3>
          </div>
        </div>
        
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-blue-600" />
            <span className="text-xs font-black uppercase tracking-widest text-blue-600">AI Narrative</span>
          </div>
          <p className="text-lg font-medium text-slate-800 leading-relaxed italic">
            "{profile.narrative}"
          </p>
        </div>
      </div>

      {/* Radar Chart Section */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <button 
          onClick={() => setShowRadar(!showRadar)}
          className="w-full flex items-center justify-between p-8 hover:bg-slate-50 transition-all text-left group"
        >
          <div className="flex items-center gap-2">
            <Target size={18} className="text-blue-600 group-hover:scale-110 transition-transform" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Archetype Mapping</h3>
          </div>
          <div className="text-slate-400">
            {showRadar ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        <AnimatePresence>
          {showRadar && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-8 pb-8"
            >
              <div className="w-full h-[500px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={renderPolarAngleAxis} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#2563eb"
                      fill="#2563eb"
                      fillOpacity={0.2}
                      animationDuration={1500}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Strong (61-100)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Moderate (31-60)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-200" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Weak (0-30)</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detailed Archetypes Grid */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between p-8 hover:bg-slate-50 transition-all text-left group"
        >
          <div className="flex items-center gap-2">
            <Info size={18} className="text-blue-600 group-hover:scale-110 transition-transform" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Detailed Archetype Analysis</h3>
          </div>
          <div className="text-slate-400">
            {showDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-8 pb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {profile.archetypes.sort((a, b) => b.score - a.score).map((a, i) => (
                  <motion.div 
                    key={a.archetype}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group ${expandedArchetype === a.archetype ? 'ring-2 ring-blue-500 border-transparent' : 'border-slate-100'}`}
                    onClick={() => setExpandedArchetype(expandedArchetype === a.archetype ? null : a.archetype)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-black text-slate-900 break-words max-w-[70%]">{a.archetype}</h4>
                      <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getScoreColor(a.score)}`}>
                        {a.score}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${a.score >= 61 ? 'bg-orange-500' : a.score >= 31 ? 'bg-blue-500' : 'bg-blue-200'}`}
                            style={{ width: `${a.score}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{getScoreLabel(a.score)}</span>
                      </div>
                      
                      <p className={`text-sm text-slate-600 leading-relaxed break-words ${expandedArchetype === a.archetype ? '' : 'line-clamp-2'}`}>
                        {a.reasoning}
                      </p>
                      
                      {expandedArchetype !== a.archetype && (
                        <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Read Reasoning <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nudges Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
          <Lightbulb size={18} className="text-amber-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Actionable Behavioral Nudges</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {profile.nudges.map((n, i) => (
            <div key={i} className="bg-amber-50 border border-amber-100 rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all flex flex-col gap-5 group">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200 group-hover:scale-110 transition-transform">
                <Sparkles size={24} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xl font-black text-amber-900 mb-3 break-words">{n.title}</h4>
                <p className="text-base text-amber-800/80 leading-relaxed break-words">{n.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-8 flex justify-center">
        <button 
          onClick={fetchProfile}
          className="flex items-center gap-2 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all text-sm"
        >
          <RefreshCw size={16} /> Re-Analyze Behavior
        </button>
      </div>
    </div>
  );
};
