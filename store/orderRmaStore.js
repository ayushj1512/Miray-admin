"use client";

import { create } from "zustand";
import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:9000";

const DEFAULT_RMA_FILTERS = {
  page: 1,
  limit: 20,
  search: "",
  type: "all",
  status: "all",
  feeStatus: "all",
  fromDate: "",
  toDate: "",
  sortBy: "createdAt",
  sortDir: "desc",
};

const DEFAULT_RMA_META = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasMore: false,
  sortBy: "createdAt",
  sortDir: "desc",
};

const DEFAULT_GROUPED_FILTERS = {
  page: 1,
  limit: 20,
  startDate: "",
  endDate: "",
  type: "",
  status: "",
  reason: "",
  refundPreference: "",
  search: "",
  sortBy: "totalRmaQty",
  sortOrder: "desc",
};

const DEFAULT_GROUPED_PAGINATION = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const toQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  return searchParams.toString();
};

export const useOrderRmaStore = create((set, get) => ({
  /* ============================================================
     ✅ Enriched RMA List V2
  ============================================================ */
  rmas: [],
  loadingRmas: false,
  rmasError: "",
  rmaFilters: { ...DEFAULT_RMA_FILTERS },
  rmaMeta: { ...DEFAULT_RMA_META },

  setRmaFilters: (updates = {}) =>
    set((state) => ({
      rmaFilters: {
        ...state.rmaFilters,
        ...updates,
        page:
          updates.page !== undefined
            ? updates.page
            : updates.search !== undefined ||
              updates.type !== undefined ||
              updates.status !== undefined ||
              updates.feeStatus !== undefined ||
              updates.fromDate !== undefined ||
              updates.toDate !== undefined
            ? 1
            : state.rmaFilters.page,
      },
    })),

  resetRmaFilters: () =>
    set({
      rmaFilters: { ...DEFAULT_RMA_FILTERS },
    }),

  clearRmas: () =>
    set({
      rmas: [],
      rmasError: "",
      rmaMeta: { ...DEFAULT_RMA_META },
    }),

  getAdminRmaList: async (customFilters = {}) => {
    try {
      set({
        loadingRmas: true,
        rmasError: "",
      });

      const mergedFilters = {
        ...get().rmaFilters,
        ...customFilters,
      };

      const queryString = toQueryString(mergedFilters);

      const url = `${API_BASE}/api/orders/rma/admin/list-v2${
        queryString ? `?${queryString}` : ""
      }`;

      const { data } = await axios.get(url, {
        withCredentials: true,
      });

      const meta = data?.meta || {};

      set({
        rmas: Array.isArray(data?.rmas) ? data.rmas : [],
        rmaMeta: {
          page: Number(meta.page || mergedFilters.page || 1),
          limit: Number(meta.limit || mergedFilters.limit || 20),
          total: Number(meta.total || 0),
          totalPages: Number(meta.totalPages || 1),
          hasMore: Boolean(meta.hasMore),
          sortBy: meta.sortBy || mergedFilters.sortBy || "createdAt",
          sortDir: meta.sortDir || mergedFilters.sortDir || "desc",
        },
        rmaFilters: mergedFilters,
        loadingRmas: false,
      });

      return data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch RMA list";

      set({
        loadingRmas: false,
        rmasError: message,
        rmas: [],
      });

      return {
        success: false,
        message,
      };
    }
  },

  refreshAdminRmaList: async () => {
    return get().getAdminRmaList(get().rmaFilters);
  },

  nextRmaPage: async () => {
    const { rmaMeta, rmaFilters } = get();

    if (!rmaMeta.hasMore) return null;

    return get().getAdminRmaList({
      ...rmaFilters,
      page: Number(rmaFilters.page || 1) + 1,
    });
  },

  prevRmaPage: async () => {
    const { rmaFilters } = get();
    const currentPage = Number(rmaFilters.page || 1);

    if (currentPage <= 1) return null;

    return get().getAdminRmaList({
      ...rmaFilters,
      page: currentPage - 1,
    });
  },

  /* ============================================================
     ✅ Existing Grouped RMA Products
     Kept untouched
  ============================================================ */
  groupedProducts: [],
  loadingGroupedProducts: false,
  groupedProductsError: "",
  groupedProductsFilters: { ...DEFAULT_GROUPED_FILTERS },
  groupedProductsPagination: { ...DEFAULT_GROUPED_PAGINATION },

  setGroupedProductsFilters: (updates = {}) =>
    set((state) => ({
      groupedProductsFilters: {
        ...state.groupedProductsFilters,
        ...updates,
        page:
          updates.page !== undefined
            ? updates.page
            : updates.search !== undefined ||
              updates.type !== undefined ||
              updates.status !== undefined ||
              updates.reason !== undefined ||
              updates.refundPreference !== undefined ||
              updates.startDate !== undefined ||
              updates.endDate !== undefined
            ? 1
            : state.groupedProductsFilters.page,
      },
    })),

  resetGroupedProductsFilters: () =>
    set({
      groupedProductsFilters: { ...DEFAULT_GROUPED_FILTERS },
    }),

  clearGroupedProducts: () =>
    set({
      groupedProducts: [],
      groupedProductsError: "",
      groupedProductsPagination: { ...DEFAULT_GROUPED_PAGINATION },
    }),

  getGroupedRmaProducts: async (customFilters = {}) => {
    try {
      set({
        loadingGroupedProducts: true,
        groupedProductsError: "",
      });

      const mergedFilters = {
        ...get().groupedProductsFilters,
        ...customFilters,
      };

      const queryString = toQueryString(mergedFilters);

      const url = `${API_BASE}/api/orders/rma/grouped-by-product-code${
        queryString ? `?${queryString}` : ""
      }`;

      const { data } = await axios.get(url, {
        withCredentials: true,
      });

      set({
        groupedProducts: Array.isArray(data?.data) ? data.data : [],
        groupedProductsPagination: data?.pagination
          ? {
              page: Number(data.pagination.page || mergedFilters.page || 1),
              limit: Number(data.pagination.limit || mergedFilters.limit || 20),
              total: Number(data.pagination.total || 0),
              totalPages: Number(data.pagination.totalPages || 1),
              hasNextPage: Boolean(data.pagination.hasNextPage),
              hasPrevPage: Boolean(data.pagination.hasPrevPage),
            }
          : {
              ...DEFAULT_GROUPED_PAGINATION,
              page: Number(mergedFilters.page || 1),
              limit: Number(mergedFilters.limit || 20),
            },
        groupedProductsFilters: mergedFilters,
        loadingGroupedProducts: false,
      });

      return data;
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch grouped RMA products";

      set({
        loadingGroupedProducts: false,
        groupedProductsError: message,
        groupedProducts: [],
      });

      return {
        success: false,
        message,
      };
    }
  },

  refreshGroupedRmaProducts: async () => {
    return get().getGroupedRmaProducts(get().groupedProductsFilters);
  },
}));