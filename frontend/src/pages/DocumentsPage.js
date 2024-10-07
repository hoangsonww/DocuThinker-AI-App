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
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId'); // Get userId from localStorage
  const navigate = useNavigate(); // Initialize the navigation hook

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchDocuments = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/documents/${userId}`);

        // Extracting the documents from the response
        const documentsData = response.data;
        const documentsList = Object.keys(documentsData)
            .filter(key => key !== 'message') // Exclude the message key
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
          `http://localhost:3000/document-details/${userId}/${docId}`
      );
      const { summary, originalText } = response.data; // Directly access response.data

      // Redirect to Home component, passing summary and originalText as state
      navigate('/home', { state: { summary, originalText } });
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await axios.delete(`http://localhost:3000/documents/${userId}/${docId}`);
      setDocuments(documents.filter((doc) => doc.id !== docId));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleDeleteAllDocuments = async () => {
    try {
      await axios.delete(`http://localhost:3000/documents/${userId}`);
      setDocuments([]);
    } catch (error) {
      console.error('Error deleting all documents:', error);
    }
  };

  if (!userId) {
    return (
        <Box p={4}>
          <Typography variant="h5" color="error">You are not logged in. Please log in to view your documents.</Typography>
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
        <Typography variant="h4" gutterBottom>Your Documents</Typography>

        {documents.length === 0 ? (
            <Typography>No documents found.</Typography>
        ) : (
            <List>
              {documents.map((doc) => (
                  <ListItem
                      key={doc.id}
                      secondaryAction={
                        <>
                          <IconButton onClick={() => handleViewDocument(doc.id)}>
                            <Visibility />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteDocument(doc.id)}>
                            <Delete />
                          </IconButton>
                        </>
                      }
                  >
                    <ListItemText primary={doc.title[0]} />
                  </ListItem>
              ))}
            </List>
        )}

        {documents.length > 0 && (
            <Button
                variant="contained"
                color="secondary"
                onClick={handleDeleteAllDocuments}
                sx={{ mt: 2 }}
            >
              Delete All Documents
            </Button>
        )}
      </Box>
  );
};

export default DocumentsPage;
