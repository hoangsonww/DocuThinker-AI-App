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
  PersonAddAlt1Outlined,
} from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PasskeyPromptModal from "../components/PasskeyPromptModal";
import { isPasskeySupported } from "../utils/passkeys";

const ORANGE = "#f57c00";

const Register = ({ theme }) => {
  const dark = theme === "dark";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passkeyModalOpen, setPasskeyModalOpen] = useState(false);
  const [newUserId, setNewUserId] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/register",
        { email, password },
        { headers: { "Content-Type": "application/json" } },
      );
      setLoading(false);
      setSuccess("Account created! You can now sign in.");
      setPassword("");
      setConfirmPassword("");

      const registeredUserId = response.data && response.data.userId;
      if (registeredUserId && isPasskeySupported()) {
        setNewUserId(registeredUserId);
        setPasskeyModalOpen(true);
      } else {
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data.details || err.message);
    }
  };

  const handlePasskeyModalClose = () => {
    setPasskeyModalOpen(false);
    setEmail("");
    navigate("/login");
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
    <>
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
                <PersonAddAlt1Outlined sx={{ fontSize: 28 }} />
              </Box>
              <Typography
                sx={{
                  font: "inherit",
                  fontWeight: 700,
                  fontSize: "26px",
                  color: dark ? "#fff" : "#1a1a1a",
                }}
              >
                Create your account
              </Typography>
              <Typography
                sx={{
                  font: "inherit",
                  fontSize: "13px",
                  color: dark ? "#aaa" : "#777",
                  mt: 0.5,
                }}
              >
                Save your documents, summaries, and chat history.
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
            {success && (
              <Alert
                severity="success"
                sx={{ mb: 2.5, font: "inherit", borderRadius: "10px" }}
              >
                {success}
              </Alert>
            )}

            <form onSubmit={handleRegister}>
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

              <TextField
                label="Confirm password"
                type={showConfirmPassword ? "text" : "password"}
                fullWidth
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                        onClick={() => setShowConfirmPassword((p) => !p)}
                        edge="end"
                        sx={{ color: dark ? "#aaa" : "#777" }}
                      >
                        {showConfirmPassword ? (
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
                  "Create Account"
                )}
              </Button>
            </form>

            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Typography
                sx={{
                  font: "inherit",
                  fontSize: "13px",
                  color: dark ? "#aaa" : "#777",
                }}
              >
                Already have an account?{" "}
                <Box
                  component="span"
                  onClick={() => navigate("/login")}
                  sx={{
                    color: ORANGE,
                    fontWeight: 600,
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Sign in
                </Box>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      <PasskeyPromptModal
        open={passkeyModalOpen}
        userId={newUserId}
        theme={theme}
        onClose={handlePasskeyModalClose}
      />
    </>
  );
};

export default Register;
