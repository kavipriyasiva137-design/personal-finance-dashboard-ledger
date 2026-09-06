import React, { useState } from 'react';
import { X, Delete, Check, Shield } from 'lucide-react';

export default function PinModal({ isOpen, onSubmit, onClose, title, subtitle, amount }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const correctPin = userObj.gpayPin || '23231';
  const pinLength = correctPin.length;

  const handleKeyPress = (num) => {
    if (pin.length < pinLength) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleCheck = () => {
    if (pin.length === pinLength) {
      if (pin === correctPin) {
        setIsSuccess(true);
        // Delay parent onSubmit callback to allow showing success state
        setTimeout(() => {
          onSubmit();
          setIsSuccess(false);
          setPin('');
        }, 6000);
      } else {
        setError('Incorrect UPI PIN. Please try again.');
        setPin('');
      }
    } else {
      setError(`Please enter a ${pinLength}-digit PIN.`);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const isBalance = title && title.toLowerCase().includes('balance');

  return (
    <div className="upi-pin-overlay">
      {isSuccess ? (
        <div className="gpay-success-popup">
          
          {/* Custom Success Badge */}
          <div 
            className="gpay-success-badge-container"
            style={{ borderColor: isBalance ? 'rgba(99, 102, 241, 0.3)' : 'rgba(16, 185, 129, 0.3)' }}
          >
            {isBalance ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', background: 'rgba(99, 102, 241, 0.08)' }}>
                <Shield size={54} style={{ color: 'var(--primary)' }} />
              </div>
            ) : (
              <img 
                src="/gpay_payment_success_badge.jpg" 
                alt="Payment Successful" 
                className="gpay-success-badge-img" 
              />
            )}
          </div>

          <h2 className="gpay-success-title">
            {isBalance ? 'PIN Verified!' : 'Successfull Payed!'}
          </h2>
          
          {!isBalance && amount !== undefined && (
            <p className="gpay-success-amount">{formatCurrency(amount)}</p>
          )}

          <div className="gpay-success-details">
            {isBalance ? (
              <>
                <p><strong>Action:</strong> Check Account Balance</p>
                <p><strong>Status:</strong> Verification Passed</p>
              </>
            ) : (
              <>
                <p><strong>To:</strong> {title || 'Merchant'}</p>
                <p><strong>UPI Transaction ID:</strong> {Math.floor(100000000000 + Math.random() * 900000000000)}</p>
                <p><strong>Status:</strong> Successfull Payed</p>
              </>
            )}
          </div>
          <button 
            type="button" 
            className="btn btn-success" 
            style={{ width: '100%', marginTop: '20px', borderRadius: '12px', padding: '12px', fontWeight: 'bold' }}
            onClick={() => {
              onSubmit();
              setIsSuccess(false);
              setPin('');
            }}
          >
            Done
          </button>
        </div>
      ) : (
        <div className="upi-pin-container">
          <div className="upi-header">
            <div className="upi-brand">
              <Shield className="upi-icon" size={20} />
              <span>Track My Money Secure UPI</span>
            </div>
            <button className="upi-close" onClick={onClose} aria-label="Close UPI secure window">
              <X size={20} />
            </button>
          </div>

          <div className="upi-payment-info">
            {title && <h3 className="upi-title">{title}</h3>}
            {subtitle && <p className="upi-subtitle">{subtitle}</p>}
            {amount !== undefined && (
              <div className="upi-amount">{formatCurrency(amount)}</div>
            )}
          </div>

          <div className="upi-pin-display-section">
            <p className="upi-input-label">ENTER {pinLength}-DIGIT UPI PIN</p>
            <div className="upi-dots-wrapper">
              {Array.from({ length: pinLength }).map((_, i) => (
                <div
                  key={i}
                  className={`upi-dot ${pin.length > i ? 'active' : ''}`}
                ></div>
              ))}
            </div>
            {error && <p className="upi-error-msg">{error}</p>}
          </div>

          {/* NUM KEYPAD */}
          <div className="upi-keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                className="upi-key-btn"
                onClick={() => handleKeyPress(num.toString())}
              >
                {num}
              </button>
            ))}
            
            <button
              type="button"
              className="upi-key-btn upi-key-delete"
              onClick={handleDelete}
              aria-label="Delete"
            >
              <Delete size={22} />
            </button>
            
            <button
              type="button"
              className="upi-key-btn"
              onClick={() => handleKeyPress('0')}
            >
              0
            </button>
            
            <button
              type="button"
              className="upi-key-btn upi-key-confirm"
              onClick={handleCheck}
              aria-label="Confirm"
            >
              <Check size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
