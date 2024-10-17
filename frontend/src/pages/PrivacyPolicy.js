import React from "react";
import { Box, Typography } from "@mui/material";

const PrivacyPolicy = ({ theme }) => {
  const isDark = theme === "dark";

  return (
    <Box
      sx={{
        padding: { xs: 2, sm: 4 },
        bgcolor: isDark ? "#1e1e1e" : "#ffffff",
        color: isDark ? "white" : "black",
        minHeight: "100vh",
        transition: "background-color 0.3s ease",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          marginBottom: 3,
          font: "inherit",
          color: isDark ? "white" : "black",
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "2rem",
        }}
      >
        Privacy Policy
      </Typography>

      <Box sx={{ maxWidth: "800px", margin: "0 auto" }}>
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
          1. Introduction
        </Typography>
        <Typography variant="body1" sx={{ marginBottom: 3, font: "inherit" }}>
          Welcome to DocuThinker App. This Privacy Policy explains how we
          collect, use, and protect your personal information when you use our
          website and services. Your privacy is important to us, and we are
          committed to ensuring that your personal information is handled
          securely and responsibly.
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
          2. Information We Collect
        </Typography>
        <Typography variant="body1" sx={{ marginBottom: 3, font: "inherit" }}>
          We may collect the following types of information:
        </Typography>
        <ul
          style={{
            marginBottom: 3,
            paddingLeft: "20px",
            listStyleType: "disc",
            font: "inherit",
          }}
        >
          <li>
            <Typography variant="body1" sx={{ font: "inherit" }}>
              Your uploaded documents (PDF or DOCX files) - we will only process
              them to provide our services. We may store them securely in our
              databases so that signed in users can access them later. We do not
              share your documents with third parties and do not store documents
              of users who are not signed in.
            </Typography>
          </li>
          <li>
            <Typography variant="body1" sx={{ font: "inherit" }}>
              Usage data (IP address, browser type, time spent on site, etc.) -
              This information is collected by Google Analytics and helps us
              understand how users interact with our website.
            </Typography>
          </li>
          <li>
            <Typography variant="body1" sx={{ font: "inherit" }}>
              Personal information (name, email address) - We collect this
              information when you sign up for an account. We use it to provide
              our services only.
            </Typography>
          </li>
        </ul>

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
          3. How We Use Your Information
        </Typography>
        <Typography variant="body1" sx={{ marginBottom: 3, font: "inherit" }}>
          We use the information we collect to:
        </Typography>
        <ul
          style={{
            marginBottom: 3,
            paddingLeft: "20px",
            listStyleType: "disc",
            font: "inherit",
          }}
        >
          <li>
            <Typography variant="body1" sx={{ font: "inherit" }}>
              Provide and operate our services.
            </Typography>
          </li>
          <li>
            <Typography variant="body1" sx={{ font: "inherit" }}>
              Improve, personalize, and expand our website and services.
            </Typography>
          </li>
          <li>
            <Typography variant="body1" sx={{ font: "inherit" }}>
              Communicate with you about updates, promotions, and changes to our
              services.
            </Typography>
          </li>
          <li>
            <Typography variant="body1" sx={{ font: "inherit" }}>
              Comply with legal obligations and ensure the security of our
              platform.
            </Typography>
          </li>
        </ul>

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
          4. How We Protect Your Data
        </Typography>
        <Typography variant="body1" sx={{ marginBottom: 3, font: "inherit" }}>
          We implement various security measures to protect your personal
          information. These measures include secure data storage, encryption,
          and access controls. However, no data transmission over the internet
          is 100% secure, and we cannot guarantee the absolute security of your
          information.
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
          5. Third-Party Services
        </Typography>
        <Typography variant="body1" sx={{ marginBottom: 3, font: "inherit" }}>
          We may use third-party services (such as Google Drive and Dropbox) to
          facilitate file uploads and other services. These third parties may
          have their own privacy policies governing how they handle your data.
          We encourage you to review the privacy policies of any third-party
          services you use through our platform.
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
          6. Your Data Rights
        </Typography>
        <Typography variant="body1" sx={{ marginBottom: 3, font: "inherit" }}>
          You have the right to:
        </Typography>
        <ul
          style={{
            marginBottom: 3,
            paddingLeft: "20px",
            listStyleType: "disc",
            font: "inherit",
          }}
        >
          <li>
            <Typography variant="body1" sx={{ font: "inherit" }}>
              Access, update, or delete your personal information.
            </Typography>
          </li>
          <li>
            <Typography variant="body1" sx={{ font: "inherit" }}>
              Withdraw consent for data processing where consent was previously
              given.
            </Typography>
          </li>
          <li>
            <Typography variant="body1" sx={{ font: "inherit" }}>
              File a complaint with your local data protection authority if you
              believe your rights are violated. But, please try to reach out to
              us first so we can address your concerns.
            </Typography>
          </li>
        </ul>

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
          7. Changes to This Privacy Policy
        </Typography>
        <Typography variant="body1" sx={{ marginBottom: 3, font: "inherit" }}>
          We may update this Privacy Policy from time to time to reflect changes
          in our practices or applicable laws. We will notify you of any
          significant changes by posting the updated policy on our website.
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
          8. Contact Us
        </Typography>
        <Typography variant="body1" sx={{ marginBottom: 3, font: "inherit" }}>
          If you have any questions about this Privacy Policy or how we handle
          your personal information, please contact us at:{" "}
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
          in 2024. Thank you for visiting DocuThinker! 🚀
        </Typography>
      </Box>
    </Box>
  );
};

export default PrivacyPolicy;
