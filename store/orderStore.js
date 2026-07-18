"use client";

import { create } from "zustand";

const API = (process.env.NEXT_PUBLIC_API_URL || "").trim();

const stripUndefinedDeep = (obj) => {
  if (Array.isArray(obj)) return obj.map(stripUndefinedDeep);

  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue;
      out[k] = stripUndefinedDeep(v);
    }
    return out;
  }

  return obj;
};

const normalizePriority = (v) => {
  const p = String(v ?? "").trim().toLowerCase();
  return ["normal", "medium", "high"].includes(p) ? p : "";
};

const normalizePaymentMethod = (v) => {
  const pm = String(v ?? "").trim().toLowerCase();
  return ["cod", "razorpay", "wallet", "exchange"].includes(pm) ? pm : "";
};

const buildQueryString = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([k, v]) => {
    if (v == null) return;

    if (Array.isArray(v)) {
      v.forEach((x) => {
        if (x == null || String(x).trim() === "") return;
        params.append(k, String(x).trim());
      });
      return;
    }

    const s = String(v).trim();
    if (!s) return;

    if (k === "priority") {
      const pr = normalizePriority(s);
      if (pr) params.set("priority", pr);
      return;
    }

    if (k === "page" || k === "limit") {
      const n = parseInt(s, 10);
      if (Number.isFinite(n)) params.set(k, String(n));
      return;
    }
    if (k === "paymentMethod") {
      const pm = normalizePaymentMethod(s);
      if (pm) params.set("paymentMethod", pm);
      return;
    }

    params.set(k, s);
  });

  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

const normalizeOrdersPayload = (data) => {
  if (Array.isArray(data)) return { orders: data, meta: null };
  if (data?.orders && Array.isArray(data.orders)) {
    return { orders: data.orders, meta: data.meta || null };
  }
  if (data?.data && Array.isArray(data.data)) {
    return { orders: data.data, meta: data.meta || null };
  }
  return { orders: [], meta: data?.meta || null };
};

/* =========================================================
   COMMON ORDER NORMALIZATION
========================================================= */

const toText = (value) => String(value ?? "").trim();

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalizeOrderSource = (order = {}) => {
  const explicitSource = toText(
    order?.source ||
    order?.orderSource ||
    order?.platform
  ).toLowerCase();

  if (
    explicitSource === "shopify" ||
    order?.shopify?.orderId ||
    order?.shopifyOrderId
  ) {
    return "shopify";
  }

  return "website";
};

const normalizeAddress = (address = {}) => ({
  fullName: toText(
    address?.fullName ||
    address?.name ||
    `${address?.firstName || ""} ${address?.lastName || ""}`
  ),

  phone: toText(address?.phone || address?.mobile),
  email: toText(address?.email),

  line1: toText(
    address?.line1 ||
    address?.address1 ||
    address?.address
  ),

  line2: toText(address?.line2 || address?.address2),
  city: toText(address?.city),
  state: toText(address?.state || address?.province),
  country: toText(address?.country),
  pincode: toText(
    address?.pincode ||
    address?.zip ||
    address?.postalCode
  ),
});

const normalizeOrderItem = (item = {}, index = 0) => {
  const snapshot = item?.productSnapshot || {};
  const variant = item?.variant || {};

  const attributes = Array.isArray(variant?.attributes)
    ? variant.attributes
    : Array.isArray(item?.attributes)
      ? item.attributes
      : [];

  const getAttribute = (...keys) => {
    const allowed = keys.map((key) => key.toLowerCase());

    const match = attributes.find((attribute) =>
      allowed.includes(
        toText(attribute?.key || attribute?.name).toLowerCase()
      )
    );

    return toText(match?.value);
  };

  const quantity = Math.max(
    1,
    toNumber(item?.quantity || item?.qty, 1)
  );

  const price = toNumber(
    item?.price ??
    item?.unitPrice ??
    item?.originalUnitPrice ??
    snapshot?.price,
    0
  );

  return {
    ...item,

    lineId: toText(
      item?.lineId ||
      item?.shopifyLineItemId ||
      item?.lineItemId ||
      item?._id ||
      `line-${index}`
    ),

    productId:
      item?.productId?._id ||
      item?.productId ||
      item?.product?.id ||
      null,

    variantId:
      variant?.variantId ||
      item?.variantId ||
      item?.shopifyVariantId ||
      null,

    title: toText(
      snapshot?.title ||
      item?.title ||
      item?.name ||
      item?.productTitle
    ),

    productCode: toText(
      snapshot?.productCode ||
      item?.productCode ||
      item?.sku
    ),

    sku: toText(
      variant?.sku ||
      snapshot?.sku ||
      item?.sku
    ),

    image: toText(
      snapshot?.thumbnail ||
      snapshot?.images?.[0] ||
      item?.thumbnail ||
      item?.image ||
      item?.imageUrl
    ),

    selectedSize: toText(
      item?.selectedSize ||
      item?.size ||
      getAttribute("size", "sizes")
    ),

    selectedColor: toText(
      item?.selectedColor ||
      item?.color ||
      getAttribute("color", "colour")
    ),

    quantity,
    price,

    subtotal: toNumber(
      item?.subtotal ??
      item?.lineTotal ??
      price * quantity,
      price * quantity
    ),

    fulfillment: {
      allocatedQty: toNumber(
        item?.fulfillment?.allocatedQty,
        0
      ),

      shippedQty: toNumber(
        item?.fulfillment?.shippedQty,
        0
      ),

      toProduceQty: toNumber(
        item?.fulfillment?.toProduceQty,
        quantity
      ),
    },

    raw: item,
  };
};

