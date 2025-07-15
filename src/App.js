import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import MainContent from './components/MainContent';
import BottomNavigation from './components/BottomNavigation';

function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="App">
      <Header />
      <MainContent activeTab={activeTab} />
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App; 