export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  note?: string;
  paymentMethod?: 'gpay' | 'upi' | 'bank_transfer' | 'card' | 'cash';
  transferType?: 'send' | 'receive' | 'payment';
  personName?: string;
  status?: 'pending' | 'completed' | 'failed';
}

export interface Budget {
  category: string;
  limit: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
}

export interface FinanceState {
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  theme: 'light' | 'dark';
}
