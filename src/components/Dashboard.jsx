import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import StatsRow from './StatsRow';
import ChartsSection from './ChartsSection';
import LedgerTable from './LedgerTable';
import BudgetsList from './BudgetsList';
import GoalsList from './GoalsList';
import Modals from './Modals';
import GPayChat from './GPayChat';
import ScratchCard from './ScratchCard';
import PinModal from './PinModal';
import { storage } from '../storage';
import { 
  PlusCircle, 
  Search, 
  QrCode, 
  Smartphone, 
  Users as UsersIcon, 
  Receipt, 
  Award,
  Sparkles,
  Info,
  SendHorizontal,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Landmark,
  Wallet,
  Lock,
  AlertCircle
} from 'lucide-react';

const GPAY_PEOPLE = [
  { name: 'Needhika', color: '#1a73e8', phone: '+91 98765-43210', category: 'Salary' },
  { name: 'Mounika', color: '#e52592', phone: '+91 98765-43211', category: 'Freelance' },
  { name: 'Manju', color: '#12b5cb', phone: '+91 98765-43212', category: 'Investments' },
  { name: 'Abi', color: '#f9ab00', phone: '+91 98765-43213', category: 'Other Income' },
  { name: 'Karthik', color: '#9b51e0', phone: '+91 98765-43214', category: 'Personal' },
  { name: 'Anitha', color: '#10b981', phone: '+91 98765-43215', category: 'Other' },
  { name: 'Dhivya', color: '#ff7a00', phone: '+91 98765-43216', category: 'Freelance' },
  { name: 'Koushik', color: '#3b82f6', phone: '+91 98765-43217', category: 'Salary' },
  { name: 'Priya', color: '#ec4899', phone: '+91 98765-43218', category: 'Investments' },
  { name: 'Vignesh', color: '#8b5cf6', phone: '+91 98765-43219', category: 'Other' }
];

const GPAY_BUSINESSES = [
  { name: 'Whole Foods', color: '#1e8e3e', phone: 'Merchant Food', category: 'Food' },
  { name: 'Electric & Gas', color: '#f2994a', phone: 'Merchant Utilities', category: 'Utilities' },
  { name: 'Apartment Rent', color: '#9b51e0', phone: 'Merchant Rent', category: 'Housing' },
  { name: 'Netflix', color: '#d93025', phone: 'Merchant Subs', category: 'Entertainment' },
  { name: 'Udemy Courses', color: '#ff7a00', phone: 'Merchant Education', category: 'Education' },
  { name: 'Gas Station', color: '#7a869a', phone: 'Merchant Transport', category: 'Transport' },
  { name: 'Starbucks', color: '#00704a', phone: 'Merchant Coffee', category: 'Food' }
];

