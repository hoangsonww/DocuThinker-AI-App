'use client';

import React, { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setExtractedText(response.data.text);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
      <div>
        <h1>Upload Document</h1>
        <input type="file" accept=".pdf,.docx" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload and Extract Text</button>
        <div>
          <h2>Extracted Text</h2>
          <p>{extractedText || 'Upload a document to see the extracted text here.'}</p>
        </div>
      </div>
  );
}
