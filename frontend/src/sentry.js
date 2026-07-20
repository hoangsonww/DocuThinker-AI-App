import * as Sentry from "@sentry/react";

// Initialize Sentry as early as possible in the app lifecycle.
// This module is imported first in `index.js` so `Sentry.init()` runs
// before React renders and before any application code executes.
//
// Configuration is driven by environment variables (CRA exposes only
// vars prefixed with `REACT_APP_`), with a sensible fallback DSN so the
// integration works out of the box.
//
//   REACT_APP_SENTRY_DSN      - project DSN (defaults to the hosted DocuThinker project)
//   REACT_APP_SENTRY_RELEASE  - release identifier (optional, e.g. git SHA)
//   REACT_APP_SENTRY_ENV      - environment name (defaults to NODE_ENV)

const DEFAULT_DSN =
  "https://56b62c1af91c6fef6e066237685aa8e2@o4511764618543104.ingest.us.sentry.io/4511764642856960";

const dsn = process.env.REACT_APP_SENTRY_DSN || DEFAULT_DSN;
const environment =
  process.env.REACT_APP_SENTRY_ENV || process.env.NODE_ENV || "development";
const isProduction = environment === "production";

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    release: process.env.REACT_APP_SENTRY_RELEASE || undefined,

    integrations: [
      // Performance tracing (page loads + navigations).
      Sentry.browserTracingIntegration(),
      // Session Replay (records user sessions for debugging).
      Sentry.replayIntegration(),
    ],

    // Performance Monitoring: sample 100% of transactions in dev, 10% in prod.
    tracesSampleRate: isProduction ? 0.1 : 1.0,

    // Connect frontend traces to the backend API for distributed tracing.
    tracePropagationTargets: [
      "localhost",
      /^https:\/\/docuthinker-app-backend-api\.vercel\.app/,
    ],

    // Session Replay: record 10% of all sessions, plus 100% of sessions
    // in which an error occurs.
    replaysSessionSampleRate: isProduction ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,

    // Structured logs -> Sentry Logs.
    enableLogs: true,

    // Attach user IP/context and request data to events.
    sendDefaultPii: true,
  });
}

export default Sentry;
