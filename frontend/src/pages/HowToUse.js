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
        transition: "background-color 0.3s ease",
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
          transition: "background-color 0.3s ease",
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
                document or select one from your device. Alternatively, you can
                use Google Drive to import your document. We support PDF and
                DOCX (Word) files.
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
                6. Generate Bullet-Point Summary
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
                Click the 'Generate Bullet-Point Summary' button to get a
                concise list of bullet points summarizing the document. This
                feature is useful for creating quick notes or study guides.
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
                7. Customize the Summary Language
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
                Use the 'Change Language' feature to translate the summary into
                a different language. This feature is helpful for multilingual
                users or when you need to share the summary with others who
                speak a different language.
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
                8. Sentiment Analysis
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
                Use the 'Sentiment Analysis' feature to analyze the overall
                sentiment of the document. The AI will provide insights on
                whether the document has a positive, negative, or neutral tone.
                This feature is useful for understanding the emotional context
                of the text.
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
                9. Actionable Recommendations
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
                Get actionable recommendations based on the document content.
                The AI will suggest next steps, improvements, or actions to take
                based on the information in the document. Use this feature to
                enhance your decision-making process or guide your next steps.
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
                10. Rewrite Content Automatically
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
                Simply specify the tone or style you want, and the AI will
                rewrite the content of the document accordingly. This feature is
                useful for creating variations of the text, adjusting the
                writing style, or generating content for different audiences.
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
                11. Create an Account to Save Uploaded Documents
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
                12. Document Search for Easy Retrieval
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
                Use the document search feature to quickly find and retrieve
                specific documents. You can search by title, content, or date
                uploaded to locate the document you need. This feature is
                helpful for organizing and managing your uploaded documents
                (only available for registered and signed in users).
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
                13. Voice Chat with AI
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
                Use the voice chat feature to interact with the AI using your
                voice. Simply upload a document, then click the 'Voice Chat'
                button to start a conversation with the AI. You can ask
                questions, seek clarifications, or discuss the document content
                using voice commands. Or ask anything you have in mind!
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
                14. Manage Your Uploaded Documents and Profile
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
                Visit the 'Documents' page to manage your uploaded documents,
                including viewing, downloading, or deleting them. You can also
                update your profile information, update your email, change your
                social accounts, and more by visiting the 'Profile' page. (Only
                available for registered and signed in users).
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
          <li>DOC (Word 97-2003) files</li>
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
