import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Divider,
  IconButton,
  Avatar,
} from "@mui/material";
import { Link } from "react-router-dom";
import { keyframes } from "@emotion/react";
import {
  ArrowBackIosNew,
  ArrowForwardIos,
  ArrowDownward,
  AutoAwesome,
  Bolt,
  Chat,
  CloudUpload,
  FactCheck,
  FormatListBulleted,
  Insights,
  Language,
  Security,
  Timeline,
  Tune,
  RecordVoiceOver,
  VerifiedUser,
  CheckCircle,
  RemoveCircleOutline,
  Groups,
} from "@mui/icons-material";

const slideUp = keyframes`
  from {
    transform: translateY(24px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const shimmer = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const fadeSwap = keyframes`
  0% {
    opacity: 0;
    transform: translateY(12px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const ambientShift = keyframes`
  0% {
    background-position: 0% 50%;
    opacity: 0.7;
  }
  50% {
    background-position: 100% 50%;
    opacity: 1;
  }
  100% {
    background-position: 0% 50%;
    opacity: 0.7;
  }
`;

const LandingPage = () => {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const clarityRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    if (media.addEventListener) {
      media.addEventListener("change", update);
    } else {
      media.addListener(update);
    }
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", update);
      } else {
        media.removeListener(update);
      }
    };
  }, []);

  const palette = useMemo(
    () => ({
      background: "#f7f2ec",
      surface: "#ffffff",
      surfaceAlt: "#fff6ea",
      surfaceMuted: "#fff0dd",
      textPrimary: "#141414",
      textSecondary: "#4b4b4b",
      textMuted: "#6d6d6d",
      accent: "#f57c00",
      accentDark: "#cc6600",
      accentSoft: "#ffe6cc",
      border: "#f0e2d3",
      shadow: "0 20px 40px rgba(20, 12, 4, 0.08)",
      shadowSoft: "0 12px 24px rgba(20, 12, 4, 0.08)",
    }),
    [],
  );

  const sectionTitleSx = {
    font: "inherit",
    fontWeight: 700,
    color: palette.textPrimary,
    fontSize: { xs: "1.85rem", md: "2.4rem" },
  };

  const sectionSubtitleSx = {
    font: "inherit",
    color: palette.textSecondary,
    fontSize: { xs: "1rem", md: "1.1rem" },
  };

  const sectionSpacing = { xs: 6, md: 10 };

  const metrics = [
    { label: "Supported files", value: "PDF / DOCX" },
    { label: "Import option", value: "Google Drive" },
    { label: "Summary modes", value: "Standard + bullet" },
    { label: "Analysis tools", value: "Sentiment + stats" },
  ];

  const heroHighlights = [
    "PDF / DOCX upload",
    "Google Drive import",
    "AI summary",
    "Bullet summary",
    "Sentiment analysis",
    "Document analytics",
    "Chat with selected text",
    "Voice chat (audio)",
    "Rewrite content",
    "Translate summary",
  ];

  const spotlights = [
    {
      title: "Instant summaries",
      description:
        "Generate a clean summary and a bullet-point summary from any PDF or DOCX.",
      points: [
        "Standard summary",
        "Bullet-point summary",
        "Copy results quickly",
      ],
      icon: <AutoAwesome />,
    },
    {
      title: "Document analysis",
      description:
        "Run sentiment analysis and view document analytics like word count and readability.",
      points: ["Sentiment score", "Readability stats", "Top terms + structure"],
      icon: <Insights />,
    },
    {
      title: "Ask, refine, rewrite",
      description:
        "Chat about the document, refine the summary, or rewrite selected text.",
      points: [
        "Chat with selected text",
        "Refine summary",
        "Rewrite content style",
      ],
      icon: <Chat />,
    },
  ];

  const pillars = [
    {
      title: "Summaries that read cleanly",
      description:
        "Standard summaries plus bullet-point views in a consistent format.",
      icon: <Insights />,
    },
    {
      title: "Analysis in one view",
      description:
        "Sentiment analysis and document statistics alongside the summary.",
      icon: <Bolt />,
    },
    {
      title: "Refine and rewrite",
      description: "Refine summaries or rewrite selected text to a new style.",
      icon: <VerifiedUser />,
    },
  ];

  const features = [
    {
      title: "Upload PDF / DOCX",
      description: "Upload from your device or pick a file from Google Drive.",
      icon: <CloudUpload />,
    },
    {
      title: "AI summary",
      description: "Generate a clean, readable summary of your document.",
      icon: <AutoAwesome />,
    },
    {
      title: "Bullet-point summary",
      description: "Create a fast, skimmable bullet version on demand.",
      icon: <FormatListBulleted />,
    },
    {
      title: "Refine or rewrite",
      description:
        "Refine the summary or rewrite selected text in a new style.",
      icon: <Tune />,
    },
    {
      title: "Chat with your document",
      description: "Ask questions or chat about selected text.",
      icon: <Chat />,
    },
    {
      title: "Voice chat",
      description: "Upload or record audio to get a voice response.",
      icon: <RecordVoiceOver />,
    },
    {
      title: "Sentiment analysis",
      description: "View sentiment scores and descriptions for your document.",
      icon: <FactCheck />,
    },
    {
      title: "Document analytics",
      description: "See word counts, readability metrics, and key term stats.",
      icon: <Insights />,
    },
    {
      title: "Summary in another language",
      description: "Generate a summary in a language you select.",
      icon: <Language />,
    },
  ];

  const workflow = [
    {
      title: "Upload",
      description:
        "Upload PDF/DOCX from your device or import from Google Drive.",
      icon: <CloudUpload />,
    },
    {
      title: "Summarize",
      description: "Generate a standard summary or a bullet-point summary.",
      icon: <AutoAwesome />,
    },
    {
      title: "Analyze",
      description:
        "Run sentiment analysis, document analytics, or chat about selections.",
      icon: <Groups />,
    },
    {
      title: "Refine",
      description:
        "Refine the summary or rewrite selected text in a new style.",
      icon: <Bolt />,
    },
  ];

  const outcomes = [
    {
      title: "Clear summaries",
      description: "Readable summaries generated from your document text.",
      icon: <CheckCircle />,
    },
    {
      title: "Bullet-point view",
      description: "A skimmable bullet summary for quick review.",
      icon: <Groups />,
    },
    {
      title: "Analysis at a glance",
      description: "Sentiment scores and document analytics in one place.",
      icon: <Timeline />,
    },
    {
      title: "Flexible outputs",
      description:
        "Refine summaries, rewrite text, or translate to another language.",
      icon: <FactCheck />,
    },
  ];

  const useCases = [
    {
      title: "Summarize documents",
      description: "Generate a standard summary and a bullet-point summary.",
      icon: <AutoAwesome />,
    },
    {
      title: "Analyze tone + structure",
      description: "Run sentiment analysis and view document analytics.",
      icon: <Insights />,
    },
    {
      title: "Chat and voice",
      description: "Ask questions with text chat or upload/record audio.",
      icon: <RecordVoiceOver />,
    },
    {
      title: "Refine and rewrite",
      description:
        "Refine the summary or rewrite selected text to a new style.",
      icon: <Tune />,
    },
  ];

  const testimonials = [
    {
      title: "Summaries and bullet points",
      description:
        "Generate a standard summary and a bullet-point summary on demand.",
    },
    {
      title: "Sentiment + analytics",
      description:
        "Review sentiment scores, readability, and document statistics.",
    },
    {
      title: "Chat + voice interactions",
      description:
        "Ask about selected text or upload/record audio for voice responses.",
    },
  ];

  const faqs = [
    {
      title: "What file types are supported?",
      description: "PDF and DOCX files are supported for document uploads.",
    },
    {
      title: "Can I import from Google Drive?",
      description:
        "Yes. Use the Google Drive picker to select files (read-only access).",
    },
    {
      title: "Can I create bullet-point summaries?",
      description:
        "Yes. Generate a bullet-point summary in addition to the standard summary.",
    },
    {
      title: "Does the app include sentiment analysis?",
      description:
        "Yes. Sentiment analysis is available in the summary workspace.",
    },
    {
      title: "Can I translate a summary?",
      description: "Yes. Generate a summary in a selected language.",
    },
    {
      title: "Does DocuThinker support voice interactions?",
      description: "Yes. Upload or record audio to receive a voice response.",
    },
  ];

  const integrations = [
    "PDF",
    "DOCX",
    "Google Drive import",
    "Audio upload",
    "Audio recording",
  ];

  useEffect(() => {
    if (reduceMotion) return undefined;
    const timer = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % spotlights.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [reduceMotion, spotlights.length]);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const timer = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [reduceMotion, testimonials.length]);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const elements = Array.from(document.querySelectorAll(".reveal"));
    if (elements.length === 0) return undefined;
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reduceMotion]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: palette.background,
        color: palette.textPrimary,
        position: "relative",
        overflow: "hidden",
        fontFamily: '"Poppins", sans-serif',
        "& *": {
          minWidth: 0,
          boxSizing: "border-box",
        },
        "& img, & svg": {
          maxWidth: "100%",
        },
        "& .MuiCard-root": {
          boxShadow: "0 6px 16px rgba(20, 12, 4, 0.06) !important",
          transition: reduceMotion
            ? "none"
            : "transform 0.6s ease, box-shadow 0.6s ease, border-color 0.6s ease",
          willChange: "transform, box-shadow",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 14px 30px rgba(20, 12, 4, 0.12)",
            borderColor: palette.accentSoft,
          },
        },
        "& .MuiChip-root": {
          transition: reduceMotion
            ? "none"
            : "transform 0.45s ease, box-shadow 0.45s ease, background-color 0.45s ease",
          willChange: "transform, box-shadow",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 10px 20px rgba(20, 12, 4, 0.1)",
            backgroundColor: palette.surfaceAlt,
          },
        },
        "& .reveal": {
          opacity: 0,
          transform: "translateY(16px)",
          transition: reduceMotion
            ? "none"
            : "opacity 0.6s ease, transform 0.6s ease",
        },
        "& .reveal.is-visible": {
          opacity: 1,
          transform: "translateY(0)",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 15% 10%, ${palette.accentSoft} 0%, transparent 55%),
            radial-gradient(circle at 85% 20%, rgba(245, 124, 0, 0.12) 0%, transparent 45%)`,
          opacity: 0.9,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(120deg, rgba(245, 124, 0, 0.85), rgba(255, 210, 160, 0.9), rgba(245, 124, 0, 0.6))",
          backgroundSize: "220% 220%",
          animation: reduceMotion
            ? "none"
            : `${ambientShift} 10s ease-in-out infinite`,
          pointerEvents: "none",
          mixBlendMode: "normal",
          filter: "saturate(1.2)",
        }}
      />

      <Container
        maxWidth="lg"
        sx={{ position: "relative", zIndex: 1, px: { xs: 2, sm: 3 } }}
      >
        {/* Hero */}
        <Box
          sx={{
            minHeight: { xs: "auto", md: "100svh" },
            display: "grid",
            placeItems: "center",
            py: { xs: 6, md: 0 },
          }}
        >
          <Grid
            container
            spacing={{ xs: 4, md: 6 }}
            alignItems="center"
            justifyContent="center"
            sx={{ transform: { xs: "none", md: "translateY(18px)" } }}
          >
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  animation: reduceMotion ? "none" : `${slideUp} 0.8s ease-out`,
                  textAlign: "left",
                }}
                className="reveal"
              >
                <Chip
                  label="DocuThinker AI Platform"
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    font: "inherit",
                    backgroundColor: palette.accentSoft,
                    color: palette.accent,
                  }}
                />
                <Typography
                  variant="h2"
                  sx={{
                    font: "inherit",
                    fontWeight: 700,
                    fontSize: { xs: "2.1rem", sm: "2.6rem", md: "3.6rem" },
                    lineHeight: 1.05,
                    mb: 2,
                    color: palette.textPrimary,
                    textAlign: "left",
                  }}
                >
                  Turn dense documents into clear, actionable decisions.
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    font: "inherit",
                    color: palette.textSecondary,
                    maxWidth: "560px",
                    fontSize: { xs: "1rem", md: "1.15rem" },
                    mb: 3,
                    textAlign: "left",
                  }}
                >
                  DocuThinker turns your documents into summaries, bullet
                  points, analytics, and chat or voice responses you can use
                  right away.
                </Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{
                    mb: 3,
                    justifyContent: "flex-start",
                    alignItems: { xs: "stretch", sm: "center" },
                  }}
                >
                  <Button
                    component={Link}
                    to="/home"
                    variant="contained"
                    size="large"
                    sx={{
                      backgroundColor: palette.accent,
                      font: "inherit",
                      fontWeight: 600,
                      px: 3,
                      boxShadow: "none",
                      "&:hover": {
                        backgroundColor: palette.accentDark,
                      },
                    }}
                  >
                    Get Started
                  </Button>
                  <Button
                    component={Link}
                    to="/how-to-use"
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: palette.accent,
                      color: palette.accent,
                      font: "inherit",
                      fontWeight: 600,
                      px: 3,
                      "&:hover": {
                        borderColor: palette.accent,
                        backgroundColor: palette.accentSoft,
                      },
                    }}
                  >
                    Product Tour
                  </Button>
                </Stack>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    justifyContent: "flex-start",
                  }}
                >
                  {heroHighlights.map((label) => (
                    <Chip
                      key={label}
                      label={label}
                      sx={{
                        mb: 1,
                        font: "inherit",
                        backgroundColor: palette.surface,
                        color: palette.textSecondary,
                        border: `1px solid ${palette.border}`,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  backgroundColor: palette.surface,
                  borderRadius: 4,
                  p: { xs: 2, sm: 3 },
                  boxShadow: palette.shadow,
                  position: "relative",
                  overflow: "hidden",
                  maxWidth: "100%",
                  mx: 0,
                  width: "100%",
                }}
                className="reveal"
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(120deg, ${palette.accentSoft}, transparent, ${palette.accentSoft})`,
                    opacity: 0.45,
                    animation: reduceMotion
                      ? "none"
                      : `${shimmer} 10s ease infinite`,
                  }}
                />
                <Box
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    display: "grid",
                    gap: 2,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      font: "inherit",
                      fontWeight: 600,
                      color: palette.textSecondary,
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    Live insight workspace
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: palette.surfaceAlt,
                      border: `1px solid ${palette.border}`,
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        font: "inherit",
                        fontWeight: 600,
                        color: palette.textPrimary,
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                      }}
                    >
                      Summary workspace
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        font: "inherit",
                        color: palette.textSecondary,
                        mb: 2,
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                      }}
                    >
                      Standard summary, bullet points, sentiment, and analytics
                      in one view.
                    </Typography>
                    <Divider sx={{ borderColor: palette.border }} />
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {metrics.map((metric) => (
                        <Grid item xs={12} sm={6} key={metric.label}>
                          <Typography
                            variant="h6"
                            sx={{
                              font: "inherit",
                              fontWeight: 700,
                              color: palette.accent,
                            }}
                          >
                            {metric.value}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ font: "inherit", color: palette.textMuted }}
                          >
                            {metric.label}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                  <Grid container spacing={2}>
                    {[Security, VerifiedUser].map((Icon, index) => (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        key={Icon.displayName || Icon.name}
                      >
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: palette.surface,
                            border: `1px solid ${palette.border}`,
                            minWidth: 0,
                          }}
                        >
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            sx={{ minWidth: 0 }}
                          >
                            <Avatar
                              sx={{ bgcolor: palette.accent, color: "white" }}
                            >
                              <Icon />
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  font: "inherit",
                                  fontWeight: 600,
                                  color: palette.textPrimary,
                                  wordBreak: "break-word",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {index === 0
                                  ? "Read-only Google Drive"
                                  : "Saved for signed-in users"}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  font: "inherit",
                                  color: palette.textSecondary,
                                  wordBreak: "break-word",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {index === 0
                                  ? "Connect Drive to pick files with read-only access."
                                  : "Documents may be stored for later access when signed in."}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            </Grid>
          </Grid>
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              mt: { xs: 4, md: 6 },
            }}
          >
            <Button
              variant="outlined"
              size="large"
              onClick={() =>
                clarityRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
              endIcon={<ArrowDownward />}
              sx={{
                borderColor: palette.accent,
                color: palette.accent,
                font: "inherit",
                fontWeight: 600,
                px: 4,
                "&:hover": {
                  borderColor: palette.accentDark,
                  backgroundColor: palette.accentSoft,
                },
              }}
            >
              Learn more
            </Button>
          </Box>
        </Box>

        {/* Pillars */}
        <Box sx={{ mt: sectionSpacing }} ref={clarityRef}>
          <Typography
            variant="h4"
            sx={{ ...sectionTitleSx, textAlign: "center", mb: 2 }}
            className="reveal"
          >
            Professional clarity at scale
          </Typography>
          <Typography
            variant="body1"
            sx={{
              ...sectionSubtitleSx,
              textAlign: "center",
              maxWidth: "720px",
              mx: "auto",
              mb: 4,
            }}
            className="reveal"
          >
            Grounded in the features available today: summaries, bullet points,
            analytics, and chat.
          </Typography>
          <Grid container spacing={3}>
            {pillars.map((pillar) => (
              <Grid item xs={12} md={4} key={pillar.title}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    border: `1px solid ${palette.border}`,
                    backgroundColor: palette.surface,
                    boxShadow: "none",
                  }}
                  className="reveal"
                >
                  <CardContent>
                    <Avatar
                      sx={{ bgcolor: palette.accent, color: "white", mb: 2 }}
                    >
                      {pillar.icon}
                    </Avatar>
                    <Typography
                      variant="h6"
                      sx={{
                        font: "inherit",
                        fontWeight: 600,
                        mb: 1,
                        color: palette.textPrimary,
                      }}
                    >
                      {pillar.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ font: "inherit", color: palette.textSecondary }}
                    >
                      {pillar.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Spotlight */}
        <Box
          sx={{
            mt: sectionSpacing,
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            backgroundColor: palette.surface,
            border: `1px solid ${palette.border}`,
            boxShadow: palette.shadowSoft,
            position: "relative",
            overflow: "hidden",
          }}
          className="reveal"
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(120deg, ${palette.accentSoft}, transparent, ${palette.accentSoft})`,
              opacity: 0.35,
            }}
          />
          <Grid
            container
            spacing={{ xs: 3, md: 4 }}
            alignItems="center"
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Grid item xs={12} md={6}>
              <Typography
                variant="h4"
                sx={{ ...sectionTitleSx, mb: 2 }}
                className="reveal"
              >
                Capability spotlight
              </Typography>
              <Typography
                variant="body1"
                sx={{ ...sectionSubtitleSx, mb: 3 }}
                className="reveal"
              >
                See how DocuThinker brings clarity to complex documents through
                key features.
              </Typography>
              <Box
                key={spotlightIndex}
                sx={{
                  animation: reduceMotion
                    ? "none"
                    : `${fadeSwap} 0.6s ease-out`,
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  sx={{ mb: 2 }}
                >
                  <Avatar sx={{ bgcolor: palette.accent, color: "white" }}>
                    {spotlights[spotlightIndex].icon}
                  </Avatar>
                  <Typography
                    variant="h6"
                    sx={{
                      font: "inherit",
                      fontWeight: 600,
                      color: palette.textPrimary,
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {spotlights[spotlightIndex].title}
                  </Typography>
                </Stack>
                <Typography
                  variant="body1"
                  sx={{
                    ...sectionSubtitleSx,
                    mb: 2,
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {spotlights[spotlightIndex].description}
                </Typography>
                <Stack spacing={1} sx={{ minWidth: 0 }}>
                  {spotlights[spotlightIndex].points.map((point) => (
                    <Stack
                      key={point}
                      direction="row"
                      spacing={1.5}
                      alignItems="flex-start"
                      sx={{ minWidth: 0 }}
                    >
                      <CheckCircle
                        fontSize="small"
                        sx={{ color: palette.accent }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          font: "inherit",
                          color: palette.textSecondary,
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {point}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
              <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                <IconButton
                  aria-label="Previous spotlight"
                  onClick={() =>
                    setSpotlightIndex(
                      (prev) =>
                        (prev - 1 + spotlights.length) % spotlights.length,
                    )
                  }
                  sx={{
                    border: `1px solid ${palette.border}`,
                    color: palette.textPrimary,
                  }}
                >
                  <ArrowBackIosNew fontSize="small" />
                </IconButton>
                <IconButton
                  aria-label="Next spotlight"
                  onClick={() =>
                    setSpotlightIndex((prev) => (prev + 1) % spotlights.length)
                  }
                  sx={{
                    border: `1px solid ${palette.border}`,
                    color: palette.textPrimary,
                  }}
                >
                  <ArrowForwardIos fontSize="small" />
                </IconButton>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={2} sx={{ minWidth: 0 }}>
                {features.slice(0, 3).map((feature) => (
                  <Card
                    key={feature.title}
                    sx={{
                      width: "100%",
                      borderRadius: 3,
                      border: `1px solid ${palette.border}`,
                      backgroundColor: palette.surfaceAlt,
                      boxShadow: "none",
                    }}
                    className="reveal"
                  >
                    <CardContent>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        sx={{ minWidth: 0 }}
                      >
                        <Avatar
                          sx={{ bgcolor: palette.accent, color: "white" }}
                        >
                          {feature.icon}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              font: "inherit",
                              fontWeight: 600,
                              color: palette.textPrimary,
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {feature.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              font: "inherit",
                              color: palette.textSecondary,
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {feature.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Features */}
        <Box sx={{ mt: sectionSpacing }}>
          <Typography
            variant="h4"
            sx={{ ...sectionTitleSx, textAlign: "center", mb: 2 }}
            className="reveal"
          >
            Everything you need to move faster
          </Typography>
          <Typography
            variant="body1"
            sx={{
              ...sectionSubtitleSx,
              textAlign: "center",
              maxWidth: "720px",
              mx: "auto",
              mb: 4,
            }}
            className="reveal"
          >
            Built for clarity, accessibility, and shared understanding across
            teams.
          </Typography>
          <Grid container spacing={3}>
            {features.map((feature) => (
              <Grid item xs={12} md={4} key={feature.title}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    border: `1px solid ${palette.border}`,
                    boxShadow: "none",
                    backgroundColor: palette.surface,
                  }}
                  className="reveal"
                >
                  <CardContent>
                    <Avatar
                      sx={{ bgcolor: palette.accent, color: "white", mb: 2 }}
                    >
                      {feature.icon}
                    </Avatar>
                    <Typography
                      variant="h6"
                      sx={{
                        font: "inherit",
                        fontWeight: 600,
                        mb: 1,
                        color: palette.textPrimary,
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ font: "inherit", color: palette.textSecondary }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Workflow */}
        <Box sx={{ mt: sectionSpacing }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={4}>
              <Typography
                variant="h4"
                sx={{ ...sectionTitleSx, mb: 2 }}
                className="reveal"
              >
                A workflow that mirrors the app
              </Typography>
              <Typography
                variant="body1"
                sx={sectionSubtitleSx}
                className="reveal"
              >
                Upload, summarize, analyze, and refine in the same workspace.
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={3}>
                {workflow.map((step, index) => (
                  <Grid item xs={12} sm={6} key={step.title}>
                    <Card
                      sx={{
                        height: "100%",
                        borderRadius: 3,
                        border: `1px solid ${palette.border}`,
                        backgroundColor: palette.surfaceAlt,
                        boxShadow: "none",
                      }}
                      className="reveal"
                    >
                      <CardContent>
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          sx={{ mb: 2 }}
                        >
                          <Avatar
                            sx={{ bgcolor: palette.accent, color: "white" }}
                          >
                            {step.icon}
                          </Avatar>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              font: "inherit",
                              fontWeight: 600,
                              color: palette.textPrimary,
                            }}
                          >
                            {index + 1}. {step.title}
                          </Typography>
                        </Stack>
                        <Typography
                          variant="body2"
                          sx={{ font: "inherit", color: palette.textSecondary }}
                        >
                          {step.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Box>

        {/* Outcomes */}
        <Box sx={{ mt: sectionSpacing }}>
          <Typography
            variant="h4"
            sx={{ ...sectionTitleSx, textAlign: "center", mb: 3 }}
            className="reveal"
          >
            Outputs available in the app
          </Typography>
          <Grid container spacing={3}>
            {outcomes.map((item) => (
              <Grid item xs={12} md={3} key={item.title}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    border: `1px solid ${palette.border}`,
                    backgroundColor: palette.surface,
                    boxShadow: "none",
                  }}
                  className="reveal"
                >
                  <CardContent>
                    <Avatar
                      sx={{ bgcolor: palette.accent, color: "white", mb: 2 }}
                    >
                      {item.icon}
                    </Avatar>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        font: "inherit",
                        fontWeight: 600,
                        mb: 1,
                        color: palette.textPrimary,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ font: "inherit", color: palette.textSecondary }}
                    >
                      {item.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Comparison */}
        <Box sx={{ mt: sectionSpacing }}>
          <Typography
            variant="h4"
            sx={{ ...sectionTitleSx, textAlign: "center", mb: 3 }}
            className="reveal"
          >
            Manual vs DocuThinker workflow
          </Typography>
          <Grid container spacing={3}>
            {["Manual workflow", "DocuThinker workflow"].map((title, index) => (
              <Grid item xs={12} md={6} key={title}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    border: `1px solid ${palette.border}`,
                    backgroundColor:
                      index === 0 ? palette.surface : palette.accent,
                    color: index === 0 ? palette.textPrimary : "white",
                    boxShadow: "none",
                  }}
                  className="reveal"
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{
                        font: "inherit",
                        fontWeight: 700,
                        mb: 2,
                        color: index === 0 ? palette.textPrimary : "white",
                      }}
                    >
                      {title}
                    </Typography>
                    <Stack spacing={1.5}>
                      {(index === 0
                        ? [
                            "Manual reading and highlighting",
                            "Copying notes across tools",
                            "No built-in sentiment or analytics",
                            "Hard to refine or rewrite quickly",
                          ]
                        : [
                            "Upload PDF/DOCX or import from Google Drive",
                            "Generate summary + bullet summary",
                            "Run sentiment analysis and document analytics",
                            "Chat, refine, rewrite, or use voice responses",
                          ]
                      ).map((item) => (
                        <Stack
                          key={item}
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                        >
                          {index === 0 ? (
                            <RemoveCircleOutline
                              fontSize="small"
                              sx={{ color: palette.textMuted }}
                            />
                          ) : (
                            <CheckCircle
                              fontSize="small"
                              sx={{ color: "white" }}
                            />
                          )}
                          <Typography
                            variant="body2"
                            sx={{
                              font: "inherit",
                              color:
                                index === 0 ? palette.textSecondary : "white",
                            }}
                          >
                            {item}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Supported Inputs */}
        <Box sx={{ mt: sectionSpacing, textAlign: "center" }}>
          <Typography
            variant="h4"
            sx={{ ...sectionTitleSx, mb: 2 }}
            className="reveal"
          >
            Supported inputs
          </Typography>
          <Typography
            variant="body1"
            sx={{ ...sectionSubtitleSx, mb: 3, maxWidth: "720px", mx: "auto" }}
            className="reveal"
          >
            Upload PDF/DOCX files or use Google Drive. Voice chat supports audio
            upload or recording.
          </Typography>
          <Stack
            direction="row"
            spacing={2}
            sx={{ flexWrap: "wrap", justifyContent: "center" }}
          >
            {integrations.map((label) => (
              <Chip
                key={label}
                label={label}
                sx={{
                  font: "inherit",
                  backgroundColor: palette.surface,
                  border: `1px solid ${palette.border}`,
                  color: palette.textSecondary,
                }}
                className="reveal"
              />
            ))}
          </Stack>
        </Box>

        {/* Use cases */}
        <Box sx={{ mt: sectionSpacing }}>
          <Typography
            variant="h4"
            sx={{ ...sectionTitleSx, textAlign: "center", mb: 3 }}
            className="reveal"
          >
            What you can do right now
          </Typography>
          <Grid container spacing={3}>
            {useCases.map((useCase) => (
              <Grid item xs={12} md={3} key={useCase.title}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    border: `1px solid ${palette.border}`,
                    backgroundColor: palette.surface,
                    boxShadow: "none",
                  }}
                  className="reveal"
                >
                  <CardContent>
                    <Avatar
                      sx={{ bgcolor: palette.accent, color: "white", mb: 2 }}
                    >
                      {useCase.icon}
                    </Avatar>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        font: "inherit",
                        fontWeight: 600,
                        mb: 1,
                        color: palette.textPrimary,
                      }}
                    >
                      {useCase.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ font: "inherit", color: palette.textSecondary }}
                    >
                      {useCase.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* In-app workflows */}
        <Box sx={{ mt: sectionSpacing }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h4"
                sx={{ ...sectionTitleSx, mb: 2 }}
                className="reveal"
              >
                Inside the workspace
              </Typography>
              <Typography
                variant="body1"
                sx={{ ...sectionSubtitleSx, mb: 3 }}
                className="reveal"
              >
                Everything below reflects features available in the app today.
              </Typography>
              <Box
                key={testimonialIndex}
                sx={{
                  animation: reduceMotion
                    ? "none"
                    : `${fadeSwap} 0.6s ease-out`,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    font: "inherit",
                    fontWeight: 600,
                    mb: 2,
                    color: palette.textPrimary,
                  }}
                >
                  {testimonials[testimonialIndex].title}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ font: "inherit", color: palette.textSecondary }}
                >
                  {testimonials[testimonialIndex].description}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                <IconButton
                  aria-label="Previous testimonial"
                  onClick={() =>
                    setTestimonialIndex(
                      (prev) =>
                        (prev - 1 + testimonials.length) % testimonials.length,
                    )
                  }
                  sx={{
                    border: `1px solid ${palette.border}`,
                    color: palette.textPrimary,
                  }}
                >
                  <ArrowBackIosNew fontSize="small" />
                </IconButton>
                <IconButton
                  aria-label="Next testimonial"
                  onClick={() =>
                    setTestimonialIndex(
                      (prev) => (prev + 1) % testimonials.length,
                    )
                  }
                  sx={{
                    border: `1px solid ${palette.border}`,
                    color: palette.textPrimary,
                  }}
                >
                  <ArrowForwardIos fontSize="small" />
                </IconButton>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  borderRadius: 4,
                  border: `1px solid ${palette.border}`,
                  backgroundColor: palette.surface,
                  boxShadow: "none",
                }}
                className="reveal"
              >
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      font: "inherit",
                      fontWeight: 600,
                      mb: 2,
                      color: palette.textPrimary,
                    }}
                  >
                    Data handling (from Privacy Policy)
                  </Typography>
                  <Stack spacing={2}>
                    {[
                      "Signed-in documents may be stored for later access.",
                      "Guest uploads are processed but not stored.",
                      "Google Drive access is read-only for file selection.",
                    ].map((item) => (
                      <Stack
                        key={item}
                        direction="row"
                        spacing={2}
                        alignItems="center"
                      >
                        <Avatar
                          sx={{
                            bgcolor: palette.accent,
                            color: "white",
                            width: 32,
                            height: 32,
                          }}
                        >
                          <Security fontSize="small" />
                        </Avatar>
                        <Typography
                          variant="body2"
                          sx={{ font: "inherit", color: palette.textSecondary }}
                        >
                          {item}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* FAQ */}
        <Box sx={{ mt: sectionSpacing }}>
          <Typography
            variant="h4"
            sx={{ ...sectionTitleSx, textAlign: "center", mb: 4 }}
            className="reveal"
          >
            Answers at a glance
          </Typography>
          <Grid container spacing={3}>
            {faqs.map((faq) => (
              <Grid item xs={12} md={6} key={faq.title}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    border: `1px solid ${palette.border}`,
                    backgroundColor: palette.surface,
                    boxShadow: "none",
                  }}
                  className="reveal"
                >
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        font: "inherit",
                        fontWeight: 600,
                        mb: 1,
                        color: palette.textPrimary,
                      }}
                    >
                      {faq.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ font: "inherit", color: palette.textSecondary }}
                    >
                      {faq.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* CTA */}
        <Box
          sx={{
            mt: sectionSpacing,
            mb: { xs: 6, md: 10 },
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            background: `linear-gradient(135deg, ${palette.accent}, #ff9d3f)`,
            color: "white",
            textAlign: "center",
            boxShadow: palette.shadow,
          }}
          className="reveal"
        >
          <Typography
            variant="h4"
            sx={{
              font: "inherit",
              fontWeight: 700,
              mb: 2,
              color: "white",
              fontSize: { xs: "1.75rem", sm: "2.05rem", md: "2.35rem" },
            }}
          >
            Ready to make documents instantly useful?
          </Typography>
          <Typography
            variant="body1"
            sx={{ font: "inherit", mb: 3, color: "white" }}
          >
            Start now and experience how DocuThinker turns information into
            action.
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              component={Link}
              to="/home"
              variant="contained"
              size="large"
              sx={{
                backgroundColor: "white",
                color: palette.accent,
                font: "inherit",
                fontWeight: 700,
                "&:hover": {
                  backgroundColor: "#fff3e0",
                },
              }}
            >
              Get Started
            </Button>
            <Button
              component={Link}
              to="/register"
              variant="outlined"
              size="large"
              sx={{
                borderColor: "white",
                color: "white",
                font: "inherit",
                fontWeight: 700,
                "&:hover": {
                  borderColor: "white",
                  backgroundColor: "rgba(255,255,255,0.15)",
                },
              }}
            >
              Create Account
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;
