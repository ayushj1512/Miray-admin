import { SELLER } from "./invoice.constants";

const getMoney = (moneySet) =>
  Number(moneySet?.shopMoney?.amount || moneySet?.amount || 0);

const getTracking = (order) => {
  const fulfillment = order?.fulfillments?.[0];
  const tracking = fulfillment?.trackingInfo?.[0];

  return {
    name: tracking?.company || fulfillment?.status || "",
    awb: tracking?.number || "",
    trackingUrl: tracking?.url || "",
  };
};

export function buildInvoiceDataFromShopify(order) {
  if (!order) return null;

  const shipping = order.shippingAddress || {};
  const customer = order.customer || {};

  const fullName =
    shipping.name ||
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    "Customer";

  const lineItems = order?.lineItems?.edges || [];

  const items = lineItems.map((edge, index) => {
    const item = edge.node;
    const price = getMoney(item.originalUnitPriceSet);

    return {
      sr: index + 1,
      name: item.title,
      size: item.variantTitle || "-",
      sku: item.sku || "-",
      hsnCode: "62105000",
      qty: Number(item.quantity || 1),
      priceIncl: price,
      price,
      gstRate: 5,
      discount: 0,
    };
  });

  const grandTotal = getMoney(order.totalPriceSet);
  const subtotal = getMoney(order.subtotalPriceSet);
  const shippingCharge = getMoney(order.totalShippingPriceSet);

  const taxable = +(grandTotal / 1.05).toFixed(2);
  const tax = +(grandTotal - taxable).toFixed(2);

  return {
    seller: SELLER,

    orderNumber: order.name?.replace("#", "") || order.name || "-",
    orderDate: order.createdAt,
    invoiceNumber: `INV-${order.name?.replace("#", "") || Date.now()}`,

    billing: {
      fullName,
      line1: shipping.address1 || "-",
      line2: shipping.address2 || "",
      city: shipping.city || "-",
      state: shipping.province || "-",
      pincode: shipping.zip || "-",
      country: shipping.country || "India",
      phone: shipping.phone || customer.phone || "",
      email: customer.email || "",
    },

    shipping: {
      fullName,
      line1: shipping.address1 || "-",
      line2: shipping.address2 || "",
      city: shipping.city || "-",
      state: shipping.province || "-",
      pincode: shipping.zip || "-",
      country: shipping.country || "India",
      phone: shipping.phone || customer.phone || "",
    },

    courier: getTracking(order),

    payment: {
      title: order.displayFinancialStatus || "Shopify",
      status: order.displayFinancialStatus || "-",
    },

    items,

    totals: {
      taxable,
      tax,
      shipping: shippingCharge,
      subtotal,
      discount: 0,
      grandTotal,
      finalPayable: grandTotal,
    },
  };
}
