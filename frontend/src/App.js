import React, { useState, useEffect, useRef } from "react";
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

// Tracks the user's reduced-motion preference so page transitions can be
// skipped entirely (and the route swap happens instantly) for those users.
function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(media.matches);
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
  return reduce;
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
  const reduceMotion = usePrefersReducedMotion();
  // `displayLocation` is the route currently painted; it lags `location` by one
  // exit animation so the outgoing page can animate away before the swap.
  const [displayLocation, setDisplayLocation] = useState(location);
  const [stage, setStage] = useState("enter"); // "enter" | "exit"
  const swapTimer = useRef(null);

  // Show the new page: update what's painted, reset scroll, play the enter anim.
  const showNext = (nextLocation) => {
    clearTimeout(swapTimer.current);
    setDisplayLocation(nextLocation);
    window.scrollTo(0, 0);
    setStage("enter");
  };

  useEffect(() => {
    if (location.pathname === displayLocation.pathname) return undefined;
    // Reduced motion: swap immediately, no slide.
    if (reduceMotion) {
      setDisplayLocation(location);
      window.scrollTo(0, 0);
      return undefined;
    }
    // Otherwise animate the current page out; the swap happens on animation end
    // (with a timeout fallback in case the event is missed).
    setStage("exit");
    clearTimeout(swapTimer.current);
    swapTimer.current = setTimeout(() => showNext(location), 650);
    return () => clearTimeout(swapTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, displayLocation, reduceMotion]);

  const handleAnimationEnd = (e) => {
    // Ignore animations bubbling up from page content; only react to the
    // wrapper's own enter/exit animation.
    if (e.target !== e.currentTarget) return;
    if (stage === "exit") showNext(location);
  };

  const hideNavbar =
    displayLocation.pathname === "/" ||
    displayLocation.pathname.startsWith("/landing");
  const animClass = reduceMotion
    ? ""
    : `page-transition ${stage === "exit" ? "is-exit" : "is-enter"}`;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {!hideNavbar && <Navbar theme={theme} onThemeToggle={onThemeToggle} />}
      <Box sx={{ flexGrow: 1 }}>
        <div className={animClass} onAnimationEnd={handleAnimationEnd}>
          <Routes location={displayLocation}>
            <Route path="/home" element={<Home theme={theme} />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/how-to-use" element={<HowToUse theme={theme} />} />
            <Route
              path="/documents"
              element={<DocumentsPage theme={theme} />}
            />
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
        </div>
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
