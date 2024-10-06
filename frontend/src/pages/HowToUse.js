// src/pages/HowToUse.js
import React from 'react';
import { Box, Typography } from '@mui/material';

const HowToUse = () => {
  return (
      <Box sx={{ padding: 4 }}>
        <Typography variant="h4" gutterBottom>How to Use DocuThinker</Typography>
        <Typography variant="body1">
          Upload a document to summarize it and generate key ideas and discussion points.
        </Typography>
      </Box>
  );
};

export default HowToUse;
