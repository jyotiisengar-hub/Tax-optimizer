
import React from 'react';
import { Category, MerchantRule } from '../types';
import { Palette, Sparkles, Trash2, Check, RotateCcw, ChevronRight } from 'lucide-react';

interface CategoryManagerProps {
  colors: Record<string, string>;
  onUpdateColor: (category: string, color: string) => void;
  rules: MerchantRule[];
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ colors, onUpdateColor, rules }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Color Customization */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Palette size={24} /></div>
            <div><h3 className="text-xl font-bold">Category Visuals</h3><p className="text-sm text-slate-500">Customize how your spending charts look.</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(Category).map((cat) => (
              <div key={cat} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: colors[cat] }} />
                  <span className="text-sm font-bold text-slate-700">{cat}</span>
                </div>
                <input 
                  type="color" 
                  value={colors[cat] || '#71717a'} 
                  onChange={(e) => onUpdateColor(cat, e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Learning Rules */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><Sparkles size={24} /></div>
            <div><h3 className="text-xl font-bold">Learned Rules</h3><p className="text-sm text-slate-500">Merchants linked to specific categories.</p></div>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {rules.length === 0 && (
              <div className="py-20 text-center text-slate-400">
                Change a transaction's category to start training the tracker.
              </div>
            )}
            {rules.map((rule) => (
              <div key={rule.merchant} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">{rule.merchant}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    ALWAYS MAPS TO <ChevronRight size={10} />
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-white text-[10px] font-bold text-blue-600 border border-slate-100 shadow-sm">
                    {rule.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
