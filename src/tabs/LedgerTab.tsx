import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Edit3, Download, Upload, ArrowUpDown, ChevronLeft, ChevronRight, X, IndianRupee } from 'lucide-react';
import { formatINR } from '../utils/formatCurrency';
import { GPayTransactionModal } from '../components/GPayTransactionModal';
import { useFinance } from '../context/FinanceContext';
import type { Transaction } from '../types';
import { Modal } from '../components/Modal';

export const LedgerTab: React.FC = () => {
  const {
    transactions,
    categories,
    addTransaction,
    editTransaction,
    deleteTransaction,
    importTransactions
  } = useFinance();

  // Ledger Filter & Search States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [catFilter, setCatFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // CRUD Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  // Form States
  const [formDate, setFormDate] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formCategory, setFormCategory] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formError, setFormError] = useState('');

  // Reset form helper
  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormDate(today);
    setFormDesc('');
    setFormAmount('');
    setFormType('expense');
    setFormCategory(categories[2] || 'Food & Dining'); // Default to first expense category
    setFormNote('');
    setFormError('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setSelectedTx(tx);
    setFormDate(tx.date);
    setFormDesc(tx.description);
    setFormAmount(tx.amount.toString());
    setFormType(tx.type);
    setFormCategory(tx.category);
    setFormNote(tx.note || '');
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent, mode: 'add' | 'edit') => {
    e.preventDefault();
    setFormError('');

    const parsedAmount = parseFloat(formAmount);
    if (!formDesc.trim()) {
      setFormError('Description is required.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!formDate) {
      setFormError('Date is required.');
      return;
    }
    if (!formCategory) {
      setFormError('Category is required.');
      return;
    }

    const txPayload = {
      date: formDate,
      description: formDesc.trim(),
      amount: parsedAmount,
      type: formType,
      category: formCategory,
      note: formNote.trim() || undefined
    };

    if (mode === 'add') {
      addTransaction(txPayload);
      setIsAddModalOpen(false);
    } else if (mode === 'edit' && selectedTx) {
      editTransaction({
        ...txPayload,
        id: selectedTx.id
      });
      setIsEditModalOpen(false);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(id);
    }
  };

  // Filtered & Sorted Transactions
  const processedTransactions = useMemo(() => {
    let result = [...transactions];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        t =>
          t.description.toLowerCase().includes(q) ||
          (t.note && t.note.toLowerCase().includes(q)) ||
          t.category.toLowerCase().includes(q) ||
          t.amount.toString().includes(q)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter);
    }

    // Category filter
    if (catFilter !== 'all') {
      result = result.filter(t => t.category === catFilter);
    }

    // Date range filter
    if (startDate) {
      result = result.filter(t => t.date >= startDate);
    }
    if (endDate) {
      result = result.filter(t => t.date <= endDate);
    }

    // Sort operations
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = a.date.localeCompare(b.date);
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [transactions, search, typeFilter, catFilter, startDate, endDate, sortBy, sortOrder]);

  // Pagination Logic
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [processedTransactions, currentPage]);

  const totalPages = Math.max(1, Math.ceil(processedTransactions.length / itemsPerPage));

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `apexfinance_ledger_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Note'];
    const rows = transactions.map(t => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      t.type,
      t.category,
      t.note ? `"${t.note.replace(/"/g, '""')}"` : ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `apexfinance_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON or CSV File
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        if (file.name.endsWith('.json')) {
          const imported = JSON.parse(content);
          if (Array.isArray(imported)) {
            // Basic validation
            const validTxs = imported.filter(t => t.date && t.description && typeof t.amount === 'number' && t.type && t.category);
            importTransactions(validTxs);
            alert(`Successfully imported ${validTxs.length} transactions from JSON!`);
          } else {
            alert('JSON must be an array of transaction objects.');
          }
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n');
          const importedTxs: Transaction[] = [];
          
          // Simple CSV parser
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Split by comma but respect double quotes
            const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
            if (matches.length >= 5) {
              const date = matches[0].replace(/"/g, '').trim();
              const description = matches[1].replace(/"/g, '').trim();
              const amount = parseFloat(matches[2].replace(/"/g, '').trim());
              const type = matches[3].replace(/"/g, '').trim() as 'income' | 'expense';
              const category = matches[4].replace(/"/g, '').trim();
              const note = matches[5] ? matches[5].replace(/"/g, '').trim() : '';

              if (date && description && !isNaN(amount) && (type === 'income' || type === 'expense') && category) {
                importedTxs.push({
                  id: `tx-imported-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  date,
                  description,
                  amount,
                  type,
                  category,
                  note: note || undefined
                });
              }
            }
          }
          
          if (importedTxs.length > 0) {
            importTransactions(importedTxs);
            alert(`Successfully imported ${importedTxs.length} transactions from CSV!`);
          } else {
            alert('No valid transactions found in CSV. Expected headers: Date, Description, Amount, Type, Category, Note');
          }
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse file. Make sure it is valid JSON or CSV format.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleToggleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="tab-content ledger-tab">
      {/* Search and Filter Panel */}
      <div className="ledger-controls-panel glass">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by description, category, notes, amount..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          />
          {search && (
            <button className="search-clear-btn" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filters-row">
          {/* Type Filter */}
          <div className="filter-group">
            <label>Type</label>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value as 'all' | 'income' | 'expense'); setCurrentPage(1); }}
            >
              <option value="all">All Types</option>
              <option value="income">Income (+)</option>
              <option value="expense">Expense (-)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="filter-group">
            <label>Category</label>
            <select
              value={catFilter}
              onChange={e => { setCatFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="filter-group">
            <label>From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* End Date */}
          <div className="filter-group">
            <label>To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="ledger-actions-row">
          <div className="bulk-actions">
                    <button className="btn-secondary" onClick={handleExportCSV}>
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button className="btn-secondary" onClick={handleExportJSON}>
              <Download size={14} />
              <span>Export JSON</span>
            </button>
            <button className="btn-secondary" onClick={() => setIsSendModalOpen(true)}>
              <IndianRupee size={14} />
              <span>Quick Pay (UPI)</span>
            </button>

            <label className="btn-secondary cursor-pointer">
              <Upload size={14} />
              <span>Import Ledger</span>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleImportFile}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <button className="btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="ledger-table-container glass">
        <table className="ledger-table">
          <thead>
            <tr>
              <th className="cursor-pointer" onClick={() => handleToggleSort('date')}>
                <div className="th-content">
                  <span>Date</span>
                  <ArrowUpDown size={12} className={sortBy === 'date' ? 'text-primary' : 'text-muted'} />
                </div>
              </th>
              <th>Category</th>
              <th>Description</th>
              <th className="text-right cursor-pointer" onClick={() => handleToggleSort('amount')}>
                <div className="th-content justify-end">
                  <span>Amount</span>
                  <ArrowUpDown size={12} className={sortBy === 'amount' ? 'text-primary' : 'text-muted'} />
                </div>
              </th>
              <th>Notes</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center table-empty">
                  No matching transactions found. Try expanding filters or adding a transaction.
                </td>
              </tr>
            ) : (
              paginatedTransactions.map(tx => (
                <tr key={tx.id}>
                  <td className="font-mono text-small">{tx.date}</td>
                  <td>
                    <span className={`category-pill cat-${tx.category.replace(/\s+/g, '-').toLowerCase()}`}>
                      {tx.category}
                    </span>
                  </td>
                  <td>
                    <div className="tx-description-cell">
                      <span className="font-medium">{tx.description}</span>
                    </div>
                  </td>
                  <td className={`text-right font-mono font-medium ${tx.type === 'income' ? 'text-success' : 'text-danger'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatINR(tx.amount)}
                  </td>
                  <td className="text-muted text-small text-truncate max-w-xs" title={tx.note}>
                    {tx.note || '--'}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="action-icon-btn edit-btn" onClick={() => handleOpenEditModal(tx)} title="Edit transaction">
                        <Edit3 size={14} />
                      </button>
                      <button className="action-icon-btn delete-btn" onClick={() => handleDelete(tx.id)} title="Delete transaction">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Panel */}
        {totalPages > 1 && (
          <div className="pagination-row">
            <span className="pagination-info">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedTransactions.length)} of {processedTransactions.length} entries
            </span>
            <div className="pagination-controls">
              <button
                className="btn-pagination"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = currentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    className={`btn-page-number ${isCurrent ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                className="btn-pagination"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Ledger Transaction">
        <form onSubmit={e => handleFormSubmit(e, 'add')} className="ledger-form">
          {formError && <div className="form-alert alert-error">{formError}</div>}
          
          <div className="form-group-row">
            <div className="form-field flex-1">
              <label htmlFor="tx-type">Transaction Flow</label>
              <div className="type-toggle-group">
                <button
                  type="button"
                  className={`type-btn expense ${formType === 'expense' ? 'selected' : ''}`}
                  onClick={() => setFormType('expense')}
                >
                  Expense
                </button>
                <button
                  type="button"
                  className={`type-btn income ${formType === 'income' ? 'selected' : ''}`}
                  onClick={() => setFormType('income')}
                >
                  Income
                </button>
              </div>
            </div>

            <div className="form-field flex-1">
              <label htmlFor="tx-date">Transaction Date</label>
              <input
                type="date"
                id="tx-date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="tx-desc">Description</label>
            <input
              type="text"
              id="tx-desc"
              placeholder="e.g. Target Grocery Run"
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
            />
          </div>

          <div className="form-group-row">
            <div className="form-field flex-1">
              <label htmlFor="tx-amount">Amount (INR)</label>
              <input
                type="number"
                step="0.01"
                id="tx-amount"
                placeholder="0.00"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value)}
              />
            </div>

            <div className="form-field flex-1">
              <label htmlFor="tx-cat">Category</label>
              <select
                id="tx-cat"
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="tx-note">Private Notes (Optional)</label>
            <textarea
              id="tx-note"
              rows={3}
              placeholder="Record any details about receipts or invoice splits..."
              value={formNote}
              onChange={e => setFormNote(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Record Transaction
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modify Ledger Record">
        <form onSubmit={e => handleFormSubmit(e, 'edit')} className="ledger-form">
          {formError && <div className="form-alert alert-error">{formError}</div>}

          <div className="form-group-row">
            <div className="form-field flex-1">
              <label htmlFor="tx-edit-type">Transaction Flow</label>
              <div className="type-toggle-group">
                <button
                  type="button"
                  className={`type-btn expense ${formType === 'expense' ? 'selected' : ''}`}
                  onClick={() => setFormType('expense')}
                >
                  Expense
                </button>
                <button
                  type="button"
                  className={`type-btn income ${formType === 'income' ? 'selected' : ''}`}
                  onClick={() => setFormType('income')}
                >
                  Income
                </button>
              </div>
            </div>

            <div className="form-field flex-1">
              <label htmlFor="tx-edit-date">Transaction Date</label>
              <input
                type="date"
                id="tx-edit-date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="tx-edit-desc">Description</label>
            <input
              type="text"
              id="tx-edit-desc"
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
            />
          </div>

          <div className="form-group-row">
            <div className="form-field flex-1">
              <label htmlFor="tx-edit-amount">Amount (INR)</label>
              <input
                type="number"
                step="0.01"
                id="tx-edit-amount"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value)}
              />
            </div>

            <div className="form-field flex-1">
              <label htmlFor="tx-edit-cat">Category</label>
              <select
                id="tx-edit-cat"
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="tx-edit-note">Private Notes (Optional)</label>
            <textarea
              id="tx-edit-note"
              rows={3}
              value={formNote}
              onChange={e => setFormNote(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
      <GPayTransactionModal isOpen={isSendModalOpen} onClose={() => setIsSendModalOpen(false)} />
    </div>
  );
};
