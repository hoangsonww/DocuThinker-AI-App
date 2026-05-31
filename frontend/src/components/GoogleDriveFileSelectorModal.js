import React, { useState, useEffect } from "react";
import {
  Box,
  Modal,
  Typography,
  TextField,
  CircularProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";

const ORANGE = "#f57c00";

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

      const filteredFiles = response.result.files.filter((file) => {
        const m = file.mimeType || "";
        return (
          m === "application/pdf" ||
          m ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          m === "application/json" ||
          m.startsWith("text/")
        );
      });

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

  const dark = theme === "dark";

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "92%", sm: "460px" },
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: dark ? "#1e1e1e" : "#fff",
          color: dark ? "white" : "black",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
          border: dark ? "1px solid #2e2e2e" : "1px solid #eee",
          fontFamily: "Poppins, sans-serif",
          outline: "none",
        }}
      >
        <Box
          sx={{
            height: 6,
            flexShrink: 0,
            background: "linear-gradient(90deg,#ff8a00,#f57c00,#ffb74d)",
          }}
        />
        <Box
          sx={{
            p: { xs: 2.5, sm: 3 },
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  background: "linear-gradient(135deg,#ff8a00,#f57c00)",
                }}
              >
                <CloudOutlinedIcon />
              </Box>
              <Box>
                <Typography
                  sx={{
                    font: "inherit",
                    fontWeight: 700,
                    fontSize: "18px",
                    color: dark ? "#fff" : "#1a1a1a",
                    lineHeight: 1.1,
                  }}
                >
                  Import from Google Drive
                </Typography>
                <Typography
                  sx={{
                    font: "inherit",
                    fontSize: "12px",
                    color: dark ? "#aaa" : "#888",
                  }}
                >
                  Pick a PDF, Word, Markdown, or text file.
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={handleClose}
              sx={{ color: dark ? "#aaa" : "#777" }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Search */}
          <TextField
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search your Drive…"
            size="small"
            fullWidth
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                bgcolor: dark ? "#262626" : "#fafafa",
                "& fieldset": { borderColor: dark ? "#444" : "#e3e3e3" },
                "&:hover fieldset": { borderColor: ORANGE },
                "&.Mui-focused fieldset": { borderColor: ORANGE },
              },
              "& input": {
                fontFamily: "Poppins, sans-serif",
                color: dark ? "#fff" : "#1a1a1a",
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: dark ? "#888" : "#999" }} />
                </InputAdornment>
              ),
            }}
          />

          {/* File list */}
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "180px",
              }}
            >
              <CircularProgress sx={{ color: ORANGE }} />
            </Box>
          ) : (
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 1,
                maxHeight: "50vh",
              }}
            >
              {driveFiles.length > 0 ? (
                driveFiles.map((file) => {
                  const opening = selectedFileId === file.id;
                  return (
                    <Box
                      key={file.id}
                      onClick={() =>
                        !selectedFileId && handleFileSelection(file.id)
                      }
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        px: 1.5,
                        py: 1.25,
                        borderRadius: "12px",
                        border: dark ? "1px solid #333" : "1px solid #ececec",
                        cursor: selectedFileId ? "default" : "pointer",
                        opacity: selectedFileId && !opening ? 0.5 : 1,
                        transition: "all 0.15s ease",
                        "&:hover": selectedFileId
                          ? {}
                          : {
                              borderColor: ORANGE,
                              bgcolor: dark
                                ? "rgba(245,124,0,0.1)"
                                : "rgba(245,124,0,0.06)",
                            },
                      }}
                    >
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: "9px",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: ORANGE,
                          bgcolor: dark
                            ? "rgba(245,124,0,0.16)"
                            : "rgba(245,124,0,0.1)",
                        }}
                      >
                        <InsertDriveFileOutlinedIcon sx={{ fontSize: 19 }} />
                      </Box>
                      <Typography
                        sx={{
                          flex: 1,
                          font: "inherit",
                          fontSize: "14px",
                          color: dark ? "#eee" : "#333",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {file.name}
                      </Typography>
                      {opening && (
                        <CircularProgress size={18} sx={{ color: ORANGE }} />
                      )}
                    </Box>
                  );
                })
              ) : (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <CloudOutlinedIcon
                    sx={{ fontSize: 40, color: dark ? "#555" : "#ccc", mb: 1 }}
                  />
                  <Typography
                    sx={{
                      font: "inherit",
                      fontSize: "14px",
                      color: dark ? "#aaa" : "#888",
                    }}
                  >
                    {isSearchPerformed
                      ? "No matching files found."
                      : "No supported files in your Drive."}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default GoogleDriveFileSelectorModal;
