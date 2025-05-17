import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
} from "@mui/material";
import MuiLink from "@mui/material/Link";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";
import Spinner from "./Spinner";
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from "uuid";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const AiMessage = ({ text, theme }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((error) => {
        console.error("Failed to copy text:", error);
      });
  };

  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", mb: 1 }}>
      <Box
        sx={{
          bgcolor: "#e0e0e0",
          color: "black",
          p: 1,
          borderRadius: "12px",
          maxWidth: "80%",
          font: "inherit",
          overflow: "auto",
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            h1: ({ node, ...props }) => (
              <Typography
                variant="h4"
                sx={{
                  font: "inherit",
                  color: "black",
                  fontWeight: "bold",
                  mb: 2,
                }}
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <Typography
                variant="h5"
                sx={{
                  font: "inherit",
                  color: "black",
                  fontWeight: "bold",
                  mb: 2,
                }}
                {...props}
              />
            ),
            h3: ({ node, ...props }) => (
              <Typography
                variant="h6"
                sx={{
                  font: "inherit",
                  color: "black",
                  fontWeight: "bold",
                }}
                {...props}
              />
            ),
            p: ({ node, ...props }) => (
              <Typography
                sx={{
                  font: "inherit",
                  color: "black",
                }}
                {...props}
              />
            ),
            ul: ({ node, ...props }) => (
              <ul
                style={{
                  color: "black",
                  font: "inherit",
                }}
                {...props}
              />
            ),
            ol: ({ node, ...props }) => (
              <ol
                style={{
                  color: "black",
                  font: "inherit",
                }}
                {...props}
              />
            ),
            a: ({ ...props }) => (
              <MuiLink
                {...props}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "inherit",
                  textDecoration: "underline",
                  "&:hover": {
                    color: "#f57c00",
                    cursor: "pointer",
                  },
                }}
              />
            ),
            blockquote: ({ node, ...props }) => (
              <Box
                component="blockquote"
                sx={{
                  borderLeft: "4px solid #ddd",
                  margin: "1rem 0",
                  paddingLeft: "1rem",
                  fontStyle: "italic",
                  color: "#555",
                }}
                {...props}
              />
            ),
            hr: ({ node, ...props }) => (
              <Box
                component="hr"
                sx={{
                  border: "none",
                  borderTop: "1px solid #eee",
                  margin: "1rem 0",
                }}
                {...props}
              />
            ),
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || "");
              if (!inline && match) {
                return (
                  <pre
                    style={{
                      background: "#f5f5f5",
                      padding: "1rem",
                      borderRadius: "4px",
                      overflowX: "auto",
                      margin: "1rem 0",
                      color: "#333",
                    }}
                  >
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                );
              } else {
                return (
                  <code
                    style={{
                      background: "#f5f5f5",
                      padding: "0.2rem 0.4rem",
                      borderRadius: "4px",
                      color: "#333",
                    }}
                    className={className}
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
            },
            pre: ({ node, children, ...props }) => (
              <Box
                component="pre"
                sx={{
                  background: "#f5f5f5",
                  padding: "1rem",
                  borderRadius: "4px",
                  overflowX: "auto",
                  margin: "1rem 0",
                }}
                {...props}
              >
                {children}
              </Box>
            ),
            table: ({ node, children, ...props }) => (
              <Box sx={{ overflowX: "auto", width: "100%", mb: "1rem" }}>
                <Box
                  component="table"
                  sx={{
                    width: "100%",
                    borderCollapse: "collapse",
                    border: "1px solid",
                    borderColor: "black",
                  }}
                  {...props}
                >
                  {children}
                </Box>
              </Box>
            ),
            thead: ({ node, children, ...props }) => (
              <Box component="thead" {...props}>
                {children}
              </Box>
            ),
            tbody: ({ node, children, ...props }) => (
              <Box component="tbody" {...props}>
                {children}
              </Box>
            ),
            th: ({ node, children, ...props }) => (
              <Box
                component="th"
                sx={{
                  border: "1px solid",
                  borderColor: "black",
                  p: "0.5rem",
                  backgroundColor: "#f5f5f5",
                  textAlign: "left",
                  fontWeight: "bold",
                }}
                {...props}
              >
                {children}
              </Box>
            ),
            td: ({ node, children, ...props }) => (
              <Box
                component="td"
                sx={{
                  border: "1px solid",
                  borderColor: "black",
                  p: "0.5rem",
                  textAlign: "left",
                }}
                {...props}
              >
                {children}
              </Box>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </Box>
      <IconButton
        onClick={handleCopy}
        sx={{
          ml: 1,
          mt: 1,
          p: 0.5,
          color: copied ? "#4caf50" : "gray",
          "&:hover": { color: "#f57c00" },
        }}
      >
        {copied ? (
          <CheckCircleIcon fontSize="small" />
        ) : (
          <ContentCopyIcon fontSize="small" />
        )}
      </IconButton>
    </Box>
  );
};

const ChatModal = ({ theme }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      const newSessionId = uuidv4();
      localStorage.setItem("sessionId", newSessionId);
    }
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  const handleChat = async () => {
    const originalText = localStorage.getItem("originalText");
    const sessionId = localStorage.getItem("sessionId");
    if (!message || !originalText || !sessionId) return;
    if (loading) return;

    try {
      setLoading(true);
      const res = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/chat",
        { message, originalText, sessionId },
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
    if (event.key === "Enter") handleChat();
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .catch((error) => console.error("Failed to copy text:", error));
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
              "&:hover": { color: "#f57c00" },
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
              fontWeight: "bold",
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
                  font: "inherit",
                }}
              >
                {chat.sender === "AI" ? (
                  <AiMessage text={chat.text} theme={theme} />
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
            <Box ref={chatEndRef} />
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
              display: { xs: "none", md: "block" },
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
