const express = require('express');
const formidable = require('formidable');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
app.use(express.json());

// Helper: Google OAuth2 and Drive setup
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BASE_URL}/api/google/callback`
);

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Route 1: File upload and text extraction (PDF and DOCX)
app.post('/upload', (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Error parsing the file' });

    const file = files.file[0];  // Assume only one file
    let extractedText = '';

    try {
      const fileBuffer = fs.readFileSync(file.filepath);

      if (file.mimetype === 'application/pdf') {
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text;
      } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const docData = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = docData.value;
      } else {
        return res.status(400).json({ error: 'Unsupported file format' });
      }

      res.status(200).json({ text: extractedText });
    } catch (error) {
      res.status(500).json({ error: 'Failed to extract text from the document' });
    }
  });
});

// Route 2: Google OAuth2 Authentication URL
app.get('/google/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  res.status(200).json({ url: authUrl });
});

// Route 3: Google OAuth2 Callback and Token Exchange
app.get('/google/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) return res.status(400).json({ error: 'Authorization code missing' });

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.status(200).json({ message: 'Authenticated successfully', tokens });
  } catch (error) {
    res.status(500).json({ error: 'Error exchanging authorization code' });
  }
});

// Route 4: List Files in Google Drive
app.get('/google/files', async (req, res) => {
  try {
    const response = await drive.files.list({
      pageSize: 10,
      fields: 'files(id, name, mimeType)',
    });

    res.status(200).json({ files: response.data.files });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch files from Google Drive' });
  }
});

// Route 5: Download and Process Google Drive File
app.post('/google/download', async (req, res) => {
  const { fileId, mimeType } = req.body;

  if (!fileId || !mimeType) return res.status(400).json({ error: 'File ID and MIME type are required' });

  try {
    const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });

    let extractedText = '';
    const chunks = [];

    response.data.on('data', (chunk) => chunks.push(chunk));
    response.data.on('end', async () => {
      const fileBuffer = Buffer.concat(chunks);

      if (mimeType === 'application/pdf') {
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text;
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const docData = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = docData.value;
      } else {
        return res.status(400).json({ error: 'Unsupported file type' });
      }

      res.status(200).json({ text: extractedText });
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to download or process the file' });
  }
});

// Route 6: Summarize Text using Hugging Face
app.post('/summarize', async (req, res) => {
  const { text } = req.body;

  if (!text) return res.status(400).json({ error: 'No text provided for summarization' });

  try {
    const response = await axios.post(
        'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
        { inputs: text },
        {
          headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
        }
    );

    const summary = response.data[0].summary_text;
    res.status(200).json({ summary });
  } catch (error) {
    res.status(500).json({ error: 'Failed to summarize text' });
  }
});

// Route 7: Brainstorming Ideas using OpenAI
app.post('/brainstorm', async (req, res) => {
  const { text } = req.body;

  if (!text) return res.status(400).json({ error: 'No text provided for brainstorming' });

  try {
    const response = await axios.post(
        'https://api.openai.com/v1/completions',
        {
          model: 'text-davinci-003',
          prompt: `Read this text: ${text}. Now, suggest key discussion points, potential writing topics, and questions related to it.`,
          max_tokens: 200,
        },
        {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        }
    );

    const ideas = response.data.choices[0].text;
    res.status(200).json({ ideas });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate brainstorming ideas' });
  }
});

// Start the server with the dynamic port from the environment variable
const port = process.env.PORT || 3000;  // Use Render's dynamic port or 3000 for local dev
app.listen(port, '0.0.0.0', () => {
  console.log(`Server ready on port ${port}.`);
});

module.exports = app;
