import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, IndianRupee, AlertTriangle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Charts } from '../components/Charts';
import { formatINR } from '../utils/formatCurrency';

interface DashboardTabProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ setActiveTab }) => {
  const { transactions, budgets, totals } = useFinance();

  // Get recent 5 transactions
  const recentTransactions = transactions.slice(0, 5);

  // Compute category spending to show budget alerts
  const categorySpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const budgetAlerts = budgets
    .map(b => {
      const spent = categorySpent[b.category] || 0;
      const ratio = b.limit > 0 ? spent / b.limit : 0;
      return { category: b.category, limit: b.limit, spent, ratio };
    })
    .filter(alert => alert.ratio >= 0.8)
    .sort((a, b) => b.ratio - a.ratio);

  return (
    <div className="tab-content dashboard-tab">
      {/* Metric Cards Grid */}
      <div className="metrics-grid">
        {/* Net Worth Card */}
        <div className="metric-card glass">
          <div className="card-header">
            <span className="card-lbl">Net Balance</span>
            <div className="card-icon-wrapper balance-icon">
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="card-body">
            <h3 className={totals.netBalance >= 0 ? 'text-success' : 'text-danger'}>
              {formatINR(totals.netBalance)}
            </h3>
            <p className="card-subtext">Total cashflow net worth</p>
          </div>
        </div>

        {/* Income Card */}
        <div className="metric-card glass">
          <div className="card-header">
            <span className="card-lbl">Total Income</span>
            <div className="card-icon-wrapper income-icon">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="card-body">
            <h3 className="text-success">
              {formatINR(totals.income)}
            </h3>
            <p className="card-subtext">Deposits & salary</p>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="metric-card glass">
          <div className="card-header">
            <span className="card-lbl">Total Expenses</span>
            <div className="card-icon-wrapper expense-icon">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <div className="card-body">
            <h3 className="text-danger">
              {formatINR(totals.expenses)}
            </h3>
            <p className="card-subtext">Withdrawals & shopping</p>
          </div>
        </div>

        {/* Savings Rate Card */}
        <div className="metric-card glass">
          <div className="card-header">
            <span className="card-lbl">Savings Rate</span>
            <div className="card-icon-wrapper savings-icon">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="card-body">
            <h3 className="text-info">
              {totals.savingsRate.toFixed(1)}%
            </h3>
            <p className="card-subtext">
              Target rate: 20%
            </p>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <Charts transactions={transactions} />

      {/* Alerts and Recent Ledger Grid */}
      <div className="dashboard-grid">
        {/* Budget Alerts Panel */}
        <div className="dashboard-panel glass alert-panel">
          <div className="panel-header">
            <h4>Budget Risk Alerts</h4>
            <span className="panel-count badge-warn">{budgetAlerts.length}</span>
          </div>
          <div className="panel-body">
            {budgetAlerts.length === 0 ? (
              <div className="panel-empty">
                <p>All budgets are within safe spending ranges.</p>
              </div>
            ) : (
              <div className="alerts-list">
                {budgetAlerts.map(alert => (
                  <div key={alert.category} className="alert-item">
                    <div className="alert-item-top">
                      <div className="alert-cat-name">
                        <AlertTriangle className={alert.ratio >= 1 ? 'text-danger animate-pulse' : 'text-warning'} size={16} />
                        <span>{alert.category}</span>
                      </div>
                      <span className="alert-ratio-text">
                        {alert.ratio >= 1 ? 'Exceeded' : 'Near Limit'} ({Math.round(alert.ratio * 100)}%)
                      </span>
                    </div>
                    <div className="alert-progress-bar">
                      <div
                        className={`alert-progress-fill ${alert.ratio >= 1 ? 'bg-danger' : 'bg-warning'}`}
                        style={{ width: `${Math.min(alert.ratio * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="alert-amounts">
                      <span>Spent: {formatINR(alert.spent)}</span>
                      <span>Limit: {formatINR(alert.limit)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Ledger Panel */}
        <div className="dashboard-panel glass recent-ledger-panel">
          <div className="panel-header">
            <h4>Recent Activity</h4>
            <button className="panel-action-btn" onClick={() => setActiveTab('ledger')}>
              View Ledger
            </button>
          </div>
          <div className="panel-body">
            {recentTransactions.length === 0 ? (
              <div className="panel-empty">No transaction history found</div>
            ) : (
              <div className="recent-list">
                {recentTransactions.map(tx => (
                  <div key={tx.id} className="recent-item">
                    <div className="recent-item-left">
                      <div className={`tx-indicator-dot ${tx.type}`}></div>
                      <div className="recent-item-desc">
                        <div className="recent-title text-truncate">{tx.description}</div>
                        <div className="recent-meta">
                          <span className="recent-cat">{tx.category}</span>
                          <span className="recent-dot-sep">&bull;</span>
                          <span className="recent-date">{tx.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`recent-amount ${tx.type === 'income' ? 'text-success' : 'text-danger'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatINR(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
