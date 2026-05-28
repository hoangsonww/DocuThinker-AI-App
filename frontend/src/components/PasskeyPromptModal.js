import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Fade,
} from "@mui/material";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import BoltIcon from "@mui/icons-material/Bolt";
import LockIcon from "@mui/icons-material/Lock";
import DevicesIcon from "@mui/icons-material/Devices";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { registerPasskey } from "../utils/passkeys";

const ORANGE = "#f57c00";

const Benefit = ({ icon, title, subtitle, theme }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: "10px",
        flexShrink: 0,
        bgcolor: theme === "dark" ? "rgba(245,124,0,0.16)" : "rgba(245,124,0,0.12)",
        color: ORANGE,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ textAlign: "left" }}>
      <Typography
        sx={{
          font: "inherit",
          fontWeight: 600,
          fontSize: "15px",
          color: theme === "dark" ? "white" : "#222",
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          font: "inherit",
          fontSize: "13px",
          color: theme === "dark" ? "#bbb" : "#666",
        }}
      >
        {subtitle}
      </Typography>
    </Box>
  </Box>
);

/**
 * Shown right after sign-up to invite the user to create their first passkey.
 * Self-contained: it runs the WebAuthn registration using the new account's
 * userId and reports success/failure inline.
 */
const PasskeyPromptModal = ({ open, onClose, userId, theme }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      await registerPasskey(userId);
      setDone(true);
      setTimeout(() => onClose(true), 1600);
    } catch (err) {
      setError(err.message || "Could not create a passkey.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={() => (loading ? null : onClose(false))} closeAfterTransition>
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: "440px" },
            maxHeight: "90vh",
            overflowY: "auto",
            bgcolor: theme === "dark" ? "#262626" : "white",
            color: theme === "dark" ? "white" : "black",
            borderRadius: "16px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
            p: { xs: 3, sm: 4 },
            textAlign: "center",
            fontFamily: "Poppins, sans-serif",
            outline: "none",
          }}
        >
          {done ? (
            <Box sx={{ py: 2 }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: "#2e7d32", mb: 1 }} />
              <Typography
                sx={{ font: "inherit", fontWeight: 600, fontSize: "20px", mb: 1 }}
              >
                Passkey created!
              </Typography>
              <Typography
                sx={{
                  font: "inherit",
                  fontSize: "14px",
                  color: theme === "dark" ? "#bbb" : "#666",
                }}
              >
                You can now sign in without a password next time.
              </Typography>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  mx: "auto",
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(135deg, #f57c00 0%, #ff9d3f 100%)",
                  boxShadow: "0 6px 18px rgba(245,124,0,0.4)",
                }}
              >
                <FingerprintIcon sx={{ fontSize: 42, color: "white" }} />
              </Box>

              <Typography
                sx={{
                  font: "inherit",
                  fontWeight: 700,
                  fontSize: "22px",
                  mb: 1,
                  color: ORANGE,
                }}
              >
                Set up a passkey
              </Typography>
              <Typography
                sx={{
                  font: "inherit",
                  fontSize: "14px",
                  mb: 3,
                  color: theme === "dark" ? "#bbb" : "#666",
                }}
              >
                Sign in to DocuThinker instantly with your fingerprint, face, or
                screen lock — no password to remember.
              </Typography>

              <Box sx={{ mb: 1 }}>
                <Benefit
                  theme={theme}
                  icon={<BoltIcon sx={{ fontSize: 20 }} />}
                  title="Faster sign-in"
                  subtitle="One tap with biometrics — no typing."
                />
                <Benefit
                  theme={theme}
                  icon={<LockIcon sx={{ fontSize: 20 }} />}
                  title="More secure"
                  subtitle="Phishing-resistant and never reused."
                />
                <Benefit
                  theme={theme}
                  icon={<DevicesIcon sx={{ fontSize: 20 }} />}
                  title="Works everywhere"
                  subtitle="Synced across your devices by your platform."
                />
              </Box>

              {error && (
                <Alert
                  severity="error"
                  sx={{ font: "inherit", fontSize: "13px", textAlign: "left", mb: 2 }}
                >
                  {error}
                </Alert>
              )}

              <Button
                fullWidth
                variant="contained"
                onClick={handleCreate}
                disabled={loading}
                startIcon={
                  !loading ? <FingerprintIcon /> : null
                }
                sx={{
                  bgcolor: ORANGE,
                  color: "white",
                  font: "inherit",
                  fontWeight: 600,
                  textTransform: "none",
                  py: 1.2,
                  borderRadius: "10px",
                  "&:hover": { bgcolor: "#e65100" },
                }}
              >
                {loading ? (
                  <CircularProgress size={22} sx={{ color: "white" }} />
                ) : (
                  "Create a passkey"
                )}
              </Button>

              <Button
                fullWidth
                onClick={() => onClose(false)}
                disabled={loading}
                sx={{
                  mt: 1.5,
                  font: "inherit",
                  textTransform: "none",
                  color: theme === "dark" ? "#bbb" : "#777",
                  "&:hover": { bgcolor: "transparent", color: ORANGE },
                }}
              >
                Maybe later
              </Button>
            </>
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

export default PasskeyPromptModal;
