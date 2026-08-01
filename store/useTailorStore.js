import { create } from "zustand";
import axios from "axios";

/* =========================================================
   API
========================================================= */

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("adminToken") ||
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

const BASE_ROUTE = "/tailors";

/* =========================================================
   DEFAULT STATE
========================================================= */

const initialPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

const initialFilters = {
  search: "",
  isActive: "",
  productCode: "",
  productionJobId: "",
  sort: "newest",
  page: 1,
  limit: 20,
};

/* =========================================================
   HELPERS
========================================================= */

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== "" &&
        value !== null &&
        value !== undefined,
    ),
  );

const getErrorMessage = (
  error,
  fallback = "Something went wrong.",
) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const extractTailor = (response) =>
  response?.data?.tailor || null;

const extractTailors = (response) =>
  Array.isArray(response?.data?.tailors)
    ? response.data.tailors
    : [];

const extractPagination = (response) => {
  const data = response?.data || {};

  return {
    page: Number(data.page) || 1,
    limit: Number(data.limit) || 20,
    total: Number(data.total) || 0,
    totalPages: Number(data.totalPages) || 1,
    hasNextPage: Boolean(data.hasNextPage),
    hasPreviousPage: Boolean(
      data.hasPreviousPage,
    ),
  };
};

const replaceTailor = (
  tailors,
  updatedTailor,
) => {
  if (!updatedTailor?._id) return tailors;

  return tailors.map((tailor) =>
    String(tailor._id) ===
    String(updatedTailor._id)
      ? updatedTailor
      : tailor,
  );
};

/* =========================================================
   STORE
========================================================= */

