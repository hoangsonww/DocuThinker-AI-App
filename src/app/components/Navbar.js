import React from 'react';

export default function Navbar() {
  return (
      <nav className="navbar">
        <h1>DocuThinker</h1>
        <ul>
          <li><a href="#">Home</a></li>
          <li><a href="#">Upload</a></li>
          <li><a href="#">Summarize</a></li>
        </ul>
      </nav>
  );
}
