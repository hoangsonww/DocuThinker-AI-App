import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { NavLink, useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import HomeIcon from "@mui/icons-material/Home";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import DescriptionIcon from "@mui/icons-material/Description";
import PersonIcon from "@mui/icons-material/Person";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import LoginIcon from "@mui/icons-material/Login";
import AppRegistrationIcon from "@mui/icons-material/AppRegistration";

const activeStyle = {
  borderBottom: "3px solid #f57c00",
  borderRadius: "12px 12px 0 0",
  paddingBottom: "4px",
};

const Navbar = ({ theme, onThemeToggle, onLogout }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoggedInStatus = () => {
      const userId = localStorage.getItem("userId");
      setIsLoggedIn(!!userId);
    };

    checkLoggedInStatus();

    const interval = setInterval(checkLoggedInStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    onLogout();
    navigate("/login");
    setIsLoggedIn(false);
  };

  const renderNavLinks = (
    <>
      <Button
        component={NavLink}
        to="/home"
        style={({ isActive }) => (isActive ? activeStyle : undefined)}
        sx={{
          color: theme === "dark" ? "white" : "black",
          marginRight: 2,
          font: "inherit",
          textTransform: "none",
          display: "flex",
          alignItems: "center",
          transition: "transform 0.2s ease",
          "&:hover": {
            bgcolor: theme === "dark" ? "#444" : "#f5f5f5",
            transform: { xs: "none", md: "scale(1.04)" },
          },
        }}
      >
        <HomeIcon sx={{ marginRight: 1 }} /> Home
      </Button>
      <Button
        component={NavLink}
        to="/how-to-use"
        style={({ isActive }) => (isActive ? activeStyle : undefined)}
        sx={{
          color: theme === "dark" ? "white" : "black",
          marginRight: 2,
          font: "inherit",
          textTransform: "none",
          display: "flex",
          alignItems: "center",
          transition: "transform 0.2s ease",
          "&:hover": {
            bgcolor: theme === "dark" ? "#444" : "#f5f5f5",
            transform: { xs: "none", md: "scale(1.04)" },
          },
        }}
      >
        <HelpOutlineIcon sx={{ marginRight: 1 }} /> How to Use
      </Button>
      <Button
        component={NavLink}
        to="/documents"
        style={({ isActive }) => (isActive ? activeStyle : undefined)}
        sx={{
          color: theme === "dark" ? "white" : "black",
          marginRight: 2,
          font: "inherit",
          textTransform: "none",
          display: "flex",
          alignItems: "center",
          transition: "transform 0.2s ease",
          "&:hover": {
            bgcolor: theme === "dark" ? "#444" : "#f5f5f5",
            transform: { xs: "none", md: "scale(1.04)" },
          },
        }}
      >
        <DescriptionIcon sx={{ marginRight: 1 }} /> Documents
      </Button>
      <Button
        component={NavLink}
        to="/profile"
        style={({ isActive }) => (isActive ? activeStyle : undefined)}
        sx={{
          color: theme === "dark" ? "white" : "black",
          marginRight: 2,
          font: "inherit",
          textTransform: "none",
          display: "flex",
          alignItems: "center",
          transition: "transform 0.2s ease",
          "&:hover": {
            bgcolor: theme === "dark" ? "#444" : "#f5f5f5",
            transform: { xs: "none", md: "scale(1.04)" },
          },
        }}
      >
        <PersonIcon sx={{ marginRight: 1 }} /> Profile
      </Button>

      {isLoggedIn ? (
        <Button
          onClick={handleLogout}
          sx={{
            color: "red",
            "&:hover": { color: "white", transform: "scale(1.04)" },
            marginRight: 2,
            font: "inherit",
            textTransform: "none",
            display: "flex",
            alignItems: "center",
            transition: "transform 0.2s ease",
          }}
        >
          <ExitToAppIcon sx={{ marginRight: 1 }} /> Logout
        </Button>
      ) : (
        <Button
          component={NavLink}
          to="/login"
          style={({ isActive }) => (isActive ? activeStyle : undefined)}
          sx={{
            color: theme === "dark" ? "white" : "black",
            marginRight: 2,
            font: "inherit",
            textTransform: "none",
            display: "flex",
            alignItems: "center",
            transition: "transform 0.2s ease",
            "&:hover": {
              bgcolor: theme === "dark" ? "#444" : "#f5f5f5",
              transform: { xs: "none", md: "scale(1.04)" },
            },
          }}
        >
          <LoginIcon sx={{ marginRight: 1 }} /> Login
        </Button>
      )}

      <Button
        component={NavLink}
        to="/register"
        style={({ isActive }) => (isActive ? activeStyle : undefined)}
        sx={{
          color: theme === "dark" ? "white" : "black",
          font: "inherit",
          textTransform: "none",
          display: "flex",
          alignItems: "center",
          transition: "transform 0.2s ease",
          "&:hover": {
            bgcolor: theme === "dark" ? "#444" : "#f5f5f5",
            transform: { xs: "none", md: "scale(1.04)" },
          },
        }}
      >
        <AppRegistrationIcon sx={{ marginRight: 1 }} /> Register
      </Button>
    </>
  );

  return (
    <AppBar
      position="static"
      sx={{
        bgcolor: theme === "dark" ? "#333" : "white",
        zIndex: 1000,
        padding: 1,
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      <Toolbar>
        <Typography
          variant="h1"
          component={NavLink}
          to="/"
          sx={{
            flexGrow: 1,
            color: "#f57c00",
            font: "inherit",
            fontWeight: "bold",
            fontSize: "2rem",
            textDecoration: "none",
          }}
        >
          DocuThinker
        </Typography>

        <Box sx={{ display: { xs: "none", md: "flex" } }}>{renderNavLinks}</Box>

        <IconButton
          onClick={onThemeToggle}
          sx={{
            marginLeft: 2,
            color: theme === "dark" ? "white" : "black",
            "&:hover": {
              transform: "scale(1.1)",
              transition: "transform 0.2s ease",
            },
          }}
        >
          {theme === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>

        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ display: { xs: "flex", md: "none", marginLeft: "4px" } }}
          onClick={toggleDrawer(true)}
        >
          <MenuIcon sx={{ color: theme === "dark" ? "white" : "black" }} />
        </IconButton>
      </Toolbar>

      <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box
          sx={{
            width: 250,
            padding: 2,
            height: "100%",
            bgcolor: theme === "dark" ? "#333" : "white",
          }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <List sx={{ bgcolor: theme === "dark" ? "#333" : "white" }}>
            <ListItem
              button
              component={NavLink}
              to="/home"
              sx={{
                color: theme === "dark" ? "white" : "black",
                "&:hover": {
                  color: theme === "dark" ? "white" : "black",
                  bgcolor: theme === "dark" ? "#444" : "#f5f5f5",
                },
                borderRadius: "8px",
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: "40px",
                  color: theme === "dark" ? "white" : "black",
                }}
              >
                <HomeIcon />
              </ListItemIcon>
              <ListItemText disableTypography primary="Home" />
            </ListItem>

            <ListItem
              button
              component={NavLink}
              to="/how-to-use"
              sx={{
                color: theme === "dark" ? "white" : "black",
                "&:hover": {
                  color: theme === "dark" ? "white" : "black",
                  bgcolor: theme === "dark" ? "#444" : "#f5f5f5",
                },
                borderRadius: "8px",
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: "40px",
                  color: theme === "dark" ? "white" : "black",
                }}
              >
                <HelpOutlineIcon />
              </ListItemIcon>
              <ListItemText disableTypography primary="How to Use" />
            </ListItem>

            <ListItem
              button
              component={NavLink}
              to="/documents"
              sx={{
                color: theme === "dark" ? "white" : "black",
                "&:hover": {
                  color: theme === "dark" ? "white" : "black",
                  bgcolor: theme === "dark" ? "#444" : "#f5f5f5",
                },
                borderRadius: "8px",
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: "40px",
                  color: theme === "dark" ? "white" : "black",
                }}
              >
                <DescriptionIcon />
              </ListItemIcon>
              <ListItemText disableTypography primary="Documents" />
            </ListItem>

            <ListItem
              button
              component={NavLink}
              to="/profile"
              sx={{
                color: theme === "dark" ? "white" : "black",
                "&:hover": {
                  color: theme === "dark" ? "white" : "black",
                  bgcolor: theme === "dark" ? "#444" : "#f5f5f5",
                },
                borderRadius: "8px",
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: "40px",
                  color: theme === "dark" ? "white" : "black",
                }}
              >
                <PersonIcon />
              </ListItemIcon>
              <ListItemText disableTypography primary="Profile" />
            </ListItem>
            {isLoggedIn ? (
              <ListItem
                button
                onClick={handleLogout}
                sx={{
                  color: "red",
                  "&:hover": {
                    color: "red",
                    bgcolor: theme === "dark" ? "#444" : "#f5f5f5",
                  },
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                <ListItemIcon sx={{ minWidth: "40px", color: "red" }}>
                  <ExitToAppIcon />
                </ListItemIcon>
                <ListItemText disableTypography primary="Logout" />
              </ListItem>
            ) : (
              <ListItem
                button
                component={NavLink}
                to="/login"
                sx={{
                  color: theme === "dark" ? "white" : "black",
                  "&:hover": {
                    color: theme === "dark" ? "white" : "black",
                    bgcolor: theme === "dark" ? "#444" : "#f5f5f5",
                  },
                  borderRadius: "8px",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: "40px",
                    color: theme === "dark" ? "white" : "black",
                  }}
                >
                  <LoginIcon />
                </ListItemIcon>
                <ListItemText disableTypography primary="Login" />
              </ListItem>
            )}

            <ListItem
              button
              component={NavLink}
              to="/register"
              sx={{
                color: theme === "dark" ? "white" : "black",
                "&:hover": {
                  color: theme === "dark" ? "white" : "black",
                  bgcolor: theme === "dark" ? "#444" : "#f5f5f5",
                },
                borderRadius: "8px",
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: "40px",
                  color: theme === "dark" ? "white" : "black",
                }}
              >
                <AppRegistrationIcon />
              </ListItemIcon>
              <ListItemText disableTypography primary="Register" />
            </ListItem>

            <ListItem
              button
              onClick={toggleDrawer(false)}
              sx={{
                color: theme === "dark" ? "white" : "black",
                "&:hover": {
                  color: theme === "dark" ? "white" : "black",
                  bgcolor: theme === "dark" ? "#444" : "#f5f5f5",
                },
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: "40px",
                  color: theme === "dark" ? "white" : "black",
                }}
              >
                <CloseIcon />
              </ListItemIcon>
              <ListItemText disableTypography primary="Close" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
