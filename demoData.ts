
import { Transaction, StatementFile, TransactionType, Category, FamilyMember } from './types';

export const DEMO_STATEMENTS: StatementFile[] = [
  {
    id: 'demo-stmt-1',
    name: 'Amazon_Earnings_Sep_2024_Redacted.pdf',
    person: 'Demo User',
    uploadDate: '2024-09-30T10:00:00Z',
    processedDate: '2024-09-30T10:05:00Z',
    status: 'completed',
    transactionCount: 4,
  },
  {
    id: 'demo-stmt-2',
    name: 'Amazon_Earnings_Oct_2024_Redacted.pdf',
    person: 'Demo User',
    uploadDate: '2024-10-31T10:00:00Z',
    processedDate: '2024-10-31T10:05:00Z',
    status: 'completed',
    transactionCount: 4,
  },
  {
    id: 'demo-stmt-3',
    name: 'KeyBank_Statement_Oct_2024.pdf',
    person: 'Anurag Vemuri',
    uploadDate: '2024-10-21T10:00:00Z',
    processedDate: '2024-10-21T10:05:00Z',
    status: 'completed',
    transactionCount: 4,
  },
  {
    id: 'demo-stmt-4',
    name: 'KeyBank_Statement_Nov_2024.pdf',
    person: 'Anurag Vemuri',
    uploadDate: '2024-11-21T10:00:00Z',
    processedDate: '2024-11-21T10:05:00Z',
    status: 'completed',
    transactionCount: 1,
  }
];

export const DEMO_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'demo-member-1',
    name: 'Demo User',
    color: '#3b82f6'
  },
  {
    id: 'demo-member-2',
    name: 'Anurag Vemuri',
    color: '#10b981'
  }
];

export const DEMO_TRANSACTIONS: Transaction[] = [
  // September 2024
  {
    id: 'demo-tx-1',
    date: '2024-09-30',
    merchant: 'AMAZON.COM SERVICES LLC',
    person: 'Demo User',
    amount: 19350.11,
    currency: 'USD',
    type: TransactionType.INCOME,
    category: Category.SALARY,
    sourceFileId: 'demo-stmt-1',
    rawDescription: 'Gross Pay'
  },
  {
    id: 'demo-tx-2',
    date: '2024-09-30',
    merchant: 'IRS',
    person: 'Demo User',
    amount: 3739.17,
    currency: 'USD',
    type: TransactionType.EXPENSE,
    category: Category.TAX,
    sourceFileId: 'demo-stmt-1',
    rawDescription: 'Federal Income Tax'
  },
  {
    id: 'demo-tx-3',
    date: '2024-09-30',
    merchant: 'Medicare',
    person: 'Demo User',
    amount: 280.87,
    currency: 'USD',
    type: TransactionType.EXPENSE,
    category: Category.TAX,
    sourceFileId: 'demo-stmt-1',
    rawDescription: 'Medicare Tax'
  },
  {
    id: 'demo-tx-4',
    date: '2024-09-30',
    merchant: 'Social Security',
    person: 'Demo User',
    amount: 982.85,
    currency: 'USD',
    type: TransactionType.EXPENSE,
    category: Category.TAX,
    sourceFileId: 'demo-stmt-1',
    rawDescription: 'Social Security Tax'
  },
  // October 2024
  {
    id: 'demo-tx-5',
    date: '2024-10-31',
    merchant: 'AMAZON.COM SERVICES LLC',
    person: 'Demo User',
    amount: 19350.01,
    currency: 'USD',
    type: TransactionType.INCOME,
    category: Category.SALARY,
    sourceFileId: 'demo-stmt-2',
    rawDescription: 'Gross Pay'
  },
  {
    id: 'demo-tx-6',
    date: '2024-10-31',
    merchant: 'IRS',
    person: 'Demo User',
    amount: 4057.23,
    currency: 'USD',
    type: TransactionType.EXPENSE,
    category: Category.TAX,
    sourceFileId: 'demo-stmt-2',
    rawDescription: 'Federal Income Tax'
  },
  {
    id: 'demo-tx-7',
    date: '2024-10-31',
    merchant: 'Medicare',
    person: 'Demo User',
    amount: 280.86,
    currency: 'USD',
    type: TransactionType.EXPENSE,
    category: Category.TAX,
    sourceFileId: 'demo-stmt-2',
    rawDescription: 'Medicare Tax'
  },
  {
    id: 'demo-tx-8',
    date: '2024-10-31',
    merchant: 'Social Security',
    person: 'Demo User',
    amount: 1157.19,
    currency: 'USD',
    type: TransactionType.EXPENSE,
    category: Category.TAX,
    sourceFileId: 'demo-stmt-2',
    rawDescription: 'Social Security Tax'
  },
  // Anurag Vemuri - Oct 2024
  {
    id: 'demo-tx-9',
    date: '2024-10-15',
    merchant: 'Venmo',
    person: 'Anurag Vemuri',
    amount: 546.47,
    currency: 'USD',
    type: TransactionType.INCOME,
    category: Category.OTHERS,
    sourceFileId: 'demo-stmt-3',
    rawDescription: 'DIRECT DEPOSIT, VENMO CASHOUT'
  },
  {
    id: 'demo-tx-10',
    date: '2024-10-15',
    merchant: 'KeyBank',
    person: 'Anurag Vemuri',
    amount: 600.00,
    currency: 'USD',
    type: TransactionType.INCOME,
    category: Category.SELF_TRANSFER,
    sourceFileId: 'demo-stmt-3',
    rawDescription: 'INTERNET TRF FR DDA ENDING IN 5176 4731'
  },
  {
    id: 'demo-tx-11',
    date: '2024-10-15',
    merchant: 'Citi Card',
    person: 'Anurag Vemuri',
    amount: 233.59,
    currency: 'USD',
    type: TransactionType.EXPENSE,
    category: Category.SHOPPING,
    sourceFileId: 'demo-stmt-3',
    rawDescription: 'DIRECT WITHDRAWAL, CITI CARD ONLINEPAYMENT'
  },
  {
    id: 'demo-tx-12',
    date: '2024-10-21',
    merchant: 'ATM Withdrawal',
    person: 'Anurag Vemuri',
    amount: 60.00,
    currency: 'USD',
    type: TransactionType.EXPENSE,
    category: Category.OTHERS,
    sourceFileId: 'demo-stmt-3',
    rawDescription: 'ATM KEY 3240 156TH AVE SE BELLEVUE WA'
  },
  // Anurag Vemuri - Nov 2024
  {
    id: 'demo-tx-13',
    date: '2024-11-12',
    merchant: 'ATM Withdrawal',
    person: 'Anurag Vemuri',
    amount: 60.00,
    currency: 'USD',
    type: TransactionType.EXPENSE,
    category: Category.OTHERS,
    sourceFileId: 'demo-stmt-4',
    rawDescription: 'ATM KEY 3240 156TH AVE SE BELLEVUE WA'
  }
];
