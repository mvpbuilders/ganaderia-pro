import { apiClient } from "./apiClient";

export const ADMIN_OVERVIEW_QUERY_KEY = ["admin-overview"];

export const adminService = {
  overview() {
    return apiClient.get("/api/admin/overview");
  },
};
