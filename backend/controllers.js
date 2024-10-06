const { createUser, loginUser, generateSummary, generateKeyIdeas, generateDiscussionPoints, chatWithAI, verifyUserEmail} = require('./models');
const { sendErrorResponse, sendSuccessResponse } = require('./views');
const {IncomingForm} = require("formidable");

// Route 1: Register User
exports.registerUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await createUser(email, password);
    sendSuccessResponse(res, 201, 'User registered successfully', { userId: userRecord.uid });
  } catch (error) {
    sendErrorResponse(res, 400, 'User registration failed', error.message);
  }
};

// Route 2: Login User
exports.loginUser = async (req, res) => {
  const { email } = req.body;
  try {
    const customToken = await loginUser(email);
    sendSuccessResponse(res, 200, 'Custom token generated', { customToken });
  } catch (error) {
    sendErrorResponse(res, 401, 'Invalid credentials', error.message);
  }
};

// Route 3: Upload Document & Summarize
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

// Route 4: Generate Key Ideas
exports.generateKeyIdeas = async (req, res) => {
  const { documentText } = req.body;
  try {
    const keyIdeas = await generateKeyIdeas(documentText);
    sendSuccessResponse(res, 200, 'Key ideas generated', { keyIdeas });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to generate key ideas', error.message);
  }
};

// Route 5: Generate Discussion Points
exports.generateDiscussionPoints = async (req, res) => {
  const { documentText } = req.body;
  try {
    const discussionPoints = await generateDiscussionPoints(documentText);
    sendSuccessResponse(res, 200, 'Discussion points generated', { discussionPoints });
  } catch (error) {
    sendErrorResponse(res, 500, 'Failed to generate discussion points', error.message);
  }
};

// Controller: Handle chat with AI and provide originalText as context
exports.chatWithAI = async (req, res) => {
  const { message, originalText } = req.body;

  if (!message || !originalText) {
    return res.status(400).json({ error: 'Both message and originalText are required' });
  }

  try {
    const response = await chatWithAI(message, originalText);
    res.status(200).json({ response });
  } catch (error) {
    console.error('Failed to get AI response:', error);
    res.status(500).json({ error: 'Failed to get response from the AI', details: error.message });
  }
};

const { verifyUserAndUpdatePassword } = require('./models');

// Controller: Verify User and Allow Password Update
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

// Controller: Verify Email
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