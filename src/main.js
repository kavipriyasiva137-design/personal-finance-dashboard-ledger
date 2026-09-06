import { storage } from './storage';
import { chartManager } from './chart-manager';

// Application State
let state = {
  transactions: [],
  budgets: {},
  goals: [],
  filters: {
    search: '',
    type: 'all',
    category: 'all',
    sortBy: 'date-desc'
  },
  editingTxId: null,
  activeGoalId: null,
  theme: 'dark'
};

// DOM Elements
const elements = {
  // Auth containers
  authContainer: document.getElementById('auth-container'),
  appContainer: document.getElementById('app-container'),
  formLogin: document.getElementById('form-login'),
  loginEmail: document.getElementById('login-email'),
  loginPassword: document.getElementById('login-password'),
  loginErrorMsg: document.getElementById('login-error-msg'),
  btnLogout: document.getElementById('btn-logout'),

  // Stats
  netBalance: document.getElementById('stat-net-balance'),
  income: document.getElementById('stat-income'),
  expenses: document.getElementById('stat-expenses'),
  savingsRate: document.getElementById('savings-rate-pct'),
  trendNetBalance: document.getElementById('trend-net-balance'),
  incomeCount: document.getElementById('income-count-desc'),
  expenseCount: document.getElementById('expense-count-desc'),

  // Filters & Actions
  ledgerSearch: document.getElementById('ledger-search'),
  filterType: document.getElementById('filter-type'),
  filterCategory: document.getElementById('filter-category'),
  sortBy: document.getElementById('sort-by'),
  btnExportCsv: document.getElementById('btn-export-csv'),
  btnOpenTxModal: document.getElementById('btn-open-transaction-modal'),
  themeToggle: document.getElementById('theme-toggle'),
  currentDateText: document.getElementById('current-date-text'),

  // Lists
  transactionListBody: document.getElementById('transaction-list-body'),
  noTransactionsMsg: document.getElementById('no-transactions-msg'),
  budgetListContainer: document.getElementById('budget-list-container'),
  goalsListContainer: document.getElementById('goals-list-container'),

  // Modals
  modalTx: document.getElementById('modal-transaction'),
  formTx: document.getElementById('form-transaction'),
  txId: document.getElementById('tx-id'),
  txDescription: document.getElementById('tx-description'),
  txType: document.getElementById('tx-type'),
  txCategory: document.getElementById('tx-category'),
  txAmount: document.getElementById('tx-amount'),
  txDate: document.getElementById('tx-date'),
  txModalTitle: document.getElementById('transaction-modal-title'),
  btnCloseTxModal: document.getElementById('btn-close-transaction-modal'),
  btnCancelTxModal: document.getElementById('btn-cancel-transaction-modal'),

  modalBudgets: document.getElementById('modal-budgets'),
  formBudgets: document.getElementById('form-budgets'),
  budgetInputsContainer: document.getElementById('budget-inputs-container'),
  btnAdjustBudgets: document.getElementById('btn-adjust-budgets'),
  btnCloseBudgetsModal: document.getElementById('btn-close-budgets-modal'),
  btnCancelBudgetsModal: document.getElementById('btn-cancel-budgets-modal'),

  modalAddGoal: document.getElementById('modal-add-goal'),
  formAddGoal: document.getElementById('form-add-goal'),
  goalName: document.getElementById('goal-name'),
  goalTarget: document.getElementById('goal-target'),
  goalCurrent: document.getElementById('goal-current'),
  btnAddGoal: document.getElementById('btn-add-goal'),
  btnCloseGoalModal: document.getElementById('btn-close-goal-modal'),
  btnCancelGoalModal: document.getElementById('btn-cancel-goal-modal'),

  modalGoalAction: document.getElementById('modal-goal-action'),
  formGoalAction: document.getElementById('form-goal-action'),
  goalActionId: document.getElementById('goal-action-id'),
  goalActionModalTitle: document.getElementById('goal-action-modal-title'),
  goalActionAmount: document.getElementById('goal-action-amount'),
  btnCloseGoalActionModal: document.getElementById('btn-close-goal-action-modal'),
  btnCancelGoalActionModal: document.getElementById('btn-cancel-goal-action-modal'),

  // Navigation Links
  navDashboard: document.getElementById('nav-dashboard'),
  navLedger: document.getElementById('nav-ledger-link'),
  navBudgets: document.getElementById('nav-budgets-link'),
  navGoals: document.getElementById('nav-goals-link')
};

