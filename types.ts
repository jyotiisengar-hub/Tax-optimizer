
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum Category {
  GROCERIES = 'Groceries',
  UTILITIES = 'Utilities',
  RENT = 'Rent',
  MORTGAGE = 'Mortgage',
  TRANSPORT = 'Transport',
  DINING = 'Dining',
  SHOPPING = 'Shopping',
  HEALTH = 'Health',
  ENTERTAINMENT = 'Entertainment',
  CAR_PAYMENT = 'Car Payment',
  SALARY = 'Salary',
  INTEREST = 'Interest',
  INVESTMENT = 'Investment',
  SELF_TRANSFER = 'Self Transfer',
  TAX = 'Tax',
  OTHERS = 'Others'
}

export interface Nudge {
  id: string;
  type: 'salary' | 'goal' | 'insight';
  title: string;
  message: string;
  actionLabel: string;
  concept: string;
  explanation: string;
  date: string;
  isRead: boolean;
}

export interface MerchantRule {
  merchant: string;
  category: Category;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO format
  merchant: string;
  person: string;
  amount: number;
  currency: string; // e.g., "USD", "INR"
  type: TransactionType;
  category: Category;
  sourceFileId?: string;
  isDuplicate?: boolean;
  rawDescription?: string;
}

export interface StatementFile {
  id: string;
  name: string;
  person?: string;
  uploadDate: string;
  processedDate?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionCount: number;
  fileHash?: string; // To prevent re-processing identical files
}

export interface FamilyMember {
  id: string;
  name: string;
  color: string;
}

export interface KnowledgeBaseExport {
  version: number;
  exportDate: string;
  transactions: Transaction[];
  statements: StatementFile[];
  merchantRules?: MerchantRule[];
  categoryColors?: Record<string, string>;
}

export interface SingleFileResult {
  newTransactions: Transaction[];
  duplicates: Transaction[];
  fileName: string;
  fileId: string;
  fileHash: string;
  isAlreadyProcessed: boolean;
  person?: string;
}

export interface ProcessSummary {
  files: SingleFileResult[];
  totalNew: number;
  totalDuplicates: number;
}

export interface FileProgress {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
}

export interface ArchetypeScore {
  archetype: string;
  score: number;
  reasoning: string;
}

export interface BehavioralProfile {
  archetypes: ArchetypeScore[];
  narrative: string;
  nudges: {
    title: string;
    description: string;
  }[];
}
