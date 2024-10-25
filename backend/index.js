const express = require("express");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const path = require("path");
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
  contentRewriting
} = require("./controllers/controllers");

const app = express();
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: true, // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // Allow credentials (cookies, authentication)
};

app.use(cors(corsOptions));

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "DocuThinker API Documentation",
      version: "1.1.0",
      description:
        "Comprehensive API documentation for the DocuThinker application.",
      termsOfService:
        "https://docuthinker-fullstack-app.vercel.app/terms-of-service",
      contact: {
        name: "DocuThinker",
        url: "https://docuthinker-fullstack-app.vercel.app/",
        email: "hoangson091104@gmail.com",
      },
      license: {
        name: "MIT License",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "https://docuthinker-ai-app.onrender.com/",
        description: "Production server",
      },
      {
        url: "http://127.0.0.1:3000",
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: [
    path.resolve(__dirname, "index.js"),
    path.resolve(__dirname, "controllers/controllers.js"),
  ],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
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
app.get("/documents/:userId", getAllDocuments); // Retrieve all documents
app.get("/documents/:userId/:docId", getDocumentById); // Retrieve specific document by ID
app.get("/document-details/:userId/:docId", getDocumentDetails); // Retrieve document details by ID
app.delete("/documents/:userId/:docId", deleteDocument); // Delete a specific document
app.delete("/documents/:userId", deleteAllDocuments); // Delete all documents for a user
app.post("/update-email", updateUserEmail); // Update email
app.post("/update-password", updateUserPassword); // Update password
app.get("/days-since-joined/:userId", getDaysSinceJoined); // Retrieve days since joined
app.get("/document-count/:userId", getDocumentCount); // Retrieve document count
app.get("/users/:userId", getUserEmail);
app.post("/update-document-title", updateDocumentTitle);
app.get("/user-joined-date/:userId", getUserJoinedDate);
app.put("/update-theme", updateTheme);
app.get("/social-media/:userId", getSocialMedia); // For getting social media links
app.post("/update-social-media", updateSocialMedia); // For updating social media links
app.post("/sentiment-analysis", sentimentAnalysis);
app.post("/actionable-recommendations", actionableRecommendations);
app.post("/summary-in-language", summaryInLanguage);
app.post("/bullet-summary", bulletSummary);
app.post("/content-rewriting", contentRewriting);

// Error handling for unsupported routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack);
  res
    .status(500)
    .json({ error: "An internal error occurred", details: err.message });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server ready on port ${port}.`);
});

module.exports = app;
