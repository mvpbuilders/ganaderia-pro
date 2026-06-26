import { apiClient } from "./apiClient";

export const FINCA_USERS_QUERY_KEY = ["finca_users"];

export const fincaUserService = {
  list() {
    return apiClient.get("/api/finca_users");
  },
  invite(email, role) {
    return apiClient.post("/api/finca_users", { email, role });
  },
  destroy(id) {
    return apiClient.delete(`/api/finca_users/${id}`);
  },
};
