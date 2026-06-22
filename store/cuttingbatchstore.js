// store/cuttingbatchstore.js

import { create } from "zustand";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const cuttingBatchStore = create((set, get) => ({
  // data
  batches: [],
  selectedBatch: null,
  lastCreatedBatch: null,

  // ui state
  loading: false,
  creating: false,
  error: null,

  // clear error
  clearError: () => set({ error: null }),

  // get all cutting batches
  fetchCuttingBatches: async () => {
    try {
      set({ loading: true, error: null });

      const res = await fetch(`${API_BASE}/api/cutting-batches`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

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

  // get single cutting batch
  fetchCuttingBatchById: async (id) => {
    try {
      if (!id) {
        throw new Error("Batch id is required");
      }

      set({ loading: true, error: null });

      const res = await fetch(`${API_BASE}/api/cutting-batches/${id}`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

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

  // create latest auto cutting batch
  createCuttingBatch: async () => {
    try {
      set({ creating: true, error: null });

      const res = await fetch(`${API_BASE}/api/cutting-batches`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();

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

  // locally set selected batch
  setSelectedBatch: (batch) => {
    set({
      selectedBatch: batch || null,
    });
  },

  // reset selected batch
  clearSelectedBatch: () => {
    set({
      selectedBatch: null,
    });
  },

  // reset last created batch
  clearLastCreatedBatch: () => {
    set({
      lastCreatedBatch: null,
    });
  },
}));

export default cuttingBatchStore;