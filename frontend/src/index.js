// Sentry must be initialized before anything else renders.
import Sentry from "./sentry";
import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

ReactDOM.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <p style={{ padding: "2rem", textAlign: "center" }}>
          Something went wrong. The error has been reported and we&apos;re on
          it.
        </p>
      }
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
  document.getElementById("root"),
);

reportWebVitals();
