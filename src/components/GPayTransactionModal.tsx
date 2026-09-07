import React, { useState } from 'react';
import { Modal } from './Modal';
import { useFinance } from '../context/FinanceContext';
import { formatINR } from '../utils/formatCurrency';
import {
  Send,
  QrCode,
  Smartphone,
  Building,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Download,
  CreditCard,
  Zap
} from 'lucide-react';

interface GPayTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipient?: string;
}

const PAYMENT_APPS = [
  { id: 'gpay', name: 'Google Pay (GPay)', color: '#1a73e8', bg: 'rgba(26, 115, 232, 0.1)', icon: '🔵' },
  { id: 'phonepe', name: 'PhonePe', color: '#5f259f', bg: 'rgba(95, 37, 159, 0.1)', icon: '🟣' },
  { id: 'paytm', name: 'Paytm', color: '#00baf2', bg: 'rgba(0, 186, 242, 0.1)', icon: '🟦' },
  { id: 'bhim', name: 'BHIM UPI', color: '#008b47', bg: 'rgba(0, 139, 71, 0.1)', icon: '🟢' },
  { id: 'amazon', name: 'Amazon Pay', color: '#ff9900', bg: 'rgba(255, 153, 0, 0.1)', icon: '🟠' }
];

const TAMIL_CONTACTS = [
  { name: 'Needhika', phone: '98401 23456', upi: 'needhika@upi', avatarBg: '#e91e63' },
  { name: 'Mounika', phone: '97890 12345', upi: 'mounika@upi', avatarBg: '#9c27b0' },
  { name: 'Manju', phone: '94440 67890', upi: 'manju@upi', avatarBg: '#3f51b5' },
  { name: 'Abi', phone: '98840 54321', upi: 'abi@upi', avatarBg: '#00bcd4' },
  { name: 'Karthik', phone: '91760 98765', upi: 'karthik@upi', avatarBg: '#4caf50' },
  { name: 'Anitha', phone: '98410 11223', upi: 'anitha@upi', avatarBg: '#ff9800' },
  { name: 'Dhivya', phone: '97900 33445', upi: 'dhivya@upi', avatarBg: '#795548' },
  { name: 'Koushik', phone: '96000 55667', upi: 'koushik@upi', avatarBg: '#607d8b' },
  { name: 'Priya', phone: '98405 66778', upi: 'priya@upi', avatarBg: '#e91e63' },
  { name: 'Vignesh', phone: '99401 88990', upi: 'vignesh@upi', avatarBg: '#2196f3' }
];

const BANK_ACCOUNTS = [
  { name: 'State Bank of India', accountNo: '•••• 4821', logo: '🏛️' },
  { name: 'HDFC Bank', accountNo: '•••• 9012', logo: '🏦' },
  { name: 'ICICI Bank', accountNo: '•••• 3341', logo: '💳' },
  { name: 'Digital Wallet Balance', accountNo: '₹4,500.00 Available', logo: '⚡' }
];

