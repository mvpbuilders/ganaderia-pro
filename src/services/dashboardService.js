import { apiClient } from "./apiClient";

export const DASHBOARD_QUERY_KEY = ["dashboard"];

export const dashboardService = {
  get() {
    return apiClient.get("/api/dashboard");
  },
};
