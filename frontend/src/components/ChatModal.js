// src/components/ChatModal.js
import React, { useState } from 'react';
import { Modal, Box, Button, TextField, Typography } from '@mui/material';
import axios from 'axios';
import Spinner from './Spinner';

const ChatModal = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChat = async () => {
    const originalText = localStorage.getItem('originalText');
    if (!message || !originalText) return;

    try {
      setLoading(true);
      const res = await axios.post('https://docuthinker-ai-app.onrender.com/chat', {
        message,
        originalText
      });
      setLoading(false);
      setResponse(res.data.response);
    } catch (error) {
      setLoading(false);
      console.error('Chat failed:', error);
    }
  };

  return (
      <>
        <Button onClick={() => setOpen(true)} sx={{ bgcolor: '#f57c00', color: 'white' }}>Chat with AI</Button>
        <Modal open={open} onClose={() => setOpen(false)}>
          <Box sx={{ width: 400, margin: 'auto', marginTop: '20vh', padding: 4, bgcolor: 'white', textAlign: 'center' }}>
            <Typography variant="h6" sx={{ marginBottom: 2 }}>Chat with AI</Typography>
            <TextField
                label="Message"
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                sx={{ marginBottom: 2 }}
            />
            <Button variant="contained" sx={{ bgcolor: '#f57c00' }} onClick={handleChat}>
              {loading ? <Spinner /> : 'Send'}
            </Button>
            {response && <Typography variant="body1" sx={{ marginTop: 2 }}>{response}</Typography>}
          </Box>
        </Modal>
      </>
  );
};

export default ChatModal;
