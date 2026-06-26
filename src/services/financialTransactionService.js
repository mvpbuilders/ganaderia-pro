import { apiClient } from "./apiClient";

export const FINANCIAL_TRANSACTIONS_QUERY_KEY = ["financial_transactions"];

const DECIMAL_FIELDS = ["monto_usd", "litros", "precio_por_litro"];

function toNum(value) {
  if (value === null || value === undefined || value === "") return value;
  const n = Number(value);
  return Number.isNaN(n) ? value : n;
}

function normalizeTransaction(t) {
  if (!t) return t;
  return DECIMAL_FIELDS.reduce((acc, f) => ({ ...acc, [f]: toNum(acc[f]) }), { ...t });
}

function normalizeTransactions(items) {
  return Array.isArray(items) ? items.map(normalizeTransaction) : items;
}

export const financialTransactionService = {
  async list() {
    const items = await apiClient.get("/api/financial_transactions");
    return normalizeTransactions(items);
  },
  async create(data) {
    const item = await apiClient.post("/api/financial_transactions", data);
    return normalizeTransaction(item);
  },
  destroy(id) {
    return apiClient.delete(`/api/financial_transactions/${id}`);
  },
};
