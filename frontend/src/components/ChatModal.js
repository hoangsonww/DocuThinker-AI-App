import React, { useState } from 'react';
import { Modal, Box, Button, TextField, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import Spinner from './Spinner';
import ReactMarkdown from 'react-markdown';

const ChatModal = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const handleChat = async () => {
    const originalText = localStorage.getItem('originalText');
    if (!message || !originalText) return;

    try {
      setLoading(true);
      const res = await axios.post('https://docuthinker-ai-app.onrender.com/chat', {
        message,
        originalText,
      });
      setLoading(false);
      const aiResponse = res.data.response;
      setChatHistory([
        ...chatHistory,
        { sender: 'User', text: message },
        { sender: 'AI', text: aiResponse },
      ]);
      setMessage('');
    } catch (error) {
      setLoading(false);
      console.error('Chat failed:', error);
    }
  };

  return (
      <>
        <Button onClick={() => setOpen(true)} sx={{ bgcolor: '#f57c00', color: 'white', font: 'inherit', borderRadius: '12px' }}>
          Chat with AI
        </Button>
        <Modal open={open} onClose={() => setOpen(false)}>
          <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '40%',
                height: '50%',
                bgcolor: 'white',
                padding: 4,
                borderRadius: '12px',
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                resize: 'both',
                aspectRatio: '1 / 1.5',
                minWidth: '300px',
                maxWidth: '80%',
                minHeight: '400px',
                maxHeight: '80vh',
              }}
          >
            {/* Close Button in the top-right corner */}
            <IconButton
                onClick={() => setOpen(false)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  color: 'black',
                }}
            >
              <CloseIcon />
            </IconButton>

            {/* Chat Modal Header */}
            <Typography
                variant="h6"
                sx={{
                  marginBottom: 2,
                  font: 'inherit',
                  fontSize: '20px',
                  textAlign: 'center',
                }}
            >
              Chat With AI About Your Document
            </Typography>

            {/* Chat history box */}
            <Box
                sx={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  border: '1px solid #f57c00',
                  padding: 2,
                  marginBottom: 2,
                  borderRadius: '12px',
                  maxHeight: '60%',
                }}
            >
              {chatHistory.map((chat, index) => (
                  <Box
                      key={index}
                      sx={{
                        textAlign: chat.sender === 'User' ? 'right' : 'left',
                        marginBottom: 1,
                        borderRadius: '12px',
                        font: 'inherit',
                      }}
                  >
                    {chat.sender === 'AI' ? (
                        <Typography
                            variant="body2"
                            sx={{
                              bgcolor: '#e0e0e0',
                              color: 'black',
                              padding: 1,
                              borderRadius: '12px',
                              display: 'inline-block',
                              font: 'inherit',
                            }}
                        >
                          <ReactMarkdown>{chat.text}</ReactMarkdown>
                        </Typography>
                    ) : (
                        <Typography
                            variant="body2"
                            sx={{
                              bgcolor: '#f57c00',
                              color: 'white',
                              padding: 1,
                              borderRadius: '12px',
                              display: 'inline-block',
                              font: 'inherit',
                            }}
                        >
                          {chat.text}
                        </Typography>
                    )}
                  </Box>
              ))}
            </Box>

            {/* Message input */}
            <TextField
                label="Chat with AI"
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                sx={{ marginBottom: 2, borderRadius: '12px', font: 'inherit' }}
                inputProps={{
                  style: { fontFamily: 'Poppins, sans-serif' },
                }}
                InputLabelProps={{
                  style: { fontFamily: 'Poppins, sans-serif' },
                }}
            />

            {/* Send Button */}
            <Button variant="contained" sx={{ bgcolor: '#f57c00', font: 'inherit' }} onClick={handleChat}>
              {loading ? <Spinner /> : 'Send'}
            </Button>
          </Box>
        </Modal>
      </>
  );
};

export default ChatModal;
