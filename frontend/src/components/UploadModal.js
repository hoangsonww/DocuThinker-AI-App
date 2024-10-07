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
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
            }}
        >
          <Box
              sx={{
                width: { xs: '90%', sm: '70%', md: '400px' },
                maxHeight: '90vh',
                padding: { xs: 2, sm: 4 },
                bgcolor: theme === 'dark' ? '#1e1e1e' : 'white',
                textAlign: 'center',
                borderRadius: '12px',
                transition: 'background-color 0.3s ease',
                color: theme === 'dark' ? 'white' : 'black',
                overflowY: 'auto',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
          >
            <Typography
                variant="h6"
                sx={{
                  marginBottom: 2,
                  font: 'inherit',
                  fontSize: { xs: '16px', sm: '18px' },
                  color: theme === 'dark' ? 'white' : 'black',
                  transition: 'color 0.3s ease',
                }}
            >
              Upload a document (PDF or DOCX)
            </Typography>

            <Box
                {...getRootProps()}
                sx={{
                  border: `2px dashed ${theme === 'dark' ? 'white' : '#f57c00'}`,
                  padding: { xs: 2, sm: 4 },
                  cursor: 'pointer',
                  marginBottom: 2,
                  transition: 'border-color 0.3s ease',
                }}
            >
              <input {...getInputProps()} />
              <Typography
                  variant="body1"
                  sx={{
                    font: 'inherit',
                    color: theme === 'dark' ? 'white' : 'black',
                    transition: 'color 0.3s ease',
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
                      color: theme === 'dark' ? 'white' : 'black',
                      transition: 'color 0.3s ease',
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
                  transition: 'background-color 0.3s ease',
                  width: '100%',
                }}
                onClick={handleUpload}
                disabled={loading}
            >
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Upload'}
            </Button>

            <Typography sx={{ mt: 2, font: 'inherit', color: theme === 'dark' ? 'white' : 'black', fontSize: '14px' }}>
              <em>Note that our servers might be slow or experience downtime due to high traffic. It may take up to 2 minutes to process your document during these times. We appreciate your patience, and apologize for any inconvenience.</em>
            </Typography>
          </Box>
        </Box>
      </Modal>
  );
};

export default UploadModal;
