import React, { useState, useMemo } from 'react';
import { storage } from '../storage';
import { Search, Download, Edit3, Trash2, FileQuestion } from 'lucide-react';

export default function LedgerTable({ transactions, onEditTx, onRefresh }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  const getAvatarDetails = (tx) => {
    const name = tx.description || 'Unknown';
    const firstChar = name.charAt(0).toUpperCase();
    const colors = [
      '#1a73e8', // Blue
      '#1e8e3e', // Green
      '#f9ab00', // Yellow
      '#d93025', // Red
      '#9b51e0', // Purple
      '#e52592', // Pink
      '#12b5cb', // Cyan
      '#ff7a00', // Orange
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    return {
      char: firstChar,
      color: colors[colorIndex]
    };
  };

  // Categories list
  const allCategories = useMemo(() => {
    const cats = storage.getCategories();
    return [...cats.INCOME, ...cats.EXPENSE];
  }, []);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Search filter
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      result = result.filter(t => t.description.toLowerCase().includes(q));
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [transactions, search, typeFilter, categoryFilter, sortBy]);

  // Handle transaction delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await storage.deleteTransaction(id);
        onRefresh();
      } catch (err) {
        console.error('Failed to delete transaction:', err);
      }
    }
  };

  // CSV Export utility
  const exportToCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const csvRows = [headers.join(',')];

    filteredTransactions.forEach(t => {
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
    link.setAttribute('download', `track_my_money_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const formatDate = (dateString) => {
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  return (
    <section className="ledger-card card" id="section-ledger">
      <div className="section-header">
        <div className="section-title-wrapper">
          <h2>Recent Activity</h2>
          <p className="subtitle">Google Pay style transaction history and timeline</p>
        </div>
        <div className="ledger-actions">
          <button className="btn btn-secondary btn-sm" onClick={exportToCSV} disabled={filteredTransactions.length === 0}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter controls */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="Search people, businesses, categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="income">Income / Received</option>
            <option value="expense">Expense / Paid</option>
          </select>

          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Amount: High-Low</option>
            <option value="amount-asc">Amount: Low-High</option>
          </select>
        </div>
      </div>

      {/* GPay style activity list */}
      <div className="gpay-activity-wrapper">
        <div className="gpay-activity-list">
          {filteredTransactions.map(tx => {
            const avatar = getAvatarDetails(tx);
            const isIncome = tx.type === 'income';
            return (
              <div className="gpay-activity-item" key={tx.id}>
                <div className="gpay-activity-left">
                  <div className="gpay-activity-avatar" style={{ backgroundColor: avatar.color }}>
                    {avatar.char}
                  </div>
                  <div className="gpay-activity-details">
                    <div className="gpay-activity-title">{tx.description}</div>
                    <div className="gpay-activity-subtitle">
                      <span className="gpay-activity-time">{formatDate(tx.date)}</span>
                      <span className="gpay-activity-dot">•</span>
                      <span className="badge badge-category">{tx.category}</span>
                      {tx.address && (
                        <>
                          <span className="gpay-activity-dot">•</span>
                          <span className="gpay-activity-loc">📍 {tx.address}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="gpay-activity-right">
                  <div className={`gpay-activity-amount-box ${isIncome ? 'income' : 'expense'}`}>
                    <span className="gpay-activity-sign">{isIncome ? '+' : '-'}</span>
                    <span className="gpay-activity-val">{formatCurrency(tx.amount)}</span>
                  </div>
                  <div className="gpay-activity-actions">
                    <button className="gpay-activity-btn edit" title="Edit transaction" onClick={() => onEditTx(tx)}>
                      <Edit3 size={14} />
                    </button>
                    <button className="gpay-activity-btn delete" title="Delete transaction" onClick={() => handleDelete(tx.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredTransactions.length === 0 && (
          <div className="empty-state">
            <FileQuestion size={40} />
            <p>No transactions found matching your filters.</p>
          </div>
        )}
      </div>
    </section>
  );
}
