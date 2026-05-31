import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  Paper,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MuiLink from "@mui/material/Link";
import ReactMarkdown from "react-markdown";
import DOMPurify from "dompurify";
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
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import TranslateIcon from "@mui/icons-material/Translate";
import TuneIcon from "@mui/icons-material/Tune";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SearchIcon from "@mui/icons-material/Search";
import MicRecorder from "mic-recorder-to-mp3";

const Home = ({ theme }) => {
  const { showErrorToast, ErrorToastComponent } = useErrorToast();
  const keyIdeasRef = useRef(null);
  const discussionPointsRef = useRef(null);
  const languageRef = useRef(null);
  const rewriteRef = useRef(null);
  const [summary, setSummary] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [originalHtml, setOriginalHtml] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("");
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
  const [loadingSentiment, setLoadingSentiment] = useState(false);
  // Remembers which document text we already analyzed, so revisiting a cached
  // document (or switching between history docs) doesn't re-run analysis.
  const sentimentTextRef = useRef(null);
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

  // Text highlight feature states
  const [selectedText, setSelectedText] = useState("");
  const [highlightMenuOpen, setHighlightMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0, bottom: 0 });
  const [copySnackOpen, setCopySnackOpen] = useState(false);
  const highlightMenuRef = useRef(null);
  const selectionRangeRef = useRef(null);

  // Resizable split between the Original Document and Summary columns (desktop).
  const splitContainerRef = useRef(null);
  const draggingSplitRef = useRef(false);
  const [leftWidth, setLeftWidth] = useState(32); // percent
  const [draggingSplit, setDraggingSplit] = useState(false);

  // Keep the selection menu fully inside the viewport: clamp left/top after
  // measuring the rendered menu, and flip below the selection if there's no
  // room above. Runs before paint so there's no visible jump.
  useLayoutEffect(() => {
    if (!highlightMenuOpen) return;
    const el = highlightMenuRef.current;
    if (!el) return;
    const margin = 8;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = menuPosition.x - w / 2;
    left = Math.max(margin, Math.min(left, vw - w - margin));

    let top = menuPosition.y - h - 10; // prefer above the selection
    if (top < margin) {
      top = menuPosition.bottom + 10; // not enough room -> below
    }
    top = Math.max(margin, Math.min(top, vh - h - margin));

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;

    // The re-render that opened the menu can collapse the native highlight;
    // restore it (the overlay above is the primary visual, this is a bonus).
    // (synchronously, before paint) so the selection stays visible.
    const sel = window.getSelection();
    if (sel && selectionRangeRef.current && sel.isCollapsed) {
      try {
        sel.removeAllRanges();
        sel.addRange(selectionRangeRef.current);
      } catch (e) {
        /* nodes changed — ignore */
      }
    }
  }, [highlightMenuOpen, menuPosition]);

  // Drag-to-resize the two document columns.
  useEffect(() => {
    const onMove = (e) => {
      if (!draggingSplitRef.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const pad = 32; // root Box padding: 4 => 32px each side
      const inner = rect.width - pad * 2;
      if (inner <= 0) return;
      let pct = ((e.clientX - rect.left - pad) / inner) * 100;
      pct = Math.max(20, Math.min(80, pct));
      setLeftWidth(pct);
    };
    const onUp = () => {
      if (draggingSplitRef.current) {
        draggingSplitRef.current = false;
        setDraggingSplit(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // Dismiss the menu on scroll/resize so the fixed-position menu can't drift
  // away from the text it marks.
  useEffect(() => {
    if (!highlightMenuOpen) return;
    const close = () => {
      setHighlightMenuOpen(false);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [highlightMenuOpen]);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState("");

  // Analytics modal states
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  // Loading snackbar for selected text operations
  const [loadingSnackbarOpen, setLoadingSnackbarOpen] = useState(false);

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

  // Prepend the document title as context so the AI has a stronger signal for
  // summaries, sentiment, key ideas, etc. Only used on payloads that are NOT
  // persisted (so the stored originalText / viewer stay clean).
  const withTitle = (text) =>
    documentTitle ? `Title: "${documentTitle}"\n\n${text}` : text;

  const handleRefineSummary = async () => {
    setLoadingRefinement(true);
    try {
      const response = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/refine-summary",
        {
          summary,
          refinementInstructions: documentTitle
            ? `Document title: "${documentTitle}". ${refinementInstructions}`
            : refinementInstructions,
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
      formData.append("context", withTitle(summary));
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
          documentText: withTitle(originalText),
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
      // Use selected text if available, otherwise use original text
      const textToRewrite = window.tempSelectedText || originalText;

      const response = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/content-rewriting",
        {
          documentText: withTitle(textToRewrite),
          style: desiredStyle,
        },
      );

      setRewrittenContent(response.data.rewrittenContent);
      setShowRewriteModal(false);
      // Clear temp selected text
      window.tempSelectedText = null;
      rewriteRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      showErrorToast(error.message + ". Please try again.");
      console.error("Failed to rewrite content:", error);
    } finally {
      setLoadingRewrite(false);
    }
  };

  // Handle text selection for highlight feature
  const handleTextSelection = () => {
    // Only offer the selection menu on the results view (a document is loaded,
    // live or from history). No summary => not on results => do nothing.
    if (!summary) {
      setHighlightMenuOpen(false);
      return;
    }

    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text.length > 0) {
      setSelectedText(text);
      const range = selection.getRangeAt(0);
      // Remember the exact range so we can re-apply it if a re-render clears it.
      selectionRangeRef.current = range.cloneRange();
      const rect = range.getBoundingClientRect();

      // Viewport coordinates (menu is position: fixed). The layout effect
      // clamps these so the menu never spills off any edge.
      setMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
        bottom: rect.bottom,
      });
      setHighlightMenuOpen(true);
    } else {
      setHighlightMenuOpen(false);
    }
  };

  // Handle summarize selected text
  const handleSummarizeSelected = async () => {
    setHighlightMenuOpen(false);
    setLoadingRefinement(true);
    setLoadingSnackbarOpen(true); // Show loading notification

    try {
      const response = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/upload",
        {
          title: "Selected Text",
          text: selectedText,
        },
      );

      setRefinedSummary(response.data.summary);
      setLoadingSnackbarOpen(false); // Hide loading notification
      refinedRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      setLoadingSnackbarOpen(false); // Hide loading notification
      showErrorToast(error.message + ". Please try again.");
      console.error("Failed to summarize selected text:", error);
    } finally {
      setLoadingRefinement(false);
    }
  };

  // Handle rewrite selected text
  const handleRewriteSelected = () => {
    setHighlightMenuOpen(false);
    setDesiredStyle("");
    setShowRewriteModal(true);
    // Temporarily store selected text for rewriting
    window.tempSelectedText = selectedText;
  };

  // Handle chat with selected text
  const handleChatWithSelected = () => {
    setHighlightMenuOpen(false);
    setChatInitialMessage(selectedText);
    setChatModalOpen(true);
  };

  // Copy the selected text to the clipboard.
  const handleCopySelected = async () => {
    setHighlightMenuOpen(false);
    try {
      await navigator.clipboard.writeText(selectedText);
    } catch (e) {
      // Fallback for older browsers / insecure contexts.
      const ta = document.createElement("textarea");
      ta.value = selectedText;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch (err) {
        /* ignore */
      }
      document.body.removeChild(ta);
    }
    setCopySnackOpen(true);
  };

  // Open a web search for the selected text in a new tab.
  const handleSearchWeb = () => {
    setHighlightMenuOpen(false);
    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(selectedText)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  // Calculate document analytics
  const calculateAnalytics = () => {
    if (!originalText) return null;

    const text = originalText.trim();
    const words = text.split(/\s+/).filter((word) => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const lines = text.split(/\n/).filter((l) => l.trim().length > 0);

    // Average word length
    const avgWordLength =
      words.reduce((sum, word) => sum + word.length, 0) / words.length || 0;

    // Reading time (average 200 words per minute)
    const readingTime = Math.ceil(words.length / 200);
    const speakingTime = Math.ceil(words.length / 150); // Average speaking rate

    // Most common words (excluding common stop words)
    const stopWords = new Set([
      "the",
      "be",
      "to",
      "of",
      "and",
      "a",
      "in",
      "that",
      "have",
      "i",
      "it",
      "for",
      "not",
      "on",
      "with",
      "he",
      "as",
      "you",
      "do",
      "at",
      "this",
      "but",
      "his",
      "by",
      "from",
      "is",
      "was",
      "are",
      "an",
    ]);

    const wordFreq = {};
    const wordLengthDistribution = {
      short: 0,
      medium: 0,
      long: 0,
      veryLong: 0,
    };
    const uniqueWords = new Set();

    words.forEach((word) => {
      const w = word.toLowerCase().replace(/[^\w]/g, "");
      if (w) {
        uniqueWords.add(w);
        if (w.length <= 4) wordLengthDistribution.short++;
        else if (w.length <= 7) wordLengthDistribution.medium++;
        else if (w.length <= 10) wordLengthDistribution.long++;
        else wordLengthDistribution.veryLong++;

        if (!stopWords.has(w) && w.length > 3) {
          wordFreq[w] = (wordFreq[w] || 0) + 1;
        }
      }
    });

    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]) => ({ word, count }));

    // Sentence length distribution
    const sentenceLengths = sentences.map((s) => s.split(/\s+/).length);
    const avgSentenceLength =
      sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length || 0;
    const longestSentence = Math.max(...sentenceLengths, 0);
    const shortestSentence = Math.min(...sentenceLengths, 0);

    // Lexical diversity (unique words / total words)
    const lexicalDiversity = ((uniqueWords.size / words.length) * 100).toFixed(
      1,
    );

    // Punctuation analysis
    const punctuationCounts = {
      periods: (text.match(/\./g) || []).length,
      commas: (text.match(/,/g) || []).length,
      exclamations: (text.match(/!/g) || []).length,
      questions: (text.match(/\?/g) || []).length,
      quotes: (text.match(/["']/g) || []).length,
      semicolons: (text.match(/;/g) || []).length,
    };

    // Syllable estimation (rough estimate based on vowel groups)
    const estimateSyllables = (word) => {
      word = word.toLowerCase();
      if (word.length <= 3) return 1;
      word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
      word = word.replace(/^y/, "");
      const matches = word.match(/[aeiouy]{1,2}/g);
      return matches ? matches.length : 1;
    };

    const totalSyllables = words.reduce(
      (sum, word) => sum + estimateSyllables(word),
      0,
    );
    const avgSyllablesPerWord = (totalSyllables / words.length || 0).toFixed(2);

    // Readability scores
    // Flesch Reading Ease: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
    const fleschScore = (
      206.835 -
      1.015 * (words.length / sentences.length) -
      84.6 * (totalSyllables / words.length)
    ).toFixed(1);

    // Complexity metrics
    const complexWords = words.filter((w) => estimateSyllables(w) >= 3).length;
    const complexityPercentage = ((complexWords / words.length) * 100).toFixed(
      1,
    );

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      lineCount: lines.length,
      characterCount: characters,
      characterCountNoSpaces: charactersNoSpaces,
      avgWordLength: avgWordLength.toFixed(2),
      avgWordsPerSentence: avgSentenceLength.toFixed(2),
      avgSentenceLength: avgSentenceLength.toFixed(1),
      longestSentence,
      shortestSentence,
      readingTime,
      speakingTime,
      topWords,
      uniqueWordCount: uniqueWords.size,
      lexicalDiversity,
      wordLengthDistribution,
      punctuationCounts,
      totalSyllables,
      avgSyllablesPerWord,
      fleschScore,
      complexWords,
      complexityPercentage,
    };
  };

  // Handle open analytics modal
  const handleShowAnalytics = () => {
    const analyticsData = calculateAnalytics();
    setAnalytics(analyticsData);
    setShowAnalyticsModal(true);
  };

  // Animated counter component
  const AnimatedNumber = ({ value, duration = 1500, isDecimal = false }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      if (!showAnalyticsModal) {
        setDisplayValue(0);
        return;
      }

      const targetValue = parseFloat(value);
      const startTime = Date.now();
      const startValue = 0;

      const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = startValue + (targetValue - startValue) * easeOutQuart;

        setDisplayValue(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(targetValue);
        }
      };

      requestAnimationFrame(animate);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, duration, showAnalyticsModal]);

    if (isDecimal) {
      return displayValue.toFixed(
        value.toString().includes(".")
          ? value.toString().split(".")[1].length
          : 0,
      );
    }

    return Math.floor(displayValue).toLocaleString();
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
          documentText: withTitle(originalText),
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

  // Content-addressed cache key: same document text -> same key (cache hit),
  // different text -> different key (recompute). Keeps accuracy correct while
  // avoiding a fresh AI call on every revisit.
  const sentimentCacheKey = (text) => {
    let h = 5381;
    for (let i = 0; i < text.length; i++) {
      h = ((h << 5) + h + text.charCodeAt(i)) | 0;
    }
    return `sentiment:${(h >>> 0).toString(36)}:${text.length}`;
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
        const result = {
          score: response.data.sentimentScore,
          description: response.data.description,
        };
        setSentiment(result);
        try {
          localStorage.setItem(sentimentCacheKey(text), JSON.stringify(result));
        } catch (e) {
          /* localStorage unavailable/full — caching is best-effort */
        }
      } else {
        console.error("Unexpected response format:", response.data);
      }
    } catch (error) {
      showErrorToast(error.message + ". Please try again.");
      console.error("Failed to fetch sentiment:", error);
    } finally {
      setLoadingSentiment(false);
    }
  };

  useEffect(() => {
    if (location.state) {
      const { summary, originalText, originalHtml, title, fileUrl, fileType } =
        location.state;
      setSummary(summary);
      setOriginalText(originalText);
      setOriginalHtml(originalHtml || "");
      setDocumentTitle(title || "");
      setFileUrl(fileUrl || "");
      setFileType(fileType || "");
      if (title) localStorage.setItem("documentTitle", title);
    }
  }, [location.state]);

  useEffect(() => {
    if (!originalText) return;
    // Title is included as context (and in the cache key), so renaming a doc
    // correctly recomputes rather than serving a stale score.
    const input = withTitle(originalText);
    // Only act when the analyzed input actually changes (guards re-renders and
    // history-doc switches from showing a stale or re-fetched score).
    if (sentimentTextRef.current === input) return;
    sentimentTextRef.current = input;

    const cached = localStorage.getItem(sentimentCacheKey(input));
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.score === "number") {
          setSentiment(parsed);
          return; // cache hit — skip the AI call
        }
      } catch (e) {
        /* corrupt entry — fall through and recompute */
      }
    }
    fetchSentiment(input);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalText, documentTitle]);

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
          documentText: withTitle(originalText),
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
          documentText: withTitle(originalText),
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
          documentText: withTitle(originalText),
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

  // Only signed-in users can upload / summarize documents.
  const userId = localStorage.getItem("userId");
  if (!userId) {
    const dark = theme === "dark";
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          px: 2,
          backgroundColor: dark ? "#1e1e1e" : "#f5f5f5",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 5 },
            textAlign: "center",
            maxWidth: "440px",
            borderRadius: "18px",
            bgcolor: dark ? "#2a2a2a" : "#ffffff",
            border: dark ? "1px solid #3a3a3a" : "1px solid #ececec",
            boxShadow: dark
              ? "0 2px 12px rgba(0,0,0,0.35)"
              : "0 2px 14px rgba(0,0,0,0.06)",
          }}
        >
          <AccountCircleIcon sx={{ fontSize: 56, color: "#f57c00", mb: 1 }} />
          <Typography
            sx={{
              font: "inherit",
              fontWeight: 700,
              fontSize: "20px",
              color: dark ? "#fff" : "#1a1a1a",
              mb: 1,
            }}
          >
            You're not signed in
          </Typography>
          <Typography
            sx={{
              font: "inherit",
              fontSize: "14px",
              color: dark ? "#b5b5b5" : "#666",
            }}
          >
            Please{" "}
            <a href="/login" style={{ color: "#f57c00", fontWeight: 600 }}>
              log in
            </a>{" "}
            to upload and summarize documents.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      ref={splitContainerRef}
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        padding: 4,
        gap: { xs: 2, md: 0 },
        alignItems: "flex-start",
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
      onMouseUp={handleTextSelection}
    >
      {/* While dragging the splitter, this transparent overlay sits on top of
          everything (including the PDF iframe, which would otherwise swallow
          mouse events and break the drag) and forces the resize cursor. */}
      {draggingSplit && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            cursor: "col-resize",
          }}
        />
      )}

      {!summary && (
        <UploadModal
          setSummary={setSummary}
          setOriginalText={setOriginalText}
          setOriginalHtml={setOriginalHtml}
          setDocumentTitle={setDocumentTitle}
          setFileUrl={setFileUrl}
          setFileType={setFileType}
          theme={theme}
          setDocumentFile={setDocumentFile}
        />
      )}
      {summary && (
        <>
          <Box
            sx={{
              width: { xs: "100%", md: `${leftWidth}%` },
              flexShrink: 0,
              minWidth: 0,
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
            {fileType && fileType.includes("pdf") && fileUrl ? (
              <Box
                component="iframe"
                title="Original Document"
                src={fileUrl}
                sx={{
                  width: "100%",
                  height: { xs: "60vh", md: "78vh" },
                  border: "1px solid #f57c00",
                  borderRadius: "12px",
                  bgcolor: "#fff",
                  display: "block",
                }}
              />
            ) : (
              <Box
                sx={{
                  border: "1px solid #f57c00",
                  padding: 2,
                  borderRadius: "12px",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  overflowY: "auto",
                  maxHeight: { xs: "50vh", md: "75vh" },
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "14px",
                  lineHeight: 1.7,
                  color: theme === "dark" ? "#e8e8e8" : "#1a1a1a",
                  "& h1, & h2, & h3, & h4, & h5, & h6": {
                    color: theme === "dark" ? "#ffffff" : "#111",
                  },
                  "& h1": { fontSize: "22px", fontWeight: 700, mt: 2, mb: 1 },
                  "& h2": { fontSize: "19px", fontWeight: 700, mt: 2, mb: 1 },
                  "& h3": {
                    fontSize: "17px",
                    fontWeight: 600,
                    mt: 1.5,
                    mb: 0.75,
                  },
                  "& h4, & h5, & h6": { fontWeight: 600, mt: 1.5, mb: 0.5 },
                  "& p": { my: 1 },
                  "& ul, & ol": { pl: 3, my: 1 },
                  "& li": { mb: 0.5 },
                  "& a": { color: "#f57c00", textDecoration: "underline" },
                  "& strong, & b": { fontWeight: 700 },
                  "& em, & i": { fontStyle: "italic" },
                  "& img": {
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: "8px",
                  },
                  "& blockquote": {
                    borderLeft: "3px solid #f57c00",
                    pl: 2,
                    ml: 0,
                    my: 1,
                    color: theme === "dark" ? "#bbb" : "#555",
                  },
                  "& table": {
                    borderCollapse: "collapse",
                    width: "100%",
                    my: 1.5,
                    fontSize: "13px",
                  },
                  "& th, & td": {
                    border:
                      theme === "dark" ? "1px solid #555" : "1px solid #ddd",
                    p: "6px 10px",
                    textAlign: "left",
                  },
                  "& th": {
                    bgcolor: theme === "dark" ? "#3a3a3a" : "#faf0e6",
                    fontWeight: 700,
                  },
                  "& hr": {
                    border: "none",
                    borderTop:
                      theme === "dark" ? "1px solid #444" : "1px solid #eee",
                    my: 1.5,
                  },
                  "& pre": {
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                    fontSize: "12.5px",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    bgcolor: theme === "dark" ? "#1b1b1b" : "#f6f8fa",
                    border:
                      theme === "dark" ? "1px solid #333" : "1px solid #eaecef",
                    borderRadius: "8px",
                    p: 1.5,
                    my: 1,
                    overflowX: "auto",
                  },
                  "& code": {
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                    fontSize: "0.92em",
                  },
                  "& pre code": { fontSize: "inherit" },
                }}
              >
                {originalHtml ? (
                  <Box
                    sx={{ "& > :first-of-type": { mt: 0 } }}
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(originalHtml, {
                        USE_PROFILES: { html: true },
                      }),
                    }}
                  />
                ) : fileType && fileType.includes("markdown") ? (
                  <Box sx={{ "& > :first-of-type": { mt: 0 } }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {originalText}
                    </ReactMarkdown>
                  </Box>
                ) : (
                  <Typography
                    component="div"
                    sx={{
                      font: "inherit",
                      whiteSpace: "pre-wrap",
                      color: theme === "dark" ? "white" : "black",
                    }}
                  >
                    {originalText}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Draggable divider (desktop only) */}
          <Box
            onMouseDown={(e) => {
              e.preventDefault();
              draggingSplitRef.current = true;
              setDraggingSplit(true);
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
            onDoubleClick={() => setLeftWidth(32)}
            title="Drag to resize · double-click to reset"
            sx={{
              display: { xs: "none", md: "flex" },
              alignSelf: "stretch",
              position: "relative",
              alignItems: "center",
              justifyContent: "center",
              width: "18px",
              flexShrink: 0,
              cursor: "col-resize",
              zIndex: 2,
              "&:hover .dt-line": { backgroundColor: "rgba(230,81,0,0.5)" },
              "&:hover .dt-grip": { backgroundColor: "#e65100" },
            }}
          >
            {/* full-height guide line so the handle is never hidden */}
            <Box
              className="dt-line"
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: "2px",
                backgroundColor: draggingSplit
                  ? "rgba(230,81,0,0.5)"
                  : "rgba(245,124,0,0.35)",
                transition: "background-color 0.2s ease",
              }}
            />
            {/* long grip pill in the middle */}
            <Box
              className="dt-grip"
              sx={{
                position: "relative",
                zIndex: 1,
                width: "6px",
                height: "min(220px, 55vh)",
                borderRadius: "4px",
                backgroundColor: draggingSplit ? "#e65100" : "#f57c00",
                transition: "background-color 0.2s ease",
              }}
            />
          </Box>

          <Box
            sx={{
              width: { xs: "100%" },
              flexGrow: { md: 1 },
              minWidth: 0,
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
                "& .MuiButton-root": {
                  paddingRight: "18px",
                },
                "& .MuiButton-startIcon": {
                  marginLeft: "6px",
                },
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
                startIcon={!loadingKeyIdeas && <TipsAndUpdatesIcon />}
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
                startIcon={!loadingDiscussionPoints && <ForumOutlinedIcon />}
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
                startIcon={!loadingBulletSummary && <FormatListBulletedIcon />}
              >
                {loadingBulletSummary ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Generate Bullet-Point Summary"
                )}
              </Button>
              <ChatModal theme={theme} />
              <Button
                onClick={handleShowAnalytics}
                sx={{
                  bgcolor: "#f57c00",
                  color: "white",
                  font: "inherit",
                  borderRadius: "12px",
                }}
                startIcon={<InsightsOutlinedIcon />}
              >
                Document Analytics
              </Button>
              <Button
                onClick={() => setShowAudioModal(true)}
                sx={{
                  bgcolor: "#f57c00",
                  color: "white",
                  font: "inherit",
                  borderRadius: "12px",
                }}
                startIcon={<RecordVoiceOverIcon />}
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
                startIcon={<TranslateIcon />}
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
                startIcon={<EditOutlinedIcon />}
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
                startIcon={!loadingRecommendations && <AutoAwesomeIcon />}
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
                startIcon={<TuneIcon />}
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
                startIcon={<UploadFileIcon />}
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

      {/* Loading Snackbar for selected text operations */}
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={loadingSnackbarOpen}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            backgroundColor: "#f57c00",
            color: "white",
            padding: "12px 16px",
            borderRadius: "4px",
            font: "inherit",
            fontSize: "16px",
          }}
        >
          <CircularProgress size={20} sx={{ color: "white" }} />
          <Typography sx={{ font: "inherit", color: "white" }}>
            Summarizing selected text...
          </Typography>
        </Box>
      </Snackbar>

      {ErrorToastComponent}

      {/* Text Highlight Menu */}
      {highlightMenuOpen &&
        (() => {
          const dark = theme === "dark";
          const menuItems = [
            {
              label: "Copy",
              icon: <ContentCopyIcon fontSize="small" />,
              onClick: handleCopySelected,
            },
            {
              label: "Summarize",
              icon: <AutoAwesomeIcon fontSize="small" />,
              onClick: handleSummarizeSelected,
            },
            {
              label: "Rewrite",
              icon: <EditOutlinedIcon fontSize="small" />,
              onClick: handleRewriteSelected,
            },
            {
              label: "Ask Chat",
              icon: <ForumOutlinedIcon fontSize="small" />,
              onClick: handleChatWithSelected,
            },
            {
              label: "Search web",
              icon: <SearchIcon fontSize="small" />,
              onClick: handleSearchWeb,
            },
          ];
          const words = selectedText.trim()
            ? selectedText.trim().split(/\s+/).length
            : 0;
          return (
            <Box
              ref={highlightMenuRef}
              // Keep the user's text selection alive while they interact with
              // the menu: preventing the default mousedown stops the browser
              // from collapsing the selection, and stopping mouseup keeps the
              // page-level handler from closing the menu before onClick fires.
              onMouseDown={(e) => e.preventDefault()}
              onMouseUp={(e) => e.stopPropagation()}
              sx={{
                position: "fixed",
                top: menuPosition.y,
                left: menuPosition.x,
                backgroundColor: dark ? "#2a2a2a" : "#fff",
                border: dark ? "1px solid #3a3a3a" : "1px solid #ececec",
                borderRadius: "12px",
                boxShadow: dark
                  ? "0 8px 28px rgba(0,0,0,0.5)"
                  : "0 8px 28px rgba(0,0,0,0.18)",
                zIndex: 1300,
                p: 0.75,
                width: "210px",
                maxWidth: "calc(100vw - 16px)",
                fontFamily: "Poppins, sans-serif",
                animation: "dtPop 0.12s ease-out",
                "@keyframes dtPop": {
                  from: { opacity: 0, transform: "scale(0.96)" },
                  to: { opacity: 1, transform: "scale(1)" },
                },
              }}
            >
              {/* Header: selection meta + close */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 1,
                  py: 0.5,
                }}
              >
                <Typography
                  sx={{
                    font: "inherit",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: dark ? "#999" : "#888",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {words} word{words === 1 ? "" : "s"} selected
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setHighlightMenuOpen(false)}
                  sx={{ p: 0.25, color: dark ? "#aaa" : "#888" }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
              <Box
                sx={{
                  height: "1px",
                  bgcolor: dark ? "#3a3a3a" : "#eee",
                  mb: 0.5,
                }}
              />
              {menuItems.map((item) => (
                <Button
                  key={item.label}
                  onClick={item.onClick}
                  startIcon={item.icon}
                  fullWidth
                  sx={{
                    color: dark ? "#eee" : "#222",
                    font: "inherit",
                    fontSize: "14px",
                    textTransform: "none",
                    justifyContent: "flex-start",
                    gap: 0.5,
                    px: 1,
                    py: 0.75,
                    borderRadius: "8px",
                    "& .MuiButton-startIcon": { color: "#f57c00" },
                    "&:hover": {
                      backgroundColor: dark
                        ? "rgba(245,124,0,0.14)"
                        : "rgba(245,124,0,0.1)",
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          );
        })()}

      <Snackbar
        open={copySnackOpen}
        autoHideDuration={2000}
        onClose={() => setCopySnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message="Copied to clipboard"
        ContentProps={{
          sx: {
            fontFamily: "Poppins, sans-serif",
            bgcolor: "#323232",
            color: "#fff",
            fontWeight: 500,
          },
        }}
      />

      {/* Chat Modal */}
      {chatModalOpen && (
        <ChatModal
          theme={theme}
          open={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          initialMessage={chatInitialMessage}
        />
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal &&
        analytics &&
        (() => {
          const dk = theme === "dark";
          const cardBg = dk ? "#242424" : "#fafafa";
          const panelBorder = dk ? "1px solid #333" : "1px solid #eee";
          const sub = dk ? "#aaa" : "#777";
          const head = dk ? "#fff" : "#1a1a1a";
          const flesch = parseFloat(analytics.fleschScore);
          const fleschLabel =
            flesch >= 90
              ? "Very easy"
              : flesch >= 70
                ? "Easy"
                : flesch >= 60
                  ? "Standard"
                  : flesch >= 50
                    ? "Fairly hard"
                    : flesch >= 30
                      ? "Difficult"
                      : "Very difficult";
          const fleschPct = Math.max(0, Math.min(100, flesch));
          const overview = [
            { label: "Words", value: analytics.wordCount },
            { label: "Sentences", value: analytics.sentenceCount },
            { label: "Paragraphs", value: analytics.paragraphCount },
            { label: "Unique words", value: analytics.uniqueWordCount },
            { label: "Reading", value: analytics.readingTime, unit: "min" },
            { label: "Speaking", value: analytics.speakingTime, unit: "min" },
          ];
          const wl = analytics.wordLengthDistribution;
          const wlTotal = wl.short + wl.medium + wl.long + wl.veryLong || 1;
          const wlRows = [
            { label: "Short (1–4)", v: wl.short },
            { label: "Medium (5–7)", v: wl.medium },
            { label: "Long (8–10)", v: wl.long },
            { label: "Very long (11+)", v: wl.veryLong },
          ];
          const structure = [
            { label: "Characters", value: analytics.characterCount },
            { label: "No spaces", value: analytics.characterCountNoSpaces },
            { label: "Lines", value: analytics.lineCount },
            { label: "Avg word len", value: analytics.avgWordLength },
            { label: "Words / sent.", value: analytics.avgWordsPerSentence },
            { label: "Syll. / word", value: analytics.avgSyllablesPerWord },
            {
              label: "Longest sent.",
              value: analytics.longestSentence,
              unit: "w",
            },
            {
              label: "Shortest sent.",
              value: analytics.shortestSentence,
              unit: "w",
            },
          ];
          const punct = [
            { label: "Periods", v: analytics.punctuationCounts.periods },
            { label: "Commas", v: analytics.punctuationCounts.commas },
            { label: "Questions", v: analytics.punctuationCounts.questions },
            { label: "Exclaim.", v: analytics.punctuationCounts.exclamations },
            { label: "Quotes", v: analytics.punctuationCounts.quotes },
            { label: "Semicolons", v: analytics.punctuationCounts.semicolons },
          ];
          const maxWord =
            (analytics.topWords[0] && analytics.topWords[0].count) || 1;
          const SectionTitle = ({ children }) => (
            <Typography
              sx={{
                font: "inherit",
                fontWeight: 700,
                fontSize: "15px",
                color: head,
                mt: 3,
                mb: 1.5,
              }}
            >
              {children}
            </Typography>
          );

          return (
            <Modal
              open={showAnalyticsModal}
              onClose={() => setShowAnalyticsModal(false)}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: { xs: "94%", sm: "90%", md: "830px" },
                  maxHeight: "92vh",
                  display: "flex",
                  flexDirection: "column",
                  bgcolor: dk ? "#1a1a1a" : "#fff",
                  borderRadius: "20px",
                  overflow: "hidden",
                  boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
                  fontFamily: "Poppins, sans-serif",
                  outline: "none",
                  border: dk ? "1px solid #2e2e2e" : "1px solid #eee",
                }}
              >
                <Box
                  sx={{
                    height: 6,
                    flexShrink: 0,
                    background:
                      "linear-gradient(90deg,#ff8a00,#f57c00,#ffb74d)",
                  }}
                />
                <Box
                  sx={{
                    p: { xs: 2.5, md: 3.5 },
                    pb: { xs: 4, md: 5 },
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                  }}
                >
                  {/* Header */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
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
                        <InsightsOutlinedIcon />
                      </Box>
                      <Box>
                        <Typography
                          sx={{
                            font: "inherit",
                            fontWeight: 700,
                            fontSize: "20px",
                            color: head,
                            lineHeight: 1.1,
                          }}
                        >
                          Document Analytics
                        </Typography>
                        <Typography
                          sx={{
                            font: "inherit",
                            fontSize: "12.5px",
                            color: sub,
                          }}
                        >
                          A deep look at your document's structure and
                          readability.
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton
                      onClick={() => setShowAnalyticsModal(false)}
                      sx={{ color: sub }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>

                  {/* Overview cards */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr 1fr",
                        sm: "repeat(3,1fr)",
                        md: "repeat(6,1fr)",
                      },
                      gap: 1.5,
                      mt: 2,
                    }}
                  >
                    {overview.map((s) => (
                      <Box
                        key={s.label}
                        sx={{
                          p: 1.75,
                          bgcolor: cardBg,
                          border: panelBorder,
                          borderRadius: "14px",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            font: "inherit",
                            fontWeight: 700,
                            fontSize: { xs: "20px", md: "24px" },
                            color: "#f57c00",
                            lineHeight: 1.1,
                          }}
                        >
                          <AnimatedNumber value={s.value} />
                          {s.unit && (
                            <Typography
                              component="span"
                              sx={{
                                font: "inherit",
                                fontSize: "12px",
                                color: "#f57c00",
                                ml: 0.5,
                              }}
                            >
                              {s.unit}
                            </Typography>
                          )}
                        </Typography>
                        <Typography
                          sx={{
                            font: "inherit",
                            fontSize: "11.5px",
                            color: sub,
                            mt: 0.5,
                          }}
                        >
                          {s.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Readability */}
                  <SectionTitle>Readability</SectionTitle>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: cardBg,
                      border: panelBorder,
                      borderRadius: "14px",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography
                        sx={{ font: "inherit", fontSize: "13px", color: sub }}
                      >
                        Flesch reading ease
                      </Typography>
                      <Typography
                        sx={{
                          font: "inherit",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: head,
                        }}
                      >
                        {analytics.fleschScore} · {fleschLabel}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        position: "relative",
                        height: 10,
                        borderRadius: 999,
                        background:
                          "linear-gradient(90deg,#d32f2f,#f57c00,#fbc02d,#7cb342,#388e3c)",
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: `${fleschPct}%`,
                          transform: "translate(-50%, -50%)",
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          bgcolor: "#fff",
                          border: "3px solid #f57c00",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 0.5,
                      }}
                    >
                      <Typography
                        sx={{ font: "inherit", fontSize: "10px", color: sub }}
                      >
                        Harder
                      </Typography>
                      <Typography
                        sx={{ font: "inherit", fontSize: "10px", color: sub }}
                      >
                        Easier
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr 1fr",
                          sm: "repeat(3,1fr)",
                        },
                        gap: 1.5,
                        mt: 2,
                      }}
                    >
                      {[
                        {
                          l: "Lexical diversity",
                          v: analytics.lexicalDiversity + "%",
                        },
                        {
                          l: "Complex words",
                          v: analytics.complexityPercentage + "%",
                        },
                        {
                          l: "Avg syllables",
                          v: analytics.avgSyllablesPerWord,
                        },
                      ].map((m) => (
                        <Box key={m.l} sx={{ textAlign: "center" }}>
                          <Typography
                            sx={{
                              font: "inherit",
                              fontWeight: 700,
                              fontSize: "18px",
                              color: head,
                            }}
                          >
                            {m.v}
                          </Typography>
                          <Typography
                            sx={{
                              font: "inherit",
                              fontSize: "11px",
                              color: sub,
                            }}
                          >
                            {m.l}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* Top words + word length */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <Box>
                      <SectionTitle>Most frequent words</SectionTitle>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: cardBg,
                          border: panelBorder,
                          borderRadius: "14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        {analytics.topWords.slice(0, 8).map((w) => (
                          <Box
                            key={w.word}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              sx={{
                                font: "inherit",
                                fontSize: "12px",
                                color: head,
                                width: 90,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {w.word}
                            </Typography>
                            <Box
                              sx={{
                                flex: 1,
                                height: 8,
                                borderRadius: 999,
                                bgcolor: dk ? "#333" : "#eee",
                                overflow: "hidden",
                              }}
                            >
                              <Box
                                sx={{
                                  height: "100%",
                                  width: `${(w.count / maxWord) * 100}%`,
                                  background:
                                    "linear-gradient(90deg,#ff8a00,#f57c00)",
                                  borderRadius: 999,
                                }}
                              />
                            </Box>
                            <Typography
                              sx={{
                                font: "inherit",
                                fontSize: "12px",
                                color: sub,
                                width: 28,
                                textAlign: "right",
                              }}
                            >
                              {w.count}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                    <Box>
                      <SectionTitle>Word length</SectionTitle>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: cardBg,
                          border: panelBorder,
                          borderRadius: "14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.25,
                        }}
                      >
                        {wlRows.map((r) => (
                          <Box key={r.label}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.25,
                              }}
                            >
                              <Typography
                                sx={{
                                  font: "inherit",
                                  fontSize: "12px",
                                  color: head,
                                }}
                              >
                                {r.label}
                              </Typography>
                              <Typography
                                sx={{
                                  font: "inherit",
                                  fontSize: "12px",
                                  color: sub,
                                }}
                              >
                                {Math.round((r.v / wlTotal) * 100)}%
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                height: 8,
                                borderRadius: 999,
                                bgcolor: dk ? "#333" : "#eee",
                                overflow: "hidden",
                              }}
                            >
                              <Box
                                sx={{
                                  height: "100%",
                                  width: `${(r.v / wlTotal) * 100}%`,
                                  background:
                                    "linear-gradient(90deg,#ffb74d,#f57c00)",
                                  borderRadius: 999,
                                }}
                              />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>

                  {/* Structure */}
                  <SectionTitle>Structure &amp; detail</SectionTitle>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr 1fr",
                        sm: "repeat(4,1fr)",
                      },
                      gap: 1.5,
                    }}
                  >
                    {structure.map((s) => (
                      <Box
                        key={s.label}
                        sx={{
                          p: 1.5,
                          bgcolor: cardBg,
                          border: panelBorder,
                          borderRadius: "12px",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            font: "inherit",
                            fontWeight: 700,
                            fontSize: "16px",
                            color: head,
                          }}
                        >
                          {s.value}
                          {s.unit && (
                            <Typography
                              component="span"
                              sx={{ fontSize: "11px", color: sub, ml: 0.3 }}
                            >
                              {s.unit}
                            </Typography>
                          )}
                        </Typography>
                        <Typography
                          sx={{
                            font: "inherit",
                            fontSize: "11px",
                            color: sub,
                            mt: 0.25,
                          }}
                        >
                          {s.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Punctuation */}
                  <SectionTitle>Punctuation</SectionTitle>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {punct.map((p) => (
                      <Box
                        key={p.label}
                        sx={{
                          px: 1.5,
                          py: 0.75,
                          borderRadius: "10px",
                          bgcolor: cardBg,
                          border: panelBorder,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.75,
                        }}
                      >
                        <Typography
                          sx={{
                            font: "inherit",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#f57c00",
                          }}
                        >
                          {p.v}
                        </Typography>
                        <Typography
                          sx={{ font: "inherit", fontSize: "12px", color: sub }}
                        >
                          {p.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Modal>
          );
        })()}
    </Box>
  );
};

export default Home;
