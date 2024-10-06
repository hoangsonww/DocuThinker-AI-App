const firebaseAdmin = require('firebase-admin');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Parse the private key (ensuring it's correctly formatted)
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

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
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

// Firestore for storing user documents
const firestore = firebaseAdmin.firestore();

// Rest of your helper functions and code
// Example: Create a user in Firebase
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
  let extractedText = '';
  const fileBuffer = fs.readFileSync(file.filepath);

  if (file.mimetype === 'application/pdf') {
    const pdfData = await pdfParse(fileBuffer);
    extractedText = pdfData.text;
  } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const docData = await mammoth.extractRawText({ buffer: fileBuffer });
    extractedText = docData.value;
  } else {
    throw new Error('Unsupported file format');
  }

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: 'Summarize the provided document text.',
  });

  const chatSession = model.startChat({ history: [{ role: 'user', parts: [{ text: extractedText }] }] });
  const result = await chatSession.sendMessage(extractedText);

  if (!result.response || !result.response.text) {
    throw new Error('Failed to generate a summary from the AI');
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
    model: 'gemini-1.5-flash',
    systemInstruction: 'Generate key ideas from the provided text.',
  });

  const chatSession = model.startChat({ history: [{ role: 'user', parts: [{ text: documentText }] }] });
  const result = await chatSession.sendMessage(documentText);
  return result.response.text();
};

// Helper: Generate Discussion Points
exports.generateDiscussionPoints = async (documentText) => {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: 'Generate discussion points from the provided text.',
  });

  const chatSession = model.startChat({ history: [{ role: 'user', parts: [{ text: documentText }] }] });
  const result = await chatSession.sendMessage(documentText);
  return result.response.text();
};

// Helper: Chat with AI Model
exports.chatWithAI = async (message) => {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: 'Respond to the user’s message conversationally.',
  });

  const chatSession = model.startChat({ history: [{ role: 'user', parts: [{ text: message }] }] });
  const result = await chatSession.sendMessage(message);
  return result.response.text();
};
