import { drive } from '@/lib/google';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function POST(req) {
  const { fileId, mimeType } = await req.json();

  if (!fileId || !mimeType) {
    return new Response(JSON.stringify({ error: 'File ID and MIME type are required' }), { status: 400 });
  }

  try {
    const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
    let extractedText = '';

    if (mimeType === 'application/pdf') {
      const chunks = [];
      response.data.on('data', (chunk) => chunks.push(chunk));
      response.data.on('end', async () => {
        const pdfBuffer = Buffer.concat(chunks);
        const pdfData = await pdfParse(pdfBuffer);
        extractedText = pdfData.text;
        return new Response(JSON.stringify({ text: extractedText }), { status: 200 });
      });
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const chunks = [];
      response.data.on('data', (chunk) => chunks.push(chunk));
      response.data.on('end', async () => {
        const docBuffer = Buffer.concat(chunks);
        const docData = await mammoth.extractRawText({ buffer: docBuffer });
        extractedText = docData.value;
        return new Response(JSON.stringify({ text: extractedText }), { status: 200 });
      });
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported file type' }), { status: 400 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to download or process the file' }), { status: 500 });
  }
}
