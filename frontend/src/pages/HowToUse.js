import React from "react";
import { Box, Typography, Paper, Chip } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ArticleIcon from "@mui/icons-material/Article";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import ForumIcon from "@mui/icons-material/Forum";
import ChatIcon from "@mui/icons-material/Chat";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import TranslateIcon from "@mui/icons-material/Translate";
import InsightsIcon from "@mui/icons-material/Insights";
import RecommendIcon from "@mui/icons-material/Recommend";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import HighlightAltIcon from "@mui/icons-material/HighlightAlt";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SearchIcon from "@mui/icons-material/Search";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import FingerprintIcon from "@mui/icons-material/Fingerprint";

const ORANGE = "#f57c00";

const STEPS = [
  {
    icon: UploadFileIcon,
    title: "Upload a document",
    body: "Drag & drop onto the upload box on the home page, pick a file from your device, or import from Google Drive. Supported: PDF, Word (.docx), Markdown, HTML, CSV/TSV, JSON, plain text, and code/config files — each is rendered in its best form (real PDF pages, formatted Word/Markdown, HTML, tables for CSV, monospace for code, or clean text).",
  },
  {
    icon: ArticleIcon,
    title: "View the original + summary",
    body: "After processing you'll see the original document rendered on the left (real PDF pages, formatted Word/Markdown, or clean text) and a concise AI summary on the right.",
  },
  {
    icon: HighlightAltIcon,
    title: "Highlight text for quick actions",
    body: "On the results view, select any text to pop a menu: Copy, Summarize, Rewrite, Ask Chat, or Search the web — all scoped to exactly what you highlighted.",
  },
  {
    icon: TipsAndUpdatesIcon,
    title: "Generate key ideas",
    body: "Click 'Generate Key Ideas' to let the AI extract the most important points from the document.",
  },
  {
    icon: ForumIcon,
    title: "Generate discussion points",
    body: "Create discussion points for group discussions, debates, or deeper analysis of the document.",
  },
  {
    icon: ChatIcon,
    title: "Chat with the AI",
    body: "Ask specific questions and get answers grounded in your document's context — the AI also knows the document's title and today's date.",
  },
  {
    icon: FormatListBulletedIcon,
    title: "Bullet-point summary",
    body: "Get a concise bulleted summary — handy for quick notes or study guides.",
  },
  {
    icon: TranslateIcon,
    title: "Change the summary language",
    body: "Translate the summary into another language to share with multilingual readers.",
  },
  {
    icon: InsightsIcon,
    title: "Sentiment analysis",
    body: "See whether the document reads positive, negative, or neutral. Results are cached per document so revisiting won't re-run the analysis.",
  },
  {
    icon: RecommendIcon,
    title: "Actionable recommendations",
    body: "Get suggested next steps, improvements, or decisions based on the document content.",
  },
  {
    icon: AutoFixHighIcon,
    title: "Rewrite content",
    body: "Specify a tone or style and the AI rewrites the text — or highlight a passage and rewrite just that part.",
  },
  {
    icon: RecordVoiceOverIcon,
    title: "Voice chat",
    body: "Talk to the AI: upload a document, hit 'Voice Chat', and ask questions or discuss the content by voice.",
  },
  {
    icon: SearchIcon,
    title: "Search your documents",
    body: "On the Documents page, search by title or summary and sort/filter (newest, oldest, A–Z, by file type) to find anything fast.",
  },
  {
    icon: ManageAccountsIcon,
    title: "Manage documents & profile",
    body: "View, re-open, rename, or delete saved documents, and update your email, social links, and avatar from the Profile page.",
  },
  {
    icon: PersonAddIcon,
    title: "Create an account to save work",
    body: "Register and sign in to store your analyzed documents, re-open them anytime with the original file, and get a higher upload limit.",
  },
  {
    icon: FingerprintIcon,
    title: "Sign in with passkeys",
    body: "Skip passwords — add a passkey and sign in with your fingerprint, face, or device PIN from the Passkeys page.",
  },
];

const FORMATS = [
  "PDF",
  "Word (.docx)",
  "Markdown (.md)",
  "HTML (.html)",
  "CSV / TSV",
  "JSON",
  "Plain text (.txt)",
  "Code & config files",
];

