import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import HowToUse from './pages/HowToUse';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import ForgotPassword from "./pages/ForgotPassword";
import './App.css';
import './styles.css';
import '@fontsource/poppins';

// Retrieve the user's theme preference from localStorage
const getStoredTheme = () => {
  return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
};

function App() {
  const [theme, setTheme] = useState(getStoredTheme());

  // Apply theme on app load
  useEffect(() => {
    document.body.style.backgroundColor = theme === 'dark' ? '#121212' : '#ffffff';
  }, [theme]);

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme); // Store the theme preference in localStorage
  };

  return (
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar theme={theme} onThemeToggle={handleThemeToggle} />
          <Box sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/home" element={<Home theme={theme} />} />
              <Route path="/" element={<LandingPage theme={theme} />} />
              <Route path="/landing" element={<LandingPage theme={theme} />} />
              <Route path="/how-to-use" element={<HowToUse theme={theme} />} />
              <Route path="/forgot-password" element={<ForgotPassword theme={theme} />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register theme={theme} />} />
            </Routes>
          </Box>
          <Footer />
        </Box>
      </Router>
  );
}

export default App;
