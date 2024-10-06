import React from 'react';
import { Box, Typography, IconButton, Link } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language'; // For website link

const Footer = () => {
  return (
      <Box
          sx={{
            bgcolor: '#f57c00',
            padding: 2,
            textAlign: 'center',
            marginTop: 'auto',
            font: 'inherit',
          }}
      >
        {/* Navigation Links */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 2 }}>
          <Link href="/home" sx={{ color: 'white', textDecoration: 'none', fontSize: '1rem' }}>
            Home
          </Link>
          <Link href="/login" sx={{ color: 'white', textDecoration: 'none', fontSize: '1rem' }}>
            Login
          </Link>
          <Link href="/register" sx={{ color: 'white', textDecoration: 'none', fontSize: '1rem' }}>
            Register
          </Link>
          <Link href="/landing" sx={{ color: 'white', textDecoration: 'none', fontSize: '1rem' }}>
            Landing Page
          </Link>
        </Box>

        {/* Social Media Icons */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          <IconButton
              component="a"
              href="https://github.com/hoangsonww"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'white' }}
          >
            <GitHubIcon />
          </IconButton>
          <IconButton
              component="a"
              href="https://linkedin.com/in/hoangsonw"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'white' }}
          >
            <LinkedInIcon />
          </IconButton>
          <IconButton
              component="a"
              href="mailto:hoangson091104@gmail.com"
              sx={{ color: 'white' }}
          >
            <EmailIcon />
          </IconButton>
          <IconButton
              component="a"
              href="https://sonnguyenhoang.com"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'white' }}
          >
            <LanguageIcon />
          </IconButton>
        </Box>

        {/* Footer Text */}
        <Typography variant="body2" sx={{ color: 'white', font: 'inherit' }}>
          © {new Date().getFullYear()} DocuThinker. All rights reserved.
        </Typography>
      </Box>
  );
};

export default Footer;
