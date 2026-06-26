import { apiClient } from "./apiClient";

export const animalService = {
  list() {
    return apiClient.get("/api/animals");
  },

  get(id) {
    return apiClient.get(`/api/animals/${id}`);
  },

  create(data) {
    return apiClient.post("/api/animals", data);
  },

  update(id, data) {
    return apiClient.patch(`/api/animals/${id}`, data);
  },

  destroy(id) {
    return apiClient.delete(`/api/animals/${id}`);
  },
};
