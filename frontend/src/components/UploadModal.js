import React, { useEffect, useState } from 'react';
import { Box, Button, Modal, Typography, CircularProgress, TextField } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { gapi } from 'gapi-script';
import GoogleDriveFileSelectorModal from './GoogleDriveFileSelectorModal';

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

const UploadModal = ({ setSummary, setOriginalText, setDocumentFile, theme }) => {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [title, setTitle] = useState('');
  const [googleAuth, setGoogleAuth] = useState(null);
  const [isGoogleAuthReady, setIsGoogleAuthReady] = useState(false);
  const [driveModalOpen, setDriveModalOpen] = useState(false);

  const initClient = () => {
    return new Promise((resolve, reject) => {
      gapi.load('client:auth2', () => {
        gapi.client
            .init({
              apiKey: process.env.REACT_APP_GOOGLE_DRIVE_API_KEY,
              clientId: process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID,
              discoveryDocs: DISCOVERY_DOCS,
              scope: SCOPES,
            })
            .then(() => {
              const authInstance = gapi.auth2.getAuthInstance();
              setGoogleAuth(authInstance);
              setIsGoogleAuthReady(true);
              resolve();
            })
            .catch((error) => {
              console.error('Error initializing GAPI:', error);
              reject(error);
            });
      });
    });
  };

  useEffect(() => {
    initClient().catch((error) => {
      console.error('Google API client initialization failed:', error);
    });
  }, []);

  const handleGoogleLogin = async () => {
    if (isGoogleAuthReady && googleAuth) {
      try {
        await googleAuth.signIn();
        setDriveModalOpen(true);
      } catch (error) {
        console.error('Google sign-in failed:', error);
      }
    } else {
      console.error('GoogleAuth instance is not initialized yet.');
    }
  };

  const handleFileFromGoogleDrive = (selectedFile) => {
    setFile(selectedFile);
    setTitle(selectedFile.name);
    setDocumentFile(selectedFile);
  };

  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
    setDocumentFile(acceptedFiles[0]);
    setTitle(acceptedFiles[0].name);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': [],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
    },
  });

  const handleUpload = async () => {
    if (!file || !title) return;

    const formData = new FormData();
    formData.append('File', file);
    formData.append('title', title);

    const userId = localStorage.getItem('userId');
    if (userId) {
      formData.append('userId', userId);
    }

    try {
      setLoading(true);
      const response = await axios.post('https://docuthinker-ai-app.onrender.com/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
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
      <>
        <Modal
            open={open}
            onClose={() => {
              if (isUploaded) setOpen(false);
            }}
            disablePortal
            disableBackdropClick={!isUploaded}
            disableEscapeKeyDown={!isUploaded}
            BackdropProps={{
              style: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
            }}
            sx={{
              zIndex: 1200,
            }}
        >
          <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
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
                border: 'none', // Ensure there's no border around the modal
                outline: 'none', // Remove any default outline that may appear
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

            {file && (
                <TextField
                    label="Document Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    fullWidth
                    sx={{ marginBottom: 2, font: 'inherit' }}
                    inputProps={{
                      style: { fontFamily: 'Poppins, sans-serif', color: theme === 'dark' ? 'white' : 'black' },
                    }}
                    InputLabelProps={{
                      style: { fontFamily: 'Poppins, sans-serif', color: theme === 'dark' ? 'white' : '#000' },
                    }}
                />
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

            <Typography sx={{ mt: 2, font: 'inherit' }}>OR</Typography>

            <Button
                variant="contained"
                sx={{
                  bgcolor: '#4285F4 !important',
                  color: 'white !important',
                  font: 'inherit',
                  mt: 2,
                  width: '100%',
                }}
                onClick={handleGoogleLogin}
                disabled={!isGoogleAuthReady}
            >
              {isGoogleAuthReady ? 'Select from Google Drive' : 'Loading Google Auth...'}
            </Button>
          </Box>
        </Modal>

        <GoogleDriveFileSelectorModal
            open={driveModalOpen}
            handleClose={() => setDriveModalOpen(false)}
            googleAuth={googleAuth}
            onFileSelect={handleFileFromGoogleDrive}
            theme={theme}
        />
      </>
  );
};

export default UploadModal;
