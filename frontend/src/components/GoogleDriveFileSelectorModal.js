import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Modal,
  Typography,
  TextField,
  CircularProgress,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";

const GoogleDriveFileSelectorModal = ({
  open,
  handleClose,
  googleAuth,
  onFileSelect,
  theme,
}) => {
  const [driveFiles, setDriveFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [isSearchPerformed, setIsSearchPerformed] = useState(false);

  const listFiles = async (query = "") => {
    setLoading(true);
    try {
      const response = await window.gapi.client.drive.files.list({
        pageSize: 10,
        fields: "nextPageToken, files(id, name, mimeType)",
        q: query ? `name contains '${query}'` : "",
      });

      const filteredFiles = response.result.files.filter(
        (file) =>
          file.mimeType === "application/pdf" ||
          file.mimeType ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );

      setDriveFiles(filteredFiles);
    } catch (error) {
      console.error("Error fetching Google Drive files:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setIsSearchPerformed(false);
      listFiles();
    }
  }, [open]);

  const handleFileSelection = async (fileId) => {
    setSelectedFileId(fileId);

    const file = driveFiles.find((file) => file.id === fileId);
    const fileUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;

    try {
      const response = await axios.get(fileUrl, {
        headers: {
          Authorization: `Bearer ${googleAuth.currentUser.get().getAuthResponse().access_token}`,
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: file.mimeType });
      const selectedFile = new File([blob], file.name, { type: file.mimeType });

      onFileSelect(selectedFile);
      handleClose();
    } catch (error) {
      console.error("Failed to retrieve file from Google Drive:", error);
    } finally {
      setSelectedFileId(null);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    setIsSearchPerformed(true);
    listFiles(query);
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: { xs: 2, sm: 3, md: 4 },
          bgcolor: theme === "dark" ? "#1e1e1e" : "white",
          color: theme === "dark" ? "white" : "black",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          width: { xs: "90%", sm: "70%", md: "50%", lg: "400px" },
          maxWidth: "500px",
          maxHeight: "90vh",
          margin: "0 auto",
          marginTop: { xs: "20%", sm: "10%" },
          textAlign: "center",
          overflowY: "auto",
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: theme === "dark" ? "white" : "black",
          }}
        >
          <CloseIcon />
        </IconButton>

        <Typography
          variant="h6"
          sx={{
            marginTop: 2,
            marginBottom: 2,
            font: "inherit",
            fontSize: "1.4rem",
            fontWeight: "bold",
            color: theme === "dark" ? "white" : "black",
          }}
        >
          Select a File from Google Drive
        </Typography>

        <TextField
          label="Search Your Google Drive"
          value={searchTerm}
          onChange={handleSearchChange}
          fullWidth
          sx={{ margin: "20px 0", fontFamily: "Poppins, sans-serif" }}
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

        {loading ? (
          <CircularProgress
            sx={{
              textAlign: "center !important",
              color: theme === "dark" ? "white" : "#f57c00",
            }}
          />
        ) : (
          <Box sx={{ maxHeight: "300px", overflowY: "auto", width: "100%" }}>
            {driveFiles.length > 0 ? (
              driveFiles.map((file) => (
                <Box key={file.id} sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleFileSelection(file.id)}
                    disabled={selectedFileId === file.id}
                    sx={{
                      justifyContent: "left",
                      font: "inherit",
                      textAlign: "left",
                      color: theme === "dark" ? "white" : "black",
                      border: "none",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      "&:hover": {
                        backgroundColor: theme === "dark" ? "#333" : "#f57c00",
                        color: "white",
                      },
                    }}
                  >
                    {selectedFileId === file.id ? (
                      <CircularProgress
                        size={24}
                        sx={{
                          color: theme === "dark" ? "white" : "black",
                          textAlign: "center !important",
                        }}
                      />
                    ) : (
                      file.name
                    )}
                  </Button>
                </Box>
              ))
            ) : isSearchPerformed ? (
              <Typography sx={{ font: "inherit" }}>No files found</Typography>
            ) : null}
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default GoogleDriveFileSelectorModal;
