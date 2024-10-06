import React, { useState } from 'react';
import { Box, Button, Modal, Typography, CircularProgress } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const UploadModal = ({ setSummary, setOriginalText, setDocumentFile, theme }) => {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);

  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
    setDocumentFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
    },
  });

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('File', file);

    try {
      setLoading(true);
      const response = await axios.post('https://docuthinker-ai-app.onrender.com/upload', formData);
      setLoading(false);

      const { summary, originalText } = response.data;
      setSummary(summary);
      setOriginalText(originalText);
      localStorage.setItem('originalText', originalText);
      setIsUploaded(true);
      setOpen(false);
    } catch (error) {
      setLoading(false);
      console.error('Upload failed:', error);
    }
  };

  return (
      <Modal
          open={open}
          onClose={() => {
            if (isUploaded) setOpen(false);
          }}
          disableBackdropClick={!isUploaded}
          disableEscapeKeyDown={!isUploaded}
      >
        <Box
            sx={{
              width: 400,
              margin: 'auto',
              marginTop: '20vh',
              padding: 4,
              bgcolor: theme === 'dark' ? '#1e1e1e' : 'white', // Set background color based on theme
              textAlign: 'center',
              borderRadius: '12px',
              transition: 'background-color 0.3s ease', // Smooth transition for background color
              color: theme === 'dark' ? 'white' : 'black', // Text color based on theme
            }}
        >
          <Typography
              variant="h6"
              sx={{
                marginBottom: 2,
                font: 'inherit',
                fontSize: '18px',
                color: theme === 'dark' ? 'white' : 'black', // Text color based on theme
                transition: 'color 0.3s ease', // Smooth transition for text color
              }}
          >
            Upload a document (PDF or DOCX)
          </Typography>

          <Box
              {...getRootProps()}
              sx={{
                border: `2px dashed ${theme === 'dark' ? 'white' : '#f57c00'}`, // Border color based on theme
                padding: 4,
                cursor: 'pointer',
                marginBottom: 2,
                transition: 'border-color 0.3s ease', // Smooth transition for border color
              }}
          >
            <input {...getInputProps()} />
            <Typography
                variant="body1"
                sx={{
                  font: 'inherit',
                  color: theme === 'dark' ? 'white' : 'black', // Text color based on theme
                  transition: 'color 0.3s ease', // Smooth transition for text color
                }}
            >
              Drag & drop a file here, or click to select
            </Typography>
          </Box>

          {file && (
              <Typography
                  variant="body2"
                  sx={{
                    mb: 2,
                    font: 'inherit',
                    color: theme === 'dark' ? 'white' : 'black', // Text color based on theme
                    transition: 'color 0.3s ease', // Smooth transition for text color
                  }}
              >
                {file.name}
              </Typography>
          )}

          <Button
              variant="contained"
              sx={{
                bgcolor: '#f57c00',
                color: 'white',
                font: 'inherit',
                transition: 'background-color 0.3s ease', // Smooth transition for button background
              }}
              onClick={handleUpload}
              disabled={loading}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Upload'}
          </Button>
        </Box>
      </Modal>
  );
};

export default UploadModal;
