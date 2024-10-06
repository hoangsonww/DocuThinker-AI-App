import React, { useState } from 'react';
import { Box, Button, TextField, Typography, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Simple password match validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('https://docuthinker-ai-app.onrender.com/register', {
        email,
        password,
      });
      setLoading(false);
      setSuccess("User registered successfully! You can now login.");
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setLoading(false);
      setError('Registration failed. Please try again.');
    }
  };

  return (
      <Box
          sx={{
            maxWidth: '400px',
            margin: '2rem auto',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            bgcolor: 'white',
            textAlign: 'center',
          }}
      >
        <Typography variant="h4" sx={{ mb: 3, color: '#f57c00', font: 'inherit', fontWeight: '600', fontSize: '32px' }}>
          Register
        </Typography>

        {/* Error Message */}
        {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
        )}

        {/* Success Message */}
        {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister}>
          <TextField
              label="Email"
              variant="outlined"
              fullWidth
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2, fontFamily: 'Poppins, sans-serif' }}
              inputProps={{
                style: { fontFamily: 'Poppins, sans-serif' },
              }}
              InputLabelProps={{
                style: { fontFamily: 'Poppins, sans-serif' },
              }}
          />
          <TextField
              label="Password"
              variant="outlined"
              fullWidth
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2, fontFamily: 'Poppins, sans-serif' }}
              inputProps={{
                style: { fontFamily: 'Poppins, sans-serif' },
              }}
              InputLabelProps={{
                style: { fontFamily: 'Poppins, sans-serif' },
              }}
          />
          <TextField
              label="Confirm Password"
              variant="outlined"
              fullWidth
              required
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{ mb: 2, fontFamily: 'Poppins, sans-serif' }}
              inputProps={{
                style: { fontFamily: 'Poppins, sans-serif' },
              }}
              InputLabelProps={{
                style: { fontFamily: 'Poppins, sans-serif' },
              }}
          />

          <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                bgcolor: '#f57c00',
                color: 'white',
                fontFamily: 'Poppins, sans-serif',
                padding: '0.75rem',
                fontSize: '16px',
                mt: 2,
                '&:hover': {
                  bgcolor: '#e65100',
                },
              }}
              disabled={loading}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Register'}
          </Button>
        </form>
      </Box>
  );
};

export default Register;
