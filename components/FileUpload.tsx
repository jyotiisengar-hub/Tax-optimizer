
import React, { useState, useRef } from 'react';
import { Upload as UploadIcon, Loader2, AlertCircle, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, Files, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';
import { parseStatement } from '../geminiService';
import { Transaction, StatementFile, Category, MerchantRule, ProcessSummary, FileProgress } from '../types';

interface FileUploadProps {
  onUpload: (files: FileList) => void;
  onProcessed: (transactions: Transaction[], fileInfos: StatementFile[]) => void;
  existingTransactions: Transaction[];
  existingStatements: StatementFile[];
  merchantRules: MerchantRule[];
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
  summary: ProcessSummary | null;
  setSummary: (val: ProcessSummary | null) => void;
  progress: FileProgress[];
  setProgress: (val: React.SetStateAction<FileProgress[]>) => void;
  error: string | null;
  setError: (val: string | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onUpload,
  onProcessed, 
  existingTransactions, 
  existingStatements, 
  merchantRules,
  isProcessing,
  setIsProcessing,
  summary,
  setSummary,
  progress,
  setProgress,
  error,
  setError
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) onUpload(e.target.files);
  };

  const handleConfirm = () => {
    if (!summary) return;
    const allTxs = summary.files.flatMap(f => f.newTransactions);
    const allFiles = summary.files.filter(f => !f.isAlreadyProcessed).map(f => ({
      id: f.fileId, 
      name: f.fileName, 
      person: f.person,
      fileHash: f.fileHash, 
      uploadDate: new Date().toISOString(), 
      processedDate: new Date().toISOString(), 
      status: 'completed' as const, 
      transactionCount: f.newTransactions.length + f.duplicates.length
    }));
    onProcessed(allTxs, allFiles);
    setSummary(null); setProgress([]);
  };

  return (
    <div className="space-y-8">
      {/* Progress Section */}
      {isProcessing && (
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <Loader2 size={24} className="animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Processing Files...</h3>
              <p className="text-sm text-slate-500">Extracting and deduplicating transactions</p>
            </div>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {progress.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-medium text-slate-600 truncate flex-1 mr-4">{p.name}</span>
                {p.status === 'processing' ? (
                  <Loader2 size={12} className="text-blue-500 animate-spin" />
                ) : p.status === 'completed' ? (
                  <CheckCircle2 size={12} className="text-emerald-500" />
                ) : p.status === 'skipped' ? (
                  <ShieldCheck size={12} className="text-blue-500" />
                ) : p.status === 'failed' ? (
                  <AlertTriangle size={12} className="text-rose-500" />
                ) : (
                  <Clock size={12} className="text-slate-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Section */}
      {summary && (
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-xl animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600"><Files size={24} /></div>
            <div><h3 className="text-xl font-bold text-slate-900">Analysis Complete</h3><p className="text-sm text-slate-500">{summary.files.length} statement(s) analyzed</p></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100"><div className="text-emerald-600 font-bold text-2xl">{summary.totalNew}</div><div className="text-xs text-emerald-700 font-medium uppercase tracking-wider">New Found</div></div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100"><div className="text-amber-600 font-bold text-2xl">{summary.totalDuplicates}</div><div className="text-xs text-amber-700 font-medium uppercase tracking-wider">Deduplicated</div></div>
          </div>
          <div className="max-h-48 overflow-y-auto mb-8 pr-2 space-y-2">
            {summary.files.map((f, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-medium text-slate-600 truncate max-w-[180px]">{f.fileName}</span>
                <div className="flex gap-2">
                  {f.isAlreadyProcessed ? <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1"><ShieldCheck size={10} /> IN KNOWLEDGE BASE</span> : <span className="text-[10px] font-bold text-emerald-600">+{f.newTransactions.length}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setSummary(null); setProgress([]); }} className="flex-1 py-3 px-6 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm">Cancel</button>
            <button onClick={handleConfirm} className="flex-[2] bg-blue-600 text-white py-3 px-6 rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 text-sm">Commit to History <ArrowRight size={18} /></button>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className={`border-2 border-dashed rounded-[32px] p-12 flex flex-col items-center justify-center transition-all ${isProcessing ? 'opacity-50 pointer-events-none border-slate-100' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}`}>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
        <div className="flex flex-col items-center cursor-pointer w-full" onClick={() => !isProcessing && fileInputRef.current?.click()}>
          <div className="flex gap-4 mb-6"><div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400"><UploadIcon size={28} /></div><div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400"><Sparkles size={28} className="text-blue-500" /></div></div>
          <h3 className="text-xl font-bold text-slate-900">Upload files</h3>
          <p className="text-sm text-slate-500 mt-2 mb-8 text-center max-w-xs">Select bank statements (PDF, CSV, XLSX). We apply your custom merchant rules automatically.</p>
          <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl">Select Batch</button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-medium">
          <AlertCircle size={18} />
          {error}
        </div>
      )}
    </div>
  );
};
