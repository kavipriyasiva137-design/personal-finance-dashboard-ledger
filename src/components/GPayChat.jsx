import React, { useState, useMemo, useEffect } from 'react';
import { X, Send, ArrowDownLeft, ArrowUpRight, ShieldCheck, CheckCircle, CreditCard, Landmark, Wallet, Lock, AlertCircle } from 'lucide-react';
import PinModal from './PinModal';
import { storage } from '../storage';

const EXPENSE_CATEGORIES = ['Food', 'Housing', 'Transport', 'Utilities', 'Entertainment', 'Education', 'Shopping', 'Health', 'Travel', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investments', 'Other Income'];

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI / GPay', icon: Wallet, color: '#1a73e8' },
  { id: 'bank', label: 'Bank Transfer', icon: Landmark, color: '#1e8e3e' },
  { id: 'card', label: 'Debit / Credit Card', icon: CreditCard, color: '#e52592' },
];

export default function GPayChat({ isOpen, contact, transactions, onClose, onRefresh, user }) {
  const [payAmount, setPayAmount] = useState('');
  const [payDesc, setPayDesc] = useState('');
  const [showPayForm, setShowPayForm] = useState(false);
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [earnedCard, setEarnedCard] = useState(null);
  const [chatLocation, setChatLocation] = useState('Anna Nagar, Chennai, TN');

  useEffect(() => {
    if (isOpen && contact) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude.toFixed(4);
            const lng = position.coords.longitude.toFixed(4);
            const mocks = [
              'OMR IT Corridor, Chennai, TN',
              'Anna Nagar, Chennai, TN',
              'Gandhipuram, Coimbatore, TN',
              'Race Course, Coimbatore, TN',
              'Simmakkal, Madurai, TN',
              'Nungambakkam, Chennai, TN',
              'Adyar, Chennai, TN',
              'Phoenix Marketcity, Velachery, TN'
            ];
            const index = Math.abs(Math.floor(position.coords.latitude + position.coords.longitude)) % mocks.length;
            setChatLocation(`${mocks[index]} (GPS: ${lat}, ${lng})`);
          },
          (error) => {
            setChatLocation('Anna Nagar, Chennai, TN (Mock Location)');
          }
        );
      } else {
        setChatLocation('Anna Nagar, Chennai, TN (Mock Location)');
      }
    }
  }, [isOpen, contact]);

  // New: payment method, category type, category, password verification
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [txType, setTxType] = useState('expense');
  const [txCategory, setTxCategory] = useState('');
  const [showPasswordVerify, setShowPasswordVerify] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const categories = txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // Filter transactions associated with this contact (must be called before early return)
  const chatTransactions = useMemo(() => {
    if (!contact) return [];
    return transactions.filter(tx => {
      const descMatch = tx.description.toLowerCase().includes(contact.name.toLowerCase());
      const catMatch = tx.category.toLowerCase() === contact.category.toLowerCase();
      return descMatch || catMatch;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [transactions, contact]);

  if (!isOpen || !contact) return null;

  const handlePayClick = () => {
    setShowPayForm(true);
    setTxCategory(contact.category || categories[0]);
  };

  const handlePaySubmit = (e) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) return;
    // Grant direct access to UPI PIN payment verification
    setIsPinOpen(true);
  };

  // Verify account password before allowing payment
  const handlePasswordVerify = async (e) => {
    e.preventDefault();
    setPasswordError('');

    try {
      // Verify password via login endpoint
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userObj.email || '', password: passwordInput })
      });

      if (!res.ok) {
        setPasswordError('Incorrect password. Please try again.');
        return;
      }

      // Password verified — close password modal and open UPI PIN
      setShowPasswordVerify(false);
      setPasswordInput('');
      setIsPinOpen(true);
    } catch (err) {
      console.error('Password verification failed:', err);
      setPasswordError('Verification error. Please try again.');
    }
  };

  // Submit the payment to backend once UPI PIN is verified
  const handlePinSubmit = async () => {
    setIsPinOpen(false);
    
    const selectedMethod = PAYMENT_METHODS.find(m => m.id === paymentMethod);
    const methodLabel = selectedMethod ? selectedMethod.label : 'UPI';

    const txData = {
      description: payDesc.trim() || `${contact.name} — ${methodLabel}`,
      type: txType,
      category: txCategory || contact.category,
      amount: parseFloat(payAmount),
      date: new Date().toISOString().split('T')[0],
      address: chatLocation
    };

    try {
      const res = await storage.addTransaction(txData);
      setPayAmount('');
      setPayDesc('');
      setShowPayForm(false);
      setPaymentMethod('upi');
      setTxType('expense');
      setTxCategory('');
      
      if (res.earnedRewardCard) {
        setEarnedCard(res.earnedRewardCard);
      }
      
      onRefresh();
    } catch (err) {
      console.error('Failed to pay via GPay chat:', err);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  };

  return (
    <div className="gpay-chat-backdrop">
      <div className="gpay-chat-card">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-avatar-wrapper">
            <div className="chat-avatar" style={{ backgroundColor: contact.color }}>
              {contact.name.charAt(0)}
            </div>
            <div className="chat-user-details">
              <h4>{contact.name}</h4>
              <p>{contact.phone || 'GPay Merchant'}</p>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose} aria-label="Close chat screen">
            <X size={20} />
          </button>
        </div>

        {/* Chat History List */}
        <div className="chat-messages-container">
          <div className="chat-security-disclaimer">
            <ShieldCheck size={14} className="security-icon" />
            <span>Payments are secured with Google 256-bit encryption</span>
          </div>

          {chatTransactions.length === 0 ? (
            <div className="chat-empty-state">
              <p>No past transactions. Tap pay to start transfer.</p>
            </div>
          ) : (
            chatTransactions.map(tx => {
              const isIncome = tx.type === 'income';
              return (
                <div key={tx.id} className={`chat-bubble-wrapper ${isIncome ? 'received' : 'sent'}`}>
                  <div className="chat-bubble">
                    <div className="bubble-header">
                      {isIncome ? (
                        <><ArrowDownLeft size={14} className="icon-green" /><span>Received</span></>
                      ) : (
                        <><ArrowUpRight size={14} className="icon-red" /><span>Paid</span></>
                      )}
                      <span style={{ marginLeft: 'auto', fontSize: '0.65rem', background: isIncome ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)', padding: '2px 6px', borderRadius: '6px', color: isIncome ? '#10b981' : '#f43f5e', fontWeight: 600 }}>
                        {tx.category}
                      </span>
                    </div>
                    <div className="bubble-amount">{formatCurrency(tx.amount)}</div>
                    <p className="bubble-description">{tx.description}</p>
                    <div className="bubble-footer" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <span>{formatDate(tx.date)}</span>
                        <span className="tx-status-tag" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <CheckCircle size={10} className="tick-icon" /> Completed
                        </span>
                      </div>
                      {tx.address && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px', opacity: 0.8 }}>
                          📍 {tx.address}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Dynamic Payment Form */}
        {showPayForm && (
          <div className="chat-pay-form-overlay">
            <form onSubmit={handlePaySubmit} className="chat-pay-form">
              {/* Payment Method Selection */}
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '8px' }}>Payment Method</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {PAYMENT_METHODS.map(m => {
                    const Icon = m.icon;
                    const isActive = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        style={{
                          flex: 1,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                          padding: '10px 6px', borderRadius: '12px', cursor: 'pointer',
                          border: isActive ? `2px solid ${m.color}` : '2px solid rgba(255,255,255,0.08)',
                          background: isActive ? `${m.color}15` : 'rgba(255,255,255,0.02)',
                          color: isActive ? m.color : 'var(--text-secondary)',
                          transition: 'all 0.2s ease',
                          fontSize: '0.7rem', fontWeight: 600
                        }}
                      >
                        <Icon size={18} />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Transaction Type Toggle */}
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '8px' }}>Transaction Type</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => { setTxType('expense'); setTxCategory(EXPENSE_CATEGORIES[0]); }}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                      border: txType === 'expense' ? '2px solid #f43f5e' : '2px solid rgba(255,255,255,0.08)',
                      background: txType === 'expense' ? 'rgba(244,63,94,0.12)' : 'rgba(255,255,255,0.02)',
                      color: txType === 'expense' ? '#f43f5e' : 'var(--text-secondary)',
                      fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ArrowUpRight size={16} /> Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTxType('income'); setTxCategory(INCOME_CATEGORIES[0]); }}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                      border: txType === 'income' ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.08)',
                      background: txType === 'income' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.02)',
                      color: txType === 'income' ? '#10b981' : 'var(--text-secondary)',
                      fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ArrowDownLeft size={16} /> Income
                  </button>
                </div>
              </div>

              {/* Category Selector */}
              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Category</label>
                <select
                  className="form-control"
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Amount + Description */}
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Amount</label>
                <input
                  type="number"
                  className="form-control amount-input"
                  placeholder="₹0.00"
                  step="0.01" min="0.01" required autoFocus
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <input
                  type="text"
                  className="form-control desc-input"
                  placeholder="Note (optional)"
                  value={payDesc}
                  onChange={(e) => setPayDesc(e.target.value)}
                />
              </div>

              <div className="chat-pay-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPayForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={14} /> Verify & Pay
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer Actions */}
        {!showPayForm && (
          <div className="chat-footer-actions">
            <button className="btn btn-secondary chat-action-btn" onClick={() => {
              setShowPayForm(true);
              setTxType('income');
              setTxCategory(contact.category || INCOME_CATEGORIES[0]);
            }}>
              Request
            </button>
            <button className="btn btn-primary chat-action-btn" onClick={handlePayClick}>
              Pay
            </button>
          </div>
        )}

        {/* Password Verification Modal */}
        {showPasswordVerify && (
          <div className="upi-pin-overlay" style={{ zIndex: 10002 }}>
            <div className="upi-pin-container" style={{ maxWidth: '380px', padding: '30px' }}>
              <div className="upi-header">
                <div className="upi-brand">
                  <Lock className="upi-icon" size={20} />
                  <span>Password Verification</span>
                </div>
                <button className="upi-close" onClick={() => { setShowPasswordVerify(false); setPasswordInput(''); setPasswordError(''); }} aria-label="Close">
                  <X size={20} />
                </button>
              </div>

              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                  Confirm payment of
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: txType === 'expense' ? '#f43f5e' : '#10b981', marginBottom: '4px' }}>
                  ${parseFloat(payAmount || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  to <strong>{contact.name}</strong> via {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.72rem', background: txType === 'expense' ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.12)', color: txType === 'expense' ? '#f43f5e' : '#10b981', padding: '3px 10px', borderRadius: '8px', fontWeight: 600 }}>
                  {txType === 'expense' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                  {txType.charAt(0).toUpperCase() + txType.slice(1)} · {txCategory}
                </div>
              </div>

              {passwordError && (
                <div className="error-banner" style={{ marginBottom: '12px', fontSize: '0.8rem', padding: '8px 12px' }}>
                  <AlertCircle size={14} /><span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordVerify}>
                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label className="form-label">Enter Account Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    required autoFocus
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    style={{ textAlign: 'center', fontSize: '1.1rem', letterSpacing: '3px' }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontWeight: 700 }}>
                  Verify Password
                </button>
              </form>
            </div>
          </div>
        )}

        {/* UPI PIN validation Modal */}
        <PinModal
          isOpen={isPinOpen}
          onSubmit={handlePinSubmit}
          onClose={() => setIsPinOpen(false)}
          title={`Paying ${contact.name}`}
          subtitle={`${PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label} · ${txCategory}`}
          amount={payAmount}
        />

        {/* GPay scratch card reward alert */}
        {earnedCard && (
          <div className="reward-alert-backdrop">
            <div className="reward-alert-card">
              <h3>🎉 Reward Earned!</h3>
              <p>You received a GPay Scratch Card for this transaction.</p>
              <div className="reward-alert-actions">
                <button className="btn btn-primary" onClick={() => { setEarnedCard(null); document.getElementById('section-rewards')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  View Scratch Card
                </button>
                <button className="btn btn-secondary" onClick={() => setEarnedCard(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
