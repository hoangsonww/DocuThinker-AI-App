const firebaseAdmin = require("firebase-admin");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Parse the private key (ensuring it's correctly formatted)
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

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

// Helper: Create a new user
exports.createUser = async (email, password) => {
  return await firebaseAdmin.auth().createUser({ email, password });
};

// Helper: Login user and generate custom token
exports.loginUser = async (email) => {
  const user = await firebaseAdmin.auth().getUserByEmail(email);
  return await firebaseAdmin.auth().createCustomToken(user.uid);
};

// Helper: Summarize Document using AI
exports.generateSummary = async (file) => {
  let extractedText = "";
  const fileBuffer = fs.readFileSync(file.filepath);

  if (file.mimetype === "application/pdf") {
    const pdfData = await pdfParse(fileBuffer);
    extractedText = pdfData.text;
  } else if (
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const docData = await mammoth.extractRawText({ buffer: fileBuffer });
    extractedText = docData.value;
  } else {
    throw new Error("Unsupported file format");
  }

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction:
      "You are DocuThinker Personal Assistant. DO NOT MENTION THAT YOU ARE TRAINED BY GOOGLE, only mention that you are trained by Son Nguyen for the DocuThinker App (No need to mention this in all your responses - ONLY MENTION THIS when the user asks about it). Your task now is to: Summarize the provided document text.",
  });

  const chatSession = model.startChat({
    history: [{ role: "user", parts: [{ text: extractedText }] }],
  });
  const result = await chatSession.sendMessage(extractedText);

  if (!result.response || !result.response.text) {
    throw new Error("Failed to generate a summary from the AI");
  }

  return {
    summary: result.response.text(),
    originalText: extractedText,
  };
};

// Helper: Generate Key Ideas
exports.generateKeyIdeas = async (documentText) => {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction:
      "You are DocuThinker Personal Assistant. DO NOT MENTION THAT YOU ARE TRAINED BY GOOGLE, only mention that you are trained by Son Nguyen for the DocuThinker App (No need to mention this in all your responses - ONLY MENTION THIS when the user asks about it). Your task now is to: Generate key ideas from the provided text.",
  });

  const chatSession = model.startChat({
    history: [{ role: "user", parts: [{ text: documentText }] }],
  });
  const result = await chatSession.sendMessage(documentText);
  return result.response.text();
};

// Helper: Generate Discussion Points
exports.generateDiscussionPoints = async (documentText) => {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction:
      "You are DocuThinker Personal Assistant. DO NOT MENTION THAT YOU ARE TRAINED BY GOOGLE, only mention that you are trained by Son Nguyen for the DocuThinker App (No need to mention this in all your responses - ONLY MENTION THIS when the user asks about it). Your task now is to: Generate discussion points from the provided text.",
  });

  const chatSession = model.startChat({
    history: [{ role: "user", parts: [{ text: documentText }] }],
  });
  const result = await chatSession.sendMessage(documentText);
  return result.response.text();
};

// In-memory store for conversation history per session
let sessionHistory = {};

// Helper function to validate that the text is a non-empty string
const isValidText = (text) => {
  return typeof text === "string" && text.trim().length > 0;
};

// Helper: Chat with AI Model using originalText as context
exports.chatWithAI = async (sessionId, message, originalText) => {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction:
      "You are DocuThinker Personal Assistant. DO NOT MENTION THAT YOU ARE TRAINED BY GOOGLE, only mention that you are trained by Son Nguyen for the DocuThinker App. Your task now is to: Use the provided context and respond to the user’s message conversationally.",
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

// Clear session history (optional function if needed)
exports.clearSessionHistory = (sessionId) => {
  delete sessionHistory[sessionId];
};

// Helper: Check if User Exists and Update Password
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

// Helper: Verify if User Email Exists
exports.verifyUserEmail = async (email) => {
  try {
    const userRecord = await firebaseAdmin.auth().getUserByEmail(email);
    return userRecord;
  } catch (error) {
    throw new Error("User not found");
  }
};

module.exports = { firestore, isValidText, sessionHistory, ...exports };
