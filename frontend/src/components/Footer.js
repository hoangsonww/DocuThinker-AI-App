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
  fontFamily: "Poppins, sans-serif",
  fontSize: "16px",
};

const defaultLinkStyle = {
  textDecoration: "none",
  color: "white",
  fontFamily: "Poppins, sans-serif",
  fontSize: "16px",
  transition: "all 0.3s ease", // Smooth transition effect
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
        {[
          { to: "/home", label: "Home" },
          { to: "/how-to-use", label: "How to Use" },
          { to: "/documents", label: "Documents" },
          { to: "/profile", label: "Profile" },
          { to: "/login", label: "Login" },
          { to: "/register", label: "Register" },
          { to: "/", label: "Landing", isLanding: true },
          { to: "/privacy-policy", label: "Privacy Policy" },
          { to: "/terms-of-service", label: "Terms of Service" },
        ].map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) =>
              (link.isLanding && isLandingActive) || isActive
                ? activeLinkStyle
                : defaultLinkStyle
            }
            className="nav-link"
          >
            <Typography
              sx={{
                "&:hover": {
                  transform: "scale(1.05)", // Increase size on hover
                },
                transition: "transform 0.2s ease",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              {link.label}
            </Typography>
          </NavLink>
        ))}
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
      <Typography
        variant="body2"
        sx={{
          color: "white",
          fontFamily: "Poppins, sans-serif",
          font: "inherit",
        }}
      >
        © {new Date().getFullYear()} DocuThinker. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
