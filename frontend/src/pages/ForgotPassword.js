import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Paper,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  EmailOutlined,
  LockResetOutlined,
  LockOutlined,
} from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ORANGE = "#f57c00";

const ForgotPassword = ({ theme }) => {
  const dark = theme === "dark";
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/verify-email",
        { email },
      );
      setEmailVerified(true);
      setSuccess("Email verified. Choose a new password below.");
    } catch (error) {
      setError("Email not found. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/forgot-password",
        { email, newPassword },
      );
      setSuccess("Password updated successfully.");
      navigate("/login");
    } catch (error) {
      setError("Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fieldSx = {
    mb: 2.5,
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      bgcolor: dark ? "#262626" : "#fafafa",
      "& fieldset": { borderColor: dark ? "#444" : "#e3e3e3" },
      "&:hover fieldset": { borderColor: ORANGE },
      "&.Mui-focused fieldset": { borderColor: ORANGE },
    },
    "& input": {
      fontFamily: "Poppins, sans-serif",
      color: dark ? "#fff" : "#1a1a1a",
    },
    "& label": {
      fontFamily: "Poppins, sans-serif",
      color: dark ? "#aaa" : "#777",
    },
    "& label.Mui-focused": { color: ORANGE },
  };

  const submitSx = {
    bgcolor: ORANGE,
    color: "white",
    font: "inherit",
    fontWeight: 600,
    fontSize: "15px",
    textTransform: "none",
    borderRadius: "12px",
    py: 1.25,
    boxShadow: "0 8px 20px rgba(245,124,0,0.32)",
    "&:hover": { bgcolor: "#e65100" },
  };

  const StepDot = ({ active, done, n, label }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <Box
        sx={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: 700,
          color: active || done ? "#fff" : dark ? "#888" : "#aaa",
          bgcolor: active || done ? ORANGE : dark ? "#333" : "#eee",
        }}
      >
        {n}
      </Box>
      <Typography
        sx={{
          font: "inherit",
          fontSize: "12px",
          fontWeight: active ? 600 : 500,
          color: active ? ORANGE : dark ? "#aaa" : "#888",
        }}
      >
        {label}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        px: 2,
        py: 5,
        backgroundColor: dark ? "#1e1e1e" : "#f5f5f5",
        fontFamily: "Poppins, sans-serif",
        transition: "background-color 0.3s ease",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: "430px",
          borderRadius: "22px",
          overflow: "hidden",
          bgcolor: dark ? "#222" : "#fff",
          border: dark ? "1px solid #333" : "1px solid #ececec",
          boxShadow: dark
            ? "0 20px 60px rgba(0,0,0,0.45)"
            : "0 20px 60px rgba(0,0,0,0.1)",
        }}
      >
        <Box
          sx={{
            height: 6,
            background: "linear-gradient(90deg,#ff8a00,#f57c00,#ffb74d)",
          }}
        />
        <Box sx={{ p: { xs: 3, sm: 4.5 } }}>
          {/* Hero */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                width: 58,
                height: 58,
                borderRadius: "16px",
                mx: "auto",
                mb: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                background: "linear-gradient(135deg,#ff8a00,#f57c00)",
                boxShadow: "0 10px 22px rgba(245,124,0,0.4)",
              }}
            >
              <LockResetOutlined sx={{ fontSize: 30 }} />
            </Box>
            <Typography
              sx={{
                font: "inherit",
                fontWeight: 700,
                fontSize: "26px",
                color: dark ? "#fff" : "#1a1a1a",
              }}
            >
              Reset your password
            </Typography>
            <Typography
              sx={{
                font: "inherit",
                fontSize: "13px",
                color: dark ? "#aaa" : "#777",
                mt: 0.5,
              }}
            >
              {emailVerified
                ? "Choose a new password for your account."
                : "Verify your email to set a new password."}
            </Typography>
          </Box>

          {/* Step indicator */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              mb: 3,
            }}
          >
            <StepDot
              n={1}
              label="Verify email"
              active={!emailVerified}
              done={emailVerified}
            />
            <Box
              sx={{ width: 24, height: "1px", bgcolor: dark ? "#444" : "#ddd" }}
            />
            <StepDot
              n={2}
              label="New password"
              active={emailVerified}
              done={false}
            />
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2.5, font: "inherit", borderRadius: "10px" }}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              severity="success"
              sx={{ mb: 2.5, font: "inherit", borderRadius: "10px" }}
            >
              {success}
            </Alert>
          )}

          {!emailVerified && (
            <form onSubmit={handleVerifyEmail}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined
                        sx={{ color: dark ? "#888" : "#999", fontSize: 20 }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={submitSx}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Verify Email"
                )}
              </Button>
            </form>
          )}

          {emailVerified && (
            <form onSubmit={handleUpdatePassword}>
              <TextField
                label="New password"
                type={showNewPassword ? "text" : "password"}
                fullWidth
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined
                        sx={{ color: dark ? "#888" : "#999", fontSize: 20 }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword((p) => !p)}
                        edge="end"
                        sx={{ color: dark ? "#aaa" : "#777" }}
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Confirm new password"
                type={showConfirmNewPassword ? "text" : "password"}
                fullWidth
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined
                        sx={{ color: dark ? "#888" : "#999", fontSize: 20 }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmNewPassword((p) => !p)}
                        edge="end"
                        sx={{ color: dark ? "#aaa" : "#777" }}
                      >
                        {showConfirmNewPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={submitSx}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          )}

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Box
              component="span"
              onClick={() => navigate("/login")}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                font: "inherit",
                fontSize: "13px",
                fontWeight: 600,
                color: ORANGE,
                cursor: "pointer",
                px: 1,
                py: 0.5,
                borderRadius: "8px",
                transition: "background-color 0.2s ease",
                "&:hover": {
                  bgcolor: dark
                    ? "rgba(245,124,0,0.14)"
                    : "rgba(245,124,0,0.1)",
                },
              }}
            >
              ← Back to sign in
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ForgotPassword;
