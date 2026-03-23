
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  History, 
  Settings, 
  PlusCircle, 
  Wallet,
  LogOut,
  Bell,
  Search,
  Trash2,
  FileText,
  Database,
  Download,
  Upload,
  Users,
  Brain,
  Store,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Scale,
  Sparkles,
  MessageSquare,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { NudgeCenter } from './components/NudgeCenter';
import { TransactionList } from './components/TransactionList';
import { FileUpload } from './components/FileUpload';
import { FamilyDirectory } from './components/FamilyDirectory';
import { CategoryManager } from './components/CategoryManager';
import { ChatInterface } from './components/ChatInterface';
import { TaxSuggestions } from './components/TaxSuggestions';
import { BehavioralIntelligence } from './components/BehavioralIntelligence';
import { TaxAnalytics } from './components/TaxAnalytics';
import { motion, AnimatePresence } from 'motion/react';
import { TaxLogic, Country } from './components/TaxLogic';
import { Transaction, StatementFile, KnowledgeBaseExport, Category, MerchantRule, ProcessSummary, FileProgress, FamilyMember, Nudge, TransactionType, BehavioralProfile } from './types';
import { 
  getTransactions, 
  saveTransactions, 
  getStatementFiles, 
  saveStatementFiles,
  getMerchantRules,
  saveMerchantRule,
  getCategoryColors,
  saveCategoryColors,
  deleteStatementAndTransactions,
  restoreKnowledgeBase,
  getFamilyMembers,
  saveFamilyMember,
  initDB
} from './db';
import * as XLSX from 'xlsx';
import { parseStatement, getTaxSuggestions, getBehavioralProfile } from './geminiService';

const normalizePersonName = (name: string, existingTransactions: Transaction[]): string => {
  if (!name) return 'Unknown';
  const trimmed = name.replace(/\s+/g, ' ').trim();
  const lower = trimmed.toLowerCase();
  
  // Check against existing transactions
  const existing = existingTransactions.find(t => t.person.toLowerCase().replace(/\s+/g, ' ').trim() === lower);
  if (existing) return existing.person;
  
  return trimmed;
};

