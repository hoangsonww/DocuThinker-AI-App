import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Pagination,
} from "@mui/material";
import { Delete, Visibility, Edit, Save } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const DocumentsPage = ({ theme }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDocId, setEditingDocId] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [documentsPerPage] = useState(5);
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchDocuments = async () => {
      try {
        const response = await axios.get(
          `https://docuthinker-ai-app.onrender.com/documents/${userId}`,
        );
        const documentsData = response.data;
        const documentsList = Object.keys(documentsData)
          .filter((key) => key !== "message")
          .map((key) => documentsData[key]);

        setDocuments(documentsList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching documents:", error);
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [userId]);

  const indexOfLastDocument = currentPage * documentsPerPage;
  const indexOfFirstDocument = indexOfLastDocument - documentsPerPage;
  const currentDocuments = documents.slice(
    indexOfFirstDocument,
    indexOfLastDocument,
  );

  const handleViewDocument = async (docId) => {
    try {
      const response = await axios.get(
        `https://docuthinker-ai-app.onrender.com/document-details/${userId}/${docId}`,
      );
      const { summary, originalText } = response.data;
      navigate("/home", { state: { summary, originalText } });
    } catch (error) {
      console.error("Error viewing document:", error);
    }
  };

  const handleNewDocClick = () => {
    navigate("/home");
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await axios.delete(
        `https://docuthinker-ai-app.onrender.com/documents/${userId}/${docId}`,
      );
      setDocuments(documents.filter((doc) => doc.id !== docId));
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleDeleteAllDocuments = async () => {
    try {
      await axios.delete(
        `https://docuthinker-ai-app.onrender.com/documents/${userId}`,
      );
      setDocuments([]);
    } catch (error) {
      console.error("Error deleting all documents:", error);
    }
  };

  const handleEditDocument = (docId, currentTitle) => {
    setEditingDocId(docId);
    setNewTitle(currentTitle);
  };

  const handleSaveTitle = async (docId) => {
    try {
      await axios.post(
        `https://docuthinker-ai-app.onrender.com/update-document-title`,
        {
          userId,
          docId,
          newTitle,
        },
      );

      const updatedDocuments = documents.map((doc) =>
        doc.id === docId ? { ...doc, title: [newTitle] } : doc,
      );

      setDocuments(updatedDocuments);
      setEditingDocId(null);
    } catch (error) {
      console.error("Error updating document title:", error);
    }
  };

  const handleKeyPress = (event, docId) => {
    if (event.key === "Enter") {
      handleSaveTitle(docId);
    }
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  if (!userId) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          height: "100vh",
          backgroundColor: theme === "dark" ? "#222" : "#f4f4f4",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: theme === "dark" ? "#fff" : "#000",
            font: "inherit",
            fontSize: "24px",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          You are not signed in. Please{" "}
          <a href="/login" style={{ color: "#f57c00" }}>
            log in
          </a>{" "}
          to view your documents.
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
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          font: "inherit",
          fontWeight: "bold",
          fontSize: "34px",
          color: theme === "dark" ? "white" : "black",
        }}
      >
        Your Analyzed Documents
      </Typography>

      <div
        style={{
          borderBottom: "1px solid #ccc",
          width: "100%",
          marginBottom: "1rem",
        }}
      ></div>

      {documents.length === 0 ? (
        <Typography
          sx={{ font: "inherit", color: theme === "dark" ? "white" : "black" }}
        >
          No documents found.
        </Typography>
      ) : (
        <List>
          {currentDocuments.map((doc) => (
            <ListItem
              key={doc.id}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                borderRadius: "8px",
                gap: 1,
                "@media (min-width:600px)": {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                },
                "&:hover": {
                  bgcolor: theme === "dark" ? "#333" : "#f5f5f5",
                  transition: "background-color 0.3s ease",
                },
              }}
            >
              {/* Document Title or Editable Title */}
              {editingDocId === doc.id ? (
                <TextField
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, doc.id)}
                  variant="outlined"
                  size="small"
                  label={`Enter new title`}
                  sx={{ mb: 1 }}
                  inputProps={{
                    style: {
                      fontFamily: "Poppins, sans-serif",
                      color: theme === "dark" ? "white" : "black",
                    },
                  }}
                  InputLabelProps={{
                    style: {
                      fontFamily: "Poppins, sans-serif",
                      color: theme === "dark" ? "white" : "#000",
                    },
                  }}
                />
              ) : (
                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        font: "inherit",
                        wordBreak: "break-word",
                        color: theme === "dark" ? "white" : "black",
                      }}
                    >
                      {doc.title}
                    </Typography>
                  }
                />
              )}

              {/* Action Buttons */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 1,
                  mt: { xs: 1, sm: 0 },
                }}
              >
                {editingDocId === doc.id ? (
                  <IconButton
                    onClick={() => handleSaveTitle(doc.id)}
                    title={`Save ${doc.title}`}
                    sx={{ color: theme === "dark" ? "#fff" : "#000" }}
                  >
                    <Save />
                  </IconButton>
                ) : (
                  <>
                    <IconButton
                      onClick={() => handleViewDocument(doc.id)}
                      title={`View ${doc.title}`}
                      sx={{ color: theme === "dark" ? "#fff" : "#000" }}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      onClick={() => handleEditDocument(doc.id, doc.title)}
                      title={`Edit ${doc.title}`}
                      sx={{ color: theme === "dark" ? "#fff" : "#000" }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteDocument(doc.id)}
                      sx={{ color: "red" }}
                      title={`Delete ${doc.title}`}
                    >
                      <Delete />
                    </IconButton>
                  </>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      )}

      <div
        style={{
          borderBottom: "0.5px solid #ccc",
          width: "100%",
          marginBottom: "1rem",
          height: "1rem",
        }}
      ></div>

      {/* Pagination component */}
      <Pagination
        count={Math.ceil(documents.length / documentsPerPage)}
        page={currentPage}
        onChange={handlePageChange}
        color="secondary"
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 3,
          "& .MuiPaginationItem-root": {
            fontFamily: "Poppins, sans-serif",
            color: theme === "dark" ? "#fff" : "#000",
          },
          "& .Mui-selected": {
            backgroundColor: theme === "dark" ? "#fff" : "#000",
            color: theme === "dark" ? "#000" : "#fff",
          },
          color: theme === "dark" ? "#fff" : "#000",
        }}
      />

      {documents.length > 0 && (
        <>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleDeleteAllDocuments}
            sx={{ mt: 2, font: "inherit", mr: 2 }}
          >
            Delete All Documents
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNewDocClick}
            sx={{ mt: 2, font: "inherit" }}
          >
            Upload New Documents
          </Button>
        </>
      )}
    </Box>
  );
};

export default DocumentsPage;
