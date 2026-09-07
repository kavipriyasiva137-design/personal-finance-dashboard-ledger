import React, { useState } from 'react';
import { Sun, Moon, Calendar, IndianRupee, Send, LogOut, ShieldCheck, RotateCcw } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatINR } from '../utils/formatCurrency';

interface HeaderProps {
  activeTab: string;
  userName?: string;
  userEmail?: string;
  onLockApp?: () => void;
  onOpenPayModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  userName = 'Kavipriya',
  userEmail = 'kavipriya@gmail.com',
  onLockApp,
  onOpenPayModal
}) => {
  const { theme, toggleTheme, totals, resetData } = useFinance();
  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefresh = () => {
    setIsSpinning(true);
    resetData();
    setTimeout(() => {
      setIsSpinning(false);
    }, 600);
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Financial Overview';
      case 'ledger': return 'Transaction Ledger';
      case 'budgets': return 'Category Budgets';
      case 'goals': return 'Savings Goals';
      case 'insights': return 'Wealth Insights';
      default: return 'Finance Dashboard';
    }
  };

  const getTodayDateStr = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString(undefined, options);
  };

  return (
    <header className="app-header glass">
      <div className="header-left">
        <h1>{getTitle()}</h1>
        <div className="header-date">
          <Calendar size={14} className="date-icon" />
          <span>{getTodayDateStr()}</span>
        </div>
      </div>

      <div className="header-right">
        {/* Quick Pay Button */}
        {onOpenPayModal && (
          <button className="gpay-header-pay-btn" onClick={onOpenPayModal}>
            <Send size={15} /> Quick Pay (UPI)
          </button>
        )}

        {/* Available Liquidity Stats */}
        <div className="header-liquidity">
          <IndianRupee size={18} className="liq-icon" />
          <div className="liq-details">
            <span className="liq-lbl">Liquidity</span>
            <span className={`liq-val ${totals.availableBalance < 0 ? 'text-danger' : 'text-success'}`}>
              {formatINR(totals.availableBalance)}
            </span>
          </div>
        </div>

        {/* Refresh Amounts Button */}
        <button
          className="theme-toggle"
          onClick={handleRefresh}
          title="Refresh All Amounts & Balances"
          aria-label="Refresh All Amounts & Balances"
        >
          <RotateCcw size={18} className={isSpinning ? 'spin-icon' : ''} />
        </button>

        {/* Security Lock Button */}
        <div className="header-user-badge">
          {onLockApp && (
            <button
              className="lock-app-btn"
              onClick={onLockApp}
              title="Lock Application Session"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  );
};

