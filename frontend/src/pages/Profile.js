import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Avatar,
  Chip,
  Divider,
  Paper,
  Tooltip,
} from "@mui/material";
import {
  GitHub,
  LinkedIn,
  Facebook,
  Instagram,
  Twitter,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Description as DescriptionIcon,
  CalendarMonth as CalendarMonthIcon,
  EventAvailable as EventAvailableIcon,
  Today as TodayIcon,
  Email as EmailIcon,
  Logout as LogoutIcon,
  OpenInNew as OpenInNewIcon,
  CheckCircle as CheckCircleIcon,
  AccountCircle as AccountCircleIcon,
} from "@mui/icons-material";
import axios from "axios";
import { clearAuth } from "../utils/auth";

const ORANGE = "#f57c00";

const Profile = ({ theme }) => {
  const [email, setEmail] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [daysSinceJoined, setDaysSinceJoined] = useState(null);
  const [documentCount, setDocumentCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [joinedDate, setJoinedDate] = useState("");
  const avatarImages = [
    "/OIP.jpg",
    "/OIP2.webp",
    "/OIP3.png",
    "/OIP4.png",
    "/OIP5.png",
    "/OIP6.webp",
    "/OIP7.webp",
    "/OIP8.webp",
    "/OIP9.webp",
    "/OIP10.webp",
    "/OIP11.webp",
    "/OIP12.webp",
    "/OIP13.webp",
    "/OIP14.webp",
    "/OIP15.webp",
    "/OIP16.webp",
    "/OIP17.webp",
    "/OIP18.webp",
    "/OIP19.webp",
    "/OIP20.webp",
    "/OIP21.webp",
    "/OIP22.webp",
    "/OIP23.webp",
    "/OIP24.webp",
    "/OIP25.webp",
  ];
  const [socialMedia, setSocialMedia] = useState({
    github: "",
    linkedin: "",
    facebook: "",
    instagram: "",
    twitter: "",
  });
  const [editingField, setEditingField] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [updatingSocialMedia, setUpdatingSocialMedia] = useState(false);
  const [error, setError] = useState("");
  const userId = localStorage.getItem("userId");
  const [randomAvatar, setRandomAvatar] = useState("");
  const today = new Date().toLocaleDateString();
  // eslint-disable-next-line no-unused-vars
  const [loadingSocialMedia, setLoadingSocialMedia] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPlatform, setLoadingPlatform] = useState({
    github: false,
    linkedin: false,
    facebook: false,
    instagram: false,
    twitter: false,
  });

  const dark = theme === "dark";
  const pageBg = dark ? "#1e1e1e" : "#f5f5f5";
  const cardBg = dark ? "#2a2a2a" : "#ffffff";
  const subText = dark ? "#b5b5b5" : "#666";
  const heading = dark ? "#ffffff" : "#1a1a1a";
  const cardBorder = dark ? "1px solid #3a3a3a" : "1px solid #ececec";
  const cardSx = {
    bgcolor: cardBg,
    border: cardBorder,
    borderRadius: "18px",
    boxShadow: dark
      ? "0 2px 12px rgba(0,0,0,0.35)"
      : "0 2px 14px rgba(0,0,0,0.06)",
  };
  const tooltipSlotProps = {
    tooltip: {
      sx: { fontFamily: "Poppins, sans-serif", fontSize: "12px" },
    },
  };

  useEffect(() => {
    setRandomAvatar(
      avatarImages[Math.floor(Math.random() * avatarImages.length)],
    );

    if (userId) {
      const fetchData = async () => {
        try {
          const emailResponse = await axios.get(
            `https://docuthinker-app-backend-api.vercel.app/users/${userId}`,
          );
          const daysResponse = await axios.get(
            `https://docuthinker-app-backend-api.vercel.app/days-since-joined/${userId}`,
          );
          const documentResponse = await axios.get(
            `https://docuthinker-app-backend-api.vercel.app/document-count/${userId}`,
          );
          const joinedDateResponse = await axios.get(
            `https://docuthinker-app-backend-api.vercel.app/user-joined-date/${userId}`,
          );
          const socialMediaResponse = await axios.get(
            `https://docuthinker-app-backend-api.vercel.app/social-media/${userId}`,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleUpdateEmail = async () => {
    setUpdatingEmail(true);
    setError("");
    setLoadingEmail(true);

    try {
      await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/update-email",
        {
          userId,
          newEmail,
        },
      );
      setEmail(newEmail);
      setIsEditingEmail(false);
    } catch (err) {
      setError("Failed to update email. Please try again.");
    } finally {
      setUpdatingEmail(false);
      setLoadingEmail(false);
    }
  };

  const handleSocialMediaChange = (e) => {
    const platform = e.target.name;
    const value = e.target.value;

    // Extract username from the full URL if entered
    const extractUsername = (url) => {
      const match = url.match(
        /(?:https?:\/\/)?(?:www\.)?(?:github\.com|linkedin\.com\/in|facebook\.com|instagram\.com|twitter\.com|x\.com)\/([\w-]+)/i,
      );
      return match ? match[1] : url; // If a match is found, return the username; otherwise, return the input as is
    };

    setSocialMedia({
      ...socialMedia,
      [platform]: extractUsername(value),
    });
  };

  const handleUpdateSocialMedia = async (platform) => {
    setLoadingPlatform((prevState) => ({ ...prevState, [platform]: true }));
    setError("");

    try {
      // Ensure only usernames are sent to the backend
      const socialMediaToSend = {
        ...socialMedia,
      };

      await axios.post(
        "https://docuthinker-app-backend-api.vercel.app/update-social-media",
        {
          userId,
          ...socialMediaToSend, // Spread the updated social media object
        },
      );

      setError("");
      setEditingField(null); // Close the editing mode
    } catch (err) {
      setError(`Failed to update ${platform} link.`);
    } finally {
      setLoadingPlatform((prevState) => ({ ...prevState, [platform]: false }));
    }
  };

  const formatLink = (platform, username) => {
    const baseUrls = {
      github: "https://github.com/",
      linkedin: "https://linkedin.com/in/",
      facebook: "https://facebook.com/",
      instagram: "https://instagram.com/",
      twitter: "https://twitter.com/",
    };
    return username ? baseUrls[platform] + username : "";
  };

  const getUsername = (url) => {
    if (url) {
      const match = url.match(
        /(?:https?:\/\/)?(?:www\.)?(?:github\.com|linkedin\.com\/in|facebook\.com|instagram\.com|twitter\.com|x\.com)\/([\w-]+)/i,
      );
      return match ? match[1] : url;
    }
    return "";
  };

  const handleKeyPress = (event, platform) => {
    if (event.key === "Enter") {
      handleUpdateSocialMedia(platform);
    }
  };

  const socialMeta = {
    github: {
      label: "GitHub",
      icon: <GitHub />,
      color: dark ? "#fff" : "#24292f",
    },
    linkedin: { label: "LinkedIn", icon: <LinkedIn />, color: "#0a66c2" },
    facebook: { label: "Facebook", icon: <Facebook />, color: "#1877f2" },
    instagram: { label: "Instagram", icon: <Instagram />, color: "#e4405f" },
    twitter: { label: "Twitter", icon: <Twitter />, color: "#1da1f2" },
  };

  const stats = [
    {
      icon: <DescriptionIcon />,
      label: "Documents Uploaded",
      value: documentCount ?? "—",
    },
    {
      icon: <CalendarMonthIcon />,
      label: "Days Since Joined",
      value: daysSinceJoined ?? "—",
    },
    {
      icon: <EventAvailableIcon />,
      label: "Date Joined",
      value: joinedDate || "—",
    },
    { icon: <TodayIcon />, label: "Today", value: today },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: pageBg,
        }}
      >
        <CircularProgress sx={{ color: ORANGE }} />
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
          minHeight: "100vh",
          px: 2,
          backgroundColor: pageBg,
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            ...cardSx,
            p: { xs: 4, md: 5 },
            textAlign: "center",
            maxWidth: "420px",
          }}
        >
          <AccountCircleIcon sx={{ fontSize: 56, color: ORANGE, mb: 1 }} />
          <Typography
            sx={{
              font: "inherit",
              fontWeight: 700,
              fontSize: "20px",
              color: heading,
              mb: 1,
            }}
          >
            You're not signed in
          </Typography>
          <Typography
            sx={{ font: "inherit", fontSize: "14px", color: subText }}
          >
            Please{" "}
            <a href="/login" style={{ color: ORANGE, fontWeight: 600 }}>
              log in
            </a>{" "}
            to view your profile.
          </Typography>
        </Paper>
      </Box>
    );
  }

  const username = email && email.includes("@") ? email.split("@")[0] : email;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: pageBg,
        transition: "background-color 0.3s ease",
        py: { xs: 3, md: 5 },
        px: 2,
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <Box sx={{ maxWidth: "860px", mx: "auto" }}>
        {/* ===== Hero ===== */}
        <Paper elevation={0} sx={{ ...cardSx, overflow: "hidden", mb: 3 }}>
          <Box
            sx={{
              height: { xs: 90, md: 110 },
              background: `linear-gradient(135deg, ${ORANGE} 0%, #ff8a00 55%, #ffb74d 100%)`,
            }}
          />
          <Box
            sx={{
              px: { xs: 3, md: 4 },
              pb: 3,
              mt: { xs: "-52px", sm: "-60px" },
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "center", sm: "flex-end" },
              gap: 2,
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            <Avatar
              src={randomAvatar}
              alt="User Avatar"
              sx={{
                width: { xs: 104, sm: 120 },
                height: { xs: 104, sm: 120 },
                border: `4px solid ${cardBg}`,
                boxShadow: "0 6px 18px rgba(0,0,0,0.22)",
              }}
            />
            <Box
              sx={{
                flexGrow: 1,
                minWidth: 0,
                pt: { xs: 1.5, sm: 2 },
                pb: { sm: 0.5 },
              }}
            >
              <Typography
                sx={{
                  font: "inherit",
                  fontWeight: 700,
                  fontSize: { xs: "22px", md: "26px" },
                  color: heading,
                  lineHeight: 1.2,
                }}
              >
                Welcome, {username}!
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  justifyContent: { xs: "center", sm: "flex-start" },
                  mt: 0.5,
                }}
              >
                <EmailIcon sx={{ fontSize: 16, color: subText }} />
                <Typography
                  sx={{
                    font: "inherit",
                    fontSize: "14px",
                    color: subText,
                    wordBreak: "break-all",
                  }}
                >
                  {email}
                </Typography>
              </Box>
            </Box>
            <Chip
              icon={<CheckCircleIcon sx={{ color: "#2e7d32 !important" }} />}
              label="Active member"
              sx={{
                font: "inherit",
                fontWeight: 600,
                fontSize: "12px",
                color: dark ? "#a5d6a7" : "#2e7d32",
                bgcolor: dark ? "rgba(46,125,50,0.18)" : "rgba(46,125,50,0.1)",
                border: "none",
              }}
            />
          </Box>
        </Paper>

        {/* ===== Stat cards ===== */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: { xs: 1.5, md: 2 },
            mb: 3,
          }}
        >
          {stats.map((s) => (
            <Paper
              key={s.label}
              elevation={0}
              sx={{ ...cardSx, p: { xs: 2, md: 2.5 }, textAlign: "center" }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  mx: "auto",
                  mb: 1.2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: ORANGE,
                  bgcolor: dark
                    ? "rgba(245,124,0,0.16)"
                    : "rgba(245,124,0,0.1)",
                }}
              >
                {s.icon}
              </Box>
              <Typography
                sx={{
                  font: "inherit",
                  fontWeight: 700,
                  fontSize: { xs: "16px", md: "18px" },
                  color: heading,
                  lineHeight: 1.2,
                  wordBreak: "break-word",
                }}
              >
                {s.value}
              </Typography>
              <Typography
                sx={{
                  font: "inherit",
                  fontSize: "12px",
                  color: subText,
                  mt: 0.5,
                }}
              >
                {s.label}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* ===== Account ===== */}
        <Paper elevation={0} sx={{ ...cardSx, p: { xs: 3, md: 3.5 }, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
            <EmailIcon sx={{ color: ORANGE, fontSize: 22 }} />
            <Typography
              sx={{
                font: "inherit",
                fontWeight: 700,
                fontSize: "17px",
                color: heading,
              }}
            >
              Account
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{ font: "inherit", fontSize: "12px", color: subText }}
              >
                Email address
              </Typography>
              <Typography
                sx={{
                  font: "inherit",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: heading,
                  wordBreak: "break-all",
                }}
              >
                {email}
              </Typography>
            </Box>
            {!isEditingEmail && (
              <Button
                startIcon={<EditIcon />}
                onClick={() => {
                  setNewEmail(email);
                  setIsEditingEmail(true);
                }}
                sx={{
                  font: "inherit",
                  textTransform: "none",
                  fontWeight: 600,
                  color: ORANGE,
                  flexShrink: 0,
                  "&:hover": { bgcolor: "rgba(245,124,0,0.08)" },
                }}
              >
                Edit
              </Button>
            )}
          </Box>

          {isEditingEmail && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="New Email"
                variant="outlined"
                size="small"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                sx={{ mb: 2 }}
                inputProps={{
                  style: {
                    fontFamily: "Poppins, sans-serif",
                    color: dark ? "white" : "black",
                  },
                }}
                InputLabelProps={{
                  style: {
                    fontFamily: "Poppins, sans-serif",
                    color: dark ? "#ccc" : "#666",
                  },
                }}
              />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Box sx={{ position: "relative", flexGrow: 1 }}>
                  <Button
                    onClick={handleUpdateEmail}
                    variant="contained"
                    fullWidth
                    disabled={updatingEmail}
                    sx={{
                      font: "inherit",
                      textTransform: "none",
                      fontWeight: 600,
                      bgcolor: ORANGE,
                      "&:hover": { bgcolor: "#e65100" },
                    }}
                  >
                    {updatingEmail ? "Updating..." : "Update Email"}
                  </Button>
                  {updatingEmail && (
                    <CircularProgress
                      size={22}
                      sx={{
                        color: "white",
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        marginTop: "-11px",
                        marginLeft: "-11px",
                      }}
                    />
                  )}
                </Box>
                <Button
                  onClick={() => {
                    setIsEditingEmail(false);
                    setError("");
                  }}
                  startIcon={<CloseIcon />}
                  sx={{
                    font: "inherit",
                    textTransform: "none",
                    fontWeight: 600,
                    color: subText,
                  }}
                >
                  Cancel
                </Button>
              </Box>
              {error && (
                <Typography
                  color="error"
                  sx={{ mt: 1.5, font: "inherit", fontSize: "13px" }}
                >
                  {error}
                </Typography>
              )}
            </Box>
          )}
        </Paper>

        {/* ===== Connected accounts ===== */}
        <Paper elevation={0} sx={{ ...cardSx, p: { xs: 3, md: 3.5 }, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <AccountCircleIcon sx={{ color: ORANGE, fontSize: 22 }} />
            <Typography
              sx={{
                font: "inherit",
                fontWeight: 700,
                fontSize: "17px",
                color: heading,
              }}
            >
              Connected accounts
            </Typography>
          </Box>
          <Typography
            sx={{ font: "inherit", fontSize: "13px", color: subText, mb: 1 }}
          >
            Link your social profiles so others can find you.
          </Typography>

          {["github", "linkedin", "facebook", "instagram", "twitter"].map(
            (platform, idx) => {
              const meta = socialMeta[platform];
              const uname = getUsername(socialMedia[platform]);
              const isEditing = editingField === platform;
              return (
                <Box key={platform}>
                  {idx > 0 && (
                    <Divider
                      sx={{ borderColor: dark ? "#3a3a3a" : "#f0f0f0" }}
                    />
                  )}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: isEditing ? "flex-end" : "center",
                      gap: 1.5,
                      py: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "10px",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: meta.color,
                        bgcolor: dark ? "rgba(255,255,255,0.06)" : "#f4f5f7",
                      }}
                    >
                      {meta.icon}
                    </Box>

                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          font: "inherit",
                          fontWeight: 600,
                          fontSize: "14px",
                          color: heading,
                        }}
                      >
                        {meta.label}
                      </Typography>
                      {isEditing ? (
                        <TextField
                          name={platform}
                          value={socialMedia[platform] || ""}
                          label="Enter username"
                          size="small"
                          fullWidth
                          autoFocus
                          onChange={handleSocialMediaChange}
                          onKeyPress={(e) => handleKeyPress(e, platform)}
                          sx={{ mt: 1.5 }}
                          inputProps={{
                            style: {
                              fontFamily: "Poppins, sans-serif",
                              color: dark ? "white" : "black",
                            },
                          }}
                          InputLabelProps={{
                            style: {
                              fontFamily: "Poppins, sans-serif",
                              color: dark ? "#ccc" : "#666",
                            },
                          }}
                        />
                      ) : uname ? (
                        <Box
                          component="a"
                          href={formatLink(platform, socialMedia[platform])}
                          target="_blank"
                          rel="noreferrer"
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.4,
                            color: ORANGE,
                            textDecoration: "none",
                            fontSize: "13px",
                            fontWeight: 500,
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          @{uname}
                          <OpenInNewIcon sx={{ fontSize: 14 }} />
                        </Box>
                      ) : (
                        <Typography
                          sx={{
                            font: "inherit",
                            fontSize: "13px",
                            color: subText,
                          }}
                        >
                          Not connected
                        </Typography>
                      )}
                    </Box>

                    {!isEditing && (
                      <Chip
                        size="small"
                        label={uname ? "Connected" : "Not set"}
                        sx={{
                          font: "inherit",
                          fontSize: "11px",
                          fontWeight: 600,
                          height: 22,
                          color: uname
                            ? dark
                              ? "#a5d6a7"
                              : "#2e7d32"
                            : subText,
                          bgcolor: uname
                            ? dark
                              ? "rgba(46,125,50,0.18)"
                              : "rgba(46,125,50,0.1)"
                            : dark
                              ? "rgba(255,255,255,0.06)"
                              : "#f0f0f0",
                        }}
                      />
                    )}

                    {isEditing ? (
                      loadingPlatform[platform] ? (
                        <CircularProgress size={22} sx={{ color: ORANGE }} />
                      ) : (
                        <Tooltip title="Save" slotProps={tooltipSlotProps}>
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateSocialMedia(platform)}
                          >
                            <SaveIcon sx={{ color: ORANGE }} />
                          </IconButton>
                        </Tooltip>
                      )
                    ) : (
                      <Tooltip
                        title={`Edit ${meta.label}`}
                        slotProps={tooltipSlotProps}
                      >
                        <IconButton
                          size="small"
                          onClick={() => setEditingField(platform)}
                        >
                          <EditIcon
                            sx={{
                              fontSize: 19,
                              color: subText,
                              "&:hover": { color: ORANGE },
                            }}
                          />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              );
            },
          )}
        </Paper>

        {/* ===== Footer ===== */}
        <Paper
          elevation={0}
          sx={{
            ...cardSx,
            p: { xs: 3, md: 3.5 },
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              font: "inherit",
              fontWeight: 600,
              fontSize: "16px",
              color: heading,
              mb: 2,
            }}
          >
            Thank you for exploring DocuThinker today! 🚀
          </Typography>
          <Button
            variant="contained"
            startIcon={<LogoutIcon />}
            onClick={() => {
              clearAuth();
              window.location.reload();
            }}
            sx={{
              font: "inherit",
              textTransform: "none",
              fontWeight: 600,
              bgcolor: ORANGE,
              borderRadius: "10px",
              px: 3,
              "&:hover": { bgcolor: "#e65100" },
            }}
          >
            Logout
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default Profile;
