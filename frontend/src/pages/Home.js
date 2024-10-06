import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import UploadModal from '../components/UploadModal';
import ChatModal from '../components/ChatModal';
import axios from 'axios';

const Home = ({ theme }) => {
  const [summary, setSummary] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [keyIdeas, setKeyIdeas] = useState('');
  const [discussionPoints, setDiscussionPoints] = useState('');
  const [loadingKeyIdeas, setLoadingKeyIdeas] = useState(false);
  const [loadingDiscussionPoints, setLoadingDiscussionPoints] = useState(false);
  const [documentFile, setDocumentFile] = useState(null); // Add this line to manage the document file state

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

  const handleUploadNewDocument = () => {
    // Reload the page when the button is clicked
    window.location.reload();
  };

  return (
      <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            padding: 4,
            gap: 2,
            alignItems: 'flex-start',
            transition: 'background-color 0.3s ease, color 0.3s ease',
          }}
      >
        {!summary && <UploadModal setSummary={setSummary} setOriginalText={setOriginalText} theme={theme} setDocumentFile={setDocumentFile} />} {/* Pass the setDocumentFile prop */}
        {summary && (
            <>
              <Box
                  sx={{
                    width: { xs: '100%', md: '30%' },
                    marginBottom: { xs: 2, md: 0 },
                    transition: 'background-color 0.3s ease, color 0.3s ease',
                  }}
              >
                <Typography
                    variant="h6"
                    sx={{
                      font: 'inherit',
                      fontWeight: 'bold',
                      fontSize: '20px',
                      mb: 2,
                      color: theme === 'dark' ? 'white' : 'black',
                    }}
                >
                  Original Document
                </Typography>
                <Box sx={{ border: '1px solid #f57c00', padding: 2, borderRadius: '12px' }}>
                  <Typography sx={{ font: 'inherit', color: theme === 'dark' ? 'white' : 'black' }}>
                    {originalText}
                  </Typography>
                </Box>
              </Box>
              <Box
                  sx={{
                    width: { xs: '100%', md: '70%' },
                  }}
              >
                <Typography
                    variant="h6"
                    sx={{
                      font: 'inherit',
                      fontWeight: 'bold',
                      fontSize: '20px',
                      mb: 2,
                      color: theme === 'dark' ? 'white' : 'black',
                    }}
                >
                  Summary
                </Typography>
                <Box sx={{ border: '1px solid #f57c00', padding: 2, marginBottom: 2, borderRadius: '12px' }}>
                  <ReactMarkdown
                      components={{
                        h1: ({ node, ...props }) => (
                            <Typography
                                variant="h4"
                                sx={{
                                  font: 'inherit',
                                  color: theme === 'dark' ? 'white' : 'black',
                                  fontWeight: 'bold',
                                  mb: 2,
                                }}
                                {...props}
                            />
                        ),
                        h2: ({ node, ...props }) => (
                            <Typography
                                variant="h5"
                                sx={{
                                  font: 'inherit',
                                  color: theme === 'dark' ? 'white' : 'black',
                                  fontWeight: 'bold',
                                  mb: 2,
                                }}
                                {...props}
                            />
                        ),
                        h3: ({ node, ...props }) => (
                            <Typography
                                variant="h6"
                                sx={{
                                  font: 'inherit',
                                  color: theme === 'dark' ? 'white' : 'black',
                                  fontWeight: 'bold',
                                }}
                                {...props}
                            />
                        ),
                        p: ({ node, ...props }) => (
                            <Typography
                                sx={{
                                  font: 'inherit',
                                  color: theme === 'dark' ? 'white' : 'black',
                                }}
                                {...props}
                            />
                        ),
                        ul: ({ node, ...props }) => (
                            <ul
                                style={{
                                  color: theme === 'dark' ? 'white' : 'black',
                                  font: 'inherit',
                                }}
                                {...props}
                            />
                        ),
                        ol: ({ node, ...props }) => (
                            <ol
                                style={{
                                  color: theme === 'dark' ? 'white' : 'black',
                                  font: 'inherit',
                                }}
                                {...props}
                            />
                        ),
                      }}
                  >
                    {summary}
                  </ReactMarkdown>
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
                  <ChatModal theme={theme} />
                  {/* New Upload New Document Button */}
                  <Button
                      onClick={handleUploadNewDocument}
                      sx={{ bgcolor: '#f57c00', color: 'white', font: 'inherit', borderRadius: '12px' }}
                  >
                    Upload New Document
                  </Button>
                </Box>

                {/* Display key ideas and discussion points as Markdown */}
                {keyIdeas && (
                    <Box sx={{ marginTop: 2 }}>
                      <Typography
                          variant="h6"
                          sx={{
                            font: 'inherit',
                            fontWeight: 'bold',
                            fontSize: '20px',
                            mb: 2,
                            color: theme === 'dark' ? 'white' : 'black',
                          }}
                      >
                        Key Ideas
                      </Typography>
                      <Box sx={{ border: '1px solid #f57c00', padding: 2, borderRadius: '12px' }}>
                        {/* Custom ReactMarkdown renderer */}
                        <ReactMarkdown
                            components={{
                              h1: ({ node, ...props }) => (
                                  <Typography
                                      variant="h4"
                                      sx={{
                                        font: 'inherit',
                                        color: theme === 'dark' ? 'white' : 'black',
                                        fontWeight: 'bold',
                                        mb: 2,
                                      }}
                                      {...props}
                                  />
                              ),
                              h2: ({ node, ...props }) => (
                                  <Typography
                                      variant="h5"
                                      sx={{
                                        font: 'inherit',
                                        color: theme === 'dark' ? 'white' : 'black',
                                        fontWeight: 'bold',
                                        mb: 2,
                                      }}
                                      {...props}
                                  />
                              ),
                              h3: ({ node, ...props }) => (
                                  <Typography
                                      variant="h6"
                                      sx={{
                                        font: 'inherit',
                                        color: theme === 'dark' ? 'white' : 'black',
                                        fontWeight: 'bold',
                                      }}
                                      {...props}
                                  />
                              ),
                              p: ({ node, ...props }) => (
                                  <Typography
                                      sx={{
                                        font: 'inherit',
                                        color: theme === 'dark' ? 'white' : 'black',
                                      }}
                                      {...props}
                                  />
                              ),
                              ul: ({ node, ...props }) => (
                                  <ul
                                      style={{
                                        color: theme === 'dark' ? 'white' : 'black',
                                        font: 'inherit',
                                      }}
                                      {...props}
                                  />
                              ),
                              ol: ({ node, ...props }) => (
                                  <ol
                                      style={{
                                        color: theme === 'dark' ? 'white' : 'black',
                                        font: 'inherit',
                                      }}
                                      {...props}
                                  />
                              ),
                            }}
                        >
                          {keyIdeas}
                        </ReactMarkdown>
                      </Box>
                    </Box>
                )}
                {discussionPoints && (
                    <Box sx={{ marginTop: 2 }}>
                      <Typography
                          variant="h6"
                          sx={{
                            font: 'inherit',
                            fontWeight: 'bold',
                            fontSize: '20px',
                            mb: 2,
                            color: theme === 'dark' ? 'white' : 'black',  // Set text color based on theme
                          }}
                      >
                        Discussion Points
                      </Typography>
                      <Box sx={{ border: '1px solid #f57c00', padding: 2, borderRadius: '12px' }}>
                        <ReactMarkdown
                            components={{
                              h1: ({ node, ...props }) => (
                                  <Typography
                                      variant="h4"
                                      sx={{
                                        font: 'inherit',
                                        color: theme === 'dark' ? 'white' : 'black',
                                        fontWeight: 'bold',
                                        mb: 2,
                                      }}
                                      {...props}
                                  />
                              ),
                              h2: ({ node, ...props }) => (
                                  <Typography
                                      variant="h5"
                                      sx={{
                                        font: 'inherit',
                                        color: theme === 'dark' ? 'white' : 'black',
                                        fontWeight: 'bold',
                                        mb: 2,
                                      }}
                                      {...props}
                                  />
                              ),
                              h3: ({ node, ...props }) => (
                                  <Typography
                                      variant="h6"
                                      sx={{
                                        font: 'inherit',
                                        color: theme === 'dark' ? 'white' : 'black',
                                        fontWeight: 'bold',
                                      }}
                                      {...props}
                                  />
                              ),
                              p: ({ node, ...props }) => (
                                  <Typography
                                      sx={{
                                        font: 'inherit',
                                        color: theme === 'dark' ? 'white' : 'black',
                                      }}
                                      {...props}
                                  />
                              ),
                              ul: ({ node, ...props }) => (
                                  <ul
                                      style={{
                                        color: theme === 'dark' ? 'white' : 'black',
                                        font: 'inherit',
                                      }}
                                      {...props}
                                  />
                              ),
                              ol: ({ node, ...props }) => (
                                  <ol
                                      style={{
                                        color: theme === 'dark' ? 'white' : 'black',
                                        font: 'inherit',
                                      }}
                                      {...props}
                                  />
                              ),
                            }}
                        >
                          {discussionPoints}
                        </ReactMarkdown>
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
