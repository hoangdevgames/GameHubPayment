import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './Header';
import MainContent from './MainContent';
import BottomNavigation from './BottomNavigation';
import PaymentPage from './PaymentPage';
import PaymentSuccess from './PaymentSuccess';
import PaymentFailed from './PaymentFailed';
import StarletStore from './components/StarletStore';
import InsufficientDataPopup from './components/InsufficientDataPopup';
import './App.css';

const AppContent = () => {
  const { 
    selectedPackage, 
    clearSelectedPackage,
    showInsufficientDataPopup,
    missingDataFields,
    setShowInsufficientDataPopup
  } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [showPaymentView, setShowPaymentView] = useState(false);
  const [showSuccessView, setShowSuccessView] = useState(false);
  const [showFailedView, setShowFailedView] = useState(false);
  const [transactionData, setTransactionData] = useState(null);

  // Show payment view when package is selected from MainContent
  useEffect(() => {
    if (selectedPackage) {
      setShowPaymentView(true);
      setActiveTab('payment');
    }
  }, [selectedPackage]);

  const renderActiveView = () => {
    if (showPaymentView) {
      return <PaymentPage 
        onSuccess={(data) => {
          setTransactionData(data);
          setShowSuccessView(true);
          setShowPaymentView(false);
          clearSelectedPackage();
        }} 
        onFailed={() => {
          setShowFailedView(true);
          clearSelectedPackage();
        }} 
        onBack={() => {
          setShowPaymentView(false);
          clearSelectedPackage();
        }}
      />;
    }
    
    if (showSuccessView) {
      return <PaymentSuccess 
        onReturn={() => {
          setShowSuccessView(false);
          setTransactionData(null);
        }} 
        transactionData={transactionData}
      />;
    }
    
    if (showFailedView) {
      return <PaymentFailed 
        onRetry={() => setShowFailedView(false)} 
        onReturn={() => setShowFailedView(false)} 
      />;
    }

    switch (activeTab) {
      case 'home':
        return <MainContent activeTab={activeTab} />;
      case 'payment':
        return <PaymentPage 
          onSuccess={(data) => {
            setTransactionData(data);
            setShowSuccessView(true);
            setShowPaymentView(false);
            clearSelectedPackage();
          }} 
          onFailed={() => {
            setShowFailedView(true);
            clearSelectedPackage();
          }}
          onBack={() => {
            setActiveTab('home');
            clearSelectedPackage();
          }}
        />;
      case 'starlet-store':
        return <StarletStore />;
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
      {/* {!showPaymentView && !showSuccessView && !showFailedView && (
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      )} */}
      
      {/* Insufficient Data Warning Popup */}
      <InsufficientDataPopup
        isOpen={showInsufficientDataPopup}
        missingFields={missingDataFields}
        onClose={() => setShowInsufficientDataPopup(false)}
      />
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