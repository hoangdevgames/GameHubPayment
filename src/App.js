import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

  // Auto-redirect to payment page when coming from GamingHub
  useEffect(() => {
    if (shouldRedirectToPayment) {
      clearRedirectFlag();
      // Sửa lại để luôn redirect đúng path trên GitHub Pages
      window.location.href = `${process.env.PUBLIC_URL}/payment`;
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