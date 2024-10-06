// src/components/Navbar.js
import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
      <AppBar position="static" sx={{ bgcolor: 'white', padding: 1 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#f57c00' }}>
            DocuThinker
          </Typography>
          <Button component={Link} to="/" sx={{ color: 'black', marginRight: 2 }}>Home</Button>
          <Button component={Link} to="/how-to-use" sx={{ color: 'black', marginRight: 2 }}>How to Use</Button>
          <Button component={Link} to="/login" sx={{ color: 'black' }}>Login</Button>
        </Toolbar>
      </AppBar>
  );
};

export default Navbar;
