import React from 'react';

export default function ActionButtons({ onSummarize, onBrainstorm }) {
  return (
      <div className="action-buttons">
        <button onClick={onSummarize} className="btn">
          Summarize Document
        </button>
        <button onClick={onBrainstorm} className="btn">
          Brainstorm Ideas
        </button>
      </div>
  );
}