export const GPayTransactionModal: React.FC<GPayTransactionModalProps> = ({
  isOpen,
  onClose,
  defaultRecipient = ''
}) => {
  const { addTransaction, categories } = useFinance();

  const [step, setStep] = useState<'contact' | 'amount' | 'pin' | 'processing' | 'success'>('contact');
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories.find(c => c !== 'Salary') || 'Food & Dining');
  const [note, setNote] = useState('');
  const [selectedApp, setSelectedApp] = useState(PAYMENT_APPS[0]);
  const [selectedBank, setSelectedBank] = useState(BANK_ACCOUNTS[0]);
  const [upiPin, setUpiPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [txRefNo, setTxRefNo] = useState('');
  const [tabMode, setTabMode] = useState<'contacts' | 'qr' | 'manual'>('contacts');

  const playSuccessSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // Audio fallback
    }
  };

  const handleSelectContact = (c: typeof TAMIL_CONTACTS[0]) => {
    setRecipient(c.name);
    setUpiId(c.upi);
    setStep('amount');
  };

  const handleManualProceed = () => {
    if (!recipient.trim()) return;
    if (!upiId) setUpiId(`${recipient.toLowerCase().replace(/\s+/g, '')}@upi`);
    setStep('amount');
  };

  const handleProceedToPin = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    setStep('pin');
  };

  const handlePinKeyPress = (digit: string) => {
    if (upiPin.length < 6) {
      const newPin = upiPin + digit;
      setUpiPin(newPin);
      setPinError('');
      if (newPin.length === 5 || newPin.length === 6) {
        if (newPin === '23231' || newPin === '8899' || newPin === '123456') {
          executePayment();
        }
      }
    }
  };

  const handlePinDelete = () => {
    setUpiPin(prev => prev.slice(0, -1));
    setPinError('');
  };

  const executePayment = () => {
    setStep('processing');
    const ref = `UPI/${Math.floor(100000000 + Math.random() * 900000000)}/${selectedApp.id.toUpperCase()}`;
    setTxRefNo(ref);

    setTimeout(() => {
      const numericAmt = parseFloat(amount);
      addTransaction({
        date: new Date().toISOString().split('T')[0],
        description: `Paid to ${recipient} via ${selectedApp.name}`,
        amount: numericAmt,
        type: 'expense',
        category,
        note: note || undefined,
        paymentMethod: selectedApp.id as 'gpay' | 'upi' | 'bank_transfer' | 'card' | 'cash',
        transferType: 'send',
        personName: recipient,
        status: 'completed'
      });

      playSuccessSound();
      setStep('success');
    }, 1400);
  };

  const handleResetModal = () => {
    setStep('contact');
    setRecipient('');
    setUpiId('');
    setAmount('');
    setNote('');
    setUpiPin('');
    setPinError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleResetModal} title="UPI & Digital Wallet Quick Pay">
      <div className="gpay-tx-wrapper">
        {/* Step 1: Select Contact or Scan QR */}
        {step === 'contact' && (
          <div className="gpay-step-container">
            {/* Payment App Selector Pills */}
            <div className="payment-app-selector">
              <span className="app-selector-title">Select Payment App</span>
              <div className="app-pills-row">
                {PAYMENT_APPS.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    className={`app-pill ${selectedApp.id === app.id ? 'active' : ''}`}
                    style={{
                      borderColor: selectedApp.id === app.id ? app.color : undefined,
                      backgroundColor: selectedApp.id === app.id ? app.bg : undefined
                    }}
                    onClick={() => setSelectedApp(app)}
                  >
                    <span>{app.icon}</span>
                    <span>{app.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="gpay-step-tabs mt-3">
              <button
                className={`gpay-tab-btn ${tabMode === 'contacts' ? 'active' : ''}`}
                onClick={() => setTabMode('contacts')}
              >
                <Smartphone size={16} /> Contacts
              </button>
              <button
                className={`gpay-tab-btn ${tabMode === 'qr' ? 'active' : ''}`}
                onClick={() => setTabMode('qr')}
              >
                <QrCode size={16} /> Scan QR
              </button>
              <button
                className={`gpay-tab-btn ${tabMode === 'manual' ? 'active' : ''}`}
                onClick={() => setTabMode('manual')}
              >
                <Send size={16} /> Enter UPI ID
              </button>
            </div>

            {tabMode === 'contacts' && (
              <div className="gpay-contacts-grid">
                <span className="gpay-section-label">Pay Recent Contacts</span>
                <div className="contacts-list">
                  {TAMIL_CONTACTS.map((c) => (
                    <div key={c.upi} className="contact-item" onClick={() => handleSelectContact(c)}>
                      <div className="contact-avatar" style={{ backgroundColor: c.avatarBg }}>
                        {c.name.charAt(0)}
                      </div>
                      <div className="contact-details">
                        <span className="contact-name">{c.name}</span>
                        <span className="contact-upi">{c.upi}</span>
                      </div>
                      <ArrowRight size={16} className="contact-arrow" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tabMode === 'qr' && (
              <div className="gpay-qr-scanner-sim">
                <div className="qr-viewfinder">
                  <div className="qr-laser" />
                  <QrCode size={80} className="qr-placeholder-icon" />
                  <span>Align BharatQR / UPI QR code within frame</span>
                </div>
                <button
                  className="btn-primary mt-3"
                  onClick={() => handleSelectContact(TAMIL_CONTACTS[0])}
                >
                  Simulate QR Scan (Pay Needhika)
                </button>
              </div>
            )}

            {tabMode === 'manual' && (
              <div className="gpay-manual-form">
                <div className="form-field">
                  <label>Recipient Name / Merchant</label>
                  <input
                    placeholder="e.g. Karthik, Supermarket"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label>Phone Number or UPI ID</label>
                  <input
                    placeholder="9876543210 or name@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn-primary w-full mt-3"
                  disabled={!recipient.trim()}
                  onClick={handleManualProceed}
                >
                  Proceed to Pay via {selectedApp.name}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Amount & Bank Selection */}
        {step === 'amount' && (
          <form onSubmit={handleProceedToPin} className="gpay-amount-form">
            <div className="gpay-recipient-card">
              <div className="recipient-avatar-large">
                {recipient.charAt(0)}
              </div>
              <div className="recipient-meta">
                <h4>Paying {recipient}</h4>
                <p>via {selectedApp.name} ({upiId || 'UPI Verified'})</p>
              </div>
            </div>

            <div className="gpay-amount-input-box">
              <span className="inr-symbol">₹</span>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="big-amount-input"
              />
            </div>

            <div className="form-field">
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Add a Note (optional)</label>
              <input
                placeholder="What's this for? (e.g. Lunch 🍕, Rent 🏠)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="gpay-bank-selector">
              <span className="selector-title">Select Debiting Bank Account</span>
              <div className="bank-options">
                {BANK_ACCOUNTS.map((b) => (
                  <div
                    key={b.name}
                    className={`bank-option ${selectedBank.name === b.name ? 'selected' : ''}`}
                    onClick={() => setSelectedBank(b)}
                  >
                    <span className="bank-icon">{b.logo}</span>
                    <div className="bank-info">
                      <span className="bank-name">{b.name}</span>
                      <span className="bank-acc">{b.accountNo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer mt-4">
              <button type="button" className="btn-secondary" onClick={() => setStep('contact')}>
                Back
              </button>
              <button
                type="submit"
                className="btn-primary gpay-btn-pay"
                disabled={!amount || parseFloat(amount) <= 0}
              >
                Proceed to Pay {amount ? `₹${amount}` : ''}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Enter UPI PIN */}
        {step === 'pin' && (
          <div className="gpay-upi-pin-screen">
            <div className="upi-pin-header">
              <ShieldCheck size={20} />
              <span>ENTER UPI PIN</span>
            </div>
            <div className="upi-tx-summary">
              <span>Sending {formatINR(parseFloat(amount))} to <strong>{recipient}</strong></span>
              <span className="sub-acc">From {selectedBank.name} ({selectedBank.accountNo})</span>
            </div>

            <div className="upi-pin-dots">
              {[0, 1, 2, 3, 4].map((idx) => (
                <div key={idx} className={`upi-dot ${upiPin.length > idx ? 'filled' : ''}`} />
              ))}
            </div>

            {pinError && <div className="gpay-error-alert">{pinError}</div>}
            <div className="upi-warning-text">
              <Lock size={12} /> UPI PIN required for safe transfer. Default PIN: <strong>23231</strong>
            </div>

            <div className="gpay-keypad dark-keypad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button key={num} type="button" className="gpay-key" onClick={() => handlePinKeyPress(num)}>
                  {num}
                </button>
              ))}
              <div className="gpay-key empty-key" />
              <button type="button" className="gpay-key" onClick={() => handlePinKeyPress('0')}>
                0
              </button>
              <button type="button" className="gpay-key gpay-key-action" onClick={handlePinDelete}>
                ⌫
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Processing State */}
        {step === 'processing' && (
          <div className="gpay-processing-screen">
            <RefreshCw size={54} className="spin-icon text-gpay-blue" />
            <h3>Paying {recipient}...</h3>
            <p>Communicating securely with {selectedBank.name} via {selectedApp.name}</p>
          </div>
        )}

        {/* Step 5: Success Screen */}
        {step === 'success' && (
          <div className="gpay-success-screen">
            <div className="success-badge-animated">
              <CheckCircle2 size={80} className="check-svg" />
            </div>
            <h2>Payment Successful!</h2>
            <div className="success-amount">{formatINR(parseFloat(amount))}</div>
            <p className="success-to">Paid to <strong>{recipient}</strong></p>
            <span className="success-time">{new Date().toLocaleString()}</span>

            <div className="gpay-receipt-card glass">
              <div className="receipt-row">
                <span>Payment App</span>
                <span>{selectedApp.name}</span>
              </div>
              <div className="receipt-row">
                <span>Debited Account</span>
                <span>{selectedBank.name}</span>
              </div>
              <div className="receipt-row">
                <span>UPI Ref / UTR</span>
                <span className="utr-code">{txRefNo}</span>
              </div>
              <div className="receipt-row">
                <span>Category</span>
                <span>{category}</span>
              </div>
              {note && (
                <div className="receipt-row">
                  <span>Note</span>
                  <span>"{note}"</span>
                </div>
              )}
            </div>

            <div className="receipt-actions">
              <button className="btn-secondary" onClick={handleResetModal}>
                <Download size={16} /> Save Receipt
              </button>
              <button className="btn-primary" onClick={handleResetModal}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
