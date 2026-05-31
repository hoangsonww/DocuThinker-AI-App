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
  LockOutlined,
  LockOpenOutlined,
} from "@mui/icons-material";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { setAuth } from "../utils/auth";
import { authenticateWithPasskey, isPasskeySupported } from "../utils/passkeys";

const ORANGE = "#f57c00";

const Login = ({ theme }) => {
  const dark = theme === "dark";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const passkeySupported = isPasskeySupported();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } },
      );
      setLoading(false);
      const { customToken, userId } = response.data;
      setAuth(customToken, userId);
      navigate("/home");
    } catch (error) {
      setLoading(false);
      if (error.response && error.response.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    setError("");
    try {
      const { customToken, userId } = await authenticateWithPasskey(
        email.trim() || undefined,
      );
      setAuth(customToken, userId);
      navigate("/home");
    } catch (err) {
      setError(err.message || "Passkey sign-in failed. Please try again.");
    } finally {
      setPasskeyLoading(false);
    }
  };

  const fieldSx = {
    mb: 2,
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
              <LockOpenOutlined sx={{ fontSize: 28 }} />
            </Box>
            <Typography
              sx={{
                font: "inherit",
                fontWeight: 700,
                fontSize: "26px",
                color: dark ? "#fff" : "#1a1a1a",
              }}
            >
              Welcome back
            </Typography>
            <Typography
              sx={{
                font: "inherit",
                fontSize: "13px",
                color: dark ? "#aaa" : "#777",
                mt: 0.5,
              }}
            >
              Sign in to access your documents and summaries.
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2.5, font: "inherit", borderRadius: "10px" }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
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

            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ ...fieldSx, mb: 2.5 }}
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
                      onClick={() => setShowPassword((p) => !p)}
                      edge="end"
                      sx={{ color: dark ? "#aaa" : "#777" }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
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
              sx={{
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
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {passkeySupported && (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  my: 2.5,
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
                  or
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
                type="button"
                fullWidth
                variant="outlined"
                onClick={handlePasskeyLogin}
                disabled={passkeyLoading || loading}
                startIcon={!passkeyLoading ? <FingerprintIcon /> : null}
                sx={{
                  borderColor: ORANGE,
                  color: ORANGE,
                  font: "inherit",
                  fontWeight: 600,
                  textTransform: "none",
                  py: 1.1,
                  borderRadius: "12px",
                  "&:hover": {
                    borderColor: "#e65100",
                    bgcolor: "rgba(245,124,0,0.08)",
                  },
                }}
              >
                {passkeyLoading ? (
                  <CircularProgress size={22} sx={{ color: ORANGE }} />
                ) : (
                  "Sign in with a passkey"
                )}
              </Button>
            </>
          )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 3,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box
              component="span"
              onClick={() => navigate("/forgot-password")}
              sx={{
                font: "inherit",
                fontSize: "13px",
                fontWeight: 600,
                color: ORANGE,
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                "&:hover": { color: "#e65100" },
              }}
            >
              Forgot password?
            </Box>
            <Box
              component="span"
              onClick={() => navigate("/register")}
              sx={{
                font: "inherit",
                fontSize: "13px",
                color: ORANGE,
                fontWeight: 600,
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Create an account
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
