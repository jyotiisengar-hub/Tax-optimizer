
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { formatCurrency } from '../lib/currencyUtils';
import { Transaction, TransactionType, Category } from '../types';
import { format, parseISO } from 'date-fns';
import { Search, AlertTriangle, CheckCircle, ArrowDown, Calendar, RefreshCcw, X, Edit3, ChevronDown, Check, TrendingDown } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onUpdateCategory: (id: string, newCategory: Category) => void;
  initialMonthFilter?: string | null;
  initialPersonSearch?: string | null;
}


export const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  onUpdateCategory, 
  initialMonthFilter,
  initialPersonSearch 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [monthFilter, setMonthFilter] = useState<string | 'All'>('All');
  const [currencyFilter, setCurrencyFilter] = useState<string | 'All'>('All');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Available currencies from current transactions
  const availableCurrencies = useMemo(() => {
    return Array.from(new Set(transactions.map(t => (t.currency || 'USD').toUpperCase().trim()))).sort();
  }, [transactions]);

  // Available months from current transactions
  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(transactions.map(t => {
      try {
        return format(parseISO(t.date), 'MMMM yyyy');
      } catch (e) {
        return 'Invalid Date';
      }
    }))) as string[];
    return months
      .filter(m => m !== 'Invalid Date')
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [transactions]);

  // Handle incoming filters from Dashboard or Directory
  useEffect(() => {
    if (initialMonthFilter) {
      setMonthFilter(initialMonthFilter);
      setSortBy('amount'); 
    } else {
      setMonthFilter('All');
      setSortBy('date');
    }

    if (initialPersonSearch) {
      setSearchTerm(initialPersonSearch);
    } else {
      setSearchTerm('');
    }
  }, [initialMonthFilter, initialPersonSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setEditingId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Identify inter-family transfers
  const interFamilyTransferIds = useMemo(() => {
    const ids = new Set<string>();
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
            ids.add(t1.id);
            ids.add(t2.id);
          }
        }
      }
    });
    return ids;
  }, [transactions]);

  const filtered = transactions.filter(t => {
    const matchesSearch = t.merchant.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.person.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
    const matchesMonth = monthFilter === 'All' || format(parseISO(t.date), 'MMMM yyyy') === monthFilter;
    const matchesCurrency = currencyFilter === 'All' || (t.currency || 'USD').toUpperCase().trim() === currencyFilter;
    return matchesSearch && matchesCategory && matchesMonth && matchesCurrency;
  }).sort((a, b) => {
    if (sortBy === 'amount') {
      return b.amount - a.amount; 
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const handleCategorySelect = (id: string, cat: Category) => {
    onUpdateCategory(id, cat);
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold">Records</h3>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-2 hover:bg-blue-100 transition-colors"
            >
              FILTER: {searchTerm} <X size={10} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 w-full md:w-40 text-sm"
            />
          </div>
          
          <select 
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
          >
            <option value="All">All Months</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>

          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
          >
            <option value="All">All Categories</option>
            {Object.values(Category).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {availableCurrencies.length > 1 && (
            <select 
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="All">All Currencies</option>
              {availableCurrencies.map(cur => (
                <option key={cur} value={cur}>{cur}</option>
              ))}
            </select>
          )}

          <button 
            onClick={() => setSortBy(sortBy === 'date' ? 'amount' : 'date')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${sortBy === 'amount' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {sortBy === 'amount' ? <ArrowDown size={16} /> : <Calendar size={16} />}
            {sortBy === 'amount' ? 'Highest Spend' : 'Latest Date'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/30 transition-colors group">
                <td className="px-6 py-4 text-xs font-medium text-slate-500">
                  {format(parseISO(t.date), 'dd MMM yyyy')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      {t.merchant}
                      {t.isDuplicate && (
                        <span title="Possible Duplicate">
                          <AlertTriangle size={12} className="text-amber-500" />
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter truncate max-w-[150px]">{t.person}</span>
                  </div>
                </td>
                <td className="px-6 py-4 relative">
                  <button 
                    onClick={() => setEditingId(editingId === t.id ? null : t.id)}
                    className={`group/btn px-3 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 transition-all ${
                      t.category === Category.SELF_TRANSFER 
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.category}
                    <ChevronDown size={10} className={`transition-transform ${editingId === t.id ? 'rotate-180' : ''}`} />
                  </button>

                  {editingId === t.id && (
                    <div 
                      ref={dropdownRef}
                      className="absolute z-50 mt-2 left-6 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in fade-in zoom-in duration-200"
                    >
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {Object.values(Category).map((cat) => (
                          <button
                            key={cat}
                            onClick={() => handleCategorySelect(t.id, cat)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-colors flex items-center justify-between ${
                              t.category === cat 
                                ? 'bg-blue-50 text-blue-600' 
                                : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            {cat}
                            {t.category === cat && <Check size={12} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </td>
                <td className={`px-6 py-4 text-right font-bold font-mono ${
                  t.category === Category.SELF_TRANSFER || interFamilyTransferIds.has(t.id) 
                    ? 'text-slate-900' 
                    : t.type === TransactionType.INCOME 
                      ? 'text-emerald-600' 
                      : 'text-rose-600'
                }`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(t.amount, t.currency)}
                </td>
                <td className="px-6 py-4">
                  {t.category === Category.SELF_TRANSFER || interFamilyTransferIds.has(t.id) ? (
                     <span className="text-blue-500 text-[10px] font-bold flex items-center gap-1">
                      <RefreshCcw size={10} /> TRANSFER
                    </span>
                  ) : t.type === TransactionType.INCOME ? (
                    <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle size={10} /> EARNINGS
                    </span>
                  ) : (
                    <span className="text-rose-600 text-[10px] font-bold flex items-center gap-1">
                      <TrendingDown size={10} /> EXPENSES
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => setEditingId(editingId === t.id ? null : t.id)}
                    className={`p-2 rounded-xl transition-all ${editingId === t.id ? 'bg-blue-50 text-blue-600' : 'text-slate-300 hover:text-blue-500 hover:bg-slate-50'}`}
                    title="Change Category"
                  >
                    <Edit3 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-20 text-center text-slate-400 font-medium">
            No records found for the current filters.
          </div>
        )}
      </div>
    </div>
  );
};
