const favicon = require("serve-favicon");
const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const swaggerDocs = require("./swagger/swagger");
const { initializeRedis } = require("./redis/redisClient");
const { graphqlHTTP } = require("express-graphql");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const typeDefs = require("./graphql/schema");
const resolvers = require("./graphql/resolvers");

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
  origin: "*", // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false, // Must be false if using '*'
};

app.use(cors(corsOptions));

app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

const schema = makeExecutableSchema({ typeDefs, resolvers });

// GraphQL endpoint
app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true,
  }),
);

// Initialize Redis client
initializeRedis();

/**
 * Serve swagger.json
 * This route returns the JSON definition for the API documentation.
 */
app.get("/swagger.json", (req, res) => {
  res.json(swaggerDocs);
});

/**
 * Serve Swagger UI from a CDN
 * This route returns HTML that loads the Swagger UI assets from a CDN
 * and points it to /swagger.json.
 */
app.get("/api-docs", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>DocuThinker API Docs</title>
        <!-- Include the swagger-ui CSS from a CDN -->
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
        <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@4.15.5/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@4.15.5/favicon-16x16.png" sizes="16x16" />
        <style>
          body {
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <!-- Include the Swagger UI bundle and standalone preset from a CDN -->
        <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = function() {
            // Build a system
            const ui = SwaggerUIBundle({
              url: '/swagger.json',
              dom_id: '#swagger-ui',
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              layout: "StandaloneLayout"
            })
            window.ui = ui
          }
        </script>
      </body>
    </html>
  `);
});

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

if (process.env.NODE_ENV !== "production") {
  // For local development only.
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
