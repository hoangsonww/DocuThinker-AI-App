// DocuThinker backend client. Endpoints mirror the web frontend.
export const BASE_URL = "https://docuthinker-app-backend-api.vercel.app";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
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

  return response.json() as Promise<T>;
}

export type LoginResponse = { customToken: string; userId: string };

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

  forgotPassword: (email: string, newPassword: string) =>
    request<{ message: string }>("/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email, newPassword }),
    }),

  documents: (userId: string) =>
    request<unknown[]>(`/documents/${userId}`),

  chat: (message: string, originalText: string, sessionId: string) =>
    request<{ response: string }>("/chat", {
      method: "POST",
      body: JSON.stringify({ message, originalText, sessionId }),
    }),
};
