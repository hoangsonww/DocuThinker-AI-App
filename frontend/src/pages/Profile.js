import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  GitHub,
  LinkedIn,
  Facebook,
  Instagram,
  Edit as EditIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import axios from "axios";

const Profile = ({ theme }) => {
  const [email, setEmail] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [daysSinceJoined, setDaysSinceJoined] = useState(null);
  const [documentCount, setDocumentCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [joinedDate, setJoinedDate] = useState("");
  const [socialMedia, setSocialMedia] = useState({
    github: "",
    linkedin: "",
    facebook: "",
    instagram: "",
  });
  const [editingField, setEditingField] = useState(null);
  const [updatingSocialMedia, setUpdatingSocialMedia] = useState(false);
  const [error, setError] = useState("");
  const userId = localStorage.getItem("userId");
  const avatarUrl = "/OIP.jpg";
  const today = new Date().toLocaleDateString();

  console.log(updatingSocialMedia);

  useEffect(() => {
    if (userId) {
      const fetchData = async () => {
        try {
          const emailResponse = await axios.get(
            `https://docuthinker-ai-app.onrender.com/users/${userId}`,
          );
          const daysResponse = await axios.get(
            `https://docuthinker-ai-app.onrender.com/days-since-joined/${userId}`,
          );
          const documentResponse = await axios.get(
            `https://docuthinker-ai-app.onrender.com/document-count/${userId}`,
          );
          const joinedDateResponse = await axios.get(
            `https://docuthinker-ai-app.onrender.com/user-joined-date/${userId}`,
          );
          const socialMediaResponse = await axios.get(
            `https://docuthinker-ai-app.onrender.com/social-media/${userId}`,
          );

          if (
            !emailResponse.data ||
            !daysResponse.data ||
            !documentResponse.data ||
            !joinedDateResponse.data
          ) {
            setEmail("N/A");
            setDaysSinceJoined("N/A");
            setDocumentCount("N/A");
            setJoinedDate("N/A");
          } else {
            setEmail(emailResponse.data.email);
            setDaysSinceJoined(daysResponse.data.days);
            setDocumentCount(documentResponse.data.documentCount);
            setJoinedDate(
              new Date(joinedDateResponse.data.joinedDate).toLocaleDateString(),
            );
            setSocialMedia(socialMediaResponse.data.socialMedia || {});
          }

          setLoading(false);
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setLoading(false);
        }
      };

      fetchData();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const handleUpdateEmail = async () => {
    setUpdatingEmail(true);
    setError("");

    try {
      await axios.post("https://docuthinker-ai-app.onrender.com/update-email", {
        userId,
        newEmail,
      });
      setEmail(newEmail);
      setIsEditingEmail(false);
    } catch (err) {
      setError("Failed to update email. Please try again.");
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleUpdateSocialMedia = async () => {
    setUpdatingSocialMedia(true);
    try {
      await axios.post(
        "https://docuthinker-ai-app.onrender.com/update-social-media",
        {
          userId,
          ...socialMedia,
        },
      );
      setError("");
      setEditingField(null);
    } catch (err) {
      setError("Failed to update social media links.");
    } finally {
      setUpdatingSocialMedia(false);
    }
  };

  const formatLink = (platform, username) => {
    const baseUrls = {
      github: "https://github.com/",
      linkedin: "https://linkedin.com/in/",
      facebook: "https://facebook.com/",
      instagram: "https://instagram.com/",
    };
    return username ? baseUrls[platform] + username : "";
  };

  const getUsername = (url) => {
    if (url) {
      const match = url.match(
        /(?:https?:\/\/)?(?:www\.)?(?:github|linkedin|facebook|instagram)\.com\/([\w-]+)/,
      );
      return match ? match[1] : url;
    }
    return "";
  };

  const handleSocialMediaChange = (e) => {
    setSocialMedia({
      ...socialMedia,
      [e.target.name]: e.target.value,
    });
  };

  const handleKeyPress = (event, platform) => {
    if (event.key === "Enter") {
      handleUpdateSocialMedia(platform);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        p={4}
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!userId) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          height: "100vh",
          backgroundColor: theme === "dark" ? "#222" : "#f4f4f4",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: theme === "dark" ? "#fff" : "#000",
            font: "inherit",
            fontSize: "24px",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          You are not signed in. Please{" "}
          <a href="/login" style={{ color: "#f57c00" }}>
            log in
          </a>{" "}
          to view your profile.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        height: "100vh",
        backgroundColor: theme === "dark" ? "#222" : "#f4f4f4",
        paddingTop: 8,
        paddingBottom: 20,
        transition: "background-color 0.3s ease",
      }}
    >
      <Box
        sx={{
          backgroundColor: theme === "dark" ? "#333" : "#fff",
          color: theme === "dark" ? "#fff" : "#000",
          padding: 4,
          borderRadius: 2,
          width: "400px",
          textAlign: "center",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
          transition: "background-color 0.3s ease",
        }}
      >
        {/* Avatar Section */}
        <Box
          sx={{
            width: 150,
            height: 150,
            borderRadius: "50%",
            overflow: "hidden",
            margin: "0 auto 16px",
            border: "3px solid #f57c00",
          }}
        >
          <img
            src={avatarUrl}
            alt="User Avatar"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>

        <Typography
          variant="h5"
          sx={{ mb: 2, font: "inherit", fontWeight: "bold", fontSize: "24px" }}
        >
          Welcome, {email.split("@")[0]}!
        </Typography>

        <div
          style={{ borderBottom: "1px solid #ccc", marginBottom: "16px" }}
        ></div>

        <Typography
          variant="h5"
          sx={{ mb: 2, font: "inherit", fontWeight: "bold", fontSize: "20px" }}
        >
          Your Profile
        </Typography>

        {/* Display Email */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: 1.5,
          }}
        >
          <Typography sx={{ font: "inherit" }}>
            <strong>Email:</strong> {email}
          </Typography>
          <IconButton onClick={() => setIsEditingEmail(true)}>
            <EditIcon
              sx={{ color: theme === "dark" ? "#fff" : "#000" }}
              title="Edit Email Address"
            />
          </IconButton>
        </Box>

        {/* Editable email field */}
        {isEditingEmail && (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="New Email"
              variant="outlined"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              sx={{ mb: 2, textAlign: "center" }}
              inputProps={{
                style: {
                  fontFamily: "Poppins, sans-serif",
                  color: theme === "dark" ? "white" : "black",
                },
              }}
              InputLabelProps={{
                style: {
                  fontFamily: "Poppins, sans-serif",
                  color: theme === "dark" ? "white" : "#000",
                },
              }}
            />
            <Button
              onClick={handleUpdateEmail}
              variant="contained"
              color="primary"
              fullWidth
              disabled={updatingEmail}
              sx={{ font: "inherit" }}
            >
              {updatingEmail ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "Update Email"
              )}
            </Button>
            {error && (
              <Typography color="error" sx={{ mt: 1, font: "inherit" }}>
                {error}
              </Typography>
            )}
          </Box>
        )}

        {/* Display Days since joined */}
        <Typography sx={{ mb: 2.5, font: "inherit", textAlign: "center" }}>
          <strong>Days Since Joined:</strong> {daysSinceJoined}
        </Typography>

        {/* Display Joined Date */}
        <Typography sx={{ mb: 2.5, font: "inherit", textAlign: "center" }}>
          <strong>Date Joined:</strong> {joinedDate}
        </Typography>

        {/* Display Document Count */}
        <Typography sx={{ mb: 2.5, font: "inherit", textAlign: "center" }}>
          <strong>Documents Uploaded So Far:</strong> {documentCount}
        </Typography>

        {/* Display Today's Date */}
        <Typography sx={{ mb: 1.5, font: "inherit" }}>
          <strong>Today's Date:</strong> {today}
        </Typography>

        {/* Social Media Fields */}
        {["github", "linkedin", "facebook", "instagram"].map((platform) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1,
              flexWrap: "nowrap",
            }}
            key={platform}
          >
            {platform === "github" && <GitHub sx={{ mr: 1 }} />}
            {platform === "linkedin" && <LinkedIn sx={{ mr: 1 }} />}
            {platform === "facebook" && <Facebook sx={{ mr: 1 }} />}
            {platform === "instagram" && <Instagram sx={{ mr: 1 }} />}
            {editingField === platform ? (
              <TextField
                name={platform}
                value={socialMedia[platform]}
                onChange={handleSocialMediaChange}
                onKeyPress={(e) => handleKeyPress(e, platform)}
                sx={{ font: "inherit", textAlign: "center", flexGrow: 1 }}
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
            ) : (
              <>
                <Typography
                  sx={{
                    fontWeight: "bold",
                    mr: 1,
                    font: "inherit",
                    textAlign: "center",
                  }}
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}:
                </Typography>
                <Button
                  href={formatLink(platform, socialMedia[platform])}
                  target="_blank"
                  sx={{
                    fontWeight: "bold",
                    font: "inherit",
                    textTransform: "none",
                    wordWrap: "break-word",
                  }}
                >
                  {getUsername(socialMedia[platform]) || "Not Set"}
                </Button>
              </>
            )}
            <IconButton
              onClick={() =>
                setEditingField(editingField === platform ? null : platform)
              }
            >
              {editingField === platform ? (
                <SaveIcon sx={{ color: theme === "dark" ? "#fff" : "#000" }} />
              ) : (
                <EditIcon sx={{ color: theme === "dark" ? "#fff" : "#000" }} />
              )}
            </IconButton>
          </Box>
        ))}

        {/* Thank you message */}
        <Typography
          sx={{ mt: 3, font: "inherit", fontWeight: "bold", fontSize: "18px" }}
        >
          Thank you for exploring DocuThinker today! 🚀
        </Typography>

        <div
          style={{ borderBottom: "1px solid #ccc", marginTop: "16px" }}
        ></div>

        {/* Logout button */}
        <Button
          variant="contained"
          color="secondary"
          sx={{ mt: 3, font: "inherit" }}
          onClick={() => {
            localStorage.removeItem("userId");
            window.location.reload();
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
};

export default Profile;
