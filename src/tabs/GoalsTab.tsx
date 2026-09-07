import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Target, Calendar, Sparkles } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { SavingsGoal } from '../types';
import { Modal } from '../components/Modal';
import { formatINR } from '../utils/formatCurrency';

export const GoalsTab: React.FC = () => {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, allocateToGoal, totals } = useFinance();

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  // Form fields
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [allocAmount, setAllocAmount] = useState('');
  const [allocType, setAllocType] = useState<'deposit' | 'withdraw'>('deposit');

  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setGoalName('');
    setGoalTarget('');
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);
    setGoalDate(futureDate.toISOString().split('T')[0]);
    setFormError('');
  };

  const handleOpenAddGoal = () => {
    resetForm();
    setModalMode('add');
    setIsGoalModalOpen(true);
  };

  const handleOpenEditGoal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setGoalName(goal.name);
    setGoalTarget(goal.targetAmount.toString());
    setGoalDate(goal.targetDate);
    setFormError('');
    setModalMode('edit');
    setIsGoalModalOpen(true);
  };

  const handleOpenAllocate = (goal: SavingsGoal, type: 'deposit' | 'withdraw') => {
    setSelectedGoal(goal);
    setAllocType(type);
    setAllocAmount('');
    setFormError('');
    setIsAllocModalOpen(true);
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const targetVal = parseFloat(goalTarget);
    if (!goalName.trim()) {
      setFormError('Goal name is required.');
      return;
    }
    if (isNaN(targetVal) || targetVal <= 0) {
      setFormError('Please enter a target savings goal amount greater than 0.');
      return;
    }
    if (!goalDate) {
      setFormError('Target date is required.');
      return;
    }

    if (modalMode === 'add') {
      addSavingsGoal({
        name: goalName.trim(),
        targetAmount: targetVal,
        targetDate: goalDate
      });
    } else if (modalMode === 'edit' && selectedGoal) {
      updateSavingsGoal({
        ...selectedGoal,
        name: goalName.trim(),
        targetAmount: targetVal,
        targetDate: goalDate
      });
    }

    setIsGoalModalOpen(false);
    resetForm();
  };

  const handleAllocateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const val = parseFloat(allocAmount);
    if (isNaN(val) || val <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }

    if (!selectedGoal) return;

    if (allocType === 'deposit') {
      if (val > totals.availableBalance) {
        setFormError(`Insufficient balance. You only have ${formatINR(totals.availableBalance)} available.`);
        return;
      }
      const success = allocateToGoal(selectedGoal.id, val);
      if (success) {
        setIsAllocModalOpen(false);
      } else {
        setFormError('Failed to allocate funds.');
      }
    } else {
      if (val > selectedGoal.currentAmount) {
        setFormError(`Cannot withdraw more than current savings. Saved amount: ${formatINR(selectedGoal.currentAmount)}.`);
        return;
      }
      const success = allocateToGoal(selectedGoal.id, -val);
      if (success) {
        setIsAllocModalOpen(false);
      } else {
        setFormError('Failed to withdraw funds.');
      }
    }
  };

  const handleDeleteGoal = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove the goal: ${name}? The savings will be returned to your main balance.`)) {
      deleteSavingsGoal(id);
    }
  };

  const getDaysRemaining = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    const diff = target.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="tab-content goals-tab">
      {/* Overview stats and control */}
      <div className="goals-top-banner glass">
        <div className="banner-summary">
          <div className="banner-item">
            <span className="lbl">Total Saved Goal Pots</span>
            <span className="val text-success">{formatINR(totals.allocatedSavings)}</span>
          </div>
          <div className="banner-item border-l">
            <span className="lbl">Liquid Available Cash</span>
            <span className="val text-primary">{formatINR(totals.availableBalance)}</span>
          </div>
        </div>
        <button className="btn-primary" onClick={handleOpenAddGoal}>
          <Plus size={16} />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Goals grid */}
      <div className="goals-grid">
        {savingsGoals.length === 0 ? (
          <div className="goals-empty glass">
            <Target size={48} className="empty-icon text-muted" />
            <h4>No savings goals established yet</h4>
            <p>Define milestones (like buying a laptop or going on vacation) to allocate funds specifically for them.</p>
            <button className="btn-primary" onClick={handleOpenAddGoal}>
              Create Savings Goal
            </button>
          </div>
        ) : (
          savingsGoals.map(g => {
            const percent = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
            const daysLeft = getDaysRemaining(g.targetDate);
            const isCompleted = g.currentAmount >= g.targetAmount;

            return (
              <div key={g.id} className={`goal-card glass ${isCompleted ? 'goal-completed' : ''}`}>
                {isCompleted && (
                  <div className="completed-badge">
                    <Sparkles size={12} />
                    <span>Completed!</span>
                  </div>
                )}
                
                <div className="goal-card-header">
                  <div className="goal-title-group">
                    <Target className={isCompleted ? 'text-success' : 'text-primary'} size={20} />
                    <h4>{g.name}</h4>
                  </div>
                  <div className="goal-card-actions">
                    <button className="goal-action-btn edit" onClick={() => handleOpenEditGoal(g)} title="Edit goal">
                      <Edit3 size={13} />
                    </button>
                    <button className="goal-action-btn delete" onClick={() => handleDeleteGoal(g.id, g.name)} title="Delete goal">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="goal-amounts">
                  <div className="amt-box">
                    <span className="lbl">Currently Saved</span>
                    <span className="val text-success">{formatINR(g.currentAmount)}</span>
                  </div>
                  <div className="amt-box text-right">
                    <span className="lbl">Target Goal</span>
                    <span className="val">{formatINR(g.targetAmount)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="goal-progress-wrapper">
                  <div className="goal-progress-bar">
                    <div
                      className={`goal-progress-fill ${isCompleted ? 'bg-success' : 'bg-primary'}`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    ></div>
                  </div>
                  <div className="goal-progress-meta">
                    <span>{percent.toFixed(0)}% Saved</span>
                    <span>Remaining: {formatINR(g.targetAmount - g.currentAmount)}</span>
                  </div>
                </div>

                {/* Date and actions */}
                <div className="goal-date-meta">
                  <div className="date-block">
                    <Calendar size={13} className="date-icon" />
                    <span>Target: {g.targetDate}</span>
                  </div>
                  <span className={`days-badge ${daysLeft < 30 && !isCompleted ? 'text-danger font-medium' : ''}`}>
                    {isCompleted
                      ? 'Goal achieved!'
                      : daysLeft > 0
                      ? `${daysLeft} days left`
                      : `${Math.abs(daysLeft)} days overdue`}
                  </span>
                </div>

                <div className="goal-transfers">
                  <button
                    className="btn-transfer deposit"
                    disabled={totals.availableBalance <= 0 || isCompleted}
                    onClick={() => handleOpenAllocate(g, 'deposit')}
                  >
                    Allocate Funds
                  </button>
                  <button
                    className="btn-transfer withdraw"
                    disabled={g.currentAmount <= 0}
                    onClick={() => handleOpenAllocate(g, 'withdraw')}
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Goal Modal */}
      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title={modalMode === 'add' ? 'Establish Savings Goal' : 'Update Savings Goal'}>
        <form onSubmit={handleGoalSubmit} className="goal-form">
          {formError && <div className="form-alert alert-error">{formError}</div>}

          <div className="form-field">
            <label htmlFor="goal-name">Savings Goal Name</label>
            <input
              type="text"
              id="goal-name"
              placeholder="e.g. New Macbook Pro, Trip to Kyoto"
              value={goalName}
              onChange={e => setGoalName(e.target.value)}
            />
          </div>

          <div className="form-group-row">
            <div className="form-field flex-1">
              <label htmlFor="goal-target">Target Savings (INR)</label>
              <input
                type="number"
                id="goal-target"
                placeholder="e.g. 2000"
                value={goalTarget}
                onChange={e => setGoalTarget(e.target.value)}
              />
            </div>

            <div className="form-field flex-1">
              <label htmlFor="goal-date">Target Completion Date</label>
              <input
                type="date"
                id="goal-date"
                value={goalDate}
                onChange={e => setGoalDate(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={() => setIsGoalModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Goal
            </button>
          </div>
        </form>
      </Modal>

      {/* Allocate Funds Modal */}
      <Modal
        isOpen={isAllocModalOpen}
        onClose={() => setIsAllocModalOpen(false)}
        title={allocType === 'deposit' ? `Allocate Funds to ${selectedGoal?.name}` : `Withdraw Funds from ${selectedGoal?.name}`}
      >
        <form onSubmit={handleAllocateSubmit} className="alloc-form">
          {formError && <div className="form-alert alert-error">{formError}</div>}

          <div className="alloc-context-stat">
            {allocType === 'deposit' ? (
              <div className="stat-block">
                <span className="lbl">Liquid Available Balance</span>
                <span className="val text-primary">{formatINR(totals.availableBalance)}</span>
              </div>
            ) : (
              <div className="stat-block">
                <span className="lbl">Currently Saved Goal Pots</span>
                <span className="val text-success">{selectedGoal ? formatINR(selectedGoal.currentAmount) : ''}</span>
              </div>
            )}
            <div className="stat-block text-right">
              <span className="lbl">Goal Target Left</span>
              {selectedGoal && (
                <span className="val">{selectedGoal ? formatINR(selectedGoal.targetAmount - selectedGoal.currentAmount) : ''}</span>
              )}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="alloc-amount">Amount to Transfer (INR)</label>
            <input
              type="number"
              step="0.01"
              id="alloc-amount"
              placeholder="0.00"
              value={allocAmount}
              onChange={e => setAllocAmount(e.target.value)}
              autoFocus
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={() => setIsAllocModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Confirm Transfer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
