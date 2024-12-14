const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const redis = require("redis");
require("dotenv").config();
const swaggerDocs = require("./swagger/swagger");

const {
  registerUser,
  loginUser,
  uploadDocument,
  generateKeyIdeas,
  generateDiscussionPoints,
  chatWithAI,
  forgotPassword,
  verifyEmail,
  getAllDocuments,
  getDocumentById,
  getDocumentDetails,
  deleteAllDocuments,
  deleteDocument,
  getDaysSinceJoined,
  getDocumentCount,
  updateUserEmail,
  updateUserPassword,
  getUserEmail,
  updateDocumentTitle,
  getUserJoinedDate,
  updateTheme,
  updateSocialMedia,
  getSocialMedia,
  sentimentAnalysis,
  actionableRecommendations,
  summaryInLanguage,
  bulletSummary,
  contentRewriting,
  searchDocuments,
  processAudioFile,
  refineSummary,
} = require("./controllers/controllers");

const app = express();
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));

// Initialize Redis client
let redisClient;
try {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
      tls: true,
      rejectUnauthorized: false,
    },
  });

  redisClient.connect();

  redisClient.on("connect", () => {
    console.log("Connected to Redis successfully!");
  });

  redisClient.on("error", (err) => {
    console.error("Redis connection error:", err);
  });

  redisClient.set("connectionTest", "connected", (err, reply) => {
    if (err) {
      console.error("Failed to set key in Redis:", err);
    } else {
      console.log("Successfully added key in Redis:", reply);
    }
  });
} catch (err) {
  console.error("Failed to initialize Redis:", err.message);
}

// Swagger setup
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocs, {
    customSiteTitle: "DocuThinker API Docs",
  }),
);

// Redirect root route to /api-docs
app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.post("/register", registerUser);
app.post("/login", loginUser);
app.post("/upload", uploadDocument);
app.post("/generate-key-ideas", generateKeyIdeas);
app.post("/generate-discussion-points", generateDiscussionPoints);
app.post("/chat", chatWithAI);
app.post("/forgot-password", forgotPassword);
app.post("/verify-email", verifyEmail);
app.get("/documents/:userId", getAllDocuments);
app.get("/documents/:userId/:docId", getDocumentById);
app.get("/document-details/:userId/:docId", getDocumentDetails);
app.delete("/documents/:userId/:docId", deleteDocument);
app.delete("/documents/:userId", deleteAllDocuments);
app.post("/update-email", updateUserEmail);
app.post("/update-password", updateUserPassword);
app.get("/days-since-joined/:userId", getDaysSinceJoined);
app.get("/document-count/:userId", getDocumentCount);
app.get("/users/:userId", getUserEmail);
app.post("/update-document-title", updateDocumentTitle);
app.get("/user-joined-date/:userId", getUserJoinedDate);
app.put("/update-theme", updateTheme);
app.get("/social-media/:userId", getSocialMedia);
app.post("/update-social-media", updateSocialMedia);
app.post("/sentiment-analysis", sentimentAnalysis);
app.post("/actionable-recommendations", actionableRecommendations);
app.post("/summary-in-language", summaryInLanguage);
app.post("/bullet-summary", bulletSummary);
app.post("/content-rewriting", contentRewriting);
app.get("/search-documents/:userId", searchDocuments);
app.post("/process-audio", processAudioFile);
app.post("/refine-summary", refineSummary);

// Error handling for unsupported routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack);
  res
    .status(500)
    .json({ error: "An internal server error occurred", details: err.message });
});

app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    res.status(401).json({ error: "Unauthorized request" });
  }

  next();
});

// Start the server
const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server ready on port ${port}.`);
});

module.exports = app;
