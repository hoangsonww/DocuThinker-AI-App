// Sentry instrumentation for the DocuThinker backend.
//
// IMPORTANT: this file MUST be required at the very top of `index.js`, before
// any other module is required. Sentry relies on auto-instrumentation that
// patches libraries (Express, HTTP, etc.) at require-time, so `Sentry.init()`
// has to run before those libraries are loaded.
//
// Configuration (env vars, falls back to the hosted DocuThinker project):
//   SENTRY_DSN      - project DSN
//   SENTRY_RELEASE  - release identifier (optional, e.g. git SHA)
//   NODE_ENV        - environment name (production tightens sample rates)

// Load env vars before reading them (index.js also calls this later; dotenv is idempotent).
require("dotenv").config();

const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

const DEFAULT_DSN =
  "https://56b62c1af91c6fef6e066237685aa8e2@o4511764618543104.ingest.us.sentry.io/4511764642856960";

const dsn = process.env.SENTRY_DSN || DEFAULT_DSN;
const environment = process.env.NODE_ENV || "development";
const isProduction = environment === "production";

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    release: process.env.SENTRY_RELEASE || undefined,

    // Profiling (CPU profiles for traced transactions).
    integrations: [nodeProfilingIntegration()],

    // Performance Monitoring: sample 100% of transactions in dev, 20% in prod.
    tracesSampleRate: isProduction ? 0.2 : 1.0,

    // Profiling sample rate is relative to tracesSampleRate.
    profilesSampleRate: 1.0,

    // Structured logs -> Sentry Logs.
    enableLogs: true,

    // Attach request data (headers, IP, etc.) to events.
    sendDefaultPii: true,
  });
}

module.exports = Sentry;
