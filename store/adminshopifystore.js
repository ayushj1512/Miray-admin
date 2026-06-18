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
  error: null,

  shop: null,

  products: [],
  orders: [],
  customers: [],

  selectedShopifyProduct: null,

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

  clearError: () => set({ error: null }),

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

    return fetchShopifyProducts({
      after: productPageInfo.endCursor,
    });
  },

  resetProductPagination: () =>
    get().fetchShopifyProducts({
      after: "",
    }),

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

  fetchNextOrders: () => {
    const { orderPageInfo, fetchShopifyOrders } = get();

    if (!orderPageInfo?.hasNextPage || !orderPageInfo?.endCursor) return;

    return fetchShopifyOrders({
      after: orderPageInfo.endCursor,
    });
  },

  resetOrderPagination: () =>
    get().fetchShopifyOrders({
      after: "",
    }),

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

    return fetchShopifyCustomers({
      after: customerPageInfo.endCursor,
    });
  },

  resetCustomerPagination: () =>
    get().fetchShopifyCustomers({
      after: "",
    }),

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
}));

export default adminShopifyStore;