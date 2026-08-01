import { create } from "zustand";
import axios from "axios";

/* =========================================================
   API
========================================================= */

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:6001"
    }/api`,
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

const BASE_ROUTE = "/tailor-production-jobs";

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
  status: "",
  tailorId: "",
  productId: "",
  productCode: "",
  workType: "",
  overdue: "",
  dateFrom: "",
  dateTo: "",
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

const extractJob = (response) =>
  response?.data?.job || null;

const extractJobs = (response) =>
  Array.isArray(response?.data?.jobs)
    ? response.data.jobs
    : [];

const extractSummary = (response) =>
  response?.data?.summary || {};

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

const replaceJob = (jobs, updatedJob) => {
  if (!updatedJob?._id) return jobs;

  return jobs.map((job) =>
    String(job._id) ===
      String(updatedJob._id)
      ? updatedJob
      : job,
  );
};

/* =========================================================
   STORE
========================================================= */

const useTailorProductionJobStore = create(
  (set, get) => ({
    /* Data */
    productionJobs: [],
    recentJobs: [],
    currentJob: null,
    productionSummary: {},
    productionCoverage: [],
    coverageLoading: false,

    pagination: {
      ...initialPagination,
    },

    filters: {
      ...initialFilters,
    },

    /* Loading */
    listLoading: false,
    detailLoading: false,
    summaryLoading: false,
    creating: false,
    updating: false,
    statusUpdating: false,
    deleting: false,

    error: null,

    /* =====================================================
       FETCH ALL JOBS
    ===================================================== */

    fetchProductionJobs: async (
      params = {},
    ) => {
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

        const jobs =
          extractJobs(response);

        const pagination =
          extractPagination(response);

        set({
          productionJobs: jobs,

          recentJobs:
            Number(query.limit || 0) <= 10
              ? jobs
              : get().recentJobs,

          pagination,
          listLoading: false,
        });

        return {
          jobs,
          pagination,
        };
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to load production jobs.",
        );

        set({
          listLoading: false,
          error: message,
        });

        throw new Error(message);
      }
    },

    /* =====================================================
       FETCH SUMMARY
    ===================================================== */

    fetchProductionSummary: async () => {
      set({
        summaryLoading: true,
        error: null,
      });

      try {
        const response = await api.get(
          `${BASE_ROUTE}/summary`,
        );

        const summary =
          extractSummary(response);

        set({
          productionSummary: summary,
          summaryLoading: false,
        });

        return summary;
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to load production summary.",
        );

        set({
          summaryLoading: false,
          error: message,
        });

        throw new Error(message);
      }
    },

    /* Backward-compatible alias */
    fetchDashboardSummary: async () =>
      get().fetchProductionSummary(),

    /* =====================================================
       FETCH JOB BY ID
    ===================================================== */

    fetchProductionJobById: async (
      jobId,
    ) => {
      if (!jobId) {
        throw new Error(
          "Production job ID is required.",
        );
      }

      set({
        detailLoading: true,
        error: null,
      });

      try {
        const response = await api.get(
          `${BASE_ROUTE}/${jobId}`,
        );

        const job =
          extractJob(response);

        set({
          currentJob: job,
          detailLoading: false,
        });

        return job;
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to load production job.",
        );

        set({
          currentJob: null,
          detailLoading: false,
          error: message,
        });

        throw new Error(message);
      }
    },

    /* =====================================================
       CREATE JOB
    ===================================================== */

    createProductionJob: async (
      payload,
    ) => {
      set({
        creating: true,
        error: null,
      });

      try {
        const response = await api.post(
          BASE_ROUTE,
          payload,
        );

        const job =
          extractJob(response);

        set((state) => ({
          productionJobs: job
            ? [
              job,
              ...state.productionJobs,
            ]
            : state.productionJobs,

          recentJobs: job
            ? [
              job,
              ...state.recentJobs,
            ].slice(0, 10)
            : state.recentJobs,

          currentJob:
            job || state.currentJob,

          creating: false,
        }));

        return job;
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to create production job.",
        );

        set({
          creating: false,
          error: message,
        });

        throw new Error(message);
      }
    },

    /* =====================================================
       UPDATE JOB
    ===================================================== */

    updateProductionJob: async (
      jobId,
      payload,
    ) => {
      if (!jobId) {
        throw new Error(
          "Production job ID is required.",
        );
      }

      set({
        updating: true,
        error: null,
      });

      try {
        const response = await api.patch(
          `${BASE_ROUTE}/${jobId}`,
          payload,
        );

        const job =
          extractJob(response);

        set((state) => ({
          productionJobs: replaceJob(
            state.productionJobs,
            job,
          ),

          recentJobs: replaceJob(
            state.recentJobs,
            job,
          ),

          currentJob:
            job || state.currentJob,

          updating: false,
        }));

        return job;
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to update production job.",
        );

        set({
          updating: false,
          error: message,
        });

        throw new Error(message);
      }
    },

    /* =====================================================
   FETCH PRODUCT-WISE ACTIVE PRODUCTION COVERAGE
===================================================== */

    fetchProductionCoverage: async () => {
      set({
        coverageLoading: true,
        error: null,
      });

      try {
        const response = await api.get(
          `${BASE_ROUTE}/coverage`,
        );

        const coverage = Array.isArray(
          response?.data?.coverage,
        )
          ? response.data.coverage
          : [];

        set({
          productionCoverage: coverage,
          coverageLoading: false,
        });

        return coverage;
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to load production coverage.",
        );

        set({
          productionCoverage: [],
          coverageLoading: false,
          error: message,
        });

        throw new Error(message);
      }
    },

    /* =====================================================
       UPDATE STATUS
    ===================================================== */

    updateProductionJobStatus: async (
      jobId,
      status,
    ) => {
      if (!jobId) {
        throw new Error(
          "Production job ID is required.",
        );
      }

      if (!status) {
        throw new Error(
          "Production job status is required.",
        );
      }

      set({
        statusUpdating: true,
        error: null,
      });

      try {
        const response = await api.patch(
          `${BASE_ROUTE}/${jobId}/status`,
          {
            status,
          },
        );

        const job =
          extractJob(response);

        set((state) => ({
          productionJobs: replaceJob(
            state.productionJobs,
            job,
          ),

          recentJobs: replaceJob(
            state.recentJobs,
            job,
          ),

          currentJob:
            job || state.currentJob,

          statusUpdating: false,
        }));

        return job;
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to update production job status.",
        );

        set({
          statusUpdating: false,
          error: message,
        });

        throw new Error(message);
      }
    },

    /* =====================================================
       DELETE / CANCEL JOB
    ===================================================== */

    deleteProductionJob: async (
      jobId,
      options = {},
    ) => {
      if (!jobId) {
        throw new Error(
          "Production job ID is required.",
        );
      }

      set({
        deleting: true,
        error: null,
      });

      try {
        const response = await api.delete(
          `${BASE_ROUTE}/${jobId}`,
          {
            params: cleanParams({
              hard: options.hard,
            }),

            data: {
              reason:
                options.reason || "",
            },
          },
        );

        const hardDelete =
          options.hard === true ||
          options.hard === "true";

        const returnedJob =
          extractJob(response);

        set((state) => ({
          productionJobs: hardDelete
            ? state.productionJobs.filter(
              (job) =>
                String(job._id) !==
                String(jobId),
            )
            : replaceJob(
              state.productionJobs,
              returnedJob,
            ),

          recentJobs: hardDelete
            ? state.recentJobs.filter(
              (job) =>
                String(job._id) !==
                String(jobId),
            )
            : replaceJob(
              state.recentJobs,
              returnedJob,
            ),

          currentJob:
            hardDelete &&
              String(
                state.currentJob?._id,
              ) === String(jobId)
              ? null
              : returnedJob ||
              state.currentJob,

          deleting: false,
        }));

        return response?.data;
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to delete production job.",
        );

        set({
          deleting: false,
          error: message,
        });

        throw new Error(message);
      }
    },

    /* =====================================================
       FILTERS
    ===================================================== */

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

    /* =====================================================
       LOCAL STATE
    ===================================================== */

    setCurrentJob: (job) =>
      set({
        currentJob: job,
      }),

    clearProductionJob: () =>
      set({
        currentJob: null,
        detailLoading: false,
      }),

    clearError: () =>
      set({
        error: null,
      }),

    resetStore: () =>
      set({
        productionJobs: [],
        recentJobs: [],
        currentJob: null,
        productionSummary: {},

        pagination: {
          ...initialPagination,
        },

        filters: {
          ...initialFilters,
        },

        listLoading: false,
        detailLoading: false,
        summaryLoading: false,
        creating: false,
        updating: false,
        statusUpdating: false,
        deleting: false,

        productionCoverage: [],
coverageLoading: false,

        error: null,
      }),
  }),
);

export default useTailorProductionJobStore;