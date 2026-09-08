import { create } from "zustand";
import axios from "axios";

/* =========================================================
   API CONFIGURATION
========================================================= */

const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

const API_BASE_URL = RAW_API_URL.replace(/\/+$/, "");

const INFLUENCER_ORDER_ENDPOINT =
  API_BASE_URL.endsWith("/api")
    ? `${API_BASE_URL}/influencer-orders`
    : `${API_BASE_URL}/api/influencer-orders`;

const api = axios.create({
  withCredentials: true,
});

/* =========================================================
   DEFAULT STATE
========================================================= */

export const DEFAULT_INFLUENCER_ORDER_FILTERS = {
  search: "",
  influencerName: "",
  instagramUsername: "",
  phone: "",
  createdBy: "",
  dispatchedBy: "",
  productCode: "",
  productId: "",
  size: "",
  city: "",
  state: "",
  pincode: "",
  isDispatched: "",
  createdFrom: "",
  createdTo: "",
  dispatchedFrom: "",
  dispatchedTo: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const DEFAULT_SUMMARY = {
  totalOrders: 0,
  totalQuantity: 0,
  dispatchedOrders: 0,
  pendingOrders: 0,
};

const DEFAULT_FILTER_OPTIONS = {
  createdBy: [],
  dispatchedBy: [],
  cities: [],
  states: [],
  productCodes: [],
  dispatchStatuses: [
    {
      label: "Pending",
      value: false,
    },
    {
      label: "Dispatched",
      value: true,
    },
  ],
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
        value !== undefined
    )
  );

const getErrorMessage = (
  error,
  fallback = "Something went wrong"
) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const getExcelFilename = (
  contentDisposition = ""
) => {
  const utfMatch = contentDisposition.match(
    /filename\*=UTF-8''([^;]+)/i
  );

  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const normalMatch = contentDisposition.match(
    /filename="?([^";]+)"?/i
  );

  return (
    normalMatch?.[1] ||
    "miray-influencer-orders.xlsx"
  );
};

const downloadBlob = (
  blob,
  filename
) => {
  const blobUrl =
    window.URL.createObjectURL(blob);

  const anchor =
    document.createElement("a");

  anchor.href = blobUrl;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.URL.revokeObjectURL(blobUrl);
};

/* Prevent an older request from replacing newer results */
let latestListRequestId = 0;

/* =========================================================
   STORE
========================================================= */

