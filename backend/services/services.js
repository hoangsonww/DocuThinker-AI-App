const firebaseAdmin = require("firebase-admin");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require("multer");
const {
  GoogleAIFileManager,
  FileState,
} = require("@google/generative-ai/server");
require("dotenv").config();

// Parse the private key (ensuring it's correctly formatted)
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

// Multer setup for handling file uploads
const uploadDir = "/tmp/uploads";

// Ensure `/tmp/uploads` exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

// Initialize Firebase Admin using environment variables from .env
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert({
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: privateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url:
      process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

// Firestore for storing user documents
const firestore = firebaseAdmin.firestore();

const GEMINI_MODEL_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_GEMINI_MODEL_FALLBACK = "gemini-2.5-flash";

let geminiModelCache = {
  fetchedAt: 0,
  models: [],
};
let geminiModelRotationIndex = 0;

const getGoogleAiApiKey = () => {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not configured.");
  }
  return apiKey;
};

const normalizeGeminiModelName = (name) => name.replace(/^models\//, "");

const shouldIncludeGeminiModel = (model) => {
  if (!model || typeof model.name !== "string") {
    return false;
  }

  const name = model.name.toLowerCase();
  if (!name.includes("gemini")) {
    return false;
  }
  if (name.includes("embedding")) {
    return false;
  }
  if (name.includes("pro")) {
    return false;
  }

  const supportedMethods = model.supportedGenerationMethods;
  if (Array.isArray(supportedMethods)) {
    return supportedMethods.includes("generateContent");
  }

  return true;
};

const fetchGeminiModels = async () => {
  const response = await axios.get(
    "https://generativelanguage.googleapis.com/v1/models",
    {
      params: {
        key: getGoogleAiApiKey(),
      },
    },
  );

  const models = Array.isArray(response.data?.models)
    ? response.data.models
    : [];
  const filteredModels = models
    .filter(shouldIncludeGeminiModel)
    .map((model) => normalizeGeminiModelName(model.name));
  const uniqueModels = [...new Set(filteredModels)];

  return uniqueModels.length > 0
    ? uniqueModels
    : [DEFAULT_GEMINI_MODEL_FALLBACK];
};

const getGeminiModelNames = async () => {
  const now = Date.now();
  if (
    geminiModelCache.models.length > 0 &&
    now - geminiModelCache.fetchedAt < GEMINI_MODEL_CACHE_TTL_MS
  ) {
    return geminiModelCache.models;
  }

  try {
    const models = await fetchGeminiModels();
    geminiModelCache = {
      fetchedAt: now,
      models,
    };
    return models;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[Gemini] Failed to fetch models: ${errorMessage}`);

    if (geminiModelCache.models.length > 0) {
      return geminiModelCache.models;
    }

    return [DEFAULT_GEMINI_MODEL_FALLBACK];
  }
};

const rotateGeminiModels = (models) => {
  if (!Array.isArray(models) || models.length === 0) {
    return [];
  }

  const startIndex = geminiModelRotationIndex % models.length;
  geminiModelRotationIndex = (startIndex + 1) % models.length;
  return models.slice(startIndex).concat(models.slice(0, startIndex));
};

const extractGeminiResponseText = (result, errorMessage) => {
  if (!result?.response || typeof result.response.text !== "function") {
    throw new Error(errorMessage);
  }
  return result.response.text();
};

const withGeminiModelFallback = async (label, handler) => {
  const models = rotateGeminiModels(await getGeminiModelNames());

  if (models.length === 0) {
    throw new Error("No Gemini models available to handle the request.");
  }

  let lastError = null;
  for (const modelName of models) {
    try {
      return await handler(modelName);
    } catch (error) {
      lastError = error;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn(`[Gemini] ${label} failed on ${modelName}: ${errorMessage}`);
    }
  }

  throw lastError;
};

const runGeminiChat = async ({
  label,
  systemInstruction,
  history,
  message,
  errorMessage,
}) => {
  return withGeminiModelFallback(label, async (modelName) => {
    const genAI = new GoogleGenerativeAI(getGoogleAiApiKey());
    const modelOptions = { model: modelName };
    if (systemInstruction) {
      modelOptions.systemInstruction = systemInstruction;
    }

    const model = genAI.getGenerativeModel(modelOptions);
    const chatSession = model.startChat({ history });
    const result = await chatSession.sendMessage(message);
    return extractGeminiResponseText(result, errorMessage);
  });
};

const runGeminiContent = async ({
  label,
  modelOptions = {},
  prompt,
  errorMessage,
}) => {
  return withGeminiModelFallback(label, async (modelName) => {
    const genAI = new GoogleGenerativeAI(getGoogleAiApiKey());
    const model = genAI.getGenerativeModel({
      model: modelName,
      ...modelOptions,
    });
    const result = await model.generateContent(prompt);
    return extractGeminiResponseText(result, errorMessage);
  });
};

/**
 * Create a new user in Firebase Auth
 * @param email - User email
 * @param password - User password
 * @returns {Promise<UserRecord>} - Firebase Auth User Record
 */
exports.createUser = async (email, password) => {
  return await firebaseAdmin.auth().createUser({ email, password });
};

/**
 * Login user and generate custom token
 * @param email - User email
 * @returns {Promise<string>} - Custom token for the user
 */
exports.loginUser = async (email) => {
  const user = await firebaseAdmin.auth().getUserByEmail(email);
  return await firebaseAdmin.auth().createCustomToken(user.uid);
};

// --- CURRENTLY UNUSED FUNCTIONS. APP IS USING HF TRANSFORMERS MODELS INSTEAD ---

/**
 * Generate a summary from the provided text.
 * @param {string} text - The text content of the document.
 * @returns {Promise<{summary: string, originalText: string}>} - Generated summary and original text.
 */
exports.generateSummary = async (text) => {
  if (!text) throw new Error("No text provided");

  const summaryText = await runGeminiChat({
    label: "generateSummary",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Summarize the provided document text in paragraphs (not bullet points).`,
    history: [{ role: "user", parts: [{ text }] }],
    message: text,
    errorMessage: "Failed to generate a summary from the AI",
  });

  return {
    summary: summaryText,
    originalText: text,
  };
};

/**
 * Process an audio file and generate a summary
 * @param file - File object with filepath and mimetype
 * @param context - Additional context for the AI model
 * @returns {Promise<{summary: string}>} - Generated summary
 */
exports.processAudio = async (file, context) => {
  const fileBuffer = fs.readFileSync(file.filepath);
  const mimeType = file.mimetype;

  // Accept both "audio/wav", "audio/wave", and "audio/mp3" formats
  if (!["audio/wav", "audio/wave", "audio/mp3"].includes(mimeType)) {
    throw new Error(
      "Unsupported audio format. Please upload a WAV or MP3 file.",
    );
  }

  const fileManager = new GoogleAIFileManager(process.env.GOOGLE_AI_API_KEY);

  // Upload file to Gemini
  const uploadResult = await fileManager.uploadFile(file.filepath, {
    mimeType: mimeType,
    displayName: "User Uploaded Audio",
  });

  let uploadedFile = await fileManager.getFile(uploadResult.file.name);
  while (uploadedFile.state === FileState.PROCESSING) {
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds before re-checking the state
    uploadedFile = await fileManager.getFile(uploadResult.file.name);
  }

  if (uploadedFile.state === FileState.FAILED) {
    throw new Error("Audio processing failed.");
  }

  // Generate transcription or summary with context if provided
  const prompt = [
    {
      fileData: {
        fileUri: uploadedFile.uri,
        mimeType: mimeType,
      },
    },
    {
      text: `${process.env.AI_INSTRUCTIONS}. Please respond conversationally to the user and do what the user asks you 
      to do. If the user asks a question, provide a detailed answer.${
        context
          ? " Here is some additional context about the document being referred to by the user. Answer based on this document: " +
            context
          : ""
      }.`,
    },
  ];

  const summaryText = await runGeminiContent({
    label: "processAudio",
    prompt,
    errorMessage: "Failed to generate a summary from the AI",
  });

  return {
    summary: summaryText,
  };
};

/**
 * Process a text document and generate key ideas
 * @param documentText - Text content of the document
 * @returns {Promise<string>} - Generated key ideas
 */
exports.generateKeyIdeas = async (documentText) => {
  return await runGeminiChat({
    label: "generateKeyIdeas",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Generate key ideas from the provided text.`,
    history: [{ role: "user", parts: [{ text: documentText }] }],
    message: documentText,
    errorMessage: "Failed to generate key ideas from the AI",
  });
};

/**
 * Process a text document and generate discussion points
 * @param documentText - Text content of the document
 * @returns {Promise<string>} - Generated discussion points
 */
exports.generateDiscussionPoints = async (documentText) => {
  return await runGeminiChat({
    label: "generateDiscussionPoints",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Generate discussion points from the provided text.`,
    history: [{ role: "user", parts: [{ text: documentText }] }],
    message: documentText,
    errorMessage: "Failed to generate discussion points from the AI",
  });
};

// In-memory store for conversation history per session
let sessionHistory = {};

/**
 * Check if the text is valid (non-empty string)
 * @param text - Text to validate
 * @returns {boolean} - Whether the text is valid
 */
const isValidText = (text) => {
  return typeof text === "string" && text.trim().length > 0;
};

/**
 * Chat with the AI using the provided message
 * @param sessionId - Unique session ID for the conversation
 * @param message - User message to send to the AI
 * @param originalText - Original text for the conversation
 * @returns {Promise<string>} - AI response message
 */
exports.chatWithAI = async (sessionId, message, originalText) => {
  // Initialize the conversation history if not present
  if (!sessionHistory[sessionId]) {
    sessionHistory[sessionId] = [];
  }

  // Retrieve the conversation history for this session
  let history = sessionHistory[sessionId];

  // Ensure the originalText is valid for the first message
  if (history.length === 0 && isValidText(originalText)) {
    // Add the original context as the first message from the user
    history.push({ role: "user", parts: [{ text: originalText }] });
  }

  // Ensure the user message is valid
  if (!isValidText(message)) {
    throw new Error("User message must be a non-empty string.");
  }

  // Add the user message to history
  history.push({ role: "user", parts: [{ text: message }] });

  const responseText = await runGeminiChat({
    label: "chatWithAI",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Use the provided context and respond to the user’s message conversationally.`,
    history,
    message,
    errorMessage: "Failed to get response from the AI.",
  });

  // Add the AI's response to the conversation history
  history.push({ role: "model", parts: [{ text: responseText }] });

  // Update the session history with the new conversation context
  sessionHistory[sessionId] = history;

  // Return the AI's response
  return responseText;
};

/**
 * Clear the conversation history for a given session
 * @param sessionId - Unique session ID for the conversation
 */
exports.clearSessionHistory = (sessionId) => {
  delete sessionHistory[sessionId];
};

/**
 * Verify user email and update the password
 * @param email - User email
 * @param newPassword - New password for the user
 * @returns {Promise<{message: string}>} - Success message
 */
exports.verifyUserAndUpdatePassword = async (email, newPassword) => {
  try {
    // Check if the user exists in Firebase
    const user = await firebaseAdmin.auth().getUserByEmail(email);

    // If user exists, update their password
    await firebaseAdmin.auth().updateUser(user.uid, {
      password: newPassword,
    });

    return { message: "Password updated successfully." };
  } catch (error) {
    throw new Error("Failed to update password. " + error.message);
  }
};

/**
 * Verify user email and update the email
 * @param email - User email
 * @returns {Promise<UserRecord>} - Firebase Auth User Record
 */
exports.verifyUserEmail = async (email) => {
  try {
    const userRecord = await firebaseAdmin.auth().getUserByEmail(email);
    return userRecord;
  } catch (error) {
    throw new Error("User not found");
  }
};

/**
 * Update user email in Firebase Auth
 * @param documentText - Text content of the document
 * @returns {Promise<{sentimentScore, description}>} - Sentiment analysis result
 */
exports.analyzeSentiment = async (documentText) => {
  const responseText = await runGeminiChat({
    label: "analyzeSentiment",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Analyze the sentiment of the provided text. Return the result as a JSON object with two properties: "score" between -1 (very negative) to +1 (very positive) and "description" as a brief summary of the sentiment.`,
    history: [{ role: "user", parts: [{ text: documentText }] }],
    message: documentText,
    errorMessage: "Failed to perform sentiment analysis from the AI",
  });

  // Extract and parse the response text into JSON format
  try {
    // Strip the ```json and ``` markers if they exist
    const cleanedResponse = responseText.replace(/```json|```/g, "").trim();

    // Parse the cleaned JSON string
    const response = JSON.parse(cleanedResponse);

    return {
      sentimentScore: response.score,
      description: response.description,
    };
  } catch (error) {
    console.error("Error parsing sentiment response:", error);
    throw new Error("Failed to parse sentiment analysis response");
  }
};

/**
 * Generate bullet point summary from the document text
 * @param documentText - Text content of the document
 * @returns {Promise<string>} - Generated bullet point summary
 */
exports.generateBulletSummary = async (documentText) => {
  return await runGeminiChat({
    label: "generateBulletSummary",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Summarize the provided document text in bullet points.`,
    history: [{ role: "user", parts: [{ text: documentText }] }],
    message: documentText,
    errorMessage: "Failed to generate bullet point summary from the AI",
  });
};

/**
 * Generate a summary in a specific language
 * @param documentText - Text content of the document
 * @param language - Target language for the summary
 * @returns {Promise<string>} - Generated summary in the specified language
 */
exports.generateSummaryInLanguage = async (documentText, language) => {
  return await runGeminiChat({
    label: "generateSummaryInLanguage",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Summarize the given text in ${language}.`,
    history: [{ role: "user", parts: [{ text: documentText }] }],
    message: documentText,
    errorMessage: "Failed to generate translated summary from the AI",
  });
};

/**
 * Rewrite content in a specific style
 * @param documentText - Text content to rewrite
 * @param style - Target style for rewriting the content
 * @returns {Promise<string>} - Rewritten content in the specified style
 */
exports.rewriteContent = async (documentText, style) => {
  return await runGeminiChat({
    label: "rewriteContent",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Rephrase or rewrite the provided text in a ${style} style.`,
    history: [{ role: "user", parts: [{ text: documentText }] }],
    message: documentText,
    errorMessage: "Failed to rewrite content using the AI",
  });
};

/**
 * Generate actionable recommendations based on the document text
 * @param documentText - Text content of the document
 * @returns {Promise<string>} - Generated actionable recommendations
 */
exports.generateActionableRecommendations = async (documentText) => {
  return await runGeminiChat({
    label: "generateActionableRecommendations",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Generate actionable recommendations or next steps based on the provided text. Focus on identifying follow-up actions, decisions to be made, or critical takeaways.`,
    history: [{ role: "user", parts: [{ text: documentText }] }],
    message: documentText,
    errorMessage: "Failed to generate actionable recommendations using the AI",
  });
};

/**
 * Refine the summary based on the user's instructions
 * @param summary - Original summary to refine
 * @param refinementInstructions - Instructions for refining the summary
 * @returns {Promise<string>} - Refined summary based on the instructions
 */
exports.refineSummary = async (summary, refinementInstructions) => {
  // Combine the user input into a single prompt
  const refinementPrompt = `
    Summary: ${summary}
    Refinement Instructions: ${refinementInstructions}
    Please refine the summary as per the instructions.`;

  return await runGeminiChat({
    label: "refineSummary",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Refine the provided summary based on the user's instructions.`,
    history: [{ role: "user", parts: [{ text: refinementPrompt }] }],
    message: refinementPrompt,
    errorMessage: "Failed to refine the summary using the AI",
  });
};

/**
 * Workspace Search & Q&A Services
 * These services interface with the Python AI/ML workspace search module
 */

const { spawn } = require("child_process");
const path = require("path");

// Path to the AI/ML workspace search module
const WORKSPACE_SEARCH_MODULE = path.join(__dirname, "../../ai_ml/workspace_search_simple.py");

/**
 * Execute Python workspace search command
 * @param {string} command - Command to execute (index, search, qa, status, reindex)
 * @param {Object} params - Parameters for the command
 * @returns {Promise<Object>} - Result from Python module
 */
const executePythonCommand = (command, params) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python3", [
      WORKSPACE_SEARCH_MODULE,
      command,
      JSON.stringify(params)
    ]);

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          resolve({ success: false, error: "Invalid JSON response", raw: stdout });
        }
      } else {
        reject(new Error(`Python process exited with code ${code}: ${stderr}`));
      }
    });

    pythonProcess.on("error", (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
};

/**
 * Index a document for semantic search
 * @param {string} userId - User ID
 * @param {string} docId - Document ID
 * @param {string} title - Document title
 * @param {string} content - Document content
 * @param {string} mimeType - MIME type
 * @param {Array<string>} tags - Document tags
 * @param {string} updatedAt - Last updated timestamp
 * @returns {Promise<Object>} - Indexing result
 */
exports.indexDocumentForSearch = async (userId, docId, title, content, mimeType = "text/plain", tags = [], updatedAt = null) => {
  try {
    const params = {
      user_id: userId,
      doc_id: docId,
      title,
      content,
      mime_type: mimeType,
      tags,
      updated_at: updatedAt || new Date().toISOString()
    };

    const result = await executePythonCommand("index", params);
    return result;
  } catch (error) {
    console.error("Error indexing document for search:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Perform semantic search across user's documents
 * @param {string} userId - User ID
 * @param {string} query - Search query
 * @param {number} topK - Number of results to return
 * @param {Object} filters - Search filters
 * @returns {Promise<Array>} - Search results
 */
exports.performSemanticSearch = async (userId, query, topK = 10, filters = {}) => {
  try {
    const params = {
      user_id: userId,
      query,
      top_k: topK,
      filters
    };

    const result = await executePythonCommand("search", params);
    return result.success ? result.results : [];
  } catch (error) {
    console.error("Error performing semantic search:", error);
    return [];
  }
};

/**
 * Answer questions using user's workspace (RAG)
 * @param {string} userId - User ID
 * @param {string} question - Question to answer
 * @param {number} topK - Number of context documents to use
 * @param {Object} filters - Document filters
 * @returns {Promise<Object>} - Q&A result with citations
 */
exports.workspaceQuestionAnswering = async (userId, question, topK = 5, filters = {}) => {
  try {
    const params = {
      user_id: userId,
      question,
      top_k: topK,
      filters
    };

    const result = await executePythonCommand("qa", params);
    return result.success ? result : { answer: "I encountered an error processing your question.", citations: [], context_found: false };
  } catch (error) {
    console.error("Error in workspace Q&A:", error);
    return { answer: "I encountered an error processing your question.", citations: [], context_found: false };
  }
};

/**
 * Get indexing status for user's workspace
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Index status
 */
exports.getWorkspaceIndexStatus = async (userId) => {
  try {
    const params = { user_id: userId };
    const result = await executePythonCommand("status", params);
    return result;
  } catch (error) {
    console.error("Error getting index status:", error);
    return { user_id: userId, error: error.message };
  }
};

/**
 * Reindex all documents for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Reindex result
 */
exports.reindexUserWorkspace = async (userId) => {
  try {
    const params = { user_id: userId };
    const result = await executePythonCommand("reindex", params);
    return result;
  } catch (error) {
    console.error("Error reindexing workspace:", error);
    return { success: false, error: error.message };
  }
};

// Enhanced document upload that includes indexing
exports.uploadDocumentWithIndexing = async (userId, title, text) => {
  try {
    // First, save the document using existing flow
    const docResult = await exports.generateSummary(text);
    
    // Generate document ID
    const docId = require("uuid").v4();
    
    // Save to Firestore
    const userDoc = await firestore.collection("users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : { documents: [] };
    
    const newDocument = {
      id: docId,
      title: Array.isArray(title) ? title : [title],
      summary: docResult.summary,
      originalText: text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    userData.documents = userData.documents || [];
    userData.documents.push(newDocument);
    
    await firestore.collection("users").doc(userId).set(userData, { merge: true });
    
    // Index for semantic search
    const indexResult = await exports.indexDocumentForSearch(
      userId,
      docId,
      Array.isArray(title) ? title.join(" ") : title,
      text,
      "text/plain",
      [], // tags can be added later
      newDocument.updatedAt
    );
    
    return {
      ...docResult,
      docId,
      indexResult
    };
    
  } catch (error) {
    console.error("Error in uploadDocumentWithIndexing:", error);
    throw error;
  }
};

// Export endpoints to be used in server routes
module.exports = { firestore, isValidText, sessionHistory, ...exports };
