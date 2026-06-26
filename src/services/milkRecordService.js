import { apiClient } from "./apiClient";

export const MILK_RECORDS_QUERY_KEY = ["milk_records"];

const DECIMAL_FIELDS = ["litros_am", "litros_pm", "total_litros"];

function toNum(value) {
  if (value === null || value === undefined || value === "") return value;
  const n = Number(value);
  return Number.isNaN(n) ? value : n;
}

function normalizeRecord(r) {
  if (!r) return r;
  return DECIMAL_FIELDS.reduce((acc, f) => ({ ...acc, [f]: toNum(acc[f]) }), { ...r });
}

function normalizeRecords(items) {
  return Array.isArray(items) ? items.map(normalizeRecord) : items;
}

export const milkRecordService = {
  async list(params = {}) {
    const query = params.animal_id != null ? `?animal_id=${params.animal_id}` : "";
    const items = await apiClient.get(`/api/milk_records${query}`);
    return normalizeRecords(items);
  },
  async bulkUpsert(records) {
    const items = await apiClient.post("/api/milk_records/bulk_upsert", { milk_records: records });
    return normalizeRecords(items);
  },
};
