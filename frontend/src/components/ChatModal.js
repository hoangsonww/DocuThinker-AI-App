import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import Spinner from "./Spinner";
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from "uuid";

const ChatModal = ({ theme }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      const newSessionId = uuidv4();
      localStorage.setItem("sessionId", newSessionId);
    }
  }, []);

  const handleChat = async () => {
    const originalText = localStorage.getItem("originalText");
    const sessionId = localStorage.getItem("sessionId");

    if (!message || !originalText || !sessionId) return;

    try {
      setLoading(true);
      const res = await axios.post(
        "https://docuthinker-ai-app.onrender.com/chat",
        {
          message,
          originalText,
          sessionId,
        },
      );
      setLoading(false);
      const aiResponse = res.data.response;
      setChatHistory([
        ...chatHistory,
        { sender: "User", text: message },
        { sender: "AI", text: aiResponse },
      ]);
      setMessage("");
    } catch (error) {
      setLoading(false);
      console.error("Chat failed:", error);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleChat();
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        sx={{
          bgcolor: "#f57c00",
          color: "white",
          font: "inherit",
          borderRadius: "12px",
        }}
      >
        Chat with AI
      </Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "40%",
            height: "50%",
            bgcolor: theme === "dark" ? "#1e1e1e" : "#fff",
            color: theme === "dark" ? "white" : "black",
            padding: 4,
            borderRadius: "12px",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            resize: "both",
            aspectRatio: "1 / 1.5",
            minWidth: "300px",
            maxWidth: "80%",
            minHeight: "400px",
            maxHeight: "80vh",
          }}
        >
          <IconButton
            onClick={() => setOpen(false)}
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
              marginBottom: 2,
              font: "inherit",
              fontSize: "20px",
              textAlign: "center",
              color: theme === "dark" ? "white" : "black",
            }}
          >
            Chat With AI About Your Document
          </Typography>

          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              border: "1px solid #f57c00",
              padding: 2,
              marginBottom: 2,
              borderRadius: "12px",
              maxHeight: "60%",
              bgcolor: theme === "dark" ? "#2a2a2a" : "white",
            }}
          >
            {chatHistory.map((chat, index) => (
              <Box
                key={index}
                sx={{
                  textAlign: chat.sender === "User" ? "right" : "left",
                  marginBottom: 1,
                  borderRadius: "12px",
                  font: "inherit",
                }}
              >
                {chat.sender === "AI" ? (
                  <Typography
                    variant="body2"
                    sx={{
                      bgcolor: "#e0e0e0",
                      color: "black",
                      padding: 1,
                      borderRadius: "12px",
                      display: "inline-block",
                      font: "inherit",
                    }}
                  >
                    <ReactMarkdown>{chat.text}</ReactMarkdown>
                  </Typography>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      bgcolor: "#f57c00",
                      color: "white",
                      padding: 1,
                      borderRadius: "12px",
                      display: "inline-block",
                      font: "inherit",
                    }}
                  >
                    {chat.text}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>

          <TextField
            label="Chat with AI"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            sx={{
              marginBottom: 2,
              borderRadius: "12px",
              font: "inherit",
              bgcolor: theme === "dark" ? "#2a2a2a" : "white",
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

          <Button
            variant="contained"
            sx={{ bgcolor: "#f57c00", font: "inherit" }}
            onClick={handleChat}
          >
            {loading ? <Spinner /> : "Send"}
          </Button>

          <Typography
            sx={{
              textAlign: "center",
              mt: 2,
              font: "inherit",
              color: theme === "dark" ? "white" : "black",
              fontSize: "14px",
              display: {
                xs: "none",
                md: "block",
              },
            }}
          >
            <em>
              Resize the modal by dragging the bottom right corner. Feel free to
              talk to our AI about anything!
            </em>
          </Typography>
        </Box>
      </Modal>
    </>
  );
};

export default ChatModal;
