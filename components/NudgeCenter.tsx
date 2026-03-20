
import React from 'react';
import { Nudge } from '../types';
import { Bell, ArrowRight, Brain, Zap, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NudgeCenterProps {
  nudges: Nudge[];
  onDismiss: (id: string) => void;
  onAction: (nudge: Nudge) => void;
}

export const NudgeCenter: React.FC<NudgeCenterProps> = ({ nudges, onDismiss, onAction }) => {
  const unreadNudges = nudges.filter(n => !n.isRead);

  if (unreadNudges.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell size={18} className="text-blue-600" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Behavioral Nudges</h3>
        </div>
        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
          {unreadNudges.length} New Insights
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {unreadNudges.map((nudge) => (
            <motion.div
              key={nudge.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="group relative bg-white border border-blue-100 rounded-[32px] p-6 shadow-xl shadow-blue-500/5 hover:shadow-blue-500/10 transition-all overflow-hidden"
            >
              {/* Background Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                      {nudge.type === 'salary' ? <Zap size={20} /> : <Brain size={20} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 leading-tight">{nudge.title}</h4>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">
                        {new Date(nudge.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onDismiss(nudge.id)}
                    className="p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {nudge.message}
                </p>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => onAction(nudge)}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group/btn"
                  >
                    {nudge.actionLabel}
                    <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>

                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={14} className="text-blue-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                        Psychology: {nudge.concept}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-800/70 leading-relaxed italic">
                      {nudge.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
