// DocuThinker backend client. Endpoints mirror the web frontend.

import { getToken } from "./auth";

export const BASE_URL = "https://docuthinker-app-backend-api.vercel.app";

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...((headers as Record<string, string>) ?? {}),
  };
  if (auth) {
    const token = getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body?.error || body?.message || message;
    } catch {
      // response had no JSON body — keep the status-based message
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export type LoginResponse = { customToken: string; userId: string };
export type UploadResponse = { summary: string; originalText: string };
export type ChatResponse = { response: string };
export type DocumentSummary = {
  id: string;
  title: string;
  summary?: string;
  originalText?: string;
};

// Backend returns /documents/:userId as an object keyed by numeric strings
// plus a "message" field — mirror the web client's normalization so the
// mobile list renders the same items the web app shows.
function normalizeDocumentsResponse(raw: unknown): DocumentSummary[] {
  if (Array.isArray(raw)) return raw as DocumentSummary[];
  if (!raw || typeof raw !== "object") return [];
  const record = raw as Record<string, unknown>;
  const result: DocumentSummary[] = [];
  for (const key of Object.keys(record)) {
    if (key === "message") continue;
    const entry = record[key];
    if (!entry || typeof entry !== "object") continue;
    const doc = entry as Record<string, unknown>;
    const rawTitle = doc.title;
    const title = Array.isArray(rawTitle)
      ? rawTitle
          .filter((x) => typeof x === "string")
          .join(" ")
          .trim()
      : typeof rawTitle === "string"
        ? rawTitle
        : "Untitled document";
    const id =
      typeof doc.id === "string"
        ? doc.id
        : typeof doc.docId === "string"
          ? (doc.docId as string)
          : key;
    const summary = typeof doc.summary === "string" ? doc.summary : undefined;
    const originalText =
      typeof doc.originalText === "string" ? doc.originalText : undefined;
    result.push({
      id,
      title: title || "Untitled document",
      summary,
      originalText,
    });
  }
  return result;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    request<{ message: string }>("/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  verifyEmail: (email: string) =>
    request<{ message: string; uid: string }>("/verify-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  forgotPassword: (email: string, newPassword: string) =>
    request<{ message: string }>("/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email, newPassword }),
    }),

  getUserEmail: (userId: string) =>
    request<{ email: string }>(`/users/${userId}`),

  getDaysSinceJoined: (userId: string) =>
    request<{ days: number }>(`/days-since-joined/${userId}`),

  getDocumentCount: (userId: string) =>
    request<{ documentCount: number }>(`/document-count/${userId}`),

  getUserJoinedDate: (userId: string) =>
    request<{ joinedDate: string }>(`/user-joined-date/${userId}`),

  getDocuments: async (userId: string): Promise<DocumentSummary[]> => {
    const raw = await request<unknown>(`/documents/${userId}`);
    return normalizeDocumentsResponse(raw);
  },

  getDocumentDetails: async (userId: string, docId: string) => {
    const raw = await request<{
      title: string | string[];
      summary?: string;
      originalText?: string;
    }>(`/document-details/${userId}/${docId}`);
    const title = Array.isArray(raw.title)
      ? raw.title
          .filter((x) => typeof x === "string")
          .join(" ")
          .trim()
      : (raw.title ?? "");
    return {
      title: title || "Untitled document",
      summary: raw.summary ?? "",
      originalText: raw.originalText ?? "",
    };
  },

  deleteDocument: (userId: string, docId: string) =>
    request<void>(`/documents/${userId}/${docId}`, { method: "DELETE" }),

  upload: (userId: string | null, title: string, text: string) =>
    request<UploadResponse>("/upload", {
      method: "POST",
      body: JSON.stringify({ userId, title, text }),
    }),

  chat: (message: string, originalText: string, sessionId: string) =>
    request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({ message, originalText, sessionId }),
    }),

  generateKeyIdeas: (documentText: string) =>
    request<{ message: string; keyIdeas: string }>("/generate-key-ideas", {
      method: "POST",
      body: JSON.stringify({ documentText }),
    }),

  generateDiscussionPoints: (documentText: string) =>
    request<{ message: string; discussionPoints: string }>(
      "/generate-discussion-points",
      {
        method: "POST",
        body: JSON.stringify({ documentText }),
      },
    ),

  updateUserEmail: (userId: string, newEmail: string) =>
    request<{ message: string }>("/update-email", {
      method: "POST",
      body: JSON.stringify({ userId, newEmail }),
    }),

  updateUserPassword: (userId: string, newPassword: string) =>
    request<{ message: string }>("/update-password", {
      method: "POST",
      body: JSON.stringify({ userId, newPassword }),
    }),

  deleteAllDocuments: (userId: string) =>
    request<{ message: string }>(`/documents/${userId}`, { method: "DELETE" }),

  updateTheme: (userId: string, theme: "light" | "dark") =>
    request<{ message: string; theme: string }>("/update-theme", {
      method: "PUT",
      body: JSON.stringify({ userId, theme }),
    }),

  getSocialMedia: (userId: string) =>
    request<{
      message: string;
      socialMedia: {
        github?: string;
        linkedin?: string;
        facebook?: string;
        instagram?: string;
        twitter?: string;
      };
    }>(`/social-media/${userId}`),

  updateSocialMedia: (
    userId: string,
    links: {
      github?: string;
      linkedin?: string;
      facebook?: string;
      instagram?: string;
      twitter?: string;
    },
  ) =>
    request<{ message: string }>("/update-social-media", {
      method: "POST",
      body: JSON.stringify({ userId, ...links }),
    }),

  updateDocumentTitle: (userId: string, docId: string, newTitle: string) =>
    request<{ message: string }>("/update-document-title", {
      method: "POST",
      body: JSON.stringify({ userId, docId, newTitle }),
    }),
};
