import React, {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { Link } from "react-router-dom";
import { keyframes } from "@emotion/react";
import {
  ArrowBackIosNew,
  ArrowForwardIos,
  ArrowDownward,
  ArrowForward,
  PlayCircleOutline,
  ExpandMore,
  AutoStories,
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

// The react-three-fiber scene is heavy (three.js core). Load it lazily so the
// first paint of the hero copy never waits on the 3D bundle.
const HeroExperience = lazy(() => import("../components/three/HeroExperience"));

const slideUp = keyframes`
  from { transform: translateY(24px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const fadeSwap = keyframes`
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const bounceHint = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
`;

const textShimmer = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
`;

const marquee = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
`;

const marqueeReverse = keyframes`
  from { transform: translateX(-50%); }
  to { transform: translateX(0); }
`;

const LandingPage = () => {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const clarityRef = useRef(null);
  // Normalized scroll progress (0 at top → 1 at bottom). Held in a ref and read
  // inside the r3f render loop so scroll updates never trigger React re-renders.
  const scrollRef = useRef(0);

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

  // Dark, cinematic palette: the whole page floats over a single full-page 3D
  // canvas. The scene shows through the open areas (hero, CTA, the gaps between
  // sections), but content surfaces themselves are SOLID dark panels — opaque,
  // not see-through — so cards and copy stay crisp and readable.
  const palette = useMemo(
    () => ({
      background: "#0c0805",
      surface: "#1a130b",
      surfaceAlt: "#1f1710",
      surfaceMuted: "#15100a",
      textPrimary: "#fbf2e6",
      textSecondary: "rgba(251, 242, 230, 0.74)",
      textMuted: "rgba(251, 242, 230, 0.55)",
      accent: "#ff8a1e",
      accentDark: "#ff6a00",
      accentSoft: "rgba(255, 176, 102, 0.22)",
      border: "rgba(255, 196, 138, 0.16)",
      shadow: "0 30px 60px rgba(0, 0, 0, 0.5)",
      shadowSoft: "0 18px 40px rgba(0, 0, 0, 0.4)",
      // Dark / hero tokens
      heroBg: "#0c0805",
      heroText: "#fbf2e6",
      heroMuted: "rgba(251, 242, 230, 0.66)",
      heroGlass: "rgba(255, 244, 230, 0.06)",
      heroGlassBorder: "rgba(255, 196, 138, 0.22)",
    }),
    [],
  );

  // Distinctive display serif for headlines (loaded in index.css). It nods to
  // the product's subject — documents and typography — and reads as premium
  // against the Poppins body copy.
  const displayFont = '"Fraunces", "Poppins", serif';

  const sectionTitleSx = {
    fontFamily: displayFont,
    fontWeight: 600,
    color: palette.textPrimary,
    fontSize: { xs: "2.1rem", md: "2.9rem" },
    letterSpacing: "-0.015em",
    lineHeight: 1.08,
  };

  const sectionSubtitleSx = {
    font: "inherit",
    color: palette.textSecondary,
    fontSize: { xs: "1rem", md: "1.12rem" },
    lineHeight: 1.6,
  };

  const sectionSpacing = { xs: 9, md: 16 };

  const lightCardSx = {
    height: "100%",
    borderRadius: "20px",
    border: `1px solid ${palette.border}`,
    backgroundColor: palette.surface,
    boxShadow: "none",
  };

  // Small editorial eyebrow label with rules.
  const Eyebrow = ({ label, light, align = "center" }) => (
    <Stack
      direction="row"
      spacing={1.25}
      alignItems="center"
      justifyContent={align === "center" ? "center" : "flex-start"}
      sx={{ mb: 2 }}
    >
      <Box
        sx={{
          width: 26,
          height: "2px",
          backgroundColor: light ? "#ffb066" : palette.accent,
          opacity: 0.8,
        }}
      />
      <Typography
        sx={{
          font: "inherit",
          fontWeight: 600,
          fontSize: "0.78rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: light ? "#ffb066" : palette.accent,
        }}
      >
        {label}
      </Typography>
      {align === "center" && (
        <Box
          sx={{
            width: 26,
            height: "2px",
            backgroundColor: light ? "#ffb066" : palette.accent,
            opacity: 0.8,
          }}
        />
      )}
    </Stack>
  );

  // Rounded-square icon tile (replaces the round avatars for a more modern feel).
  const IconTile = ({ children, large }) => (
    <Box
      sx={{
        width: large ? 58 : 48,
        height: large ? 58 : 48,
        borderRadius: "16px",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        color: "#ffd9a8",
        background: "rgba(255,138,26,0.14)",
        border: "1px solid rgba(255,196,138,0.28)",
        "& .MuiSvgIcon-root": { fontSize: large ? "1.7rem" : "1.4rem" },
      }}
    >
      {children}
    </Box>
  );

  const stats = [
    { value: "10+", label: "File types supported" },
    { value: "9", label: "AI tools in one place" },
    { value: "1", label: "Connected workspace" },
    { value: "0", label: "Setup required" },
  ];

  const heroHighlights = [
    "PDF + Word upload",
    "CSV / JSON tables",
    "AI summaries",
    "Bullet points",
    "Sentiment analysis",
    "Document chat",
    "Voice responses",
    "Rewrite + translate",
    "Google Drive import",
  ];

  const spotlights = [
    {
      title: "Instant summaries",
      description:
        "Generate a clean summary and a bullet-point summary from supported documents, tables, and text files.",
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
        "Standard summaries plus bullet-point views in a consistent, copy-ready format.",
      icon: <Insights />,
    },
    {
      title: "Analysis in one view",
      description:
        "Sentiment analysis and document statistics sit right alongside the summary.",
      icon: <Bolt />,
    },
    {
      title: "Refine and rewrite",
      description:
        "Refine summaries or rewrite selected text into a new tone or style in seconds.",
      icon: <VerifiedUser />,
    },
  ];

  const features = [
    {
      title: "Upload more than PDFs",
      description:
        "PDF, Word, Markdown, HTML, CSV/TSV, JSON, plain text, logs, and code/config files — all welcome.",
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
      description: "Refine the summary or rewrite selected text in a new style.",
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
        "Upload documents, tables, text, or code from your device, or import supported files from Google Drive.",
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
      description: "Refine the summary or rewrite selected text in a new style.",
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
      description: "Refine the summary or rewrite selected text to a new style.",
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
      description:
        "Uploads support PDF, Word (.docx), Markdown, HTML, CSV/TSV, JSON, plain text, logs, XML/YAML, and common code/config files.",
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
    "Word (.docx)",
    "Markdown",
    "HTML",
    "CSV / TSV",
    "JSON",
    "Plain text",
    "Logs",
    "XML / YAML",
    "Code files",
    "Google Drive",
    "Audio upload",
    "Voice recording",
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
    const elements = Array.from(document.querySelectorAll(".reveal"));
    if (reduceMotion) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return undefined;
    }
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
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reduceMotion]);

  // Track page scroll as 0→1 progress for the full-page 3D background's camera.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollRef.current =
        max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const scrollToClarity = () =>
    clarityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: palette.background,
        color: palette.textPrimary,
        position: "relative",
        // `clip` (not `hidden`) keeps horizontal overflow contained WITHOUT
        // turning this box into a scroll container — which would break the
        // `position: sticky` full-page 3D background below.
        overflowX: "clip",
        fontFamily: '"Poppins", sans-serif',
        "& *": { minWidth: 0, boxSizing: "border-box" },
        "& img, & svg": { maxWidth: "100%" },
        "& .MuiCard-root": {
          transition: reduceMotion
            ? "none"
            : "transform 0.45s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.45s ease, border-color 0.45s ease",
          willChange: "transform, box-shadow",
          "&:hover": {
            transform: "translateY(-6px)",
            boxShadow: palette.shadowSoft,
            borderColor: "rgba(245, 124, 0, 0.4)",
          },
        },
        "& .MuiChip-root": {
          transition: reduceMotion
            ? "none"
            : "transform 0.45s ease, box-shadow 0.45s ease, background-color 0.45s ease, border-color 0.45s ease",
          willChange: "transform, box-shadow",
        },
        "& .reveal": {
          opacity: 0,
          transform: "translateY(20px)",
          transition: reduceMotion
            ? "none"
            : "opacity 0.7s ease, transform 0.7s cubic-bezier(0.2,0.8,0.2,1)",
        },
        "& .reveal.is-visible": { opacity: 1, transform: "translateY(0)" },
      }}
    >
      {/* ===================== Full-page 3D background (sticky) =====================
          One persistent canvas pinned to the viewport for the entire scroll. Its
          camera dollies down through the scene as the page scrolls (driven by
          `scrollRef`), so the 3D reacts continuously instead of being boxed into
          the hero and CTA. Content below floats on top via a negative margin. */}
      <Box
        aria-hidden="true"
        sx={{
          position: "sticky",
          top: 0,
          height: "100svh",
          zIndex: 0,
          overflow: "hidden",
          pointerEvents: "none",
          backgroundColor: palette.heroBg,
        }}
      >
        <Suspense
          fallback={
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 58% 42%, rgba(255,138,26,0.45), rgba(255,77,0,0.14) 30%, #0c0805 62%)",
              }}
            />
          }
        >
          <HeroExperience reduceMotion={reduceMotion} scrollRef={scrollRef} />
        </Suspense>

        {/* Global vignette so light text stays legible over the moving scene */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 120% 90% at 50% 50%, rgba(10,6,3,0) 42%, rgba(10,6,3,0.5) 100%)",
          }}
        />
        {/* Fine grain for filmic depth */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.06,
            mixBlendMode: "overlay",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </Box>

      {/* ===================== Foreground content (floats over the 3D) ===================== */}
      <Box sx={{ position: "relative", zIndex: 1, mt: "-100svh" }}>
        {/* ===================== Cinematic hero ===================== */}
        <Box
          component="section"
          sx={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            minHeight: { xs: "94svh", md: "100svh" },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Center scrim so the headline reads over the glowing core */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse 130% 95% at 50% 44%, rgba(10,6,3,0.66) 0%, rgba(10,6,3,0.30) 38%, rgba(10,6,3,0) 72%)",
          }}
        />

        {/* Slim brand bar (the global navbar is hidden on the landing route) */}
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 3 }}>
          <Container
            maxWidth="lg"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: { xs: 2.25, md: 3.25 },
              px: { xs: 2, sm: 3 },
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "9px",
                  background: `linear-gradient(135deg, ${palette.accent}, #ffb066)`,
                  boxShadow: "0 6px 18px rgba(245,124,0,0.5)",
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  "& .MuiSvgIcon-root": { fontSize: "1.15rem" },
                }}
                aria-hidden="true"
              >
                <AutoStories />
              </Box>
              <Typography
                sx={{
                  fontFamily: displayFont,
                  fontWeight: 600,
                  fontSize: "1.25rem",
                  color: palette.heroText,
                  letterSpacing: "-0.01em",
                }}
              >
                DocuThinker
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                component={Link}
                to="/login"
                sx={{
                  display: { xs: "none", sm: "inline-flex" },
                  font: "inherit",
                  fontWeight: 500,
                  color: palette.heroMuted,
                  textTransform: "none",
                  "&:hover": {
                    color: palette.heroText,
                    backgroundColor: "rgba(255,255,255,0.04)",
                  },
                }}
              >
                Log in
              </Button>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                sx={{
                  backgroundColor: palette.accent,
                  font: "inherit",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: "999px",
                  px: 2.5,
                  boxShadow: "0 8px 22px rgba(245,124,0,0.4)",
                  "&:hover": { backgroundColor: palette.accentDark },
                }}
              >
                Get Started
              </Button>
            </Stack>
          </Container>
        </Box>

        {/* Hero content */}
        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 2,
            px: { xs: 2, sm: 3 },
            py: { xs: 12, md: 6 },
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              maxWidth: 920,
              mx: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              animation: reduceMotion ? "none" : `${slideUp} 0.9s ease-out both`,
            }}
          >
            <Chip
              label="AI document workspace"
              icon={<AutoAwesome sx={{ fontSize: "1rem !important" }} />}
              sx={{
                mb: 3,
                fontWeight: 600,
                font: "inherit",
                color: "#ffd9a8",
                backgroundColor: palette.heroGlass,
                border: `1px solid ${palette.heroGlassBorder}`,
                backdropFilter: "blur(8px)",
                "& .MuiChip-icon": { color: "#ffb066" },
              }}
            />
            <Typography
              component="h1"
              sx={{
                fontFamily: displayFont,
                fontWeight: 600,
                fontSize: { xs: "2.6rem", sm: "3.6rem", md: "5rem" },
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: palette.heroText,
                mb: 2.5,
                px: { xs: 1, sm: 0 },
                pb: "0.12em",
                textShadow: "0 2px 30px rgba(0,0,0,0.45)",
              }}
            >
              Every document,
              <br />
              instantly{" "}
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  pr: "0.14em",
                  background:
                    "linear-gradient(90deg, #ff8a1e 0%, #ffd27f 45%, #ff6a00 90%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                  animation: reduceMotion
                    ? "none"
                    : `${textShimmer} 6s linear infinite`,
                  fontStyle: "italic",
                }}
              >
                understood
              </Box>
              .
            </Typography>
            <Typography
              sx={{
                font: "inherit",
                color: palette.heroMuted,
                maxWidth: 640,
                fontSize: { xs: "1.05rem", md: "1.2rem" },
                lineHeight: 1.6,
                mb: 4,
              }}
            >
              Upload PDFs, Word, Markdown, CSV, JSON, code, and more — then
              summarize, analyze, chat, rewrite, translate, and reply by voice,
              all in one intelligent workspace.
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{
                mb: 4,
                width: { xs: "100%", sm: "auto" },
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Button
                component={Link}
                to="/register"
                variant="contained"
                size="large"
                endIcon={<Bolt />}
                sx={{
                  backgroundColor: palette.accent,
                  font: "inherit",
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "1.05rem",
                  px: 4,
                  py: 1.3,
                  borderRadius: "999px",
                  boxShadow: "0 12px 34px rgba(245,124,0,0.45)",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                  "&:hover": {
                    backgroundColor: palette.accentDark,
                    transform: "translateY(-2px)",
                    boxShadow: "0 18px 44px rgba(245,124,0,0.55)",
                  },
                }}
              >
                Start for free
              </Button>
              <Button
                component={Link}
                to="/how-to-use"
                variant="outlined"
                size="large"
                startIcon={<PlayCircleOutline />}
                sx={{
                  borderColor: palette.heroGlassBorder,
                  color: palette.heroText,
                  font: "inherit",
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "1.05rem",
                  px: 4,
                  py: 1.3,
                  borderRadius: "999px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  backdropFilter: "blur(6px)",
                  "&:hover": {
                    borderColor: "#ffb066",
                    backgroundColor: "rgba(255,138,26,0.1)",
                  },
                }}
              >
                Take the tour
              </Button>
              {/* Text button that scrolls to the content below — replaces the
                  old floating arrow that collided with the stats card. */}
              <Button
                onClick={scrollToClarity}
                variant="text"
                size="large"
                startIcon={<ArrowDownward />}
                aria-label="Scroll to learn more"
                sx={{
                  color: palette.heroMuted,
                  font: "inherit",
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "1.05rem",
                  px: 2.5,
                  py: 1.3,
                  borderRadius: "999px",
                  "& .MuiButton-startIcon": {
                    animation: reduceMotion
                      ? "none"
                      : `${bounceHint} 2.2s ease-in-out infinite`,
                  },
                  "&:hover": {
                    color: palette.heroText,
                    backgroundColor: "rgba(255,255,255,0.05)",
                  },
                }}
              >
                Scroll to explore
              </Button>
            </Stack>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                justifyContent: "center",
                maxWidth: 720,
              }}
            >
              {heroHighlights.map((label) => (
                <Chip
                  key={label}
                  label={label}
                  size="small"
                  sx={{
                    font: "inherit",
                    color: palette.heroMuted,
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    backdropFilter: "blur(6px)",
                    "&:hover": {
                      color: palette.heroText,
                      borderColor: palette.heroGlassBorder,
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Container>

      </Box>

      <Container
        maxWidth="lg"
        sx={{ position: "relative", zIndex: 2, px: { xs: 2, sm: 3 } }}
      >
        {/* Floating stats band. On desktop it overlaps up into the hero for a
            "floating" feel; on mobile that overlap collided with the hero's
            scroll-cue arrow, so it sits clear below the hero instead. */}
        <Box
          ref={clarityRef}
          sx={{
            mt: { xs: 5, md: -9 },
            position: "relative",
            zIndex: 3,
            borderRadius: "24px",
            backgroundColor: palette.surface,
            border: `1px solid ${palette.border}`,
            boxShadow: palette.shadow,
            p: { xs: 3, md: 4 },
          }}
          className="reveal"
        >
          <Grid container spacing={2}>
            {stats.map((stat, i) => (
              <Grid item xs={6} md={3} key={stat.label}>
                <Box
                  sx={{
                    textAlign: "center",
                    py: { xs: 1, md: 0.5 },
                    borderLeft: {
                      md:
                        i === 0
                          ? "none"
                          : `1px solid ${palette.border}`,
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: displayFont,
                      fontWeight: 600,
                      fontSize: { xs: "2rem", md: "2.6rem" },
                      lineHeight: 1,
                      background: `linear-gradient(135deg, ${palette.accent}, #ffab5e)`,
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      color: "transparent",
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    sx={{
                      font: "inherit",
                      mt: 0.75,
                      fontSize: { xs: "0.78rem", md: "0.9rem" },
                      color: palette.textMuted,
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Pillars */}
        <Box sx={{ mt: sectionSpacing }}>
          <Eyebrow label="Why DocuThinker" />
          <Typography
            sx={{ ...sectionTitleSx, textAlign: "center", mb: 2 }}
            className="reveal"
          >
            Professional clarity, at any scale
          </Typography>
          <Typography
            sx={{
              ...sectionSubtitleSx,
              textAlign: "center",
              maxWidth: "680px",
              mx: "auto",
              mb: { xs: 5, md: 7 },
            }}
            className="reveal"
          >
            Grounded in the features available today — summaries, bullet points,
            analytics, and chat, all in one place.
          </Typography>
          <Grid container spacing={3}>
            {pillars.map((pillar, i) => (
              <Grid item xs={12} md={4} key={pillar.title}>
                <Card sx={lightCardSx} className="reveal">
                  <CardContent sx={{ p: { xs: 3, md: 3.5 }, position: "relative" }}>
                    <Typography
                      sx={{
                        position: "absolute",
                        top: 18,
                        right: 24,
                        fontFamily: displayFont,
                        fontWeight: 600,
                        fontSize: "2.4rem",
                        color: palette.accentSoft,
                        lineHeight: 1,
                      }}
                    >
                      0{i + 1}
                    </Typography>
                    <IconTile large>{pillar.icon}</IconTile>
                    <Typography
                      sx={{
                        font: "inherit",
                        fontWeight: 600,
                        fontSize: "1.2rem",
                        mt: 2.5,
                        mb: 1,
                        color: palette.textPrimary,
                      }}
                    >
                      {pillar.title}
                    </Typography>
                    <Typography
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

        {/* Spotlight (dark mid-page moment) */}
        <Box
          sx={{
            mt: sectionSpacing,
            p: { xs: 3, md: 6 },
            borderRadius: "28px",
            backgroundColor: "#0f0a05",
            border: `1px solid ${palette.border}`,
            position: "relative",
            overflow: "hidden",
            boxShadow: palette.shadow,
          }}
          className="reveal"
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 20% 20%, rgba(245,124,0,0.30), transparent 45%), radial-gradient(circle at 90% 80%, rgba(111,155,255,0.18), transparent 45%)",
              pointerEvents: "none",
            }}
          />
          <Grid
            container
            spacing={{ xs: 4, md: 6 }}
            alignItems="center"
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Grid item xs={12} md={6}>
              <Eyebrow label="Capability spotlight" light align="left" />
              <Typography
                sx={{
                  ...sectionTitleSx,
                  color: palette.heroText,
                  mb: 2,
                }}
                className="reveal"
              >
                Clarity for complex documents
              </Typography>
              <Typography
                sx={{
                  font: "inherit",
                  color: palette.heroMuted,
                  fontSize: { xs: "1rem", md: "1.1rem" },
                  mb: 3,
                }}
                className="reveal"
              >
                Step through what DocuThinker does the moment a file lands.
              </Typography>
              <Box
                key={spotlightIndex}
                sx={{
                  animation: reduceMotion ? "none" : `${fadeSwap} 0.6s ease-out`,
                }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <IconTile light large>
                    {spotlights[spotlightIndex].icon}
                  </IconTile>
                  <Typography
                    sx={{
                      fontFamily: displayFont,
                      fontWeight: 600,
                      fontSize: "1.5rem",
                      color: palette.heroText,
                    }}
                  >
                    {spotlights[spotlightIndex].title}
                  </Typography>
                </Stack>
                <Typography
                  sx={{
                    font: "inherit",
                    color: palette.heroMuted,
                    fontSize: "1.05rem",
                    mb: 2.5,
                  }}
                >
                  {spotlights[spotlightIndex].description}
                </Typography>
                <Stack spacing={1.25}>
                  {spotlights[spotlightIndex].points.map((point) => (
                    <Stack
                      key={point}
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                    >
                      <CheckCircle fontSize="small" sx={{ color: "#ffb066" }} />
                      <Typography
                        sx={{ font: "inherit", color: palette.heroText }}
                      >
                        {point}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
              <Stack direction="row" spacing={1.5} sx={{ mt: 4 }}>
                {spotlights.map((_, i) => (
                  <Box
                    key={i}
                    onClick={() => setSpotlightIndex(i)}
                    role="button"
                    aria-label={`Show spotlight ${i + 1}`}
                    sx={{
                      cursor: "pointer",
                      height: 6,
                      borderRadius: 3,
                      width: i === spotlightIndex ? 30 : 14,
                      backgroundColor:
                        i === spotlightIndex
                          ? palette.accent
                          : "rgba(255,255,255,0.25)",
                      transition: "all 0.4s ease",
                    }}
                  />
                ))}
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                {features.slice(0, 3).map((feature) => (
                  <Box
                    key={feature.title}
                    className="reveal"
                    sx={{
                      borderRadius: "18px",
                      p: { xs: 2.25, md: 2.75 },
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      backdropFilter: "blur(8px)",
                      transition: reduceMotion
                        ? "none"
                        : "transform 0.35s ease, border-color 0.35s ease",
                      "&:hover": {
                        transform: "translateX(6px)",
                        borderColor: palette.heroGlassBorder,
                      },
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <IconTile light>{feature.icon}</IconTile>
                      <Box>
                        <Typography
                          sx={{
                            font: "inherit",
                            fontWeight: 600,
                            color: palette.heroText,
                          }}
                        >
                          {feature.title}
                        </Typography>
                        <Typography
                          sx={{
                            font: "inherit",
                            fontSize: "0.9rem",
                            color: palette.heroMuted,
                          }}
                        >
                          {feature.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Features — bento grid */}
        <Box sx={{ mt: sectionSpacing }}>
          <Eyebrow label="Features" />
          <Typography
            sx={{ ...sectionTitleSx, textAlign: "center", mb: 2 }}
            className="reveal"
          >
            Everything you need to move faster
          </Typography>
          <Typography
            sx={{
              ...sectionSubtitleSx,
              textAlign: "center",
              maxWidth: "680px",
              mx: "auto",
              mb: { xs: 5, md: 7 },
            }}
            className="reveal"
          >
            Built for clarity, accessibility, and shared understanding across
            teams.
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: { xs: 2, md: 3 },
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gridAutoFlow: "dense",
            }}
          >
            {features.map((feature, i) => {
              const featured = i === 0;
              return (
                <Card
                  key={feature.title}
                  className="reveal"
                  sx={{
                    ...lightCardSx,
                    gridColumn: featured ? { md: "span 2" } : "auto",
                    gridRow: featured ? { md: "span 2" } : "auto",
                    background: featured
                      ? `linear-gradient(150deg, ${palette.accent}, #ff9d3f)`
                      : palette.surface,
                    color: featured ? "#fff" : palette.textPrimary,
                    border: featured ? "none" : `1px solid ${palette.border}`,
                    "&:hover": {
                      transform: "translateY(-6px)",
                      boxShadow: palette.shadowSoft,
                      borderColor: featured
                        ? "transparent"
                        : "rgba(245, 124, 0, 0.4)",
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      p: { xs: 3, md: featured ? 4 : 3 },
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {featured ? (
                      <Box
                        sx={{
                          width: 58,
                          height: 58,
                          borderRadius: "16px",
                          display: "grid",
                          placeItems: "center",
                          backgroundColor: "rgba(255,255,255,0.2)",
                          color: "#fff",
                          "& .MuiSvgIcon-root": { fontSize: "1.7rem" },
                        }}
                      >
                        {feature.icon}
                      </Box>
                    ) : (
                      <IconTile>{feature.icon}</IconTile>
                    )}
                    <Typography
                      sx={{
                        font: "inherit",
                        fontWeight: 600,
                        fontSize: featured
                          ? { xs: "1.4rem", md: "1.7rem" }
                          : "1.1rem",
                        mt: featured ? 3 : 2,
                        mb: 1,
                        color: featured ? "#fff" : palette.textPrimary,
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      sx={{
                        font: "inherit",
                        color: featured
                          ? "rgba(255,255,255,0.9)"
                          : palette.textSecondary,
                        fontSize: featured ? "1.02rem" : "0.92rem",
                      }}
                    >
                      {feature.description}
                    </Typography>
                    {featured && (
                      <Box
                        sx={{
                          mt: "auto",
                          pt: 3,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        {["PDF", "Word", "CSV", "JSON", "Markdown", "Code"].map(
                          (t) => (
                            <Chip
                              key={t}
                              label={t}
                              size="small"
                              sx={{
                                font: "inherit",
                                color: "#fff",
                                backgroundColor: "rgba(255,255,255,0.18)",
                                border: "1px solid rgba(255,255,255,0.25)",
                              }}
                            />
                          ),
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>

        {/* Workflow — connected stepper */}
        <Box sx={{ mt: sectionSpacing }}>
          <Eyebrow label="How it works" />
          <Typography
            sx={{ ...sectionTitleSx, textAlign: "center", mb: 2 }}
            className="reveal"
          >
            A workflow that mirrors the app
          </Typography>
          <Typography
            sx={{
              ...sectionSubtitleSx,
              textAlign: "center",
              maxWidth: "680px",
              mx: "auto",
              mb: { xs: 5, md: 7 },
            }}
            className="reveal"
          >
            Upload, summarize, analyze, and refine — all in the same workspace.
          </Typography>
          <Box sx={{ position: "relative" }}>
            {/* connecting line on desktop */}
            <Box
              sx={{
                display: { xs: "none", md: "block" },
                position: "absolute",
                top: 33,
                left: "12%",
                right: "12%",
                height: "2px",
                background: `linear-gradient(90deg, transparent, ${palette.accentSoft}, ${palette.accentSoft}, transparent)`,
                zIndex: 0,
              }}
            />
            <Grid container spacing={{ xs: 3, md: 3 }}>
              {workflow.map((step, index) => (
                <Grid item xs={12} sm={6} md={3} key={step.title}>
                  <Box
                    className="reveal"
                    sx={{ position: "relative", zIndex: 1, textAlign: "center" }}
                  >
                    <Box
                      sx={{
                        width: 66,
                        height: 66,
                        mx: "auto",
                        mb: 2.5,
                        borderRadius: "20px",
                        display: "grid",
                        placeItems: "center",
                        color: "#fff",
                        background: `linear-gradient(135deg, ${palette.accent}, #ff9d3f)`,
                        boxShadow: "0 12px 26px rgba(245,124,0,0.35)",
                        position: "relative",
                        "& .MuiSvgIcon-root": { fontSize: "1.7rem" },
                      }}
                    >
                      {step.icon}
                      <Box
                        sx={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          backgroundColor: palette.surface,
                          border: `1px solid ${palette.border}`,
                          color: palette.accent,
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        {index + 1}
                      </Box>
                    </Box>
                    <Typography
                      sx={{
                        font: "inherit",
                        fontWeight: 600,
                        fontSize: "1.15rem",
                        mb: 1,
                        color: palette.textPrimary,
                      }}
                    >
                      {step.title}
                    </Typography>
                    <Typography
                      sx={{
                        font: "inherit",
                        color: palette.textSecondary,
                        fontSize: "0.92rem",
                        maxWidth: 260,
                        mx: "auto",
                      }}
                    >
                      {step.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>

        {/* Outcomes */}
        <Box sx={{ mt: sectionSpacing }}>
          <Eyebrow label="Outputs" />
          <Typography
            sx={{ ...sectionTitleSx, textAlign: "center", mb: { xs: 5, md: 7 } }}
            className="reveal"
          >
            What you get back
          </Typography>
          <Grid container spacing={3}>
            {outcomes.map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item.title}>
                <Card sx={lightCardSx} className="reveal">
                  <CardContent sx={{ p: { xs: 3, md: 3.5 } }}>
                    <IconTile>{item.icon}</IconTile>
                    <Typography
                      sx={{
                        font: "inherit",
                        fontWeight: 600,
                        fontSize: "1.1rem",
                        mt: 2,
                        mb: 1,
                        color: palette.textPrimary,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
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
          <Eyebrow label="The difference" />
          <Typography
            sx={{ ...sectionTitleSx, textAlign: "center", mb: { xs: 5, md: 7 } }}
            className="reveal"
          >
            Manual vs DocuThinker
          </Typography>
          <Grid container spacing={3}>
            {["Manual workflow", "DocuThinker workflow"].map((title, index) => (
              <Grid item xs={12} md={6} key={title}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: "22px",
                    border:
                      index === 0
                        ? `1px solid ${palette.border}`
                        : "none",
                    background:
                      index === 0
                        ? palette.surface
                        : `linear-gradient(150deg, ${palette.accent}, #ff9d3f)`,
                    color: index === 0 ? palette.textPrimary : "white",
                    boxShadow: index === 0 ? "none" : palette.shadowSoft,
                    "&:hover": {
                      transform: "translateY(-6px)",
                      borderColor:
                        index === 0 ? "rgba(245,124,0,0.4)" : "transparent",
                    },
                  }}
                  className="reveal"
                >
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Typography
                      sx={{
                        fontFamily: displayFont,
                        fontWeight: 600,
                        fontSize: "1.5rem",
                        mb: 2.5,
                        color: index === 0 ? palette.textPrimary : "white",
                      }}
                    >
                      {title}
                    </Typography>
                    <Stack spacing={1.75}>
                      {(index === 0
                        ? [
                            "Manual reading and highlighting",
                            "Copying notes across tools",
                            "No built-in sentiment or analytics",
                            "Hard to refine or rewrite quickly",
                          ]
                        : [
                            "Upload documents, tables, text, or code files",
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

        {/* Supported inputs — marquee */}
        <Box sx={{ mt: sectionSpacing, textAlign: "center" }}>
          <Eyebrow label="Supported inputs" />
          <Typography
            sx={{ ...sectionTitleSx, mb: 2 }}
            className="reveal"
          >
            Bring almost anything
          </Typography>
          <Typography
            sx={{
              ...sectionSubtitleSx,
              mb: { xs: 4, md: 6 },
              maxWidth: "680px",
              mx: "auto",
            }}
            className="reveal"
          >
            Documents, structured data, text, logs, and code. Google Drive
            supports PDF, Word, JSON, and text-based files; voice chat supports
            audio upload or recording.
          </Typography>
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              py: 1,
              "&::before, &::after": {
                content: '""',
                position: "absolute",
                top: 0,
                bottom: 0,
                width: { xs: 40, md: 120 },
                zIndex: 2,
                pointerEvents: "none",
              },
              "&::before": {
                left: 0,
                background: `linear-gradient(to right, ${palette.background}, transparent)`,
              },
              "&::after": {
                right: 0,
                background: `linear-gradient(to left, ${palette.background}, transparent)`,
              },
            }}
          >
            {[0, 1].map((row) => (
              <Box
                key={row}
                sx={{
                  display: "flex",
                  width: "max-content",
                  gap: 1.5,
                  mb: row === 0 ? 1.5 : 0,
                  animation: reduceMotion
                    ? "none"
                    : `${row === 0 ? marquee : marqueeReverse} ${
                        row === 0 ? 38 : 46
                      }s linear infinite`,
                  flexWrap: reduceMotion ? "wrap" : "nowrap",
                  justifyContent: reduceMotion ? "center" : "flex-start",
                  "&:hover": { animationPlayState: "paused" },
                }}
              >
                {(reduceMotion
                  ? integrations
                  : [...integrations, ...integrations]
                ).map((label, idx) => (
                  <Chip
                    key={`${row}-${label}-${idx}`}
                    label={label}
                    sx={{
                      font: "inherit",
                      fontSize: "0.95rem",
                      py: 2.25,
                      px: 0.5,
                      borderRadius: "999px",
                      backgroundColor: palette.surface,
                      border: `1px solid ${palette.border}`,
                      color: palette.textSecondary,
                      "& .MuiChip-label": { px: 2 },
                    }}
                  />
                ))}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Use cases */}
        <Box sx={{ mt: sectionSpacing }}>
          <Eyebrow label="Use cases" />
          <Typography
            sx={{ ...sectionTitleSx, textAlign: "center", mb: { xs: 5, md: 7 } }}
            className="reveal"
          >
            What you can do right now
          </Typography>
          <Grid container spacing={3}>
            {useCases.map((useCase) => (
              <Grid item xs={12} sm={6} md={3} key={useCase.title}>
                <Card sx={lightCardSx} className="reveal">
                  <CardContent sx={{ p: { xs: 3, md: 3.5 } }}>
                    <IconTile>{useCase.icon}</IconTile>
                    <Typography
                      sx={{
                        font: "inherit",
                        fontWeight: 600,
                        fontSize: "1.1rem",
                        mt: 2,
                        mb: 1,
                        color: palette.textPrimary,
                      }}
                    >
                      {useCase.title}
                    </Typography>
                    <Typography
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

        {/* Inside the workspace + privacy */}
        <Box sx={{ mt: sectionSpacing }}>
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            <Grid item xs={12} md={6}>
              <Eyebrow label="Inside the workspace" align="left" />
              <Typography
                sx={{ ...sectionTitleSx, mb: 2 }}
                className="reveal"
              >
                Made for real work
              </Typography>
              <Typography
                sx={{ ...sectionSubtitleSx, mb: 3 }}
                className="reveal"
              >
                Everything below reflects features available in the app today.
              </Typography>
              <Box
                key={testimonialIndex}
                sx={{
                  p: 3,
                  borderRadius: "18px",
                  backgroundColor: palette.surfaceAlt,
                  border: `1px solid ${palette.border}`,
                  animation: reduceMotion
                    ? "none"
                    : `${fadeSwap} 0.6s ease-out`,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: displayFont,
                    fontWeight: 600,
                    fontSize: "1.3rem",
                    mb: 1,
                    color: palette.textPrimary,
                  }}
                >
                  {testimonials[testimonialIndex].title}
                </Typography>
                <Typography
                  sx={{ font: "inherit", color: palette.textSecondary }}
                >
                  {testimonials[testimonialIndex].description}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                <IconButton
                  aria-label="Previous"
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
                  aria-label="Next"
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
                sx={{ ...lightCardSx, borderRadius: "22px" }}
                className="reveal"
              >
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Typography
                    sx={{
                      font: "inherit",
                      fontWeight: 600,
                      fontSize: "1.15rem",
                      mb: 2.5,
                      color: palette.textPrimary,
                    }}
                  >
                    Data handling (from Privacy Policy)
                  </Typography>
                  <Stack spacing={2.5}>
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
                        <IconTile>
                          <Security fontSize="small" />
                        </IconTile>
                        <Typography
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

        {/* FAQ — accordion */}
        <Box sx={{ mt: sectionSpacing }}>
          <Eyebrow label="FAQ" />
          <Typography
            sx={{ ...sectionTitleSx, textAlign: "center", mb: { xs: 5, md: 7 } }}
            className="reveal"
          >
            Answers at a glance
          </Typography>
          <Box sx={{ maxWidth: 820, mx: "auto" }} className="reveal">
            {faqs.map((faq, i) => (
              <Accordion
                key={faq.title}
                defaultExpanded={i === 0}
                disableGutters
                elevation={0}
                sx={{
                  mb: 1.5,
                  borderRadius: "16px !important",
                  border: `1px solid ${palette.border}`,
                  backgroundColor: palette.surface,
                  "&:before": { display: "none" },
                  overflow: "hidden",
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore sx={{ color: palette.accent }} />}
                  sx={{
                    px: { xs: 2.5, md: 3 },
                    py: 1,
                    backgroundColor: "transparent",
                    transition: "background-color 0.25s ease",
                    "& .MuiAccordionSummary-content": { my: 1.5 },
                    // Tighten the header→body gap when expanded (MUI defaults the
                    // expanded content margin to 20px). Collapsed stays at 1.5.
                    "& .MuiAccordionSummary-content.Mui-expanded": {
                      mt: 1.5,
                      mb: 0.25,
                    },
                    // No hover effect — neutralize the app-wide `button:hover`
                    // red by keeping the background unchanged on hover.
                    "&:hover": { backgroundColor: "transparent" },
                  }}
                >
                  <Typography
                    sx={{
                      font: "inherit",
                      fontWeight: 600,
                      fontSize: "1.05rem",
                      color: palette.textPrimary,
                    }}
                  >
                    {faq.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: { xs: 2.5, md: 3 }, pt: 0, pb: 2.5 }}>
                  <Typography
                    sx={{ font: "inherit", color: palette.textSecondary }}
                  >
                    {faq.description}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Box>
      </Container>

      {/* ===================== 3D CTA bookend ===================== */}
      <Box
        component="section"
        sx={{
          mt: sectionSpacing,
          position: "relative",
          zIndex: 1,
          width: "100%",
          minHeight: { xs: 560, md: 620 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Scrim so the closing headline reads over the glowing core below it */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse 120% 100% at 50% 50%, rgba(10,6,3,0.55) 0%, rgba(10,6,3,0.22) 45%, rgba(10,6,3,0) 100%)",
          }}
        />
        <Container
          maxWidth="md"
          sx={{ position: "relative", zIndex: 2, textAlign: "center", py: 8 }}
        >
          <Box
            className="reveal"
            sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            <Eyebrow label="Get started" light />
            <Typography
              sx={{
                fontFamily: displayFont,
                fontWeight: 600,
                fontSize: { xs: "2.4rem", sm: "3.2rem", md: "4rem" },
                lineHeight: 1.12,
                letterSpacing: "-0.02em",
                color: palette.heroText,
                mb: 2.5,
                px: { xs: 1, sm: 0 },
                pb: "0.12em",
                textShadow: "0 2px 30px rgba(0,0,0,0.5)",
              }}
            >
              Ready to make documents{" "}
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  pr: "0.14em",
                  fontStyle: "italic",
                  background:
                    "linear-gradient(90deg, #ff8a1e, #ffd27f, #ff6a00)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                  animation: reduceMotion
                    ? "none"
                    : `${textShimmer} 6s linear infinite`,
                }}
              >
                instantly useful
              </Box>
              ?
            </Typography>
            <Typography
              sx={{
                font: "inherit",
                color: palette.heroMuted,
                fontSize: { xs: "1.05rem", md: "1.2rem" },
                maxWidth: 560,
                mb: 4,
              }}
            >
              Start now and see how DocuThinker turns information into action —
              no setup, no friction.
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{
                width: { xs: "100%", sm: "auto" },
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Button
                component={Link}
                to="/register"
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{
                  backgroundColor: palette.accent,
                  font: "inherit",
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "1.05rem",
                  px: 4,
                  py: 1.3,
                  borderRadius: "999px",
                  boxShadow: "0 12px 34px rgba(245,124,0,0.45)",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                  "&:hover": {
                    backgroundColor: palette.accentDark,
                    transform: "translateY(-2px)",
                    boxShadow: "0 18px 44px rgba(245,124,0,0.55)",
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
                  borderColor: palette.heroGlassBorder,
                  color: palette.heroText,
                  font: "inherit",
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "1.05rem",
                  px: 4,
                  py: 1.3,
                  borderRadius: "999px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  backdropFilter: "blur(6px)",
                  "&:hover": {
                    borderColor: "#ffb066",
                    backgroundColor: "rgba(255,138,26,0.1)",
                  },
                }}
              >
                Create Account
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>
      </Box>
    </Box>
  );
};

export default LandingPage;
