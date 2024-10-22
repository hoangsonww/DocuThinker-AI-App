import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import EmailIcon from "@mui/icons-material/Email";
import LanguageIcon from "@mui/icons-material/Language";

const activeLinkStyle = {
  borderBottom: "3px solid white",
  textDecoration: "none",
  color: "white",
};

const defaultLinkStyle = {
  textDecoration: "none",
  color: "white",
};

const Footer = () => {
  const location = useLocation();

  const isLandingActive =
    location.pathname === "/" || location.pathname === "/landing";

  return (
    <Box
      sx={{
        bgcolor: "#f57c00",
        padding: 2,
        textAlign: "center",
        marginTop: "auto",
        font: "inherit",
      }}
    >
      {/* Navigation Links */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 3,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <NavLink
          to="/home"
          style={({ isActive }) =>
            isActive ? activeLinkStyle : defaultLinkStyle
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/how-to-use"
          style={({ isActive }) =>
            isActive ? activeLinkStyle : defaultLinkStyle
          }
        >
          How to Use
        </NavLink>
        <NavLink
          to="/documents"
          style={({ isActive }) =>
            isActive ? activeLinkStyle : defaultLinkStyle
          }
        >
          Documents
        </NavLink>
        <NavLink
          to="/profile"
          style={({ isActive }) =>
            isActive ? activeLinkStyle : defaultLinkStyle
          }
        >
          Profile
        </NavLink>
        <NavLink
          to="/login"
          style={({ isActive }) =>
            isActive ? activeLinkStyle : defaultLinkStyle
          }
        >
          Login
        </NavLink>
        <NavLink
          to="/register"
          style={({ isActive }) =>
            isActive ? activeLinkStyle : defaultLinkStyle
          }
        >
          Register
        </NavLink>
        <NavLink
          to="/"
          style={isLandingActive ? activeLinkStyle : defaultLinkStyle} // Handle both / and /landing
        >
          Landing
        </NavLink>
        <NavLink
          to="/privacy-policy"
          style={({ isActive }) =>
            isActive ? activeLinkStyle : defaultLinkStyle
          }
        >
          Privacy Policy
        </NavLink>
        <NavLink
          to="/terms-of-service"
          style={({ isActive }) =>
            isActive ? activeLinkStyle : defaultLinkStyle
          }
        >
          Terms of Service
        </NavLink>
      </Box>

      {/* Social Media Icons */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 2 }}>
        <IconButton
          component="a"
          href="https://github.com/hoangsonww/DocuThinker-AI-App"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: "white" }}
        >
          <GitHubIcon />
        </IconButton>
        <IconButton
          component="a"
          href="https://linkedin.com/in/hoangsonw"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: "white" }}
        >
          <LinkedInIcon />
        </IconButton>
        <IconButton
          component="a"
          href="mailto:hoangson091104@gmail.com"
          sx={{ color: "white" }}
        >
          <EmailIcon />
        </IconButton>
        <IconButton
          component="a"
          href="https://sonnguyenhoang.com"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ color: "white" }}
        >
          <LanguageIcon />
        </IconButton>
      </Box>

      {/* Footer Text */}
      <Typography variant="body2" sx={{ color: "white", font: "inherit" }}>
        © {new Date().getFullYear()} DocuThinker. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
