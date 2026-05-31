import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Box } from "@mui/material";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import GoogleAnalytics from "./components/GoogleAnalytics";
import Home from "./pages/Home";
import HowToUse from "./pages/HowToUse";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LandingPage from "./pages/LandingPage";
import ForgotPassword from "./pages/ForgotPassword";
import DocumentsPage from "./pages/DocumentsPage";
import Profile from "./pages/Profile";
import Passkeys from "./pages/Passkeys";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFoundPage from "./pages/NotFoundPage";
import TermsOfService from "./pages/TermsOfService";
import { isAuthenticated } from "./utils/auth";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import "./App.css";
import "./styles.css";
import "@fontsource/poppins";

// Get stored theme from localStorage
const getStoredTheme = () => {
  return localStorage.getItem("theme") === "dark" ? "dark" : "light";
};

// Reset scroll to the top on every route change so a new page never starts
// scrolled down to wherever the previous page was (the browser otherwise keeps
// the prior scroll offset on client-side navigation).
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Custom hook to track page views
function useTrackPageView() {
  const location = useLocation();

  useEffect(() => {
    if (window.gtag) {
      window.gtag("config", "G-RZBP95EQ7L", {
        page_path: location.pathname,
      });
    }
  }, [location]);
}

// Redirect logged-in users away from guest-only pages.
function RequireGuest({ children }) {
  return isAuthenticated() ? <Navigate to="/home" replace /> : children;
}

// Redirect signed-out users away from account-only pages.
function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

// Launches the app
function App() {
  const [theme, setTheme] = useState(getStoredTheme());

  useEffect(() => {
    document.body.style.backgroundColor =
      theme === "dark" ? "#121212" : "#ffffff";
  }, [theme]);

  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <Router>
        <ScrollToTop />
        <Analytics />
        <GoogleAnalytics />
        <TrackPageView />
        <SpeedInsights />
        <AppLayout theme={theme} onThemeToggle={handleThemeToggle} />
      </Router>
    </GoogleOAuthProvider>
  );
}

function AppLayout({ theme, onThemeToggle }) {
  const location = useLocation();
  const hideNavbar =
    location.pathname === "/" || location.pathname.startsWith("/landing");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {!hideNavbar && <Navbar theme={theme} onThemeToggle={onThemeToggle} />}
      <Box sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/home" element={<Home theme={theme} />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/how-to-use" element={<HowToUse theme={theme} />} />
          <Route path="/documents" element={<DocumentsPage theme={theme} />} />
          <Route
            path="/forgot-password"
            element={
              <RequireGuest>
                <ForgotPassword theme={theme} />
              </RequireGuest>
            }
          />
          <Route path="/profile" element={<Profile theme={theme} />} />
          <Route
            path="/passkeys"
            element={
              <RequireAuth>
                <Passkeys theme={theme} />
              </RequireAuth>
            }
          />
          <Route
            path="/privacy-policy"
            element={<PrivacyPolicy theme={theme} />}
          />
          <Route
            path="/terms-of-service"
            element={<TermsOfService theme={theme} />}
          />
          <Route
            path="/login"
            element={
              <RequireGuest>
                <Login theme={theme} />
              </RequireGuest>
            }
          />
          <Route
            path="/register"
            element={
              <RequireGuest>
                <Register theme={theme} />
              </RequireGuest>
            }
          />
          <Route path="*" element={<NotFoundPage theme={theme} />} />
        </Routes>
      </Box>
      <Footer />
    </Box>
  );
}

function TrackPageView() {
  useTrackPageView();
  return null;
}

export default App;
