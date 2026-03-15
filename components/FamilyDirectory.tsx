
import React, { useMemo, useState } from 'react';
import { Users, Wallet, TrendingUp, TrendingDown, ArrowRight, ShieldCheck, CreditCard, Plus, X } from 'lucide-react';
import { Transaction, TransactionType, StatementFile, Category, FamilyMember } from '../types';

interface FamilyDirectoryProps {
  transactions: Transaction[];
  statements: StatementFile[];
  familyMembers: FamilyMember[];
  onAddMember: (name: string) => void;
  onViewTransactions: (person: string) => void;
}

const formatIndianNumber = (num: number) => {
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (absNum >= 10000000) return sign + (absNum / 10000000).toFixed(2) + ' Cr';
  if (absNum >= 100000) return sign + (absNum / 100000).toFixed(2) + ' L';
  return sign + absNum.toLocaleString('en-IN');
};

const formatCurrency = (amount: number, currency: string = 'USD') => {
  if (currency.toUpperCase() === 'INR') {
    return '₹' + formatIndianNumber(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const FamilyDirectory: React.FC<FamilyDirectoryProps> = ({ transactions, statements, familyMembers, onAddMember, onViewTransactions }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const familyStats = useMemo(() => {
    const stats: Record<string, {
      displayName: string;
      totalOut: number;
      totalIn: number;
      transactionCount: number;
      statementCount: number;
      primaryCurrency: string;
      sourceFileIds: Set<string>;
      isManual?: boolean;
    }> = {};

    // Add manual members first
    familyMembers.forEach(m => {
      const normalized = m.name.toLowerCase();
      stats[normalized] = {
        displayName: m.name,
        totalOut: 0,
        totalIn: 0,
        transactionCount: 0,
        statementCount: 0,
        primaryCurrency: 'USD',
        sourceFileIds: new Set(),
        isManual: true
      };
    });

    // Identify inter-family transfers: same date, same amount, opposite types, different persons
    const interFamilyTransferIds = new Set<string>();
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      const key = `${t.date}_${t.amount}_${t.currency}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    Object.values(groups).forEach(group => {
      if (group.length < 2) return;
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const t1 = group[i];
          const t2 = group[j];
          if (t1.type !== t2.type && t1.person !== t2.person) {
            interFamilyTransferIds.add(t1.id);
            interFamilyTransferIds.add(t2.id);
          }
        }
      }
    });

    transactions.forEach(t => {
      const rawName = (t.person || 'Unknown').replace(/\s+/g, ' ').trim();
      const normalizedName = rawName.toLowerCase();
      
      if (normalizedName === 'icici') return;
      
      if (!stats[normalizedName]) {
        stats[normalizedName] = { 
          displayName: rawName, // Keep original casing of first occurrence
          totalOut: 0, 
          totalIn: 0, 
          transactionCount: 0, 
          statementCount: 0, 
          primaryCurrency: t.currency || 'USD',
          sourceFileIds: new Set<string>()
        };
      }
      
      const s = stats[normalizedName];
      // Exclude both self-transfers AND inter-family transfers from earnings/expenses
      if (t.category !== Category.SELF_TRANSFER && !interFamilyTransferIds.has(t.id)) {
        if (t.type === TransactionType.EXPENSE) s.totalOut += t.amount;
        else s.totalIn += t.amount;
      }
      s.transactionCount++;
      if (t.sourceFileId) s.sourceFileIds.add(t.sourceFileId);
    });

    // Finalize counts
    Object.keys(stats).forEach(key => {
      stats[key].statementCount = stats[key].sourceFileIds.size;
    });

    return Object.entries(stats).sort((a, b) => b[1].totalOut - a[1].totalOut);
  }, [transactions, familyMembers]);

  const totalFamilySpend = useMemo(() => 
    familyStats.reduce((acc, [_, s]) => acc + s.totalOut, 0), 
  [familyStats]);

  const handleAdd = () => {
    if (newName.trim()) {
      onAddMember(newName.trim());
      setNewName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Family Directory</h2>
          <p className="text-slate-500">Profiles identified from statements or added manually.</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdding ? (
            <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in zoom-in duration-200">
              <input 
                type="text" 
                autoFocus
                placeholder="Member Name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="px-4 py-2 bg-transparent border-none focus:ring-0 text-sm font-bold w-40"
              />
              <button 
                onClick={handleAdd}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
              </button>
              <button 
                onClick={() => setIsAdding(false)}
                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              <Plus size={20} /> Add Member
            </button>
          )}
          <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 flex items-center gap-3">
            <Users className="text-blue-600" size={20} />
            <span className="text-blue-700 font-bold">{familyStats.length} Members Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {familyStats.map(([key, stats]) => {
          const name = stats.displayName;
          const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
          const spendPercentage = totalFamilySpend > 0 ? (stats.totalOut / totalFamilySpend) * 100 : 0;

          return (
            <div key={key} className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-100">
                  {initials}
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</div>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck size={10} /> VERIFIED
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-1">{name}</h3>
              <p className="text-sm text-slate-400 mb-6 flex items-center gap-2">
                <CreditCard size={14} /> {stats.statementCount} Linked Statements
              </p>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    <TrendingDown size={14} className="text-rose-500" />
                    <span className="text-xs font-medium">Monthly Expenses</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(stats.totalOut, stats.primaryCurrency)}</span>
                    {stats.totalIn > 0 && (
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                        {((stats.totalOut / stats.totalIn) * 100).toFixed(0)}% of earnings
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    <TrendingUp size={14} className="text-emerald-500" />
                    <span className="text-xs font-medium">Monthly Earnings</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(stats.totalIn, stats.primaryCurrency)}</span>
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  <span>Household Contribution</span>
                  <span>{spendPercentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${spendPercentage}%` }}
                  />
                </div>
              </div>

              <button 
                onClick={() => onViewTransactions(name)}
                className="w-full py-3 px-4 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-600 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:shadow-inner"
              >
                View Activity <ArrowRight size={16} />
              </button>
            </div>
          );
        })}

        {familyStats.length === 0 && (
          <div className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-20 flex flex-col items-center justify-center text-center">
            <Users size={48} className="text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-900">No Members Found</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Upload bank statements to automatically discover family members and build your directory.</p>
          </div>
        )}
      </div>
    </div>
  );
};
