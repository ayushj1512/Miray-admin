import { create } from "zustand";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  return query.toString();
};

const getRequest = async (endpoint, params = {}) => {
  const query = buildQuery(params);
  const url = `${API_URL}/api/shopify/${endpoint}${query ? `?${query}` : ""}`;
  const { data } = await axios.get(url);
  return data;
};

const postRequest = async (endpoint, body = {}) => {
  const url = `${API_URL}/api/shopify/${endpoint}`;
  const { data } = await axios.post(url, body);
  return data;
};

const getProductionSummary = (rows = []) =>
  rows.reduce(
    (acc, item) => {
      acc.totalRequired += Number(item.totalRequired || 0);
      acc.totalAvailable += Number(item.totalAvailable || 0);
      acc.totalToProduce += Number(item.totalToProduce || item.totalUnits || 0);
      acc.totalProducts += 1;
      return acc;
    },
    {
      totalProducts: 0,
      totalRequired: 0,
      totalAvailable: 0,
      totalToProduce: 0,
    }
  );

const adminShopifyStore = create((set, get) => ({
  loading: false,
  syncingOrders: false,
  error: null,
  syncError: null,
  lastSyncResult: null,
  syncingOrders: false,
  importingLatestOrders: false,

  error: null,
  syncError: null,
  lastSyncResult: null,

  shop: null,

  bulkFulfillPreviewLoading: false,
bulkFulfillMarking: false,
bulkFulfillError: null,
bulkFulfillPreviewRows: [],
bulkFulfillResult: null,

  products: [],
  orders: [],
  customers: [],
  localShopifyOrders: [],
  localShopifyOrdersMeta: null,

  selectedShopifyProduct: null,

  // initial state me add karo
  orderAnalytics: null,
  orderAnalyticsLoading: false,
  orderAnalyticsError: null,

  productMappings: [],
  productionDemand: [],
  productionRequirements: [],
  productionQueue: [],


  productionSummary: {
    totalProducts: 0,
    totalRequired: 0,
    totalAvailable: 0,
    totalToProduce: 0,
  },

  productCount: 0,
  orderCount: 0,
  customerCount: 0,
  inventoryCount: 0,
  shopifyStats: {
    totalRevenue: 0,
    aov: 0,
    paidOrders: 0,
    codOrders: 0,
    todayOrders: 0,
    thisMonthRevenue: 0,

    // new
    todayRevenue: 0,
    todayItems: 0,
    todayAov: 0,
    pendingOrders: 0,
    fulfilledOrders: 0,
    unfulfilledOrders: 0,
    cancelledOrders: 0,
  },

  productPageInfo: null,
  orderPageInfo: null,
  customerPageInfo: null,

  productFilters: {
    limit: 20,
    search: "",
    status: "",
    vendor: "",
    productType: "",
    after: "",
  },

  orderFilters: {
    limit: 20,
    search: "",
    financialStatus: "",
    fulfillmentStatus: "",
    createdAfter: "",
    createdBefore: "",
    after: "",
  },

  customerFilters: {
    limit: 20,
    search: "",
    createdAfter: "",
    createdBefore: "",
    after: "",
  },

  clearError: () => set({ error: null, syncError: null }),

  clearSyncResult: () =>
    set({
      syncError: null,
      lastSyncResult: null,
    }),

  clearSelectedShopifyProduct: () =>
    set({
      selectedShopifyProduct: null,
    }),

  setProductFilters: (filters) =>
    set((state) => ({
      productFilters: { ...state.productFilters, ...filters },
    })),

  setOrderFilters: (filters) =>
    set((state) => ({
      orderFilters: { ...state.orderFilters, ...filters },
    })),

  setCustomerFilters: (filters) =>
    set((state) => ({
      customerFilters: { ...state.customerFilters, ...filters },
    })),

  fetchShopifyShop: async () => {
    try {
      set({ loading: true, error: null });

      const data = await getRequest("test");

      set({
        shop: data.data || data.shop || null,
        loading: false,
      });

      return data;
    } catch (error) {
      set({
        loading: false,
        error: getErrorMessage(error, "Failed to fetch Shopify shop"),
      });
    }
  },

  fetchShopifyDashboard: async (limit = 10) => {
    try {
      set({ loading: true, error: null });

      const data = await getRequest("dashboard", { limit });
      const dashboard = data.data || {};

      set({
        shop: dashboard.shop || null,

        products: dashboard.recent?.products || [],
        orders: dashboard.recent?.orders || [],
        customers: dashboard.recent?.customers || [],

        productCount: dashboard.counts?.products || 0,
        orderCount: dashboard.counts?.orders || 0,
        customerCount: dashboard.counts?.customers || 0,
        inventoryCount: dashboard.counts?.inventory || 0,

        shopifyStats: {
          totalRevenue: dashboard.stats?.totalRevenue || 0,
          aov: dashboard.stats?.aov || 0,
          paidOrders: dashboard.stats?.paidOrders || 0,
          codOrders: dashboard.stats?.codOrders || 0,
          todayOrders: dashboard.stats?.todayOrders || 0,
          thisMonthRevenue: dashboard.stats?.thisMonthRevenue || 0,

          todayRevenue: dashboard.stats?.todayRevenue || 0,
          todayItems: dashboard.stats?.todayItems || 0,
          todayAov: dashboard.stats?.todayAov || 0,
          pendingOrders: dashboard.stats?.pendingOrders || 0,
          fulfilledOrders: dashboard.stats?.fulfilledOrders || 0,
          unfulfilledOrders: dashboard.stats?.unfulfilledOrders || 0,
          cancelledOrders: dashboard.stats?.cancelledOrders || 0,
        },

        loading: false,
      });

      return data;
    } catch (error) {
      set({
        loading: false,
        error: getErrorMessage(error, "Failed to fetch Shopify dashboard"),
      });
    }
  },

  fetchShopifyProducts: async (params = {}) => {
    try {
      set({ loading: true, error: null });

      const filters = { ...get().productFilters, ...params };
      const data = await getRequest("products", filters);

      set({
        products: data.data || [],
        productCount: data.count || 0,
        productPageInfo: data.pageInfo || null,
        productFilters: filters,
        loading: false,
      });

      return data;
    } catch (error) {
      set({
        loading: false,
        error: getErrorMessage(error, "Failed to fetch Shopify products"),
      });
    }
  },

  fetchNextProducts: () => {
    const { productPageInfo, fetchShopifyProducts } = get();
    if (!productPageInfo?.hasNextPage || !productPageInfo?.endCursor) return;
    return fetchShopifyProducts({ after: productPageInfo.endCursor });
  },

  resetProductPagination: () => get().fetchShopifyProducts({ after: "" }),

  fetchShopifyOrders: async (params = {}) => {
    try {
      set({ loading: true, error: null });

      const filters = { ...get().orderFilters, ...params };
      const data = await getRequest("orders", filters);

      set({
        orders: data.data || [],
        orderCount: data.count || 0,
        orderPageInfo: data.pageInfo || null,
        orderFilters: filters,
        loading: false,
      });

      return data;
    } catch (error) {
      set({
        loading: false,
        error: getErrorMessage(error, "Failed to fetch Shopify orders"),
      });
    }
  },

  // ✅ LOCAL IMPORTED SHOPIFY ORDERS (MongoDB)
  fetchLocalShopifyOrders: async (params = {}) => {
    try {
      set({ loading: true, error: null });

      const query = buildQuery({
        source: "shopify",
        ...params,
      });

      const url = `${API_URL}/api/orders/customer-support${query ? `?${query}` : ""}`;

      const { data } = await axios.get(url);

      set({
        localShopifyOrders: data?.orders || [],
        localShopifyOrdersMeta: data?.meta || null,
        loading: false,
      });

      return data;
    } catch (error) {
      set({
        loading: false,
        error: getErrorMessage(
          error,
          "Failed to fetch local Shopify orders"
        ),
      });
    }
  },

  fetchNextLocalShopifyOrders: async (params = {}) => {
    try {
      const meta = get().localShopifyOrdersMeta || {};

      const nextPage = Number(meta.page || 1) + 1;

      const query = buildQuery({
        source: "shopify",
        page: nextPage,
        limit: meta.limit || 50,
        ...params,
      });

      const url = `${API_URL}/api/orders/customer-support${query ? `?${query}` : ""}`;

      const { data } = await axios.get(url);

      set((state) => ({
        localShopifyOrders: [
          ...(state.localShopifyOrders || []),
          ...(data?.orders || []),
        ],
        localShopifyOrdersMeta: data?.meta || meta,
      }));

      return data;
    } catch (error) {
      set({
        error: getErrorMessage(
          error,
          "Failed to fetch more Shopify orders"
        ),
      });
    }
  },

  fetchNextOrders: () => {
    const { orderPageInfo, fetchShopifyOrders } = get();
    if (!orderPageInfo?.hasNextPage || !orderPageInfo?.endCursor) return;
    return fetchShopifyOrders({ after: orderPageInfo.endCursor });
  },

  resetOrderPagination: () => get().fetchShopifyOrders({ after: "" }),

  syncShopifyOrdersToLocal: async (params = {}) => {
    try {
      set({
        syncingOrders: true,
        syncError: null,
        lastSyncResult: null,
      });

      const filters = {
        ...get().orderFilters,
        ...params,
      };

      const data = await postRequest("orders/sync", {
        limit: Number(filters.limit || 100),
        after: filters.after || "",
        search: filters.search || "",
        financialStatus: filters.financialStatus || "",
        fulfillmentStatus: filters.fulfillmentStatus || "",
        createdAfter: filters.createdAfter || "",
        createdBefore: filters.createdBefore || "",
      });

      set({
        syncingOrders: false,
        lastSyncResult: data.summary || data.data || data,
      });

      return data;
    } catch (error) {
      const message = getErrorMessage(error, "Failed to import Shopify orders");

      set({
        syncingOrders: false,
        syncError: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  importLatestShopifyOrders: async () => {
    try {
      set({
        importingLatestOrders: true,
        syncError: null,
        lastSyncResult: null,
      });

      const data = await postRequest("orders/import-latest");

      set({
        importingLatestOrders: false,
        lastSyncResult: data.summary || {},
      });

      return data;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Failed to import latest Shopify orders"
      );

      set({
        importingLatestOrders: false,
        syncError: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  bulkImportCurrentShopifyPage: async (params = {}) => {
    const { orderFilters, syncShopifyOrdersToLocal } = get();

    return syncShopifyOrdersToLocal({
      ...orderFilters,
      ...params,
      limit: Number(params.limit || orderFilters.limit || 100),
      after: params.after ?? orderFilters.after ?? "",
    });
  },

  fetchShopifyCustomers: async (params = {}) => {
    try {
      set({ loading: true, error: null });

      const filters = { ...get().customerFilters, ...params };
      const data = await getRequest("customers", filters);

      set({
        customers: data.data || [],
        customerCount: data.count || 0,
        customerPageInfo: data.pageInfo || null,
        customerFilters: filters,
        loading: false,
      });

      return data;
    } catch (error) {
      set({
        loading: false,
        error: getErrorMessage(error, "Failed to fetch Shopify customers"),
      });
    }
  },

  fetchNextCustomers: () => {
    const { customerPageInfo, fetchShopifyCustomers } = get();
    if (!customerPageInfo?.hasNextPage || !customerPageInfo?.endCursor) return;
    return fetchShopifyCustomers({ after: customerPageInfo.endCursor });
  },

  resetCustomerPagination: () => get().fetchShopifyCustomers({ after: "" }),

  fetchProductMappings: async () => {
    try {
      set({ loading: true, error: null });

      const data = await getRequest("product-mappings");

      set({
        productMappings: data.data || [],
        loading: false,
      });

      return data;
    } catch (error) {
      set({
        loading: false,
        error: getErrorMessage(error, "Failed to fetch product mappings"),
      });
    }
  },

  fetchProductByCode: async (code) => {
    try {
      set({ loading: true, error: null });

      const data = await getRequest(`product-code/${code}`);

      set({
        selectedShopifyProduct: data.data || null,
        loading: false,
      });

      return data;
    } catch (error) {
      set({
        selectedShopifyProduct: null,
        loading: false,
        error: getErrorMessage(error, "Failed to fetch product by code"),
      });
    }
  },

  fetchProductBySku: async (sku) => {
    try {
      set({ loading: true, error: null });

      const data = await getRequest(`product-sku/${sku}`);

      set({
        selectedShopifyProduct: data.data || null,
        loading: false,
      });

      return data;
    } catch (error) {
      set({
        selectedShopifyProduct: null,
        loading: false,
        error: getErrorMessage(error, "Failed to fetch product by SKU"),
      });
    }
  },

  fetchProductionDemand: async () => {
    try {
      set({ loading: true, error: null });

      const data = await getRequest("production-demand");
      const rows = data.data || [];

      set({
        productionDemand: rows,
        productionSummary: getProductionSummary(rows),
        loading: false,
      });

      return data;
    } catch (error) {
      set({
        loading: false,
        error: getErrorMessage(error, "Failed to fetch production demand"),
      });
    }
  },

  fetchProductionRequirements: async () => {
    try {
      set({ loading: true, error: null });

      const data = await getRequest("production-requirements");
      const rows = data.data || [];

      set({
        productionRequirements: rows,
        productionSummary: getProductionSummary(rows),
        loading: false,
      });

      return data;
    } catch (error) {
      set({
        loading: false,
        error: getErrorMessage(error, "Failed to fetch production requirements"),
      });
    }
  },

  fetchProductionQueue: async () => {
    try {
      set({ loading: true, error: null });

      const data = await getRequest("production-queue");
      const rows = data.data || [];

      set({
        productionQueue: rows,
        productionSummary: getProductionSummary(rows),
        loading: false,
      });

      return data;
    } catch (error) {
      set({
        loading: false,
        error: getErrorMessage(error, "Failed to fetch production queue"),
      });
    }
  },

  fetchFulfillmentOrders: async (orderNumber) => {
    try {
      set({
        fulfillmentLoading: true,
        fulfillmentError: null,
      });

      const data = await getRequest(
        `orders/${encodeURIComponent(orderNumber)}/fulfillment-orders`
      );

      set({
        fulfillmentOrders: data?.data?.fulfillmentOrders || [],
        fulfillmentLoading: false,
      });

      return data;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Failed to fetch fulfillment orders"
      );

      set({
        fulfillmentLoading: false,
        fulfillmentError: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  manualFulfillOrder: async ({
    orderNumber,
    trackingNumber,
    courierName,
    trackingUrl = "",
    notifyCustomer = true,
  }) => {
    try {
      set({
        fulfillmentLoading: true,
        fulfillmentError: null,
      });

      const data = await postRequest(
        `orders/${encodeURIComponent(orderNumber)}/manual-fulfill`,
        {
          trackingNumber,
          courierName,
          trackingUrl,
          notifyCustomer,
        }
      );

      set({
        fulfillmentLoading: false,
      });

      return data;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Failed to fulfill Shopify order"
      );

      set({
        fulfillmentLoading: false,
        fulfillmentError: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  clearFulfillmentState: () =>
    set({
      fulfillmentOrders: [],
      fulfillmentError: null,
    }),


  expireShopifyToken: async () => {
    try {
      set({ loading: true, error: null });

      const data = await postRequest("expire-token");

      set({ loading: false });

      return data;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Failed to expire Shopify token"
      );

      set({
        loading: false,
        error: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  // actions ke andar add karo
  fetchShopifyOrderAnalytics: async (params = {}) => {
    try {
      set({
        orderAnalyticsLoading: true,
        orderAnalyticsError: null,
      });

      const data = await getRequest("order-analytics", {
        days: 30,
        ...params,
      });

      const analytics = data.data || null;

      set({
        orderAnalytics: analytics,

        shopifyStats: {
          ...get().shopifyStats,

          totalRevenue: analytics?.summary?.revenue || 0,
          aov: analytics?.summary?.aov || 0,

          todayOrders: analytics?.summary?.today?.orders || 0,
          todayRevenue: analytics?.summary?.today?.revenue || 0,
          todayItems: analytics?.summary?.today?.items || 0,
          todayAov: analytics?.summary?.today?.aov || 0,

          paidOrders: analytics?.summary?.paidOrders || 0,
          pendingOrders: analytics?.summary?.pendingOrders || 0,
          fulfilledOrders: analytics?.summary?.fulfilledOrders || 0,
          unfulfilledOrders: analytics?.summary?.unfulfilledOrders || 0,
          cancelledOrders: analytics?.summary?.cancelledOrders || 0,
        },

        orderAnalyticsLoading: false,
      });

      return data;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Failed to fetch Shopify order analytics"
      );

      set({
        orderAnalyticsLoading: false,
        orderAnalyticsError: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  clearBulkFulfillmentState: () =>
  set({
    bulkFulfillPreviewLoading: false,
    bulkFulfillMarking: false,
    bulkFulfillError: null,
    bulkFulfillPreviewRows: [],
    bulkFulfillResult: null,
  }),

bulkFulfillPreview: async (rows = []) => {
  try {
    set({
      bulkFulfillPreviewLoading: true,
      bulkFulfillError: null,
      bulkFulfillPreviewRows: [],
      bulkFulfillResult: null,
    });

    const data = await postRequest("orders/bulk-fulfill-preview", {
      rows,
    });

    set({
      bulkFulfillPreviewLoading: false,
      bulkFulfillPreviewRows: data.results || data.data || [],
    });

    return data;
  } catch (error) {
    const message = getErrorMessage(
      error,
      "Failed to preview bulk fulfillment"
    );

    set({
      bulkFulfillPreviewLoading: false,
      bulkFulfillError: message,
    });

    return {
      success: false,
      message,
    };
  }
},

bulkMarkFulfilled: async (rows = []) => {
  try {
    set({
      bulkFulfillMarking: true,
      bulkFulfillError: null,
      bulkFulfillResult: null,
    });

    const data = await postRequest("orders/bulk-mark-fulfilled", {
      rows,
    });

    set({
      bulkFulfillMarking: false,
      bulkFulfillResult: data,
    });

    return data;
  } catch (error) {
    const message = getErrorMessage(
      error,
      "Failed to mark orders fulfilled"
    );

    set({
      bulkFulfillMarking: false,
      bulkFulfillError: message,
    });

    return {
      success: false,
      message,
    };
  }
},
}));

export default adminShopifyStore;
