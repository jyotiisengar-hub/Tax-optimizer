
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Legend
} from 'recharts';
import { Transaction, TransactionType, Category } from '../types';
import { format, parseISO, startOfMonth } from 'date-fns';
import { ShieldCheck, TrendingUp, Receipt, Calculator, Percent, ArrowUpRight } from 'lucide-react';

interface TaxAnalyticsProps {
  transactions: Transaction[];
}

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const TaxAnalytics: React.FC<TaxAnalyticsProps> = ({ transactions }) => {
  const taxStats = useMemo(() => {
    let totalIncome = 0;
    let totalTaxPaid = 0;
    const monthlyData: Record<string, { month: string, income: number, taxPaid: number, estimatedTax: number }> = {};

    transactions.forEach(t => {
      const month = format(parseISO(t.date), 'MMM yy');
      if (!monthlyData[month]) {
        monthlyData[month] = { month, income: 0, taxPaid: 0, estimatedTax: 0 };
      }

      if (t.type === TransactionType.INCOME) {
        totalIncome += t.amount;
        monthlyData[month].income += t.amount;
      } else if (t.category === Category.TAX) {
        totalTaxPaid += t.amount;
        monthlyData[month].taxPaid += t.amount;
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
          <div className="text-2xl font-black text-slate-900">{formatCurrency(taxStats.totalIncome)}</div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Gross earnings identified</p>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Receipt size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tax Paid</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(taxStats.totalTaxPaid)}</div>
          <p className="text-[10px] text-emerald-600 mt-1 font-bold">Effective Rate: {taxStats.effectiveRate.toFixed(1)}%</p>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Calculator size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estimated Tax</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(taxStats.estimatedTotalTax)}</div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Projected liability</p>
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-[32px] shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center">
                <Percent size={20} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tax Gap</span>
            </div>
            <div className="text-2xl font-black">{formatCurrency(Math.max(0, taxStats.estimatedTotalTax - taxStats.totalTaxPaid))}</div>
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
              <h3 className="text-xl font-bold text-slate-900">Tax vs Income Trend</h3>
              <p className="text-sm text-slate-500">Monthly comparison of earnings and tax liability</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tax Paid</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={taxStats.monthlyData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTax" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}}
                />
                <Area type="monotone" dataKey="income" name="Income" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="taxPaid" name="Tax Paid" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTax)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Tax Efficiency</h3>
          <p className="text-sm text-slate-500 mb-8">How well you are utilizing tax deductions</p>
          
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
                  strokeDashoffset={2 * Math.PI * 80 * (1 - taxStats.estimatedRate / 100)}
                  className="text-blue-600 transition-all duration-1000"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-slate-900">{taxStats.estimatedRate.toFixed(1)}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Rate</span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <span className="text-xs font-bold text-slate-500 uppercase">Taxable Income</span>
              <span className="text-sm font-black text-slate-900">{formatCurrency(taxStats.totalIncome)}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl">
              <span className="text-xs font-bold text-emerald-600 uppercase">Deductions Found</span>
              <span className="text-sm font-black text-emerald-700">{formatCurrency(taxStats.totalTaxPaid)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
