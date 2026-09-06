import React from 'react';
import { storage } from '../storage';
import { Plus, PlusCircle, Trash2 } from 'lucide-react';

export default function GoalsList({ goals, onAddGoal, onGoalAction, onRefresh }) {
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this savings goal?')) {
      try {
        await storage.deleteGoal(id);
        onRefresh();
      } catch (err) {
        console.error('Failed to delete savings goal:', err);
      }
    }
  };

  return (
    <section className="card" id="section-goals">
      <div className="section-header">
        <div className="section-title-wrapper">
          <h2>Savings Goals</h2>
          <p className="subtitle">Track targets and milestones</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={onAddGoal}>
          <Plus size={14} />
          <span>Add Goal</span>
        </button>
      </div>

      <div className="goals-items-list">
        {goals.map(goal => {
          const percentage = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
          const cappedPercentage = Math.min(100, percentage);

          return (
            <div key={goal.id} className="goal-item-card">
              <div className="goal-item-header">
                <span className="goal-name-text" style={{ color: goal.color }}>
                  {goal.name}
                </span>
                <div className="goal-actions-row">
                  <button 
                    className="btn btn-outline btn-sm btn-goal-manage" 
                    onClick={() => onGoalAction(goal.id)}
                    title="Deposit or Withdraw"
                  >
                    <PlusCircle size={14} />
                    <span>Manage</span>
                  </button>
                  <button 
                    className="action-btn btn-delete-goal" 
                    onClick={() => handleDelete(goal.id)}
                    title="Remove Goal"
                    style={{ width: '24px', height: '24px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="goal-progress-info">
                <span>₹{goal.current.toLocaleString('en-IN')} saved</span>
                <span className="goal-target-val">target: ₹{goal.target.toLocaleString('en-IN')}</span>
              </div>
              <div className="goal-progress-bar-track">
                <div 
                  className="goal-progress-bar-fill" 
                  style={{ 
                    width: `${cappedPercentage}%`, 
                    backgroundColor: goal.color 
                  }}
                ></div>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <p>No savings goals set. Create one to start saving!</p>
          </div>
        )}
      </div>
    </section>
  );
}
