import React, { useState, useEffect } from 'react';
import { Box, Button, Modal, Typography, TextField, CircularProgress } from '@mui/material';
import axios from 'axios';

const GoogleDriveFileSelectorModal = ({ open, handleClose, googleAuth, onFileSelect, theme }) => {
  const [driveFiles, setDriveFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSearchPerformed, setIsSearchPerformed] = useState(false); // Track if the user has searched

  // Function to list Google Drive files with filtering for .pdf and .docx
  const listFiles = async (query = '') => {
    setLoading(true);
    try {
      const response = await window.gapi.client.drive.files.list({
        pageSize: 10, // You can adjust the number of files to display
        fields: 'nextPageToken, files(id, name, mimeType)',
        q: query ? `name contains '${query}'` : '', // Query the files if search term exists
      });

      // Filter files to only include .pdf and .docx files
      const filteredFiles = response.result.files.filter(
          (file) => file.mimeType === 'application/pdf' || file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );

      setDriveFiles(filteredFiles);
    } catch (error) {
      console.error('Error fetching Google Drive files:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch the top 5 recent files when the modal opens (no search yet)
  useEffect(() => {
    if (open) {
      setIsSearchPerformed(false); // Reset search state when modal opens
      listFiles(); // Fetch top 5 recent files (initial fetch)
    }
  }, [open]);

  // Handle file selection and download the selected file
  const handleFileSelection = async (fileId) => {
    const file = driveFiles.find((file) => file.id === fileId);
    const fileUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;

    try {
      const response = await axios.get(fileUrl, {
        headers: {
          Authorization: `Bearer ${googleAuth.currentUser.get().getAuthResponse().access_token}`,
        },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: file.mimeType });
      const selectedFile = new File([blob], file.name, { type: file.mimeType });

      onFileSelect(selectedFile); // Pass the selected file back to the UploadModal
      handleClose(); // Close the file selector modal
    } catch (error) {
      console.error('Failed to retrieve file from Google Drive:', error);
    }
  };

  // Handle search bar input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    setIsSearchPerformed(true); // Mark that a search has been performed
    listFiles(query); // Fetch the files based on the search query
  };

  return (
      <Modal open={open} onClose={handleClose}>
        <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 4,
              bgcolor: theme === 'dark' ? '#000' : 'white',
              color: theme === 'dark' ? 'white' : 'black',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              width: { xs: '90%', sm: '70%', md: '400px' },
              maxHeight: '90vh',
              margin: '0 auto',
              marginTop: '10%',
              textAlign: 'center',
              overflowY: 'auto',
            }}
        >
          <Typography
              variant="h6"
              sx={{
                marginBottom: 2,
                font: 'inherit',
                fontSize: { xs: '16px', sm: '18px' },
                color: theme === 'dark' ? 'white' : 'black',
              }}
          >
            Select a File from Google Drive
          </Typography>

          <TextField
              label="Search Google Drive"
              value={searchTerm}
              onChange={handleSearchChange}
              fullWidth
              sx={{ margin: '20px 0', fontFamily: 'Poppins, sans-serif' }}
              inputProps={{
                style: { fontFamily: 'Poppins, sans-serif', color: theme === 'dark' ? 'white' : 'black' },
              }}
              InputLabelProps={{
                style: { fontFamily: 'Poppins, sans-serif', color: theme === 'dark' ? 'white' : '#000' },
              }}
          />

          {loading ? (
              <CircularProgress sx={{ color: theme === 'dark' ? 'white' : '#f57c00' }} />
          ) : (
              <Box sx={{ maxHeight: '300px', overflowY: 'auto', width: '100%' }}>
                {driveFiles.length > 0 ? (
                    driveFiles.map((file) => (
                        <Box key={file.id} sx={{ mb: 2 }}>
                          <Button
                              variant="outlined"
                              fullWidth
                              onClick={() => handleFileSelection(file.id)}
                              sx={{
                                justifyContent: 'left',
                                font: 'inherit',
                                color: theme === 'dark' ? 'white' : 'black',
                                borderColor: theme === 'dark' ? 'white' : '#f57c00',
                                '&:hover': {
                                  backgroundColor: theme === 'dark' ? '#333' : '#f57c00',
                                  color: 'white',
                                },
                              }}
                          >
                            {file.name}
                          </Button>
                        </Box>
                    ))
                ) : isSearchPerformed ? (
                    // Only show "No files found" after a search is performed
                    <Typography>No files found</Typography>
                ) : (
                    // Show nothing initially (before search is performed)
                    null
                )}
              </Box>
          )}
        </Box>
      </Modal>
  );
};

export default GoogleDriveFileSelectorModal;
