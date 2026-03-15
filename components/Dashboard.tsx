
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line 
} from 'recharts';
import { Transaction, TransactionType, Category } from '../types';
import { format, parseISO } from 'date-fns';
import { TrendingDown, TrendingUp, Wallet, Calendar, ChevronRight, Calculator, ShieldCheck, Info } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  categoryColors: Record<string, string>;
  onMonthClick?: (month: string) => void;
}

interface CurrencyStats {
  totalIn: number;
  totalOut: number;
  totalTax: number;
  totalSelf: number;
  balance: number;
  duplicates: number;
}

const formatIndianNumber = (num: number) => {
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (absNum >= 10000000) return sign + (absNum / 10000000).toFixed(2) + ' Cr';
  if (absNum >= 100000) return sign + (absNum / 100000).toFixed(2) + ' L';
  return sign + absNum.toLocaleString('en-IN');
};

const formatCurrency = (amount: number, currency: string) => {
  if (currency.toUpperCase() === 'INR') {
    return '₹' + formatIndianNumber(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const Dashboard: React.FC<DashboardProps> = ({ transactions, categoryColors, onMonthClick }) => {
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

  const statsByCurrency = useMemo(() => {
    const map: Record<string, CurrencyStats> = {};
    transactions.forEach(t => {
      const cur = t.currency || 'USD';
      if (!map[cur]) map[cur] = { totalIn: 0, totalOut: 0, totalTax: 0, totalSelf: 0, balance: 0, duplicates: 0 };
      
      const isSelfTransfer = t.category === Category.SELF_TRANSFER;
      const isInterFamilyTransfer = interFamilyTransferIds.has(t.id);

      if (isSelfTransfer || isInterFamilyTransfer) {
        map[cur].totalSelf += t.amount;
      } else {
        if (t.type === TransactionType.INCOME) {
          map[cur].totalIn += t.amount;
        } else {
          if (t.category === Category.TAX) {
            map[cur].totalTax += t.amount;
          } else {
            map[cur].totalOut += t.amount;
          }
        }
      }
      if (t.isDuplicate) map[cur].duplicates += 1;
    });
    Object.keys(map).forEach(cur => { 
      map[cur].balance = map[cur].totalIn - map[cur].totalOut - map[cur].totalTax; 
    });
    return map;
  }, [transactions, interFamilyTransferIds]);

  const categoryData = useMemo(() => {
    const groups: Record<string, number> = {};
    transactions
      .filter(t => t.type === TransactionType.EXPENSE && t.category !== Category.SELF_TRANSFER && !interFamilyTransferIds.has(t.id))
      .forEach(t => {
        groups[t.category] = (groups[t.category] || 0) + t.amount;
      });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [transactions, interFamilyTransferIds]);

  const monthlySummary = useMemo(() => {
    const months: Record<string, Record<string, { in: number, out: number, tax: number, self: number }>> = {};
    transactions
      .forEach(t => {
        const month = format(parseISO(t.date), 'MMMM yyyy');
        const cur = t.currency || 'USD';
        const isSelfTransfer = t.category.toLowerCase().trim() === Category.SELF_TRANSFER.toLowerCase().trim();
        const isInterFamilyTransfer = interFamilyTransferIds.has(t.id);
        
        if (!months[month]) months[month] = {};
        if (!months[month][cur]) months[month][cur] = { in: 0, out: 0, tax: 0, self: 0 };
        
        if (isSelfTransfer || isInterFamilyTransfer) {
          months[month][cur].self += t.amount;
        } else {
          if (t.type === TransactionType.INCOME) {
            months[month][cur].in += t.amount;
          } else {
            if (t.category === Category.TAX) {
              months[month][cur].tax += t.amount;
            } else {
              months[month][cur].out += t.amount;
            }
          }
        }
      });
    return Object.entries(months).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [transactions, interFamilyTransferIds]);

  const chartData = useMemo(() => {
    const groups: Record<string, { month: string, expense: number, inflow: number }> = {};
    transactions
      .filter(t => t.category.toLowerCase().trim() !== Category.SELF_TRANSFER.toLowerCase().trim() && !interFamilyTransferIds.has(t.id))
      .forEach(t => {
        const month = format(parseISO(t.date), 'MMM yy');
        if (!groups[month]) groups[month] = { month, expense: 0, inflow: 0 };
        if (t.type === TransactionType.INCOME) {
          groups[month].inflow += t.amount;
        } else if (t.category !== Category.TAX) {
          // Exclude tax from trend as requested
          groups[month].expense += t.amount;
        }
      });
    return Object.values(groups).sort((a, b) => {
      const [m1, y1] = a.month.split(' ');
      const [m2, y2] = b.month.split(' ');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const dateA = new Date(parseInt(y1) + 2000, months.indexOf(m1));
      const dateB = new Date(parseInt(y2) + 2000, months.indexOf(m2));
      return dateA.getTime() - dateB.getTime();
    });
  }, [transactions]);

  const taxDeductions = useMemo(() => {
    return transactions
      .filter(t => t.category === Category.TAX && t.type === TransactionType.EXPENSE)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const totalDeductions = useMemo(() => {
    const map: Record<string, number> = {};
    taxDeductions.forEach(t => {
      const cur = t.currency || 'USD';
      map[cur] = (map[cur] || 0) + t.amount;
    });
    return map;
  }, [taxDeductions]);

  return (
    <div className="space-y-8">
      {/* Deduction Tracker Dashboard Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full -ml-20 -mb-20 blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold">Tax Deduction Tracker</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Total Identified Deductions</p>
              <div className="flex flex-col gap-1">
                {Object.entries(totalDeductions).length > 0 ? (
                  Object.entries(totalDeductions).map(([cur, amount]) => (
                    <div key={cur} className="text-4xl font-black tracking-tighter">
                      {formatCurrency(amount, cur)}
                    </div>
                  ))
                ) : (
                  <div className="text-4xl font-black tracking-tighter opacity-50">$0</div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Recent Tax Records</p>
              <div className="space-y-2">
                {taxDeductions.slice(0, 2).map(t => (
                  <div key={t.id} className="bg-white/10 backdrop-blur-md p-3 rounded-2xl flex items-center justify-between border border-white/10">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold truncate w-32">{t.merchant}</span>
                      <span className="text-[10px] text-blue-200">{format(parseISO(t.date), 'MMM dd, yyyy')}</span>
                    </div>
                    <span className="font-bold">{formatCurrency(t.amount, t.currency)}</span>
                  </div>
                ))}
                {taxDeductions.length === 0 && (
                  <div className="text-sm text-blue-200 italic">No deductions identified yet.</div>
                )}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 flex flex-col justify-between">
              <div className="flex items-start gap-3">
                <Info size={18} className="text-blue-200 mt-1 shrink-0" />
                <p className="text-sm leading-relaxed text-blue-50">
                  AI has identified <span className="font-bold">{taxDeductions.length}</span> transactions as potential tax deductions. Review them in the Deductions tab.
                </p>
              </div>
              <button 
                onClick={() => onMonthClick?.('deductions')} // Hacky way to trigger tab switch if parent supports it
                className="mt-4 w-full bg-white text-blue-700 py-3 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg"
              >
                View All Deductions
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Tax & Income Summary</h3>
        {Object.entries(statsByCurrency).map(([currency, stats]) => {
          const s = stats as CurrencyStats;
          return (
            <div key={currency} className="grid grid-cols-1 md:grid-cols-6 gap-4 bg-white p-2 rounded-3xl border border-slate-100 shadow-sm">
              <div className="p-4 flex flex-col justify-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Currency</div>
                <div className="text-lg font-bold text-blue-600">{currency}</div>
              </div>
              <div className="p-4 border-l border-slate-50">
                <div className="flex items-center gap-2 text-slate-500 mb-1"><TrendingUp size={14} className="text-emerald-500" /><span className="text-xs font-medium uppercase">Earnings</span></div>
                <div className="text-xl font-bold text-slate-900">{formatCurrency(s.totalIn, currency)}</div>
              </div>
              <div className="p-4 border-l border-slate-50">
                <div className="flex items-center gap-2 text-slate-500 mb-1"><TrendingDown size={14} className="text-rose-500" /><span className="text-xs font-medium uppercase">Expenses</span></div>
                <div className="flex items-baseline gap-2">
                  <div className="text-xl font-bold text-slate-900">{formatCurrency(s.totalOut, currency)}</div>
                </div>
              </div>
              <div className="p-4 border-l border-slate-50">
                <div className="flex items-center gap-2 text-slate-500 mb-1"><Calculator size={14} className="text-amber-500" /><span className="text-xs font-medium uppercase">Tax Paid</span></div>
                <div className="text-xl font-bold text-slate-900">{formatCurrency(s.totalTax, currency)}</div>
              </div>
              <div className="p-4 border-l border-slate-50">
                <div className="flex items-center gap-2 text-slate-500 mb-1"><Wallet size={14} className="text-blue-500" /><span className="text-xs font-medium uppercase">Net Balance</span></div>
                <div className={`text-xl font-bold ${s.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(s.balance, currency)}</div>
              </div>
              <div className="p-4 border-l border-slate-50">
                <div className="flex items-center gap-2 text-slate-500 mb-1"><ChevronRight size={14} className="text-slate-400" /><span className="text-xs font-medium uppercase">Transfers</span></div>
                <div className="text-xl font-bold text-slate-400">{formatCurrency(s.totalSelf, currency)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Cash Flow Trend</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Earnings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Expenses</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 10}} 
                  tickFormatter={formatIndianNumber}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  formatter={(value: number) => [formatIndianNumber(value), '']}
                />
                <Line type="monotone" dataKey="inflow" name="Earnings" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="expense" name="Expenses" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6">Expense by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 10}} 
                  width={100}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  formatter={(value: number) => formatCurrency(value, 'USD')}
                />
                <Bar dataKey="value" name="Amount" radius={[0, 4, 4, 0]} barSize={20}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={categoryColors[entry.name] || '#71717a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3"><Calendar className="text-blue-500" size={20} /><h3 className="text-lg font-bold text-slate-900">Monthly Performance</h3></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Excluding Self Transfers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Month</th>
                <th className="px-6 py-4 text-right text-emerald-600">Earnings</th>
                <th className="px-6 py-4 text-right text-rose-600">Expenses</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {monthlySummary.map(([month, currencies]) => (
                <tr key={month} className="hover:bg-blue-50/40 transition-colors cursor-pointer group" onClick={() => onMonthClick?.(month)}>
                  <td className="px-6 py-4 font-semibold text-slate-900">{month}</td>
                  <td className="px-6 py-4 text-right space-y-1">{Object.entries(currencies).map(([cur, totals]) => (<div key={cur} className="text-sm font-bold text-emerald-600">{formatCurrency((totals as any).in, cur)}</div>))}</td>
                  <td className="px-6 py-4 text-right space-y-1">
                    {Object.entries(currencies).map(([cur, totals]) => {
                      const t = totals as any;
                      const totalOutflow = t.out + t.tax;
                      const percentage = t.in > 0 ? ((totalOutflow / t.in) * 100).toFixed(0) : null;
                      return (
                        <div key={cur} className="flex flex-col items-end">
                          <div className="text-sm font-bold text-slate-700">{formatCurrency(totalOutflow, cur)}</div>
                          {percentage && <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{percentage}% of earnings</div>}
                        </div>
                      );
                    })}
                  </td>
                  <td className="px-6 py-4 text-right"><ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors inline" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
