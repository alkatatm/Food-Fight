import React, { useState } from 'react';
import './App.css';
import {Routes, Route, useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm/RegistrationForm.js';
import LoginForm from './components/LoginForm/LoginForm';
import Dashboard from './components/Dashboard/Dashboard';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react'; 
import logo from './images/logo.png';
import { UserProvider } from './components/UserContext/UserContext'; // Import the provider

function App() {
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);

  const handleLogin = (userId) => {
    setUserId(userId);
  };
  useEffect(() => {
    if (location.pathname === '/login') {
      setShowLoginModal(true);
      setShowRegistrationModal(false);
    } else if (location.pathname === '/register') {
      setShowLoginModal(false);
      setShowRegistrationModal(true);
    } else {
      setShowLoginModal(false);
      setShowRegistrationModal(false);
    }
  }, [location.pathname]);
  
  const openRegistrationModal = () => {
    setShowRegistrationModal(true);
    navigate('/register');
  };

  const closeRegistrationModal = () => {
    setShowRegistrationModal(false);
    navigate('/'); // Navigates to the base URL
  };

  const openLoginModal = () => {
    setShowLoginModal(true);
    navigate('/login'); 
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    navigate('/'); // Navigates to the base URL
  };

  if (location.pathname === '/dashboard') {
    return <UserProvider>
    <Dashboard />
  </UserProvider>
  }

  <Routes>
  <Route path="/" element={<Outlet />} />
  <Route path="/register" element={<Outlet />} />
  <Route path="/dashboard" element={<Dashboard userId={userId}/>}/>
</Routes>

  return (
  <UserProvider>
      <div className="App">
        <img src={logo} alt="Company Logo" className="company-logo" />
        <h1>Food Wars</h1>

        <div className="button-container">
          <button onClick={openRegistrationModal}>Register</button>
          <button onClick={openLoginModal}>Login</button>
        </div>

        {showRegistrationModal && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={closeRegistrationModal}>
                &times;
              </span>
              <RegistrationForm />
            </div>
          </div>
        )}

        {showLoginModal && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={closeLoginModal}>
                &times;
              </span>
              <Routes>
              <Route path="/login" element={<LoginForm onLogin={handleLogin} />} />
              </Routes>
            </div>
          </div>
        )}
    </div>
    </UserProvider>
  );
}

export default App;
