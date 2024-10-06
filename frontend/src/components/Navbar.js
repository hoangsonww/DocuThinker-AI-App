import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { NavLink } from 'react-router-dom';

const activeStyle = {
  borderBottom: '3px solid #f57c00', // Orange border
  borderRadius: '12px 12px 0 0', // Rounded on top and bottom
  paddingBottom: '4px', // Ensure padding for better look
};

const Navbar = () => {
  return (
      <AppBar position="static" sx={{ bgcolor: 'white', padding: 1 }}>
        <Toolbar>
          {/* Logo Title */}
          <Typography
              variant="h1"
              component={NavLink}
              to="/"
              sx={{
                flexGrow: 1,
                color: '#f57c00',
                font: 'inherit',
                fontWeight: 'bold',
                fontSize: '2rem',
                textDecoration: 'none',
              }}
          >
            DocuThinker
          </Typography>

          {/* Navigation Links */}
          <Button
              component={NavLink}
              to="/home"
              style={({ isActive }) => (isActive ? activeStyle : undefined)}
              sx={{ color: 'black', marginRight: 2, font: 'inherit', textTransform: 'none' }}
          >
            Home
          </Button>
          <Button
              component={NavLink}
              to="/how-to-use"
              style={({ isActive }) => (isActive ? activeStyle : undefined)}
              sx={{ color: 'black', marginRight: 2, font: 'inherit', textTransform: 'none' }}
          >
            How to Use
          </Button>
          <Button
              component={NavLink}
              to="/login"
              style={({ isActive }) => (isActive ? activeStyle : undefined)}
              sx={{ color: 'black', font: 'inherit', textTransform: 'none' }}
          >
            Login
          </Button>
        </Toolbar>
      </AppBar>
  );
};

export default Navbar;
