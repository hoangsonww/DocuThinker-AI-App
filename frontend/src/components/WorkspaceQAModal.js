import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Button,
  FormControlLabel,
  Switch,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Tooltip,
  Link,
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  QuestionAnswer as QAIcon,
} from '@mui/icons-material';
import axios from 'axios';

const WorkspaceQAModal = ({ open, onClose, theme, onDocumentOpen }) => {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchScope, setSearchScope] = useState('workspace'); // 'current' or 'workspace'
  const [expandedCitations, setExpandedCitations] = useState({});
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const userId = localStorage.getItem('userId');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  useEffect(() => {
    if (open && inputRef.current) {
      // Focus on input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userQuestion = question.trim();
    setQuestion('');
    setLoading(true);

    // Add user message to conversation
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: userQuestion,
      timestamp: new Date(),
    };

    setConversation(prev => [...prev, userMessage]);

    try {
      const requestBody = {
        userId,
        question: userQuestion,
        topK: 5,
        filters: {}, // Could add filters from search scope
      };

      const response = await axios.post(
        'https://docuthinker-app-backend-api.vercel.app/v1/qa/workspace',
        requestBody
      );

      if (response.data) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: response.data.answer || 'I apologize, but I couldn\'t generate an answer at this time.',
          citations: response.data.citations || [],
          contextFound: response.data.contextFound || false,
          timestamp: new Date(),
        };

        setConversation(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Workspace Q&A error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'I encountered an error while processing your question. Please try again.',
        citations: [],
        contextFound: false,
        timestamp: new Date(),
      };

      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const toggleCitationExpansion = (messageId, citationId) => {
    const key = `${messageId}-${citationId}`;
    setExpandedCitations(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
    });
  };

  const handleCitationClick = (citation) => {
    if (onDocumentOpen) {
      onDocumentOpen(citation.docId, citation.location);
    }
  };

  const clearConversation = () => {
    setConversation([]);
  };

  const getCitationIcon = (citation) => {
    if (citation.score < 0.3) return '🎯'; // High relevance
    if (citation.score < 0.6) return '📄'; // Medium relevance
    return '📃'; // Lower relevance
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: theme === 'dark' ? '#333' : '#eee',
          backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <QAIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Ask Your Workspace</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={searchScope === 'workspace'}
                onChange={(e) => setSearchScope(e.target.checked ? 'workspace' : 'current')}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                Search: {searchScope === 'workspace' ? 'All docs' : 'Current doc'}
              </Typography>
            }
          />
          
          <Button size="small" onClick={clearConversation} disabled={conversation.length === 0}>
            Clear
          </Button>
          
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 0,
          backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        }}
      >
        {/* Conversation Area */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fafafa',
          }}
        >
          {conversation.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                color: theme === 'dark' ? '#888' : '#666',
              }}
            >
              <QAIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                Ask questions about your documents
              </Typography>
              <Typography variant="body2">
                I can help you find information across all your uploaded documents.<br/>
                Try asking: "What are the main topics covered?" or "Summarize the key findings"
              </Typography>
            </Box>
          ) : (
            <>
              {conversation.map((message) => (
                <Box key={message.id} sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Paper
                      sx={{
                        p: 2,
                        maxWidth: '80%',
                        backgroundColor: message.type === 'user' 
                          ? (theme === 'dark' ? '#1976d2' : '#1976d2')
                          : (theme === 'dark' ? '#2a2a2a' : '#f0f0f0'),
                        color: message.type === 'user' 
                          ? '#ffffff'
                          : (theme === 'dark' ? '#ffffff' : '#000000'),
                      }}
                    >
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Typography>
                      
                      {message.type === 'ai' && (
                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                          <Tooltip title="Copy response">
                            <IconButton 
                              size="small" 
                              onClick={() => copyToClipboard(message.content)}
                              sx={{ color: theme === 'dark' ? '#aaa' : '#666' }}
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Paper>
                  </Box>

                  {/* Citations */}
                  {message.citations && message.citations.length > 0 && (
                    <Box sx={{ ml: message.type === 'user' ? 0 : 2, mr: message.type === 'user' ? 2 : 0 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: theme === 'dark' ? '#aaa' : '#666',
                          mb: 1,
                          display: 'block'
                        }}
                      >
                        Sources ({message.citations.length}):
                      </Typography>
                      
                      <List dense sx={{ py: 0 }}>
                        {message.citations.map((citation) => {
                          const key = `${message.id}-${citation.id}`;
                          const isExpanded = expandedCitations[key];
                          
                          return (
                            <ListItem key={citation.id} sx={{ px: 0, py: 0.5 }}>
                              <Paper
                                sx={{
                                  width: '100%',
                                  backgroundColor: theme === 'dark' ? '#333' : '#f9f9f9',
                                  border: 1,
                                  borderColor: theme === 'dark' ? '#555' : '#ddd',
                                }}
                              >
                                <ListItemButton
                                  onClick={() => handleCitationClick(citation)}
                                  sx={{ py: 1 }}
                                >
                                  <Box sx={{ width: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {getCitationIcon(citation)} [{citation.id}] {citation.title}
                                      </Typography>
                                      <Chip
                                        label={`${Math.round((1 - citation.score) * 100)}%`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        sx={{ ml: 'auto', fontSize: '0.7rem' }}
                                      />
                                    </Box>
                                    
                                    <Typography 
                                      variant="caption" 
                                      color="text.secondary"
                                      sx={{ display: 'block', mb: 1 }}
                                    >
                                      Location: {citation.location}
                                    </Typography>
                                    
                                    <Typography variant="body2" color="text.secondary">
                                      {isExpanded 
                                        ? citation.snippet 
                                        : `${citation.snippet.substring(0, 100)}${citation.snippet.length > 100 ? '...' : ''}`
                                      }
                                    </Typography>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleCitationExpansion(message.id, citation.id);
                                        }}
                                      >
                                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                      </IconButton>
                                      
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCitationClick(citation);
                                        }}
                                        title="Open document"
                                      >
                                        <OpenIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  </Box>
                                </ListItemButton>
                              </Paper>
                            </ListItem>
                          );
                        })}
                      </List>
                    </Box>
                  )}

                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: theme === 'dark' ? '#666' : '#999',
                      display: 'block',
                      textAlign: message.type === 'user' ? 'right' : 'left',
                      mt: 0.5
                    }}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </Typography>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </Box>

        {/* Input Area */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            p: 2,
            borderTop: 1,
            borderColor: theme === 'dark' ? '#333' : '#eee',
            backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
          }}
        >
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder="Ask a question about your documents..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            sx={{
              mr: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
              },
            }}
          />
          
          <IconButton
            type="submit"
            disabled={!question.trim() || loading}
            color="primary"
            sx={{
              alignSelf: 'flex-end',
              mb: 0.5,
            }}
          >
            {loading ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default WorkspaceQAModal;