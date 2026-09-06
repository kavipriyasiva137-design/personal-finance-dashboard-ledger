import React, { useState } from 'react';
import { Delete, Check, Lock } from 'lucide-react';

export default function NumberLock({ onPinComplete, title }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const correctPin = userObj.appLockPin || '8899';
  const targetLength = correctPin.length;

  const handleKeyPress = (num) => {
    if (pin.length < targetLength) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
      // Auto-submit when target length reached
      if (newPin.length === targetLength) {
        onPinComplete(newPin, (isValid) => {
          if (isValid) {
            setSuccess(true);
            setError('');
          } else {
            setError('Incorrect PIN. Try again.');
            setTimeout(() => { setPin(''); setSuccess(false); }, 500);
          }
        });
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleConfirm = () => {
    if (pin.length === targetLength) {
      onPinComplete(pin, (isValid) => {
        if (isValid) {
          setSuccess(true);
          setError('');
        } else {
          setError('Incorrect PIN. Try again.');
          setTimeout(() => { setPin(''); setSuccess(false); }, 500);
        }
      });
    } else {
      setError(`Enter a ${targetLength}-digit PIN.`);
    }
  };

  return (
    <div className="number-lock-wrapper">
      {title && <p className="number-lock-title">{title}</p>}

      <div className="number-lock-dots">
        {Array.from({ length: targetLength }).map((_, i) => (
          <div
            key={i}
            className={`number-lock-dot ${pin.length > i ? 'filled' : ''} ${error ? 'error-shake' : ''} ${success ? 'success' : ''}`}
          />
        ))}
      </div>

      {error && <p className="number-lock-error">{error}</p>}
      {success && <p className="number-lock-success">Unlocked ✓</p>}

      <div className="number-lock-keypad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            type="button"
            className="number-lock-key"
            onClick={() => handleKeyPress(num.toString())}
            disabled={success}
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          className="number-lock-key number-lock-key-action"
          onClick={handleDelete}
          disabled={success}
          aria-label="Delete"
        >
          <Delete size={22} />
        </button>
        <button
          type="button"
          className="number-lock-key"
          onClick={() => handleKeyPress('0')}
          disabled={success}
        >
          0
        </button>
        <button
          type="button"
          className="number-lock-key number-lock-key-confirm"
          onClick={handleConfirm}
          disabled={success}
          aria-label="Confirm"
        >
          <Check size={24} />
        </button>
      </div>
    </div>
  );
}
