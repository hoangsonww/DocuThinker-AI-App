// src/components/UploadModal.js
import React, { useState } from 'react';
import { Box, Button, Modal, Typography } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import Spinner from './Spinner';

const UploadModal = ({ setSummary, setOriginalText }) => {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'application/pdf': [], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [] }
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
      setOpen(false);
    } catch (error) {
      setLoading(false);
      console.error('Upload failed:', error);
    }
  };

  return (
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 400, margin: 'auto', marginTop: '20vh', padding: 4, bgcolor: 'white', textAlign: 'center' }}>
          <Typography variant="h6" sx={{ marginBottom: 2 }}>Upload a document (PDF or DOCX)</Typography>
          <Box {...getRootProps()} sx={{ border: '2px dashed #f57c00', padding: 4, cursor: 'pointer', marginBottom: 2 }}>
            <input {...getInputProps()} />
            <Typography variant="body1">Drag & drop a file here, or click to select</Typography>
          </Box>
          {file && <Typography variant="body2">{file.name}</Typography>}
          <Button variant="contained" sx={{ bgcolor: '#f57c00' }} onClick={handleUpload}>
            {loading ? <Spinner /> : 'Upload'}
          </Button>
        </Box>
      </Modal>
  );
};

export default UploadModal;
