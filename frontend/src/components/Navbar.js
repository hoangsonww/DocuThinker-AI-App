import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Drawer, Box, List, ListItem, ListItemText } from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const activeStyle = {
  borderBottom: '3px solid #f57c00',
  borderRadius: '12px 12px 0 0',
  paddingBottom: '4px',
};

const Navbar = ({ theme, onThemeToggle, isLoggedIn, onLogout }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const hoverStyle = {
    '&:hover': {
      color: theme === 'dark' ? 'white' : 'black',
    },
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    onLogout();
    navigate('/login');
  };

  const renderNavLinks = (
      <>
        <Button
            component={NavLink}
            to="/home"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            sx={{ color: theme === 'dark' ? 'white' : 'black', marginRight: 2, font: 'inherit', textTransform: 'none' }}
        >
          Home
        </Button>
        <Button
            component={NavLink}
            to="/how-to-use"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            sx={{ color: theme === 'dark' ? 'white' : 'black', marginRight: 2, font: 'inherit', textTransform: 'none' }}
        >
          How to Use
        </Button>
        <Button
            component={NavLink}
            to="/documents"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            sx={{ color: theme === 'dark' ? 'white' : 'black', marginRight: 2, font: 'inherit', textTransform: 'none' }}
        >
          Documents
        </Button>

        {/* Conditionally render Login or Logout based on isLoggedIn */}
        {isLoggedIn ? (
            <Button
                onClick={handleLogout}
                sx={{
                  color: 'red',
                  marginRight: 2,
                  font: 'inherit',
                  textTransform: 'none',
                  ...hoverStyle,
                }}
            >
              Logout
            </Button>
        ) : (
            <Button
                component={NavLink}
                to="/login"
                style={({ isActive }) => (isActive ? activeStyle : undefined)}
                sx={{
                  color: theme === 'dark' ? 'white' : 'black',
                  marginRight: 2,
                  font: 'inherit',
                  textTransform: 'none',
                  ...hoverStyle,
                }}
            >
              Login
            </Button>
        )}

        <Button
            component={NavLink}
            to="/register"
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            sx={{ color: theme === 'dark' ? 'white' : 'black', font: 'inherit', textTransform: 'none' }}
        >
          Register
        </Button>
      </>
  );

  return (
      <AppBar
          position="static"
          sx={{
            bgcolor: theme === 'dark' ? '#333' : 'white',
            padding: 1,
            transition: 'background-color 0.3s ease, color 0.3s ease',
          }}
      >
        <Toolbar>
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

          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>{renderNavLinks}</Box>

          <IconButton
              onClick={onThemeToggle}
              sx={{ marginLeft: 2, color: theme === 'dark' ? 'white' : 'black' }}
          >
            {theme === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ display: { xs: 'flex', md: 'none', marginLeft: '4px' } }}
              onClick={toggleDrawer(true)}
          >
            <MenuIcon sx={{ color: theme === 'dark' ? 'white' : 'black' }} />
          </IconButton>
        </Toolbar>

        <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
          <Box
              sx={{ width: 250, padding: 2, height: '100%', bgcolor: theme === 'dark' ? '#333' : 'white' }}
              role="presentation"
              onClick={toggleDrawer(false)}
              onKeyDown={toggleDrawer(false)}
          >
            <List sx={{ bgcolor: theme === 'dark' ? '#333' : 'white' }}>
              <ListItem button component={NavLink} to="/home" sx={{ color: theme === 'dark' ? 'white' : 'black', '&:hover': hoverStyle, borderRadius: '8px' }}>
                <ListItemText disableTypography={true} primary="Home" />
              </ListItem>
              <ListItem button component={NavLink} to="/how-to-use" sx={{ color: theme === 'dark' ? 'white' : 'black', '&:hover': hoverStyle, borderRadius: '8px' }}>
                <ListItemText disableTypography={true} primary="How to Use" />
              </ListItem>

              {isLoggedIn ? (
                  <ListItem button onClick={handleLogout} sx={{ color: 'red', '&:hover': hoverStyle, borderRadius: '8px' }}>
                    <ListItemText disableTypography={true} primary="Logout" />
                  </ListItem>
              ) : (
                  <ListItem button component={NavLink} to="/login" sx={{ color: theme === 'dark' ? 'white' : 'black', '&:hover': hoverStyle, borderRadius: '8px' }}>
                    <ListItemText disableTypography={true} primary="Login" />
                  </ListItem>
              )}

              <ListItem button component={NavLink} to="/register" sx={{ color: theme === 'dark' ? 'white' : 'black', '&:hover': hoverStyle, borderRadius: '8px' }}>
                <ListItemText disableTypography={true} primary="Register" />
              </ListItem>
            </List>
          </Box>
        </Drawer>
      </AppBar>
  );
};

export default Navbar;
