// store/cuttingbatchstore.js

import { create } from "zustand";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const apiUrl = (path = "") => {
  const base = API_BASE.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return {};
  }
};

const cuttingBatchStore = create((set, get) => ({
  batches: [],
  selectedBatch: null,
  lastCreatedBatch: null,

  loading: false,
  creating: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchCuttingBatches: async () => {
    try {
      set({ loading: true, error: null });

      const res = await fetch(apiUrl("/api/cutting-batches"), {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await safeJson(res);

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch cutting batches");
      }

      set({
        batches: data.batches || [],
        loading: false,
      });

      return data;
    } catch (error) {
      set({
        error: error.message,
        loading: false,
      });

      return {
        success: false,
        message: error.message,
      };
    }
  },

  fetchCuttingBatchById: async (id) => {
    try {
      if (!id) throw new Error("Batch id is required");

      set({ loading: true, error: null });

      const res = await fetch(apiUrl(`/api/cutting-batches/${id}`), {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await safeJson(res);

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch cutting batch");
      }

      set({
        selectedBatch: data.batch || null,
        loading: false,
      });

      return data;
    } catch (error) {
      set({
        error: error.message,
        loading: false,
      });

      return {
        success: false,
        message: error.message,
      };
    }
  },

  createCuttingBatch: async () => {
    try {
      set({ creating: true, error: null });

      const res = await fetch(apiUrl("/api/cutting-batches"), {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await safeJson(res);

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create cutting batch");
      }

      const batch = data.batch || null;

      set({
        lastCreatedBatch: batch,
        selectedBatch: batch,
        batches: batch ? [batch, ...get().batches] : get().batches,
        creating: false,
      });

      return data;
    } catch (error) {
      set({
        error: error.message,
        creating: false,
      });

      return {
        success: false,
        message: error.message,
      };
    }
  },

  setSelectedBatch: (batch) => {
    set({
      selectedBatch: batch || null,
    });
  },

  clearSelectedBatch: () => {
    set({
      selectedBatch: null,
    });
  },

  clearLastCreatedBatch: () => {
    set({
      lastCreatedBatch: null,
    });
  },
}));

export default cuttingBatchStore;