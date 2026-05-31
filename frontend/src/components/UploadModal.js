import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Snackbar,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoIcon from "@mui/icons-material/Info";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CheckIcon from "@mui/icons-material/Check";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { gapi } from "gapi-script";
import GoogleDriveFileSelectorModal from "./GoogleDriveFileSelectorModal";
import { supabase, SUPABASE_BUCKET } from "../utils/supabaseClient";

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
  setOriginalHtml,
  setDocumentTitle,
  setFileUrl,
  setFileType,
  setDocumentFile,
  theme,
}) => {
  // Local state variables

  // eslint-disable-next-line no-unused-vars
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [file, setFile] = useState(null);

  // eslint-disable-next-line no-unused-vars
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/markdown": [".md", ".markdown"],
      "text/html": [".html", ".htm"],
      "text/csv": [".csv"],
      "text/tab-separated-values": [".tsv"],
      "application/json": [".json"],
      // Plain text + a broad set of code/config/data files (matched by ext).
      "text/plain": [
        ".txt",
        ".text",
        ".log",
        ".xml",
        ".yaml",
        ".yml",
        ".js",
        ".jsx",
        ".mjs",
        ".cjs",
        ".ts",
        ".tsx",
        ".py",
        ".java",
        ".c",
        ".cpp",
        ".cc",
        ".h",
        ".hpp",
        ".cs",
        ".go",
        ".rs",
        ".rb",
        ".php",
        ".sql",
        ".sh",
        ".bash",
        ".css",
        ".scss",
        ".less",
        ".ini",
        ".toml",
        ".conf",
        ".env",
        ".kt",
        ".swift",
        ".r",
        ".lua",
        ".pl",
      ],
    },
  });

  // Escape user text before inserting into display HTML.
  const escapeHtml = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Turn reconstructed plaintext (with \n / \n\n) into readable paragraph HTML.
  const textToHtml = (text) =>
    text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
      .join("");

  // Extract from PDF. We return BOTH a clean plaintext (for the AI / storage)
  // and display HTML. The old code joined every text fragment with a single
  // space, destroying all line/paragraph structure. Here we reconstruct lines
  // and paragraphs from each item's vertical position + hasEOL so the result
  // reads like the source document instead of one giant blob.
  const extractFromPdf = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      let pageText = "";
      let lastY = null;
      let lastH = 10;
      for (const item of content.items) {
        if (typeof item.str !== "string") continue;
        const y = item.transform ? item.transform[5] : null;
        const h = item.height || lastH || 10;
        if (lastY !== null && y !== null) {
          const dy = lastY - y;
          if (dy > h * 1.6) {
            pageText += "\n\n"; // large vertical gap → paragraph break
          } else if (dy > h * 0.5 || item.hasEOL) {
            pageText += "\n"; // moved to next line
          } else if (pageText && !/\s$/.test(pageText)) {
            pageText += " "; // same line → keep words apart
          }
        }
        pageText += item.str;
        if (y !== null) lastY = y;
        lastH = h;
      }
      text += pageText.trim();
      if (i < pdf.numPages) text += "\n\n";
    }
    text = text
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return { text, html: textToHtml(text) };
  };

  // Extract from DOCX: raw text for the AI, structured HTML (headings, bold,
  // lists, tables) via mammoth.convertToHtml for the viewer.
  const extractFromDocx = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const [rawResult, htmlResult] = await Promise.all([
      mammoth.extractRawText({ arrayBuffer }),
      mammoth.convertToHtml({ arrayBuffer }),
    ]);
    return { text: rawResult.value, html: htmlResult.value };
  };

  // Lowercased file extension (no dot).
  const fileExt = (file) => {
    const m = /\.([a-z0-9]+)$/i.exec(file.name || "");
    return m ? m[1].toLowerCase() : "";
  };

  // Strip tags from an HTML string to get plain text for the AI.
  const stripHtml = (html) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  // Render CSV/TSV into an HTML table (first row = header). Handles simple
  // quoted fields and escaped quotes.
  const delimitedToHtmlTable = (raw, delimiter) => {
    const parseRow = (line) => {
      const out = [];
      let cur = "";
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inQ) {
          if (c === '"' && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else if (c === '"') {
            inQ = false;
          } else {
            cur += c;
          }
        } else if (c === '"') {
          inQ = true;
        } else if (c === delimiter) {
          out.push(cur);
          cur = "";
        } else {
          cur += c;
        }
      }
      out.push(cur);
      return out;
    };
    const rows = raw
      .split(/\r?\n/)
      .filter((r) => r.length > 0)
      .map(parseRow);
    if (rows.length === 0) return "";
    const head = rows[0];
    const body = rows.slice(1);
    let html = "<table><thead><tr>";
    head.forEach((h) => (html += `<th>${escapeHtml(h)}</th>`));
    html += "</tr></thead><tbody>";
    body.forEach((r) => {
      html += "<tr>";
      r.forEach((c) => (html += `<td>${escapeHtml(c)}</td>`));
      html += "</tr>";
    });
    html += "</tbody></table>";
    return html;
  };

  // Code / config / data files rendered as monospace blocks.
  const CODE_EXTS = new Set([
    "json",
    "xml",
    "yaml",
    "yml",
    "js",
    "jsx",
    "mjs",
    "cjs",
    "ts",
    "tsx",
    "py",
    "java",
    "c",
    "cpp",
    "cc",
    "h",
    "hpp",
    "cs",
    "go",
    "rs",
    "rb",
    "php",
    "sql",
    "sh",
    "bash",
    "css",
    "scss",
    "less",
    "ini",
    "toml",
    "conf",
    "env",
    "kt",
    "swift",
    "r",
    "lua",
    "pl",
  ]);

  // Unified extractor: returns { text (for the AI), html (for the viewer),
  // fileType } for every supported format, or null if unsupported.
  const extractDocument = async (file) => {
    const ext = fileExt(file);
    const type = (file.type || "").toLowerCase();

    if (type === "application/pdf" || ext === "pdf") {
      return { ...(await extractFromPdf(file)), fileType: "application/pdf" };
    }
    if (type.includes("officedocument.wordprocessingml") || ext === "docx") {
      return {
        ...(await extractFromDocx(file)),
        fileType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
    }
    if (ext === "md" || ext === "markdown" || type.includes("markdown")) {
      return { text: await file.text(), html: "", fileType: "text/markdown" };
    }
    if (ext === "html" || ext === "htm" || type === "text/html") {
      const raw = await file.text();
      return { text: stripHtml(raw), html: raw, fileType: "text/html" };
    }
    if (ext === "csv" || type === "text/csv") {
      const raw = await file.text();
      return {
        text: raw,
        html: delimitedToHtmlTable(raw, ","),
        fileType: "text/csv",
      };
    }
    if (ext === "tsv") {
      const raw = await file.text();
      return {
        text: raw,
        html: delimitedToHtmlTable(raw, "\t"),
        fileType: "text/tab-separated-values",
      };
    }
    if (CODE_EXTS.has(ext)) {
      const raw = await file.text();
      let body = raw;
      if (ext === "json") {
        try {
          body = JSON.stringify(JSON.parse(raw), null, 2);
        } catch (e) {
          /* leave raw if invalid JSON */
        }
      }
      return {
        text: raw,
        html: `<pre>${escapeHtml(body)}</pre>`,
        fileType: ext === "json" ? "application/json" : "text/plain",
      };
    }
    if (
      ext === "txt" ||
      ext === "text" ||
      ext === "log" ||
      type.startsWith("text/")
    ) {
      return { text: await file.text(), html: "", fileType: "text/plain" };
    }
    return null;
  };

  // Store the original file and return its storage path ("" on failure).
  // Primary: browser uploads bytes DIRECTLY to Supabase via a backend-minted
  // signed-upload token (no serverless body-size limit, handles large PDFs).
  // Fallback: route through the backend for small files if direct upload can't
  // run (e.g. frontend Supabase envs not set).
  const uploadOriginalFile = async (file, userId) => {
    try {
      const signRes = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/document-upload-url",
        { userId, fileName: file.name },
      );
      const { path, token } = signRes.data;
      if (supabase && path && token) {
        const { error } = await supabase.storage
          .from(SUPABASE_BUCKET)
          .uploadToSignedUrl(path, token, file, {
            contentType: file.type || "application/octet-stream",
          });
        if (error) throw error;
        return path;
      }
      throw new Error("Supabase browser client not configured");
    } catch (e) {
      console.warn("Direct upload unavailable, trying backend fallback:", e);
    }
    try {
      const fileForm = new FormData();
      fileForm.append("file", file);
      if (userId) fileForm.append("userId", userId);
      const res = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/document-file",
        fileForm,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return res.data.filePath || "";
    } catch (e) {
      console.warn("File storage failed; using text/HTML view:", e);
      return "";
    }
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
      let extracted = { text: "", html: "" };

      const result = await extractDocument(file);
      if (!result) {
        setErrorMessage(
          "Unsupported file format. Supported: PDF, Word (.docx), Markdown, HTML, CSV/TSV, JSON, and text/code files.",
        );
        setOpenSnackbar(true);
        setLoading(false);
        return;
      }
      extracted = { text: result.text, html: result.html };
      // Resolve a usable mime type (text/code files often report an empty type).
      const storedFileType = result.fileType || file.type || "text/plain";

      const userId = localStorage.getItem("userId");

      // Store the original file so the viewer can render it (live + history).
      // Non-fatal: if storage fails we still summarize and fall back to the
      // HTML/text view.
      setProgressMessage("Uploading file...");
      const filePath = await uploadOriginalFile(file, userId);

      setProgressMessage("Summarizing your document...");
      // Send plaintext (for the AI), display HTML, and the stored file path
      // (so history can render the real document).
      const payload = {
        title: title,
        text: extracted.text,
        html: extracted.html,
        filePath,
        fileType: storedFileType,
      };
      if (userId) {
        payload.userId = userId;
      }

      // Send the extracted text to the backend endpoint
      const response = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/upload",
        payload,
      );
      const { summary, originalText, originalHtml, fileUrl, fileType } =
        response.data;
      const displayHtml = originalHtml || extracted.html || "";
      const displayFileType = fileType || storedFileType || "";

      // Populate everything EXCEPT the summary so the results screen doesn't
      // appear yet (Home switches to results once `summary` is set).
      setOriginalText(originalText);
      if (setOriginalHtml) setOriginalHtml(displayHtml);
      if (setDocumentTitle) setDocumentTitle(title);
      if (setFileUrl) setFileUrl(fileUrl || "");
      if (setFileType) setFileType(displayFileType);
      localStorage.setItem("originalText", originalText);
      localStorage.setItem("originalHtml", displayHtml);
      localStorage.setItem("documentTitle", title);

      // Show the final "Ready" step, then reveal the results after a short,
      // smooth beat instead of jumping abruptly.
      setProgressMessage("Done");
      await new Promise((resolve) => setTimeout(resolve, 1300));

      setLoading(false);
      setProgressMessage("");
      setIsUploaded(true);
      setSummary(summary); // flips Home to the results screen
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

  const dark = theme === "dark";
  const PROCESS_STEPS = [
    { key: "extract", label: "Reading", icon: <ArticleOutlinedIcon /> },
    { key: "store", label: "Storing", icon: <CloudUploadIcon /> },
    { key: "analyze", label: "Analyzing", icon: <AutoAwesomeIcon /> },
    { key: "ready", label: "Ready", icon: <CheckCircleIcon /> },
  ];
  const isReady =
    progressMessage.startsWith("Done") || progressMessage.startsWith("Ready");
  const activeStep = isReady
    ? 3
    : progressMessage.startsWith("Extract")
      ? 0
      : progressMessage.startsWith("Upload")
        ? 1
        : progressMessage.startsWith("Summariz")
          ? 2
          : 0;
  const progressPct = isReady
    ? 100
    : ((activeStep + 0.6) / PROCESS_STEPS.length) * 100;
  const SUPPORTED = ["PDF", "Word", "Markdown", "HTML", "CSV", "JSON", "Code"];

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
            width: { xs: "92%", sm: "70%", md: "470px" },
            maxHeight: "90vh",
            padding: { xs: 2.5, sm: 4 },
            bgcolor: dark ? "#1e1e1e" : "white",
            textAlign: "center",
            borderRadius: "20px",
            transition: "background-color 0.3s ease",
            color: dark ? "white" : "black",
            overflowY: "auto",
            boxShadow: dark
              ? "0 24px 60px rgba(0,0,0,0.5)"
              : "0 24px 60px rgba(0,0,0,0.16)",
            border: dark ? "1px solid #2e2e2e" : "1px solid #eee",
            zIndex: 1000,
            pointerEvents: "auto",
            fontFamily: "Poppins, sans-serif",
            "@keyframes dtShimmer": {
              "0%": { backgroundPosition: "200% 0" },
              "100%": { backgroundPosition: "-200% 0" },
            },
            "@keyframes dtPulse": {
              "0%, 100%": { boxShadow: "0 0 0 6px rgba(245,124,0,0.18)" },
              "50%": { boxShadow: "0 0 0 11px rgba(245,124,0,0.05)" },
            },
            "@keyframes dtFloat": {
              "0%, 100%": { transform: "translateY(0)" },
              "50%": { transform: "translateY(-6px)" },
            },
          }}
        >
          {/* full-bleed gradient accent */}
          <Box
            sx={{
              height: 6,
              mx: { xs: -2.5, sm: -4 },
              mt: { xs: -2.5, sm: -4 },
              mb: 3,
              background: "linear-gradient(90deg,#ff8a00,#f57c00,#ffb74d)",
            }}
          />

          {/* ===== Hero header ===== */}
          <Box
            sx={{
              width: 62,
              height: 62,
              borderRadius: "18px",
              mx: "auto",
              mb: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg,#ff8a00,#f57c00)",
              color: "#fff",
              boxShadow: "0 10px 24px rgba(245,124,0,0.4)",
              animation: loading ? "none" : "dtFloat 3.2s ease-in-out infinite",
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 30 }} />
          </Box>
          <Typography
            sx={{
              font: "inherit",
              fontWeight: 700,
              fontSize: { xs: "20px", sm: "24px" },
              color: dark ? "#fff" : "#1a1a1a",
              lineHeight: 1.2,
            }}
          >
            {isReady
              ? "Your document is ready! 🎉"
              : loading
                ? "Working some magic…"
                : "Turn any document into insight"}
          </Typography>
          <Typography
            sx={{
              font: "inherit",
              fontSize: "13px",
              color: dark ? "#aaa" : "#777",
              mt: 0.75,
              maxWidth: 360,
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            {isReady
              ? "Taking you to your results…"
              : loading
                ? "Hang tight — extracting, storing, and summarizing your document."
                : "Drop a file and let AI summarize it, pull key ideas, chat with it, and more."}
          </Typography>
          {!loading && (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 0.5,
                justifyContent: "center",
                mt: 1.5,
                mb: 3,
              }}
            >
              {SUPPORTED.map((f) => (
                <Chip
                  key={f}
                  label={f}
                  size="small"
                  sx={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "11px",
                    height: 22,
                    color: "#f57c00",
                    bgcolor: dark
                      ? "rgba(245,124,0,0.16)"
                      : "rgba(245,124,0,0.1)",
                  }}
                />
              ))}
            </Box>
          )}

          {loading ? (
            /* ===== Animated processing ===== */
            <Box sx={{ mt: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  position: "relative",
                  px: 1,
                  mb: 3,
                }}
              >
                {/* connector */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 21,
                    left: 38,
                    right: 38,
                    height: 3,
                    bgcolor: dark ? "#333" : "#eee",
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      height: "100%",
                      borderRadius: 2,
                      background: "linear-gradient(90deg,#ff8a00,#f57c00)",
                      width: `${(activeStep / (PROCESS_STEPS.length - 1)) * 100}%`,
                      transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                    }}
                  />
                </Box>
                {PROCESS_STEPS.map((d, i) => {
                  const done = i < activeStep;
                  const active = i === activeStep;
                  const readyStep = active && d.key === "ready";
                  return (
                    <Box
                      key={d.key}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        zIndex: 1,
                        width: 66,
                      }}
                    >
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: readyStep
                            ? "#2e7d32"
                            : done
                              ? "#f57c00"
                              : dark
                                ? "#1e1e1e"
                                : "#fff",
                          border: `2px solid ${
                            readyStep
                              ? "#2e7d32"
                              : done || active
                                ? "#f57c00"
                                : dark
                                  ? "#444"
                                  : "#ddd"
                          }`,
                          color:
                            readyStep || done
                              ? "#fff"
                              : active
                                ? "#f57c00"
                                : dark
                                  ? "#666"
                                  : "#bbb",
                          animation: active
                            ? "dtPulse 1.5s ease-in-out infinite"
                            : "none",
                          transition: "all 0.3s ease",
                        }}
                      >
                        {done ? <CheckIcon /> : d.icon}
                      </Box>
                      <Typography
                        sx={{
                          font: "inherit",
                          fontSize: "11px",
                          mt: 1,
                          color: active ? "#f57c00" : dark ? "#aaa" : "#888",
                          fontWeight: active ? 600 : 500,
                        }}
                      >
                        {d.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* gradient shimmer progress bar */}
              <Box
                sx={{
                  position: "relative",
                  height: 10,
                  borderRadius: 999,
                  bgcolor: dark ? "#2a2a2a" : "#f0f0f0",
                  overflow: "hidden",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${progressPct}%`,
                    borderRadius: 999,
                    background:
                      "linear-gradient(90deg,#ff8a00,#f57c00,#ffb74d,#f57c00)",
                    backgroundSize: "200% 100%",
                    animation: "dtShimmer 1.4s linear infinite",
                    transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                  }}
                />
              </Box>
              <Typography
                sx={{
                  font: "inherit",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: dark ? "#fff" : "#333",
                }}
              >
                {progressMessage || "Processing…"}
              </Typography>
              <Typography
                sx={{
                  font: "inherit",
                  fontSize: "12px",
                  color: dark ? "#888" : "#999",
                  mt: 0.5,
                }}
              >
                This can take up to ~2 minutes on a cold start.
              </Typography>
            </Box>
          ) : (
            /* ===== Upload UI ===== */
            <>
              <Box
                {...getRootProps()}
                sx={{
                  border: `2px dashed ${
                    isDragActive ? "#f57c00" : dark ? "#555" : "#f5b066"
                  }`,
                  borderRadius: "14px",
                  padding: { xs: 3, sm: 4 },
                  cursor: "pointer",
                  marginBottom: 2,
                  bgcolor: isDragActive
                    ? "rgba(245,124,0,0.12)"
                    : "rgba(245,124,0,0.04)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "#f57c00",
                    bgcolor: "rgba(245,124,0,0.08)",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <input {...getInputProps()} />
                <UploadFileIcon
                  sx={{ fontSize: 40, color: "#f57c00", mb: 1 }}
                />
                <Typography
                  sx={{
                    font: "inherit",
                    fontWeight: 600,
                    fontSize: "14px",
                    color: dark ? "#eee" : "#333",
                  }}
                >
                  {isDragActive
                    ? "Drop it here"
                    : file
                      ? "Drop a new file or click to replace"
                      : "Drag & drop a file, or click to browse"}
                </Typography>
              </Box>

              {file && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    mb: 2,
                    px: 2,
                    py: 1,
                    borderRadius: "10px",
                    bgcolor: dark ? "#2a2a2a" : "#f6f6f6",
                  }}
                >
                  <ArticleOutlinedIcon
                    sx={{ fontSize: 18, color: "#f57c00", flexShrink: 0 }}
                  />
                  <Typography
                    sx={{
                      font: "inherit",
                      fontSize: "13px",
                      color: dark ? "#ddd" : "#444",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 300,
                    }}
                  >
                    {file.name}
                  </Typography>
                </Box>
              )}

              {file && (
                <TextField
                  label="Document Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ marginBottom: 2, font: "inherit" }}
                  inputProps={{
                    style: {
                      fontFamily: "Poppins, sans-serif",
                      color: dark ? "white" : "black",
                    },
                  }}
                  InputLabelProps={{
                    style: {
                      fontFamily: "Poppins, sans-serif",
                      color: dark ? "white" : "#000",
                    },
                  }}
                />
              )}

              <Button
                variant="contained"
                fullWidth
                startIcon={<AutoAwesomeIcon />}
                onClick={handleUpload}
                sx={{
                  bgcolor: "#f57c00",
                  color: "white",
                  font: "inherit",
                  fontWeight: 600,
                  fontSize: "15px",
                  textTransform: "none",
                  borderRadius: "12px",
                  py: 1.2,
                  boxShadow: "0 8px 20px rgba(245,124,0,0.32)",
                  "&:hover": { bgcolor: "#e65100" },
                }}
              >
                Summarize Document
              </Button>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  my: 2,
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    height: "1px",
                    bgcolor: dark ? "#333" : "#eee",
                  }}
                />
                <Typography
                  sx={{
                    font: "inherit",
                    fontSize: "12px",
                    color: dark ? "#888" : "#aaa",
                  }}
                >
                  OR
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    height: "1px",
                    bgcolor: dark ? "#333" : "#eee",
                  }}
                />
              </Box>

              <Button
                variant="outlined"
                fullWidth
                onClick={handleGoogleLogin}
                disabled={!isGoogleAuthReady}
                sx={{
                  font: "inherit",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: "12px",
                  py: 1.1,
                  color: dark ? "#ddd" : "#444",
                  borderColor: dark ? "#444" : "#ddd",
                  "&:hover": {
                    borderColor: "#4285F4",
                    bgcolor: "rgba(66,133,244,0.06)",
                  },
                }}
              >
                {isGoogleAuthReady
                  ? "Import from Google Drive"
                  : "Loading Google Drive…"}
              </Button>
            </>
          )}

          {!loading && (
            <Accordion
              sx={{
                mt: 3,
                bgcolor: theme === "dark" ? "#2a2a2a" : "#fff3e0",
                border: `1px solid ${theme === "dark" ? "#f57c00" : "#ff9800"}`,
                borderRadius: "8px",
                "&:before": {
                  display: "none",
                },
                boxShadow: "none",
              }}
            >
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon
                    sx={{ color: theme === "dark" ? "#fff" : "#000" }}
                  />
                }
                sx={{
                  font: "inherit",
                  "& .MuiAccordionSummary-content": {
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  },
                  "&:hover": {
                    bgcolor: "transparent",
                  },
                  "&.Mui-focusVisible": {
                    bgcolor: "transparent",
                  },
                }}
              >
                <InfoIcon sx={{ color: "#f57c00", fontSize: "20px" }} />
                <Typography
                  sx={{
                    font: "inherit",
                    fontWeight: "600",
                    color: theme === "dark" ? "white" : "black",
                    fontSize: "15px",
                  }}
                >
                  Important Note
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  font: "inherit",
                  color: theme === "dark" ? "#ddd" : "#666",
                  fontSize: "14px",
                  pt: 0,
                }}
              >
                <Typography
                  sx={{
                    font: "inherit",
                    fontSize: "14px",
                    lineHeight: 1.6,
                  }}
                >
                  Please avoid uploading very large files as server limits may
                  prevent processing. Processing may take up to 2 minutes during
                  high traffic or after periods of inactivity.
                </Typography>
              </AccordionDetails>
            </Accordion>
          )}
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
