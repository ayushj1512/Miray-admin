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

const adminShopifyStore = create((set, get) => ({
  loading: false,
  error: null,

  shop: null,

  products: [],
  orders: [],
  customers: [],

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

  setProductFilters: (filters) =>
    set((state) => ({
      productFilters: {
        ...state.productFilters,
        ...filters,
      },
    })),

  setOrderFilters: (filters) =>
    set((state) => ({
      orderFilters: {
        ...state.orderFilters,
        ...filters,
      },
    })),

  setCustomerFilters: (filters) =>
    set((state) => ({
      customerFilters: {
        ...state.customerFilters,
        ...filters,
      },
    })),

  fetchShopifyShop: async () => {
    try {
      set({ loading: true, error: null });

      const { data } = await axios.get(`${API_URL}/api/shopify/test`);

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

      const { data } = await axios.get(
        `${API_URL}/api/shopify/dashboard?limit=${limit}`
      );

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

      const filters = {
        ...get().productFilters,
        ...params,
      };

      const query = buildQuery(filters);

      const { data } = await axios.get(
        `${API_URL}/api/shopify/products?${query}`
      );

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

  fetchNextProducts: async () => {
    const { productPageInfo, fetchShopifyProducts } = get();

    if (!productPageInfo?.hasNextPage || !productPageInfo?.endCursor) return;

    return fetchShopifyProducts({
      after: productPageInfo.endCursor,
    });
  },

  resetProductPagination: async () => {
    return get().fetchShopifyProducts({
      after: "",
    });
  },

  fetchShopifyOrders: async (params = {}) => {
    try {
      set({ loading: true, error: null });

      const filters = {
        ...get().orderFilters,
        ...params,
      };

      const query = buildQuery(filters);

      const { data } = await axios.get(`${API_URL}/api/shopify/orders?${query}`);

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

  fetchNextOrders: async () => {
    const { orderPageInfo, fetchShopifyOrders } = get();

    if (!orderPageInfo?.hasNextPage || !orderPageInfo?.endCursor) return;

    return fetchShopifyOrders({
      after: orderPageInfo.endCursor,
    });
  },

  resetOrderPagination: async () => {
    return get().fetchShopifyOrders({
      after: "",
    });
  },

  fetchShopifyCustomers: async (params = {}) => {
    try {
      set({ loading: true, error: null });

      const filters = {
        ...get().customerFilters,
        ...params,
      };

      const query = buildQuery(filters);

      const { data } = await axios.get(
        `${API_URL}/api/shopify/customers?${query}`
      );

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

  fetchNextCustomers: async () => {
    const { customerPageInfo, fetchShopifyCustomers } = get();

    if (!customerPageInfo?.hasNextPage || !customerPageInfo?.endCursor) return;

    return fetchShopifyCustomers({
      after: customerPageInfo.endCursor,
    });
  },

  resetCustomerPagination: async () => {
    return get().fetchShopifyCustomers({
      after: "",
    });
  },
}));

export default adminShopifyStore;