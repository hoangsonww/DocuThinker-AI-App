// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import HowToUse from './pages/HowToUse';
import Login from './pages/Login';
import LandingPage from "./pages/LandingPage";
import './App.css';
import './styles.css';
import '@fontsource/poppins';

function App() {
  return (
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <Box sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/" element={<LandingPage />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/how-to-use" element={<HowToUse />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </Box>
          <Footer />
        </Box>
      </Router>
  );
}

export default App;
