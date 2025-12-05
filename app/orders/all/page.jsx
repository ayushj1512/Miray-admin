"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Search, Download } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function OrdersListPage() {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔍 Filters
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [status, setStatus] = useState("");

  // ------------------------------------
  // LOAD ORDERS WITH FILTERS
  // ------------------------------------
  const loadOrders = async () => {
    try {
      setLoading(true);

      let url = `${API}/api/orders?`;

      // backend keys depend on your API; keeping your existing query params:
      if (search) url += `customerName=${encodeURIComponent(search)}&`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      if (minAmount) url += `minAmount=${minAmount}&`;
      if (maxAmount) url += `maxAmount=${maxAmount}&`;
      if (paymentMethod) url += `paymentMethod=${paymentMethod}&`;
      if (status) url += `fulfillmentStatus=${status}&`;

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      // API returns array
      setOrders(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.log("Orders Fetch Error:", err);
      setOrders([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, startDate, endDate, minAmount, maxAmount, paymentMethod, status]);

  const filteredOrders = orders;

  // ------------------------------------
  // CSV HELPERS
  // ------------------------------------
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toISOString(); // best for exports
  };

  const money = (n) => {
    const x = Number(n);
    return Number.isFinite(x) ? x : "";
  };

  const safe = (v) => (v === null || v === undefined ? "" : v);

  // ------------------------------------
  // FLATTEN ORDER -> CSV ROWS
  // 1 row per item to export "all necessary details"
  // ------------------------------------
  const buildCsvRows = (ordersArr) => {
    const rows = [];
    for (const order of ordersArr || []) {
      const orderId = safe(order?._id);
      const orderNumber = safe(order?.orderNumber);
      const orderDate = formatDate(order?.createdAt || order?.orderDate);

      // customer
      const customerName = safe(order?.customerId?.name);
      const customerEmail = safe(order?.customerId?.email);
      const customerPhone = safe(order?.customerId?.phone);

      // address snapshots
      const ship = order?.shippingAddressSnapshot || {};
      const bill = order?.billingAddressSnapshot || {};

      const shipFull = safe(ship?.fullName);
      const shipPhone = safe(ship?.phone);
      const shipEmail = safe(ship?.email);
      const shipLine1 = safe(ship?.line1);
      const shipLine2 = safe(ship?.line2);
      const shipCity = safe(ship?.city);
      const shipState = safe(ship?.state);
      const shipCountry = safe(ship?.country);
      const shipPincode = safe(ship?.pincode);

      const billFull = safe(bill?.fullName);
      const billPhone = safe(bill?.phone);
      const billEmail = safe(bill?.email);
      const billLine1 = safe(bill?.line1);
      const billLine2 = safe(bill?.line2);
      const billCity = safe(bill?.city);
      const billState = safe(bill?.state);
      const billCountry = safe(bill?.country);
      const billPincode = safe(bill?.pincode);

      // payment + totals
      const paymentMethodV = safe(order?.paymentMethod);
      const paymentStatus = safe(order?.paymentStatus);
      const fulfillmentStatus = safe(order?.fulfillmentStatus);
      const source = safe(order?.source);

      const subtotal = money(order?.subtotal);
      const discount = money(order?.discount);
      const shippingFee = money(order?.shippingFee);
      const tax = money(order?.tax);
      const totalAmount = money(order?.totalAmount);
      const finalPayable = money(order?.finalPayable);

      const couponId = safe(order?.coupon?._id || order?.coupon);
      const couponCode = safe(order?.coupon?.code);
      const couponDiscountType = safe(order?.coupon?.discountType);
      const couponDiscountValue = safe(order?.coupon?.discountValue);

      // tracking
      const tracking = order?.trackingDetails || {};
      const trackingId = safe(tracking?.trackingId);
      const courierName = safe(tracking?.courierName);
      const shippedAt = formatDate(tracking?.shippedAt);
      const deliveredAt = formatDate(tracking?.deliveredAt);
      const expectedDelivery = formatDate(tracking?.expectedDelivery);

      // notes
      const customerMessage = safe(order?.customerMessage);
      const adminRemarks = safe(order?.adminRemarks);

      const isGiftOrder = !!order?.isGiftOrder;

      const items = Array.isArray(order?.items) ? order.items : [];

      // If no items, still export 1 row with blanks for item fields
      if (items.length === 0) {
        rows.push({
          orderId,
          orderNumber,
          orderDate,
          customerName,
          customerEmail,
          customerPhone,

          shipFull,
          shipPhone,
          shipEmail,
          shipLine1,
          shipLine2,
          shipCity,
          shipState,
          shipCountry,
          shipPincode,

          billFull,
          billPhone,
          billEmail,
          billLine1,
          billLine2,
          billCity,
          billState,
          billCountry,
          billPincode,

          paymentMethod: paymentMethodV,
          paymentStatus,
          fulfillmentStatus,
          source,

          subtotal,
          discount,
          shippingFee,
          tax,
          totalAmount,
          finalPayable,

          couponId,
          couponCode,
          couponDiscountType,
          couponDiscountValue,

          trackingId,
          courierName,
          shippedAt,
          deliveredAt,
          expectedDelivery,

          isGiftOrder,
          customerMessage,
          adminRemarks,

          // item fields empty
          itemIndex: "",
          itemProductId: "",
          itemTitle: "",
          itemSlug: "",
          itemCategoryId: "",
          itemSubcategoryId: "",
          itemThumbnail: "",
          itemImages: "",
          itemTags: "",
          itemSku: "",
          itemVariantSku: "",
          itemVariantId: "",
          itemVariantAttributes: "",
          itemVariantImage: "",
          itemQuantity: "",
          itemUnitPrice: "",
          itemSubtotal: "",
          itemWeight: "",
        });
        continue;
      }

      items.forEach((item, idx) => {
        const snap = item?.productSnapshot || {};
        const itemVariant = item?.variant || {};

        const itemProductId = safe(item?.productId?._id || item?.productId);
        const itemTitle = safe(snap?.title);
        const itemSlug = safe(snap?.slug);
        const itemCategoryId = safe(snap?.category?._id || snap?.category);
        const itemSubcategoryId = safe(snap?.subcategory?._id || snap?.subcategory);

        const itemThumbnail = safe(snap?.thumbnail);
        const itemImages = Array.isArray(snap?.images) ? snap.images.join(" | ") : "";
        const itemTags = Array.isArray(snap?.tags) ? snap.tags.join(" | ") : "";

        const itemSku = safe(snap?.sku);
        const itemVariantSku = safe(snap?.variantSku);

        const itemVariantId = safe(itemVariant?.variantId);
        const itemVariantAttributes = Array.isArray(itemVariant?.attributes)
          ? itemVariant.attributes
              .map((a) => `${safe(a?.key)}:${safe(a?.value)}`)
              .filter(Boolean)
              .join(" | ")
          : "";

        const itemVariantImage = safe(itemVariant?.image);

        const itemQuantity = money(item?.quantity);
        const itemUnitPrice = money(item?.price);
        const itemSubtotal = money(item?.subtotal);

        const itemWeight = money(snap?.weight);

        rows.push({
          orderId,
          orderNumber,
          orderDate,
          customerName,
          customerEmail,
          customerPhone,

          shipFull,
          shipPhone,
          shipEmail,
          shipLine1,
          shipLine2,
          shipCity,
          shipState,
          shipCountry,
          shipPincode,

          billFull,
          billPhone,
          billEmail,
          billLine1,
          billLine2,
          billCity,
          billState,
          billCountry,
          billPincode,

          paymentMethod: paymentMethodV,
          paymentStatus,
          fulfillmentStatus,
          source,

          subtotal,
          discount,
          shippingFee,
          tax,
          totalAmount,
          finalPayable,

          couponId,
          couponCode,
          couponDiscountType,
          couponDiscountValue,

          trackingId,
          courierName,
          shippedAt,
          deliveredAt,
          expectedDelivery,

          isGiftOrder,
          customerMessage,
          adminRemarks,

          itemIndex: idx + 1,
          itemProductId,
          itemTitle,
          itemSlug,
          itemCategoryId,
          itemSubcategoryId,
          itemThumbnail,
          itemImages,
          itemTags,
          itemSku,
          itemVariantSku,
          itemVariantId,
          itemVariantAttributes,
          itemVariantImage,
          itemQuantity,
          itemUnitPrice,
          itemSubtotal,
          itemWeight,
        });
      });
    }
    return rows;
  };

  // ------------------------------------
  // EXPORT CURRENT VIEW TO CSV (ALL DETAILS)
  // ------------------------------------
  const exportToCSV = () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      alert("No orders to export for the current filters.");
      return;
    }

    const rows = buildCsvRows(filteredOrders);

    const headers = [
      // order meta
      "Order DB Id",
      "Order #",
      "Order Date (ISO)",

      // customer
      "Customer Name",
      "Customer Email",
      "Customer Phone",

      // shipping
      "Shipping Full Name",
      "Shipping Phone",
      "Shipping Email",
      "Shipping Line1",
      "Shipping Line2",
      "Shipping City",
      "Shipping State",
      "Shipping Country",
      "Shipping Pincode",

      // billing
      "Billing Full Name",
      "Billing Phone",
      "Billing Email",
      "Billing Line1",
      "Billing Line2",
      "Billing City",
      "Billing State",
      "Billing Country",
      "Billing Pincode",

      // status/payment
      "Payment Method",
      "Payment Status",
      "Fulfillment Status",
      "Source",

      // totals
      "Subtotal",
      "Discount",
      "Shipping Fee",
      "Tax",
      "Total Amount",
      "Final Payable",

      // coupon
      "Coupon Id",
      "Coupon Code",
      "Coupon Discount Type",
      "Coupon Discount Value",

      // tracking
      "Tracking Id",
      "Courier Name",
      "Shipped At (ISO)",
      "Delivered At (ISO)",
      "Expected Delivery (ISO)",

      // misc
      "Is Gift Order",
      "Customer Message",
      "Admin Remarks",

      // item fields (1 row per item)
      "Item #",
      "Item Product Id",
      "Item Title",
      "Item Slug",
      "Item Category Id",
      "Item Subcategory Id",
      "Item Thumbnail",
      "Item Images (|)",
      "Item Tags (|)",
      "Item SKU (simple)",
      "Item Variant SKU",
      "Item Variant Id",
      "Item Variant Attributes (key:value|)",
      "Item Variant Image",
      "Item Quantity",
      "Item Unit Price",
      "Item Subtotal",
      "Item Weight",
    ];

    const csvLines = [
      headers.map(escapeCSV).join(","),
      ...rows.map((r) =>
        [
          r.orderId,
          r.orderNumber,
          r.orderDate,

          r.customerName,
          r.customerEmail,
          r.customerPhone,

          r.shipFull,
          r.shipPhone,
          r.shipEmail,
          r.shipLine1,
          r.shipLine2,
          r.shipCity,
          r.shipState,
          r.shipCountry,
          r.shipPincode,

          r.billFull,
          r.billPhone,
          r.billEmail,
          r.billLine1,
          r.billLine2,
          r.billCity,
          r.billState,
          r.billCountry,
          r.billPincode,

          r.paymentMethod,
          r.paymentStatus,
          r.fulfillmentStatus,
          r.source,

          r.subtotal,
          r.discount,
          r.shippingFee,
          r.tax,
          r.totalAmount,
          r.finalPayable,

          r.couponId,
          r.couponCode,
          r.couponDiscountType,
          r.couponDiscountValue,

          r.trackingId,
          r.courierName,
          r.shippedAt,
          r.deliveredAt,
          r.expectedDelivery,

          r.isGiftOrder ? "true" : "false",
          r.customerMessage,
          r.adminRemarks,

          r.itemIndex,
          r.itemProductId,
          r.itemTitle,
          r.itemSlug,
          r.itemCategoryId,
          r.itemSubcategoryId,
          r.itemThumbnail,
          r.itemImages,
          r.itemTags,
          r.itemSku,
          r.itemVariantSku,
          r.itemVariantId,
          r.itemVariantAttributes,
          r.itemVariantImage,
          r.itemQuantity,
          r.itemUnitPrice,
          r.itemSubtotal,
          r.itemWeight,
        ]
          .map(escapeCSV)
          .join(",")
      ),
    ];

    const csvContent = csvLines.join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    link.href = url;
    link.setAttribute("download", `orders-full-${ts}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totals = useMemo(() => {
    const count = filteredOrders.length;
    const sum = filteredOrders.reduce((acc, o) => acc + (Number(o?.finalPayable) || 0), 0);
    return { count, sum };
  }, [filteredOrders]);

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* =======================================
              PAGE HEADER & SEARCH BAR
        ======================================== */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">All Orders</h1>
            <p className="text-gray-500 mt-1">View, filter and manage all customer orders.</p>
            <div className="text-sm text-gray-600 mt-2">
              Showing <span className="font-semibold">{totals.count}</span> orders • Total{" "}
              <span className="font-semibold">₹{totals.sum}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto">
            {/* Search Input */}
            <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm w-full md:w-80">
              <Search size={20} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search customer or order..."
                className="outline-none w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2 rounded-xl bg-black text-white text-sm font-medium shadow-sm hover:bg-gray-900 transition"
            >
              <Download size={18} />
              Export CSV (Full)
            </button>
          </div>
        </div>

        {/* =======================================
              ADVANCED FILTERS
        ======================================== */}
        <div className="bg-white p-5 rounded-xl shadow grid md:grid-cols-4 gap-5 border">
          {/* Date Range */}
          <div>
            <label className="text-sm font-semibold">Start Date</label>
            <input
              type="date"
              className="w-full mt-1 p-2 rounded-lg bg-gray-100"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold">End Date</label>
            <input
              type="date"
              className="w-full mt-1 p-2 rounded-lg bg-gray-100"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Amount Range */}
          <div>
            <label className="text-sm font-semibold">Min Amount</label>
            <input
              type="number"
              className="w-full mt-1 p-2 rounded-lg bg-gray-100"
              placeholder="₹0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Max Amount</label>
            <input
              type="number"
              className="w-full mt-1 p-2 rounded-lg bg-gray-100"
              placeholder="₹5000"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-sm font-semibold">Payment Method</label>
            <select
              className="w-full mt-1 p-2 rounded-lg bg-gray-100"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="">All</option>
              <option value="cod">Cash on Delivery</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="wallet">Wallet</option>
              <option value="netbanking">Netbanking</option>
            </select>
          </div>

          {/* Fulfillment Buttons */}
          <div className="md:col-span-4 flex gap-3 overflow-x-auto pt-3">
            {[
              { key: "", label: "All" },
              { key: "processing", label: "Processing" },
              { key: "packed", label: "Packed" },
              { key: "shipped", label: "Shipped" },
              { key: "out_for_delivery", label: "Out for Delivery" },
              { key: "delivered", label: "Delivered" },
              { key: "returned", label: "Returned" },
              { key: "cancelled", label: "Cancelled" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setStatus(s.key)}
                className={`px-4 py-2 rounded-lg border text-sm ${
                  status === s.key ? "bg-black text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* =======================================
                ORDERS TABLE
        ======================================== */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-gray-600">
              <tr>
                <th className="py-3 px-4 text-left">Order #</th>
                <th className="py-3 px-4 text-left">Customer</th>
                <th className="py-3 px-4 text-left">Payment</th>
                <th className="py-3 px-4 text-left">Fulfillment</th>
                <th className="py-3 px-4 text-left">Amount</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-semibold">{order.orderNumber}</td>

                    <td className="py-3 px-4">
                      {order.customerId?.name || "Unknown"}
                      <div className="text-xs text-gray-500">{order.customerId?.phone}</div>
                    </td>

                    <td className="py-3 px-4 capitalize">{order.paymentMethod}</td>

                    <td className="py-3 px-4 capitalize">{order.fulfillmentStatus?.replace(/_/g, " ")}</td>

                    <td className="py-3 px-4 font-semibold">₹{order.finalPayable}</td>

                    <td className="py-3 px-4">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => router.push(`/orders/${order._id}`)}
                        className="text-blue-600 flex items-center gap-1 hover:underline"
                      >
                        View <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    No orders found for applied filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
