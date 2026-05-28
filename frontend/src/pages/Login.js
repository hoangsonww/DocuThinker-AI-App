import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Link,
  IconButton,
  InputAdornment,
  Divider,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { setAuth } from "../utils/auth";
import { authenticateWithPasskey, isPasskeySupported } from "../utils/passkeys";

const Login = ({ theme }) => {
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
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
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

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "3rem",
        backgroundColor: theme === "dark" ? "#1e1e1e" : "#f5f5f5",
        transition: "background-color 0.3s ease",
      }}
    >
      <Box
        sx={{
          maxWidth: "400px",
          width: "100%",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          backgroundColor: theme === "dark" ? "#333" : "white",
          color: theme === "dark" ? "white" : "black",
          transition: "background-color 0.3s ease, color 0.3s ease",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            marginBottom: "1.5rem",
            textAlign: "center",
            color: "#f57c00",
            font: "inherit",
            fontWeight: 600,
            fontSize: "30px",
          }}
        >
          Login
        </Typography>

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            sx={{
              marginBottom: "1.5rem",
              font: "inherit",
              textAlign: "center",
            }}
          >
            {error}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleLogin}>
          {/* Email Input */}
          <TextField
            label="Email"
            type="email"
            fullWidth
            required
            sx={{
              marginBottom: "1.5rem",
              backgroundColor: theme === "dark" ? "#555" : "#fff",
              color: theme === "dark" ? "white" : "black",
              borderRadius: "8px",
              font: "inherit",
            }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputProps={{
              style: {
                fontFamily: "Poppins, sans-serif",
                color: theme === "dark" ? "white" : "black",
              },
            }}
            InputLabelProps={{
              style: {
                fontFamily: "Poppins, sans-serif",
                color: theme === "dark" ? "white" : "black",
              },
            }}
          />

          {/* Password Input */}
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            required
            sx={{
              marginBottom: "1.5rem",
              backgroundColor: theme === "dark" ? "#555" : "#fff",
              borderRadius: "8px",
              font: "inherit",
            }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                    sx={{ color: theme === "dark" ? "white" : "#333" }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              style: {
                fontFamily: "Poppins, sans-serif",
                color: theme === "dark" ? "white" : "black",
              },
            }}
            InputLabelProps={{
              style: {
                fontFamily: "Poppins, sans-serif",
                color: theme === "dark" ? "white" : "black",
              },
            }}
          />

          {/* Login Button */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: "#f57c00",
              color: "white",
              font: "inherit",
              padding: "0.75rem",
              "&:hover": {
                backgroundColor: "#e68900",
              },
            }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              "Login"
            )}
          </Button>
        </form>

        {/* Passkey sign-in */}
        {passkeySupported && (
          <>
            <Divider
              sx={{
                my: "1.5rem",
                font: "inherit",
                fontSize: "13px",
                color: theme === "dark" ? "#aaa" : "#999",
                "&::before, &::after": {
                  borderColor: theme === "dark" ? "#555" : "#ddd",
                },
              }}
            >
              or
            </Divider>

            <Button
              type="button"
              fullWidth
              variant="outlined"
              onClick={handlePasskeyLogin}
              disabled={passkeyLoading || loading}
              startIcon={!passkeyLoading ? <FingerprintIcon /> : null}
              sx={{
                borderColor: "#f57c00",
                color: "#f57c00",
                font: "inherit",
                fontWeight: 600,
                textTransform: "none",
                padding: "0.7rem",
                borderRadius: "8px",
                "&:hover": {
                  borderColor: "#e65100",
                  bgcolor: "rgba(245,124,0,0.08)",
                },
              }}
            >
              {passkeyLoading ? (
                <CircularProgress size={22} sx={{ color: "#f57c00" }} />
              ) : (
                "Sign in with a passkey"
              )}
            </Button>
          </>
        )}

        {/* Forgot Password Link */}
        <Box
          sx={{ marginTop: "1.5rem", textAlign: "center", color: "#f57c00" }}
        >
          <Link
            component="button"
            variant="body2"
            sx={{
              color: "#f57c00",
              cursor: "pointer",
              textDecoration: "none",
              font: "inherit",
              "&:hover": {
                textDecoration: "underline",
                backgroundColor: "transparent",
              },
            }}
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </Link>
        </Box>

        {/* Register Link */}
        <Box
          sx={{ marginTop: "1.5rem", textAlign: "center", color: "#f57c00" }}
        >
          <Link
            component="button"
            variant="body2"
            sx={{
              color: "#f57c00",
              cursor: "pointer",
              textDecoration: "none",
              font: "inherit",
              "&:hover": {
                textDecoration: "underline",
                backgroundColor: "transparent",
              },
            }}
            onClick={() => navigate("/register")}
          >
            Don't have an account? Register
          </Link>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
