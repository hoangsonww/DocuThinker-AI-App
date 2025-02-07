const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

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
        url: "https://docuthinker-app-backend-api.vercel.app/",
        description: "Production server",
      },
      {
        url: "https://docuthinker-ai-app.onrender.com/",
        description: "Production server - Backup",
      },
      {
        url: "http://localhost:3000",
        description: "Local server - ensure you have the backend running",
      },
      {
        url: "http://127.0.0.1:3000",
        description: "Local server - ensure you have the backend running",
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
    path.resolve(__dirname, "../index.js"),
    path.resolve(__dirname, "../controllers/controllers.js"),
    path.resolve(__dirname, "../models/models.js"),
  ],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

module.exports = swaggerDocs;
