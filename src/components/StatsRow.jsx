import React, { useState } from 'react';
import { Wallet, ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react';
import PinModal from './PinModal';

export default function StatsRow({ transactions }) {
  const [showBalance, setShowBalance] = useState(false);
  const [isPinOpen, setIsPinOpen] = useState(false);

  // Calculate Totals (All transactions)
  let netBalance = 0;
  transactions.forEach(t => {
    if (t.type === 'income') {
      netBalance += t.amount;
    } else {
      netBalance -= t.amount;
    }
  });

  // Calculate Monthly Totals (Current calendar month in UTC to align with DB dates)
  const now = new Date();
  const currentMonth = now.getUTCMonth();
  const currentYear = now.getUTCFullYear();

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

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const isHighSavings = savingsRate >= 20;

  const handlePinVerified = () => {
    setShowBalance(true);
    setIsPinOpen(false);
  };

  return (
    <>
      <section className="stats-row" id="section-stats">
        {/* Card 1: Net Worth with GPay PIN Security */}
        <div className="stat-card card-glow-primary">
          <div className="card-header">
            <span className="card-title">Bank Account Balance</span>
            <span className="stat-icon icon-primary"><Wallet size={20} /></span>
          </div>
          
          {showBalance ? (
            <div className="card-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{formatCurrency(netBalance)}</span>
              <button 
                onClick={() => setShowBalance(false)} 
                className="action-btn"
                title="Hide Balance"
                style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <EyeOff size={18} />
              </button>
            </div>
          ) : (
            <div style={{ margin: '10px 0 14px' }}>
              <button 
                onClick={() => setIsPinOpen(true)}
                className="btn btn-primary btn-sm"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }}
              >
                <Eye size={14} style={{ marginRight: '6px' }} />
                Check Bank Balance
              </button>
            </div>
          )}

          <div className="card-footer">
            <span className={`trend ${isHighSavings ? 'trend-up' : 'trend-down'}`}>
              {isHighSavings ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{savingsRate.toFixed(0)}%</span>
            </span>
            <span className="footer-desc">savings rate this month</span>
          </div>
        </div>

        {/* Card 2: Income */}
        <div className="stat-card card-glow-success">
          <div className="card-header">
            <span className="card-title">Monthly Income</span>
            <span className="stat-icon icon-success"><ArrowDownRight size={20} /></span>
          </div>
          <div className="card-value">{formatCurrency(monthlyIncome)}</div>
          <div className="card-footer">
            <span className="footer-desc">
              {monthlyIncomeCount} transaction{monthlyIncomeCount !== 1 ? 's' : ''} this month
            </span>
          </div>
        </div>

        {/* Card 3: Expenses */}
        <div className="stat-card card-glow-danger">
          <div className="card-header">
            <span className="card-title">Monthly Expenses</span>
            <span className="stat-icon icon-danger"><ArrowUpRight size={20} /></span>
          </div>
          <div className="card-value">{formatCurrency(monthlyExpenses)}</div>
          <div className="card-footer">
            <span className="footer-desc">
              {monthlyExpenseCount} transaction{monthlyExpenseCount !== 1 ? 's' : ''} this month
            </span>
          </div>
        </div>
      </section>

      {/* Secure PIN entry before checking balance */}
      <PinModal
        isOpen={isPinOpen}
        onSubmit={handlePinVerified}
        onClose={() => setIsPinOpen(false)}
        title="Check Bank Balance"
        subtitle="Verify your identity with UPI PIN"
      />
    </>
  );
}
