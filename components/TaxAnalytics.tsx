
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Legend
} from 'recharts';
import { formatCurrency, formatCompactNumber } from '../lib/currencyUtils';
import { Transaction, TransactionType, Category } from '../types';
import { format, parseISO, startOfMonth } from 'date-fns';
import { ShieldCheck, TrendingUp, Receipt, Calculator, Percent, ArrowUpRight } from 'lucide-react';

interface TaxAnalyticsProps {
  transactions: Transaction[];
}

export const TaxAnalytics: React.FC<TaxAnalyticsProps> = ({ transactions }) => {
  const currencies = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => set.add(t.currency || 'USD'));
    return Array.from(set).sort();
  }, [transactions]);

  const selectedCurrency = useMemo(() => {
    if (currencies.length === 0) return 'USD';
    // Prefer USD if available, otherwise first one
    return currencies.includes('USD') ? 'USD' : currencies[0];
  }, [currencies]);

  const financialStats = useMemo(() => {
    let totalIncome = 0;
    let totalTaxPaid = 0;
    let totalExpenses = 0;
    const monthlyData: Record<string, { month: string, income: number, taxPaid: number, estimatedTax: number, totalExpenses: number }> = {};

    transactions.forEach(t => {
      const month = format(parseISO(t.date), 'MMM yy');
      if (!monthlyData[month]) {
        monthlyData[month] = { month, income: 0, taxPaid: 0, estimatedTax: 0, totalExpenses: 0 };
      }

      if (t.type === TransactionType.INCOME) {
        totalIncome += t.amount;
        monthlyData[month].income += t.amount;
      } else if (t.type === TransactionType.EXPENSE) {
        totalExpenses += t.amount;
        monthlyData[month].totalExpenses += t.amount;
        if (t.category === Category.TAX) {
          totalTaxPaid += t.amount;
          monthlyData[month].taxPaid += t.amount;
        }
      }
    });

    // Simple tax estimation logic (progressive-ish)
    // 0-50k: 10%, 50k-100k: 20%, 100k+: 30%
    const calculateEstimatedTax = (income: number) => {
      if (income <= 50000) return income * 0.1;
      if (income <= 100000) return 5000 + (income - 50000) * 0.2;
      return 15000 + (income - 100000) * 0.3;
    };

    const estimatedTotalTax = calculateEstimatedTax(totalIncome);
    
    Object.values(monthlyData).forEach(m => {
      m.estimatedTax = calculateEstimatedTax(m.income);
    });

    const sortedMonthly = Object.values(monthlyData).sort((a, b) => {
      const dateA = parseISO(`20${a.month.split(' ')[1]}-${format(new Date(a.month.split(' ')[0] + ' 1 2000'), 'MM')}-01`);
      const dateB = parseISO(`20${b.month.split(' ')[1]}-${format(new Date(b.month.split(' ')[0] + ' 1 2000'), 'MM')}-01`);
      return dateA.getTime() - dateB.getTime();
    });

    return {
      totalIncome,
      totalTaxPaid,
      totalExpenses,
      estimatedTotalTax,
      monthlyData: sortedMonthly,
      effectiveRate: totalIncome > 0 ? (totalTaxPaid / totalIncome) * 100 : 0,
      estimatedRate: totalIncome > 0 ? (estimatedTotalTax / totalIncome) * 100 : 0
    };
  }, [transactions]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Income</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(financialStats.totalIncome, selectedCurrency)}</div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Gross earnings identified</p>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Receipt size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Expenses</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(financialStats.totalExpenses, selectedCurrency)}</div>
          <p className="text-[10px] text-emerald-600 mt-1 font-bold">Burn Rate: {financialStats.totalIncome > 0 ? ((financialStats.totalExpenses / financialStats.totalIncome) * 100).toFixed(1) : 0}%</p>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Calculator size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estimated Tax</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(financialStats.estimatedTotalTax, selectedCurrency)}</div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Projected liability</p>
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center">
                <Percent size={20} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Net Savings</span>
            </div>
            <div className="text-2xl font-black">{formatCurrency(Math.max(0, financialStats.totalIncome - financialStats.totalExpenses), selectedCurrency)}</div>
            <p className="text-[10px] text-blue-400 mt-1 font-bold flex items-center gap-1">
              <ArrowUpRight size={10} /> Potential Savings Opportunity
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Money In vs Money Out Trend</h3>
              <p className="text-sm text-slate-500">Monthly comparison of earnings and total expenses</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Money In</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Money Out</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialStats.monthlyData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} tickFormatter={(v) => formatCompactNumber(v, selectedCurrency)} />
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}}
                  formatter={(value: number) => [formatCurrency(value, selectedCurrency), '']}
                />
                <Area type="monotone" dataKey="income" name="Money In" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="totalExpenses" name="Money Out" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Financial Efficiency</h3>
          <p className="text-sm text-slate-500 mb-8">How well you are managing your cash flow</p>
          
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-slate-100"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 80}
                  strokeDashoffset={2 * Math.PI * 80 * (1 - (financialStats.totalIncome > 0 ? (financialStats.totalExpenses / financialStats.totalIncome) : 0))}
                  className="text-blue-600 transition-all duration-1000"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-slate-900">{financialStats.totalIncome > 0 ? ((1 - financialStats.totalExpenses / financialStats.totalIncome) * 100).toFixed(1) : 0}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Savings Rate</span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <span className="text-xs font-bold text-slate-500 uppercase">Total Money In</span>
              <span className="text-sm font-black text-slate-900">{formatCurrency(financialStats.totalIncome, selectedCurrency)}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl">
              <span className="text-xs font-bold text-emerald-600 uppercase">Total Money Out</span>
              <span className="text-sm font-black text-emerald-700">{formatCurrency(financialStats.totalExpenses, selectedCurrency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
