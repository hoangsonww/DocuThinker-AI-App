# DocuThinker Backend Documentation

The **DocuThinker Backend** is the server-side component of the DocuThinker application. It handles user registration and authentication, passkey (WebAuthn) sign-in, document upload and storage, AI-powered summarization and analysis, account management, and a GraphQL API — all on top of Node.js and Express.

The backend is deployed as a **Vercel serverless function** (the whole Express app is mounted behind `index.js`) and exposes both a **REST API** and a **GraphQL API**, with self-documenting Swagger/OpenAPI docs and a GraphiQL explorer.

> Production API: [https://docuthinker-app-backend-api.vercel.app/](https://docuthinker-app-backend-api.vercel.app/)
> Backup (legacy): [https://docuthinker-ai-app.onrender.com](https://docuthinker-ai-app.onrender.com)

## Table of Contents

- [Architecture & Stack](#architecture--stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [File Structure](#file-structure)
- [Data Model](#data-model)
- [Document Upload Flow](#document-upload-flow)
- [AI Layer (Google Gemini)](#ai-layer-google-gemini)
- [API Documentation (Swagger / OpenAPI)](#api-documentation-swagger--openapi)
- [REST API Endpoints](#rest-api-endpoints)
- [GraphQL API](#graphql-api)
- [Passkeys (WebAuthn)](#passkeys-webauthn)
- [Migration Scripts](#migration-scripts)
- [Middleware & Request Handling](#middleware--request-handling)
- [Logging & Error Handling](#logging--error-handling)
- [Testing the API](#testing-the-api)
- [Contributing](#contributing)
- [License](#license)

## Architecture & Stack

| Concern | Technology |
| ------- | ---------- |
| HTTP server | **Express** (`express`), deployed on **Vercel** as a serverless function |
| Auth & user store | **Firebase Admin SDK** — Firebase Authentication + Cloud Firestore |
| File & content storage | **Supabase Storage** (`@supabase/supabase-js`, private bucket, `service_role` key, server-side only) |
| AI / LLM | **Google Gemini** (`@google/generative-ai`) with dynamic model discovery, rotation, and multi-model fallback |
| Caching | **Redis** (`redis`) — session, document metadata, query results, recently-viewed lists |
| GraphQL | **`express-graphql`** + **`@graphql-tools/schema`**, with the **GraphiQL** explorer at `/graphql` |
| API docs | **Swagger / OpenAPI** (`swagger-jsdoc`), served via Swagger UI at `/api-docs` |
| Passwordless auth | **Passkeys / WebAuthn** (`@simplewebauthn/server`) |
| Multipart parsing | **`formidable`** (the fallback file-upload endpoint) |
| Document parsing | **`pdf-parse`** (PDF), **`mammoth`** (DOCX) |

The codebase follows an **MVC-style** layout: `controllers/` (REST handlers), `services/` (Firebase, Supabase, and Gemini integration), `views/` (response formatting), `graphql/` (schema + resolvers), and `models/` (passkey persistence).

## Features

- **User Registration & Authentication** — Firebase Authentication; registration also writes a Firestore user profile (`email`, `createdAt`, and `documents`).
- **Passkeys / WebAuthn** — passwordless, phishing-resistant sign-in via `@simplewebauthn/server`. Supports multiple credentials per user and a usernameless (discoverable) login flow; a successful assertion mints a Firebase custom token, matching the `/login` contract.
- **Document Upload & Summarization** — accepts extracted PDF/DOCX text (parsed client-side or via `pdf-parse`/`mammoth`) and generates an AI summary.
- **Scalable Document Storage** — each document is its own Firestore subcollection record; the heavy text/HTML and the original file live in a private Supabase bucket and are served via short-lived **signed URLs**.
- **AI Document Analysis** — summaries, key ideas, discussion points, sentiment, bullet summaries, translations, content rewriting, actionable recommendations, summary refinement, audio processing, and contextual chat — all powered by Google Gemini.
- **GraphQL API** — a complete GraphQL surface mirroring the REST API, with on-demand resolution of heavy document fields and the GraphiQL explorer.
- **Redis Caching** — utility helpers for sessions, document metadata, query results, and recently-viewed documents.
- **Swagger / OpenAPI Documentation** — self-documenting API generated from JSDoc annotations.
- **Structured Logging & Error Handling** — request/response logging, structured error logs, a global error handler, and process-level crash loggers.

## Prerequisites

Ensure you have the following available:

- **Node.js** (v18 or higher — the WebAuthn base64url helpers and Firebase Admin v12 expect Node 18+)
- **npm** or **yarn**
- A **Firebase** project with the **Admin SDK** service-account credentials
- A **Google Generative AI (Gemini)** API key
- A **Supabase** project with a private Storage bucket (default name `docuthinker`)
- A **Redis** instance (optional locally; the server boots without it but caching is disabled)
- A populated **`.env`** file (see [Environment Variables](#environment-variables))

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/hoangsonww/DocuThinker-AI-App.git
   cd DocuThinker-AI-App/backend
   ```

2. **Install dependencies**:

   Using npm:

   ```bash
   npm install
   ```

   or using Yarn:

   ```bash
   yarn install
   ```

## Environment Variables

Create a `.env` file in the `backend` directory (or the repo root). The backend reads it via `dotenv`.

### Firebase Admin

| Variable | Description |
| -------- | ----------- |
| `FIREBASE_TYPE` | Service-account type (usually `service_account`). |
| `FIREBASE_PROJECT_ID` | Firebase project ID. |
| `FIREBASE_PRIVATE_KEY_ID` | Service-account private key ID. |
| `FIREBASE_PRIVATE_KEY` | Service-account private key. Keep the literal `\n` escapes — they are converted to real newlines at startup. |
| `FIREBASE_CLIENT_EMAIL` | Service-account client email. |
| `FIREBASE_CLIENT_ID` | Service-account client ID. |
| `FIREBASE_AUTH_URI` | OAuth2 auth URI (`https://accounts.google.com/o/oauth2/auth`). |
| `FIREBASE_TOKEN_URI` | OAuth2 token URI (`https://oauth2.googleapis.com/token`). |
| `FIREBASE_AUTH_PROVIDER_X509_CERT_URL` | Auth provider x509 cert URL. |
| `FIREBASE_CLIENT_X509_CERT_URL` | Client x509 cert URL. |
| `FIREBASE_DATABASE_URL` | Firebase Realtime Database / project URL (`https://<project-id>.firebaseio.com`). |

### Google Gemini (AI)

| Variable | Description |
| -------- | ----------- |
| `GOOGLE_AI_API_KEY` | API key for Google Generative AI (Gemini). Required for all AI endpoints and audio processing. |
| `AI_INSTRUCTIONS` | Base system-prompt text prepended to every AI instruction (sets the assistant's persona/rules). |

### Supabase Storage

| Variable | Description |
| -------- | ----------- |
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-side only** `service_role` key used to read/write the private bucket and mint signed URLs. Never expose to clients. |
| `SUPABASE_BUCKET` | Storage bucket name. Defaults to `docuthinker` if unset. |

### Redis (caching — optional)

| Variable | Description |
| -------- | ----------- |
| `REDIS_URL` | Connection URL for the Redis instance (TLS is enabled, with `rejectUnauthorized: false`). If unset/unreachable, the server logs the failure and continues without caching. |

### Passkeys / WebAuthn (optional)

Defaults are derived from the request `Origin` header. Pin these for production / custom domains:

| Variable | Description |
| -------- | ----------- |
| `WEBAUTHN_RP_ID` | Relying Party ID (the registrable domain, e.g. `docuthinker-fullstack-app.vercel.app`). |
| `WEBAUTHN_ORIGINS` | Comma-separated list of expected origins (e.g. `https://docuthinker-fullstack-app.vercel.app`). |
| `WEBAUTHN_RP_NAME` | Human-readable Relying Party name shown in the browser prompt (defaults to `DocuThinker`). |

### Example `.env`

```bash
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-client-email@your-firebase-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-abcde@your-firebase-project-id.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com

# Google Gemini
GOOGLE_AI_API_KEY=your-google-generative-ai-api-key
AI_INSTRUCTIONS="You are DocuThinker, a helpful document assistant..."

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET=docuthinker

# Redis (optional)
REDIS_URL=rediss://default:password@host:port

# Passkeys / WebAuthn (optional — defaults derive from the request Origin).
WEBAUTHN_RP_ID=docuthinker-fullstack-app.vercel.app
WEBAUTHN_ORIGINS=https://docuthinker-fullstack-app.vercel.app
WEBAUTHN_RP_NAME=DocuThinker
```

## Running the Server

### Development

```bash
npm start
```

This runs `nodemon index.js`, which restarts on file changes. `npm run server` and `npm run backend` are aliases for the same command.

By default the server listens on **`http://localhost:3000`** (override with the `PORT` environment variable).

> **Note:** `index.js` only calls `app.listen()` when `NODE_ENV !== "production"`. In production the Express `app` is exported and invoked by the Vercel serverless runtime, so it does not bind a port itself.

### Production (Vercel)

The repo's `vercel.json` builds `index.js` with `@vercel/node` and routes all traffic to it:

```json
{
  "version": 2,
  "builds": [{ "src": "index.js", "use": "@vercel/node" }],
  "buildCommand": "npm run vercel-build",
  "routes": [{ "src": "/(.*)", "dest": "index.js" }]
}
```

Deploy with the Vercel CLI (`vercel --prod`) or via the Vercel Git integration, with all [environment variables](#environment-variables) configured in the project settings.

A `Dockerfile` is also provided for container-based hosting (exposes port `3000`).

### Other scripts

| Script | Description |
| ------ | ----------- |
| `npm test` | Run the Jest test suite. |
| `npm run test:watch` | Jest in watch mode. |
| `npm run test:coverage` / `npm run coverage` | Jest with coverage. |
| `npm run format` | Format all `.js` files with Prettier. |
| `npm run vercel-build` | Install + build step used by Vercel. |

## File Structure

The backend follows an **MVC-style** layout for separation of concerns:

```
DocuThinker-AI-App/
└── backend/
    ├── index.js                 # Express app entry point: middleware, routes, GraphQL, Swagger
    ├── controllers/
    │   ├── controllers.js       # REST handlers (auth, documents, AI, account)
    │   └── passkeyController.js  # WebAuthn ceremony handlers
    ├── services/
    │   └── services.js          # Firebase, Supabase Storage, and Gemini integration
    ├── views/
    │   └── views.js             # Success/error response formatters (+ structured error logging)
    ├── graphql/
    │   ├── schema.js            # GraphQL SDL (type definitions)
    │   └── resolvers.js         # Query/Mutation/field resolvers
    ├── models/
    │   └── passkeyModel.js      # Firestore access for passkeys & challenges
    ├── redis/
    │   └── redisClient.js       # Redis client + caching utilities
    ├── scripts/                 # One-off data migration scripts
    │   ├── backfill-original-html.js
    │   ├── migrate-content-to-storage.js
    │   └── migrate-array-to-subcollection.js
    ├── swagger/
    │   └── swagger.js           # Swagger/OpenAPI definition (built from JSDoc)
    ├── public/                  # Static assets (favicon)
    ├── __tests__/               # Jest tests
    ├── vercel.json              # Vercel build/route configuration
    ├── Dockerfile               # Container image
    ├── .env                     # Environment variables (git-ignored)
    └── README.md                # This file
```

## Data Model

### Users

Each user has a Firestore document at `users/{uid}`:

```jsonc
{
  "email": "user@example.com",
  "createdAt": <Timestamp>,
  "theme": "light" | "dark",          // optional
  "socialMedia": {                     // optional
    "github": "", "linkedin": "",
    "facebook": "", "instagram": "", "twitter": ""
  },
  "documents": []                      // legacy inline array (see below)
}
```

### Documents (subcollection)

Each uploaded document is its **own Firestore document** in the per-user subcollection `users/{uid}/documents/{docId}`. Storing one small record per upload removes the **1 MB-per-user array ceiling** that the old inline `documents` array hit for large files.

A subcollection record holds only lightweight metadata:

```jsonc
{
  "id": "docId",
  "title": "My Document",
  "summary": "AI-generated summary…",
  "filePath": "uid/1700000000000-abc-file.pdf",   // path to the original file in Supabase
  "fileType": "application/pdf",
  "contentPath": "uid/content/docId.json",          // path to the content JSON in Supabase
  "createdAt": <Timestamp>
}
```

The **original uploaded file** and a JSON **content object** `{ originalText, originalHtml }` live in the **private Supabase bucket** (default `docuthinker`). Firestore keeps only the `filePath` and `contentPath` pointers — never the heavy text/HTML or the file bytes. The document text/HTML and the original file are fetched/served on demand via **short-lived signed URLs**.

> **Legacy compatibility:** older documents were stored inline in the user's `documents` array (and some kept `originalText`/`originalHtml` inline). All reads **merge the subcollection with any legacy inline array** (subcollection wins on id collisions), and the upload path keeps a small inline fallback if the content offload fails. This guarantees nothing is lost mid-migration. See [Migration Scripts](#migration-scripts).

### Supabase service helpers (`services/services.js`)

| Helper | Purpose |
| ------ | ------- |
| `storeDocumentFile(userId, file)` | Upload a server-parsed file to the private bucket. Returns `{ filePath, fileType }`. |
| `createDocumentUploadUrl(userId, fileName)` | Mint a one-time **signed upload URL** so the browser can upload directly to the bucket (bypassing the serverless body-size limit). Returns `{ path, token, signedUrl }`. |
| `storeDocumentContent(userId, docId, content)` | Store the `{ originalText, originalHtml }` JSON content object. Returns the storage `path`. |
| `getDocumentContent(contentPath)` | Download + parse the content JSON. Returns `{ originalText, originalHtml }` or `null`. |
| `getDocumentFileUrl(filePath, expiresIn = 3600)` | Create a short-lived **signed download URL** for the original file. Returns `""` on failure (viewer degrades gracefully). |
| `deleteStorageObjects(paths)` | Best-effort removal of stored objects (file + content JSON); logs and swallows errors so deletes never fail on cleanup. |

The Supabase client is created lazily with the `service_role` key and `persistSession: false`. It only ever touches the dedicated Storage bucket.

## Document Upload Flow

The primary (recommended) upload path uploads the file **directly to Supabase from the browser**, keeping the original file but never routing its bytes through the serverless function:

1. **Mint a signed upload URL** — `POST /document-upload-url` with `{ userId?, fileName }`. The backend returns `{ path, token, signedUrl }` (the `service_role` key stays server-side).
2. **Browser uploads the file directly to Supabase** using the signed URL.
3. **Summarize & persist** — `POST /upload` with:

   ```jsonc
   {
     "userId": "optional",       // when present, the doc is saved to the user's library
     "title": "My Document",
     "text": "extracted plain text…",  // required; used for the AI summary
     "html": "<p>…</p>",          // optional, display-only rendering for the viewer
     "filePath": "uid/...-file.pdf",   // the path returned by the signed upload (optional)
     "fileType": "application/pdf"      // optional
   }
   ```

   The backend then:
   - Generates an easy-to-read summary with Gemini (the model decides the layout — short paragraphs, headings/lists only where they help). The `title` and today's date are injected into the AI context, but the stored `originalText` stays clean.
   - Offloads `{ originalText, originalHtml }` to a Supabase content object and records its `contentPath`.
   - Writes the lean metadata record to `users/{uid}/documents/{docId}`.
   - Returns `{ summary, originalText, originalHtml, fileType, fileUrl }` (where `fileUrl` is a signed download URL for the original file).

   > If the content offload fails, the upload still succeeds: small text/HTML (< ~400 KB) is inlined on the record as a fallback; if too large, a lean record is saved and the viewer falls back to the stored file.

### Fallback: multipart through the backend

When direct-to-storage upload is not available, `POST /document-file` (multipart, parsed by `formidable`) streams the file **through** the backend to Supabase and returns `{ filePath, fileType }`, which the client then passes to `POST /upload`.

## AI Layer (Google Gemini)

All AI features use **Google Gemini** via `@google/generative-ai`, wrapped in a resilient runner:

- **Dynamic model discovery** — the live model list is fetched from the Generative Language API (`/v1/models`), filtered to text-capable Gemini models (excludes embedding/pro variants), and cached for 5 minutes. Falls back to `gemini-2.5-flash` if discovery fails.
- **Rotation** — requests rotate the starting model across the discovered list to spread load.
- **Multi-model fallback** — each request tries models in turn; if one fails (e.g. `429`/`503`/quota), it transparently retries the next, surfacing a meaningful error only after **all** models are exhausted.
- **Context injection** — every AI system prompt (for **all** generations, not just summaries) is prefixed with today's real date (`currentDateContext`), and for `/upload` the document `title` is prepended to the text fed to the model so it can reason about recency and subject matter. The `title` is used only as AI context — the stored/returned `originalText` stays clean (no title prefix).
- **Readable summary formatting** — the `/upload` summary prompt asks Gemini to produce an easy-to-read, **model-decided** layout: clear plain language with short paragraphs, using a brief heading or short list **only where it genuinely improves clarity** (it explicitly avoids forced bullet-heavy or dense output). The summary is rendered as Markdown, so light Markdown (short headings, occasional bold/lists) is allowed.

### AI endpoints

| Feature | Endpoint | Notes |
| ------- | -------- | ----- |
| Summarize a document | `POST /upload` | Easy-to-read, model-decided summary (short paragraphs; headings/lists only where they help); persists when `userId` is provided. |
| Sentiment analysis | `POST /sentiment-analysis` | Returns `{ sentimentScore, description }` (score from −1 to +1). |
| Key ideas | `POST /generate-key-ideas` | |
| Discussion points | `POST /generate-discussion-points` | |
| Contextual chat | `POST /chat` | Maintains per-`sessionId` history with the document as context. |
| Summary in a language | `POST /summary-in-language` | |
| Bullet-point summary | `POST /bullet-summary` | |
| Actionable recommendations | `POST /actionable-recommendations` | |
| Content rewriting | `POST /content-rewriting` | Rewrites in a requested style/tone. |
| Refine a summary | `POST /refine-summary` | Refines an existing summary per user instructions. |
| Audio processing | `POST /process-audio` | Uploads a WAV/MP3 to Gemini's File API and returns a summary/transcription. |

## API Documentation (Swagger / OpenAPI)

Once the server is running, the Swagger UI is available at:

```
http://localhost:3000/api-docs
```

- The OpenAPI definition is served as JSON at `/swagger.json`.
- The spec is generated by `swagger-jsdoc` from the JSDoc `@swagger` annotations in `index.js`, `controllers/controllers.js`, `controllers/passkeyController.js`, and the model files.
- The root route `/` redirects to `/api-docs`.
- **Authorization:** click **Authorize** in the Swagger UI and provide a Bearer token to exercise authenticated routes.

## REST API Endpoints

> **Note:** routes are registered in `index.js`. Document delete routes use `DELETE /documents/:userId/:docId` and `DELETE /documents/:userId`; the user-email lookup is `GET /users/:userId`.

### Authentication & users

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST   | `/register` | Register a new user in Firebase Auth and create their Firestore profile. |
| POST   | `/login` | Log in by email; returns a Firebase **custom token** + `userId`. |
| POST   | `/forgot-password` | Reset a user's password in Firebase Auth (`email`, `newPassword`). |
| POST   | `/verify-email` | Verify that an email exists; returns the user's `uid`. |
| POST   | `/update-email` | Update a user's email in both Firebase Auth and Firestore. |
| POST   | `/update-password` | Update a user's password in Firebase Auth. |
| PUT    | `/update-theme` | Update the user's preferred theme (`light`/`dark`). |
| GET    | `/users/:userId` | Retrieve a user's email. |
| GET    | `/user-joined-date/:userId` | Retrieve the user's join date (`createdAt`). |
| GET    | `/days-since-joined/:userId` | Days since the user joined. |
| GET    | `/social-media/:userId` | Retrieve the user's social-media links. |
| POST   | `/update-social-media` | Update the user's social-media links. |

### Passkeys (WebAuthn)

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST   | `/passkey/register/options` | Begin passkey registration; returns WebAuthn creation options + a `flowId`. |
| POST   | `/passkey/register/verify` | Verify the authenticator attestation and store the new credential. |
| POST   | `/passkey/authenticate/options` | Begin passkey login (email-scoped or discoverable); returns options + `flowId`. |
| POST   | `/passkey/authenticate/verify` | Verify the assertion; returns a Firebase custom token + `userId` (same shape as `/login`). |
| GET    | `/passkeys/:userId` | List a user's passkeys (public metadata only). |
| PATCH  | `/passkeys/:userId/:credentialId` | Rename one of the user's passkeys. |
| DELETE | `/passkeys/:userId/:credentialId` | Delete one of the user's passkeys. |

### Documents

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST   | `/document-upload-url` | Mint a signed upload URL for direct-to-storage file uploads. |
| POST   | `/upload` | Summarize a document; persists to the user's library when `userId` is provided. |
| POST   | `/document-file` | Fallback: upload a file (multipart) through the backend to storage. |
| GET    | `/documents/:userId` | Retrieve all of a user's documents (subcollection merged with legacy array). |
| GET    | `/documents/:userId/:docId` | Retrieve a single document by id. |
| GET    | `/document-details/:userId/:docId` | Retrieve title, original text/HTML, summary, file type, and a signed `fileUrl`. |
| GET    | `/search-documents/:userId?searchTerm=…` | Search a user's documents by title; returns matching `{ docId, title, snippet }`. |
| GET    | `/document-count/:userId` | Number of documents for a user. |
| POST   | `/update-document-title` | Update a document's title. |
| DELETE | `/documents/:userId/:docId` | Delete one document (and its storage objects). |
| DELETE | `/documents/:userId` | Delete all of a user's documents (and their storage objects). |

### AI / document analysis

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST   | `/sentiment-analysis` | Sentiment score (−1 to +1) + description. |
| POST   | `/generate-key-ideas` | Key ideas from the text. |
| POST   | `/generate-discussion-points` | Discussion points from the text. |
| POST   | `/chat` | Chat with the document as context (per-`sessionId` history). |
| POST   | `/summary-in-language` | Summary in a requested language. |
| POST   | `/bullet-summary` | Bullet-point summary. |
| POST   | `/actionable-recommendations` | Actionable next steps / takeaways. |
| POST   | `/content-rewriting` | Rewrite content in a requested style. |
| POST   | `/refine-summary` | Refine a summary per user instructions. |
| POST   | `/process-audio` | Process an uploaded WAV/MP3 and return a summary. |

### Other

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| ALL    | `/graphql` | GraphQL endpoint with the GraphiQL explorer. |
| GET    | `/api-docs` | Swagger UI. |
| GET    | `/swagger.json` | OpenAPI JSON. |
| GET    | `/` | Redirects to `/api-docs`. |

### Authentication header

Routes that require authentication expect a **Bearer token** in the `Authorization` header:

```bash
Authorization: Bearer <your-firebase-custom-token>
```

## GraphQL API

The GraphQL API mirrors the REST surface and is available at **`/graphql`** with the **GraphiQL** explorer enabled. The schema is defined in `graphql/schema.js` and resolved in `graphql/resolvers.js`. Heavy document fields (`fileUrl`, `originalText`, `originalHtml`) are **resolved on demand** — they are only fetched from Supabase when a query selects them.

### Queries

| Query | Description |
| ----- | ----------- |
| `getUser(id)` | Full user object (with nested `documents`, `socialMedia`, counts, etc.). |
| `getUserEmail(userId)` | The user's email. |
| `getDocument(userId, docId)` | A single document. |
| `listDocuments(userId)` | All of a user's documents. |
| `searchDocuments(userId, searchTerm)` | Title search → `[SearchResult]` (`docId`, `title`, `snippet`). |
| `documentCount(userId)` | Number of documents. |
| `daysSinceJoined(userId)` | Days since the user joined. |
| `userJoinedDate(userId)` | The user's join date (ISO string). |
| `getSocialMedia(userId)` | The user's social-media links. |
| `analyzeSentiment(documentText)` | Sentiment `{ score, description }` for arbitrary text. |

### Mutations

| Mutation | Description |
| -------- | ----------- |
| `register(email, password)` | Create a user; returns `{ userId }`. |
| `login(email, password)` | Returns `{ userId, customToken }`. |
| `summarizeDocument(userId?, title, text, html?, filePath?, fileType?)` | Summarize and (when `userId` is given) save the document. Returns `DocumentSummary`. |
| `deleteDocument(userId, docId)` | Delete one document (and its storage objects). |
| `deleteAllDocuments(userId)` | Delete all of a user's documents. |
| `updateDocumentTitle(userId, docId, title)` | Rename a document. |
| `updateEmail(userId, newEmail)` | Update the user's email. |
| `updateTheme(userId, theme)` | Update the user's theme. |
| `updateSocialMedia(userId, github?, linkedin?, facebook?, instagram?, twitter?)` | Update social-media links. |
| `generateKeyIdeas(documentText)` | Key ideas. |
| `generateDiscussionPoints(documentText)` | Discussion points. |
| `generateBulletSummary(documentText)` | Bullet-point summary. |
| `summaryInLanguage(documentText, language)` | Summary in a language. |
| `actionableRecommendations(documentText)` | Actionable recommendations. |
| `rewriteContent(documentText, style)` | Rewrite content in a style. |
| `refineSummary(summary, refinementInstructions)` | Refine a summary. |
| `chat(sessionId?, message, originalText)` | Contextual chat. |

### Key types

- **`Document`** — `id`, `title`, `summary`, `fileType`, `filePath`, `contentPath`, `createdAt`, plus the lazily-resolved `fileUrl`, `originalText`, and `originalHtml`.
- **`DocumentSummary`** — `summary`, `originalText`, `originalHtml`, `fileType`, `fileUrl`.
- **`User`** — `id`, `email`, `createdAt`, `theme`, `documentCount`, `daysSinceJoined`, `joinedDate`, `socialMedia`, `documents`.
- **`Sentiment`** — `score`, `description`. **`AuthResult`** — `userId`, `customToken`. **`SearchResult`** — `docId`, `title`, `snippet`.

### Example query

```graphql
query {
  getUser(id: "USER_ID") {
    email
    documentCount
    documents {
      id
      title
      fileUrl        # signed URL, resolved on demand
      originalText   # fetched from storage on demand
    }
  }
}
```

## Passkeys (WebAuthn)

Passwordless sign-in is implemented with [`@simplewebauthn/server`](https://simplewebauthn.dev/) and lives in `controllers/passkeyController.js` (HTTP + ceremony logic) and `models/passkeyModel.js` (Firestore access).

### Data model (Firestore)

- `passkeys/{credentialId}` — one document per credential: `userId`, `publicKey` (base64url), `counter`, `transports`, `deviceType`, `backedUp`, `aaguid`, `name`, `createdAt`, `lastUsedAt`. A user may own many.
- `webauthnChallenges/{flowId}` — short-lived (5-minute TTL) registration/authentication challenges, deleted as soon as they are consumed.

### Ceremonies

1. **Register** — `POST /passkey/register/options` (returns options + `flowId`, excluding already-enrolled credentials) → browser creates the credential → `POST /passkey/register/verify` validates the attestation and stores it.
2. **Authenticate** — `POST /passkey/authenticate/options` (email-scoped or discoverable) → browser produces an assertion → `POST /passkey/authenticate/verify` validates it, bumps the signature counter (clone detection), and returns a **Firebase custom token + `userId`** — the same shape as `/login`, so the client's auth flow is identical for password and passkey sign-in.

### Configuration

The Relying Party ID and expected origin are derived from the request `Origin` header by default, and can be pinned for production via `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGINS`, and `WEBAUTHN_RP_NAME` (see [Environment Variables](#environment-variables)).

## Migration Scripts

One-off data scripts live in `backend/scripts/` and are run from the `backend` directory with the environment loaded:

```bash
node scripts/<name>.js
```

Each script is **re-runnable** and **data-safe** — it never drops data until the replacement copy is confirmed written.

| Script | What it does |
| ------ | ------------ |
| `backfill-original-html.js` | For legacy docs that only ever stored space-joined plaintext, generates `originalHtml` (paragraph-izes the stored text) and ensures `filePath`/`fileType` fields exist, so the viewer renders old docs as readable paragraphs. (The original PDF/DOCX is not recoverable — only text was stored.) |
| `migrate-content-to-storage.js` | Moves each doc's inline `originalText`/`originalHtml` into a Supabase **content object** and replaces the inline blobs with a tiny `contentPath`, shrinking bloated user documents under Firestore's 1 MB limit. Content is offloaded **before** the inline fields are dropped, so no data is lost. |
| `migrate-array-to-subcollection.js` | The permanent fix: copies each user's inline `documents` array into the per-document subcollection `users/{uid}/documents/{docId}`, preserving chronological order. Documents are **copied first**; the inline array is only cleared once every document copied successfully (otherwise it is left intact and reads still merge both sources). |

### Recommended order

Run them in this order against a project being upgraded from the legacy inline-array model:

1. **`backfill-original-html.js`** — ensure old text-only docs have renderable HTML.
2. **`migrate-content-to-storage.js`** — offload inline text/HTML to Supabase Storage.
3. **`migrate-array-to-subcollection.js`** — move the (now lean) array records into the subcollection.

Because all reads merge the subcollection with any remaining legacy array, the application stays fully functional at every step of the migration.

## Middleware & Request Handling

`index.js` wires the request pipeline in a deliberate order so that CORS headers and large bodies work even for big documents and on error paths:

- **Permissive top-level CORS** — a hand-rolled middleware runs **first**, before any body parsing or routing. It sets `Access-Control-Allow-Origin: *`, **reflects** the requested headers (`Access-Control-Request-Headers`, falling back to `*`) so no custom header is ever rejected, answers `OPTIONS` preflights with **`204`**, and — because it runs ahead of everything else — guarantees the CORS headers are present on **every** response, including error and crash paths. (A second `cors()` pass with explicit options also runs after the logger.)
- **Large request bodies (25 MB)** — `express.json` and `express.urlencoded` are configured with `limit: "25mb"`, well above body-parser's tiny ~100 KB default. The `/upload` JSON body carries the **extracted text + display HTML**, which easily exceeds 100 KB for real documents. The **original file itself never goes through this body** — it is uploaded directly to Supabase via a signed upload URL.

  > **Heads-up:** Vercel's serverless platform still enforces its own request-body cap (~**4.5 MB**), so the effective ceiling in production is set by Vercel, not by this `25mb` limit. The direct-to-Supabase upload path exists precisely so the original file bytes bypass this constraint.

## Logging & Error Handling

The backend is built to make failures **traceable in production logs** (Vercel):

- **Request/response logger** — every call logs one `[REQ] METHOD url` line on entry and one `[RES] METHOD url -> status (ms)` line on completion (errors at `5xx` are logged via `console.error`). A second timestamped logger records `METHOD url` for each request.
- **Structured error logging** — `views/views.js#sendErrorResponse` always logs the full server-side error (`name`, `message`, `code`, `stack`, and any upstream `response.data`) under an `[ERROR <status>]` label, while returning a concise, never-blank `details` string to the client.
- **Global error handlers** — `index.js` registers a 404 handler for unknown routes, a global `500` handler, an `UnauthorizedError → 401` handler, and a catch-all `[UNHANDLED]` handler that logs full stacks for anything that slips through.
- **Process-level loggers** — `unhandledRejection` and `uncaughtException` are logged so crashes are never silent.

Error responses follow this shape:

```json
{
  "error": "An internal error occurred",
  "details": "Specific error details"
}
```

## Testing the API

You can test the API using tools like **Postman** or **curl**.

#### Example: register a user

```bash
curl --location --request POST 'http://localhost:3000/register' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Example: summarize a document

```bash
curl --location --request POST 'http://localhost:3000/upload' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "title": "My Document",
    "text": "The full extracted text of the document..."
  }'
```

#### Example: a GraphQL request

```bash
curl --location --request POST 'http://localhost:3000/graphql' \
  --header 'Content-Type: application/json' \
  --data-raw '{ "query": "{ documentCount(userId: \"USER_ID\") }" }'
```

## Contributing

1. **Fork the repo**
2. **Create a new branch**: `git checkout -b feature-branch`
3. **Commit your changes**: `git commit -m 'Add new feature'`
4. **Push the branch**: `git push origin feature-branch`
5. **Submit a pull request**

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International License** — see the [LICENSE](LICENSE.md) file for details.

> Note: the backend `package.json` currently declares an `MIT` license field, which is inconsistent with the bundled `LICENSE.md` (Creative Commons). The bundled `LICENSE.md` is authoritative.

---

Happy coding! 🚀
</content>
</invoke>
