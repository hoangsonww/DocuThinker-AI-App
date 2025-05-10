import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  LinearProgress,
  Snackbar,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Modal,
  Fade,
} from "@mui/material";
import MuiLink from "@mui/material/Link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import UploadModal from "../components/UploadModal";
import ChatModal from "../components/ChatModal";
import axios from "axios";
import { useErrorToast } from "../components/useErrorToast";
import { useLocation } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import MicRecorder from "mic-recorder-to-mp3";

const Home = ({ theme }) => {
  const { showErrorToast, ErrorToastComponent } = useErrorToast();
  const keyIdeasRef = useRef(null);
  const discussionPointsRef = useRef(null);
  const languageRef = useRef(null);
  const rewriteRef = useRef(null);
  const [summary, setSummary] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [keyIdeas, setKeyIdeas] = useState("");
  const [discussionPoints, setDiscussionPoints] = useState("");
  const [loadingKeyIdeas, setLoadingKeyIdeas] = useState(false);
  const [loadingDiscussionPoints, setLoadingDiscussionPoints] = useState(false);
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [refinementInstructions, setRefinementInstructions] = useState("");
  const [refinedSummary, setRefinedSummary] = useState("");
  const refinedRef = useRef(null);
  const [loadingRefinement, setLoadingRefinement] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [documentFile, setDocumentFile] = useState(null);
  const [sentiment, setSentiment] = useState({ score: 0, description: "" });
  const [hasFetchedSentiment, setHasFetchedSentiment] = useState(false);
  const [loadingSentiment, setLoadingSentiment] = useState(false);
  const location = useLocation();
  const [bulletSummary, setBulletSummary] = useState("");
  const [loadingBulletSummary, setLoadingBulletSummary] = useState(false);
  const bulletSummaryRef = useRef(null);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [loadingLanguageSummary, setLoadingLanguageSummary] = useState(false);
  const [languageSummary, setLanguageSummary] = useState("");
  const languages = [
    "Arabic",
    "Bengali",
    "Bulgarian",
    "Chinese (Simplified / Traditional)",
    "Croatian",
    "Czech",
    "Danish",
    "Dutch",
    "English",
    "Estonian",
    "Farsi",
    "Finnish",
    "French",
    "German",
    "Greek",
    "Gujarati",
    "Hebrew",
    "Hindi",
    "Hungarian",
    "Indonesian",
    "Italian",
    "Japanese",
    "Kannada",
    "Korean",
    "Latvian",
    "Lithuanian",
    "Malayalam",
    "Marathi",
    "Norwegian",
    "Polish",
    "Portuguese",
    "Romanian",
    "Russian",
    "Serbian",
    "Slovak",
    "Slovenian",
    "Spanish",
    "Swahili",
    "Swedish",
    "Tamil",
    "Telugu",
    "Thai",
    "Turkish",
    "Ukrainian",
    "Urdu",
    "Vietnamese",
    "Welsh",
    "Zulu",
  ];
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [loadingLanguage, setLoadingLanguage] = useState(false);
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [desiredStyle, setDesiredStyle] = useState("");
  const [rewrittenContent, setRewrittenContent] = useState("");
  const [loadingRewrite, setLoadingRewrite] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState("");
  const recommendationsRef = useRef(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audioResponse, setAudioResponse] = useState("");
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [recording, setRecording] = useState(false);
  const [file, setFile] = useState(null);
  const [recordingMessage, setRecordingMessage] = useState("Recording Audio");
  const [audioBlob, setAudioBlob] = useState(null);
  const recorder = useRef(new MicRecorder({ bitRate: 128 }));
  const audioRef = useRef(null);

  // Update recording message dots animation
  useEffect(() => {
    let dots = 0;
    if (recording) {
      const interval = setInterval(() => {
        setRecordingMessage(`Recording Audio${".".repeat(dots)}`);
        dots = (dots + 1) % 4;
      }, 500);
      return () => clearInterval(interval);
    }
  }, [recording]);

  const handleUploadFile = (event) => {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);
    setAudioBlob(null);
  };

  const handleRecordStart = () => {
    setFile(null);
    setAudioBlob(null);
    recorder.current
      .start()
      .then(() => {
        setRecording(true);
      })
      .catch((error) => {
        console.error("Record start failed:", error);
        showErrorToast("Record start failed: " + error.message);
      });
  };

  const handleRecordStop = () => {
    recorder.current
      .stop()
      .getMp3()
      .then(([buffer, blob]) => {
        const recordingFile = new File(buffer, "recording.wav", {
          type: "audio/wav",
          lastModified: Date.now(),
        });
        setFile(recordingFile);
        setAudioBlob(blob);
        setRecording(false);
      })
      .catch((error) => {
        console.error("Record stop failed:", error);
        showErrorToast("Record stop failed: " + error.message);
      });
  };

  const handleRefineSummary = async () => {
    setLoadingRefinement(true);
    try {
      const response = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/refine-summary",
        {
          summary,
          refinementInstructions,
        },
      );
      setRefinedSummary(response.data.refinedSummary);
      setShowRefineModal(false);
      refinedRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      showErrorToast(error.message + ". Please try again.");
      console.error("Failed to refine summary:", error);
    } finally {
      setLoadingRefinement(false);
    }
  };

  const handleSendAudio = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("File", file);

    // Adding context to FormData if the `summary` variable is defined
    if (summary) {
      formData.append("context", summary);
    }

    try {
      setLoadingAudio(true);
      const response = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/process-audio",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      setAudioResponse(response.data.summary);
      audioRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      showErrorToast(
        "Cannot process audio. Please ensure the audio is clear and audible, and try again.",
      );
      console.error("Error processing audio:", error);
    } finally {
      setLoadingAudio(false);
      setShowAudioModal(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const response = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/actionable-recommendations",
        {
          documentText: originalText,
        },
      );

      const formattedRecommendations = formatAsMarkdown(
        response.data.recommendations,
      );
      setRecommendations(formattedRecommendations);
      recommendationsRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      showErrorToast(error.message + ". Please try again.");
      console.error("Failed to generate recommendations:", error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleRewriteContent = async () => {
    setLoadingRewrite(true);
    try {
      const response = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/content-rewriting",
        {
          documentText: originalText,
          style: desiredStyle,
        },
      );

      setRewrittenContent(response.data.rewrittenContent);
      setShowRewriteModal(false);
      rewriteRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      showErrorToast(error.message + ". Please try again.");
      console.error("Failed to rewrite content:", error);
    } finally {
      setLoadingRewrite(false);
    }
  };

  const stripMarkdown = (markdownText) => {
    return markdownText
      .replace(/[#*_~`>+-]/g, "") // Remove Markdown symbols like #, *, _, ~, `, >, +, -.
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove Markdown links but keep text.
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // Remove image Markdown.
      .replace(/!\[\]\([^)]*\)/g, "") // Remove empty image Markdown.
      .replace(/\n{2,}/g, "\n"); // Replace multiple line breaks with a single one.
  };

  const handleCopyToClipboard = (text) => {
    // Strip markdown before copying
    const plainText = stripMarkdown(text);
    navigator.clipboard
      .writeText(plainText)
      .then(() => {
        setSnackbarOpen(true);
      })
      .catch((error) => {
        console.error("Failed to copy text: ", error);
        showErrorToast(error.message + ". Please try again.");
      });
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleLanguageSelection = async (language) => {
    setSelectedLanguage(language);
    setLoadingLanguageSummary(true);
    setLoadingLanguage(true);
    try {
      const response = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/summary-in-language",
        {
          documentText: originalText,
          language,
        },
      );
      const formattedLanguageSummary = formatAsMarkdown(response.data.summary);
      setLanguageSummary(formattedLanguageSummary);
      setLanguageModalOpen(false);
      languageRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      showErrorToast(error.message + ". Please try again.");
      console.error("Failed to generate summary in language:", error);
    } finally {
      setLoadingLanguageSummary(false);
      setLoadingLanguage(false);
    }
  };

  const fetchSentiment = async (text) => {
    setLoadingSentiment(true); // Start loading
    try {
      const response = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/sentiment-analysis",
        {
          documentText: text,
        },
      );

      // Check if the response data contains the expected properties
      if (
        response.data &&
        typeof response.data.sentimentScore === "number" &&
        response.data.description
      ) {
        setSentiment({
          score: response.data.sentimentScore,
          description: response.data.description,
        });
        setHasFetchedSentiment(true);
      } else {
        console.error("Unexpected response format:", response.data);
      }
    } catch (error) {
      showErrorToast(error.message + ". Please try again.");
      console.error("Failed to fetch sentiment:", error);
      showErrorToast(error.message + ". Please try again.");
    } finally {
      setLoadingSentiment(false);
    }
  };

  useEffect(() => {
    if (location.state) {
      const { summary, originalText } = location.state;
      setSummary(summary);
      setOriginalText(originalText);
    }
  }, [location.state]);

  useEffect(() => {
    if (originalText && !hasFetchedSentiment) {
      setLoadingSentiment(true);
      fetchSentiment(originalText).then(() => {
        setLoadingSentiment(false);
      });
    }
  }, [originalText, hasFetchedSentiment]);

  const formatAsMarkdown = (text) => {
    const paragraphs = text.split(/\n\s*\n/);
    return paragraphs.map((para) => para.trim()).join("\n\n");
  };

  const handleGenerateIdeas = async () => {
    setLoadingKeyIdeas(true);
    try {
      const response = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/generate-key-ideas",
        {
          documentText: originalText,
        },
      );
      const formattedKeyIdeas = formatAsMarkdown(response.data.keyIdeas);
      setKeyIdeas(formattedKeyIdeas);
      keyIdeasRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      showErrorToast(error.message + ". Please try again.");
      console.error("Failed to generate key ideas:", error);
    } finally {
      setLoadingKeyIdeas(false);
    }
  };

  const handleGenerateDiscussionPoints = async () => {
    setLoadingDiscussionPoints(true);
    try {
      const response = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/generate-discussion-points",
        {
          documentText: originalText,
        },
      );
      const formattedDiscussionPoints = formatAsMarkdown(
        response.data.discussionPoints,
      );
      setDiscussionPoints(formattedDiscussionPoints);
      discussionPointsRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      showErrorToast(error.message + ". Please try again.");
      console.error("Failed to generate discussion points:", error);
    } finally {
      setLoadingDiscussionPoints(false);
    }
  };

  const handleGenerateBulletSummary = async () => {
    setLoadingBulletSummary(true);
    try {
      const response = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/bullet-summary",
        {
          documentText: originalText,
        },
      );
      const formattedBulletSummary = formatAsMarkdown(response.data.summary);
      setBulletSummary(formattedBulletSummary);
      bulletSummaryRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      showErrorToast(error.message + ". Please try again.");
      console.error("Failed to generate bullet-point summary:", error);
    } finally {
      setLoadingBulletSummary(false);
    }
  };

  const handleUploadNewDocument = () => {
    setOpenConfirmDialog(true);
  };

  const handleConfirmReload = () => {
    window.location.reload();
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        padding: 4,
        gap: 2,
        alignItems: "flex-start",
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      {!summary && (
        <UploadModal
          setSummary={setSummary}
          setOriginalText={setOriginalText}
          theme={theme}
          setDocumentFile={setDocumentFile}
        />
      )}
      {summary && (
        <>
          <Box
            sx={{
              width: { xs: "100%", md: "30%" },
              marginBottom: { xs: 2, md: 0 },
              transition: "background-color 0.3s ease, color 0.3s ease",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                font: "inherit",
                fontWeight: "bold",
                fontSize: "20px",
                mb: 2,
                color: theme === "dark" ? "white" : "black",
              }}
            >
              Original Document
            </Typography>
            <Box
              sx={{
                border: "1px solid #f57c00",
                padding: 2,
                borderRadius: "12px",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                overflowY: "auto",
              }}
            >
              <Typography
                sx={{
                  font: "inherit",
                  color: theme === "dark" ? "white" : "black",
                }}
              >
                {originalText}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              width: { xs: "100%", md: "70%" },
            }}
          >
            <Typography
              variant="h6"
              sx={{
                font: "inherit",
                fontWeight: "bold",
                fontSize: "20px",
                mb: 2,
                color: theme === "dark" ? "white" : "black",
              }}
            >
              Summary
            </Typography>
            <Box
              sx={{
                border: "1px solid #f57c00",
                padding: 2,
                marginBottom: 2,
                borderRadius: "12px",
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
                        color: theme === "dark" ? "white" : "black",
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
                        color: theme === "dark" ? "white" : "black",
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
                        color: theme === "dark" ? "white" : "black",
                        fontWeight: "bold",
                      }}
                      {...props}
                    />
                  ),
                  code: ({ node, inline, className, children, ...props }) => {
                    return inline ? (
                      <Box
                        component="code"
                        sx={{
                          backgroundColor:
                            theme === "dark" ? "#2d2d2d" : "#f5f5f5",
                          color: theme === "dark" ? "#f8f8f2" : "#333",
                          fontFamily: "monospace",
                          fontSize: "0.875rem",
                          borderRadius: "4px",
                          px: "0.4em",
                          py: "0.2em",
                        }}
                        {...props}
                      >
                        {children}
                      </Box>
                    ) : (
                      <Box
                        component="pre"
                        sx={{
                          backgroundColor:
                            theme === "dark" ? "#2d2d2d" : "#f5f5f5",
                          color: theme === "dark" ? "#f8f8f2" : "#333",
                          fontFamily: "monospace",
                          fontSize: "0.9rem",
                          borderRadius: "8px",
                          overflowX: "auto",
                          p: "1rem",
                          mb: "1rem",
                        }}
                        {...props}
                      >
                        <code className={className}>{children}</code>
                      </Box>
                    );
                  },
                  p: ({ node, ...props }) => (
                    <Typography
                      sx={{
                        font: "inherit",
                        color: theme === "dark" ? "white" : "black",
                      }}
                      {...props}
                    />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul
                      style={{
                        color: theme === "dark" ? "white" : "black",
                        font: "inherit",
                      }}
                      {...props}
                    />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol
                      style={{
                        color: theme === "dark" ? "white" : "black",
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
                  table: ({ node, children, ...props }) => (
                    <Box sx={{ overflowX: "auto", width: "100%", mb: "1rem" }}>
                      <Box
                        component="table"
                        sx={{
                          width: "100%",
                          borderCollapse: "collapse",
                          border: "1px solid",
                          borderColor: theme === "dark" ? "white" : "black",
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
                        borderColor: theme === "dark" ? "white" : "black",
                        p: "0.5rem",
                        backgroundColor: theme === "dark" ? "#333" : "#f5f5f5",
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
                        borderColor: theme === "dark" ? "white" : "black",
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
                {summary}
              </ReactMarkdown>
            </Box>

            {/* Sentiment Meter */}
            <Box
              sx={{
                textAlign: "center",
                marginBottom: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 1,
                  font: "inherit",
                  color: theme === "dark" ? "white" : "black",
                  fontWeight: "bold",
                  fontSize: "20px",
                }}
              >
                Sentiment Analysis
              </Typography>

              {loadingSentiment ? (
                <CircularProgress
                  sx={{ color: theme === "dark" ? "white" : "black" }}
                />
              ) : (
                <>
                  <LinearProgress
                    variant="determinate"
                    value={(sentiment.score + 1) * 50}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#ccc",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor:
                          sentiment.score > 0
                            ? "#4caf50"
                            : sentiment.score < 0
                              ? "#f44336"
                              : "#f57c00",
                      },
                    }}
                  />
                  <Typography
                    sx={{
                      mt: 1,
                      font: "inherit",
                      color: theme === "dark" ? "white" : "black",
                    }}
                  >
                    Sentiment Score: <strong>{sentiment.score}</strong> -{" "}
                    {sentiment.description}
                  </Typography>
                </>
              )}
            </Box>

            {/* Button section aligned in a row or column based on screen size */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                flexWrap: { xs: "nowrap", md: "wrap" },
                gap: 2,
                marginBottom: 2,
              }}
            >
              <Button
                onClick={handleGenerateIdeas}
                sx={{
                  bgcolor: "#f57c00",
                  color: "white",
                  font: "inherit",
                  borderRadius: "12px",
                }}
                disabled={loadingKeyIdeas}
              >
                {loadingKeyIdeas ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Generate Key Ideas"
                )}
              </Button>
              <Button
                onClick={handleGenerateDiscussionPoints}
                sx={{
                  bgcolor: "#f57c00",
                  color: "white",
                  font: "inherit",
                  borderRadius: "12px",
                }}
                disabled={loadingDiscussionPoints}
              >
                {loadingDiscussionPoints ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Generate Discussion Points"
                )}
              </Button>
              <Button
                onClick={handleGenerateBulletSummary}
                sx={{
                  bgcolor: "#f57c00",
                  color: "white",
                  font: "inherit",
                  borderRadius: "12px",
                }}
                disabled={loadingBulletSummary}
              >
                {loadingBulletSummary ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Generate Bullet-Point Summary"
                )}
              </Button>
              <ChatModal theme={theme} />
              <Button
                onClick={() => setShowAudioModal(true)}
                sx={{
                  bgcolor: "#f57c00",
                  color: "white",
                  font: "inherit",
                  borderRadius: "12px",
                }}
              >
                Voice Chat
              </Button>
              <Button
                onClick={() => setLanguageModalOpen(true)}
                sx={{
                  bgcolor: "#f57c00",
                  color: "white",
                  font: "inherit",
                  borderRadius: "12px",
                }}
              >
                Change Language
              </Button>
              <Button
                onClick={() => setShowRewriteModal(true)}
                sx={{
                  bgcolor: "#f57c00",
                  color: "white",
                  font: "inherit",
                  borderRadius: "12px",
                }}
              >
                Rewrite Content
              </Button>
              <Button
                onClick={handleGenerateRecommendations}
                sx={{
                  bgcolor: "#f57c00",
                  color: "white",
                  font: "inherit",
                  borderRadius: "12px",
                }}
                disabled={loadingRecommendations}
              >
                {loadingRecommendations ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Generate Recommendations"
                )}
              </Button>
              <Button
                onClick={() => setShowRefineModal(true)}
                sx={{
                  bgcolor: "#f57c00",
                  color: "white",
                  font: "inherit",
                  borderRadius: "12px",
                }}
              >
                Refine Summary
              </Button>
              <Button
                onClick={handleUploadNewDocument}
                sx={{
                  bgcolor: "#f57c00",
                  color: "white",
                  font: "inherit",
                  borderRadius: "12px",
                }}
              >
                Upload New Document
              </Button>
            </Box>

            {/* Modal for Upload or Record */}
            <Modal
              open={showAudioModal}
              onClose={() => setShowAudioModal(false)}
            >
              <Fade in={showAudioModal}>
                <Box
                  sx={{
                    bgcolor: theme === "dark" ? "#222" : "white",
                    color: theme === "dark" ? "white" : "black",
                    borderRadius: "12px",
                    width: "400px",
                    maxWidth: "90%",
                    p: 3,
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.4)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <IconButton
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      color: theme === "dark" ? "white" : "black",
                      "&:hover": { color: "#f57c00" },
                    }}
                    onClick={() => setShowAudioModal(false)}
                  >
                    <CloseIcon />
                  </IconButton>
                  <Typography
                    variant="h6"
                    sx={{
                      font: "inherit",
                      fontSize: "22px",
                      fontWeight: "bold",
                      color: theme === "dark" ? "white" : "black",
                    }}
                  >
                    Upload or Record Audio
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      mb: 2,
                      font: "inherit",
                      textAlign: "center",
                      fontSize: "14px",
                      color: theme === "dark" ? "white" : "black",
                    }}
                  >
                    Record your audio or upload an audio file to talk to our AI
                    with your voice. Our AI does not have access to your
                    conversation history so please be specific with your
                    queries!
                  </Typography>

                  <Button
                    variant="contained"
                    component="label"
                    sx={{
                      mb: 1,
                      width: "100%",
                      bgcolor: "#1976d2",
                      "&:hover": { bgcolor: "#1565c0" },
                      cursor: recording ? "not-allowed" : "pointer",
                      font: "inherit",
                    }}
                    disabled={recording}
                  >
                    {file && !recording
                      ? "Upload New Audio File"
                      : "Upload Audio File"}
                    <input
                      type="file"
                      accept="audio/*"
                      hidden
                      onChange={handleUploadFile}
                    />
                  </Button>
                  {file && !recording && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: "gray",
                        font: "inherit",
                        textAlign: "center",
                      }}
                    >
                      {file.name}
                    </Typography>
                  )}

                  <Button
                    variant="contained"
                    onClick={recording ? handleRecordStop : handleRecordStart}
                    sx={{
                      width: "100%",
                      bgcolor: recording ? "#d32f2f" : "#4caf50",
                      "&:hover": { bgcolor: recording ? "#c62828" : "#388e3c" },
                      font: "inherit",
                    }}
                  >
                    {recording
                      ? "Stop Recording"
                      : file
                        ? "Remove Audio and Record Again"
                        : "Record Audio"}
                  </Button>
                  {recording && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: "red",
                        font: "inherit",
                        textAlign: "center",
                      }}
                    >
                      {recordingMessage}
                    </Typography>
                  )}

                  {audioBlob && !recording && (
                    <audio
                      controls
                      src={URL.createObjectURL(audioBlob)}
                      style={{ width: "100%" }}
                    />
                  )}

                  <Button
                    variant="contained"
                    disabled={!file || loadingAudio}
                    onClick={handleSendAudio}
                    sx={{
                      mt: 2,
                      width: "50%",
                      alignSelf: "center",
                      font: "inherit",
                      bgcolor: "#f57c00",
                      "&:hover": { bgcolor: "#ef6c00" },
                    }}
                  >
                    {loadingAudio ? (
                      <CircularProgress size={24} sx={{ color: "white" }} />
                    ) : (
                      "SEND"
                    )}
                  </Button>
                </Box>
              </Fade>
            </Modal>

            {/* Display key ideas and discussion points as Markdown */}
            {keyIdeas && (
              <Box ref={keyIdeasRef} sx={{ marginTop: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    font: "inherit",
                    fontWeight: "bold",
                    fontSize: "20px",
                    mb: 2,
                    color: theme === "dark" ? "white" : "black",
                  }}
                >
                  Key Ideas
                </Typography>
                <Box
                  sx={{
                    border: "1px solid #f57c00",
                    padding: 2,
                    paddingTop: 1,
                    borderRadius: "12px",
                    position: "relative",
                  }}
                >
                  <Button
                    onClick={() => handleCopyToClipboard(keyIdeas)}
                    sx={{
                      bgcolor: "#f57c00",
                      color: "white",
                      font: "inherit",
                      borderRadius: "8px",
                      fontSize: "12px",
                      padding: "2px 8px",
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                    }}
                  >
                    Copy
                  </Button>
                  <Box
                    sx={{
                      paddingTop: "24px",
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
                              color: theme === "dark" ? "white" : "black",
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
                              color: theme === "dark" ? "white" : "black",
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
                              color: theme === "dark" ? "white" : "black",
                              fontWeight: "bold",
                            }}
                            {...props}
                          />
                        ),
                        code: ({
                          node,
                          inline,
                          className,
                          children,
                          ...props
                        }) => {
                          return inline ? (
                            <Box
                              component="code"
                              sx={{
                                backgroundColor:
                                  theme === "dark" ? "#2d2d2d" : "#f5f5f5",
                                color: theme === "dark" ? "#f8f8f2" : "#333",
                                fontFamily: "monospace",
                                fontSize: "0.875rem",
                                borderRadius: "4px",
                                px: "0.4em",
                                py: "0.2em",
                              }}
                              {...props}
                            >
                              {children}
                            </Box>
                          ) : (
                            <Box
                              component="pre"
                              sx={{
                                backgroundColor:
                                  theme === "dark" ? "#2d2d2d" : "#f5f5f5",
                                color: theme === "dark" ? "#f8f8f2" : "#333",
                                fontFamily: "monospace",
                                fontSize: "0.9rem",
                                borderRadius: "8px",
                                overflowX: "auto",
                                p: "1rem",
                                mb: "1rem",
                              }}
                              {...props}
                            >
                              <code className={className}>{children}</code>
                            </Box>
                          );
                        },
                        p: ({ node, ...props }) => (
                          <Typography
                            sx={{
                              font: "inherit",
                              color: theme === "dark" ? "white" : "black",
                            }}
                            {...props}
                          />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul
                            style={{
                              color: theme === "dark" ? "white" : "black",
                              font: "inherit",
                            }}
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            style={{
                              color: theme === "dark" ? "white" : "black",
                              font: "inherit",
                            }}
                            {...props}
                          />
                        ),
                        a: ({ node, ...props }) => (
                          <MuiLink
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: "#f57c00",
                              textDecoration: "underline",
                              "&:hover": {
                                color: "#1976d2",
                                cursor: "pointer",
                              },
                            }}
                          />
                        ),
                        table: ({ node, children, ...props }) => (
                          <div
                            style={{
                              overflowX: "auto",
                              width: "100%",
                              marginBottom: "1rem",
                            }}
                          >
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                border:
                                  "1px solid " +
                                  (theme === "dark" ? "white" : "black"),
                              }}
                              {...props}
                            >
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ node, children, ...props }) => (
                          <thead {...props}>{children}</thead>
                        ),
                        tbody: ({ node, children, ...props }) => (
                          <tbody {...props}>{children}</tbody>
                        ),
                        th: ({ node, children, ...props }) => (
                          <th
                            style={{
                              border:
                                "1px solid " +
                                (theme === "dark" ? "white" : "black"),
                              padding: "0.5rem",
                              backgroundColor:
                                theme === "dark" ? "#333" : "#f5f5f5",
                              textAlign: "left",
                              fontWeight: "bold",
                              color: theme === "dark" ? "white" : "black",
                            }}
                            {...props}
                          >
                            {children}
                          </th>
                        ),
                        td: ({ node, children, ...props }) => (
                          <td
                            style={{
                              border:
                                "1px solid " +
                                (theme === "dark" ? "white" : "black"),
                              padding: "0.5rem",
                              textAlign: "left",
                              color: theme === "dark" ? "white" : "black",
                            }}
                            {...props}
                          >
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {keyIdeas}
                    </ReactMarkdown>
                  </Box>
                </Box>
              </Box>
            )}

            {discussionPoints && (
              <Box ref={discussionPointsRef} sx={{ marginTop: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    font: "inherit",
                    fontWeight: "bold",
                    fontSize: "20px",
                    mb: 2,
                    color: theme === "dark" ? "white" : "black",
                  }}
                >
                  Discussion Points
                </Typography>
                <Box
                  sx={{
                    border: "1px solid #f57c00",
                    padding: 2,
                    paddingTop: 1,
                    borderRadius: "12px",
                    position: "relative",
                  }}
                >
                  <Button
                    onClick={() => handleCopyToClipboard(discussionPoints)}
                    sx={{
                      bgcolor: "#f57c00",
                      color: "white",
                      font: "inherit",
                      borderRadius: "8px",
                      fontSize: "12px",
                      padding: "2px 8px",
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                    }}
                  >
                    Copy
                  </Button>
                  <Box
                    sx={{
                      paddingTop: "24px",
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
                              color: theme === "dark" ? "white" : "black",
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
                              color: theme === "dark" ? "white" : "black",
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
                              color: theme === "dark" ? "white" : "black",
                              fontWeight: "bold",
                            }}
                            {...props}
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <Typography
                            sx={{
                              font: "inherit",
                              color: theme === "dark" ? "white" : "black",
                            }}
                            {...props}
                          />
                        ),
                        code: ({
                          node,
                          inline,
                          className,
                          children,
                          ...props
                        }) => {
                          return inline ? (
                            <Box
                              component="code"
                              sx={{
                                backgroundColor:
                                  theme === "dark" ? "#2d2d2d" : "#f5f5f5",
                                color: theme === "dark" ? "#f8f8f2" : "#333",
                                fontFamily: "monospace",
                                fontSize: "0.875rem",
                                borderRadius: "4px",
                                px: "0.4em",
                                py: "0.2em",
                              }}
                              {...props}
                            >
                              {children}
                            </Box>
                          ) : (
                            <Box
                              component="pre"
                              sx={{
                                backgroundColor:
                                  theme === "dark" ? "#2d2d2d" : "#f5f5f5",
                                color: theme === "dark" ? "#f8f8f2" : "#333",
                                fontFamily: "monospace",
                                fontSize: "0.9rem",
                                borderRadius: "8px",
                                overflowX: "auto",
                                p: "1rem",
                                mb: "1rem",
                              }}
                              {...props}
                            >
                              <code className={className}>{children}</code>
                            </Box>
                          );
                        },
                        ul: ({ node, ...props }) => (
                          <ul
                            style={{
                              color: theme === "dark" ? "white" : "black",
                              font: "inherit",
                            }}
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            style={{
                              color: theme === "dark" ? "white" : "black",
                              font: "inherit",
                            }}
                            {...props}
                          />
                        ),
                        table: ({ node, children, ...props }) => (
                          <div
                            style={{
                              overflowX: "auto",
                              width: "100%",
                              marginBottom: "1rem",
                            }}
                          >
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                border:
                                  "1px solid " +
                                  (theme === "dark" ? "white" : "black"),
                              }}
                              {...props}
                            >
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ node, children, ...props }) => (
                          <thead {...props}>{children}</thead>
                        ),
                        tbody: ({ node, children, ...props }) => (
                          <tbody {...props}>{children}</tbody>
                        ),
                        th: ({ node, children, ...props }) => (
                          <th
                            style={{
                              border:
                                "1px solid " +
                                (theme === "dark" ? "white" : "black"),
                              padding: "0.5rem",
                              backgroundColor:
                                theme === "dark" ? "#333" : "#f5f5f5",
                              textAlign: "left",
                              fontWeight: "bold",
                              color: theme === "dark" ? "white" : "black",
                            }}
                            {...props}
                          >
                            {children}
                          </th>
                        ),
                        td: ({ node, children, ...props }) => (
                          <td
                            style={{
                              border:
                                "1px solid " +
                                (theme === "dark" ? "white" : "black"),
                              padding: "0.5rem",
                              textAlign: "left",
                              color: theme === "dark" ? "white" : "black",
                            }}
                            {...props}
                          >
                            {children}
                          </td>
                        ),
                        a: ({ node, ...props }) => (
                          <MuiLink
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: "#f57c00",
                              textDecoration: "underline",
                              "&:hover": {
                                color: "#1976d2",
                                cursor: "pointer",
                              },
                            }}
                          />
                        ),
                      }}
                    >
                      {discussionPoints}
                    </ReactMarkdown>
                  </Box>
                </Box>
              </Box>
            )}

            {bulletSummary && (
              <Box ref={bulletSummaryRef} sx={{ marginTop: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    font: "inherit",
                    fontWeight: "bold",
                    fontSize: "20px",
                    mb: 2,
                    color: theme === "dark" ? "white" : "black",
                  }}
                >
                  Bullet-Point Summary
                </Typography>
                <Box
                  sx={{
                    border: "1px solid #f57c00",
                    padding: 2,
                    paddingTop: 1,
                    borderRadius: "12px",
                    position: "relative",
                  }}
                >
                  <Button
                    onClick={() => handleCopyToClipboard(bulletSummary)}
                    sx={{
                      bgcolor: "#f57c00",
                      color: "white",
                      font: "inherit",
                      borderRadius: "8px",
                      fontSize: "12px",
                      padding: "2px 8px",
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                    }}
                  >
                    Copy
                  </Button>
                  <Box
                    sx={{
                      paddingTop: "24px",
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
                              color: theme === "dark" ? "white" : "black",
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
                              color: theme === "dark" ? "white" : "black",
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
                              color: theme === "dark" ? "white" : "black",
                              fontWeight: "bold",
                            }}
                            {...props}
                          />
                        ),
                        code: ({
                          node,
                          inline,
                          className,
                          children,
                          ...props
                        }) => {
                          return inline ? (
                            <Box
                              component="code"
                              sx={{
                                backgroundColor:
                                  theme === "dark" ? "#2d2d2d" : "#f5f5f5",
                                color: theme === "dark" ? "#f8f8f2" : "#333",
                                fontFamily: "monospace",
                                fontSize: "0.875rem",
                                borderRadius: "4px",
                                px: "0.4em",
                                py: "0.2em",
                              }}
                              {...props}
                            >
                              {children}
                            </Box>
                          ) : (
                            <Box
                              component="pre"
                              sx={{
                                backgroundColor:
                                  theme === "dark" ? "#2d2d2d" : "#f5f5f5",
                                color: theme === "dark" ? "#f8f8f2" : "#333",
                                fontFamily: "monospace",
                                fontSize: "0.9rem",
                                borderRadius: "8px",
                                overflowX: "auto",
                                p: "1rem",
                                mb: "1rem",
                              }}
                              {...props}
                            >
                              <code className={className}>{children}</code>
                            </Box>
                          );
                        },
                        p: ({ node, ...props }) => (
                          <Typography
                            sx={{
                              font: "inherit",
                              color: theme === "dark" ? "white" : "black",
                            }}
                            {...props}
                          />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul
                            style={{
                              color: theme === "dark" ? "white" : "black",
                              font: "inherit",
                            }}
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            style={{
                              color: theme === "dark" ? "white" : "black",
                              font: "inherit",
                            }}
                            {...props}
                          />
                        ),
                        table: ({ node, children, ...props }) => (
                          <div
                            style={{
                              overflowX: "auto",
                              width: "100%",
                              marginBottom: "1rem",
                            }}
                          >
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                border:
                                  "1px solid " +
                                  (theme === "dark" ? "white" : "black"),
                              }}
                              {...props}
                            >
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ node, children, ...props }) => (
                          <thead {...props}>{children}</thead>
                        ),
                        tbody: ({ node, children, ...props }) => (
                          <tbody {...props}>{children}</tbody>
                        ),
                        th: ({ node, children, ...props }) => (
                          <th
                            style={{
                              border:
                                "1px solid " +
                                (theme === "dark" ? "white" : "black"),
                              padding: "0.5rem",
                              backgroundColor:
                                theme === "dark" ? "#333" : "#f5f5f5",
                              textAlign: "left",
                              fontWeight: "bold",
                              color: theme === "dark" ? "white" : "black",
                            }}
                            {...props}
                          >
                            {children}
                          </th>
                        ),
                        td: ({ node, children, ...props }) => (
                          <td
                            style={{
                              border:
                                "1px solid " +
                                (theme === "dark" ? "white" : "black"),
                              padding: "0.5rem",
                              textAlign: "left",
                              color: theme === "dark" ? "white" : "black",
                            }}
                            {...props}
                          >
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {bulletSummary}
                    </ReactMarkdown>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Display AI Response */}
            {audioResponse && (
              <Box ref={audioRef} sx={{ marginTop: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    font: "inherit",
                    fontWeight: "bold",
                    fontSize: "20px",
                    mb: 2,
                    color: theme === "dark" ? "white" : "black",
                  }}
                >
                  Voice Chat Response
                </Typography>
                <Box
                  sx={{
                    border: "1px solid #f57c00",
                    padding: 2,
                    paddingTop: 4,
                    borderRadius: "12px",
                    position: "relative",
                    color: theme === "dark" ? "white" : "black",
                  }}
                >
                  <Button
                    onClick={() => handleCopyToClipboard(audioResponse)}
                    sx={{
                      bgcolor: "#f57c00",
                      color: "white",
                      font: "inherit",
                      borderRadius: "8px",
                      fontSize: "12px",
                      padding: "2px 8px",
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                    }}
                  >
                    Copy
                  </Button>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <Typography
                          variant="h4"
                          sx={{
                            font: "inherit",
                            color: theme === "dark" ? "white" : "black",
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
                            color: theme === "dark" ? "white" : "black",
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
                            color: theme === "dark" ? "white" : "black",
                            fontWeight: "bold",
                          }}
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <Typography
                          sx={{
                            font: "inherit",
                            color: theme === "dark" ? "white" : "black",
                          }}
                          {...props}
                        />
                      ),
                      code: ({
                        node,
                        inline,
                        className,
                        children,
                        ...props
                      }) => {
                        return inline ? (
                          <Box
                            component="code"
                            sx={{
                              backgroundColor:
                                theme === "dark" ? "#2d2d2d" : "#f5f5f5",
                              color: theme === "dark" ? "#f8f8f2" : "#333",
                              fontFamily: "monospace",
                              fontSize: "0.875rem",
                              borderRadius: "4px",
                              px: "0.4em",
                              py: "0.2em",
                            }}
                            {...props}
                          >
                            {children}
                          </Box>
                        ) : (
                          <Box
                            component="pre"
                            sx={{
                              backgroundColor:
                                theme === "dark" ? "#2d2d2d" : "#f5f5f5",
                              color: theme === "dark" ? "#f8f8f2" : "#333",
                              fontFamily: "monospace",
                              fontSize: "0.9rem",
                              borderRadius: "8px",
                              overflowX: "auto",
                              p: "1rem",
                              mb: "1rem",
                            }}
                            {...props}
                          >
                            <code className={className}>{children}</code>
                          </Box>
                        );
                      },
                      ul: ({ node, ...props }) => (
                        <ul
                          style={{
                            color: theme === "dark" ? "white" : "black",
                            font: "inherit",
                          }}
                          {...props}
                        />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol
                          style={{
                            color: theme === "dark" ? "white" : "black",
                            font: "inherit",
                          }}
                          {...props}
                        />
                      ),
                      a: ({ node, ...props }) => (
                        <MuiLink
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: "#f57c00",
                            textDecoration: "underline",
                            "&:hover": {
                              color: "#1976d2",
                              cursor: "pointer",
                            },
                          }}
                        />
                      ),
                      table: ({ node, children, ...props }) => (
                        <div
                          style={{
                            overflowX: "auto",
                            width: "100%",
                            marginBottom: "1rem",
                          }}
                        >
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                              border:
                                "1px solid " +
                                (theme === "dark" ? "white" : "black"),
                            }}
                            {...props}
                          >
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ node, children, ...props }) => (
                        <thead {...props}>{children}</thead>
                      ),
                      tbody: ({ node, children, ...props }) => (
                        <tbody {...props}>{children}</tbody>
                      ),
                      th: ({ node, children, ...props }) => (
                        <th
                          style={{
                            border:
                              "1px solid " +
                              (theme === "dark" ? "white" : "black"),
                            padding: "0.5rem",
                            backgroundColor:
                              theme === "dark" ? "#333" : "#f5f5f5",
                            textAlign: "left",
                            fontWeight: "bold",
                            color: theme === "dark" ? "white" : "black",
                          }}
                          {...props}
                        >
                          {children}
                        </th>
                      ),
                      td: ({ node, children, ...props }) => (
                        <td
                          style={{
                            border:
                              "1px solid " +
                              (theme === "dark" ? "white" : "black"),
                            padding: "0.5rem",
                            textAlign: "left",
                            color: theme === "dark" ? "white" : "black",
                          }}
                          {...props}
                        >
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {audioResponse}
                  </ReactMarkdown>
                </Box>
              </Box>
            )}

            {languageModalOpen && (
              <Box
                sx={{
                  position: "fixed",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  bgcolor: theme === "dark" ? "#222" : "#fff",
                  color: theme === "dark" ? "#fff" : "#000",
                  borderRadius: "12px",
                  padding: 4,
                  boxShadow: "0 0 10px rgba(0, 0, 0, 0.4)",
                  zIndex: 1000,
                  maxHeight: "80vh",
                  width: "80vw",
                  maxWidth: { xs: "80vw", sm: "600px" },
                  overflowY: "auto",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    font: "inherit",
                    textAlign: "center",
                    fontSize: "22px",
                    fontWeight: "bold",
                    color: theme === "dark" ? "white" : "black",
                  }}
                >
                  Select a Language
                </Typography>
                <IconButton
                  onClick={() => setLanguageModalOpen(false)}
                  sx={{ position: "absolute", top: 8, right: 8 }}
                >
                  <CloseIcon
                    sx={{
                      color: theme === "dark" ? "white" : "black",
                      "&:hover": { color: "#f57c00" },
                    }}
                  />
                </IconButton>
                <Box
                  sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(150px, 1fr))",
                  }}
                >
                  {languages.map((lang) => (
                    <Button
                      key={lang}
                      onClick={() => handleLanguageSelection(lang)}
                      sx={{
                        bgcolor: "#f57c00",
                        color: "white",
                        font: "inherit",
                        borderRadius: "12px",
                        fontSize: "14px",
                        marginBottom: 2,
                      }}
                      disabled={loadingLanguage && selectedLanguage === lang}
                    >
                      {loadingLanguage && selectedLanguage === lang ? (
                        <CircularProgress size={20} sx={{ color: "white" }} />
                      ) : (
                        lang
                      )}
                    </Button>
                  ))}
                </Box>
                <Button
                  onClick={() => setLanguageModalOpen(false)}
                  sx={{
                    mt: 2,
                    display: "block",
                    marginLeft: "auto",
                    bgcolor: "gray",
                    color: "white",
                    font: "inherit",
                    borderRadius: "12px",
                  }}
                  disabled={loadingLanguage}
                >
                  Close
                </Button>
              </Box>
            )}

            {languageSummary && (
              <Box ref={languageRef} sx={{ marginTop: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    font: "inherit",
                    fontWeight: "bold",
                    fontSize: "20px",
                    mb: 2,
                    color: theme === "dark" ? "white" : "black",
                  }}
                >
                  Summary in {selectedLanguage}
                </Typography>
                <Box
                  sx={{
                    border: "1px solid #f57c00",
                    padding: 2,
                    paddingTop: 1,
                    borderRadius: "12px",
                    position: "relative",
                  }}
                >
                  <Button
                    onClick={() => handleCopyToClipboard(languageSummary)}
                    sx={{
                      bgcolor: "#f57c00",
                      color: "white",
                      font: "inherit",
                      borderRadius: "8px",
                      fontSize: "12px",
                      padding: "2px 8px",
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                    }}
                  >
                    Copy
                  </Button>
                  <Box sx={{ paddingTop: "24px" }}>
                    {" "}
                    {/* Padding to prevent overlap */}
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        h1: ({ node, ...props }) => (
                          <Typography
                            variant="h4"
                            sx={{
                              font: "inherit",
                              color: theme === "dark" ? "white" : "black",
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
                              color: theme === "dark" ? "white" : "black",
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
                              color: theme === "dark" ? "white" : "black",
                              fontWeight: "bold",
                            }}
                            {...props}
                          />
                        ),
                        code: ({
                          node,
                          inline,
                          className,
                          children,
                          ...props
                        }) => {
                          return inline ? (
                            <Box
                              component="code"
                              sx={{
                                backgroundColor:
                                  theme === "dark" ? "#2d2d2d" : "#f5f5f5",
                                color: theme === "dark" ? "#f8f8f2" : "#333",
                                fontFamily: "monospace",
                                fontSize: "0.875rem",
                                borderRadius: "4px",
                                px: "0.4em",
                                py: "0.2em",
                              }}
                              {...props}
                            >
                              {children}
                            </Box>
                          ) : (
                            <Box
                              component="pre"
                              sx={{
                                backgroundColor:
                                  theme === "dark" ? "#2d2d2d" : "#f5f5f5",
                                color: theme === "dark" ? "#f8f8f2" : "#333",
                                fontFamily: "monospace",
                                fontSize: "0.9rem",
                                borderRadius: "8px",
                                overflowX: "auto",
                                p: "1rem",
                                mb: "1rem",
                              }}
                              {...props}
                            >
                              <code className={className}>{children}</code>
                            </Box>
                          );
                        },
                        p: ({ node, ...props }) => (
                          <Typography
                            sx={{
                              font: "inherit",
                              color: theme === "dark" ? "white" : "black",
                            }}
                            {...props}
                          />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul
                            style={{
                              color: theme === "dark" ? "white" : "black",
                              font: "inherit",
                            }}
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            style={{
                              color: theme === "dark" ? "white" : "black",
                              font: "inherit",
                            }}
                            {...props}
                          />
                        ),
                        table: ({ node, children, ...props }) => (
                          <div
                            style={{
                              overflowX: "auto",
                              width: "100%",
                              marginBottom: "1rem",
                            }}
                          >
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                border:
                                  "1px solid " +
                                  (theme === "dark" ? "white" : "black"),
                              }}
                              {...props}
                            >
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ node, children, ...props }) => (
                          <thead {...props}>{children}</thead>
                        ),
                        tbody: ({ node, children, ...props }) => (
                          <tbody {...props}>{children}</tbody>
                        ),
                        th: ({ node, children, ...props }) => (
                          <th
                            style={{
                              border:
                                "1px solid " +
                                (theme === "dark" ? "white" : "black"),
                              padding: "0.5rem",
                              backgroundColor:
                                theme === "dark" ? "#333" : "#f5f5f5",
                              textAlign: "left",
                              fontWeight: "bold",
                              color: theme === "dark" ? "white" : "black",
                            }}
                            {...props}
                          >
                            {children}
                          </th>
                        ),
                        td: ({ node, children, ...props }) => (
                          <td
                            style={{
                              border:
                                "1px solid " +
                                (theme === "dark" ? "white" : "black"),
                              padding: "0.5rem",
                              textAlign: "left",
                              color: theme === "dark" ? "white" : "black",
                            }}
                            {...props}
                          >
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {languageSummary}
                    </ReactMarkdown>
                  </Box>
                </Box>
              </Box>
            )}

            {rewrittenContent && (
              <Box ref={rewriteRef} sx={{ marginTop: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    font: "inherit",
                    fontWeight: "bold",
                    fontSize: "20px",
                    mb: 2,
                    color: theme === "dark" ? "white" : "black",
                  }}
                >
                  Rewritten Content
                </Typography>
                <Box
                  sx={{
                    border: "1px solid #f57c00",
                    padding: 2,
                    paddingTop: 4,
                    borderRadius: "12px",
                    position: "relative",
                  }}
                >
                  <Button
                    onClick={() => handleCopyToClipboard(rewrittenContent)}
                    sx={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      bgcolor: "#f57c00",
                      color: "white",
                      font: "inherit",
                      borderRadius: "8px",
                      fontSize: "12px",
                      padding: "2px 8px",
                    }}
                  >
                    Copy
                  </Button>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <Typography
                          variant="h4"
                          sx={{
                            font: "inherit",
                            color: theme === "dark" ? "white" : "black",
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
                            color: theme === "dark" ? "white" : "black",
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
                            color: theme === "dark" ? "white" : "black",
                            fontWeight: "bold",
                          }}
                          {...props}
                        />
                      ),
                      code: ({
                        node,
                        inline,
                        className,
                        children,
                        ...props
                      }) => {
                        return inline ? (
                          <Box
                            component="code"
                            sx={{
                              backgroundColor:
                                theme === "dark" ? "#2d2d2d" : "#f5f5f5",
                              color: theme === "dark" ? "#f8f8f2" : "#333",
                              fontFamily: "monospace",
                              fontSize: "0.875rem",
                              borderRadius: "4px",
                              px: "0.4em",
                              py: "0.2em",
                            }}
                            {...props}
                          >
                            {children}
                          </Box>
                        ) : (
                          <Box
                            component="pre"
                            sx={{
                              backgroundColor:
                                theme === "dark" ? "#2d2d2d" : "#f5f5f5",
                              color: theme === "dark" ? "#f8f8f2" : "#333",
                              fontFamily: "monospace",
                              fontSize: "0.9rem",
                              borderRadius: "8px",
                              overflowX: "auto",
                              p: "1rem",
                              mb: "1rem",
                            }}
                            {...props}
                          >
                            <code className={className}>{children}</code>
                          </Box>
                        );
                      },
                      p: ({ node, ...props }) => (
                        <Typography
                          sx={{
                            font: "inherit",
                            color: theme === "dark" ? "white" : "black",
                          }}
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul
                          style={{
                            color: theme === "dark" ? "white" : "black",
                            font: "inherit",
                          }}
                          {...props}
                        />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol
                          style={{
                            color: theme === "dark" ? "white" : "black",
                            font: "inherit",
                          }}
                          {...props}
                        />
                      ),
                      table: ({ node, children, ...props }) => (
                        <div
                          style={{
                            overflowX: "auto",
                            width: "100%",
                            marginBottom: "1rem",
                          }}
                        >
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                              border:
                                "1px solid " +
                                (theme === "dark" ? "white" : "black"),
                            }}
                            {...props}
                          >
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ node, children, ...props }) => (
                        <thead {...props}>{children}</thead>
                      ),
                      tbody: ({ node, children, ...props }) => (
                        <tbody {...props}>{children}</tbody>
                      ),
                      th: ({ node, children, ...props }) => (
                        <th
                          style={{
                            border:
                              "1px solid " +
                              (theme === "dark" ? "white" : "black"),
                            padding: "0.5rem",
                            backgroundColor:
                              theme === "dark" ? "#333" : "#f5f5f5",
                            textAlign: "left",
                            fontWeight: "bold",
                            color: theme === "dark" ? "white" : "black",
                          }}
                          {...props}
                        >
                          {children}
                        </th>
                      ),
                      td: ({ node, children, ...props }) => (
                        <td
                          style={{
                            border:
                              "1px solid " +
                              (theme === "dark" ? "white" : "black"),
                            padding: "0.5rem",
                            textAlign: "left",
                            color: theme === "dark" ? "white" : "black",
                          }}
                          {...props}
                        >
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {rewrittenContent}
                  </ReactMarkdown>
                </Box>
              </Box>
            )}

            {refinedSummary && (
              <Box sx={{ marginTop: 2 }} ref={refinedRef}>
                <Typography
                  variant="h6"
                  sx={{
                    font: "inherit",
                    fontWeight: "bold",
                    fontSize: "20px",
                    mb: 2,
                    color: theme === "dark" ? "white" : "black",
                  }}
                >
                  Refined Summary
                </Typography>
                <Box
                  sx={{
                    border: "1px solid #f57c00",
                    padding: 2,
                    paddingTop: 1,
                    borderRadius: "12px",
                    position: "relative",
                  }}
                >
                  <Button
                    onClick={() => handleCopyToClipboard(refinedSummary)}
                    sx={{
                      bgcolor: "#f57c00",
                      color: "white",
                      font: "inherit",
                      borderRadius: "8px",
                      fontSize: "12px",
                      padding: "2px 8px",
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                    }}
                  >
                    Copy
                  </Button>
                  <Box
                    sx={{
                      marginTop: 3,
                      padding: 0,
                      borderRadius: "12px",
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
                              color: theme === "dark" ? "white" : "black",
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
                              color: theme === "dark" ? "white" : "black",
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
                              color: theme === "dark" ? "white" : "black",
                              fontWeight: "bold",
                            }}
                            {...props}
                          />
                        ),
                        code: ({
                          node,
                          inline,
                          className,
                          children,
                          ...props
                        }) => {
                          return inline ? (
                            <Box
                              component="code"
                              sx={{
                                backgroundColor:
                                  theme === "dark" ? "#2d2d2d" : "#f5f5f5",
                                color: theme === "dark" ? "#f8f8f2" : "#333",
                                fontFamily: "monospace",
                                fontSize: "0.875rem",
                                borderRadius: "4px",
                                px: "0.4em",
                                py: "0.2em",
                              }}
                              {...props}
                            >
                              {children}
                            </Box>
                          ) : (
                            <Box
                              component="pre"
                              sx={{
                                backgroundColor:
                                  theme === "dark" ? "#2d2d2d" : "#f5f5f5",
                                color: theme === "dark" ? "#f8f8f2" : "#333",
                                fontFamily: "monospace",
                                fontSize: "0.9rem",
                                borderRadius: "8px",
                                overflowX: "auto",
                                p: "1rem",
                                mb: "1rem",
                              }}
                              {...props}
                            >
                              <code className={className}>{children}</code>
                            </Box>
                          );
                        },
                        p: ({ node, ...props }) => (
                          <Typography
                            sx={{
                              font: "inherit",
                              color: theme === "dark" ? "white" : "black",
                            }}
                            {...props}
                          />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul
                            style={{
                              color: theme === "dark" ? "white" : "black",
                              font: "inherit",
                            }}
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            style={{
                              color: theme === "dark" ? "white" : "black",
                              font: "inherit",
                            }}
                            {...props}
                          />
                        ),
                        a: ({ node, ...props }) => (
                          <MuiLink
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: "#f57c00",
                              textDecoration: "underline",
                              "&:hover": {
                                color: "#1976d2",
                                cursor: "pointer",
                              },
                            }}
                          />
                        ),
                        table: ({ node, children, ...props }) => (
                          <div
                            style={{
                              overflowX: "auto",
                              width: "100%",
                              marginBottom: "1rem",
                            }}
                          >
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                border:
                                  "1px solid " +
                                  (theme === "dark" ? "white" : "black"),
                              }}
                              {...props}
                            >
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({ node, children, ...props }) => (
                          <thead {...props}>{children}</thead>
                        ),
                        tbody: ({ node, children, ...props }) => (
                          <tbody {...props}>{children}</tbody>
                        ),
                        th: ({ node, children, ...props }) => (
                          <th
                            style={{
                              border:
                                "1px solid " +
                                (theme === "dark" ? "white" : "black"),
                              padding: "0.5rem",
                              backgroundColor:
                                theme === "dark" ? "#333" : "#f5f5f5",
                              textAlign: "left",
                              fontWeight: "bold",
                              color: theme === "dark" ? "white" : "black",
                            }}
                            {...props}
                          >
                            {children}
                          </th>
                        ),
                        td: ({ node, children, ...props }) => (
                          <td
                            style={{
                              border:
                                "1px solid " +
                                (theme === "dark" ? "white" : "black"),
                              padding: "0.5rem",
                              textAlign: "left",
                              color: theme === "dark" ? "white" : "black",
                            }}
                            {...props}
                          >
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {refinedSummary}
                    </ReactMarkdown>
                  </Box>
                </Box>
              </Box>
            )}

            {recommendations && (
              <Box ref={recommendationsRef} sx={{ marginTop: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    font: "inherit",
                    fontWeight: "bold",
                    fontSize: "20px",
                    mb: 2,
                    color: theme === "dark" ? "white" : "black",
                  }}
                >
                  Actionable Recommendations
                </Typography>
                <Box
                  sx={{
                    border: "1px solid #f57c00",
                    padding: 2,
                    paddingTop: 4,
                    borderRadius: "12px",
                    position: "relative",
                  }}
                >
                  <Button
                    onClick={() => handleCopyToClipboard(recommendations)}
                    sx={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      bgcolor: "#f57c00",
                      color: "white",
                      font: "inherit",
                      borderRadius: "8px",
                      fontSize: "12px",
                      padding: "2px 8px",
                    }}
                  >
                    Copy
                  </Button>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <Typography
                          variant="h4"
                          sx={{
                            font: "inherit",
                            color: theme === "dark" ? "white" : "black",
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
                            color: theme === "dark" ? "white" : "black",
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
                            color: theme === "dark" ? "white" : "black",
                            fontWeight: "bold",
                          }}
                          {...props}
                        />
                      ),
                      code: ({
                        node,
                        inline,
                        className,
                        children,
                        ...props
                      }) => {
                        return inline ? (
                          <Box
                            component="code"
                            sx={{
                              backgroundColor:
                                theme === "dark" ? "#2d2d2d" : "#f5f5f5",
                              color: theme === "dark" ? "#f8f8f2" : "#333",
                              fontFamily: "monospace",
                              fontSize: "0.875rem",
                              borderRadius: "4px",
                              px: "0.4em",
                              py: "0.2em",
                            }}
                            {...props}
                          >
                            {children}
                          </Box>
                        ) : (
                          <Box
                            component="pre"
                            sx={{
                              backgroundColor:
                                theme === "dark" ? "#2d2d2d" : "#f5f5f5",
                              color: theme === "dark" ? "#f8f8f2" : "#333",
                              fontFamily: "monospace",
                              fontSize: "0.9rem",
                              borderRadius: "8px",
                              overflowX: "auto",
                              p: "1rem",
                              mb: "1rem",
                            }}
                            {...props}
                          >
                            <code className={className}>{children}</code>
                          </Box>
                        );
                      },
                      p: ({ node, ...props }) => (
                        <Typography
                          sx={{
                            font: "inherit",
                            color: theme === "dark" ? "white" : "black",
                          }}
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul
                          style={{
                            color: theme === "dark" ? "white" : "black",
                            font: "inherit",
                          }}
                          {...props}
                        />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol
                          style={{
                            color: theme === "dark" ? "white" : "black",
                            font: "inherit",
                          }}
                          {...props}
                        />
                      ),
                      table: ({ node, children, ...props }) => (
                        <div
                          style={{
                            overflowX: "auto",
                            width: "100%",
                            marginBottom: "1rem",
                          }}
                        >
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                              border:
                                "1px solid " +
                                (theme === "dark" ? "white" : "black"),
                            }}
                            {...props}
                          >
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ node, children, ...props }) => (
                        <thead {...props}>{children}</thead>
                      ),
                      tbody: ({ node, children, ...props }) => (
                        <tbody {...props}>{children}</tbody>
                      ),
                      th: ({ node, children, ...props }) => (
                        <th
                          style={{
                            border:
                              "1px solid " +
                              (theme === "dark" ? "white" : "black"),
                            padding: "0.5rem",
                            backgroundColor:
                              theme === "dark" ? "#333" : "#f5f5f5",
                            textAlign: "left",
                            fontWeight: "bold",
                            color: theme === "dark" ? "white" : "black",
                          }}
                          {...props}
                        >
                          {children}
                        </th>
                      ),
                      td: ({ node, children, ...props }) => (
                        <td
                          style={{
                            border:
                              "1px solid " +
                              (theme === "dark" ? "white" : "black"),
                            padding: "0.5rem",
                            textAlign: "left",
                            color: theme === "dark" ? "white" : "black",
                          }}
                          {...props}
                        >
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {recommendations}
                  </ReactMarkdown>
                </Box>
              </Box>
            )}
          </Box>
        </>
      )}

      {showRewriteModal && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            bgcolor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: { xs: "90%", sm: "400px" },
              bgcolor: theme === "dark" ? "#222" : "#fff",
              padding: 4,
              borderRadius: 4,
            }}
          >
            {/* Close Button */}
            <IconButton
              onClick={() => setShowRewriteModal(false)}
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
                color: theme === "dark" ? "white" : "black",
                mb: 2,
                font: "inherit",
                fontSize: "22px",
                fontWeight: "bold",
              }}
            >
              Enter Desired Style
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              label="Style (e.g., formal, casual)..."
              value={desiredStyle}
              onChange={(e) => setDesiredStyle(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleRewriteContent()}
              sx={{ mb: 4 }}
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
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                onClick={() => setShowRewriteModal(false)}
                sx={{ font: "inherit", color: "black", bgcolor: "lightgrey" }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRewriteContent}
                disabled={loadingRewrite}
                sx={{
                  font: "inherit",
                  bgcolor: "#f57c00",
                  color: "white",
                }}
              >
                {loadingRewrite ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Rewrite"
                )}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      <Modal open={showRefineModal} onClose={() => setShowRefineModal(false)}>
        <Fade in={showRefineModal}>
          <Box
            sx={{
              bgcolor: theme === "dark" ? "#222" : "white",
              color: theme === "dark" ? "white" : "black",
              borderRadius: "12px",
              width: "400px",
              maxWidth: "90%",
              p: 3,
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.4)",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {/* Close Button */}
            <IconButton
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                color: theme === "dark" ? "white" : "black",
                "&:hover": { color: "#f57c00" },
              }}
              onClick={() => setShowRefineModal(false)}
            >
              <CloseIcon />
            </IconButton>

            <Typography
              variant="h6"
              sx={{
                font: "inherit",
                fontSize: "22px",
                fontWeight: "bold",
                color: theme === "dark" ? "white" : "black",
              }}
            >
              Refine Summary
            </Typography>

            <Typography
              variant="body1"
              sx={{
                font: "inherit",
                textAlign: "center",
                fontSize: "14px",
                color: theme === "dark" ? "white" : "black",
              }}
            >
              Specify how you'd like the summary refined.
            </Typography>

            <TextField
              label="Refinement Instructions..."
              value={refinementInstructions}
              onChange={(e) => setRefinementInstructions(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleRefineSummary()}
              fullWidth
              rows={2}
              sx={{ mb: 2 }}
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
                  // Remove padding and transform to use default label behavior
                },
              }}
            />

            <Button
              variant="contained"
              onClick={handleRefineSummary}
              disabled={loadingRefinement || !refinementInstructions.trim()}
              sx={{
                width: "100%",
                bgcolor: "#f57c00",
                "&:hover": { bgcolor: "#ef6c00" },
                font: "inherit",
              }}
            >
              {loadingRefinement ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Refine Summary"
              )}
            </Button>
          </Box>
        </Fade>
      </Modal>

      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        PaperProps={{
          style: {
            backgroundColor: theme === "dark" ? "#222" : "#fff",
            color: theme === "dark" ? "#fff" : "#000",
            borderRadius: "8px",
          },
        }}
      >
        <DialogTitle
          id="confirm-dialog-title"
          sx={{
            backgroundColor: theme === "dark" ? "#222" : "#f5f5f5",
            color: theme === "dark" ? "#fff" : "#000",
            font: "inherit",
            fontSize: "24px",
            fontWeight: "bold",
          }}
        >
          {"Confirm Leaving Page"}
        </DialogTitle>
        <DialogContent
          sx={{
            backgroundColor: theme === "dark" ? "#222" : "#f5f5f5",
            color: theme === "dark" ? "#ddd" : "#000",
          }}
        >
          <DialogContentText
            id="confirm-dialog-description"
            sx={{
              color: theme === "dark" ? "#ddd" : "#000",
              font: "inherit",
            }}
          >
            Are you sure you want to upload a new document? This will reload the
            page and any unsaved changes will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            backgroundColor: theme === "dark" ? "#222" : "#f5f5f5",
          }}
        >
          <Button
            onClick={handleCloseConfirmDialog}
            color="primary"
            sx={{
              color: theme === "dark" ? "#fff" : "#000",
              font: "inherit",
              "&:hover": {
                backgroundColor: theme === "dark" ? "#333" : "#dcdcdc",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmReload}
            color="secondary"
            autoFocus
            sx={{
              color: theme === "dark" ? "#f57c00" : "red",
              font: "inherit",
              "&:hover": {
                backgroundColor: theme === "dark" ? "#333" : "#dcdcdc",
              },
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        message="Copied to clipboard!"
        autoHideDuration={2000}
        ContentProps={{
          sx: {
            backgroundColor: "#f57c00",
            color: "white",
            font: "inherit",
            fontSize: "16px",
          },
        }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleSnackbarClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />

      {ErrorToastComponent}
    </Box>
  );
};

export default Home;
