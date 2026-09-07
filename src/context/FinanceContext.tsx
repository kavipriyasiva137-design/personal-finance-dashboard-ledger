/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Transaction, Budget, SavingsGoal } from '../types';

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  theme: 'light' | 'dark';
  categories: string[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  editTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  importTransactions: (newTxs: Transaction[]) => void;
  updateBudget: (category: string, limit: number) => void;
  deleteBudget: (category: string) => void;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => void;
  updateSavingsGoal: (goal: SavingsGoal) => void;
  deleteSavingsGoal: (id: string) => void;
  allocateToGoal: (id: string, amount: number) => boolean;
  resetData: () => void;
  toggleTheme: () => void;
  totals: {
    income: number;
    expenses: number;
    netBalance: number;
    allocatedSavings: number;
    availableBalance: number;
    savingsRate: number;
  };
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const CATEGORIES = [
  'Salary',
  'Freelance',
  'Food & Dining',
  'Housing & Rent',
  'Utilities',
  'Transport',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Education',
  'Travel',
  'Other'
];

// Helper to get past dates relative to today
const getPastDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const DEFAULT_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', date: getPastDateStr(0), description: 'Payment received from Needhika', amount: 5000, type: 'income', category: 'Salary', note: 'GPay salary deposit', paymentMethod: 'gpay', transferType: 'receive', personName: 'Needhika' },
  { id: 'tx-2', date: getPastDateStr(1), description: 'Money sent to Mounika', amount: 184.50, type: 'expense', category: 'Food & Dining', note: 'Dinner via GPay', paymentMethod: 'gpay', transferType: 'send', personName: 'Mounika' },
  { id: 'tx-3', date: getPastDateStr(2), description: 'Transfer to Manju', amount: 1500, type: 'expense', category: 'Housing & Rent', note: 'Rent payment', paymentMethod: 'gpay', transferType: 'send', personName: 'Manju' },
  { id: 'tx-4', date: getPastDateStr(3), description: 'Paid to Abi', amount: 115.40, type: 'expense', category: 'Utilities', note: 'Utility split', paymentMethod: 'gpay', transferType: 'send', personName: 'Abi' },
  { id: 'tx-5', date: getPastDateStr(4), description: 'Freelance Pay received from Karthik', amount: 1200, type: 'income', category: 'Freelance', note: 'Project milestone', paymentMethod: 'gpay', transferType: 'receive', personName: 'Karthik' },
  { id: 'tx-6', date: getPastDateStr(5), description: 'Dinner with Anitha', amount: 76.00, type: 'expense', category: 'Food & Dining', note: 'Restaurant bill', paymentMethod: 'gpay', transferType: 'send', personName: 'Anitha' },
  { id: 'tx-7', date: getPastDateStr(7), description: 'Sent money to Dhivya', amount: 48.00, type: 'expense', category: 'Transport', note: 'Cab ride split', paymentMethod: 'gpay', transferType: 'send', personName: 'Dhivya' },
  { id: 'tx-8', date: getPastDateStr(9), description: 'Transfer to Koushik', amount: 15.49, type: 'expense', category: 'Entertainment', note: 'Movie ticket', paymentMethod: 'gpay', transferType: 'send', personName: 'Koushik' },
  { id: 'tx-9', date: getPastDateStr(10), description: 'Received from Priya', amount: 145.20, type: 'income', category: 'Other', note: 'Return payout', paymentMethod: 'gpay', transferType: 'receive', personName: 'Priya' },
  { id: 'tx-10', date: getPastDateStr(12), description: 'Paid to Vignesh', amount: 60.00, type: 'expense', category: 'Healthcare', note: 'Gym fee', paymentMethod: 'gpay', transferType: 'send', personName: 'Vignesh' }
];

const DEFAULT_BUDGETS: Budget[] = [
  { category: 'Food & Dining', limit: 450 },
  { category: 'Utilities', limit: 250 },
  { category: 'Transport', limit: 150 },
  { category: 'Entertainment', limit: 120 },
  { category: 'Shopping', limit: 200 }
];

