import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import { Delete, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DocumentsPage = (theme) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchDocuments = async () => {
      try {
        const response = await axios.get(`https://docuthinker-ai-app.onrender.com/documents/${userId}`);

        const documentsData = response.data;
        const documentsList = Object.keys(documentsData)
            .filter(key => key !== 'message')
            .map(key => documentsData[key]);

        setDocuments(documentsList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [userId]);

  const handleViewDocument = async (docId) => {
    try {
      const response = await axios.get(
          `https://docuthinker-ai-app.onrender.com/document-details/${userId}/${docId}`
      );
      const { summary, originalText } = response.data;

      navigate('/home', { state: { summary, originalText } });
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await axios.delete(`https://docuthinker-ai-app.onrender.com/documents/${userId}/${docId}`);
      setDocuments(documents.filter((doc) => doc.id !== docId));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleDeleteAllDocuments = async () => {
    try {
      await axios.delete(`https://docuthinker-ai-app.onrender.com/documents/${userId}`);
      setDocuments([]);
    } catch (error) {
      console.error('Error deleting all documents:', error);
    }
  };

  if (!userId) {
    return (
        <Box p={4} sx={{ textAlign: 'center' }}>
          <Typography variant="h5" color="error" sx={{ font: 'inherit', fontSize: '24px', fontWeight: 'bold', color: theme === 'dark' ? 'red' : 'white' }}>
            You are not logged in. Please log in to view your documents.
          </Typography>
        </Box>
    );
  }

  if (loading) {
    return (
        <Box p={4} display="flex" justifyContent="center" alignItems="center">
          <CircularProgress />
        </Box>
    );
  }

  return (
      <Box p={4}>
        <Typography variant="h4" gutterBottom sx={{ font: 'inherit', fontWeight: 'bold', fontSize: '34px', color: theme === 'dark' ? 'white' : 'black' }}>
          Your Analyzed Documents
        </Typography>

        {documents.length === 0 ? (
            <Typography sx={{ font: 'inherit', color: theme === 'dark' ? 'white' : 'black' }}>No documents found.</Typography>
        ) : (
            <List>
              {documents.map((doc) => (
                  <ListItem
                      key={doc.id}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        borderRadius: '8px',
                        gap: 1,
                        '@media (min-width:600px)': {
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        },
                        '&:hover': {
                          bgcolor: '#f5f5f5',
                          transition: 'background-color 0.3s ease'
                        }
                      }}
                  >
                    <ListItemText
                        primary={
                          <Typography sx={{ font: 'inherit', wordBreak: 'break-word' }}>
                            {doc.title[0]}
                          </Typography>
                        }
                    />
                    <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          gap: 1,
                          mt: { xs: 1, sm: 0 },
                        }}
                    >
                      <IconButton onClick={() => handleViewDocument(doc.id)} title={`View ${doc.title[0]}`}>
                        <Visibility />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteDocument(doc.id)} sx={{ color: 'red' }} title={`Delete ${doc.title[0]}`}>
                        <Delete />
                      </IconButton>
                    </Box>
                  </ListItem>
              ))}
            </List>
        )}

        {documents.length > 0 && (
            <Button
                variant="contained"
                color="secondary"
                onClick={handleDeleteAllDocuments}
                sx={{ mt: 2, font: 'inherit' }}
            >
              Delete All Documents
            </Button>
        )}
      </Box>
  );
};

export default DocumentsPage;
