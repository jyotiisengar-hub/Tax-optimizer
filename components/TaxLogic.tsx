
import React from 'react';
import { Globe, Shield, BookOpen, Scale, Info } from 'lucide-react';

export type Country = 'USA' | 'India' | 'Singapore' | 'Canada' | 'United Kingdom';

interface TaxLogicProps {
  selectedCountry: Country;
  onCountryChange: (country: Country) => void;
}

const countryData: Record<Country, { authority: string, website: string, grounding: string[] }> = {
  'USA': {
    authority: 'Internal Revenue Service (IRS)',
    website: 'https://www.irs.gov',
    grounding: [
      'Standard Deduction vs. Itemized Deductions (Schedule A)',
      'Qualified Business Income (QBI) Deduction for small businesses',
      'Child Tax Credit and Dependent Care Credits',
      'Retirement contributions (401k, IRA) tax advantages',
      'Capital Gains tax rates based on holding period',
      'Mortgage Interest Deduction limits'
    ]
  },
  'Singapore': {
    authority: 'Inland Revenue Authority of Singapore (IRAS)',
    website: 'https://www.iras.gov.sg',
    grounding: [
      'Personal Income Tax Reliefs (Earned Income, CPF, NSman)',
      'Parenthood Tax Rebate (PTR) and Working Mother\'s Child Relief',
      'Course Fees Relief for upskilling',
      'SRS (Supplementary Retirement Scheme) contributions for tax deferral',
      'Charitable donations (250% tax deduction)',
      'Rental expense claims (Flat 15% or actual)'
    ]
  },
  'India': {
    authority: 'Income Tax Department',
    website: 'https://www.incometax.gov.in',
    grounding: [
      'Section 80C deductions (PPF, ELSS, LIC, Tuition Fees)',
      'Section 80D medical insurance premiums',
      'House Rent Allowance (HRA) exemptions',
      'Standard Deduction for salaried individuals',
      'New vs. Old Tax Regime comparison logic',
      'Home Loan Interest (Section 24b)'
    ]
  },
  'Canada': {
    authority: 'Canada Revenue Agency (CRA)',
    website: 'https://www.canada.ca/en/revenue-agency.html',
    grounding: [
      'RRSP (Registered Retirement Savings Plan) deduction limits',
      'TFSA (Tax-Free Savings Account) monitoring',
      'Canada Child Benefit (CCB) eligibility',
      'Medical Expense Tax Credit (METC)',
      'Home Buyers\' Amount and GST/HST rebates',
      'Tuition Tax Credit transfers'
    ]
  },
  'United Kingdom': {
    authority: 'HM Revenue & Customs (HMRC)',
    website: 'https://www.gov.uk/government/organisations/hm-revenue-customs',
    grounding: [
      'Personal Allowance thresholds',
      'ISA (Individual Savings Account) tax-free limits',
      'Pension contribution tax relief (Gift Aid)',
      'Capital Gains Tax annual exempt amount',
      'Marriage Allowance transfers',
      'Self-Assessment expense categories'
    ]
  }
};

export const TaxLogic: React.FC<TaxLogicProps> = ({ selectedCountry, onCountryChange }) => {
  const data = countryData[selectedCountry];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Globe size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Tax Jurisdiction</h3>
              <p className="text-sm text-slate-500">Select your country to apply specific taxation logic.</p>
            </div>
          </div>
          
          <div className="relative min-w-[240px]">
            <select 
              value={selectedCountry}
              onChange={(e) => onCountryChange(e.target.value as Country)}
              className="w-full pl-4 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-slate-700 cursor-pointer"
            >
              {(Object.keys(countryData) as Country[]).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Globe size={18} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-3 text-slate-400 mb-4">
                <Shield size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Regulatory Authority</span>
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-2">{data.authority}</h4>
              <a 
                href={data.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1"
              >
                Official Website <Info size={14} />
              </a>
            </div>

            <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
              <div className="flex items-center gap-3 text-emerald-600 mb-4">
                <Scale size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">AI Grounding Status</span>
              </div>
              <p className="text-sm text-emerald-800 leading-relaxed font-medium">
                The AI Tax Consultant is currently grounded in {selectedCountry} tax laws. All suggestions, categorizations, and optimizations will prioritize {data.authority} guidelines.
              </p>
              <div className="mt-4 pt-4 border-t border-emerald-200/50">
                <p className="text-[11px] text-emerald-700/70 leading-relaxed italic">
                  Detailed tax logic and rule documentation will be added soon. For now, users can refer to the official website linked above for authoritative guidance.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[32px] text-white">
            <div className="flex items-center gap-3 text-slate-400 mb-6">
              <BookOpen size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Core Taxation Logic</span>
            </div>
            <ul className="space-y-4">
              {data.grounding.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  </div>
                  <span className="text-sm text-slate-300 font-medium leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Updated: March 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