/* =========================================================
   COMMON ORDER NORMALIZER
   Website + imported Shopify orders
========================================================= */

export const normalizeOrder = (order = {}) => {
  if (!order || typeof order !== "object") return null;

  const source =
    String(
      order?.source ||
      order?.attribution?.source ||
      order?.orderSource ||
      order?.platform ||
      ""
    )
      .trim()
      .toLowerCase() === "shopify" ||
      Boolean(order?.shopify?.orderId)
      ? "shopify"
      : "website";

  const address =
    order?.shippingAddressSnapshot ||
    order?.shippingAddress ||
    order?.shopify?.raw?.shippingAddress ||
    {};

  const items = Array.isArray(order?.items)
    ? order.items
    : Array.isArray(order?.lineItems)
      ? order.lineItems
      : [];

  return {
    ...order,

    _id: order?._id || order?.id || "",
    orderNumber:
      order?.orderNumber ||
      order?.shopify?.orderName ||
      order?.name ||
      "",

    source,
    isShopify: source === "shopify",

    customerName:
      address?.fullName ||
      address?.name ||
      `${address?.firstName || ""} ${address?.lastName || ""}`.trim(),

    customerPhone:
      address?.phone ||
      address?.mobile ||
      "",

    customerEmail:
      address?.email ||
      "",

    items,

    totalItems: items.reduce(
      (sum, item) => sum + Number(item?.quantity || 0),
      0
    ),

    finalPayable: Number(
      order?.finalPayable ??
      order?.totalAmount ??
      order?.shopify?.raw?.currentTotalPriceSet?.shopMoney?.amount ??
      order?.shopify?.raw?.totalPriceSet?.shopMoney?.amount ??
      0
    ),

    fulfillmentStatus: String(
      order?.fulfillmentStatus ||
      order?.shipment?.status ||
      order?.shopify?.fulfillmentStatus ||
      "processing"
    ).toLowerCase(),

    paymentStatus: String(
      order?.paymentStatus ||
      order?.shopify?.financialStatus ||
      "pending"
    ).toLowerCase(),

    awb:
      order?.shipment?.awb ||
      order?.trackingDetails?.awb ||
      "",

    courierName:
      order?.shipment?.courierName ||
      order?.trackingDetails?.courierName ||
      "",

    trackingUrl:
      order?.shipment?.trackingUrl ||
      order?.trackingDetails?.trackingUrl ||
      "",

    labelUrl:
      order?.shipment?.labelUrl ||
      "",
  };
};

export const normalizeOrders = (orders = []) =>
  (Array.isArray(orders) ? orders : [])
    .map(normalizeOrder)
    .filter(Boolean);
export const getOrderAttributionLabel = (order = {}) => {
  const attr = order?.attribution || {};

  return {
    source: attr.source || "direct",
    medium: attr.medium || "direct",
    campaign: attr.campaign || "",
    campaignSlug: attr.campaignSlug || "",
    shortCode: attr.shortCode || "",
    marketingLinkId: attr.marketingLinkId || "",
  };
};

