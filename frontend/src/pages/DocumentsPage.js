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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
  const [openDeleteAllDialog, setOpenDeleteAllDialog] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim() !== "") {
        handleSearchChange();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleSearchChange = async () => {
    setSearchLoading(true);
    try {
      const response = await axios.get(
        `https://docuthinker-app-backend-api.vercel.app/search-documents/${userId}?searchTerm=${encodeURIComponent(searchTerm)}`,
      );

      const results = Object.keys(response.data)
        .filter((key) => key !== "message")
        .map((key) => {
          // Handle title as either an array or string
          const title = Array.isArray(response.data[key].title)
            ? response.data[key].title.join(" ")
            : response.data[key].title;

          return {
            docId: response.data[key].docId,
            title: title,
            snippet: response.data[key].snippet,
          };
        });

      setSearchResults(results);
    } catch (error) {
      console.error("Error searching documents:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchDocuments = async () => {
      try {
        const response = await axios.get(
          `https://docuthinker-app-backend-api.vercel.app/documents/${userId}`,
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
        `https://docuthinker-app-backend-api.vercel.app/document-details/${userId}/${docId}`,
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
        `https://docuthinker-app-backend-api.vercel.app/documents/${userId}/${docId}`,
      );
      setDocuments(documents.filter((doc) => doc.id !== docId));
      setSearchResults(searchResults.filter((doc) => doc.docId !== docId));
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleOpenDeleteAllDialog = () => {
    setOpenDeleteAllDialog(true);
  };

  const handleCloseDeleteAllDialog = () => {
    setOpenDeleteAllDialog(false);
  };

  const handleConfirmDeleteAllDocuments = async () => {
    try {
      await axios.delete(
        `https://docuthinker-app-backend-api.vercel.app/documents/${userId}`,
      );
      setDocuments([]);
      handleCloseDeleteAllDialog();
    } catch (error) {
      console.error("Error deleting all documents:", error);
      handleCloseDeleteAllDialog();
    }
  };

  const handleEditDocument = (docId, currentTitle) => {
    setEditingDocId(docId);
    setNewTitle(currentTitle);
  };

  const handleSaveTitle = async (docId) => {
    try {
      // Find the current document by docId
      const currentDoc = documents.find(
        (doc) => doc.id === docId || doc.docId === docId,
      );

      // Check if the new title is different from the current title
      if (currentDoc && currentDoc.title === newTitle) {
        // If the title hasn't changed, close the editing state without sending the request
        setEditingDocId(null);
        setNewTitle("");
        return;
      }

      // If title is modified, send the request to update the title on the server
      await axios.post(
        `https://docuthinker-app-backend-api.vercel.app/update-document-title`,
        {
          userId,
          docId,
          newTitle,
        },
      );

      // Update the title in the documents array
      const updatedDocuments = documents.map((doc) =>
        doc.id === docId || doc.docId === docId
          ? { ...doc, title: newTitle }
          : doc,
      );
      setDocuments(updatedDocuments);

      // Update the title in the searchResults array
      const updatedSearchResults = searchResults.map((doc) =>
        doc.docId === docId ? { ...doc, title: newTitle } : doc,
      );
      setSearchResults(updatedSearchResults);

      // Reset the editing state
      setEditingDocId(null);
      setNewTitle("");
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
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          width: "100%",
          mb: 2,
        }}
      >
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

        <TextField
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          variant="outlined"
          size="small"
          label="Search documents..."
          title="Search documents"
          sx={{
            marginTop: { xs: 2, md: 0 },
            width: { xs: "100%", md: "40%" },
            borderRadius: "8px",
            bgcolor: theme === "dark" ? "#333" : "#fff",
            transition: "background-color 0.3s ease",
            "& .MuiOutlinedInput-input": {
              color: theme === "dark" ? "#fff" : "#000",
              borderRadius: "8px",
            },
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: theme === "dark" ? "#444" : "#ccc",
                borderRadius: "8px",
              },
              "&:hover fieldset": {
                borderColor: theme === "dark" ? "#666" : "#999",
                borderRadius: "8px",
              },
            },
          }}
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
      </Box>

      {searchLoading ? (
        <CircularProgress sx={{ display: "block", margin: "20px auto" }} />
      ) : (
        <>
          {searchTerm && searchResults.length === 0 ? (
            <Typography
              sx={{
                textAlign: "center",
                font: "inherit",
                fontWeight: "bold",
                fontSize: "18px",
                color: theme === "dark" ? "#fff" : "#000",
                marginTop: 4,
                marginBottom: 2,
              }}
            >
              No results found
            </Typography>
          ) : (
            searchResults.slice(0, 5).length > 0 && (
              <List>
                {searchResults.slice(0, 5).map((doc) => (
                  <ListItem
                    key={doc.docId}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      borderRadius: "8px",
                      gap: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
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
                    {editingDocId === doc.docId ? (
                      <TextField
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, doc.docId)}
                        variant="outlined"
                        size="small"
                        label={`Enter new title`}
                        sx={{ mb: 1, width: "100%" }}
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
                        secondary={
                          <Typography
                            sx={{
                              font: "inherit",
                              color: theme === "dark" ? "#ccc" : "#555",
                            }}
                          >
                            {doc.snippet}
                          </Typography>
                        }
                      />
                    )}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 1,
                        mt: { xs: 1, sm: 0 },
                      }}
                    >
                      {editingDocId === doc.docId ? (
                        <IconButton
                          onClick={() => handleSaveTitle(doc.docId)}
                          title={`Save ${doc.title}`}
                          sx={{ color: theme === "dark" ? "#fff" : "#000" }}
                        >
                          <Save />
                        </IconButton>
                      ) : (
                        <>
                          <IconButton
                            onClick={() => handleViewDocument(doc.docId)}
                            title={`View ${doc.title}`}
                            sx={{ color: theme === "dark" ? "#fff" : "#000" }}
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            onClick={() =>
                              handleEditDocument(doc.docId, doc.title)
                            }
                            title={`Edit ${doc.title}`}
                            sx={{ color: theme === "dark" ? "#fff" : "#000" }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteDocument(doc.docId)}
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
            )
          )}
        </>
      )}

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
                      sx={{
                        color: theme === "dark" ? "#fff" : "#000",
                        "&:hover": {
                          transform: "scale(1.15)",
                          transition: "transform 0.2s ease",
                        },
                      }}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      onClick={() => handleEditDocument(doc.id, doc.title)}
                      title={`Edit ${doc.title}`}
                      sx={{
                        color: theme === "dark" ? "#fff" : "#000",
                        "&:hover": {
                          transform: "scale(1.15)",
                          transition: "transform 0.2s ease",
                        },
                      }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteDocument(doc.id)}
                      sx={{
                        color: "red",
                        "&:hover": {
                          transform: "scale(1.15)",
                          transition: "transform 0.2s ease",
                        },
                      }}
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
            onClick={handleOpenDeleteAllDialog}
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

      <Dialog
        open={openDeleteAllDialog}
        onClose={handleCloseDeleteAllDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          style: {
            backgroundColor: theme === "dark" ? "#333" : "#fff",
            color: theme === "dark" ? "#fff" : "#000",
            borderRadius: "8px",
          },
        }}
      >
        <DialogTitle
          id="alert-dialog-title"
          sx={{
            backgroundColor: theme === "dark" ? "#222" : "#f5f5f5",
            color: theme === "dark" ? "#fff" : "#000",
            font: "inherit",
            fontSize: "24px",
          }}
        >
          {"Confirm Delete All Documents"}
        </DialogTitle>
        <DialogContent
          sx={{
            backgroundColor: theme === "dark" ? "#222" : "#f5f5f5",
            color: theme === "dark" ? "#ddd" : "#000",
          }}
        >
          <DialogContentText
            id="alert-dialog-description"
            sx={{
              color: theme === "dark" ? "#ddd" : "#000",
              font: "inherit",
            }}
          >
            Are you sure you want to delete all documents? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: theme === "dark" ? "#222" : "#f5f5f5",
          }}
        >
          <Button
            onClick={handleCloseDeleteAllDialog}
            sx={{
              color: theme === "dark" ? "#fff" : "#000",
              font: "inherit",
              "&:hover": {
                backgroundColor: theme === "dark" ? "#555" : "#f5f5f5",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeleteAllDocuments}
            color="secondary"
            autoFocus
            sx={{
              color: theme === "dark" ? "#f57c00" : "red",
              font: "inherit",
              "&:hover": {
                backgroundColor: theme === "dark" ? "#555" : "#f5f5f5",
              },
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentsPage;
