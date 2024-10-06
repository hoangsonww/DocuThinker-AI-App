import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

// Extract text from PDF file buffer
export async function extractTextFromPDF(buffer) {
  try {
    const pdfData = await pdfParse(buffer);
    return pdfData.text;  // Return the extracted text from the PDF file
  } catch (error) {
    throw new Error('Failed to extract text from PDF');
  }
}

// Extract text from DOCX file buffer
export async function extractTextFromDOCX(buffer) {
  try {
    const docData = await mammoth.extractRawText({ buffer });
    return docData.value;  // Return the extracted text from the DOCX file
  } catch (error) {
    throw new Error('Failed to extract text from DOCX');
  }
}
