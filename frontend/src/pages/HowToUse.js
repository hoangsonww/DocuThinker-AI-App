import React from "react";
import { Box, Typography, List, ListItem, ListItemText } from "@mui/material";

const HowToUse = ({ theme }) => {
  return (
    <Box
      sx={{
        padding: 4,
        maxWidth: "800px",
        margin: "2rem auto",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        backgroundColor: theme === "dark" ? "#1e1e1e" : "#fff",
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      {/* Page Title */}
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          font: "inherit",
          fontWeight: "bold",
          color: "#f57c00",
          textAlign: "center",
          fontSize: "2rem",
        }}
      >
        How to Use DocuThinker
      </Typography>

      {/* Introduction */}
      <Typography
        variant="body1"
        sx={{
          font: "inherit",
          marginBottom: 3,
          fontSize: "1.1rem",
          color: theme === "dark" ? "white" : "#333",
          lineHeight: "1.6",
        }}
      >
        Welcome to <strong>DocuThinker</strong>, your AI-powered document
        summarization tool. Follow the steps below to upload documents and make
        the most out of our key features like summarization, generating key
        ideas, and discussion points from your uploaded documents.
      </Typography>

      {/* Step-by-step Instructions */}
      <Typography
        variant="h5"
        sx={{
          font: "inherit",
          fontWeight: "bold",
          fontSize: "22px",
          color: "#f57c00",
          marginBottom: 2,
        }}
      >
        Steps to Get Started
      </Typography>

      <List sx={{ listStyleType: "none", paddingLeft: 0 }}>
        <ListItem>
          <ListItemText
            disableTypography
            primary={
              <Typography
                sx={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  color: theme === "dark" ? "white" : "black",
                }}
              >
                1. Upload a Document
              </Typography>
            }
            secondary={
              <Typography
                sx={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "1rem",
                  color: theme === "dark" ? "white" : "#333",
                }}
              >
                Click the upload box on the home page to drag and drop your
                document or select one from your device. We support both PDF and
                DOCX formats.
              </Typography>
            }
          />
        </ListItem>

        <ListItem>
          <ListItemText
            disableTypography
            primary={
              <Typography
                sx={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  color: theme === "dark" ? "white" : "black",
                }}
              >
                2. View the Document Summary
              </Typography>
            }
            secondary={
              <Typography
                sx={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "1rem",
                  color: theme === "dark" ? "white" : "#333",
                }}
              >
                Once uploaded, the app will automatically summarize your
                document. You'll see the full original document text on the left
                and a concise summary on the right.
              </Typography>
            }
          />
        </ListItem>

        <ListItem>
          <ListItemText
            disableTypography
            primary={
              <Typography
                sx={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  color: theme === "dark" ? "white" : "black",
                }}
              >
                3. Generate Key Ideas
              </Typography>
            }
            secondary={
              <Typography
                sx={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "1rem",
                  color: theme === "dark" ? "white" : "#333",
                }}
              >
                After reviewing the summary, click the 'Generate Key Ideas'
                button to let the AI extract the most important ideas from the
                document.
              </Typography>
            }
          />
        </ListItem>

        <ListItem>
          <ListItemText
            disableTypography
            primary={
              <Typography
                sx={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  color: theme === "dark" ? "white" : "black",
                }}
              >
                4. Generate Discussion Points
              </Typography>
            }
            secondary={
              <Typography
                sx={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "1rem",
                  color: theme === "dark" ? "white" : "#333",
                }}
              >
                You can also generate discussion points that can be used for
                group discussions, debates, or further analysis of the document.
              </Typography>
            }
          />
        </ListItem>

        <ListItem>
          <ListItemText
            disableTypography
            primary={
              <Typography
                sx={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  color: theme === "dark" ? "white" : "black",
                }}
              >
                5. Chat with our AI
              </Typography>
            }
            secondary={
              <Typography
                sx={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "1rem",
                  color: theme === "dark" ? "white" : "#333",
                }}
              >
                Use the 'Chat with AI' feature to ask specific questions or get
                more information based on the document. Our AI models, trained
                by DocuThinker, will use the document context to provide
                tailored answers.
              </Typography>
            }
          />
        </ListItem>

        <ListItem>
          <ListItemText
            disableTypography
            primary={
              <Typography
                sx={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  color: theme === "dark" ? "white" : "black",
                }}
              >
                6. Create an Account to Save Uploaded Documents
              </Typography>
            }
            secondary={
              <Typography
                sx={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "1rem",
                  color: theme === "dark" ? "white" : "#333",
                }}
              >
                You can also create an account to save your uploaded documents
                and access them later. This feature allows you to view,
                download, or delete your documents as needed and gives you a
                higher upload limit. Visit the <strong>Register</strong> page to
                create an account and then log in to access your saved
                documents.
              </Typography>
            }
          />
        </ListItem>
      </List>

      {/* Extra Info */}
      <Typography
        variant="h5"
        sx={{
          font: "inherit",
          fontWeight: "bold",
          color: "#f57c00",
          marginTop: 4,
          marginBottom: 2,
          fontSize: "22px",
        }}
      >
        Supported Document Formats
      </Typography>
      <Typography
        variant="body1"
        sx={{
          marginBottom: 3,
          font: "inherit",
          fontSize: "1.1rem",
          color: theme === "dark" ? "white" : "#333",
          lineHeight: "1.6",
        }}
      >
        DocuThinker currently supports:
        <ul style={{ paddingLeft: "20px", marginTop: "8px", font: "inherit" }}>
          <li>PDF files</li>
          <li>DOCX (Word) files</li>
        </ul>
        Ensure your document is in one of these formats before uploading to
        guarantee smooth processing.
      </Typography>

      {/* Final Note */}
      <Typography
        variant="body1"
        sx={{
          font: "inherit",
          fontSize: "1.1rem",
          color: theme === "dark" ? "white" : "#333",
          lineHeight: "1.6",
        }}
      >
        DocuThinker helps you save time by summarizing long documents,
        extracting key ideas, and preparing discussion points for further
        exploration. Make sure to utilize the AI chat feature to dive deeper
        into any aspect of your document!
      </Typography>

      <div
        style={{
          borderBottom: "1px solid #ccc",
          width: "100%",
          marginBottom: "1rem",
          marginTop: "1rem",
        }}
      ></div>

      {/* Thank you message */}
      <Typography
        sx={{
          mt: 3,
          font: "inherit",
          fontWeight: "bold",
          fontSize: "18px",
          color: theme === "dark" ? "white" : "black",
        }}
      >
        Made with ❤️ by{" "}
        <a style={{ color: "#f57c00" }} href="https://sonnguyenhoang.com">
          Son Nguyen
        </a>{" "}
        in 2024. Thank you for visiting DocuThinker! 🚀
      </Typography>
    </Box>
  );
};

export default HowToUse;
