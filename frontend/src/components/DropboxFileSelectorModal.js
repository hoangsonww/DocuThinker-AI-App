import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Modal,
  Typography,
  TextField,
  CircularProgress,
} from "@mui/material";
import { Dropbox } from "dropbox";

const DropboxFileSelectorModal = ({
  open,
  handleClose,
  accessToken,
  onFileSelect,
  theme,
}) => {
  const [dropboxFiles, setDropboxFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const dbx = new Dropbox({ accessToken });

  // List files from Dropbox with filtering for .pdf and .docx
  const listFiles = async (query = "") => {
    setLoading(true);
    try {
      const response = await dbx.filesListFolder({ path: "" });

      const filteredFiles = response.entries.filter(
        (file) =>
          (file.name.endsWith(".pdf") || file.name.endsWith(".docx")) &&
          (!query || file.name.toLowerCase().includes(query.toLowerCase())),
      );

      setDropboxFiles(filteredFiles);
    } catch (error) {
      console.error("Error fetching Dropbox files:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && accessToken) {
      listFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, accessToken, listFiles]);

  // Handle file selection
  const handleFileSelection = async (fileId) => {
    try {
      const response = await dbx.filesDownload({ path: fileId });

      // Convert Blob to File
      const blob = response.fileBlob;
      const selectedFile = new File([blob], response.name, { type: blob.type });

      onFileSelect(selectedFile);
      handleClose();
    } catch (error) {
      console.error("Error downloading Dropbox file:", error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    listFiles(e.target.value);
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 4,
          bgcolor: theme === "dark" ? "#1e1e1e" : "white",
          color: theme === "dark" ? "white" : "black",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          width: { xs: "90%", sm: "70%", md: "400px" },
          maxHeight: "90vh",
          margin: "0 auto",
          marginTop: "10%",
          textAlign: "center",
          overflowY: "auto",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            marginBottom: 2,
            fontSize: { xs: "16px", sm: "18px" },
            color: theme === "dark" ? "white" : "black",
          }}
        >
          Select a File from Dropbox
        </Typography>

        <TextField
          label="Search Dropbox"
          value={searchTerm}
          onChange={handleSearchChange}
          fullWidth
          sx={{ margin: "20px 0", fontFamily: "Poppins, sans-serif" }}
          inputProps={{
            style: { color: theme === "dark" ? "white" : "black" },
          }}
          InputLabelProps={{
            style: { color: theme === "dark" ? "white" : "black" },
          }}
        />

        {loading ? (
          <CircularProgress
            sx={{ color: theme === "dark" ? "white" : "#f57c00" }}
          />
        ) : (
          <Box sx={{ maxHeight: "300px", overflowY: "auto", width: "100%" }}>
            {dropboxFiles.length > 0 ? (
              dropboxFiles.map((file) => (
                <Box key={file.id} sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleFileSelection(file.id)}
                    sx={{
                      justifyContent: "left",
                      color: theme === "dark" ? "white" : "black",
                      borderColor: theme === "dark" ? "white" : "#f57c00",
                      "&:hover": {
                        backgroundColor: theme === "dark" ? "#333" : "#f57c00",
                        color: "white",
                      },
                    }}
                  >
                    {file.name}
                  </Button>
                </Box>
              ))
            ) : (
              <Typography>No files found</Typography>
            )}
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default DropboxFileSelectorModal;
