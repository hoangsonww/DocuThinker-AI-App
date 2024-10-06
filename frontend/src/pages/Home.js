// src/pages/Home.js
import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import UploadModal from '../components/UploadModal';
import ChatModal from '../components/ChatModal';
import axios from 'axios';

const Home = () => {
  const [summary, setSummary] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [keyIdeas, setKeyIdeas] = useState('');
  const [discussionPoints, setDiscussionPoints] = useState('');

  const handleGenerateIdeas = async () => {
    try {
      const response = await axios.post('https://docuthinker-ai-app.onrender.com/generate-key-ideas', {
        documentText: originalText,
      });
      setKeyIdeas(response.data.keyIdeas);
    } catch (error) {
      console.error('Failed to generate key ideas:', error);
    }
  };

  const handleGenerateDiscussionPoints = async () => {
    try {
      const response = await axios.post('https://docuthinker-ai-app.onrender.com/generate-discussion-points', {
        documentText: originalText,
      });
      setDiscussionPoints(response.data.discussionPoints);
    } catch (error) {
      console.error('Failed to generate discussion points:', error);
    }
  };

  return (
      <Box sx={{ display: 'flex', padding: 4 }}>
        {!summary && <UploadModal setSummary={setSummary} setOriginalText={setOriginalText} />}
        {summary && (
            <>
              <Box sx={{ width: '30%', marginRight: 2 }}>
                <Typography variant="h6">Original Document</Typography>
                <Box sx={{ border: '1px solid #f57c00', padding: 2 }}>
                  <Typography>{originalText}</Typography>
                </Box>
              </Box>
              <Box sx={{ width: '70%' }}>
                <Typography variant="h6">Summary</Typography>
                <Box sx={{ border: '1px solid #f57c00', padding: 2, marginBottom: 2 }}>
                  <Typography>{summary}</Typography>
                </Box>
                <Button onClick={handleGenerateIdeas} sx={{ bgcolor: '#f57c00', color: 'white', marginRight: 2 }}>Generate Key Ideas</Button>
                <Button onClick={handleGenerateDiscussionPoints} sx={{ bgcolor: '#f57c00', color: 'white' }}>Generate Discussion Points</Button>
                {keyIdeas && <Typography sx={{ marginTop: 2 }}>Key Ideas: {keyIdeas}</Typography>}
                {discussionPoints && <Typography sx={{ marginTop: 2 }}>Discussion Points: {discussionPoints}</Typography>}
              </Box>
            </>
        )}
        {summary && <ChatModal />}
      </Box>
  );
};

export default Home;
