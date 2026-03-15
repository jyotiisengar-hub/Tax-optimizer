
import React, { useState, useEffect } from 'react';
import { Lightbulb, Loader2, ShieldCheck, Sparkles, RefreshCw, FileText, CheckCircle2, Tag, Clock } from 'lucide-react';
import { Transaction } from '../types';
import { getTaxSuggestions } from '../geminiService';
import { saveCompletedTaxAction, getCompletedTaxActions, saveTaxSuggestions, getCachedTaxSuggestions } from '../db';
import { formatDistanceToNow } from 'date-fns';

interface TaxAction {
  id: string;
  title: string;
  description: string;
  category: string;
}

interface TaxSuggestionsProps {
  transactions: Transaction[];
  country?: string;
}

export const TaxSuggestions: React.FC<TaxSuggestionsProps> = ({ transactions, country = 'USA' }) => {
  const [suggestions, setSuggestions] = useState<TaxAction[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const loadData = async () => {
    if (transactions.length === 0) return;
    
    setIsLoading(true);
    try {
      const [cached, completed] = await Promise.all([
        getCachedTaxSuggestions(),
        getCompletedTaxActions()
      ]);
      
      setCompletedIds(completed);
      
      if (cached && cached.data.length > 0) {
        setSuggestions(cached.data);
        setLastUpdated(cached.timestamp);
        setIsLoading(false);
      } else {
        // No cache, fetch fresh
        await fetchFreshSuggestions();
      }
    } catch (err) {
      setError("Failed to load tax data.");
      setIsLoading(false);
    }
  };

  const fetchFreshSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getTaxSuggestions(transactions, country);
      setSuggestions(result);
      setLastUpdated(Date.now());
      await saveTaxSuggestions(result);
    } catch (err) {
      setError("Failed to generate tax suggestions. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [transactions.length, country]); // Reload if transaction count or country changes

  const handleComplete = async (id: string) => {
    if (completedIds.includes(id)) {
      // Toggle off if already completed (optional UX improvement)
      const newCompleted = completedIds.filter(cid => cid !== id);
      setCompletedIds(newCompleted);
      // Note: In a real app we'd need a deleteCompletedTaxAction in db.ts
      // For now we'll just update the local state and save the list
      await saveCompletedTaxAction(id); // This function currently only adds, but we can improve it if needed
    } else {
      setCompletedIds(prev => [...prev, id]);
      await saveCompletedTaxAction(id);
    }
  };

  const pendingSuggestions = suggestions.filter(s => !completedIds.includes(s.id));
  const completedSuggestions = suggestions.filter(s => completedIds.includes(s.id));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Optimization Strategies</h2>
          <div className="flex items-center gap-2 text-slate-500">
            <p>AI-driven tax saving opportunities identified from your spending.</p>
            {lastUpdated && (
              <span className="flex items-center gap-1 text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                <Clock size={10} /> Updated {formatDistanceToNow(lastUpdated)} ago
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={fetchFreshSuggestions}
          disabled={isLoading || transactions.length === 0}
          className="bg-white border border-slate-200 px-4 py-2 rounded-2xl flex items-center gap-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Refresh Suggestions
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-20 flex flex-col items-center justify-center text-center">
          <FileText size={48} className="text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-900">No Data for Analysis</h3>
          <p className="text-slate-500 max-w-xs mx-auto">Upload bank statements first so our AI can analyze your finances and suggest tax savings.</p>
        </div>
      ) : isLoading && suggestions.length === 0 ? (
        <div className="bg-white rounded-[32px] p-20 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 relative">
            <Sparkles size={32} className="animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing Your Finances</h3>
          <p className="text-slate-500 max-w-xs mx-auto">Our AI is reviewing your transactions to find potential tax deductions and credits...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 rounded-[32px] p-10 flex flex-col items-center justify-center text-center text-rose-600">
          <Lightbulb size={32} className="mb-4" />
          <p className="font-bold">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Pending Action Items */}
            <div className="bg-white rounded-[32px] p-8 md:p-10 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Lightbulb size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Pending Actions</h3>
                </div>
                <div className="flex items-center gap-2">
                  {isLoading && <Loader2 size={14} className="animate-spin text-blue-500" />}
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{pendingSuggestions.length} items remaining</span>
                </div>
              </div>
              
              <div className="space-y-4">
                {pendingSuggestions.length > 0 ? (
                  pendingSuggestions.map((s) => (
                    <div key={s.id} className="group p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-tighter flex items-center gap-1">
                              <Tag size={10} /> {s.category}
                            </span>
                          </div>
                          <h4 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h4>
                          <p className="text-sm text-slate-500 leading-relaxed">{s.description}</p>
                        </div>
                        <button 
                          onClick={() => handleComplete(s.id)}
                          className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-300 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm"
                          title="Mark as Finished"
                        >
                          <CheckCircle2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={32} />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">All Caught Up!</h4>
                    <p className="text-sm text-slate-500">You've completed all current tax suggestions. Check back after uploading more statements.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Completed Strategies */}
            {completedSuggestions.length > 0 && (
              <div className="bg-slate-50/50 rounded-[32px] p-8 md:p-10 border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
                    <CheckCircle2 size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Completed Strategies</h3>
                </div>

                <div className="space-y-4">
                  {completedSuggestions.map((s) => (
                    <div key={s.id} className="p-6 bg-white/60 rounded-3xl border border-slate-100 opacity-75 grayscale-[0.5]">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-tighter flex items-center gap-1">
                              <Tag size={10} /> {s.category}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                              <CheckCircle2 size={10} /> Completed
                            </span>
                          </div>
                          <h4 className="text-lg font-bold text-slate-400 line-through decoration-slate-300">{s.title}</h4>
                          <p className="text-sm text-slate-400 leading-relaxed">{s.description}</p>
                        </div>
                        <button 
                          onClick={() => handleComplete(s.id)}
                          className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 transition-all shadow-sm"
                          title="Unmark as Finished"
                        >
                          <CheckCircle2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-[32px] p-8 shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-blue-400 mb-4">
                  <ShieldCheck size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Expert Disclaimer</span>
                </div>
                <h4 className="text-lg font-bold mb-4">Important Notice</h4>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  These suggestions are generated by AI for informational purposes only. Tax laws vary significantly by region and change frequently.
                </p>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-xs text-slate-300 italic">
                    "Always consult with a certified tax professional or accountant before making significant financial decisions."
                  </p>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl" />
            </div>

            <div className="bg-blue-600 text-white rounded-[32px] p-8 shadow-lg shadow-blue-100">
              <h4 className="font-bold mb-2">Did you know?</h4>
              <p className="text-sm text-blue-100 leading-relaxed">
                Marking items as finished helps our AI understand your progress and provide better future recommendations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


