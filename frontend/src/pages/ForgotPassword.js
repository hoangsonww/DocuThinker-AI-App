import React, { useState } from 'react';
import { Box, Button, TextField, Typography, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';

const ForgotPassword = ({ theme }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleForgotPassword = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('https://docuthinker-ai-app.onrender.com/forgot-password', { email });
      setLoading(false);
      setSuccess('A password reset link has been sent to your email.');
    } catch (error) {
      setLoading(false);
      setError('Failed to send reset link. Please try again.');
    }
  };

  return (
      <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            paddingTop: '3rem',
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#f5f5f5',
            transition: 'background-color 0.3s ease',
          }}
      >
        <Box
            sx={{
              maxWidth: '400px',
              width: '100%',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              backgroundColor: theme === 'dark' ? '#333' : 'white',
              color: theme === 'dark' ? 'white' : 'black',
              transition: 'background-color 0.3s ease, color 0.3s ease',
            }}
        >
          <Typography
              variant="h4"
              sx={{
                marginBottom: '1.5rem',
                textAlign: 'center',
                color: '#f57c00',
                font: 'inherit',
                fontWeight: 600,
                fontSize: '30px',
              }}
          >
            Forgot Password
          </Typography>

          {/* Error and Success Alerts */}
          {error && (
              <Alert severity="error" sx={{ marginBottom: '1.5rem' }}>
                {error}
              </Alert>
          )}
          {success && (
              <Alert severity="success" sx={{ marginBottom: '1.5rem' }}>
                {success}
              </Alert>
          )}

          {/* Email Input */}
          <TextField
              label="Enter your email"
              type="email"
              fullWidth
              required
              sx={{
                marginBottom: '1.5rem',
                backgroundColor: theme === 'dark' ? '#555' : '#fff',
                borderRadius: '8px',
                font: 'inherit',
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputProps={{
                style: { fontFamily: 'Poppins, sans-serif' },
              }}
              InputLabelProps={{
                style: { fontFamily: 'Poppins, sans-serif' },
              }}
          />

          {/* Send Reset Link Button */}
          <Button
              variant="contained"
              fullWidth
              onClick={handleForgotPassword}
              sx={{
                backgroundColor: '#f57c00',
                color: 'white',
                font: 'inherit',
                padding: '0.75rem',
                '&:hover': {
                  backgroundColor: '#e68900',
                },
              }}
              disabled={loading}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Send Reset Link'}
          </Button>
        </Box>
      </Box>
  );
};

export default ForgotPassword;