// Initialize Application
function init() {
  // Set theme from localStorage or default
  initTheme();

  // Set current date subtitle
  initHeaderDate();

  // Populate form category templates
  populateFilterCategories();
  populateTxFormCategories();
  resetTxDateInput();

  // Auth Routing
  if (storage.isAuthenticated()) {
    showDashboard();
  } else {
    showAuth();
  }

  // Register event listeners
  registerEventListeners();
}

async function showDashboard() {
  elements.authContainer.classList.add('hidden');
  elements.appContainer.classList.remove('hidden');

  // Load user info
  const user = storage.getUser();
  if (user) {
    elements.currentDateText.textContent = `Welcome back, ${user.name}! Here is your overview.`;
  }

  // Fetch all state dynamically from Backend REST APIs
  const success = await loadState();
  if (success) {
    renderAll();
  }
}

function showAuth() {
  elements.appContainer.classList.add('hidden');
  elements.authContainer.classList.remove('hidden');
  elements.loginErrorMsg.classList.add('hidden');
  elements.formLogin.reset();
}

async function loadState() {
  try {
    const [txs, budgets, goals] = await Promise.all([
      storage.getTransactions(),
      storage.getBudgets(),
      storage.getGoals()
    ]);
    state.transactions = txs;
    state.budgets = budgets;
    state.goals = goals;
    return true;
  } catch (err) {
    console.error('Error loading full-stack state:', err);
    // If unauthorized, boot to login screen
    if (err.message.includes('Unauthorized') || err.message.includes('401')) {
      storage.logout();
      showAuth();
    }
    return false;
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  state.theme = savedTheme;
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function initHeaderDate() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  elements.currentDateText.textContent = `Welcome back! Today is ${new Date().toLocaleDateString(undefined, options)}.`;
}

function resetTxDateInput() {
  elements.txDate.value = new Date().toISOString().split('T')[0];
}

// Populate Category Dropdowns
function populateFilterCategories() {
  const categories = storage.getCategories();
  const allCategories = [...categories.INCOME, ...categories.EXPENSE];
  
  elements.filterCategory.innerHTML = '<option value="all">All Categories</option>';
  allCategories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    elements.filterCategory.appendChild(opt);
  });
}

function populateTxFormCategories() {
  const categories = storage.getCategories();
  const selectedType = elements.txType.value;
  const list = selectedType === 'income' ? categories.INCOME : categories.EXPENSE;
  
  elements.txCategory.innerHTML = '';
  list.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    elements.txCategory.appendChild(opt);
  });
}

// CALCULATE STATS
function renderStats() {
  const transactions = state.transactions;
  
  // Calculate Totals (All transactions)
  let netBalance = 0;
  transactions.forEach(t => {
    if (t.type === 'income') {
      netBalance += t.amount;
    } else {
      netBalance -= t.amount;
    }
  });

  // Calculate Monthly Totals (Current calendar month)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTxs = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getUTCMonth() === currentMonth && d.getUTCFullYear() === currentYear;
  });

  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  let monthlyIncomeCount = 0;
  let monthlyExpenseCount = 0;

  monthlyTxs.forEach(t => {
    if (t.type === 'income') {
      monthlyIncome += t.amount;
      monthlyIncomeCount++;
    } else {
      monthlyExpenses += t.amount;
      monthlyExpenseCount++;
    }
  });

  // Calculate Savings Rate
  let savingsRate = 0;
  if (monthlyIncome > 0) {
    savingsRate = Math.max(0, ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100);
  }

  // Update UI values
  elements.netBalance.textContent = formatCurrency(netBalance);
  elements.income.textContent = formatCurrency(monthlyIncome);
  elements.expenses.textContent = formatCurrency(monthlyExpenses);
  elements.savingsRate.textContent = `${savingsRate.toFixed(0)}%`;
  elements.incomeCount.textContent = `${monthlyIncomeCount} transaction${monthlyIncomeCount !== 1 ? 's' : ''} this month`;
  elements.expenseCount.textContent = `${monthlyExpenseCount} transaction${monthlyExpenseCount !== 1 ? 's' : ''} this month`;

  // Savings rate indicators
  if (savingsRate >= 20) {
    elements.trendNetBalance.className = 'trend trend-up';
    elements.trendNetBalance.querySelector('i').setAttribute('data-lucide', 'trending-up');
  } else {
    elements.trendNetBalance.className = 'trend trend-down';
    elements.trendNetBalance.querySelector('i').setAttribute('data-lucide', 'trending-down');
  }
}

