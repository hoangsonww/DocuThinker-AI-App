import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import GoogleAnalytics from './components/GoogleAnalytics';
import Home from './pages/Home';
import HowToUse from './pages/HowToUse';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import ForgotPassword from './pages/ForgotPassword';
import './App.css';
import './styles.css';
import '@fontsource/poppins';

// Retrieve the user's theme preference from localStorage
const getStoredTheme = () => {
  return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
};

// Custom hook to track page views
function useTrackPageView() {
  const location = useLocation();

  useEffect(() => {
    if (window.gtag) {
      window.gtag('config', 'G-RZBP95EQ7L', {
        page_path: location.pathname,
      });
    }
  }, [location]);
}

function App() {
  const [theme, setTheme] = useState(getStoredTheme());
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = theme === 'dark' ? '#121212' : '#ffffff';
  }, [theme]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
      <Router>
        <GoogleAnalytics />
        <TrackPageView />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar theme={theme} onThemeToggle={handleThemeToggle} isLoggedIn={isLoggedIn} onLogout={() => setIsLoggedIn(false)} />
          <Box sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/home" element={<Home theme={theme} />} />
              <Route path="/" element={<LandingPage theme={theme} />} />
              <Route path="/landing" element={<LandingPage theme={theme} />} />
              <Route path="/how-to-use" element={<HowToUse theme={theme} />} />
              <Route path="/forgot-password" element={<ForgotPassword theme={theme} />} />
              <Route
                  path="/login"
                  element={<Login onLogin={() => setIsLoggedIn(true)} theme={theme} />}
              />
              <Route path="/register" element={<Register theme={theme} />} />
            </Routes>
          </Box>
          <Footer />
        </Box>
      </Router>
  );
}

// New Component that uses the custom hook to track page views
function TrackPageView() {
  useTrackPageView(); // Hook is called inside the Router now
  return null; // This component doesn't render anything
}

export default App;
