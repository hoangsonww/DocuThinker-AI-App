import React from 'react';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';

const HowToUse = () => {
  return (
      <Box
          sx={{
            padding: 4,
            maxWidth: '800px',
            margin: '2rem auto',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
      >
        {/* Page Title */}
        <Typography
            variant="h4"
            gutterBottom
            sx={{ font: 'inherit', fontWeight: 'bold', color: '#f57c00', textAlign: 'center', fontSize: '2rem' }}
        >
          How to Use DocuThinker
        </Typography>

        {/* Introduction */}
        <Typography
            variant="body1"
            sx={{ font: 'inherit', marginBottom: 3, fontSize: '1.1rem', color: '#333', lineHeight: '1.6' }}
        >
          Welcome to <strong>DocuThinker</strong>, your AI-powered document summarization tool. Follow the steps below to
          upload documents and make the most out of our key features like summarization, generating key ideas, and
          discussion points from your uploaded documents.
        </Typography>

        {/* Step-by-step Instructions */}
        <Typography variant="h5" sx={{ font: 'inherit', fontWeight: 'bold', fontSize: '22px', color: '#f57c00', marginBottom: 2 }}>
          Steps to Get Started
        </Typography>

        <List sx={{ listStyleType: 'none', paddingLeft: 0, fontFamily: 'Poppins, sans-serif' }}>
          <ListItem sx={{ fontFamily: 'Poppins, sans-serif' }}>
            <ListItemText
                disableTypography
                primary="1. Upload a Document"
                secondary="Click the upload box on the home page to drag and drop your document or select one from your device. We support both PDF and DOCX formats."
                sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '1rem' }}
            />
          </ListItem>

          <ListItem sx={{ fontFamily: 'Poppins, sans-serif' }}>
            <ListItemText
                disableTypography
                primary="2. View the Document Summary"
                secondary="Once uploaded, the app will automatically summarize your document. You'll see the full original document text on the left and a concise summary on the right."
                sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '1rem' }}
            />
          </ListItem>

          <ListItem sx={{ fontFamily: 'Poppins, sans-serif' }}>
            <ListItemText
                disableTypography
                primary="3. Generate Key Ideas"
                secondary="After reviewing the summary, click the 'Generate Key Ideas' button to let the AI extract the most important ideas from the document."
                sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '1rem' }}
            />
          </ListItem>

          <ListItem sx={{ fontFamily: 'Poppins, sans-serif' }}>
            <ListItemText
                disableTypography
                primary="4. Generate Discussion Points"
                secondary="You can also generate discussion points that can be used for group discussions, debates, or further analysis of the document."
                sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '1rem' }}
            />
          </ListItem>

          <ListItem sx={{ fontFamily: 'Poppins, sans-serif' }}>
            <ListItemText
                disableTypography
                primary="5. Chat with the AI"
                secondary="Use the 'Chat with AI' feature to ask specific questions or get more information based on the document. The AI will use the document context to provide tailored answers."
                sx={{ fontFamily: 'Poppins, sans-serif', fontSize: '1rem' }}
            />
          </ListItem>
        </List>

        {/* Extra Info */}
        <Typography
            variant="h5"
            sx={{ font: 'inherit', fontWeight: 'bold', color: '#f57c00', marginTop: 4, marginBottom: 2, fontSize: '22px' }}
        >
          Supported Document Formats
        </Typography>
        <Typography
            variant="body1"
            sx={{ marginBottom: 3, font: 'inherit', fontSize: '1.1rem', color: '#333', lineHeight: '1.6' }}
        >
          DocuThinker currently supports:
          <ul style={{ paddingLeft: '20px', marginTop: '8px', font: 'inherit' }}>
            <li>PDF files</li>
            <li>DOCX (Word) files</li>
          </ul>
          Ensure your document is in one of these formats before uploading to guarantee smooth processing.
        </Typography>

        {/* Final Note */}
        <Typography
            variant="body1"
            sx={{ font: 'inherit', fontSize: '1.1rem', color: '#333', lineHeight: '1.6' }}
        >
          DocuThinker helps you save time by summarizing long documents, extracting key ideas, and preparing discussion
          points for further exploration. Make sure to utilize the AI chat feature to dive deeper into any aspect of your
          document!
        </Typography>
      </Box>
  );
};

export default HowToUse;
