const firebaseAdmin = require('firebase-admin');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Firebase Admin
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(require('./firebase-admin-sdk.json')),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

// Firestore for storing user documents
const firestore = firebaseAdmin.firestore();

// Helper: Create a user in Firebase
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
