import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import MainContent from './components/MainContent';
import BottomNavigation from './components/BottomNavigation';
import PaymentPage from './components/PaymentPage';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentFailed from './components/PaymentFailed';
import './App.css';

const AppContent = () => {
  const { shouldRedirectToPayment, clearRedirectFlag } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  // Auto-redirect to payment page when coming from GamingHub
  useEffect(() => {
    if (shouldRedirectToPayment) {
      clearRedirectFlag();
      window.location.href = '/payment';
    }
  }, [shouldRedirectToPayment, clearRedirectFlag]);

  return (
    <div className="App">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <Routes>
        <Route path="/" element={
          <>
            <MainContent activeTab={activeTab} />
            <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
          </>
        } />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/success" element={<PaymentSuccess />} />
        <Route path="/failed" element={<PaymentFailed />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App; 