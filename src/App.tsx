import { useState, useEffect } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardTab } from './tabs/DashboardTab';
import { LedgerTab } from './tabs/LedgerTab';
import { BudgetsTab } from './tabs/BudgetsTab';
import { GoalsTab } from './tabs/GoalsTab';
import { InsightsTab } from './tabs/InsightsTab';
import { GPayLogin } from './components/GPayLogin';
import { GPayTransactionModal } from './components/GPayTransactionModal';

function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('gpay_authenticated') === 'true';
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('gpay_user_name') || 'Kavipriya';
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('gpay_user_email') || 'kavipriya@gmail.com';
  });

  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);

  const handleLoginSuccess = (name: string, email: string) => {
    setUserName(name);
    setUserEmail(email);
    setIsAuthenticated(true);
    localStorage.setItem('gpay_authenticated', 'true');
    localStorage.setItem('gpay_user_name', name);
    localStorage.setItem('gpay_user_email', email);
  };

  const handleLockSession = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('gpay_authenticated');
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab setActiveTab={setActiveTab} />;
      case 'ledger':
        return <LedgerTab />;
      case 'budgets':
        return <BudgetsTab />;
      case 'goals':
        return <GoalsTab />;
      case 'insights':
        return <InsightsTab />;
      default:
        return <DashboardTab setActiveTab={setActiveTab} />;
    }
  };

  return (
    <FinanceProvider>
      {!isAuthenticated ? (
        <GPayLogin onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="app-container">
          {/* Sidebar Left Navigation */}
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Main Content Area */}
          <div className="app-main">
            {/* Header Banner */}
            <Header
              activeTab={activeTab}
              userName={userName}
              userEmail={userEmail}
              onLockApp={handleLockSession}
              onOpenPayModal={() => setIsPayModalOpen(true)}
            />

            {/* Scrollable Tab Panel */}
            <main className="app-content-wrapper">
              {renderActiveTab()}
            </main>
          </div>

          {/* Global GPay Transaction Modal */}
          <GPayTransactionModal
            isOpen={isPayModalOpen}
            onClose={() => setIsPayModalOpen(false)}
          />
        </div>
      )}
    </FinanceProvider>
  );
}

export default App;

