const firebaseAdmin = require("firebase-admin");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
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

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Summarize the provided document text in paragraphs (not bullet points).`,
  });

  const chatSession = model.startChat({
    history: [{ role: "user", parts: [{ text }] }],
  });
  const result = await chatSession.sendMessage(text);

  if (!result.response || !result.response.text) {
    throw new Error("Failed to generate a summary from the AI");
  }

  return {
    summary: result.response.text(),
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

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

  const result = await model.generateContent(prompt);

  if (!result.response || !result.response.text) {
    throw new Error("Failed to generate a summary from the AI");
  }

  return {
    summary: result.response.text(),
  };
};

/**
 * Process a text document and generate key ideas
 * @param documentText - Text content of the document
 * @returns {Promise<string>} - Generated key ideas
 */
exports.generateKeyIdeas = async (documentText) => {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Generate key ideas from the provided text.`,
  });

  const chatSession = model.startChat({
    history: [{ role: "user", parts: [{ text: documentText }] }],
  });
  const result = await chatSession.sendMessage(documentText);
  return result.response.text();
};

/**
 * Process a text document and generate discussion points
 * @param documentText - Text content of the document
 * @returns {Promise<string>} - Generated discussion points
 */
exports.generateDiscussionPoints = async (documentText) => {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Generate discussion points from the provided text.`,
  });

  const chatSession = model.startChat({
    history: [{ role: "user", parts: [{ text: documentText }] }],
  });
  const result = await chatSession.sendMessage(documentText);
  return result.response.text();
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
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Use the provided context and respond to the user’s message conversationally.`,
  });

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

  try {
    // Start AI chat session using the accumulated history
    const chatSession = model.startChat({
      history: history, // Pass the conversation history
    });

    const result = await chatSession.sendMessage(message);

    // Ensure that the response contains valid text
    if (!result.response || !result.response.text) {
      throw new Error("Failed to get response from the AI.");
    }

    // Add the AI's response to the conversation history
    history.push({ role: "model", parts: [{ text: result.response.text() }] });

    // Update the session history with the new conversation context
    sessionHistory[sessionId] = history;

    // Return the AI's response
    return result.response.text();
  } catch (error) {
    // Handle potential errors
    throw new Error("Failed to get AI response: " + error.message);
  }
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
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Analyze the sentiment of the provided text. Return the result as a JSON object with two properties: "score" between -1 (very negative) to +1 (very positive) and "description" as a brief summary of the sentiment.`,
  });

  const chatSession = model.startChat({
    history: [{ role: "user", parts: [{ text: documentText }] }],
  });
  const result = await chatSession.sendMessage(documentText);

  if (!result.response || !result.response.text) {
    throw new Error("Failed to perform sentiment analysis from the AI");
  }

  // Extract and parse the response text into JSON format
  try {
    let responseText = result.response.text();

    // Strip the ```json and ``` markers if they exist
    responseText = responseText.replace(/```json|```/g, "").trim();

    // Parse the cleaned JSON string
    const response = JSON.parse(responseText);

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
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Summarize the provided document text in bullet points.`,
  });

  const chatSession = model.startChat({
    history: [{ role: "user", parts: [{ text: documentText }] }],
  });
  const result = await chatSession.sendMessage(documentText);

  if (!result.response || !result.response.text) {
    throw new Error("Failed to generate bullet point summary from the AI");
  }

  return result.response.text();
};

/**
 * Generate a summary in a specific language
 * @param documentText - Text content of the document
 * @param language - Target language for the summary
 * @returns {Promise<string>} - Generated summary in the specified language
 */
exports.generateSummaryInLanguage = async (documentText, language) => {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Summarize the given text in ${language}.`,
  });

  const chatSession = model.startChat({
    history: [{ role: "user", parts: [{ text: documentText }] }],
  });
  const result = await chatSession.sendMessage(documentText);

  if (!result.response || !result.response.text) {
    throw new Error("Failed to generate translated summary from the AI");
  }

  return result.response.text();
};

/**
 * Rewrite content in a specific style
 * @param documentText - Text content to rewrite
 * @param style - Target style for rewriting the content
 * @returns {Promise<string>} - Rewritten content in the specified style
 */
exports.rewriteContent = async (documentText, style) => {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Rephrase or rewrite the provided text in a ${style} style.`,
  });

  const chatSession = model.startChat({
    history: [{ role: "user", parts: [{ text: documentText }] }],
  });
  const result = await chatSession.sendMessage(documentText);

  if (!result.response || !result.response.text) {
    throw new Error("Failed to rewrite content using the AI");
  }

  return result.response.text();
};

/**
 * Generate actionable recommendations based on the document text
 * @param documentText - Text content of the document
 * @returns {Promise<string>} - Generated actionable recommendations
 */
exports.generateActionableRecommendations = async (documentText) => {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Generate actionable recommendations or next steps based on the provided text. Focus on identifying follow-up actions, decisions to be made, or critical takeaways.`,
  });

  const chatSession = model.startChat({
    history: [{ role: "user", parts: [{ text: documentText }] }],
  });
  const result = await chatSession.sendMessage(documentText);

  if (!result.response || !result.response.text) {
    throw new Error(
      "Failed to generate actionable recommendations using the AI",
    );
  }

  return result.response.text();
};

/**
 * Refine the summary based on the user's instructions
 * @param summary - Original summary to refine
 * @param refinementInstructions - Instructions for refining the summary
 * @returns {Promise<string>} - Refined summary based on the instructions
 */
exports.refineSummary = async (summary, refinementInstructions) => {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `${process.env.AI_INSTRUCTIONS}. Your task now is to: Refine the provided summary based on the user's instructions.`,
  });

  // Combine the user input into a single prompt
  const refinementPrompt = `
    Summary: ${summary}
    Refinement Instructions: ${refinementInstructions}
    Please refine the summary as per the instructions.`;

  const chatSession = model.startChat({
    history: [{ role: "user", parts: [{ text: refinementPrompt }] }],
  });

  const result = await chatSession.sendMessage(refinementPrompt);

  if (!result.response || !result.response.text) {
    throw new Error("Failed to refine the summary using the AI");
  }

  return result.response.text();
};

// Export endpoints to be used in server routes
module.exports = { firestore, isValidText, sessionHistory, ...exports };
