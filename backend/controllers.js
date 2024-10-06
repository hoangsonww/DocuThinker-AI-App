const { createUser, loginUser, generateSummary, generateKeyIdeas, generateDiscussionPoints, chatWithAI, verifyUserEmail, verifyUserAndUpdatePassword } = require('./models');
const { sendErrorResponse, sendSuccessResponse } = require('./views');
const { IncomingForm } = require("formidable");
const { v4: uuidv4 } = require('uuid');

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User registration failed
 */
exports.registerUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await createUser(email, password);
    sendSuccessResponse(res, 201, 'User registered successfully', { userId: userRecord.uid });
  } catch (error) {
    sendErrorResponse(res, 400, 'User registration failed', error.message);
  }
};

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Custom token generated
 *       401:
 *         description: Invalid credentials
 */
exports.loginUser = async (req, res) => {
  const { email } = req.body;
  try {
    const customToken = await loginUser(email);
    sendSuccessResponse(res, 200, 'Custom token generated', { customToken });
  } catch (error) {
    sendErrorResponse(res, 401, 'Invalid credentials', error.message);
  }
};

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a document for summarization
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               File:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Document summarized
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Failed to summarize document
 */
exports.uploadDocument = async (req, res) => {
  const form = new IncomingForm();
  await form.parse(req, async (err, fields, files) => {
    if (err) {
      sendErrorResponse(res, 500, 'Error parsing the file', err);
    } else if (!files.File) {
      sendErrorResponse(res, 400, 'No file uploaded');
    } else {
      try {
        const result = await generateSummary(files.File[0]);
        sendSuccessResponse(res, 200, 'Document summarized', result);
      } catch (error) {
        sendErrorResponse(res, 500, 'Failed to summarize document', error.message);
      }
    }
  });
};

/**
 * @swagger
 * /generate-key-ideas:
 *   post:
 *     summary: Generate key ideas from document text
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documentText:
 *                 type: string
 *     responses:
 *       200:
 *         description: Key ideas generated
 *       500:
 *         description: Failed to generate key ideas
 */
exports.generateKeyIdeas = async (req, res) => {
  const { documentText } = req.body;
  try {
    const keyIdeas = await generateKeyIdeas(documentText);
    sendSuccessResponse(res, 200, 'Key ideas generated', { keyIdeas });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to generate key ideas', error.message);
  }
};

/**
 * @swagger
 * /generate-discussion-points:
 *   post:
 *     summary: Generate discussion points from document text
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documentText:
 *                 type: string
 *     responses:
 *       200:
 *         description: Discussion points generated
 *       500:
 *         description: Failed to generate discussion points
 */
exports.generateDiscussionPoints = async (req, res) => {
  const { documentText } = req.body;
  try {
    const discussionPoints = await generateDiscussionPoints(documentText);
    sendSuccessResponse(res, 200, 'Discussion points generated', { discussionPoints });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to generate discussion points', error.message);
  }
};

/**
 * @swagger
 * /chat:
 *   post:
 *     summary: Chat with AI using original document context
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               originalText:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI response
 *       400:
 *         description: Both message and originalText are required
 *       500:
 *         description: Failed to get response from the AI
 */
exports.chatWithAI = async (req, res) => {
  let { message, originalText, sessionId } = req.body;

  // If no sessionId is provided, generate a new one
  if (!sessionId) {
    sessionId = uuidv4();
  }

  if (!message || !originalText) {
    return res.status(400).json({ error: 'Both message and originalText are required' });
  }

  try {
    const response = await chatWithAI(sessionId, message, originalText);
    res.status(200).json({ response, sessionId });
    console.log('Human message:', message);
    console.log('AI response:', response);
  } catch (error) {
    console.error('Failed to get AI response:', error);
    res.status(500).json({ error: 'Failed to get response from the AI', details: error.message });
  }
};

/**
 * @swagger
 * /forgot-password:
 *   post:
 *     summary: Reset a user's password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               newPassword:
 *                 type: string
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Email and new password are required
 *       500:
 *         description: Failed to update password
 */
exports.forgotPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required.' });
  }

  try {
    const result = await verifyUserAndUpdatePassword(email, newPassword);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password', details: error.message });
  }
};

/**
 * @swagger
 * /verify-email:
 *   post:
 *     summary: Verify if a user's email exists
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Email verified
 *       404:
 *         description: User not found
 */
exports.verifyEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendErrorResponse(res, 400, 'Email is required');
  }

  try {
    const userRecord = await verifyUserEmail(email); // Call model to verify email
    sendSuccessResponse(res, 200, 'Email verified', { uid: userRecord.uid });
  } catch (error) {
    sendErrorResponse(res, 404, 'User not found', error.message);
  }
};
