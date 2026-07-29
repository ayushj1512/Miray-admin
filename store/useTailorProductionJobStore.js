import { create } from "zustand";
import axios from "axios";

/* =========================================================
   API CONFIG
========================================================= */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:6001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

/* =========================================================
   TOKEN INTERCEPTOR

   Change token key according to your admin auth store.
========================================================= */

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("adminToken") ||
        localStorage.getItem("token");

      if (token) {
        config.headers.Authorization =
          `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/* =========================================================
   RESPONSE HELPERS
========================================================= */

const extractErrorMessage = (
  error,
  fallback = "Something went wrong.",
) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

const extractJob = (response) => {
  return (
    response?.data?.job ||
    response?.data?.data?.job ||
    response?.data?.data ||
    response?.data ||
    null
  );
};

const extractJobs = (response) => {
  const data = response?.data;

  const jobs =
    data?.jobs ||
    data?.data?.jobs ||
    data?.data?.items ||
    data?.items ||
    [];

  return Array.isArray(jobs)
    ? jobs
    : [];
};

const extractPagination = (response) => {
  const data = response?.data;

  return (
    data?.pagination ||
    data?.data?.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
    }
  );
};

const extractSummary = (response) => {
  const data = response?.data;

  return (
    data?.summary ||
    data?.data?.summary ||
    data?.data ||
    data ||
    {}
  );
};

/* =========================================================
   INITIAL STATE
========================================================= */

const initialPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

const initialFilters = {
  search: "",
  status: "",
  tailorId: "",
  productId: "",
  priority: "",
  startDate: "",
  endDate: "",
};

/* =========================================================
   STORE
========================================================= */

const useTailorProductionJobStore = create(
  (set, get) => ({
    /* =====================================================
       DATA
    ===================================================== */

    productionJobs: [],
    recentJobs: [],
    currentJob: null,
    dashboardSummary: {},

    pagination: initialPagination,
    filters: initialFilters,

    /* =====================================================
       LOADING STATES
    ===================================================== */

    loading: false,
    listLoading: false,
    summaryLoading: false,
    detailLoading: false,
    creating: false,
    updating: false,
    statusUpdating: false,

    /* =====================================================
       ERROR
    ===================================================== */

    error: null,

    /* =====================================================
       FETCH DASHBOARD SUMMARY
    ===================================================== */

    fetchDashboardSummary: async () => {
      set({
        summaryLoading: true,
        error: null,
      });

      try {
        const response = await api.get(
          "/api/tailor-production-jobs/dashboard",
        );

        const dashboardSummary =
          extractSummary(response);

        set({
          dashboardSummary:
            dashboardSummary || {},
          summaryLoading: false,
        });

        return dashboardSummary;
      } catch (error) {
        const message =
          extractErrorMessage(
            error,
            "Unable to load dashboard summary.",
          );

        set({
          error: message,
          summaryLoading: false,
        });

        throw new Error(message);
      }
    },

    /* =====================================================
       FETCH PRODUCTION JOBS
    ===================================================== */

    fetchProductionJobs: async (
      params = {},
    ) => {
      set({
        loading: true,
        listLoading: true,
        error: null,
      });

      try {
        const currentFilters =
          get().filters;

        const queryParams = {
          ...currentFilters,
          ...params,
        };

        Object.keys(queryParams).forEach(
          (key) => {
            const value =
              queryParams[key];

            if (
              value === "" ||
              value === null ||
              value === undefined
            ) {
              delete queryParams[key];
            }
          },
        );

        const response = await api.get(
          "/api/tailor-production-jobs",
          {
            params: queryParams,
          },
        );

        const jobs =
          extractJobs(response);

        const pagination =
          extractPagination(response);

        set({
          productionJobs: jobs,

          recentJobs:
            params?.limit &&
            Number(params.limit) <= 10
              ? jobs
              : get().recentJobs,

          pagination,
          loading: false,
          listLoading: false,
        });

        return {
          jobs,
          pagination,
        };
      } catch (error) {
        const message =
          extractErrorMessage(
            error,
            "Unable to load production jobs.",
          );

        set({
          error: message,
          loading: false,
          listLoading: false,
        });

        throw new Error(message);
      }
    },

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
        loading: true,
        detailLoading: true,
        error: null,
      });

      try {
        const response = await api.get(
          `/api/tailor-production-jobs/${jobId}`,
        );

        const job =
          extractJob(response);

        set({
          currentJob: job,
          loading: false,
          detailLoading: false,
        });

        return job;
      } catch (error) {
        const message =
          extractErrorMessage(
            error,
            "Unable to load production job.",
          );

        set({
          currentJob: null,
          error: message,
          loading: false,
          detailLoading: false,
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
          "/api/tailor-production-jobs",
          payload,
        );

        const createdJob =
          extractJob(response);

        set((state) => ({
          productionJobs: createdJob
            ? [
                createdJob,
                ...state.productionJobs,
              ]
            : state.productionJobs,

          recentJobs: createdJob
            ? [
                createdJob,
                ...state.recentJobs,
              ].slice(0, 8)
            : state.recentJobs,

          currentJob:
            createdJob ||
            state.currentJob,

          creating: false,
        }));

        return createdJob;
      } catch (error) {
        const message =
          extractErrorMessage(
            error,
            "Unable to create production job.",
          );

        set({
          error: message,
          creating: false,
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
        const response = await api.put(
          `/api/tailor-production-jobs/${jobId}`,
          payload,
        );

        const updatedJob =
          extractJob(response);

        set((state) => ({
          currentJob:
            updatedJob ||
            state.currentJob,

          productionJobs:
            state.productionJobs.map(
              (job) =>
                (job?._id ||
                  job?.id) === jobId
                  ? updatedJob || job
                  : job,
            ),

          recentJobs:
            state.recentJobs.map(
              (job) =>
                (job?._id ||
                  job?.id) === jobId
                  ? updatedJob || job
                  : job,
            ),

          updating: false,
        }));

        return updatedJob;
      } catch (error) {
        const message =
          extractErrorMessage(
            error,
            "Unable to update production job.",
          );

        set({
          error: message,
          updating: false,
        });

        throw new Error(message);
      }
    },

    /* =====================================================
       UPDATE STATUS
    ===================================================== */

    updateProductionJobStatus:
      async (jobId, status) => {
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
          const response =
            await api.patch(
              `/api/tailor-production-jobs/${jobId}/status`,
              {
                status,
              },
            );

          const updatedJob =
            extractJob(response);

          set((state) => {
            const fallbackJob = {
              ...state.currentJob,
              status,
            };

            const nextJob =
              updatedJob ||
              fallbackJob;

            return {
              currentJob: nextJob,

              productionJobs:
                state.productionJobs.map(
                  (job) =>
                    (job?._id ||
                      job?.id) ===
                    jobId
                      ? {
                          ...job,
                          ...nextJob,
                        }
                      : job,
                ),

              recentJobs:
                state.recentJobs.map(
                  (job) =>
                    (job?._id ||
                      job?.id) ===
                    jobId
                      ? {
                          ...job,
                          ...nextJob,
                        }
                      : job,
                ),

              statusUpdating: false,
            };
          });

          return (
            updatedJob || {
              ...get().currentJob,
              status,
            }
          );
        } catch (error) {
          const message =
            extractErrorMessage(
              error,
              "Unable to update production job status.",
            );

          set({
            error: message,
            statusUpdating: false,
          });

          throw new Error(message);
        }
      },

    /* =====================================================
       RECEIVE PRODUCTION

       Ready for future receive page.
    ===================================================== */

    receiveProduction: async (
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
        const response =
          await api.post(
            `/api/tailor-production-jobs/${jobId}/receive`,
            payload,
          );

        const updatedJob =
          extractJob(response);

        set((state) => ({
          currentJob:
            updatedJob ||
            state.currentJob,

          productionJobs:
            state.productionJobs.map(
              (job) =>
                (job?._id ||
                  job?.id) === jobId
                  ? updatedJob || job
                  : job,
            ),

          recentJobs:
            state.recentJobs.map(
              (job) =>
                (job?._id ||
                  job?.id) === jobId
                  ? updatedJob || job
                  : job,
            ),

          updating: false,
        }));

        return updatedJob;
      } catch (error) {
        const message =
          extractErrorMessage(
            error,
            "Unable to receive production quantity.",
          );

        set({
          error: message,
          updating: false,
        });

        throw new Error(message);
      }
    },

    /* =====================================================
       FILTERS
    ===================================================== */

    setFilters: (filters = {}) => {
      set((state) => ({
        filters: {
          ...state.filters,
          ...filters,
        },
      }));
    },

    setFilter: (name, value) => {
      set((state) => ({
        filters: {
          ...state.filters,
          [name]: value,
        },
      }));
    },

    resetFilters: () => {
      set({
        filters: initialFilters,
      });
    },

    /* =====================================================
       LOCAL JOB UPDATE
    ===================================================== */

    setCurrentJob: (job) => {
      set({
        currentJob: job,
      });
    },

    /* =====================================================
       CLEAR HELPERS
    ===================================================== */

    clearProductionJob: () => {
      set({
        currentJob: null,
        detailLoading: false,
      });
    },

    clearError: () => {
      set({
        error: null,
      });
    },

    resetStore: () => {
      set({
        productionJobs: [],
        recentJobs: [],
        currentJob: null,
        dashboardSummary: {},

        pagination:
          initialPagination,

        filters:
          initialFilters,

        loading: false,
        listLoading: false,
        summaryLoading: false,
        detailLoading: false,
        creating: false,
        updating: false,
        statusUpdating: false,

        error: null,
      });
    },
  }),
);

export default useTailorProductionJobStore;