const HowToUse = ({ theme }) => {
  const dark = theme === "dark";
  const pageBg = dark ? "#1e1e1e" : "#f5f5f5";
  const cardBg = dark ? "#2a2a2a" : "#ffffff";
  const heading = dark ? "#ffffff" : "#1a1a1a";
  const subText = dark ? "#b5b5b5" : "#555";
  const cardBorder = dark ? "1px solid #3a3a3a" : "1px solid #ececec";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: pageBg,
        py: { xs: 4, md: 6 },
        px: 2,
        fontFamily: "Poppins, sans-serif",
        transition: "background-color 0.3s ease",
      }}
    >
      <Box sx={{ maxWidth: "920px", mx: "auto" }}>
        {/* Hero */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "18px",
              mx: "auto",
              mb: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: ORANGE,
              bgcolor: dark ? "rgba(245,124,0,0.16)" : "rgba(245,124,0,0.1)",
            }}
          >
            <MenuBookIcon sx={{ fontSize: 34 }} />
          </Box>
          <Typography
            sx={{
              font: "inherit",
              fontWeight: 700,
              fontSize: { xs: "28px", md: "34px" },
              color: ORANGE,
              lineHeight: 1.15,
            }}
          >
            How to Use DocuThinker
          </Typography>
          <Typography
            sx={{
              font: "inherit",
              fontSize: "15px",
              color: subText,
              mt: 1.5,
              maxWidth: "620px",
              mx: "auto",
              lineHeight: 1.7,
            }}
          >
            Your AI-powered document workspace — upload a PDF, Word, Markdown,
            or text file and summarize it, extract key ideas, chat with it,
            translate it, and more. Here's everything you can do.
          </Typography>
        </Box>

        {/* Sign-in note */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            p: 2,
            mb: 4,
            borderRadius: "14px",
            bgcolor: dark ? "rgba(245,124,0,0.12)" : "rgba(245,124,0,0.08)",
            border: `1px solid ${dark ? "rgba(245,124,0,0.35)" : "rgba(245,124,0,0.3)"}`,
          }}
        >
          <LockOutlinedIcon sx={{ color: ORANGE, mt: 0.25 }} />
          <Typography
            sx={{
              font: "inherit",
              fontSize: "14px",
              color: heading,
              lineHeight: 1.7,
            }}
          >
            <strong>You must be signed in</strong> to upload, summarize, and
            save documents. Create a free account on the{" "}
            <a href="/register" style={{ color: ORANGE, fontWeight: 600 }}>
              Register
            </a>{" "}
            page or{" "}
            <a href="/login" style={{ color: ORANGE, fontWeight: 600 }}>
              log in
            </a>{" "}
            to get started — your documents are then saved to your account.
          </Typography>
        </Box>

        {/* Steps grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
            mb: 5,
          }}
        >
          {STEPS.map((step, i) => {
            const StepIcon = step.icon;
            return (
              <Paper
                key={step.title}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "16px",
                  bgcolor: cardBg,
                  border: cardBorder,
                  display: "flex",
                  gap: 1.75,
                  transition: "border-color 0.2s ease, transform 0.2s ease",
                  "&:hover": {
                    borderColor: ORANGE,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: 46,
                    height: 46,
                    flexShrink: 0,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: ORANGE,
                    bgcolor: dark
                      ? "rgba(245,124,0,0.16)"
                      : "rgba(245,124,0,0.1)",
                  }}
                >
                  <StepIcon />
                  <Box
                    sx={{
                      position: "absolute",
                      top: -6,
                      left: -6,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      bgcolor: ORANGE,
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `2px solid ${cardBg}`,
                    }}
                  >
                    {i + 1}
                  </Box>
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      font: "inherit",
                      fontWeight: 600,
                      fontSize: "15px",
                      color: heading,
                      mb: 0.5,
                    }}
                  >
                    {step.title}
                  </Typography>
                  <Typography
                    sx={{
                      font: "inherit",
                      fontSize: "13.5px",
                      color: subText,
                      lineHeight: 1.65,
                    }}
                  >
                    {step.body}
                  </Typography>
                </Box>
              </Paper>
            );
          })}
        </Box>

        {/* Supported formats */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: "16px",
            bgcolor: cardBg,
            border: cardBorder,
            mb: 4,
          }}
        >
          <Typography
            sx={{
              font: "inherit",
              fontWeight: 700,
              fontSize: "17px",
              color: heading,
              mb: 1.5,
            }}
          >
            Supported document formats
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {FORMATS.map((f) => (
              <Chip
                key={f}
                label={f}
                sx={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 600,
                  fontSize: "13px",
                  color: ORANGE,
                  bgcolor: dark
                    ? "rgba(245,124,0,0.16)"
                    : "rgba(245,124,0,0.1)",
                }}
              />
            ))}
          </Box>
          <Typography
            sx={{
              font: "inherit",
              fontSize: "13.5px",
              color: subText,
              mt: 1.5,
              lineHeight: 1.65,
            }}
          >
            Make sure your document is one of these formats before uploading to
            guarantee smooth processing.
          </Typography>
        </Paper>

        {/* Footer */}
        <Typography
          sx={{
            font: "inherit",
            textAlign: "center",
            fontWeight: 600,
            fontSize: "15px",
            color: heading,
          }}
        >
          Made with ❤️ by{" "}
          <a style={{ color: ORANGE }} href="https://sonnguyenhoang.com">
            Son Nguyen
          </a>
          . Thank you for using DocuThinker! 🚀
        </Typography>
      </Box>
    </Box>
  );
};

export default HowToUse;
