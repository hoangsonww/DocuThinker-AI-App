import React from 'react';

export default function DocumentPreview({ text }) {
  return (
      <div className="document-preview">
        <h2>Document Preview</h2>
        <div className="document-content">
          <p>{text ? text : 'Upload a document to see the content here...'}</p>
        </div>
      </div>
  );
}
