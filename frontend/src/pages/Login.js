// src/pages/Login.js
import React, { useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import axios from 'axios';
import Spinner from "../components/Spinner";

const Login = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await axios.post('https://docuthinker-ai-app.onrender.com/login', { email });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Login failed:', error);
    }
  };

  return (
      <Box sx={{ padding: 4 }}>
        <Typography variant="h4" gutterBottom>Login</Typography>
        <TextField
            label="Email"
            fullWidth
            sx={{ marginBottom: 2 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
        />
        <Button variant="contained" sx={{ bgcolor: '#f57c00' }} onClick={handleLogin}>
          {loading ? <Spinner /> : 'Login'}
        </Button>
      </Box>
  );
};

export default Login;
