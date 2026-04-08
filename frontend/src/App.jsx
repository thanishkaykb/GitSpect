import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import HistoryList from './components/HistoryList';
import Profile from './components/Profile';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentView, setCurrentView] = useState('dashboard');

  const handleLogin = (newToken) => {
    setToken(newToken);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="relative">
      {currentView === 'dashboard' && (
        <Dashboard 
          token={token} 
          onLogout={handleLogout} 
          onNavigate={setCurrentView} 
        />
      )}
      {currentView === 'history' && (
        <HistoryList 
          token={token} 
          onLogout={handleLogout} 
          onNavigate={setCurrentView} 
        />
      )}
      {currentView === 'profile' && (
        <Profile 
          token={token} 
          onLogout={handleLogout} 
          onNavigate={setCurrentView} 
        />
      )}
    </div>
  );
}

export default App;
