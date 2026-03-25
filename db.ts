import { Transaction, StatementFile, KnowledgeBaseExport, MerchantRule, FamilyMember } from './types';
import { DEMO_TRANSACTIONS, DEMO_STATEMENTS, DEMO_FAMILY_MEMBERS } from './demoData';

const STORAGE_KEYS = {
  TRANSACTIONS: 'tax_app_transactions',
  STATEMENTS: 'tax_app_statements',
  MERCHANT_RULES: 'tax_app_merchant_rules',
  FAMILY_MEMBERS: 'tax_app_family_members',
  PREFERENCES: 'tax_app_preferences',
  DEMO_SEEDED: 'tax_app_demo_seeded'
};

const getLocal = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) return defaultValue;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error(`Error parsing localStorage key ${key}:`, e);
    return defaultValue;
  }
};

const setLocal = (key: string, data: any): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const initDB = async (): Promise<void> => {
  const isSeeded = localStorage.getItem(STORAGE_KEYS.DEMO_SEEDED);
  const existingTransactions = getLocal<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  
  if (!isSeeded && existingTransactions.length === 0) {
    console.log('Seeding demo data...');
    setLocal(STORAGE_KEYS.TRANSACTIONS, DEMO_TRANSACTIONS);
    setLocal(STORAGE_KEYS.STATEMENTS, DEMO_STATEMENTS);
    setLocal(STORAGE_KEYS.FAMILY_MEMBERS, DEMO_FAMILY_MEMBERS);
    localStorage.setItem(STORAGE_KEYS.DEMO_SEEDED, 'true');
  }
  console.log('Local storage initialized');
};

export const saveTransactions = async (transactions: Transaction[]): Promise<void> => {
  const existing = getLocal<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  const existingMap = new Map(existing.map(t => [t.id, t]));
  transactions.forEach(t => existingMap.set(t.id, t));
  setLocal(STORAGE_KEYS.TRANSACTIONS, Array.from(existingMap.values()));
};

export const getTransactions = async (): Promise<Transaction[]> => {
  return getLocal<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
};

export const saveStatementFiles = async (files: StatementFile[]): Promise<void> => {
  const existing = getLocal<StatementFile[]>(STORAGE_KEYS.STATEMENTS, []);
  const existingMap = new Map(existing.map(f => [f.id, f]));
  files.forEach(f => existingMap.set(f.id, f));
  setLocal(STORAGE_KEYS.STATEMENTS, Array.from(existingMap.values()));
};

export const getStatementFiles = async (): Promise<StatementFile[]> => {
  return getLocal<StatementFile[]>(STORAGE_KEYS.STATEMENTS, []);
};

export const saveMerchantRule = async (rule: MerchantRule): Promise<void> => {
  const existing = getLocal<MerchantRule[]>(STORAGE_KEYS.MERCHANT_RULES, []);
  const index = existing.findIndex(r => r.merchant === rule.merchant);
  if (index > -1) existing[index] = rule;
  else existing.push(rule);
  setLocal(STORAGE_KEYS.MERCHANT_RULES, existing);
};

export const getMerchantRules = async (): Promise<MerchantRule[]> => {
  return getLocal<MerchantRule[]>(STORAGE_KEYS.MERCHANT_RULES, []);
};

export const saveFamilyMember = async (member: FamilyMember): Promise<void> => {
  const existing = getLocal<FamilyMember[]>(STORAGE_KEYS.FAMILY_MEMBERS, []);
  const index = existing.findIndex(m => m.id === member.id);
  if (index > -1) existing[index] = member;
  else existing.push(member);
  setLocal(STORAGE_KEYS.FAMILY_MEMBERS, existing);
};

export const getFamilyMembers = async (): Promise<FamilyMember[]> => {
  return getLocal<FamilyMember[]>(STORAGE_KEYS.FAMILY_MEMBERS, []);
};

export const saveCategoryColors = async (colors: Record<string, string>): Promise<void> => {
  const prefs = getLocal<any>(STORAGE_KEYS.PREFERENCES, {});
  prefs.categoryColors = colors;
  setLocal(STORAGE_KEYS.PREFERENCES, prefs);
};

export const getCategoryColors = async (): Promise<Record<string, string>> => {
  const prefs = getLocal<any>(STORAGE_KEYS.PREFERENCES, {});
  return prefs.categoryColors || {};
};

export const deleteStatementAndTransactions = async (statementId: string): Promise<void> => {
  const statements = getLocal<StatementFile[]>(STORAGE_KEYS.STATEMENTS, []);
  const transactions = getLocal<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  
  setLocal(STORAGE_KEYS.STATEMENTS, statements.filter(s => s.id !== statementId));
  setLocal(STORAGE_KEYS.TRANSACTIONS, transactions.filter(t => t.sourceFileId !== statementId));
};

export const restoreKnowledgeBase = async (data: KnowledgeBaseExport): Promise<void> => {
  setLocal(STORAGE_KEYS.TRANSACTIONS, data.transactions);
  setLocal(STORAGE_KEYS.STATEMENTS, data.statements);
  setLocal(STORAGE_KEYS.MERCHANT_RULES, data.merchantRules);
  setLocal(STORAGE_KEYS.PREFERENCES, { categoryColors: data.categoryColors });
};

export const clearAllData = async (): Promise<void> => {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  localStorage.removeItem('tax_app_demo_seeded');
};

export const saveCompletedTaxAction = async (actionId: string): Promise<void> => {
  const prefs = getLocal<any>(STORAGE_KEYS.PREFERENCES, {});
  const current = prefs.completedTaxActions || [];
  if (!current.includes(actionId)) {
    prefs.completedTaxActions = [...current, actionId];
    setLocal(STORAGE_KEYS.PREFERENCES, prefs);
  }
};

export const getCompletedTaxActions = async (): Promise<string[]> => {
  const prefs = getLocal<any>(STORAGE_KEYS.PREFERENCES, {});
  return prefs.completedTaxActions || [];
};

export const saveTaxSuggestions = async (suggestions: any[]): Promise<void> => {
  const prefs = getLocal<any>(STORAGE_KEYS.PREFERENCES, {});
  prefs.cachedTaxSuggestions = suggestions;
  prefs.taxSuggestionsTimestamp = Date.now();
  setLocal(STORAGE_KEYS.PREFERENCES, prefs);
};

export const getCachedTaxSuggestions = async (): Promise<{ data: any[], timestamp: number } | null> => {
  const prefs = getLocal<any>(STORAGE_KEYS.PREFERENCES, {});
  if (prefs.cachedTaxSuggestions) {
    return { 
      data: prefs.cachedTaxSuggestions, 
      timestamp: prefs.taxSuggestionsTimestamp 
    };
  }
  return null;
};
