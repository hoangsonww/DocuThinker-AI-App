import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import UploadModal from '../components/UploadModal';
import ChatModal from '../components/ChatModal';
import axios from 'axios';

const Home = () => {
  const [summary, setSummary] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [keyIdeas, setKeyIdeas] = useState('');
  const [discussionPoints, setDiscussionPoints] = useState('');
  const [loadingKeyIdeas, setLoadingKeyIdeas] = useState(false);
  const [loadingDiscussionPoints, setLoadingDiscussionPoints] = useState(false);

  const formatAsMarkdown = (text) => {
    const paragraphs = text.split(/\n\s*\n/);
    return paragraphs.map((para) => para.trim()).join('\n\n');
  };

  const handleGenerateIdeas = async () => {
    setLoadingKeyIdeas(true);
    try {
      const response = await axios.post('https://docuthinker-ai-app.onrender.com/generate-key-ideas', {
        documentText: originalText,
      });
      const formattedKeyIdeas = formatAsMarkdown(response.data.keyIdeas);
      setKeyIdeas(formattedKeyIdeas);
    } catch (error) {
      console.error('Failed to generate key ideas:', error);
    } finally {
      setLoadingKeyIdeas(false);
    }
  };

  const handleGenerateDiscussionPoints = async () => {
    setLoadingDiscussionPoints(true);
    try {
      const response = await axios.post('https://docuthinker-ai-app.onrender.com/generate-discussion-points', {
        documentText: originalText,
      });
      const formattedDiscussionPoints = formatAsMarkdown(response.data.discussionPoints);
      setDiscussionPoints(formattedDiscussionPoints);
    } catch (error) {
      console.error('Failed to generate discussion points:', error);
    } finally {
      setLoadingDiscussionPoints(false);
    }
  };

  return (
      <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            padding: 4,
            gap: 2,
            alignItems: 'flex-start',
          }}
      >
        {!summary && <UploadModal setSummary={setSummary} setOriginalText={setOriginalText} />}
        {summary && (
            <>
              <Box
                  sx={{
                    width: { xs: '100%', md: '30%' },
                    marginBottom: { xs: 2, md: 0 },
                  }}
              >
                <Typography variant="h6" sx={{ font: 'inherit', fontWeight: 'bold', fontSize: '20px', mb: 2 }}>
                  Original Document
                </Typography>
                <Box sx={{ border: '1px solid #f57c00', padding: 2, borderRadius: '12px' }}>
                  <Typography sx={{ font: 'inherit' }}>{originalText}</Typography>
                </Box>
              </Box>
              <Box
                  sx={{
                    width: { xs: '100%', md: '70%' },
                  }}
              >
                <Typography variant="h6" sx={{ font: 'inherit', fontWeight: 'bold', fontSize: '20px', mb: 2 }}>
                  Summary
                </Typography>
                <Box sx={{ border: '1px solid #f57c00', padding: 2, marginBottom: 2, borderRadius: '12px' }}>
                  <Typography sx={{ font: 'inherit' }}>{summary}</Typography>
                </Box>

                {/* Button section aligned in a row or column based on screen size */}
                <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      gap: 2,
                      marginBottom: 2,
                    }}
                >
                  <Button
                      onClick={handleGenerateIdeas}
                      sx={{ bgcolor: '#f57c00', color: 'white', font: 'inherit', borderRadius: '12px' }}
                      disabled={loadingKeyIdeas}
                  >
                    {loadingKeyIdeas ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Generate Key Ideas'}
                  </Button>
                  <Button
                      onClick={handleGenerateDiscussionPoints}
                      sx={{ bgcolor: '#f57c00', color: 'white', font: 'inherit', borderRadius: '12px' }}
                      disabled={loadingDiscussionPoints}
                  >
                    {loadingDiscussionPoints ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Generate Discussion Points'}
                  </Button>
                  <ChatModal />
                </Box>

                {/* Display key ideas and discussion points as Markdown */}
                {keyIdeas && (
                    <Box sx={{ marginTop: 2 }}>
                      <Typography variant="h6" sx={{ font: 'inherit', fontWeight: 'bold', fontSize: '20px', mb: 2 }}>
                        Key Ideas
                      </Typography>
                      <Box sx={{ border: '1px solid #f57c00', padding: 2, borderRadius: '12px' }}>
                        <ReactMarkdown>{keyIdeas}</ReactMarkdown>
                      </Box>
                    </Box>
                )}
                {discussionPoints && (
                    <Box sx={{ marginTop: 2 }}>
                      <Typography variant="h6" sx={{ font: 'inherit', fontWeight: 'bold', fontSize: '20px', mb: 2 }}>
                        Discussion Points
                      </Typography>
                      <Box sx={{ border: '1px solid #f57c00', padding: 2, borderRadius: '12px' }}>
                        <ReactMarkdown>{discussionPoints}</ReactMarkdown>
                      </Box>
                    </Box>
                )}
              </Box>
            </>
        )}
      </Box>
  );
};

export default Home;
