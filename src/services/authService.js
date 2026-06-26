import { apiClient, clearApiToken, setApiToken } from "./apiClient";

export const authService = {
  async login(email, password) {
    const response = await apiClient.post("/api/auth/login", { email, password });
    setApiToken(response.token);
    return response;
  },

  async register(data) {
    const response = await apiClient.post("/api/auth/register", data);
    setApiToken(response.token);
    return response;
  },

  me() {
    return apiClient.get("/api/auth/me");
  },

  async logout() {
    try {
      return await apiClient.post("/api/auth/logout", {});
    } finally {
      clearApiToken();
    }
  },
};