const DEFAULT_GOALS: SavingsGoal[] = [
  { id: 'goal-1', name: 'Emergency Fund', targetAmount: 8000, currentAmount: 4500, targetDate: getPastDateStr(-180) },
  { id: 'goal-2', name: 'New Workstation Laptop', targetAmount: 1800, currentAmount: 650, targetDate: getPastDateStr(-90) },
  { id: 'goal-3', name: 'Tokyo Vacation Trip', targetAmount: 4000, currentAmount: 1200, targetDate: getPastDateStr(-120) }
];

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('fin_transactions');
    return saved ? JSON.parse(saved) : DEFAULT_TRANSACTIONS;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('fin_budgets');
    return saved ? JSON.parse(saved) : DEFAULT_BUDGETS;
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('fin_savings_goals');
    return saved ? JSON.parse(saved) : DEFAULT_GOALS;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('fin_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('fin_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('fin_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('fin_savings_goals', JSON.stringify(savingsGoals));
  }, [savingsGoals]);

  useEffect(() => {
    localStorage.setItem('fin_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Calculations
  const totals = React.useMemo(() => {
    let income = 0;
    let expenses = 0;

    transactions.forEach(t => {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expenses += t.amount;
      }
    });

    const netBalance = income - expenses;
    const allocatedSavings = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const availableBalance = netBalance - allocatedSavings;
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    return {
      income,
      expenses,
      netBalance,
      allocatedSavings,
      availableBalance,
      savingsRate: Math.max(0, savingsRate)
    };
  }, [transactions, savingsGoals]);

  // Operations
  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const editTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const importTransactions = (newTxs: Transaction[]) => {
    // Merge without duplicates based on simple criteria, or just append
    setTransactions(prev => {
      const merged = [...newTxs, ...prev];
      // De-duplicate by id
      const uniqueMap = new Map<string, Transaction>();
      merged.forEach(tx => {
        if (!tx.id) {
          tx.id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        uniqueMap.set(tx.id, tx);
      });
      return Array.from(uniqueMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    });
  };

  const updateBudget = (category: string, limit: number) => {
    setBudgets(prev => {
      const index = prev.findIndex(b => b.category === category);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { category, limit };
        return updated;
      } else {
        return [...prev, { category, limit }];
      }
    });
  };

  const deleteBudget = (category: string) => {
    setBudgets(prev => prev.filter(b => b.category !== category));
  };

  const addSavingsGoal = (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      currentAmount: 0
    };
    setSavingsGoals(prev => [...prev, newGoal]);
  };

  const updateSavingsGoal = (updatedGoal: SavingsGoal) => {
    setSavingsGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };

  const deleteSavingsGoal = (id: string) => {
    setSavingsGoals(prev => prev.filter(g => g.id !== id));
  };

  const allocateToGoal = (id: string, amount: number): boolean => {
    // If allocating, check if availableBalance is sufficient
    // If withdrawing (amount is negative), check if goal has enough currentAmount
    if (amount > 0 && amount > totals.availableBalance) {
      return false; // Insufficient balance
    }
    
    let success = false;
    setSavingsGoals(prev => prev.map(g => {
      if (g.id === id) {
        const nextAmount = g.currentAmount + amount;
        if (nextAmount >= 0 && nextAmount <= g.targetAmount) {
          success = true;
          return { ...g, currentAmount: nextAmount };
        } else if (nextAmount < 0) {
          success = true;
          return { ...g, currentAmount: 0 };
        } else if (nextAmount > g.targetAmount) {
          success = true;
          return { ...g, currentAmount: g.targetAmount };
        }
      }
      return g;
    }));
    return success;
  };

  const resetData = () => {
    setTransactions(DEFAULT_TRANSACTIONS);
    setBudgets(DEFAULT_BUDGETS);
    setSavingsGoals(DEFAULT_GOALS);
    localStorage.removeItem('fin_transactions');
    localStorage.removeItem('fin_budgets');
    localStorage.removeItem('fin_savings_goals');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        budgets,
        savingsGoals,
        theme,
        categories: CATEGORIES,
        addTransaction,
        editTransaction,
        deleteTransaction,
        importTransactions,
        updateBudget,
        deleteBudget,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        allocateToGoal,
        resetData,
        toggleTheme,
        totals
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
