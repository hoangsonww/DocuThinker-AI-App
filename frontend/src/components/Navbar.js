// src/components/Navbar.js
import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
      <AppBar position="static" sx={{ bgcolor: 'white', padding: 1 }}>
        <Toolbar>
          <Typography variant="h1" component="div" sx={{ flexGrow: 1, color: '#f57c00', font: 'inherit', fontWeight: 'bold', fontSize: '2rem' }}>
            DocuThinker
          </Typography>
          <Button component={Link} to="/" sx={{ color: 'black', marginRight: 2, font: 'inherit' }}>Home</Button>
          <Button component={Link} to="/how-to-use" sx={{ color: 'black', marginRight: 2, font: 'inherit' }}>How to Use</Button>
          <Button component={Link} to="/login" sx={{ color: 'black', font: 'inherit' }}>Login</Button>
        </Toolbar>
      </AppBar>
  );
};

export default Navbar;
