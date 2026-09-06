import React, { useMemo } from 'react';
import { Sliders } from 'lucide-react';

export default function BudgetsList({ transactions, budgets, onAdjust }) {
  // Calculate spent category sums for the current month in UTC
  const budgetSpent = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();

    const totals = {};
    
    // Initialize
    Object.keys(budgets).forEach(cat => {
      totals[cat] = 0;
    });

    transactions.forEach(t => {
      if (t.type === 'expense') {
        const d = new Date(t.date);
        if (d.getUTCMonth() === currentMonth && d.getUTCFullYear() === currentYear) {
          totals[t.category] = (totals[t.category] || 0) + t.amount;
        }
      }
    });

    return totals;
  }, [transactions, budgets]);

  return (
    <section className="card" id="section-budgets">
      <div className="section-header">
        <div className="section-title-wrapper">
          <h2>Budgets</h2>
          <p className="subtitle">Monthly spending caps</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={onAdjust}>
          <Sliders size={14} />
          <span>Adjust</span>
        </button>
      </div>

      <div className="budget-items-list">
        {Object.keys(budgets).map(cat => {
          const limit = budgets[cat];
          const spent = budgetSpent[cat] || 0;
          const percentage = limit > 0 ? (spent / limit) * 100 : 0;
          const cappedPercentage = Math.min(100, percentage);

          // Get progress bar color class
          let colorClass = 'bg-safe';
          if (percentage > 90) {
            colorClass = 'bg-danger';
          } else if (percentage > 75) {
            colorClass = 'bg-warning';
          }

          return (
            <div key={cat} className="budget-item">
              <div className="budget-meta">
                <span className="budget-cat">{cat}</span>
                <span className="budget-nums">
                  <span>${spent.toFixed(0)}</span> of <span>${limit.toFixed(0)}</span>
                </span>
              </div>
              <div className="budget-progress-track">
                <div 
                  className={`budget-progress-bar ${colorClass}`} 
                  style={{ width: `${cappedPercentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
