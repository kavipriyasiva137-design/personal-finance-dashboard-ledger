import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../storage';
import { X, Lock, KeyRound, Fingerprint } from 'lucide-react';
import PatternLock from './PatternLock';

export default function Modals({
  activeModal,
  onClose,
  editingTransaction,
  activeGoalId,
  goals,
  budgets,
  onRefresh,
  user,
  onProfileUpdate
}) {
  // Common states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. Transaction Form States
  const [txDesc, setTxDesc] = useState('');
  const [txType, setTxType] = useState('expense');
  const [txCategory, setTxCategory] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState('');
  const [txAddress, setTxAddress] = useState('');

  const staticCategories = useMemo(() => storage.getCategories(), []);
  const formCategories = useMemo(() => {
    return txType === 'income' ? staticCategories.INCOME : staticCategories.EXPENSE;
  }, [txType, staticCategories]);

  // Sync category on type change
  useEffect(() => {
    if (formCategories.length > 0) {
      // Keep category if it exists in the new list, else pick first
      if (!formCategories.includes(txCategory)) {
        setTxCategory(formCategories[0]);
      }
    }
  }, [txType, formCategories, txCategory]);

  // Sync Transaction editing fields
  useEffect(() => {
    if (activeModal === 'transaction') {
      if (editingTransaction) {
        setTxDesc(editingTransaction.description);
        setTxType(editingTransaction.type);
        setTxCategory(editingTransaction.category);
        setTxAmount((editingTransaction.amount ?? '').toString());
        setTxDate(editingTransaction.date);
        setTxAddress(editingTransaction.address || '');
      } else {
        setTxDesc('');
        setTxType('expense');
        setTxCategory(staticCategories.EXPENSE[0]);
        setTxAmount('');
        setTxDate(new Date().toISOString().split('T')[0]);
        setTxAddress('Online Transaction');
      }
    }
  }, [activeModal, editingTransaction, staticCategories]);

  // --- 2. Budget limits Form States
  const [budgetInputs, setBudgetInputs] = useState({});
  useEffect(() => {
    if (activeModal === 'budgets' && budgets) {
      setBudgetInputs({ ...budgets });
    }
  }, [activeModal, budgets]);

  // --- 3. Add Goal Form States
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalColor, setGoalColor] = useState('#6366f1');

  // --- 4. Goal Action (Deposit / Withdraw) Form States
  const [goalActionOp, setGoalActionOp] = useState('deposit'); // deposit, withdraw
  const [goalActionAmt, setGoalActionAmt] = useState('');

  // --- 5. Profile Form States
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileBankName, setProfileBankName] = useState('');
  const [profileAccountNumber, setProfileAccountNumber] = useState('');
  const [profileGpayPin, setProfileGpayPin] = useState('');
  const [profileAge, setProfileAge] = useState('');

  // --- 6. App Lock Settings States
  const [appLockEnabled, setAppLockEnabled] = useState(() => localStorage.getItem('appLockEnabled') === 'true');
  const [appLockType, setAppLockType] = useState(() => localStorage.getItem('appLockType') || 'number');
  const [settingPattern, setSettingPattern] = useState(false);
  const [patternStep, setPatternStep] = useState(0); // 0=draw, 1=confirm
  const [tempPattern, setTempPattern] = useState('');

  useEffect(() => {
    if (activeModal === 'profile' && user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfilePassword('');
      setProfilePhone(user.phone || '');
      setProfileBankName(user.bankName || '');
      setProfileAccountNumber(user.accountNumber || '');
      setProfileGpayPin(user.gpayPin || '1234');
      setProfileAge(user.age || '');
      setAppLockEnabled(localStorage.getItem('appLockEnabled') === 'true');
      setAppLockType(localStorage.getItem('appLockType') || 'number');
      setSettingPattern(false);
      setPatternStep(0);
      setTempPattern('');
    }
  }, [activeModal, user]);

  const activeGoal = useMemo(() => {
    if (activeGoalId && goals) {
      return goals.find(g => g.id === activeGoalId);
    }
    return null;
  }, [activeGoalId, goals]);

  // --- SUBMIT HANDLERS ---

  // Handle Save Transaction
  const handleTxSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const txData = {
      description: txDesc,
      type: txType,
      category: txCategory,
      amount: parseFloat(txAmount),
      date: txDate,
      address: txAddress
    };

    try {
      if (editingTransaction) {
        await storage.updateTransaction({ id: editingTransaction.id, ...txData });
      } else {
        await storage.addTransaction(txData);
      }
      onRefresh();
      onClose();
    } catch (err) {
      console.error('Failed to save transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Save Budgets
  const handleBudgetsSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const promises = Object.keys(budgetInputs).map(cat => {
        return storage.updateBudget(cat, parseFloat(budgetInputs[cat]) || 0);
      });
      await Promise.all(promises);
      onRefresh();
      onClose();
    } catch (err) {
      console.error('Failed to update budgets:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Create Goal
  const handleAddGoalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await storage.addGoal({
        name: goalName,
        target: parseFloat(goalTarget),
        current: parseFloat(goalCurrent || 0),
        color: goalColor
      });
      onRefresh();
      onClose();
    } catch (err) {
      console.error('Failed to create goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Goal Contribution / Withdrawal
  const handleGoalActionSubmit = async (e) => {
    e.preventDefault();
    if (!activeGoal) return;
    setIsSubmitting(true);

    const amount = parseFloat(goalActionAmt) || 0;
    let newCurrent = activeGoal.current;

    if (goalActionOp === 'deposit') {
      newCurrent += amount;
    } else {
      newCurrent = Math.max(0, newCurrent - amount);
    }

    try {
      await storage.updateGoalProgress(activeGoal.id, newCurrent);
      onRefresh();
      onClose();
    } catch (err) {
      console.error('Failed to adjust savings progress:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Save Profile Settings
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await storage.updateProfile({
        name: profileName,
        email: profileEmail,
        password: profilePassword,
        phone: profilePhone,
        bankName: profileBankName,
        accountNumber: profileAccountNumber,
        gpayPin: profileGpayPin,
        age: parseInt(profileAge)
      });
      
      // Update saved lockscreen info if profile changes
      localStorage.setItem('gpay_saved_user', JSON.stringify({
        email: data.user.email,
        name: data.user.name
      }));

      onProfileUpdate(data.token, data.user);
      onRefresh();
      onClose();
    } catch (err) {
      console.error('Failed to update profile settings:', err);
      alert(err.message || 'Failed to update credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER PORTALS ---

  if (!activeModal) return null;

  return (
    <div className="modal-backdrop">
      {/* 1. TRANSACTION MODAL */}
      {activeModal === 'transaction' && (
        <div className="modal-card">
          <div className="modal-header">
            <h3>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h3>
            <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
          </div>
          <form onSubmit={handleTxSubmit}>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Grocery store, Consulting work"
                required
                value={txDesc}
                onChange={(e) => setTxDesc(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Transaction Type</label>
                <select
                  className="form-control"
                  value={txType}
                  onChange={(e) => setTxType(e.target.value)}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                >
                  {formCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                  required
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Location / Address</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 24th St Café, Union Square, CA"
                value={txAddress}
                onChange={(e) => setTxAddress(e.target.value)}
              />
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Transaction'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. ADJUST BUDGETS MODAL */}
      {activeModal === 'budgets' && (
        <div className="modal-card">
          <div className="modal-header">
            <h3>Adjust Budgets</h3>
            <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
          </div>
          <form onSubmit={handleBudgetsSubmit}>
            <div className="budget-limits-form-list">
              {Object.keys(budgetInputs).map(cat => (
                <div key={cat} className="form-group">
                  <label className="form-label">{cat} Limit (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    step="10"
                    min="0"
                    required
                    value={budgetInputs[cat] || ''}
                    onChange={(e) => setBudgetInputs({
                      ...budgetInputs,
                      [cat]: e.target.value
                    })}
                  />
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Budgets'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. ADD GOAL MODAL */}
      {activeModal === 'add-goal' && (
        <div className="modal-card">
          <div className="modal-header">
            <h3>Create Savings Goal</h3>
            <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
          </div>
          <form onSubmit={handleAddGoalSubmit}>
            <div className="form-group">
              <label className="form-label">Goal Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Wedding Fund, New Home"
                required
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Target Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0.00"
                  step="1"
                  min="1"
                  required
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Starting Balance (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0.00"
                  step="1"
                  min="0"
                  value={goalCurrent}
                  onChange={(e) => setGoalCurrent(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Theme Color</label>
              <div className="color-picker-palette">
                {[
                  { id: 'col-indigo', val: '#6366f1' },
                  { id: 'col-emerald', val: '#10b981' },
                  { id: 'col-amber', val: '#f59e0b' },
                  { id: 'col-rose', val: '#f43f5e' },
                  { id: 'col-purple', val: '#8b5cf6' },
                  { id: 'col-cyan', val: '#06b6d4' }
                ].map(choice => (
                  <React.Fragment key={choice.id}>
                    <input
                      type="radio"
                      name="goal-color-choice"
                      id={choice.id}
                      value={choice.val}
                      checked={goalColor === choice.val}
                      onChange={() => setGoalColor(choice.val)}
                    />
                    <label htmlFor={choice.id} style={{ backgroundColor: choice.val }}></label>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Goal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. GOAL ACTION MODAL */}
      {activeModal === 'goal-action' && activeGoal && (
        <div className="modal-card">
          <div className="modal-header">
            <h3>Fund - {activeGoal.name}</h3>
            <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
          </div>
          <form onSubmit={handleGoalActionSubmit}>
            <div className="form-group">
              <label className="form-label">Action Type</label>
              <div className="form-radio-toggle">
                <input
                  type="radio"
                  name="goal-operation"
                  id="goal-op-deposit"
                  value="deposit"
                  checked={goalActionOp === 'deposit'}
                  onChange={() => setGoalActionOp('deposit')}
                />
                <label htmlFor="goal-op-deposit" className="btn-radio">Deposit / Save</label>
                
                <input
                  type="radio"
                  name="goal-operation"
                  id="goal-op-withdraw"
                  value="withdraw"
                  checked={goalActionOp === 'withdraw'}
                  onChange={() => setGoalActionOp('withdraw')}
                />
                <label htmlFor="goal-op-withdraw" className="btn-radio">Withdraw</label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input
                type="number"
                className="form-control"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
                value={goalActionAmt}
                onChange={(e) => setGoalActionAmt(e.target.value)}
              />
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. PROFILE SETTINGS MODAL */}
      {activeModal === 'profile' && (
        <div className="modal-card">
          <div className="modal-header">
            <h3>Profile Settings</h3>
            <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
          </div>
          <form onSubmit={handleProfileSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Age</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  min="1"
                  max="120"
                  value={profileAge}
                  onChange={(e) => setProfileAge(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email ID (Personal Mail ID)</label>
              <input
                type="email"
                className="form-control"
                required
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Phone Contact</label>
                <input
                  type="tel"
                  className="form-control"
                  required
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">GPay App PIN</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  maxLength={6}
                  pattern="\d{4,6}"
                  value={profileGpayPin}
                  onChange={(e) => setProfileGpayPin(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Linked Bank Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={profileBankName}
                  onChange={(e) => setProfileBankName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Account Number</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={profileAccountNumber}
                  onChange={(e) => setProfileAccountNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">New Password (leave empty to keep current)</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
              />
            </div>

            {/* APP LOCK SETTINGS SECTION */}
            <div className="app-lock-settings-section">
              <div className="app-lock-settings-header">
                <Lock size={18} />
                <h4>App Lock Security</h4>
              </div>

              <div className="app-lock-toggle-row">
                <span>Enable App Lock on Launch</span>
                <label className="app-lock-toggle">
                  <input
                    type="checkbox"
                    checked={appLockEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setAppLockEnabled(enabled);
                      localStorage.setItem('appLockEnabled', enabled.toString());
                    }}
                  />
                  <span className="app-lock-toggle-slider" />
                </label>
              </div>

              {appLockEnabled && (
                <>
                  <div className="app-lock-type-selector">
                    <button
                      type="button"
                      className={`app-lock-type-btn ${appLockType === 'number' ? 'active' : ''}`}
                      onClick={() => {
                        setAppLockType('number');
                        localStorage.setItem('appLockType', 'number');
                        setSettingPattern(false);
                      }}
                    >
                      <KeyRound size={16} />
                      Number PIN
                    </button>
                    <button
                      type="button"
                      className={`app-lock-type-btn ${appLockType === 'pattern' ? 'active' : ''}`}
                      onClick={() => {
                        setAppLockType('pattern');
                        localStorage.setItem('appLockType', 'pattern');
                      }}
                    >
                      <Fingerprint size={16} />
                      Pattern Lock
                    </button>
                  </div>

                  {appLockType === 'number' && (
                    <p className="app-lock-hint">
                      Uses your GPay 4-digit PIN above for app unlock verification.
                    </p>
                  )}

                  {appLockType === 'pattern' && (
                    <div className="app-lock-pattern-setup">
                      {!settingPattern ? (
                        <button
                          type="button"
                          className="btn btn-secondary app-lock-set-pattern-btn"
                          onClick={() => { setSettingPattern(true); setPatternStep(0); setTempPattern(''); }}
                        >
                          {localStorage.getItem('appLockPattern') ? 'Change Pattern' : 'Set Pattern'}
                        </button>
                      ) : (
                        <div className="app-lock-pattern-draw-area">
                          <PatternLock
                            mode="setup"
                            title={patternStep === 0 ? 'Draw your new pattern (min 4 dots)' : 'Confirm your pattern'}
                            onPatternComplete={(pattern, callback) => {
                              if (patternStep === 0) {
                                setTempPattern(pattern);
                                setPatternStep(1);
                                callback(true);
                              } else {
                                if (pattern === tempPattern) {
                                  localStorage.setItem('appLockPattern', pattern);
                                  setSettingPattern(false);
                                  callback(true);
                                } else {
                                  callback(false);
                                  setPatternStep(0);
                                  setTempPattern('');
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ marginTop: '8px', fontSize: '0.8rem' }}
                            onClick={() => { setSettingPattern(false); setPatternStep(0); setTempPattern(''); }}
                          >
                            Cancel Pattern Setup
                          </button>
                        </div>
                      )}
                      {localStorage.getItem('appLockPattern') && !settingPattern && (
                        <p className="app-lock-hint" style={{ marginTop: '6px' }}>✓ Pattern lock is set and active.</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
