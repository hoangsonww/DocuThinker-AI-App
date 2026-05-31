import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";

const TermsOfService = ({ theme }) => {
  const isDark = theme === "dark";
  const cardBg = isDark ? "#222" : "#ffffff";
  const sub = isDark ? "#b5b5b5" : "#666";
  const heading = isDark ? "#ffffff" : "#1a1a1a";

  return (
    <Box
      sx={{
        py: { xs: 4, md: 6 },
        px: 2,
        bgcolor: isDark ? "#1e1e1e" : "#f5f5f5",
        color: isDark ? "white" : "black",
        minHeight: "100vh",
        transition: "background-color 0.3s ease",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: "840px",
          mx: "auto",
          borderRadius: "20px",
          overflow: "hidden",
          bgcolor: cardBg,
          border: isDark ? "1px solid #333" : "1px solid #ececec",
          boxShadow: isDark
            ? "0 8px 30px rgba(0,0,0,0.4)"
            : "0 8px 30px rgba(0,0,0,0.07)",
        }}
      >
        <Box
          sx={{
            height: 6,
            background: "linear-gradient(90deg,#ff8a00,#f57c00,#ffb74d)",
          }}
        />
        <Box sx={{ p: { xs: 3, md: 5 } }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: "18px",
                mx: "auto",
                mb: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                background: "linear-gradient(135deg,#ff8a00,#f57c00)",
                boxShadow: "0 10px 24px rgba(245,124,0,0.35)",
              }}
            >
              <GavelOutlinedIcon sx={{ fontSize: 28 }} />
            </Box>
            <Typography
              sx={{
                font: "inherit",
                fontWeight: 700,
                fontSize: { xs: "26px", md: "32px" },
                color: heading,
              }}
            >
              Terms of Service
            </Typography>
            <Typography
              sx={{ font: "inherit", fontSize: "13px", color: sub, mt: 1 }}
            >
              The rules and terms for using DocuThinker.
            </Typography>
          </Box>

          <Box
            sx={{
              "& .MuiTypography-h6": {
                font: "inherit",
                fontWeight: 700,
                fontSize: "1.15rem",
                color: heading,
                mt: 3.5,
                mb: 1.25,
                pl: 1.5,
                borderLeft: "4px solid #f57c00",
              },
              "& .MuiTypography-body1": {
                font: "inherit",
                fontSize: "14.5px",
                lineHeight: 1.8,
                color: isDark ? "#cfcfcf" : "#444",
                mb: 2,
              },
              "& a": { color: "#f57c00", fontWeight: 600 },
            }}
          >
            <Typography
              variant="h6"
              sx={{
                marginTop: 3,
                marginBottom: 2,
                font: "inherit",
                color: isDark ? "white" : "black",
                fontWeight: "bold",
                fontSize: "1.4rem",
              }}
            >
              1. Acceptance of Terms
            </Typography>
            <Typography
              variant="body1"
              sx={{ marginBottom: 3, font: "inherit" }}
            >
              By accessing and using DocuThinker, you agree to comply with and
              be bound by the following terms and conditions ("Terms of
              Service"). Please review these terms carefully. If you do not
              agree with these terms, you should not use this website.
            </Typography>

            <Typography
              variant="h6"
              sx={{
                marginTop: 3,
                marginBottom: 2,
                font: "inherit",
                color: isDark ? "white" : "black",
                fontWeight: "bold",
                fontSize: "1.4rem",
              }}
            >
              2. Services Provided
            </Typography>
            <Typography
              variant="body1"
              sx={{ marginBottom: 3, font: "inherit" }}
            >
              DocuThinker allows users to upload, analyze, and process documents
              to extract useful information and insights. We aim to provide a
              seamless and secure platform for document processing, but we
              cannot guarantee the absolute accuracy or completeness of our
              services.
            </Typography>

            <Typography
              variant="h6"
              sx={{
                marginTop: 3,
                marginBottom: 2,
                font: "inherit",
                color: isDark ? "white" : "black",
                fontWeight: "bold",
                fontSize: "1.4rem",
              }}
            >
              3. User Responsibilities
            </Typography>
            <Typography
              variant="body1"
              sx={{ marginBottom: 3, font: "inherit" }}
            >
              You agree to use DocuThinker in compliance with all applicable
              laws and regulations. You are responsible for the content of the
              documents you upload and must ensure that you have the necessary
              permissions or rights to use them. You agree not to use
              DocuThinker for any unlawful or prohibited activities.
            </Typography>

            <Typography
              variant="h6"
              sx={{
                marginTop: 3,
                marginBottom: 2,
                font: "inherit",
                color: isDark ? "white" : "black",
                fontWeight: "bold",
                fontSize: "1.4rem",
              }}
            >
              4. Account Security
            </Typography>
            <Typography
              variant="body1"
              sx={{ marginBottom: 3, font: "inherit" }}
            >
              You are responsible for maintaining the confidentiality of your
              account credentials, including your username and password. You
              agree to notify us immediately if you suspect any unauthorized use
              of your account or any other security breach.
            </Typography>

            <Typography
              variant="h6"
              sx={{
                marginTop: 3,
                marginBottom: 2,
                font: "inherit",
                color: isDark ? "white" : "black",
                fontWeight: "bold",
                fontSize: "1.4rem",
              }}
            >
              5. Termination of Use
            </Typography>
            <Typography
              variant="body1"
              sx={{ marginBottom: 3, font: "inherit" }}
            >
              We reserve the right to terminate or suspend your access to
              DocuThinker at any time, without notice, if we believe that you
              have violated these terms, misused our services, or engaged in any
              unlawful activities.
            </Typography>

            <Typography
              variant="h6"
              sx={{
                marginTop: 3,
                marginBottom: 2,
                font: "inherit",
                color: isDark ? "white" : "black",
                fontWeight: "bold",
                fontSize: "1.4rem",
              }}
            >
              6. Intellectual Property
            </Typography>
            <Typography
              variant="body1"
              sx={{ marginBottom: 3, font: "inherit" }}
            >
              All content, features, and functionality on DocuThinker, including
              text, graphics, logos, and software, are the exclusive property of
              DocuThinker or its licensors. You may not reproduce, modify, or
              distribute any part of this platform without our prior written
              consent.
            </Typography>

            <Typography
              variant="h6"
              sx={{
                marginTop: 3,
                marginBottom: 2,
                font: "inherit",
                color: isDark ? "white" : "black",
                fontWeight: "bold",
                fontSize: "1.4rem",
              }}
            >
              7. Limitation of Liability
            </Typography>
            <Typography
              variant="body1"
              sx={{ marginBottom: 3, font: "inherit" }}
            >
              DocuThinker will not be liable for any direct, indirect,
              incidental, or consequential damages arising from your use of our
              platform. This includes any loss of data or damage to your device
              as a result of using our services.
            </Typography>

            <Typography
              variant="h6"
              sx={{
                marginTop: 3,
                marginBottom: 2,
                font: "inherit",
                color: isDark ? "white" : "black",
                fontWeight: "bold",
                fontSize: "1.4rem",
              }}
            >
              8. Modifications to the Terms
            </Typography>
            <Typography
              variant="body1"
              sx={{ marginBottom: 3, font: "inherit" }}
            >
              We reserve the right to modify these Terms of Service at any time.
              We will notify you of any significant changes by posting the
              updated terms on our website. Continued use of the platform after
              such changes constitutes your acceptance of the new terms.
            </Typography>

            <Typography
              variant="h6"
              sx={{
                marginTop: 3,
                marginBottom: 2,
                font: "inherit",
                color: isDark ? "white" : "black",
                fontWeight: "bold",
                fontSize: "1.4rem",
              }}
            >
              9. Governing Law
            </Typography>
            <Typography
              variant="body1"
              sx={{ marginBottom: 3, font: "inherit" }}
            >
              These Terms of Service are governed by and construed in accordance
              with the laws of your jurisdiction, without regard to its conflict
              of law provisions. You agree to submit to the exclusive
              jurisdiction of the courts in your country or region.
            </Typography>

            <Typography
              variant="h6"
              sx={{
                marginBottom: 2,
                font: "inherit",
                color: isDark ? "white" : "black",
                fontWeight: "bold",
                fontSize: "1.4rem",
              }}
            >
              10. Contact Information
            </Typography>
            <Typography
              variant="body1"
              sx={{ marginBottom: 3, font: "inherit" }}
            >
              If you have any questions about these Terms of Service, please
              contact us at:{" "}
              <a
                style={{ color: isDark ? "white" : "black" }}
                href={`mailto:hoangson091104@gmail.com`}
              >
                hoangson091104@gmail.com.
              </a>
            </Typography>

            <div
              style={{
                height: "20px",
                borderBottom: "1px solid #f0f0f0",
                marginBottom: "20px",
              }}
            />

            <Typography
              variant="body1"
              sx={{ font: "inherit", fontWeight: "bold" }}
            >
              Made with ❤️ by{" "}
              <a style={{ color: "#f57c00" }} href="https://sonnguyenhoang.com">
                Son Nguyen
              </a>{" "}
              in 2024. Thank you for using DocuThinker! 🚀
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default TermsOfService;