export const useInfluencerOrderStore = create(
  (set, get) => ({
    /* Data */
    orders: [],
    selectedOrder: null,

    summary: {
      ...DEFAULT_SUMMARY,
    },

    pagination: {
      ...DEFAULT_PAGINATION,
    },

    filters: {
      ...DEFAULT_INFLUENCER_ORDER_FILTERS,
    },

    filterOptions: {
      ...DEFAULT_FILTER_OPTIONS,
    },

    /* Loading states */
    loading: false,
    selectedOrderLoading: false,
    filterOptionsLoading: false,
    creating: false,
    updating: false,
    dispatchingId: null,
    exporting: false,

    /* Response state */
    error: null,
    successMessage: "",

    /* =====================================================
       BASIC STATE ACTIONS
    ===================================================== */

    clearError: () => {
      set({
        error: null,
      });
    },

    clearSuccessMessage: () => {
      set({
        successMessage: "",
      });
    },

    clearMessages: () => {
      set({
        error: null,
        successMessage: "",
      });
    },

    clearSelectedOrder: () => {
      set({
        selectedOrder: null,
        selectedOrderLoading: false,
      });
    },

    setSelectedOrder: (order) => {
      set({
        selectedOrder: order || null,
      });
    },

    /* =====================================================
       FILTER ACTIONS
    ===================================================== */

    setFilter: (name, value) => {
      if (!name) return;

      set((state) => ({
        filters: {
          ...state.filters,
          [name]: value,
        },

        pagination: {
          ...state.pagination,
          page: 1,
        },
      }));
    },

    setFilters: (values = {}) => {
      set((state) => ({
        filters: {
          ...state.filters,
          ...values,
        },

        pagination: {
          ...state.pagination,
          page: 1,
        },
      }));
    },

    replaceFilters: (values = {}) => {
      set((state) => ({
        filters: {
          ...DEFAULT_INFLUENCER_ORDER_FILTERS,
          ...values,
        },

        pagination: {
          ...state.pagination,
          page: 1,
        },
      }));
    },

    resetFilters: () => {
      set((state) => ({
        filters: {
          ...DEFAULT_INFLUENCER_ORDER_FILTERS,
        },

        pagination: {
          ...state.pagination,
          page: 1,
        },
      }));
    },

    setSorting: (
      sortBy = "createdAt",
      sortOrder = "desc"
    ) => {
      set((state) => ({
        filters: {
          ...state.filters,
          sortBy,
          sortOrder,
        },

        pagination: {
          ...state.pagination,
          page: 1,
        },
      }));
    },

    toggleSort: (sortBy) => {
      const currentFilters = get().filters;

      const nextSortOrder =
        currentFilters.sortBy === sortBy &&
        currentFilters.sortOrder === "asc"
          ? "desc"
          : "asc";

      set((state) => ({
        filters: {
          ...state.filters,
          sortBy,
          sortOrder: nextSortOrder,
        },

        pagination: {
          ...state.pagination,
          page: 1,
        },
      }));
    },

    /* =====================================================
       PAGINATION ACTIONS
    ===================================================== */

    setPage: (page) => {
      const safePage = Math.max(
        1,
        Number(page) || 1
      );

      set((state) => ({
        pagination: {
          ...state.pagination,
          page: safePage,
        },
      }));
    },

    setLimit: (limit) => {
      const safeLimit = Math.min(
        200,
        Math.max(1, Number(limit) || 20)
      );

      set((state) => ({
        pagination: {
          ...state.pagination,
          page: 1,
          limit: safeLimit,
        },
      }));
    },

    nextPage: () => {
      const { pagination } = get();

      if (!pagination.hasNextPage) return;

      get().setPage(pagination.page + 1);
    },

    previousPage: () => {
      const { pagination } = get();

      if (!pagination.hasPreviousPage) return;

      get().setPage(pagination.page - 1);
    },

    /* =====================================================
       GET ALL ORDERS
    ===================================================== */

    fetchOrders: async (
      additionalParams = {},
      options = {}
    ) => {
      const requestId =
        ++latestListRequestId;

      const { filters, pagination } = get();

      const params = cleanParams({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        ...additionalParams,
      });

      if (!options.silent) {
        set({
          loading: true,
          error: null,
        });
      }

      try {
        const response = await api.get(
          INFLUENCER_ORDER_ENDPOINT,
          {
            params,
          }
        );

        /*
         * Ignore an old response when a newer filter request
         * has already been sent.
         */
        if (
          requestId !== latestListRequestId
        ) {
          return response.data;
        }

        const data = response.data || {};

        set({
          orders: Array.isArray(data.orders)
            ? data.orders
            : [],

          summary: {
            ...DEFAULT_SUMMARY,
            ...(data.summary || {}),
          },

          pagination: {
            ...DEFAULT_PAGINATION,
            ...(data.pagination || {}),
          },

          loading: false,
          error: null,
        });

        return data;
      } catch (error) {
        if (
          requestId !== latestListRequestId
        ) {
          return null;
        }

        const message = getErrorMessage(
          error,
          "Unable to fetch influencer orders"
        );

        set({
          loading: false,
          error: message,
        });

        throw error;
      }
    },

    refreshOrders: async () => {
      return get().fetchOrders(
        {},
        {
          silent: true,
        }
      );
    },

    /* =====================================================
       GET SINGLE ORDER
    ===================================================== */

    fetchOrderById: async (id) => {
      if (!id) {
        const error = new Error(
          "Influencer order id is required"
        );

        set({
          error: error.message,
        });

        throw error;
      }

      set({
        selectedOrderLoading: true,
        error: null,
      });

      try {
        const response = await api.get(
          `${INFLUENCER_ORDER_ENDPOINT}/${id}`
        );

        const order =
          response.data?.order || null;

        set({
          selectedOrder: order,
          selectedOrderLoading: false,
          error: null,
        });

        return order;
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to fetch influencer order"
        );

        set({
          selectedOrder: null,
          selectedOrderLoading: false,
          error: message,
        });

        throw error;
      }
    },

    /* =====================================================
       GET FILTER OPTIONS
    ===================================================== */

    fetchFilterOptions: async (
      additionalParams = {}
    ) => {
      set({
        filterOptionsLoading: true,
        error: null,
      });

      try {
        const response = await api.get(
          `${INFLUENCER_ORDER_ENDPOINT}/filter-options`,
          {
            params: cleanParams(
              additionalParams
            ),
          }
        );

        const options =
          response.data?.options || {};

        set({
          filterOptions: {
            ...DEFAULT_FILTER_OPTIONS,

            createdBy: Array.isArray(
              options.createdBy
            )
              ? options.createdBy
              : [],

            dispatchedBy: Array.isArray(
              options.dispatchedBy
            )
              ? options.dispatchedBy
              : [],

            cities: Array.isArray(
              options.cities
            )
              ? options.cities
              : [],

            states: Array.isArray(
              options.states
            )
              ? options.states
              : [],

            productCodes: Array.isArray(
              options.productCodes
            )
              ? options.productCodes
              : [],

            dispatchStatuses:
              Array.isArray(
                options.dispatchStatuses
              ) &&
              options.dispatchStatuses.length
                ? options.dispatchStatuses
                : DEFAULT_FILTER_OPTIONS.dispatchStatuses,
          },

          filterOptionsLoading: false,
        });

        return options;
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to fetch filter options"
        );

        set({
          filterOptionsLoading: false,
          error: message,
        });

        throw error;
      }
    },

    /* =====================================================
       CREATE ORDER
    ===================================================== */

    createOrder: async (payload = {}) => {
      set({
        creating: true,
        error: null,
        successMessage: "",
      });

      try {
        const response = await api.post(
          INFLUENCER_ORDER_ENDPOINT,
          payload
        );

        const createdOrder =
          response.data?.order || null;

        set((state) => ({
          creating: false,

          selectedOrder: createdOrder,

          orders:
            createdOrder &&
            state.pagination.page === 1
              ? [
                  createdOrder,
                  ...state.orders.filter(
                    (order) =>
                      order._id !==
                      createdOrder._id
                  ),
                ].slice(
                  0,
                  state.pagination.limit
                )
              : state.orders,

          successMessage:
            response.data?.message ||
            "Influencer order created successfully",
        }));

        /*
         * Re-fetch so summary, total and pagination
         * remain accurate.
         */
        await get().fetchOrders(
          {},
          {
            silent: true,
          }
        );

        return response.data;
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to create influencer order"
        );

        set({
          creating: false,
          error: message,
        });

        throw error;
      }
    },

    /* =====================================================
       UPDATE ORDER
    ===================================================== */

    updateOrder: async (
      id,
      payload = {}
    ) => {
      if (!id) {
        const error = new Error(
          "Influencer order id is required"
        );

        set({
          error: error.message,
        });

        throw error;
      }

      set({
        updating: true,
        error: null,
        successMessage: "",
      });

      try {
        const response = await api.patch(
          `${INFLUENCER_ORDER_ENDPOINT}/${id}`,
          payload
        );

        const updatedOrder =
          response.data?.order || null;

        set((state) => ({
          updating: false,

          selectedOrder:
            state.selectedOrder?._id === id
              ? updatedOrder
              : state.selectedOrder,

          orders: state.orders.map(
            (order) =>
              order._id === id
                ? updatedOrder
                : order
          ),

          successMessage:
            response.data?.message ||
            "Influencer order updated successfully",
        }));

        return response.data;
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to update influencer order"
        );

        set({
          updating: false,
          error: message,
        });

        throw error;
      }
    },

    /* =====================================================
       MARK ORDER AS DISPATCHED
    ===================================================== */

    markAsDispatched: async (
      id,
      {
        dispatchedBy,
        dispatchNote = "",
      } = {}
    ) => {
      if (!id) {
        const error = new Error(
          "Influencer order id is required"
        );

        set({
          error: error.message,
        });

        throw error;
      }

      if (!String(dispatchedBy || "").trim()) {
        const error = new Error(
          "Dispatched by name is required"
        );

        set({
          error: error.message,
        });

        throw error;
      }

      set({
        dispatchingId: id,
        error: null,
        successMessage: "",
      });

      try {
        const response = await api.patch(
          `${INFLUENCER_ORDER_ENDPOINT}/${id}/dispatch`,
          {
            dispatchedBy:
              String(dispatchedBy).trim(),

            dispatchNote:
              String(dispatchNote || "").trim(),
          }
        );

       

        const updatedOrder =
          response.data?.order || null;


        set((state) => ({
          dispatchingId: null,

          selectedOrder:
            state.selectedOrder?._id === id
              ? updatedOrder
              : state.selectedOrder,

          orders: state.orders.map(
            (order) =>
              order._id === id
                ? updatedOrder
                : order
          ),

          summary: {
            ...state.summary,

            pendingOrders: Math.max(
              0,
              Number(
                state.summary.pendingOrders || 0
              ) - 1
            ),

            dispatchedOrders:
              Number(
                state.summary
                  .dispatchedOrders || 0
              ) + 1,
          },

          successMessage:
            response.data?.message ||
            "Influencer order marked as dispatched",
        }));

        return response.data;
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to dispatch influencer order"
        );

        set({
          dispatchingId: null,
          error: message,
        });

        throw error;
      }
    },

    /* =====================================================
       EXCEL EXPORT
       Applies currently selected filters and sorting.
    ===================================================== */

    exportExcel: async (
      additionalParams = {}
    ) => {
      if (typeof window === "undefined") {
        return false;
      }

      set({
        exporting: true,
        error: null,
        successMessage: "",
      });

      try {
        const { filters } = get();

        const response = await api.get(
          `${INFLUENCER_ORDER_ENDPOINT}/export/excel`,
          {
            params: cleanParams({
              ...filters,
              ...additionalParams,
            }),

            responseType: "blob",
          }
        );

        const filename = getExcelFilename(
          response.headers[
            "content-disposition"
          ]
        );

        downloadBlob(
          response.data,
          filename
        );

        set({
          exporting: false,
          successMessage:
            "Excel report downloaded successfully",
        });

        return true;
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Unable to download Excel report"
        );

        set({
          exporting: false,
          error: message,
        });

        throw error;
      }
    },

    /* =====================================================
       LOCAL ORDER HELPERS
    ===================================================== */

    getOrderFromState: (id) => {
      if (!id) return null;

      const { selectedOrder, orders } =
        get();

      if (selectedOrder?._id === id) {
        return selectedOrder;
      }

      return (
        orders.find(
          (order) => order._id === id
        ) || null
      );
    },

    resetStore: () => {
      latestListRequestId += 1;

      set({
        orders: [],
        selectedOrder: null,

        summary: {
          ...DEFAULT_SUMMARY,
        },

        pagination: {
          ...DEFAULT_PAGINATION,
        },

        filters: {
          ...DEFAULT_INFLUENCER_ORDER_FILTERS,
        },

        filterOptions: {
          ...DEFAULT_FILTER_OPTIONS,
        },

        loading: false,
        selectedOrderLoading: false,
        filterOptionsLoading: false,
        creating: false,
        updating: false,
        dispatchingId: null,
        exporting: false,

        error: null,
        successMessage: "",
      });
    },
  })
);

export default useInfluencerOrderStore;