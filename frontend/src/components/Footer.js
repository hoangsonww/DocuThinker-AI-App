import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
  return (
      <Box sx={{ bgcolor: '#f57c00', padding: 2, textAlign: 'center', marginTop: 'auto', font: 'inherit' }}>
        <Typography variant="body1" sx={{ color: 'white', font: 'inherit' }}>
          © {new Date().getFullYear()} DocuThinker. All rights reserved.
        </Typography>
      </Box>
  );
};

export default Footer;
