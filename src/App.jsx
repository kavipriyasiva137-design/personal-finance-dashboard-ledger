import React, { useState, useEffect, useCallback } from 'react';
import { storage } from './storage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AppLockScreen from './components/AppLockScreen';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(storage.getUser());
  
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [goals, setGoals] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // App Lock state — always locked on launch by default
  const [isAppLocked, setIsAppLocked] = useState(() => {
    const setting = localStorage.getItem('appLockEnabled');
    // Default to locked (true) if no setting exists
    return setting === null ? true : setting === 'true';
  });

  // Load state from backend APIs
  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [txs, bud, gls, rws] = await Promise.all([
        storage.getTransactions(),
        storage.getBudgets(),
        storage.getGoals(),
        storage.getRewards()
      ]);
      setTransactions(txs);
      setBudgets(bud);
      setGoals(gls);
      setRewards(rws || []);
    } catch (err) {
      console.error('Error fetching dashboard records:', err);
      setError(err.message || 'Session expired or load failed');
      if (err.message.includes('Unauthorized') || err.message.includes('401')) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Load data when authenticated
  useEffect(() => {
    if (token) {
      loadData();
    } else {
      // Auto-login as default user admin@finsphere.com to bypass registration/login screen
      const autoLogin = async () => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@finsphere.com', password: '23231' }),
          });
          const data = await res.json();
          if (res.ok && data.token) {
            handleLoginSuccess(data.token, data.user);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        } catch (err) {
          console.error("Auto login failed", err);
        }
      };
      autoLogin();
    }
  }, [token, loadData]);

  const handleLoginSuccess = (loginToken, loginUser) => {
    setToken(loginToken);
    setUser(loginUser);
  };

  const handleLogout = () => {
    storage.logout();
    setToken(null);
    setUser(null);
    setTransactions([]);
    setBudgets({});
    setGoals([]);
    setRewards([]);
  };

  const handleProfileUpdate = (newToken, updatedUser) => {
    if (newToken) {
      setToken(newToken);
      localStorage.setItem('token', newToken);
    }
    setUser(updatedUser);
  };

  const handleAppUnlock = () => {
    setIsAppLocked(false);
  };

  // If app lock is enabled and not yet unlocked, show the lock screen FIRST
  if (isAppLocked) {
    return <AppLockScreen onUnlock={handleAppUnlock} />;
  }

  return (
    <>
      {token ? (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          transactions={transactions}
          budgets={budgets}
          goals={goals}
          rewards={rewards}
          refreshData={loadData}
          isLoading={isLoading}
          onProfileUpdate={handleProfileUpdate}
        />
      ) : (
        <Auth onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}
