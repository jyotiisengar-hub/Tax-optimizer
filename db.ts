import { Transaction, StatementFile, KnowledgeBaseExport, MerchantRule, FamilyMember } from './types';

const API_BASE = '/api';

export const initDB = async (): Promise<void> => {
  // No-op for API-based DB, but we can check connectivity
  await fetch(`${API_BASE}/data`);
};

export const saveTransactions = async (transactions: Transaction[]): Promise<void> => {
  // In the current app logic, saveTransactions often adds to existing.
  // We'll fetch existing first to be safe, or just send the whole batch if the app manages it.
  // Looking at App.tsx, it seems to pass the full list.
  await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transactions)
  });
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const response = await fetch(`${API_BASE}/transactions`);
  return response.json();
};

export const saveStatementFiles = async (files: StatementFile[]): Promise<void> => {
  await fetch(`${API_BASE}/statements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(files)
  });
};

export const getStatementFiles = async (): Promise<StatementFile[]> => {
  const response = await fetch(`${API_BASE}/statements`);
  return response.json();
};

export const saveMerchantRule = async (rule: MerchantRule): Promise<void> => {
  await fetch(`${API_BASE}/merchantRules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule)
  });
};

export const getMerchantRules = async (): Promise<MerchantRule[]> => {
  const response = await fetch(`${API_BASE}/merchantRules`);
  return response.json();
};

export const saveFamilyMember = async (member: FamilyMember): Promise<void> => {
  await fetch(`${API_BASE}/familyMembers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(member)
  });
};

export const getFamilyMembers = async (): Promise<FamilyMember[]> => {
  const response = await fetch(`${API_BASE}/familyMembers`);
  return response.json();
};

export const saveCategoryColors = async (colors: Record<string, string>): Promise<void> => {
  await fetch(`${API_BASE}/preferences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryColors: colors })
  });
};

export const getCategoryColors = async (): Promise<Record<string, string>> => {
  const response = await fetch(`${API_BASE}/preferences`);
  const prefs = await response.json();
  return prefs.categoryColors || {};
};

export const deleteStatementAndTransactions = async (statementId: string): Promise<void> => {
  await fetch(`${API_BASE}/statements/${statementId}`, {
    method: 'DELETE'
  });
};

export const restoreKnowledgeBase = async (data: KnowledgeBaseExport): Promise<void> => {
  await fetch(`${API_BASE}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transactions: data.transactions,
      statements: data.statements,
      merchantRules: data.merchantRules,
      preferences: { categoryColors: data.categoryColors }
    })
  });
};

export const saveCompletedTaxAction = async (actionId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/preferences`);
  const prefs = await response.json();
  const current = prefs.completedTaxActions || [];
  if (!current.includes(actionId)) {
    await fetch(`${API_BASE}/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completedTaxActions: [...current, actionId] })
    });
  }
};

export const getCompletedTaxActions = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE}/preferences`);
  const prefs = await response.json();
  return prefs.completedTaxActions || [];
};

export const saveTaxSuggestions = async (suggestions: any[]): Promise<void> => {
  await fetch(`${API_BASE}/preferences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      cachedTaxSuggestions: suggestions, 
      taxSuggestionsTimestamp: Date.now() 
    })
  });
};

export const getCachedTaxSuggestions = async (): Promise<{ data: any[], timestamp: number } | null> => {
  const response = await fetch(`${API_BASE}/preferences`);
  const prefs = await response.json();
  if (prefs.cachedTaxSuggestions) {
    return { 
      data: prefs.cachedTaxSuggestions, 
      timestamp: prefs.taxSuggestionsTimestamp 
    };
  }
  return null;
};
