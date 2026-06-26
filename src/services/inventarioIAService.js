import { apiClient } from "./apiClient";

export const INVENTARIO_IA_QUERY_KEY = ["inventario-ia"];

const NUMBER_FIELDS = ["cantidad_inicial", "stock_actual", "precio_unitario"];

function toNum(value) {
  if (value === null || value === undefined || value === "") return value;
  const n = Number(value);
  return Number.isNaN(n) ? value : n;
}

function normalizeItem(item) {
  if (!item) return item;
  return NUMBER_FIELDS.reduce((acc, f) => ({ ...acc, [f]: toNum(acc[f]) }), { ...item });
}

function normalizeItems(items) {
  return Array.isArray(items) ? items.map(normalizeItem) : items;
}

export const inventarioIAService = {
  async list(params = {}) {
    const query = params.disponibles ? "?disponibles=true" : "";
    const items = await apiClient.get(`/api/inventario_ia${query}`);
    return normalizeItems(items);
  },
  async create(data) {
    const item = await apiClient.post("/api/inventario_ia", data);
    return normalizeItem(item);
  },
  async update(id, data) {
    const item = await apiClient.patch(`/api/inventario_ia/${id}`, data);
    return normalizeItem(item);
  },
  destroy(id) {
    return apiClient.delete(`/api/inventario_ia/${id}`);
  },
};
