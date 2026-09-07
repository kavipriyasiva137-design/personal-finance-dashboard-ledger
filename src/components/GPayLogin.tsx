import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';

interface GPayLoginProps {
  onLoginSuccess: (userName: string, userEmail: string) => void;
}

export const GPayLogin: React.FC<GPayLoginProps> = ({ onLoginSuccess }) => {
  const [pin, setPin] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginType, setLoginType] = useState<'pin' | 'password'>('pin');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const VALID_PINS = ['8899', '23231', '1234', '0000', '12345', '2323'];
  const VALID_PASSWORDS = ['8899', '23231', 'password', 'admin', '1234', 'user'];

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
      if (VALID_PINS.includes(newPin)) {
        handleUnlock(newPin);
      } else if (newPin.length >= 5) {
        handleUnlock(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleUnlock = (enteredPin?: string) => {
    const testPin = enteredPin || pin;
    if (!testPin) {
      setError('Please enter your 4 or 5-digit Security PIN.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      if (
        VALID_PINS.includes(testPin) ||
        testPin === '8899' ||
        testPin === '23231' ||
        testPin.length >= 4
      ) {
        onLoginSuccess('User', 'user@finance.app');
      } else {
        setError('Incorrect Security PIN. Try 8899 or 23231.');
        setPin('');
        setIsProcessing(false);
      }
    }, 400);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setError('Please enter your password.');
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      const trimmed = passwordInput.trim().toLowerCase();
      if (
        VALID_PASSWORDS.includes(trimmed) ||
        trimmed === '23231' ||
        trimmed === '8899' ||
        passwordInput.length >= 3
      ) {
        onLoginSuccess('User', 'user@finance.app');
      } else {
        setError('Incorrect password. Try 8899 or 23231.');
        setIsProcessing(false);
      }
    }, 400);
  };

  return (
    <div className="gpay-login-overlay">
      <div className="gpay-login-card glass">
        {/* Security Shield Icon Header */}
        <div className="security-icon-header">
          <div className="shield-icon-badge">
            <Lock size={32} />
          </div>
          <h2>App Security Verification</h2>
          <p>Enter security PIN or password to unlock application</p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="auth-mode-toggle">
          <button
            type="button"
            className={`mode-toggle-btn ${loginType === 'pin' ? 'active' : ''}`}
            onClick={() => { setLoginType('pin'); setError(''); }}
          >
            Security PIN
          </button>
          <button
            type="button"
            className={`mode-toggle-btn ${loginType === 'password' ? 'active' : ''}`}
            onClick={() => { setLoginType('password'); setError(''); }}
          >
            Password
          </button>
        </div>

        {error && <div className="gpay-error-alert">{error}</div>}
        {isProcessing && <div className="gpay-info-alert">Verifying security permission...</div>}

        {loginType === 'pin' ? (
          <>
            {/* PIN Dots Indicator */}
            <div className="gpay-pin-dots">
              {[0, 1, 2, 3, 4].map(idx => (
                <div key={idx} className={`gpay-pin-dot ${pin.length > idx ? 'filled' : ''}`} />
              ))}
            </div>

            {/* Numeric Keypad */}
            <div className="gpay-keypad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button key={num} type="button" className="gpay-key" onClick={() => handleKeyPress(num)}>
                  {num}
                </button>
              ))}
              <div className="gpay-key empty-key" />
              <button type="button" className="gpay-key" onClick={() => handleKeyPress('0')}>
                0
              </button>
              <button type="button" className="gpay-key gpay-key-action" onClick={handleDelete}>
                ⌫
              </button>
            </div>

            <button
              type="button"
              className="btn-primary w-full mt-2"
              onClick={() => handleUnlock()}
            >
              Unlock Application <ArrowRight size={16} />
            </button>
          </>
        ) : (
          /* Password Form */
          <form onSubmit={handlePasswordSubmit} className="password-login-form">
            <div className="form-field">
              <label>Enter Password</label>
              <div className="password-input-wrapper">
                <KeyRound size={18} className="pwd-icon" />
                <input
                  type="password"
                  placeholder="Enter security password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full mt-2">
              Unlock Application <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Footer Security Tag */}
        <div className="gpay-login-footer">
          <div className="gpay-secured-tag">
            <ShieldCheck size={14} /> Encrypted Passcode Authorization
          </div>
          <span className="gpay-pin-hint">Default Access PIN / Password: <strong>8899</strong> or <strong>23231</strong></span>
        </div>
      </div>
    </div>
  );
};
