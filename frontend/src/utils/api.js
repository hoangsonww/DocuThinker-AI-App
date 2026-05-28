// Single source of truth for the backend API origin.
//
// Defaults to the deployed backend the rest of the app already targets, but can
// be overridden at build time (e.g. for local development) via
// REACT_APP_API_BASE_URL.
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://docuthinker-app-backend-api.vercel.app";
