// Data Layer using REST API fetches to Express Backend

const API_BASE = '/api';

const CATEGORIES = {
  INCOME: ['Salary', 'Freelance', 'Investments', 'Other Income'],
  EXPENSE: ['Food', 'Housing', 'Utilities', 'Transport', 'Entertainment', 'Health', 'Education', 'Travel', 'Shopping', 'Miscellaneous']
};

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const storage = {
  // Mock initialization
  init() {
    // No-op. Backend handles seeding.
  },

  // Auth Operations
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }

    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  async updateProfile(profileData) {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update profile');
    }

    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  // Transactions CRUD (API Call)
  async getTransactions() {
    const res = await fetch(`${API_BASE}/transactions`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return await res.json();
  },

  async addTransaction(transaction) {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(transaction)
    });
    if (!res.ok) throw new Error('Failed to create transaction');
    return await res.json();
  },

  async updateTransaction(updatedTx) {
    const res = await fetch(`${API_BASE}/transactions/${updatedTx.id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updatedTx)
    });
    if (!res.ok) throw new Error('Failed to update transaction');
    return await res.json();
  },

  async deleteTransaction(id) {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
    return await res.json();
  },

  // Budgets Operations (API Call)
  async getBudgets() {
    const res = await fetch(`${API_BASE}/budgets`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch budgets');
    return await res.json();
  },

  async updateBudget(category, limit) {
    const res = await fetch(`${API_BASE}/budgets`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ category, limit })
    });
    if (!res.ok) throw new Error('Failed to update budget');
    return await res.json();
  },

  // Goals Operations (API Call)
  async getGoals() {
    const res = await fetch(`${API_BASE}/goals`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch goals');
    return await res.json();
  },

  async addGoal(goal) {
    const res = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(goal)
    });
    if (!res.ok) throw new Error('Failed to create goal');
    return await res.json();
  },

  async updateGoalProgress(id, currentAmount) {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ current: currentAmount })
    });
    if (!res.ok) throw new Error('Failed to update goal progress');
    return await res.json();
  },

  async deleteGoal(id) {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete goal');
    return await res.json();
  },

  // Rewards Operations (API Call)
  async getRewards() {
    const res = await fetch(`${API_BASE}/rewards`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch rewards');
    return await res.json();
  },

  async claimReward(id) {
    const res = await fetch(`${API_BASE}/rewards/claim/${id}`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to claim reward');
    return await res.json();
  },

  getCategories() {
    return CATEGORIES;
  }
};
