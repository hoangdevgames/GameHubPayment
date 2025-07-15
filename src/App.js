import React, { useState } from 'react';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import MainContent from './components/MainContent';
import BottomNavigation from './components/BottomNavigation';

function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <AuthProvider>
      <div className="App">
        <Header />
        <MainContent activeTab={activeTab} />
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </AuthProvider>
  );
}

export default App; 