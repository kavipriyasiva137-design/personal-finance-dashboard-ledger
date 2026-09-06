import React, { useState, useEffect } from 'react';
import { WalletCards, LayoutDashboard, Receipt, PieChart, Target, Sun, Moon, LogOut, User } from 'lucide-react';

export default function Sidebar({ user, onLogout, onOpenProfile }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [activeItem, setActiveItem] = useState('dashboard');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: theme }));
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleNavClick = (sectionId, itemName) => {
    setActiveItem(itemName);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <aside className="sidebar">
      <div className="logo-area">
        <div className="logo-icon">
          <WalletCards size={22} />
        </div>
        <span className="logo-text">Track My Money</span>
      </div>

      <nav className="nav-menu">
        <a
          href="#"
          className={`nav-item ${activeItem === 'dashboard' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); handleNavClick('section-stats', 'dashboard'); }}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </a>
        <a
          href="#"
          className={`nav-item ${activeItem === 'ledger' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); handleNavClick('section-ledger', 'ledger'); }}
        >
          <Receipt size={20} />
          <span>Ledger</span>
        </a>
        <a
          href="#"
          className={`nav-item ${activeItem === 'budgets' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); handleNavClick('section-budgets', 'budgets'); }}
        >
          <PieChart size={20} />
          <span>Budgets</span>
        </a>
        <a
          href="#"
          className={`nav-item ${activeItem === 'goals' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); handleNavClick('section-goals', 'goals'); }}
        >
          <Target size={20} />
          <span>Savings Goals</span>
        </a>
        <a
          href="#"
          className={`nav-item ${activeItem === 'profile' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); setActiveItem('profile'); onOpenProfile(); }}
        >
          <User size={20} />
          <span>Profile Settings</span>
        </a>
      </nav>

      <div className="sidebar-footer">
        <button onClick={toggleTheme} className="theme-btn" aria-label="Toggle Dark/Light Mode">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>Toggle Theme</span>
        </button>

        <button onClick={onLogout} className="theme-btn btn-logout" style={{ marginTop: '10px', borderColor: 'rgba(244, 63, 94, 0.2)', color: 'var(--danger)' }}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