// RENDER TRANSACTION LEDGER (WITH FILTERS & SORTING)
function renderLedger() {
  const { search, type, category, sortBy } = state.filters;
  let filtered = [...state.transactions];

  // 1. Search filter (case-insensitive description match)
  if (search.trim() !== '') {
    const q = search.toLowerCase();
    filtered = filtered.filter(t => t.description.toLowerCase().includes(q));
  }

  // 2. Type filter
  if (type !== 'all') {
    filtered = filtered.filter(t => t.type === type);
  }

  // 3. Category filter
  if (category !== 'all') {
    filtered = filtered.filter(t => t.category === category);
  }

  // 4. Sort
  filtered.sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  // Render list
  elements.transactionListBody.innerHTML = '';
  
  if (filtered.length === 0) {
    elements.noTransactionsMsg.classList.remove('hidden');
  } else {
    elements.noTransactionsMsg.classList.add('hidden');
    
    filtered.forEach(tx => {
      const tr = document.createElement('tr');
      
      const formattedDate = new Date(tx.date).toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        timeZone: 'UTC'
      });
      
      tr.innerHTML = `
        <td>${formattedDate}</td>
        <td class="font-semibold">${tx.description}</td>
        <td><span class="badge badge-category">${tx.category}</span></td>
        <td><span class="badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}">${tx.type}</span></td>
        <td class="text-right table-amount ${tx.type === 'income' ? 'amount-income' : 'amount-expense'}">
          ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
        </td>
        <td class="text-center">
          <div class="action-btns">
            <button class="action-btn btn-edit" data-id="${tx.id}" title="Edit">
              <i data-lucide="edit-3"></i>
            </button>
            <button class="action-btn btn-delete" data-id="${tx.id}" title="Delete">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      `;
      elements.transactionListBody.appendChild(tr);
    });
  }
  
  // Refresh newly injected Lucide icons
  lucide.createIcons();
}

// RENDER BUDGETS
function renderBudgets() {
  const transactions = state.transactions;
  const budgets = state.budgets;
  
  // Calculate expenses per category in the current calendar month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const categoryTotals = {};
  
  // Initialize categories
  Object.keys(budgets).forEach(cat => {
    categoryTotals[cat] = 0;
  });

  transactions.forEach(t => {
    if (t.type === 'expense') {
      const d = new Date(t.date);
      if (d.getUTCMonth() === currentMonth && d.getUTCFullYear() === currentYear) {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      }
    }
  });

  // Render
  elements.budgetListContainer.innerHTML = '';
  
  Object.keys(budgets).forEach(cat => {
    const limit = budgets[cat];
    const spent = categoryTotals[cat] || 0;
    const percentage = limit > 0 ? (spent / limit) * 100 : 0;
    const cappedPercentage = Math.min(100, percentage);

    // Determine status class
    let colorClass = 'bg-safe';
    if (percentage > 90) {
      colorClass = 'bg-danger';
    } else if (percentage > 75) {
      colorClass = 'bg-warning';
    }

    const budgetItem = document.createElement('div');
    budgetItem.className = 'budget-item';
    budgetItem.innerHTML = `
      <div class="budget-meta">
        <span class="budget-cat">${cat}</span>
        <span class="budget-nums"><span>$${spent.toFixed(0)}</span> of <span>$${limit.toFixed(0)}</span></span>
      </div>
      <div class="budget-progress-track">
        <div class="budget-progress-bar ${colorClass}" style="width: ${cappedPercentage}%"></div>
      </div>
    `;
    elements.budgetListContainer.appendChild(budgetItem);
  });
}