export const useOrderStore = create((set, get) => ({
  orders: [],
  order: null,
  loading: false,
  error: null,
  productOrderCount: null,
  ordersMeta: null,
  customerSupportOrderDetails: {},
  duplicateAlerts: [],
  duplicateLoading: false,
  confirmationDetails: null,
  confirmationDetailsLoading: false,
  orderDashboard: null,
  orderDashboardLoading: false,
  bulkCancellationLoading: false,
  packedOrderLabels: [],
  packedOrderLabelsSummary: null,
  downloadingMergedLabels: false,
  _start: () => set({ loading: true, error: null }),
  _success: () => set({ loading: false }),
  _fail: (err) =>
    set({
      loading: false,
      error: err?.message || "Something went wrong",
    }),

  _normalizeOrder: (data) => {
    const raw =
      data?.order ??
      data?.data?.order ??
      data?.data ??
      data ??
      null;

    return normalizeOrder(raw);
  },

  _syncOrderInList: (updatedOrder) => {
    if (!updatedOrder?._id) return;

    set((s) => ({
      orders: (s.orders || []).map((o) =>
        String(o?._id) === String(updatedOrder._id)
          ? { ...o, ...updatedOrder }
          : o
      ),
    }));
  },

  _syncCustomerSupportDetail: (updatedOrder) => {
    if (!updatedOrder?._id) return;

    set((s) => ({
      customerSupportOrderDetails: {
        ...(s.customerSupportOrderDetails || {}),
        [String(updatedOrder._id)]: {
          ...(s.customerSupportOrderDetails?.[String(updatedOrder._id)] || {}),
          ...updatedOrder,
        },
      },
    }));
  },

  _removeOrderFromList: (orderId) => {
    if (!orderId) return;

    set((s) => ({
      orders: (s.orders || []).filter(
        (o) => String(o?._id) !== String(orderId)
      ),
    }));
  },

  _json: async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Request failed");
    return data;
  },

  _get: async (path, { silent = false } = {}) => {
    if (!silent) get()._start();

    try {
      const res = await fetch(`${API}${path}`, { cache: "no-store" });
      const data = await get()._json(res);
      if (!silent) get()._success();
      return data;
    } catch (e) {
      if (!silent) get()._fail(e);
      throw e;
    }
  },

  _post: async (path, payload) => {
    get()._start();

    try {
      const res = await fetch(`${API}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stripUndefinedDeep(payload || {})),
      });

      const data = await get()._json(res);
      get()._success();
      return data;
    } catch (e) {
      get()._fail(e);
      throw e;
    }
  },

  _patch: async (path, payload) => {
    get()._start();

    try {
      const res = await fetch(`${API}${path}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stripUndefinedDeep(payload || {})),
      });

      const data = await get()._json(res);
      get()._success();
      return data;
    } catch (e) {
      get()._fail(e);
      throw e;
    }
  },

  createOrder: async (payload) => {
    const p = { ...(payload || {}) };

    if (p.priority != null) {
      p.priority = normalizePriority(p.priority) || "normal";
    }

    if (p.paymentMethod != null) {
      p.paymentMethod = normalizePaymentMethod(p.paymentMethod) || "cod";
    }

    // ✅ wallet / customer credit support
    const walletAmount = Number(
      p.walletAmount ??
      p.walletCredit?.amount ??
      p.paymentBreakdown?.walletAmount ??
      0
    );

    if (walletAmount > 0 || p.useWallet === true || p.paymentMethod === "wallet") {
      p.useWallet = true;
      p.walletAmount = Math.max(0, walletAmount);

      p.walletCredit = {
        ...(p.walletCredit || {}),
        used: true,
        amount: Math.max(0, walletAmount),
      };

      p.paymentBreakdown = {
        ...(p.paymentBreakdown || {}),
        walletAmount: Math.max(0, walletAmount),
      };
    }

    const data = await get()._post(`/api/orders`, p);
    const order = get()._normalizeOrder(data);

    set((s) => ({
      order,
      orders: order ? [order, ...(s.orders || [])] : s.orders,
    }));

    return order;
  },

  fetchOrderById: async (orderId) => {
    if (!orderId) return null;

    const data = await get()._get(`/api/orders/${orderId}`);
    const order = get()._normalizeOrder(data);

    set({ order });
    return order;
  },

  fetchOrderByNumber: async (orderNumber) => {
    if (!orderNumber) return null;

    const data = await get()._get(`/api/orders/by-number/${orderNumber}`);
    const order = get()._normalizeOrder(data);

    set({ order });
    return order;
  },

  fetchOrdersByCustomer: async (customerId) => {
    if (!customerId) return [];

    const data = await get()._get(`/api/orders/customer/${customerId}`);
    const { orders: rawOrders } = normalizeOrdersPayload(data);
    const orders = normalizeOrders(rawOrders);

    set({ orders, ordersMeta: null });
    return orders;
  },

  fetchOrdersDashboard: async () => {
    set({
      orderDashboardLoading: true,
      error: null,
    });

    try {
      const data = await get()._get(`/api/orders/dashboard`, { silent: true });

      const dashboard = data?.data || data || null;

      set({
        orderDashboard: dashboard,
        orderDashboardLoading: false,
        error: null,
      });

      return dashboard;
    } catch (error) {
      set({
        orderDashboard: null,
        orderDashboardLoading: false,
        error: error?.message || "Failed to fetch orders dashboard",
      });

      throw error;
    }
  },

  fetchAllOrders: async (filters = {}) => {
    const f = { ...(filters || {}) };

    // ✅ Attribution filter aliases for admin UI
    if (f.source && !f.attributionSource) {
      f.attributionSource = f.source;
      delete f.source;
    }

    if (f.medium && !f.attributionMedium) {
      f.attributionMedium = f.medium;
      delete f.medium;
    }

    if (f.campaign && !f.attributionCampaign) {
      f.attributionCampaign = f.campaign;
      delete f.campaign;
    }

    if (f.page == null) f.page = 1;
    if (f.limit == null) f.limit = 200;

    const qs = buildQueryString(f);
    const data = await get()._get(`/api/orders${qs}`);
    const { orders: rawOrders, meta } =
      normalizeOrdersPayload(data);

    const orders = normalizeOrders(rawOrders);

    set({
      orders,
      ordersMeta: meta || null,
    });

    return orders;
  },

  // ✅ CONFIRMED ORDERS
  fetchConfirmedOrders: async (filters = {}) => {
    return get().fetchAllOrders({
      ...(filters || {}),
      confirmFilter: "confirmed",
    });
  },

  // ✅ NOT CONFIRMED ORDERS
  fetchNotConfirmedOrders: async (filters = {}) => {
    return get().fetchAllOrders({
      ...(filters || {}),
      confirmFilter: "not_confirmed",
    });
  },

  fetchNextOrdersPage: async (filters = {}) => {
    const currMeta = get().ordersMeta;
    const nextPage = Math.max(
      1,
      Number(currMeta?.page || filters?.page || 1) + 1
    );
    const limit = Number(filters?.limit || currMeta?.limit || 200);

    const qs = buildQueryString({ ...(filters || {}), page: nextPage, limit });
    const data = await get()._get(`/api/orders${qs}`);
    const { orders: rawOrders, meta } =
      normalizeOrdersPayload(data);

    const nextOrders = normalizeOrders(rawOrders);
    set((s) => ({
      orders: [...(s.orders || []), ...(nextOrders || [])],
      ordersMeta: meta || s.ordersMeta || null,
    }));

    return nextOrders || [];
  },

  fetchAllOrdersAllPages: async (filters = {}) => {
    get()._start();

    try {
      const baseFilters = { ...(filters || {}) };
      const limit = Number(baseFilters.limit || 200);

      let page = 1;
      let allOrders = [];
      let finalMeta = null;
      let hasMore = true;

      while (hasMore) {
        const qs = buildQueryString({
          ...baseFilters,
          page,
          limit,
        });

        const data = await get()._get(`/api/orders${qs}`, { silent: true });
        const { orders: rawBatch, meta } =
          normalizeOrdersPayload(data);

        const safeBatch = normalizeOrders(rawBatch);
        allOrders.push(...safeBatch);
        finalMeta = meta || finalMeta;

        if (meta?.hasMore != null) {
          hasMore = Boolean(meta.hasMore);
        } else if (meta?.totalCount != null) {
          hasMore = allOrders.length < Number(meta.totalCount || 0);
        } else {
          hasMore = safeBatch.length === limit;
        }

        page += 1;

        if (safeBatch.length === 0) {
          hasMore = false;
        }
      }

      set({
        orders: allOrders,
        ordersMeta: finalMeta
          ? { ...finalMeta, page: page - 1, fetchedCount: allOrders.length }
          : { page: page - 1, limit, fetchedCount: allOrders.length },
        loading: false,
        error: null,
      });

      return allOrders;
    } catch (e) {
      get()._fail(e);
      throw e;
    }
  },

  fetchCustomerSupportOrders: async (filters = {}) => {
    const f = { ...(filters || {}) };

    if (f.page == null) f.page = 1;
    if (f.limit == null) f.limit = 50;

    const qs = buildQueryString(f);
    const data = await get()._get(`/api/orders/customer-support${qs}`);
    const { orders: rawOrders, meta } =
      normalizeOrdersPayload(data);

    const orders = normalizeOrders(rawOrders);

    set({
      orders,
      ordersMeta: meta || null,
    });

    return orders;
  },

  fetchNextCustomerSupportOrdersPage: async (filters = {}) => {
    const currMeta = get().ordersMeta;
    const nextPage = Math.max(
      1,
      Number(currMeta?.page || filters?.page || 1) + 1
    );
    const limit = Number(filters?.limit || currMeta?.limit || 50);

    const qs = buildQueryString({ ...(filters || {}), page: nextPage, limit });
    const data = await get()._get(`/api/orders/customer-support${qs}`);
    const { orders: rawOrders, meta } =
      normalizeOrdersPayload(data);

    const nextOrders = normalizeOrders(rawOrders);
    set((s) => ({
      orders: [...(s.orders || []), ...(nextOrders || [])],
      ordersMeta: meta || s.ordersMeta || null,
    }));

    return nextOrders || [];
  },

  fetchCustomerSupportOrderDetail: async (orderId, { force = false } = {}) => {
    if (!orderId) return null;

    const key = String(orderId);
    const cached = get().customerSupportOrderDetails?.[key];
    if (cached && !force) return cached;

    const data = await get()._get(`/api/orders/customer-support/${orderId}`);
    const order = get()._normalizeOrder(data);

    if (order?._id) {
      set((s) => ({
        order,
        customerSupportOrderDetails: {
          ...(s.customerSupportOrderDetails || {}),
          [String(order._id)]: order,
        },
      }));
    }

    return order;
  },



  updateOrderStatus: async (orderId, payload) => {
    if (!orderId) return null;

    const p = { ...(payload || {}) };
    if (p.priority != null) {
      p.priority = normalizePriority(p.priority) || "normal";
    }

    const data = await get()._patch(`/api/orders/${orderId}/status`, p);
    const order = get()._normalizeOrder(data);

    set({ order });
    get()._syncOrderInList(order);
    get()._syncCustomerSupportDetail(order);

    return order;
  },


  updateOrderPaymentStatus: async (orderId, paymentStatus) => {
    if (!orderId) return null;

    const status = String(paymentStatus || "").trim().toLowerCase();

    const allowedStatuses = [
      "pending",
      "paid",
      "failed",
      "refunded",
      "partially_refunded",

      "refund_pending",
      "not_applicable",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new Error("Invalid payment status");
    }

    const data = await get()._patch(`/api/orders/${orderId}/payment-status`, {
      paymentStatus: status,
    });

    const order = get()._normalizeOrder(data);

    if (order?._id) {
      set({ order });
      get()._syncOrderInList(order);
      get()._syncCustomerSupportDetail(order);
    }

    return order;
  },

  updateTracking: async (orderId, payload) => {
    if (!orderId) return null;

    const data = await get()._patch(`/api/orders/${orderId}/tracking`, payload);
    const order = get()._normalizeOrder(data);

    set({ order });
    get()._syncOrderInList(order);
    get()._syncCustomerSupportDetail(order);

    return order;
  },

  updateOrderAddress: async (orderId, payload) => {
    if (!orderId) return null;

    const data = await get()._patch(`/api/orders/${orderId}/address`, payload);
    const order = get()._normalizeOrder(data);

    set({ order });
    get()._syncOrderInList(order);
    get()._syncCustomerSupportDetail(order);

    return order;
  },

  updateOrderItemSize: async (
    orderId,
    lineId,
    size,
    {
      source = "website",
      quantity = null,
      notifyCustomer = false,
    } = {}
  ) => {
    if (!orderId || !lineId) return null;

    const normalizedSize = String(size || "")
      .trim()
      .toUpperCase();

    if (!normalizedSize) {
      throw new Error("Size is required");
    }

    const normalizedSource = String(source || "website")
      .trim()
      .toLowerCase();

    const isShopify = normalizedSource === "shopify";

    const path = isShopify
      ? `/api/shopify/orders/${orderId}/items/${lineId}/size`
      : `/api/orders/${orderId}/items/${lineId}/size`;

    const payload = isShopify
      ? {
        size: normalizedSize,
        quantity:
          quantity === null || quantity === ""
            ? undefined
            : Number(quantity),
        notifyCustomer: Boolean(notifyCustomer),
      }
      : {
        size: normalizedSize,
      };

    const data = await get()._patch(path, payload);
    const order = get()._normalizeOrder(data);

    if (order?._id) {
      set({ order });
      get()._syncOrderInList(order);
      get()._syncCustomerSupportDetail(order);
    }

    return order;
  },

  updateOrder: async (orderId, payload) => {
    if (!orderId) return null;

    const p = { ...(payload || {}) };

    if (p.priority != null) {
      p.priority = normalizePriority(p.priority) || "normal";
    }

    if (p.customerSupportRemark != null) {
      p.customerSupportRemark = String(p.customerSupportRemark).trim();
    }

    const data = await get()._patch(`/api/orders/${orderId}`, p);
    const order = get()._normalizeOrder(data);

    if (order?._id) {
      set({ order });
      get()._syncOrderInList(order);
      get()._syncCustomerSupportDetail(order);
    }

    return order;
  },

  cancelOrder: async (
    orderId,
    reason = "",
    {
      cancelledBy = "admin",
      notifyCustomer = true,
    } = {}
  ) => {
    if (!orderId) {
      throw new Error("Order ID is required");
    }

    const data = await get()._post(
      `/api/orders/${orderId}/cancel`,
      {
        reason:
          String(reason || "").trim() ||
          "cancelled_by_admin",
        cancelledBy,
        notifyCustomer: Boolean(notifyCustomer),
      }
    );

    if (data?.success === false) {
      throw new Error(
        data?.message || "Order cancellation failed"
      );
    }

    const order = get()._normalizeOrder(data);

    if (order?._id) {
      set({ order });
      get()._syncOrderInList(order);
      get()._syncCustomerSupportDetail(order);
    }

    return order;
  },

  bulkCancelOrders: async (
    orderIds = [],
    {
      reason = "cancelled_by_admin",
      cancelledBy = "admin",
      sendEmail = true,
    } = {}
  ) => {
    const ids = [
      ...new Set(
        (Array.isArray(orderIds) ? orderIds : [])
          .map((id) => String(id || "").trim())
          .filter(Boolean)
      ),
    ];

    if (!ids.length) {
      throw new Error("Please select at least one order");
    }

    set({
      bulkCancellationLoading: true,
      error: null,
    });

    try {
      const data = await get()._post(`/api/orders/bulk-cancel`, {
        orderIds: ids,
        reason: String(reason || "").trim() || "cancelled_by_admin",
        cancelledBy: ["admin", "customer", "system"].includes(
          String(cancelledBy || "").trim().toLowerCase()
        )
          ? String(cancelledBy).trim().toLowerCase()
          : "admin",
        sendEmail: Boolean(sendEmail),
      });

      const results = Array.isArray(data?.results) ? data.results : [];

      const successfulIds = new Set(
        results
          .filter((item) => item?.success)
          .map((item) => String(item?.orderId || ""))
          .filter(Boolean)
      );

      const cancelledAt = new Date().toISOString();

      set((state) => ({
        bulkCancellationLoading: false,

        orders: (state.orders || []).map((order) => {
          if (!successfulIds.has(String(order?._id))) return order;

          return {
            ...order,
            fulfillmentStatus: "cancelled",
            cancellation: {
              ...(order?.cancellation || {}),
              isCancelled: true,
              cancelledAt:
                order?.cancellation?.cancelledAt || cancelledAt,
              cancelledBy:
                String(cancelledBy || "").trim().toLowerCase() || "admin",
              reason:
                String(reason || "").trim() || "cancelled_by_admin",
            },
          };
        }),

        customerSupportOrderDetails: Object.fromEntries(
          Object.entries(
            state.customerSupportOrderDetails || {}
          ).map(([id, order]) => {
            if (!successfulIds.has(String(id))) {
              return [id, order];
            }

            return [
              id,
              {
                ...order,
                fulfillmentStatus: "cancelled",
                cancellation: {
                  ...(order?.cancellation || {}),
                  isCancelled: true,
                  cancelledAt:
                    order?.cancellation?.cancelledAt || cancelledAt,
                  cancelledBy:
                    String(cancelledBy || "").trim().toLowerCase() ||
                    "admin",
                  reason:
                    String(reason || "").trim() ||
                    "cancelled_by_admin",
                },
              },
            ];
          })
        ),

        order:
          state.order?._id &&
            successfulIds.has(String(state.order._id))
            ? {
              ...state.order,
              fulfillmentStatus: "cancelled",
              cancellation: {
                ...(state.order?.cancellation || {}),
                isCancelled: true,
                cancelledAt:
                  state.order?.cancellation?.cancelledAt ||
                  cancelledAt,
                cancelledBy:
                  String(cancelledBy || "").trim().toLowerCase() ||
                  "admin",
                reason:
                  String(reason || "").trim() ||
                  "cancelled_by_admin",
              },
            }
            : state.order,
      }));

      return data;
    } catch (error) {
      set({
        bulkCancellationLoading: false,
        error: error?.message || "Bulk cancellation failed",
      });

      throw error;
    }
  },

  bulkLookupOrders: async (orderNumbers = []) => {
    const numbers = [
      ...new Set(
        (Array.isArray(orderNumbers) ? orderNumbers : [])
          .map((value) =>
            String(value || "").trim().toUpperCase()
          )
          .filter(Boolean)
      ),
    ];

    if (!numbers.length) {
      throw new Error("No order numbers provided");
    }

    return get()._post(`/api/orders/bulk-lookup`, {
      orderNumbers: numbers,
    });
  },

  confirmOrder: async (orderId) => {
    if (!orderId) return null;

    const data = await get()._post(`/api/orders/${orderId}/confirm`, {
      confirmedBy: "admin",
    });

    const order = get()._normalizeOrder(data);

    if (order?._id) {
      set({ order });
      get()._syncOrderInList(order);
      get()._syncCustomerSupportDetail(order);
    }

    return order;
  },

  fetchOrderConfirmationDetails: async (orderId) => {
    if (!orderId) return null;

    set({ confirmationDetailsLoading: true, error: null });

    try {
      const data = await get()._get(
        `/api/orders/${orderId}/confirmation-details`,
        { silent: true }
      );

      const details = data?.data || data || null;

      set({
        confirmationDetails: details,
        confirmationDetailsLoading: false,
      });

      return details;
    } catch (error) {
      set({
        confirmationDetailsLoading: false,
        error: error?.message || "Failed to fetch confirmation details",
      });
      throw error;
    }
  },

  duplicateExchangeOrder: async (orderId, payload = {}) => {
    if (!orderId) return null;

    const data = await get()._post(
      `/api/orders/${orderId}/duplicate-exchange`,
      payload
    );
    const newOrder = get()._normalizeOrder(data);

    if (newOrder?._id) {
      set({ order: newOrder });
      set((s) => ({
        orders: [newOrder, ...(s.orders || [])],
      }));
    }

    return newOrder;
  },

  bookShiprocketIfMissing: async (orderId) => {
    if (!orderId) return null;

    const data = await get()._post(
      `/api/orders/${orderId}/shiprocket/book`,
      {}
    );
    const order = get()._normalizeOrder(data);

    if (order?._id) {
      set({ order });
      get()._syncOrderInList(order);
      get()._syncCustomerSupportDetail(order);
    } else {
      await get().fetchOrderById(orderId);
    }

    return data;
  },

  fetchPackedOrderLabels: async (filters = {}) => {
    const qs = buildQueryString(filters);

    const data = await get()._get(
      `/api/orders/labels/packed${qs}`
    );

    set({
      packedOrderLabels: data?.orders || [],
      packedOrderLabelsSummary: data?.summary || null,
    });

    return data;
  },

  downloadMergedLabels: async ({
    orderIds = [],
    allPackedWithLabels = false,
  } = {}) => {
    set({
      downloadingMergedLabels: true,
      error: null,
    });

    try {
      const res = await fetch(
        `${API}/api/orders/labels/merge`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderIds,
            allPackedWithLabels,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Download failed");
      }

      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `packed-labels-${Date.now()}.pdf`;
      a.click();

      window.URL.revokeObjectURL(url);

      set({
        downloadingMergedLabels: false,
      });

      return true;
    } catch (e) {
      set({
        downloadingMergedLabels: false,
        error: e.message,
      });

      throw e;
    }
  },

  fetchOrdersByIdentity: async ({ email, phone } = {}) => {
    const e = String(email ?? "").trim();
    const p = String(phone ?? "").trim();

    const qs = new URLSearchParams();

    if (e) qs.set("email", e);
    if (p) qs.set("phone", p);

    const data = await get()._get(
      `/api/orders/lookup?${qs.toString()}`
    );

    const { orders: rawOrders } =
      normalizeOrdersPayload(data);

    const orders = normalizeOrders(rawOrders);

    set({
      orders,
      ordersMeta: null,
    });

    return orders;
  },

  fetchProductOrderCount: async (q) => {
    const search = String(q ?? "").trim();

    if (!search) {
      set({ productOrderCount: null });
      return null;
    }

    const data = await get()._get(
      `/api/orders/product-order-count?q=${encodeURIComponent(search)}`
    );

    const result = {
      query: data?.query || search,
      totalOrders: Number(data?.totalOrders || 0),
    };

    set({ productOrderCount: result });
    return result;
  },


  // ✅ NEW FUNCTION ONLY
  searchOrdersByLocation: async (params = {}) => {
    get()._start();

    try {
      const query = new URLSearchParams();

      if (params.state) query.set("state", String(params.state).trim());
      if (params.pincode) query.set("pincode", String(params.pincode).trim());
      if (params.page != null) query.set("page", String(params.page));
      if (params.limit != null) query.set("limit", String(params.limit));

      if (params.fulfillmentStatus) {
        query.set("fulfillmentStatus", String(params.fulfillmentStatus).trim());
      }

      if (params.paymentMethod) {
        query.set("paymentMethod", String(params.paymentMethod).trim());
      }

      if (
        params.isConfirmed !== undefined &&
        params.isConfirmed !== null &&
        params.isConfirmed !== ""
      ) {
        query.set("isConfirmed", String(params.isConfirmed));
      }

      if (params.search) {
        query.set("search", String(params.search).trim());
      }

      const data = await get()._get(
        `/api/orders/location/search?${query.toString()}`,
        { silent: true }
      );

      set({
        orders: Array.isArray(data?.orders) ? data.orders : [],
        ordersMeta: data?.pagination
          ? {
            page: Number(data.pagination.page || 1),
            limit: Number(data.pagination.limit || 100),
            totalCount: Number(data.pagination.total || 0),
            totalPages: Number(data.pagination.totalPages || 1),
            hasMore: Boolean(data.pagination.hasNextPage),
            hasPrevPage: Boolean(data.pagination.hasPrevPage),
          }
          : {
            page: 1,
            limit: Number(params.limit || 100),
            totalCount: 0,
            totalPages: 1,
            hasMore: false,
            hasPrevPage: false,
          },
        loading: false,
        error: null,
      });

      return data;
    } catch (error) {
      console.error("searchOrdersByLocation error:", error);
      get()._fail(error);
      throw error;
    }
  },

  getWalletSummary: (order = null) => {
    const o = order || get().order || {};

    return {
      used: Boolean(o?.walletCredit?.used || o?.analytics?.creditsUsed),
      amount: Number(
        o?.walletCredit?.amount ||
        o?.paymentBreakdown?.walletAmount ||
        0
      ),
      transactionId: o?.walletCredit?.transactionId || "",
      debitedAt: o?.walletCredit?.debitedAt || null,
      balanceAfterDebit: Number(o?.walletCredit?.balanceAfterDebit || 0),
      remainingPayable: Number(o?.finalPayable || 0),
      paymentMethod: o?.paymentMethod || "",
      paymentStatus: o?.paymentStatus || "",
    };
  },


  /* ---------------- DUPLICATE ORDER ALERTS ---------------- */

  // fetch only (no marking)
  fetchDuplicateOrderAlerts: async () => {
    const data = await get()._get(`/api/orders/duplicate-alerts`);
    return data;
  },

  // detect + mark in adminRemarks
  markDuplicateOrderAlerts: async () => {
    const data = await get()._post(`/api/orders/duplicate-alerts/mark`, {});
    return data;
  },

  clearOrder: () => set({ order: null }),
  clearProductOrderCount: () => set({ productOrderCount: null }),

  clearOrders: () =>
    set({
      orders: [],
      ordersMeta: null,
    }),

  clearCustomerSupportOrderDetails: () =>
    set({
      customerSupportOrderDetails: {},
    }),

  resetStore: () =>
    set({
      orders: [],
      order: null,
      loading: false,
      error: null,
      productOrderCount: null,
      ordersMeta: null,
      customerSupportOrderDetails: {},
      confirmationDetails: null,
      confirmationDetailsLoading: false,
      // ✅ dashboard
      orderDashboard: null,
      orderDashboardLoading: false,
      bulkCancellationLoading: false,
    }),
}));
