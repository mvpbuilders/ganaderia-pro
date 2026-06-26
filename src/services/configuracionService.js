import { apiClient } from "./apiClient";

export const CONFIGURACION_QUERY_KEY = ["configuracion"];

const NUMBER_FIELDS = [
  "precio_litro_usd",
  "meta_produccion_diaria",
  "hectareas_totales",
  "dias_gestacion",
  "dias_chequeo_post_inseminacion",
];

function toNum(value) {
  if (value === null || value === undefined || value === "") return value;
  const n = Number(value);
  return Number.isNaN(n) ? value : n;
}

function normalize(config) {
  if (!config) return config;
  return NUMBER_FIELDS.reduce((acc, f) => ({ ...acc, [f]: toNum(acc[f]) }), { ...config });
}

export const configuracionService = {
  async get() {
    const config = await apiClient.get("/api/configuracion");
    return normalize(config);
  },
  async save(data) {
    const config = await apiClient.patch("/api/configuracion", data);
    return normalize(config);
  },
};