const useTailorStore = create((set, get) => ({
  /* Data */
  tailors: [],
  activeTailors: [],
  currentTailor: null,
  tailorSummary: {},

  pagination: {
    ...initialPagination,
  },

  filters: {
    ...initialFilters,
  },

  /* Loading */
  listLoading: false,
  activeLoading: false,
  detailLoading: false,
  summaryLoading: false,
  creating: false,
  updating: false,
  deleting: false,

  error: null,

  /* =======================================================
     FETCH ALL
  ======================================================= */

  fetchTailors: async (params = {}) => {
    set({
      listLoading: true,
      error: null,
    });

    try {
      const query = cleanParams({
        ...get().filters,
        ...params,
      });

      const response = await api.get(
        BASE_ROUTE,
        {
          params: query,
        },
      );

      const tailors =
        extractTailors(response);

      const pagination =
        extractPagination(response);

      set({
        tailors,
        pagination,
        listLoading: false,
      });

      return {
        tailors,
        pagination,
      };
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Unable to load tailors.",
      );

      set({
        listLoading: false,
        error: message,
      });

      throw new Error(message);
    }
  },

  /* =======================================================
     FETCH ACTIVE DROPDOWN
  ======================================================= */

  fetchActiveTailors: async () => {
    set({
      activeLoading: true,
      error: null,
    });

    try {
      const response = await api.get(
        `${BASE_ROUTE}/active`,
      );

      const tailors =
        extractTailors(response);

      set({
        activeTailors: tailors,
        activeLoading: false,
      });

      return tailors;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Unable to load active tailors.",
      );

      set({
        activeTailors: [],
        activeLoading: false,
        error: message,
      });

      throw new Error(message);
    }
  },

  /* =======================================================
     FETCH SUMMARY
  ======================================================= */

  fetchTailorSummary: async () => {
    set({
      summaryLoading: true,
      error: null,
    });

    try {
      const response = await api.get(
        `${BASE_ROUTE}/summary`,
      );

      const summary =
        response?.data?.summary || {};

      set({
        tailorSummary: summary,
        summaryLoading: false,
      });

      return summary;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Unable to load tailor summary.",
      );

      set({
        summaryLoading: false,
        error: message,
      });

      throw new Error(message);
    }
  },

  /* =======================================================
     FETCH BY ID
  ======================================================= */

  fetchTailorById: async (tailorId) => {
    if (!tailorId) {
      throw new Error(
        "Tailor ID is required.",
      );
    }

    set({
      detailLoading: true,
      error: null,
    });

    try {
      const response = await api.get(
        `${BASE_ROUTE}/${tailorId}`,
      );

      const tailor =
        extractTailor(response);

      set({
        currentTailor: tailor,
        detailLoading: false,
      });

      return tailor;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Unable to load tailor.",
      );

      set({
        currentTailor: null,
        detailLoading: false,
        error: message,
      });

      throw new Error(message);
    }
  },

  /* =======================================================
     CREATE
  ======================================================= */

  createTailor: async (payload) => {
    set({
      creating: true,
      error: null,
    });

    try {
      const response = await api.post(
        BASE_ROUTE,
        payload,
      );

      const tailor =
        extractTailor(response);

      set((state) => ({
        tailors: tailor
          ? [tailor, ...state.tailors]
          : state.tailors,

        activeTailors:
          tailor?.isActive
            ? [
                tailor,
                ...state.activeTailors,
              ]
            : state.activeTailors,

        currentTailor:
          tailor || state.currentTailor,

        creating: false,
      }));

      return tailor;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Unable to create tailor.",
      );

      set({
        creating: false,
        error: message,
      });

      throw new Error(message);
    }
  },

  /* =======================================================
     UPDATE
  ======================================================= */

  updateTailor: async (
    tailorId,
    payload,
  ) => {
    if (!tailorId) {
      throw new Error(
        "Tailor ID is required.",
      );
    }

    set({
      updating: true,
      error: null,
    });

    try {
      const response = await api.patch(
        `${BASE_ROUTE}/${tailorId}`,
        payload,
      );

      const tailor =
        extractTailor(response);

      set((state) => ({
        tailors: replaceTailor(
          state.tailors,
          tailor,
        ),

        activeTailors:
          tailor?.isActive
            ? replaceTailor(
                state.activeTailors,
                tailor,
              )
            : state.activeTailors.filter(
                (item) =>
                  String(item._id) !==
                  String(tailorId),
              ),

        currentTailor:
          tailor || state.currentTailor,

        updating: false,
      }));

      return tailor;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Unable to update tailor.",
      );

      set({
        updating: false,
        error: message,
      });

      throw new Error(message);
    }
  },

  /* =======================================================
     UPDATE STATUS
  ======================================================= */

  updateTailorStatus: async (
    tailorId,
    isActive,
  ) => {
    if (!tailorId) {
      throw new Error(
        "Tailor ID is required.",
      );
    }

    set({
      updating: true,
      error: null,
    });

    try {
      const response = await api.patch(
        `${BASE_ROUTE}/${tailorId}/status`,
        {
          isActive,
        },
      );

      const tailor =
        extractTailor(response);

      set((state) => ({
        tailors: replaceTailor(
          state.tailors,
          tailor,
        ),

        activeTailors:
          tailor?.isActive
            ? state.activeTailors.some(
                (item) =>
                  String(item._id) ===
                  String(tailor._id),
              )
              ? replaceTailor(
                  state.activeTailors,
                  tailor,
                )
              : [
                  tailor,
                  ...state.activeTailors,
                ]
            : state.activeTailors.filter(
                (item) =>
                  String(item._id) !==
                  String(tailorId),
              ),

        currentTailor:
          String(
            state.currentTailor?._id,
          ) === String(tailorId)
            ? tailor
            : state.currentTailor,

        updating: false,
      }));

      return tailor;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Unable to update tailor status.",
      );

      set({
        updating: false,
        error: message,
      });

      throw new Error(message);
    }
  },

  /* =======================================================
     DELETE / DEACTIVATE
  ======================================================= */

  deleteTailor: async (
    tailorId,
    options = {},
  ) => {
    if (!tailorId) {
      throw new Error(
        "Tailor ID is required.",
      );
    }

    set({
      deleting: true,
      error: null,
    });

    try {
      const response = await api.delete(
        `${BASE_ROUTE}/${tailorId}`,
        {
          params: cleanParams(options),
        },
      );

      const hardDelete =
        options.hard === true ||
        options.hard === "true";

      const returnedTailor =
        extractTailor(response);

      set((state) => ({
        tailors: hardDelete
          ? state.tailors.filter(
              (item) =>
                String(item._id) !==
                String(tailorId),
            )
          : replaceTailor(
              state.tailors,
              returnedTailor,
            ),

        activeTailors:
          state.activeTailors.filter(
            (item) =>
              String(item._id) !==
              String(tailorId),
          ),

        currentTailor:
          hardDelete &&
          String(
            state.currentTailor?._id,
          ) === String(tailorId)
            ? null
            : returnedTailor ||
              state.currentTailor,

        deleting: false,
      }));

      return response?.data;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Unable to delete tailor.",
      );

      set({
        deleting: false,
        error: message,
      });

      throw new Error(message);
    }
  },

  /* =======================================================
     FILTERS
  ======================================================= */

  setFilters: (filters = {}) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),

  setFilter: (name, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [name]: value,
      },
    })),

  resetFilters: () =>
    set({
      filters: {
        ...initialFilters,
      },
    }),

  /* =======================================================
     LOCAL STATE
  ======================================================= */

  setCurrentTailor: (tailor) =>
    set({
      currentTailor: tailor,
    }),

  clearCurrentTailor: () =>
    set({
      currentTailor: null,
      detailLoading: false,
    }),

  clearActiveTailors: () =>
    set({
      activeTailors: [],
    }),

  clearError: () =>
    set({
      error: null,
    }),

  resetStore: () =>
    set({
      tailors: [],
      activeTailors: [],
      currentTailor: null,
      tailorSummary: {},

      pagination: {
        ...initialPagination,
      },

      filters: {
        ...initialFilters,
      },

      listLoading: false,
      activeLoading: false,
      detailLoading: false,
      summaryLoading: false,
      creating: false,
      updating: false,
      deleting: false,

      error: null,
    }),
}));

export default useTailorStore;