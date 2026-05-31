import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";

const ORANGE = "#f57c00";

const NotFoundPage = ({ theme }) => {
  const navigate = useNavigate();
  const dark = theme === "dark";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 6,
        backgroundColor: dark ? "#1e1e1e" : "#f5f5f5",
        fontFamily: "Poppins, sans-serif",
        transition: "background-color 0.3s ease",
        "@keyframes dt404Float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      }}
    >
      <Box sx={{ textAlign: "center", maxWidth: 560 }}>
        {/* Floating icon badge */}
        <Box
          sx={{
            width: 84,
            height: 84,
            borderRadius: "26px",
            mx: "auto",
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            background: "linear-gradient(135deg,#ff8a00,#f57c00)",
            boxShadow: "0 18px 40px rgba(245,124,0,0.4)",
            animation: "dt404Float 3.2s ease-in-out infinite",
          }}
        >
          <SearchOffRoundedIcon sx={{ fontSize: 44 }} />
        </Box>

        {/* Big gradient 404 */}
        <Typography
          sx={{
            font: "inherit",
            fontWeight: 800,
            fontSize: { xs: "92px", sm: "140px" },
            lineHeight: 1,
            letterSpacing: "-4px",
            background: "linear-gradient(135deg,#ff8a00,#f57c00,#ffb74d)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </Typography>

        <Typography
          sx={{
            font: "inherit",
            fontWeight: 700,
            fontSize: { xs: "22px", sm: "26px" },
            color: dark ? "#fff" : "#1a1a1a",
            mt: 1,
          }}
        >
          This page wandered off
        </Typography>
        <Typography
          sx={{
            font: "inherit",
            fontSize: "14.5px",
            color: dark ? "#aaa" : "#777",
            mt: 1.5,
            maxWidth: 420,
            mx: "auto",
            lineHeight: 1.7,
          }}
        >
          The page you're looking for doesn't exist, was moved, or the link is
          broken. Let's get you back on track.
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            justifyContent: "center",
            flexWrap: "wrap",
            mt: 4,
          }}
        >
          <Button
            variant="contained"
            startIcon={<HomeRoundedIcon />}
            onClick={() => navigate("/")}
            sx={{
              bgcolor: ORANGE,
              color: "#fff",
              font: "inherit",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "12px",
              px: 3,
              py: 1.15,
              boxShadow: "0 8px 20px rgba(245,124,0,0.32)",
              "&:hover": { bgcolor: "#e65100" },
            }}
          >
            Go home
          </Button>
          <Button
            variant="outlined"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate(-1)}
            sx={{
              color: dark ? "#ddd" : "#444",
              borderColor: dark ? "#444" : "#ddd",
              font: "inherit",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "12px",
              px: 3,
              py: 1.15,
              "&:hover": {
                borderColor: ORANGE,
                bgcolor: "rgba(245,124,0,0.06)",
              },
            }}
          >
            Go back
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default NotFoundPage;