export default function Dashboard({
  user,
  onLogout,
  transactions,
  budgets,
  goals,
  rewards,
  refreshData,
  isLoading,
  onProfileUpdate
}) {
  const [activeModal, setActiveModal] = useState(null); // null, 'transaction', 'budgets', 'add-goal', 'goal-action', 'qr-scanner', 'send-money'
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [activeGoalId, setActiveGoalId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatContact, setActiveChatContact] = useState(null);

  // Send Money modal states
  const [sendMoneyStep, setSendMoneyStep] = useState('select'); // select, form
  const [sendTarget, setSendTarget] = useState(null);
  const [sendAmount, setSendAmount] = useState('');
  const [sendDesc, setSendDesc] = useState('');
  const [sendMethod, setSendMethod] = useState('upi');
  const [sendTxType, setSendTxType] = useState('expense');
  const [sendCategory, setSendCategory] = useState('Food');
  const [sendPwInput, setSendPwInput] = useState('');
  const [sendPwError, setSendPwError] = useState('');
  const [sendShowPw, setSendShowPw] = useState(false);
  const [sendSubmitting, setSendSubmitting] = useState(false);
  const [sendLocation, setSendLocation] = useState('Anna Nagar, Chennai, TN');
  const [otherContactQuery, setOtherContactQuery] = useState('');
  const [isSendPinOpen, setIsSendPinOpen] = useState(false);

  // Automatically request browser geolocation on transfer flow
  useEffect(() => {
    if (activeModal === 'send-money' || activeChatContact !== null) {
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
            setSendLocation(`${mocks[index]} (GPS: ${lat}, ${lng})`);
          },
          (error) => {
            setSendLocation('Anna Nagar, Chennai, TN (Mock Location)');
          }
        );
      } else {
        setSendLocation('Anna Nagar, Chennai, TN (Mock Location)');
      }
    }
  }, [activeModal, activeChatContact]);

  const getHeaderDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return `Welcome back, ${user ? user.name : 'User'}! Today is ${new Date().toLocaleDateString(undefined, options)}.`;
  };

  const handleOpenAddTx = (desc = '') => {
    setEditingTransaction(desc ? { description: desc } : null);
    setActiveModal('transaction');
  };

  const handleOpenEditTx = (tx) => {
    setEditingTransaction(tx);
    setActiveModal('transaction');
  };

  const handleOpenAdjustBudgets = () => {
    setActiveModal('budgets');
  };

  const handleOpenAddGoal = () => {
    setActiveModal('add-goal');
  };

  const handleOpenGoalAction = (goalId) => {
    setActiveGoalId(goalId);
    setActiveModal('goal-action');
  };

  const handleOpenProfile = () => {
    setActiveModal('profile');
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setEditingTransaction(null);
    setActiveGoalId(null);
  };

  // Filter GPay Contacts based on search input
  const filteredPeople = GPAY_PEOPLE.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBusinesses = GPAY_BUSINESSES.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter main ledger transactions based on search query
  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Claim scratch card callback
  const handleClaimReward = async (id) => {
    try {
      await storage.claimReward(id);
      refreshData(); // Refresh to update Net balance and add cashback transaction
    } catch (err) {
      console.error('Failed to claim reward scratch card:', err);
    }
  };

  return (
    <div className="app-container" id="app-container">
      <Sidebar user={user} onLogout={onLogout} onOpenProfile={handleOpenProfile} />

      <main className="main-content">
        <header className="main-header">
          <div className="header-title-area">
            <h1>Track My Money Dashboard</h1>
            <p className="subtitle">{getHeaderDate()}</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => handleOpenAddTx()}>
              <PlusCircle size={18} />
              <span>Add Transaction</span>
            </button>
          </div>
        </header>

        {isLoading && transactions.length === 0 ? (
          <div className="empty-state">
            <h3>Loading dashboard data...</h3>
          </div>
        ) : (
          <div className="dashboard-grid">
            
            {/* GPay style Search header */}
            <div className="gpay-search-container">
              <Search size={20} className="icon-search" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search people, merchants, bills, and transactions..."
                className="gpay-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Quick GPay Actions Section */}
            <section className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
              <div 
                className="stat-card" 
                onClick={() => setActiveModal('qr-scanner')}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center' }}
              >
                <div className="gpay-avatar" style={{ backgroundColor: 'var(--primary)', marginBottom: '8px' }}>
                  <QrCode size={24} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Scan QR</span>
              </div>

              <div 
                className="stat-card" 
                onClick={() => { setActiveModal('send-money'); setSendMoneyStep('select'); }}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center', border: '1px solid rgba(26,115,232,0.25)' }}
              >
                <div className="gpay-avatar" style={{ backgroundColor: '#1a73e8', marginBottom: '8px' }}>
                  <SendHorizontal size={24} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Send Money</span>
              </div>

              <div 
                className="stat-card" 
                onClick={() => handleOpenAddTx('Transfer to Phone')}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center' }}
              >
                <div className="gpay-avatar" style={{ backgroundColor: '#1e8e3e', marginBottom: '8px' }}>
                  <Smartphone size={24} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Pay Phone</span>
              </div>

              <div 
                className="stat-card" 
                onClick={() => {
                  if (GPAY_PEOPLE.length > 0) setActiveChatContact(GPAY_PEOPLE[0]);
                }}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center' }}
              >
                <div className="gpay-avatar" style={{ backgroundColor: '#e52592', marginBottom: '8px' }}>
                  <UsersIcon size={24} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Pay Contacts</span>
              </div>

              <div 
                className="stat-card" 
                onClick={() => {
                  if (GPAY_BUSINESSES.length > 0) setActiveChatContact(GPAY_BUSINESSES[0]);
                }}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center' }}
              >
                <div className="gpay-avatar" style={{ backgroundColor: '#f9ab00', marginBottom: '8px' }}>
                  <Receipt size={24} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Pay Bills</span>
              </div>
            </section>

            {/* Balances, Incomes & Expenses */}
            <StatsRow transactions={transactions} />

            {/* GPay People list section */}
            <section className="stat-card" style={{ gridColumn: 'span 3', padding: '20px' }}>
              <div className="gpay-section-header">
                <span>People</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tap contact to open payment chat</span>
              </div>
              <div className="gpay-contacts-grid">
                {filteredPeople.map(p => (
                  <button 
                    key={p.name} 
                    className="gpay-contact-item" 
                    onClick={() => setActiveChatContact(p)}
                  >
                    <div className="gpay-avatar" style={{ backgroundColor: p.color }}>
                      {p.name.charAt(0)}
                    </div>
                    <span className="gpay-contact-name">{p.name}</span>
                  </button>
                ))}
              </div>

              <div className="gpay-section-header">
                <span>Businesses & Utilities</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tap to pay bills</span>
              </div>
              <div className="gpay-contacts-grid">
                {filteredBusinesses.map(b => (
                  <button 
                    key={b.name} 
                    className="gpay-contact-item" 
                    onClick={() => setActiveChatContact(b)}
                  >
                    <div className="gpay-avatar" style={{ backgroundColor: b.color }}>
                      {b.name.charAt(0)}
                    </div>
                    <span className="gpay-contact-name">{b.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* GPay Rewards & Scratch cards section */}
            <section className="stat-card gpay-rewards-card" id="section-rewards" style={{ gridColumn: 'span 3', padding: '20px' }}>
              <div className="gpay-section-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={20} style={{ color: '#f59e0b' }} />
                  Google Pay Scratch Cards & Rewards
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600' }}>
                  <Sparkles size={12} /> Earn cashback on expenses!
                </span>
              </div>
              
              {rewards.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                  <Award size={36} style={{ strokeWidth: 1.5, marginBottom: '8px' }} />
                  <p style={{ fontSize: '0.85rem' }}>No scratch cards yet. Make utility bill payments or send peer money to win rewards!</p>
                </div>
              ) : (
                <div className="gpay-rewards-grid">
                  {rewards.map(reward => (
                    <ScratchCard
                      key={reward.id}
                      id={reward.id}
                      rewardAmount={reward.rewardAmount}
                      message={reward.message}
                      isScratched={reward.isScratched}
                      onClaim={handleClaimReward}
                    />
                  ))}
                </div>
              )}
            </section>

            <ChartsSection transactions={transactions} />

            <div className="bottom-grid">
              <LedgerTable
                transactions={filteredTransactions}
                onEditTx={handleOpenEditTx}
                onRefresh={refreshData}
              />

              <div className="details-column">
                <BudgetsList
                  transactions={transactions}
                  budgets={budgets}
                  onAdjust={handleOpenAdjustBudgets}
                />

                <GoalsList
                  goals={goals}
                  onAddGoal={handleOpenAddGoal}
                  onGoalAction={handleOpenGoalAction}
                  onRefresh={refreshData}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Main ledger editing and profile modals */}
      {activeModal && activeModal !== 'qr-scanner' && (
        <Modals
          activeModal={activeModal}
          onClose={handleCloseModal}
          editingTransaction={editingTransaction}
          activeGoalId={activeGoalId}
          goals={goals}
          budgets={budgets}
          onRefresh={refreshData}
          user={user}
          onProfileUpdate={onProfileUpdate}
        />
      )}

      {/* GPay style mock QR Scanner modal */}
      {activeModal === 'qr-scanner' && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-content" style={{ maxWidth: '380px', padding: '24px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '12px' }}>Scan Any UPI QR Code</h3>
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', display: 'inline-block', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <QrCode size={180} style={{ color: '#000000' }} />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Scan the mock QR code of any vendor or bill to instantly payload transactions.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  handleCloseModal();
                  handleOpenAddTx('QR Code Bill Payment');
                }}
              >
                Scan & Pay Mock QR
              </button>
              <button className="btn btn-secondary" onClick={handleCloseModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Money Modal */}
      {activeModal === 'send-money' && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-content" style={{ maxWidth: '520px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            
            {/* Step 1: Pick recipient */}
            {sendMoneyStep === 'select' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><SendHorizontal size={20} /> Send Money</h3>
                  <button className="modal-close-btn" onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>&times;</button>
                </div>
                
                {/* Search & Custom Other Input */}
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Enter Name, UPI ID or Phone</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. name@upi or +1 555-1234" 
                      value={otherContactQuery}
                      onChange={(e) => setOtherContactQuery(e.target.value)}
                    />
                    {otherContactQuery.trim() && (
                      <button 
                        type="button"
                        className="btn btn-primary"
                        style={{ whiteSpace: 'nowrap' }}
                        onClick={() => {
                          const customTarget = {
                            name: otherContactQuery.trim(),
                            color: '#6366f1',
                            phone: otherContactQuery.includes('@') ? otherContactQuery.trim() : 'Custom UPI/Phone',
                            category: 'Other'
                          };
                          setSendTarget(customTarget);
                          setSendCategory('Other');
                          setSendMoneyStep('form');
                        }}
                      >
                        Pay Other
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>People</div>
                <div className="gpay-contacts-grid" style={{ marginBottom: '18px' }}>
                  {GPAY_PEOPLE.filter(p => p.name.toLowerCase().includes(otherContactQuery.toLowerCase()) || p.phone.includes(otherContactQuery)).map(p => (
                    <button key={p.name} className="gpay-contact-item" onClick={() => { setSendTarget(p); setSendMoneyStep('form'); setSendCategory(p.category || 'Other'); }}>
                      <div className="gpay-avatar" style={{ backgroundColor: p.color }}>{p.name.charAt(0)}</div>
                      <span className="gpay-contact-name">{p.name}</span>
                    </button>
                  ))}
                </div>
                
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Businesses</div>
                <div className="gpay-contacts-grid">
                  {GPAY_BUSINESSES.filter(b => b.name.toLowerCase().includes(otherContactQuery.toLowerCase())).map(b => (
                    <button key={b.name} className="gpay-contact-item" onClick={() => { setSendTarget(b); setSendMoneyStep('form'); setSendCategory(b.category || 'Food'); setSendTxType('expense'); }}>
                      <div className="gpay-avatar" style={{ backgroundColor: b.color }}>{b.name.charAt(0)}</div>
                      <span className="gpay-contact-name">{b.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 2: Payment form */}
            {sendMoneyStep === 'form' && sendTarget && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div className="gpay-avatar" style={{ backgroundColor: sendTarget.color, width: '44px', height: '44px', fontSize: '1.1rem' }}>{sendTarget.name.charAt(0)}</div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{sendTarget.name}</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{sendTarget.phone}</p>
                  </div>
                </div>

                {/* Payment Method */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Payment Method</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[{ id: 'upi', label: 'UPI', icon: Wallet, color: '#1a73e8' }, { id: 'bank', label: 'Bank', icon: Landmark, color: '#1e8e3e' }, { id: 'card', label: 'Card', icon: CreditCard, color: '#e52592' }].map(m => {
                      const Icon = m.icon;
                      const sel = sendMethod === m.id;
                      return (
                        <button key={m.id} type="button" onClick={() => setSendMethod(m.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px 6px', borderRadius: '12px', cursor: 'pointer', border: sel ? `2px solid ${m.color}` : '2px solid rgba(255,255,255,0.08)', background: sel ? `${m.color}15` : 'rgba(255,255,255,0.02)', color: sel ? m.color : 'var(--text-secondary)', transition: 'all 0.2s', fontSize: '0.72rem', fontWeight: 600 }}>
                           <Icon size={18} /><span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Expense / Income */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Type</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => { setSendTxType('expense'); setSendCategory('Food'); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer', border: sendTxType === 'expense' ? '2px solid #f43f5e' : '2px solid rgba(255,255,255,0.08)', background: sendTxType === 'expense' ? 'rgba(244,63,94,0.12)' : 'transparent', color: sendTxType === 'expense' ? '#f43f5e' : 'var(--text-secondary)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><ArrowUpRight size={16} /> Expense</button>
                    <button type="button" onClick={() => { setSendTxType('income'); setSendCategory('Salary'); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer', border: sendTxType === 'income' ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.08)', background: sendTxType === 'income' ? 'rgba(16,185,129,0.12)' : 'transparent', color: sendTxType === 'income' ? '#10b981' : 'var(--text-secondary)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><ArrowDownLeft size={16} /> Income</button>
                  </div>
                </div>

                {/* Category */}
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Category</label>
                  <select className="form-control" value={sendCategory} onChange={(e) => setSendCategory(e.target.value)} style={{ fontSize: '0.85rem' }}>
                    {(sendTxType === 'expense' ? ['Food','Housing','Transport','Utilities','Entertainment','Education','Shopping','Health','Travel','Other'] : ['Salary','Freelance','Investments','Other Income']).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Address/Location Field */}
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Transaction Location</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Enter location or address" 
                    value={sendLocation}
                    onChange={(e) => setSendLocation(e.target.value)}
                  />
                </div>

                {/* Amount + Description */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px', marginBottom: '18px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Amount</label>
                    <input type="number" className="form-control" placeholder="₹0.00" step="0.01" min="0.01" required value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Note (Optional)</label>
                    <input type="text" className="form-control" placeholder="Payment for..." value={sendDesc} onChange={(e) => setSendDesc(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSendMoneyStep('select')}>Back</button>
                  <button className="btn btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} disabled={!sendAmount || parseFloat(sendAmount) <= 0} onClick={() => { setIsSendPinOpen(true); }}>
                    <Lock size={15} /> Verify & Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* GPay style PinModal validation for Send Money */}
      <PinModal
        isOpen={isSendPinOpen}
        onSubmit={async () => {
          setIsSendPinOpen(false);
          try {
            const txData = {
              description: sendDesc.trim() || `${sendTarget.name} Transfer`,
              type: sendTxType,
              category: sendCategory,
              amount: parseFloat(sendAmount),
              date: new Date().toISOString().split('T')[0],
              address: sendLocation
            };
            await storage.addTransaction(txData);
            refreshData();
            handleCloseModal();
            setSendAmount(''); 
            setSendDesc(''); 
            setSendMethod('upi'); 
            setSendTxType('expense'); 
            setSendCategory('Food'); 
            setSendTarget(null);
            setOtherContactQuery('');
          } catch (err) {
            console.error(err);
          }
        }}
        onClose={() => setIsSendPinOpen(false)}
        title={`Paying ${sendTarget?.name}`}
        subtitle={`${sendMethod.toUpperCase()} · ${sendCategory}`}
        amount={sendAmount}
      />

      {/* GPay style chat interface for peer-to-peer / bill payments */}
      <GPayChat
        isOpen={activeChatContact !== null}
        contact={activeChatContact}
        transactions={transactions}
        onClose={() => setActiveChatContact(null)}
        onRefresh={refreshData}
        user={user}
      />
    </div>
  );
}
