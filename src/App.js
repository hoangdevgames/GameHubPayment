import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './Header';
import MainContent from './MainContent';
import BottomNavigation from './BottomNavigation';
import PaymentPage from './PaymentPage';
import PaymentSuccess from './PaymentSuccess';
import PaymentFailed from './PaymentFailed';
import './App.css';

const AppContent = () => {
  const { shouldRedirectToPayment, clearRedirectFlag } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [showPaymentView, setShowPaymentView] = useState(false);
  const [showSuccessView, setShowSuccessView] = useState(false);
  const [showFailedView, setShowFailedView] = useState(false);

  // Auto-show payment view when coming from GamingHub
  useEffect(() => {
    if (shouldRedirectToPayment) {
      clearRedirectFlag();
      setShowPaymentView(true);
      setActiveTab('payment');
    }
  }, [shouldRedirectToPayment, clearRedirectFlag]);

  const renderActiveView = () => {
    if (showPaymentView) {
      return <PaymentPage onSuccess={() => setShowSuccessView(true)} onFailed={() => setShowFailedView(true)} />;
    }
    
    if (showSuccessView) {
      return <PaymentSuccess onReturn={() => setShowSuccessView(false)} />;
    }
    
    if (showFailedView) {
      return <PaymentFailed onRetry={() => setShowFailedView(false)} onReturn={() => setShowFailedView(false)} />;
    }

    switch (activeTab) {
      case 'home':
        return <MainContent activeTab={activeTab} />;
      case 'payment':
        return <PaymentPage onSuccess={() => setShowSuccessView(true)} onFailed={() => setShowFailedView(true)} />;
      default:
        return <MainContent activeTab={activeTab} />;
    }
  };

  return (
    <div className="App">
      {!showPaymentView && !showSuccessView && !showFailedView && (
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
      {renderActiveView()}
      {!showPaymentView && !showSuccessView && !showFailedView && (
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App; 