const DEFAULT_COLORS: Record<string, string> = {
  [Category.GROCERIES]: '#3b82f6',
  [Category.UTILITIES]: '#10b981',
  [Category.RENT]: '#f59e0b',
  [Category.MORTGAGE]: '#ef4444',
  [Category.TRANSPORT]: '#8b5cf6',
  [Category.DINING]: '#ec4899',
  [Category.SHOPPING]: '#06b6d4',
  [Category.HEALTH]: '#f43f5e',
  [Category.ENTERTAINMENT]: '#a855f7',
  [Category.CAR_PAYMENT]: '#14b8a6',
  [Category.SALARY]: '#22c55e',
  [Category.INTEREST]: '#84cc16',
  [Category.INVESTMENT]: '#6366f1',
  [Category.SELF_TRANSFER]: '#94a3b8',
  [Category.OTHERS]: '#71717a',
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'deductions' | 'expenses' | 'history' | 'upload' | 'knowledge' | 'family' | 'chat' | 'tax'>('dashboard');
  const [selectedCountry, setSelectedCountry] = useState<Country>('USA');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statements, setStatements] = useState<StatementFile[]>([]);
  const [merchantRules, setMerchantRules] = useState<MerchantRule[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>(DEFAULT_COLORS);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  
  // Persistent Upload State
  const [uploadIsProcessing, setUploadIsProcessing] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<ProcessSummary | null>(null);
  const [uploadProgress, setUploadProgress] = useState<FileProgress[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const [initialMonthFilter, setInitialMonthFilter] = useState<string | null>(null);
  const [personSearchFilter, setPersonSearchFilter] = useState<string | null>(null);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [behavioralProfile, setBehavioralProfile] = useState<BehavioralProfile | null>(null);
  const [showFamilyDirectory, setShowFamilyDirectory] = useState(false);

  useEffect(() => {
    const fetchBehavioralProfile = async () => {
      if (transactions.length === 0) return;
      try {
        const profile = await getBehavioralProfile(transactions);
        if (profile) setBehavioralProfile(profile);
      } catch (err) {
        console.error("Failed to fetch behavioral profile:", err);
      }
    };
    fetchBehavioralProfile();
  }, [transactions.length]);

  // Behavioral Nudge Engine: Detect Salary and Generate Nudges
  useEffect(() => {
    if (transactions.length === 0) return;

    // 1. Salary Nudge
    const salaryTxs = transactions.filter(t => 
      t.type === TransactionType.INCOME && 
      (t.category === Category.SALARY || t.merchant.toLowerCase().includes('salary'))
    );

    if (salaryTxs.length > 0) {
      const latestSalary = salaryTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const nudgeId = `salary-${latestSalary.date}`;
      
      setNudges(prev => {
        if (prev.some(n => n.id === nudgeId)) return prev;
        const newNudge: Nudge = {
          id: nudgeId,
          type: 'salary',
          title: 'Salary Deposit Detected',
          message: `Your salary of ${latestSalary.currency} ${latestSalary.amount.toLocaleString()} just hit. Move $500 to your Roth IRA now to hit your 2026 goal. Doing this today prevents 'lifestyle creep' later this month.`,
          actionLabel: 'Authorize Transfer to Roth IRA',
          concept: 'Intertemporal Choice',
          explanation: 'Humans naturally prioritize current desires over future needs. By automating your intent the moment you receive income, you reduce the friction of saving and eliminate the temptation to spend the surplus.',
          date: new Date().toISOString(),
          isRead: false
        };
        return [newNudge, ...prev];
      });
    }

    // 2. Medical Tax Efficiency Nudge
    const healthTxs = transactions.filter(t => 
      t.type === TransactionType.EXPENSE && 
      (t.category === Category.HEALTH || t.merchant.toLowerCase().includes('medical') || t.merchant.toLowerCase().includes('pharmacy'))
    );

    if (healthTxs.length > 0) {
      const totalHealth = healthTxs.reduce((sum, t) => sum + t.amount, 0);
      const nudgeId = 'medical-tax-efficiency';
      
      setNudges(prev => {
        if (prev.some(n => n.id === nudgeId)) return prev;
        const newNudge: Nudge = {
          id: nudgeId,
          type: 'insight',
          title: 'Tax-Inefficient Medical Spending',
          message: `You've spent ${healthTxs[0].currency} ${totalHealth.toLocaleString()} on medical bills using post-tax salary. By using an HSA or FSA, you could have saved approximately ${healthTxs[0].currency} ${(totalHealth * 0.3).toLocaleString()} in taxes.`,
          actionLabel: 'Setup Pre-Tax Medical Account',
          concept: 'Tax Arbitrage',
          explanation: 'Paying for medical expenses with post-tax dollars is like paying a "tax penalty" on your health. Pre-tax accounts (HSA/FSA) allow you to pay with "gross" income, effectively giving you a 20-30% discount on every medical dollar spent.',
          date: new Date().toISOString(),
          isRead: false
        };
        return [newNudge, ...prev];
      });
    }
  }, [transactions]);

  const handleDismissNudge = (id: string) => {
    setNudges(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleActionNudge = (nudge: Nudge) => {
    // Simulate "Automation of Intent"
    if (nudge.type === 'salary') {
      alert(`Automation of Intent: Transfer of $500 to Roth IRA authorized successfully! \n\nThis reduces the "Action Gap" by converting intent into immediate action.`);
    } else if (nudge.id === 'medical-tax-efficiency') {
      alert(`Optimization Strategy: We've initiated a guide to help you set up an HSA/FSA with your employer. \n\nThis will automate your "Tax Arbitrage" strategy for future medical expenses.`);
    }
    handleDismissNudge(nudge.id);
  };

  const processFiles = async (files: FileList) => {
    setUploadIsProcessing(true);
    setUploadError(null);
    setUploadSummary(null);
    const fileArray = Array.from(files);
    const initialProgress: FileProgress[] = fileArray.map(f => ({ name: f.name, status: 'pending' }));
    setUploadProgress(initialProgress);

    try {
      const results = await Promise.all(fileArray.map(async (file, index) => {
        try {
          setUploadProgress(prev => prev.map((p, i) => i === index ? { ...p, status: 'processing' } : p));
          
          let resultTransactions: Transaction[] = [];
          const isSpreadsheet = file.type.includes('csv') || file.name.endsWith('.csv') || file.name.endsWith('.xlsx');
          if (isSpreadsheet) {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const csvData = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
            resultTransactions = await parseStatement({ textData: csvData });
          } else {
            const base64String = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
              reader.readAsDataURL(file);
            });
            resultTransactions = await parseStatement({ base64Data: base64String, mimeType: file.type || 'application/pdf' });
          }
          setUploadProgress(prev => prev.map((p, i) => i === index ? { ...p, status: 'completed' } : p));
          return { rawTransactions: resultTransactions, fileName: file.name, fileId: crypto.randomUUID(), isAlreadyProcessed: false };
        } catch (err) {
          setUploadProgress(prev => prev.map((p, i) => i === index ? { ...p, status: 'failed' } : p));
          throw err;
        }
      }));

      const finalResults: any[] = results.map(r => {
        const newTransactions: Transaction[] = [];
        
        // Identify the person for this statement
        let identifiedPerson: string | undefined;
        if (r.fileName.startsWith('EStatement')) {
          identifiedPerson = 'ICICI';
        }

        r.rawTransactions.forEach(nt => {
          nt.person = identifiedPerson || normalizePersonName(nt.person, transactions);
          if (!identifiedPerson) identifiedPerson = nt.person;

          const rule = merchantRules.find(rule => rule.merchant.toLowerCase().trim() === nt.merchant.toLowerCase().trim());
          if (rule) nt.category = rule.category;

          const finalTx = { ...nt, sourceFileId: r.fileId, isDuplicate: false };
          newTransactions.push(finalTx);
        });
        return { newTransactions, duplicates: [], fileName: r.fileName, fileId: r.fileId, fileHash: '', isAlreadyProcessed: false, person: identifiedPerson };
      });

      setUploadSummary({ files: finalResults, totalNew: finalResults.reduce((acc, r) => acc + r.newTransactions.length, 0), totalDuplicates: 0 });
      setUploadIsProcessing(false);
    } catch (err) { 
      setUploadError('Failed to process. Check files and retry.'); 
      setUploadIsProcessing(false); 
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await initDB();
        const [txs, stmts, rules, colors, members] = await Promise.all([
          getTransactions(),
          getStatementFiles(),
          getMerchantRules(),
          getCategoryColors(),
          getFamilyMembers()
        ]);
        
        setTransactions(txs || []);
        setStatements(stmts || []);
        setMerchantRules(rules || []);
        setFamilyMembers(members || []);
        if (Object.keys(colors).length > 0) {
          setCategoryColors({ ...DEFAULT_COLORS, ...colors });
        }
        setLastSaveTime(new Date());
      } catch (err) {
        console.error("Failed to load DB data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const detectedFamilyNames = useMemo(() => {
    // Normalize names to prevent duplicates in the sidebar/directory
    const names = transactions
      .map(t => t.person.replace(/\s+/g, ' ').trim())
      .filter(name => name && name.toUpperCase() !== 'ICICI');
    
    const normalized = Array.from(new Set(names.map(n => n.toLowerCase())));
    return normalized.map(lower => {
      // Pick the first occurrence's original casing for display
      return names.find(n => n.toLowerCase() === lower) || lower;
    });
  }, [transactions]);

  const familyName = useMemo(() => {
    const allNames = [...detectedFamilyNames, ...familyMembers.map(m => m.name)];
    const uniqueNames = Array.from(new Set(allNames));
    if (uniqueNames.length === 0) return "My Family";
    if (uniqueNames.length > 2) return uniqueNames.slice(0, 2).join(' & ') + '...';
    return uniqueNames.join(' & ');
  }, [detectedFamilyNames, familyMembers]);

  const handleProcessed = async (allNewTxs: Transaction[], allFileInfos: StatementFile[]) => {
    setTransactions(prev => [...prev, ...allNewTxs]);
    setStatements(prev => [...prev, ...allFileInfos]);
    setIsSaving(true);
    try {
      await Promise.all([
        saveTransactions(allNewTxs),
        saveStatementFiles(allFileInfos)
      ]);
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setIsSaving(false);
    }
    setActiveTab('expenses');
  };

  const handleUpdateCategory = async (id: string, newCategory: Category) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    // Create a rule for this merchant
    const newRule: MerchantRule = {
      merchant: tx.merchant,
      category: newCategory,
      updatedAt: new Date().toISOString()
    };

    // Update rule state and DB
    setMerchantRules(prev => {
      const filtered = prev.filter(r => r.merchant !== tx.merchant);
      return [...filtered, newRule];
    });
    
    setIsSaving(true);
    try {
      await saveMerchantRule(newRule);

      // Update all transactions from this merchant (Learning feature)
      const updatedTransactions = transactions.map(t => 
        t.merchant === tx.merchant ? { ...t, category: newCategory } : t
      );
      
      setTransactions(updatedTransactions);
      
      // Persist changes to all transactions from this merchant in DB
      const txsToUpdate = updatedTransactions.filter(t => t.merchant === tx.merchant);
      await saveTransactions(txsToUpdate);
    } catch (err) {
      console.error("Failed to save category update", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateColor = async (category: string, color: string) => {
    const newColors = { ...categoryColors, [category]: color };
    setCategoryColors(newColors);
    setIsSaving(true);
    try {
      await saveCategoryColors(newColors);
    } catch (err) {
      console.error("Failed to save color update", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStatement = async (id: string) => {
    if (confirm('Delete this statement and all its transactions? This cannot be undone.')) {
      setStatements(prev => prev.filter(s => s.id !== id));
      setTransactions(prev => prev.filter(t => t.sourceFileId !== id));
      await deleteStatementAndTransactions(id);
    }
  };

  const handleAddFamilyMember = async (name: string) => {
    const newMember: FamilyMember = {
      id: crypto.randomUUID(),
      name,
      color: '#3b82f6' // Default color
    };
    setFamilyMembers(prev => [...prev, newMember]);
    setIsSaving(true);
    try {
      await saveFamilyMember(newMember);
    } catch (err) {
      console.error("Failed to save family member", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportKnowledgeBase = () => {
    const data: KnowledgeBaseExport = {
      version: 1,
      exportDate: new Date().toISOString(),
      transactions,
      statements,
      merchantRules,
      categoryColors
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreKnowledgeBase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as KnowledgeBaseExport;
        if (confirm('Restoring will overwrite all current data. Proceed?')) {
          await restoreKnowledgeBase(data);
          setTransactions(data.transactions);
          setStatements(data.statements);
          setMerchantRules(data.merchantRules || []);
          setCategoryColors(data.categoryColors || DEFAULT_COLORS);
          alert('Knowledge base restored successfully.');
          setActiveTab('dashboard');
        }
      } catch (err) { alert('Invalid backup file.'); }
    };
    reader.readAsText(file);
  };

  const handleViewPersonActivity = (name: string) => {
    setPersonSearchFilter(name);
    setActiveTab('expenses');
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Initializing Tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-r border-slate-100 flex flex-col p-6 gap-8">
        <div onClick={() => setActiveTab('family')} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform">
            <Brain size={20} />
          </div>
          <div className="flex-1 overflow-hidden">
            <h1 className="font-bold text-slate-900 truncate">Household CFO</h1>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <button onClick={() => { setActiveTab('dashboard'); setInitialMonthFilter(null); }} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-500 hover:bg-slate-50'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button onClick={() => setActiveTab('tax')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'tax' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Sparkles size={20} /> Opportunities
          </button>
          <button onClick={() => setActiveTab('chat')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}>
            <MessageSquare size={20} /> Finance Assistant
          </button>
          <button onClick={() => setActiveTab('family')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'family' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Brain size={20} /> Behavioral Insights
          </button>

          <div className="mt-4 mb-2 px-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Transactions</p>
          </div>

          <button onClick={() => setActiveTab('upload')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'upload' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}>
            <PlusCircle size={20} /> Add Statements
          </button>
          <button onClick={() => setActiveTab('expenses')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'expenses' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Receipt size={20} /> Expenses
          </button>
          <button onClick={() => setActiveTab('deductions')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'deductions' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}>
            <ShieldCheck size={20} /> Deductions
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}>
            <History size={20} /> Upload History
          </button>

          <div className="mt-4 mb-2 px-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">System</p>
          </div>

          <button onClick={() => setActiveTab('knowledge')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'knowledge' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Database size={20} /> Knowledge Base
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
        <header className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900">
                {activeTab === 'dashboard' && 'Financial Dashboard'}
                {activeTab === 'deductions' && 'Tax Deductions'}
                {activeTab === 'expenses' && 'Household Expenses'}
                {activeTab === 'family' && 'Behavioral Intelligence'}
                {activeTab === 'history' && 'Statement Archive'}
                {activeTab === 'upload' && 'Import Statements'}
                {activeTab === 'knowledge' && 'Grounding data'}
                {activeTab === 'chat' && 'AI Finance Assistant'}
                {activeTab === 'tax' && 'Financial Opportunities'}
              </h1>
              {activeTab === 'chat' && <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">(under progress)</span>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Notification bell and Quick search removed per request */}
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-12">
            <Dashboard 
              transactions={transactions} 
              categoryColors={categoryColors}
              behavioralProfile={behavioralProfile}
              onMonthClick={(month) => { 
                if (month === 'deductions') {
                  setInitialMonthFilter(null);
                  setActiveTab('deductions');
                } else {
                  setInitialMonthFilter(month); 
                  setActiveTab('expenses'); 
                }
              }} 
            />
          </div>
        )}

        {activeTab === 'deductions' && (
          <TransactionList 
            transactions={transactions.filter(t => t.category === Category.TAX)} 
            onUpdateCategory={handleUpdateCategory}
            initialMonthFilter={initialMonthFilter}
            initialPersonSearch={personSearchFilter}
          />
        )}

        {activeTab === 'expenses' && (
          <TransactionList 
            transactions={transactions.filter(t => t.category !== Category.TAX && t.category !== Category.SELF_TRANSFER)} 
            onUpdateCategory={handleUpdateCategory}
            initialMonthFilter={initialMonthFilter}
            initialPersonSearch={personSearchFilter}
          />
        )}

        {activeTab === 'family' && (
          <div className="space-y-12">
            <BehavioralIntelligence transactions={transactions} profile={behavioralProfile} />
            
            <div className="pt-8 border-t border-slate-100">
              <button 
                onClick={() => setShowFamilyDirectory(!showFamilyDirectory)}
                className="w-full flex items-center justify-between p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-slate-900">Family & Entity Directory</h3>
                    <p className="text-sm text-slate-500">Manage family members and identified financial entities</p>
                  </div>
                </div>
                <div className="text-slate-400">
                  {showFamilyDirectory ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
              </button>

              <AnimatePresence>
                {showFamilyDirectory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-8">
                      <FamilyDirectory 
                        transactions={transactions} 
                        statements={statements}
                        familyMembers={familyMembers}
                        onAddMember={handleAddFamilyMember}
                        onViewTransactions={handleViewPersonActivity}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto py-10 space-y-8">
            <FileUpload 
              onUpload={processFiles}
              onProcessed={handleProcessed} 
              existingTransactions={transactions}
              existingStatements={statements}
              merchantRules={merchantRules}
              isProcessing={uploadIsProcessing}
              setIsProcessing={setUploadIsProcessing}
              summary={uploadSummary}
              setSummary={setUploadSummary}
              progress={uploadProgress}
              setProgress={setUploadProgress}
              error={uploadError}
              setError={setUploadError}
            />
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="font-bold text-amber-900 mb-1">Privacy Recommendation</h4>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Users are encouraged to upload <span className="font-bold underline decoration-amber-300">sample or redacted</span> financial statements when testing the prototype.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto">
            <ChatInterface transactions={transactions} country={selectedCountry} />
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="space-y-12">
            <TaxAnalytics transactions={transactions} />
            <div className="h-px bg-slate-100 w-full" />
            <TaxSuggestions 
              transactions={transactions} 
              country={selectedCountry} 
              nudges={nudges}
              onDismissNudge={handleDismissNudge}
              onActionNudge={handleActionNudge}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Processed Statements</h3>
              <span className="text-sm text-slate-400 font-medium">{statements.length} files in database</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statements.map(s => (
                <div key={s.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-500"><FileText size={24} /></div>
                    <button onClick={() => handleDeleteStatement(s.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-900 truncate" title={s.name}>{s.name}</h4>
                    {s.person && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                        {s.person}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-4">Processed on {new Date(s.processedDate || '').toLocaleDateString()}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transactions</span>
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-lg">+{s.transactionCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6"><Download size={28} /></div>
                <h3 className="text-xl font-bold mb-2">Export Data</h3>
                <p className="text-sm text-slate-500 mb-6">Download your entire history, rules, and preferences.</p>
                <button onClick={handleExportKnowledgeBase} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">Download Backup <ArrowRight size={18} /></button>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6"><Upload size={28} /></div>
                <h3 className="text-xl font-bold mb-2">Restore Backup</h3>
                <p className="text-sm text-slate-500 mb-6">Import an export file to restore all settings.</p>
                <label className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <PlusCircle size={18} /> Select File
                  <input type="file" accept=".json" onChange={handleRestoreKnowledgeBase} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-16 pt-12 border-t border-slate-100 pb-12">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Privacy & Data Handling</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This prototype processes uploaded financial statements locally within the session and does not permanently store user financial data. 
              No personal data is collected or tracked. The tool is intended purely as a demonstration of AI-driven tax analysis workflows.
            </p>
            <p className="text-[11px] text-slate-400">
              If you encounter issues or have feedback, please contact: <a href="mailto:jyotiisengar@gmail.com" className="text-blue-500 hover:underline font-bold">jyotiisengar@gmail.com</a>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
