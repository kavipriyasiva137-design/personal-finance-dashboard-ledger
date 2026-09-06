import React, { useState, useEffect } from 'react';
import { Shield, Fingerprint, Lock, KeyRound } from 'lucide-react';
import NumberLock from './NumberLock';
import PatternLock from './PatternLock';

export default function AppLockScreen({ onUnlock }) {
  const [lockType, setLockType] = useState('number'); // 'number' or 'pattern'
  const [userName, setUserName] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Read saved lock preference
    const savedType = localStorage.getItem('appLockType') || 'number';
    setLockType(savedType);

    // Read user name from storage
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUserName(savedUser.name || 'User');

    // Update time
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNumberComplete = (pin, callback) => {
    const userObj = JSON.parse(localStorage.getItem('user') || '{}');
    const correctPin = userObj.appLockPin || '8899';
    if (pin === correctPin) {
      callback(true);
      setTimeout(() => onUnlock(), 400);
    } else {
      callback(false);
    }
  };

  const handlePatternComplete = (pattern, callback) => {
    const savedPattern = localStorage.getItem('appLockPattern') || '';
    if (!savedPattern) {
      // No pattern set yet; any pattern unlocks (first-time)
      callback(true);
      setTimeout(() => onUnlock(), 400);
    } else if (pattern === savedPattern) {
      callback(true);
      setTimeout(() => onUnlock(), 400);
    } else {
      callback(false);
    }
  };

  const switchLockType = () => {
    setLockType(prev => prev === 'number' ? 'pattern' : 'number');
  };

  return (
    <div className="app-lock-screen">
      {/* Animated background particles */}
      <div className="app-lock-particles">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={`app-lock-particle particle-${i}`} />
        ))}
      </div>

      {/* Lock Screen Content */}
      <div className="app-lock-content">
        {/* Top clock area */}
        <div className="app-lock-clock">
          <span className="app-lock-time">{currentTime}</span>
        </div>

        {/* User avatar and branding */}
        <div className="app-lock-branding">
          <div className="app-lock-avatar">
            <Shield size={32} />
          </div>
          <h2 className="app-lock-user-name">{userName}</h2>
          <p className="app-lock-subtitle">
            {lockType === 'number' ? 'Enter your 4-digit PIN to unlock' : 'Draw your pattern to unlock'}
          </p>
        </div>

        {/* Lock area */}
        <div className="app-lock-input-area">
          {lockType === 'number' ? (
            <NumberLock
              onPinComplete={handleNumberComplete}
            />
          ) : (
            <PatternLock
              mode="verify"
              onPatternComplete={handlePatternComplete}
            />
          )}
        </div>

        {/* Switch lock type */}
        <button className="app-lock-switch-btn" onClick={switchLockType}>
          {lockType === 'number' ? (
            <><Fingerprint size={16} /> Use Pattern Lock</>
          ) : (
            <><KeyRound size={16} /> Use Number PIN</>
          )}
        </button>

        {/* Footer branding */}
        <div className="app-lock-footer">
          <Lock size={14} />
          <span>Track My Money Secure</span>
        </div>
      </div>
    </div>
  );
}
