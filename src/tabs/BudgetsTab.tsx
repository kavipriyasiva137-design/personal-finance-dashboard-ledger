import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck, Wallet } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatINR } from '../utils/formatCurrency';
import { Modal } from '../components/Modal';

export const BudgetsTab: React.FC = () => {
  const { transactions, budgets, categories, updateBudget, deleteBudget } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState('');
  const [formLimit, setFormLimit] = useState('');
  const [error, setError] = useState('');

  // Calculate actual spending by category
  const categorySpent = React.useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [transactions]);

  // List of categories that don't have budgets configured yet
  const availableCategories = React.useMemo(() => {
    const budgetedCats = budgets.map(b => b.category);
    return categories.filter(cat => !budgetedCats.includes(cat) && cat !== 'Salary' && cat !== 'Freelance');
  }, [budgets, categories]);

  const handleOpenModal = (category = '', currentLimit = '') => {
    setSelectedCat(category || availableCategories[0] || '');
    setFormLimit(currentLimit);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedLimit = parseFloat(formLimit);
    if (!selectedCat) {
      setError('Please choose a category.');
      return;
    }
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setError('Please enter a valid budget limit greater than 0.');
      return;
    }

    updateBudget(selectedCat, parsedLimit);
    setIsModalOpen(false);
  };

  const handleDelete = (category: string) => {
    if (window.confirm(`Are you sure you want to remove the budget for ${category}?`)) {
      deleteBudget(category);
    }
  };

  return (
    <div className="tab-content budgets-tab">
      {/* Top Banner & Control */}
      <div className="budgets-header-row glass">
        <div className="banner-left">
          <Wallet className="banner-icon text-primary animate-pulse" size={24} />
          <div>
            <h3>Monthly Spending Limits</h3>
            <p className="text-muted">Control your outflow by setting thresholds per category</p>
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={() => handleOpenModal()}
          disabled={availableCategories.length === 0}
        >
          <Plus size={16} />
          <span>Set Category Budget</span>
        </button>
      </div>

      {/* Budgets Grid */}
      <div className="budgets-grid">
        {budgets.length === 0 ? (
          <div className="budgets-empty glass">
            <ShieldCheck size={48} className="empty-icon text-success" />
            <h4>No active budgets set</h4>
            <p>Setting budgets helps you track spending and build savings. Create your first budget now!</p>
            <button className="btn-primary" onClick={() => handleOpenModal()}>
              Set Category Budget
            </button>
          </div>
        ) : (
          budgets.map(b => {
            const spent = categorySpent[b.category] || 0;
            const remaining = b.limit - spent;
            const percent = b.limit > 0 ? (spent / b.limit) * 100 : 0;
            
            // Set caution levels
            let statusClass = 'safe';
            if (percent >= 100) statusClass = 'exceeded';
            else if (percent >= 75) statusClass = 'warning';

            return (
              <div key={b.category} className={`budget-card glass border-${statusClass}`}>
                <div className="budget-card-header">
                  <span className="budget-cat-name">{b.category}</span>
                  <div className="budget-card-actions">
                    <button className="budget-action-btn edit" onClick={() => handleOpenModal(b.category, b.limit.toString())} title="Edit budget">
                      <Edit2 size={13} />
                    </button>
                    <button className="budget-action-btn delete" onClick={() => handleDelete(b.category)} title="Delete budget">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="budget-amounts-row">
                  <div className="amt-box">
                    <span className="amt-lbl">Spent</span>
                    <span className="amt-val font-mono">{formatINR(spent)}</span>
                  </div>
                  <div className="amt-box text-right">
                    <span className="amt-lbl">Limit</span>
                    <span className="amt-val font-mono">{formatINR(b.limit)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="budget-progress-container">
                  <div
                    className={`budget-progress-bar bg-${statusClass}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  ></div>
                </div>

                <div className="budget-card-footer">
                  <span className={`budget-status-text text-${statusClass}`}>
                    {percent >= 100
                      ? `Over budget by ${formatINR(Math.abs(remaining))}`
                      : percent >= 75
                      ? `Close to limit: ${formatINR(remaining)} remaining`
                      : `${formatINR(remaining)} remaining in safe range`}
                  </span>
                  <span className="budget-percent font-mono">{percent.toFixed(0)}%</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Set/Edit Budget Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configure Budget Limit">
        <form onSubmit={handleSubmit} className="budget-form">
          {error && <div className="form-alert alert-error">{error}</div>}

          <div className="form-field">
            <label htmlFor="budget-category">Spending Category</label>
            {/* If editing, category is read-only. Otherwise, dropdown */}
            {budgets.some(b => b.category === selectedCat) ? (
              <input
                type="text"
                id="budget-category"
                value={selectedCat}
                disabled
                className="input-disabled"
              />
            ) : (
              <select
                id="budget-category"
                value={selectedCat}
                onChange={e => setSelectedCat(e.target.value)}
              >
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="budget-limit">Monthly Limit (INR)</label>
            <input
              type="number"
              id="budget-limit"
              placeholder="e.g. 500"
              value={formLimit}
              onChange={e => setFormLimit(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Set Limit
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
