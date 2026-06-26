import { apiClient } from "./apiClient";

export const fincaService = {
  create(nombre) {
    return apiClient.post("/api/fincas", { nombre });
  },
};