// RENDER GOALS
function renderGoals() {
  elements.goalsListContainer.innerHTML = '';
  
  state.goals.forEach(goal => {
    const percentage = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
    const cappedPercentage = Math.min(100, percentage);

    const goalCard = document.createElement('div');
    goalCard.className = 'goal-item-card';
    goalCard.innerHTML = `
      <div class="goal-item-header">
        <span class="goal-name-text" style="color: ${goal.color}">${goal.name}</span>
        <div class="goal-actions-row">
          <button class="btn btn-outline btn-sm btn-goal-manage" data-id="${goal.id}" title="Deposit or Withdraw">
            <i data-lucide="plus-circle" style="width: 14px; height: 14px;"></i> Manage
          </button>
          <button class="action-btn btn-delete-goal" data-id="${goal.id}" title="Remove Goal" style="width: 24px; height: 24px;">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      </div>
      <div class="goal-progress-info">
        <span>$${goal.current.toLocaleString()} saved</span>
        <span class="goal-target-val">target: $${goal.target.toLocaleString()}</span>
      </div>
      <div class="goal-progress-bar-track">
        <div class="goal-progress-bar-fill" style="width: ${cappedPercentage}%; background-color: ${goal.color}"></div>
      </div>
    `;
    elements.goalsListContainer.appendChild(goalCard);
  });

  lucide.createIcons();
}

// CHARTS REDRAW
function renderCharts() {
  const isDarkMode = state.theme === 'dark';
  chartManager.renderTrendChart('trendChart', state.transactions, isDarkMode);
  chartManager.renderCategoryChart('categoryChart', state.transactions, isDarkMode);
}

// MASTER RENDER
function renderAll() {
  renderStats();
  renderLedger();
  renderBudgets();
  renderGoals();
  renderCharts();
}

// HELPERS
function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(val);
}

// MODAL ROUTINES
function openModal(modal) {
  modal.classList.add('open');
}

function closeModal(modal) {
  modal.classList.remove('open');
}

// OPEN TRANSACTION MODAL (ADD / EDIT)
function openTxModal(txId = null) {
  state.editingTxId = txId;
  
  if (txId) {
    elements.txModalTitle.textContent = 'Edit Transaction';
    const tx = state.transactions.find(t => t.id === txId);
    if (tx) {
      elements.txId.value = tx.id;
      elements.txDescription.value = tx.description;
      elements.txType.value = tx.type;
      populateTxFormCategories();
      elements.txCategory.value = tx.category;
      elements.txAmount.value = tx.amount;
      elements.txDate.value = tx.date;
    }
  } else {
    elements.txModalTitle.textContent = 'Add Transaction';
    elements.formTx.reset();
    elements.txId.value = '';
    elements.txType.value = 'expense';
    populateTxFormCategories();
    resetTxDateInput();
  }
  openModal(elements.modalTx);
}

// OPEN BUDGET LIMIT MODAL
function openBudgetModal() {
  elements.budgetInputsContainer.innerHTML = '';
  
  Object.keys(state.budgets).forEach(cat => {
    const limit = state.budgets[cat];
    const group = document.createElement('div');
    group.className = 'form-group';
    group.innerHTML = `
      <label for="budget-limit-${cat}" class="form-label">${cat} Limit ($)</label>
      <input type="number" id="budget-limit-${cat}" data-category="${cat}" class="form-control budget-limit-input" value="${limit}" step="10" min="0" required />
    `;
    elements.budgetInputsContainer.appendChild(group);
  });
  
  openModal(elements.modalBudgets);
}

