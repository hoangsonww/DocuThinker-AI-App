import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { gapi } from "gapi-script";
import GoogleDriveFileSelectorModal from "./GoogleDriveFileSelectorModal";

// Import libraries for text extraction from the legacy build of pdf.js
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import mammoth from "mammoth";

// Set the PDF.js worker source to a local copy served from your public folder
pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ""}/pdf.worker.min.mjs`;

// Google API constants
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";
const DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
];

const UploadModal = ({
  setSummary,
  setOriginalText,
  setDocumentFile,
  theme,
}) => {
  // Local state variables
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [file, setFile] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [title, setTitle] = useState("");
  const [googleAuth, setGoogleAuth] = useState(null);
  const [isGoogleAuthReady, setIsGoogleAuthReady] = useState(false);
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // Initialize Google API client
  const initClient = () => {
    return new Promise((resolve, reject) => {
      gapi.load("client:auth2", () => {
        gapi.client
          .init({
            apiKey: process.env.REACT_APP_GOOGLE_DRIVE_API_KEY,
            clientId: process.env.REACT_APP_GOOGLE_DRIVE_CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES,
          })
          .then(() => {
            const authInstance = gapi.auth2.getAuthInstance();
            setGoogleAuth(authInstance);
            setIsGoogleAuthReady(true);
            resolve();
          })
          .catch((error) => {
            console.error("Error initializing GAPI:", error);
            setErrorMessage(
              "Google API initialization failed: " + error.message,
            );
            setOpenSnackbar(true);
            reject(error);
          });
      });
    });
  };

  useEffect(() => {
    initClient().catch((error) =>
      console.error("Google API client initialization failed:", error),
    );
  }, []);

  // Handle Google login
  const handleGoogleLogin = async () => {
    if (isGoogleAuthReady && googleAuth) {
      try {
        await googleAuth.signIn();
        setDriveModalOpen(true);
      } catch (error) {
        console.error("Google sign-in failed:", error);
        setErrorMessage("Google sign-in failed: " + error.message);
        setOpenSnackbar(true);
      }
    } else {
      console.error("GoogleAuth instance is not initialized yet.");
      setErrorMessage("GoogleAuth instance is not ready.");
      setOpenSnackbar(true);
    }
  };

  // Handle file selected from Google Drive
  const handleFileFromGoogleDrive = (selectedFile) => {
    setFile(selectedFile);
    setTitle(selectedFile.name);
    setDocumentFile(selectedFile);
  };

  // Dropzone for file selection
  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
    setDocumentFile(acceptedFiles[0]);
    setTitle(acceptedFiles[0].name);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [],
    },
  });

  // Extract text from PDF using pdfjs-dist (emulating pdf-parse in the backend)
  const extractTextFromPdf = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let extractedText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      extractedText += pageText + "\n";
    }
    return extractedText;
  };

  // Extract text from DOCX using mammoth (same as backend)
  const extractTextFromDocx = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  // Handle file upload: extract text using the same technique as backend, then send to backend
  const handleUpload = async () => {
    if (!file || !title) {
      setErrorMessage("Please select a file to upload and provide a title.");
      setOpenSnackbar(true);
      return;
    }

    try {
      setLoading(true);
      setProgressMessage("Extracting text...");
      let extractedText = "";

      if (file.type === "application/pdf") {
        extractedText = await extractTextFromPdf(file);
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        extractedText = await extractTextFromDocx(file);
      } else {
        setErrorMessage("Unsupported file format");
        setOpenSnackbar(true);
        setLoading(false);
        return;
      }

      setProgressMessage("Summarizing your document...");
      // Prepare payload with title and extracted text
      const payload = {
        title: title,
        text: extractedText,
      };

      const userId = localStorage.getItem("userId");
      if (userId) {
        payload.userId = userId;
      }

      // Send the extracted text to the backend endpoint
      const response = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/upload",
        payload,
      );
      setLoading(false);
      setProgressMessage("");
      const { summary, originalText } = response.data;
      setSummary(summary);
      setOriginalText(originalText);
      localStorage.setItem("originalText", originalText);
      setIsUploaded(true);
      setOpen(false);
    } catch (error) {
      setLoading(false);
      setProgressMessage("");
      console.error("Upload failed:", error);
      const errMsg = error.response?.data?.error || error.message;
      setErrorMessage("Upload failed: " + errMsg);
      setOpenSnackbar(true);
    }
  };

  // Handle closing the snackbar
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setOpenSnackbar(false);
  };

  return (
    <>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: { xs: "90%", sm: "70%", md: "400px" },
            maxHeight: "90vh",
            padding: { xs: 2, sm: 4 },
            bgcolor: theme === "dark" ? "#1e1e1e" : "white",
            textAlign: "center",
            borderRadius: "12px",
            transition: "background-color 0.3s ease",
            color: theme === "dark" ? "white" : "black",
            overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            pointerEvents: "auto",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              marginBottom: 2,
              font: "inherit",
              fontSize: { xs: "16px", sm: "18px" },
              color: theme === "dark" ? "white" : "black",
              transition: "color 0.3s ease",
              fontWeight: "bold",
            }}
          >
            Upload a document (PDF or DOCX)
          </Typography>

          <Box
            {...getRootProps()}
            sx={{
              border: `2px dashed ${theme === "dark" ? "white" : "#f57c00"}`,
              padding: { xs: 2, sm: 4 },
              cursor: "pointer",
              marginBottom: 2,
              transition: "border-color 0.3s ease",
            }}
          >
            <input {...getInputProps()} />
            <Typography
              variant="body1"
              sx={{
                font: "inherit",
                color: theme === "dark" ? "white" : "black",
                transition: "color 0.3s ease",
              }}
            >
              {file
                ? "Drag & drop a new file here, or click to select a new file"
                : "Drag & drop a file here, or click to select"}
            </Typography>
          </Box>

          {file && (
            <Typography
              variant="body2"
              sx={{
                mb: 2,
                font: "inherit",
                color: theme === "dark" ? "white" : "black",
                transition: "color 0.3s ease",
              }}
            >
              {file.name}
            </Typography>
          )}

          {file && (
            <TextField
              label="Document Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              sx={{ marginBottom: 2, font: "inherit" }}
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
          )}

          <Button
            variant="contained"
            sx={{
              bgcolor: "#f57c00",
              color: "white",
              font: "inherit",
              transition: "background-color 0.3s ease",
              width: "100%",
            }}
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CircularProgress size={24} sx={{ color: "white", mr: 1 }} />
                <Typography
                  variant="button"
                  sx={{ color: "white", font: "inherit" }}
                >
                  {progressMessage}
                </Typography>
              </Box>
            ) : (
              "Upload"
            )}
          </Button>

          <Typography sx={{ mt: 2, font: "inherit" }}>OR</Typography>

          <Button
            variant="contained"
            sx={{
              bgcolor: "#4285F4 !important",
              color: "white !important",
              font: "inherit",
              mt: 2,
              width: "100%",
              "&:hover": { bgcolor: "#3367D6 !important" },
            }}
            onClick={handleGoogleLogin}
            disabled={!isGoogleAuthReady}
          >
            {isGoogleAuthReady
              ? "Select from Google Drive"
              : "Loading Google Auth..."}
          </Button>

          <Typography
            sx={{
              mt: 3,
              font: "inherit",
              color: theme === "dark" ? "white" : "black",
              fontSize: "14px",
            }}
          >
            <em>
              Note: Please avoid uploading very large files as server limits may
              prevent processing. Processing may take up to 2 minutes during
              high traffic or after periods of inactivity.
            </em>
          </Typography>
        </Box>

        <GoogleDriveFileSelectorModal
          open={driveModalOpen}
          handleClose={() => setDriveModalOpen(false)}
          googleAuth={googleAuth}
          onFileSelect={handleFileFromGoogleDrive}
          theme={theme}
        />
      </div>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="error"
          sx={{ width: "100%", fontFamily: "Poppins, sans-serif" }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UploadModal;
