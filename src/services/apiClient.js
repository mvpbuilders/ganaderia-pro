const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const API_TOKEN_STORAGE_KEY = "ganaderia_pro_api_token";

export function getApiToken() {
  return localStorage.getItem(API_TOKEN_STORAGE_KEY);
}

export function setApiToken(token) {
  if (token) {
    localStorage.setItem(API_TOKEN_STORAGE_KEY, token);
  }
}

export function clearApiToken() {
  localStorage.removeItem(API_TOKEN_STORAGE_KEY);
}

async function parseResponse(response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = data?.error || data?.message || response.statusText;
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return data;
}

export async function apiRequest(path, options = {}) {
  const token = getApiToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  return parseResponse(response);
}

export const apiClient = {
  get: (path, options) => apiRequest(path, { ...options, method: "GET" }),
  post: (path, data, options) =>
    apiRequest(path, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    }),
  patch: (path, data, options) =>
    apiRequest(path, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (path, options) => apiRequest(path, { ...options, method: "DELETE" }),
};