// OPEN GOAL ACTION MODAL (DEPOSIT / WITHDRAWAL)
function openGoalActionModal(goalId) {
  state.activeGoalId = goalId;
  const goal = state.goals.find(g => g.id === goalId);
  if (goal) {
    elements.goalActionModalTitle.textContent = `Fund - ${goal.name}`;
    elements.goalActionId.value = goalId;
    elements.goalActionAmount.value = '';
    elements.formGoalAction.reset();
    openModal(elements.modalGoalAction);
  }
}

// EXPORT TO CSV
function exportToCSV() {
  const transactions = state.transactions;
  if (transactions.length === 0) return;

  const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
  const csvRows = [headers.join(',')];

  transactions.forEach(t => {
    const row = [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.category,
      t.type,
      t.amount
    ];
    csvRows.push(row.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `pf_ledger_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// EVENT LISTENERS REGISTER
function registerEventListeners() {
  // Login Form Submission
  elements.formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    elements.loginErrorMsg.classList.add('hidden');

    const email = elements.loginEmail.value;
    const password = elements.loginPassword.value;

    try {
      await storage.login(email, password);
      showDashboard();
    } catch (err) {
      console.error('Authentication failed:', err);
      elements.loginErrorMsg.classList.remove('hidden');
    }
  });

  // Logout Trigger
  elements.btnLogout.addEventListener('click', (e) => {
    e.preventDefault();
    storage.logout();
    showAuth();
  });

  // Theme Toggle
  elements.themeToggle.addEventListener('click', () => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    state.theme = nextTheme;
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    renderCharts();
  });

  // Search Ledger
  elements.ledgerSearch.addEventListener('input', (e) => {
    state.filters.search = e.target.value;
    renderLedger();
  });

  // Filter Selects
  elements.filterType.addEventListener('change', (e) => {
    state.filters.type = e.target.value;
    renderLedger();
  });

  elements.filterCategory.addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    renderLedger();
  });

  elements.sortBy.addEventListener('change', (e) => {
    state.filters.sortBy = e.target.value;
    renderLedger();
  });

  // Export CSV
  elements.btnExportCsv.addEventListener('click', exportToCSV);

  // Transaction Modal Triggers
  elements.btnOpenTxModal.addEventListener('click', () => openTxModal());
  elements.btnCloseTxModal.addEventListener('click', () => closeModal(elements.modalTx));
  elements.btnCancelTxModal.addEventListener('click', () => closeModal(elements.modalTx));
  
  elements.txType.addEventListener('change', populateTxFormCategories);

  // Form Submission: Transaction
  elements.formTx.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = elements.txId.value;
    const transactionData = {
      description: elements.txDescription.value,
      type: elements.txType.value,
      category: elements.txCategory.value,
      amount: parseFloat(elements.txAmount.value),
      date: elements.txDate.value
    };

    try {
      if (id) {
        // Edit mode
        await storage.updateTransaction({ id, ...transactionData });
      } else {
        // Add mode
        await storage.addTransaction(transactionData);
      }
      closeModal(elements.modalTx);
      await loadState();
      renderAll();
    } catch (err) {
      console.error('Failed to save transaction:', err);
    }
  });

  // Budget Modal Triggers
  elements.btnAdjustBudgets.addEventListener('click', openBudgetModal);
  elements.btnCloseBudgetsModal.addEventListener('click', () => closeModal(elements.modalBudgets));
  elements.btnCancelBudgetsModal.addEventListener('click', () => closeModal(elements.modalBudgets));

  // Form Submission: Budgets
  elements.formBudgets.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputs = elements.budgetInputsContainer.querySelectorAll('.budget-limit-input');
    
    try {
      const promises = Array.from(inputs).map(inp => {
        const cat = inp.getAttribute('data-category');
        const limit = parseFloat(inp.value) || 0;
        return storage.updateBudget(cat, limit);
      });

      await Promise.all(promises);
      closeModal(elements.modalBudgets);
      await loadState();
      renderAll();
    } catch (err) {
      console.error('Failed to update budgets:', err);
    }
  });

  // Goals Modal Triggers
  elements.btnAddGoal.addEventListener('click', () => openModal(elements.modalAddGoal));
  elements.btnCloseGoalModal.addEventListener('click', () => closeModal(elements.modalAddGoal));
  elements.btnCancelGoalModal.addEventListener('click', () => closeModal(elements.modalAddGoal));

  // Form Submission: Create Goal
  elements.formAddGoal.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = elements.goalName.value;
    const target = parseFloat(elements.goalTarget.value);
    const current = parseFloat(elements.goalCurrent.value) || 0;
    const color = document.querySelector('input[name="goal-color-choice"]:checked').value;

    try {
      await storage.addGoal({ name, target, current, color });
      closeModal(elements.modalAddGoal);
      elements.formAddGoal.reset();
      await loadState();
      renderAll();
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  });

  // Goal Action Modal triggers
  elements.btnCloseGoalActionModal.addEventListener('click', () => closeModal(elements.modalGoalAction));
  elements.btnCancelGoalActionModal.addEventListener('click', () => closeModal(elements.modalGoalAction));

  // Form Submission: Goal Contribution / Withdrawal
  elements.formGoalAction.addEventListener('submit', async (e) => {
    e.preventDefault();

    const goalId = elements.goalActionId.value;
    const amount = parseFloat(elements.goalActionAmount.value) || 0;
    const operation = document.querySelector('input[name="goal-operation"]:checked').value;
    
    const goal = state.goals.find(g => g.id === goalId);
    if (goal) {
      let newCurrent = goal.current;
      if (operation === 'deposit') {
        newCurrent += amount;
      } else {
        newCurrent = Math.max(0, newCurrent - amount);
      }
      
      try {
        await storage.updateGoalProgress(goalId, newCurrent);
        closeModal(elements.modalGoalAction);
        await loadState();
        renderAll();
      } catch (err) {
        console.error('Failed to update goal progress:', err);
      }
    }
  });

  // Global Ledger Table Click Handler (Dynamic Edit/Delete Buttons)
  elements.transactionListBody.addEventListener('click', async (e) => {
    const btnEdit = e.target.closest('.btn-edit');
    const btnDelete = e.target.closest('.btn-delete');

    if (btnEdit) {
      const id = btnEdit.getAttribute('data-id');
      openTxModal(id);
    } else if (btnDelete) {
      const id = btnDelete.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this transaction?')) {
        try {
          await storage.deleteTransaction(id);
          await loadState();
          renderAll();
        } catch (err) {
          console.error('Failed to delete transaction:', err);
        }
      }
    }
  });

  // Global Goals List Click Handler (Manage Goal, Delete Goal)
  elements.goalsListContainer.addEventListener('click', async (e) => {
    const btnManage = e.target.closest('.btn-goal-manage');
    const btnDeleteGoal = e.target.closest('.btn-delete-goal');

    if (btnManage) {
      const id = btnManage.getAttribute('data-id');
      openGoalActionModal(id);
    } else if (btnDeleteGoal) {
      const id = btnDeleteGoal.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this savings goal?')) {
        try {
          await storage.deleteGoal(id);
          await loadState();
          renderAll();
        } catch (err) {
          console.error('Failed to delete savings goal:', err);
        }
      }
    }
  });

  // Navigation Link Triggers (Scroll to anchors)
  elements.navDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('.stats-row').scrollIntoView({ behavior: 'smooth' });
    setActiveLink(elements.navDashboard);
  });

  elements.navLedger.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('section-ledger').scrollIntoView({ behavior: 'smooth' });
    setActiveLink(elements.navLedger);
  });

  elements.navBudgets.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('section-budgets').scrollIntoView({ behavior: 'smooth' });
    setActiveLink(elements.navBudgets);
  });

  elements.navGoals.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('section-goals').scrollIntoView({ behavior: 'smooth' });
    setActiveLink(elements.navGoals);
  });
}

function setActiveLink(activeEl) {
  [elements.navDashboard, elements.navLedger, elements.navBudgets, elements.navGoals].forEach(el => {
    el.classList.remove('active');
  });
  activeEl.classList.add('active');
}

// Start
init();
