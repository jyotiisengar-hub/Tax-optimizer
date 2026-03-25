
import { Transaction, StatementFile, FamilyMember, TransactionType, Category } from './types';

const DEMO_FILE_ID = 'demo-statement-2024';

export const DEMO_STATEMENTS: StatementFile[] = [
  {
    id: DEMO_FILE_ID,
    name: 'Demo_Financial_Statement_2024.csv',
    person: 'Demo User',
    uploadDate: new Date().toISOString(),
    processedDate: new Date().toISOString(),
    status: 'completed',
    transactionCount: 30
  }
];

export const DEMO_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'demo-user-id',
    name: 'Demo User',
    color: '#3b82f6'
  }
];

export const DEMO_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2024-10-10', merchant: 'County Tax Disbursement', person: 'Demo User', amount: 3234.58, currency: 'USD', type: TransactionType.INCOME, category: Category.TAX, sourceFileId: DEMO_FILE_ID },
  { id: 't2', date: '2024-10-15', merchant: 'VENMO CASHOUT', person: 'Demo User', amount: 546.47, currency: 'USD', type: TransactionType.INCOME, category: Category.SALARY, sourceFileId: DEMO_FILE_ID },
  { id: 't3', date: '2024-10-15', merchant: 'INTERNET TRF', person: 'Demo User', amount: 600.00, currency: 'USD', type: TransactionType.INCOME, category: Category.SELF_TRANSFER, sourceFileId: DEMO_FILE_ID },
  { id: 't4', date: '2024-10-15', merchant: 'CITI CARD', person: 'Demo User', amount: 233.59, currency: 'USD', type: TransactionType.EXPENSE, category: Category.OTHERS, sourceFileId: DEMO_FILE_ID },
  { id: 't5', date: '2024-10-21', merchant: 'ATM BELLEVUE', person: 'Demo User', amount: 60.00, currency: 'USD', type: TransactionType.EXPENSE, category: Category.OTHERS, sourceFileId: DEMO_FILE_ID },
  { id: 't6', date: '2024-11-01', merchant: 'Payment Received', person: 'Demo User', amount: 5834.92, currency: 'USD', type: TransactionType.INCOME, category: Category.OTHERS, sourceFileId: DEMO_FILE_ID },
  { id: 't7', date: '2024-11-12', merchant: 'CAPITAL ONE', person: 'Demo User', amount: 1179.82, currency: 'USD', type: TransactionType.EXPENSE, category: Category.OTHERS, sourceFileId: DEMO_FILE_ID },
  { id: 't8', date: '2024-11-30', merchant: 'Monthly Interest Paid', person: 'Demo User', amount: 8.23, currency: 'USD', type: TransactionType.INCOME, category: Category.INTEREST, sourceFileId: DEMO_FILE_ID },
  { id: 't9', date: '2024-12-09', merchant: 'ATM BELLEVUE', person: 'Demo User', amount: 100.00, currency: 'USD', type: TransactionType.EXPENSE, category: Category.OTHERS, sourceFileId: DEMO_FILE_ID },
  { id: 't10', date: '2024-09-30', merchant: 'Gross Pay', person: 'Demo User', amount: 19350.11, currency: 'USD', type: TransactionType.INCOME, category: Category.SALARY, sourceFileId: DEMO_FILE_ID },
  { id: 't11', date: '2024-09-30', merchant: 'Federal Income Tax', person: 'Demo User', amount: 3739.17, currency: 'USD', type: TransactionType.EXPENSE, category: Category.TAX, sourceFileId: DEMO_FILE_ID },
  { id: 't12', date: '2024-09-30', merchant: 'Medicare Tax', person: 'Demo User', amount: 280.87, currency: 'USD', type: TransactionType.EXPENSE, category: Category.TAX, sourceFileId: DEMO_FILE_ID },
  { id: 't13', date: '2024-09-30', merchant: 'Social Security Tax', person: 'Demo User', amount: 982.85, currency: 'USD', type: TransactionType.EXPENSE, category: Category.TAX, sourceFileId: DEMO_FILE_ID },
  { id: 't14', date: '2024-10-31', merchant: 'Gross Pay', person: 'Demo User', amount: 19350.01, currency: 'USD', type: TransactionType.INCOME, category: Category.SALARY, sourceFileId: DEMO_FILE_ID },
  { id: 't15', date: '2024-10-31', merchant: 'Federal Income Tax', person: 'Demo User', amount: 4057.23, currency: 'USD', type: TransactionType.EXPENSE, category: Category.TAX, sourceFileId: DEMO_FILE_ID },
  { id: 't16', date: '2024-10-31', merchant: 'Medicare Tax', person: 'Demo User', amount: 280.86, currency: 'USD', type: TransactionType.EXPENSE, category: Category.TAX, sourceFileId: DEMO_FILE_ID },
  { id: 't17', date: '2024-10-31', merchant: 'Social Security Tax', person: 'Demo User', amount: 1157.19, currency: 'USD', type: TransactionType.EXPENSE, category: Category.TAX, sourceFileId: DEMO_FILE_ID },
  { id: 't18', date: '2024-09-21', merchant: 'Credit Card payment', person: 'Demo User', amount: 232.66, currency: 'USD', type: TransactionType.EXPENSE, category: Category.OTHERS, sourceFileId: DEMO_FILE_ID },
  { id: 't19', date: '2024-09-10', merchant: 'City of Washington Utilities', person: 'Demo User', amount: 614.97, currency: 'USD', type: TransactionType.EXPENSE, category: Category.UTILITIES, sourceFileId: DEMO_FILE_ID },
  { id: 't20', date: '2024-09-21', merchant: 'Google Fi Phone', person: 'Demo User', amount: 108.93, currency: 'USD', type: TransactionType.EXPENSE, category: Category.UTILITIES, sourceFileId: DEMO_FILE_ID },
  { id: 't21', date: '2024-09-11', merchant: 'Garbage pickup Utilities', person: 'Demo User', amount: 123.73, currency: 'USD', type: TransactionType.EXPENSE, category: Category.UTILITIES, sourceFileId: DEMO_FILE_ID },
  { id: 't22', date: '2024-10-21', merchant: 'Walmart', person: 'Demo User', amount: 42.38, currency: 'USD', type: TransactionType.EXPENSE, category: Category.SHOPPING, sourceFileId: DEMO_FILE_ID },
  { id: 't23', date: '2024-09-21', merchant: 'Safeway', person: 'Demo User', amount: 7.99, currency: 'USD', type: TransactionType.EXPENSE, category: Category.GROCERIES, sourceFileId: DEMO_FILE_ID },
  { id: 't24', date: '2024-11-21', merchant: 'Temu.com Merchandise', person: 'Demo User', amount: 55.90, currency: 'USD', type: TransactionType.EXPENSE, category: Category.SHOPPING, sourceFileId: DEMO_FILE_ID },
  { id: 't25', date: '2024-10-21', merchant: 'Credit Card payment', person: 'Demo User', amount: 122.66, currency: 'USD', type: TransactionType.EXPENSE, category: Category.OTHERS, sourceFileId: DEMO_FILE_ID },
  { id: 't26', date: '2024-10-10', merchant: 'City of Washington Utilities', person: 'Demo User', amount: 610.97, currency: 'USD', type: TransactionType.EXPENSE, category: Category.UTILITIES, sourceFileId: DEMO_FILE_ID },
  { id: 't27', date: '2024-10-21', merchant: 'Google Fi Phone', person: 'Demo User', amount: 98.93, currency: 'USD', type: TransactionType.EXPENSE, category: Category.UTILITIES, sourceFileId: DEMO_FILE_ID },
  { id: 't28', date: '2024-10-11', merchant: 'Garbage pickup Utilities', person: 'Demo User', amount: 120.73, currency: 'USD', type: TransactionType.EXPENSE, category: Category.UTILITIES, sourceFileId: DEMO_FILE_ID },
  { id: 't29', date: '2024-10-11', merchant: 'Walmart', person: 'Demo User', amount: 72.38, currency: 'USD', type: TransactionType.EXPENSE, category: Category.SHOPPING, sourceFileId: DEMO_FILE_ID },
  { id: 't30', date: '2024-10-21', merchant: 'Safeway', person: 'Demo User', amount: 70.99, currency: 'USD', type: TransactionType.EXPENSE, category: Category.GROCERIES, sourceFileId: DEMO_FILE_ID },
];
