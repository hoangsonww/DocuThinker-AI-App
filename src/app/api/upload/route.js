// src/app/api/upload/route.js
import { promises as fs } from 'fs';
import { resolve } from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
  runtime: 'nodejs', // Ensure it's server-side
};

export async function POST(req) {
  const contentType = req.headers.get('content-type') || '';
  const boundary = contentType.split('boundary=')[1];

  if (!boundary) {
    return new Response(JSON.stringify({ error: 'No boundary in form data' }), { status: 400 });
  }

  try {
    const { filename, buffer } = await parseMultipart(req, boundary);
    const uploadsDir = resolve(process.cwd(), 'uploads');

    // Ensure uploads directory exists
    await fs.mkdir(uploadsDir, { recursive: true });

    // Save file to disk
    const filepath = resolve(uploadsDir, filename);
    await fs.writeFile(filepath, buffer);

    // Read the PDF content using an external library (like `pdf-parse`)
    const pdfData = await import('pdf-parse').then(mod => mod.default);
    const dataBuffer = await fs.readFile(filepath);
    const parsed = await pdfData(dataBuffer);

    return new Response(JSON.stringify({
      message: 'File uploaded and processed!',
      extractedText: parsed.text, // Extracted text
    }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'File processing failed', details: err.message }), {
      status: 500,
    });
  }
}

async function parseMultipart(req, boundary) {
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let chunks = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks += decoder.decode(value);
  }

  const parts = chunks.split(`--${boundary}`);
  const headers = parts[1].split('\r\n\r\n')[0];
  const content = parts[1].split('\r\n\r\n')[1];

  const filename = headers.match(/filename="(.+?)"/)[1];
  return { filename, buffer: Buffer.from(content, 'binary') };
}
