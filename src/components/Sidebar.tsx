import React from 'react';
import { LayoutDashboard, ReceiptText, Wallet, Target, TrendingUp, Coins } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ledger', label: 'Transaction Ledger', icon: ReceiptText },
    { id: 'budgets', label: 'Category Budgets', icon: Wallet },
    { id: 'goals', label: 'Savings Goals', icon: Target },
    { id: 'insights', label: 'Financial Insights', icon: TrendingUp }
  ];

  return (
    <aside className="app-sidebar glass">
      <div className="sidebar-brand">
        <Coins className="brand-icon" size={28} />
        <h2>ApexFinance</h2>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="nav-icon" size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <p className="footer-label">Mock Full-Stack App</p>
        <p className="footer-sublabel">Front-End Ledged Sandbox</p>
      </div>
    </aside>
  );
};
