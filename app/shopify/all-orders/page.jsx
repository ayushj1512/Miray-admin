"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Search,
} from "lucide-react";
import OrderRow from "@/components/orders/OrderRow";
import { useOrderStore } from "@/store/orderStore";

const IST_TZ = "Asia/Kolkata";
const IST_OFFSET = "+05:30";
const SHOPIFY_SOURCE = "shopify";

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}
  >
    {children}
  </div>
);

const ymdInTZ = (date = new Date(), timeZone = IST_TZ) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value || "1970";
  const m = parts.find((p) => p.type === "month")?.value || "01";
  const d = parts.find((p) => p.type === "day")?.value || "01";

  return `${y}-${m}-${d}`;
};

const todayYMD_IST = () => ymdInTZ(new Date(), IST_TZ);

const yesterdayYMD_IST = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return ymdInTZ(d, IST_TZ);
};

const istStartISO = (ymd) => (ymd ? `${ymd}T00:00:00.000${IST_OFFSET}` : "");
const istEndISO = (ymd) => (ymd ? `${ymd}T23:59:59.999${IST_OFFSET}` : "");

const norm = (v) => String(v ?? "").trim().toLowerCase();

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const safe = (v) => (v === null || v === undefined ? "" : v);

const money = (n) => {
  const x = Number(n);
  return Number.isFinite(x) ? x : "";
};

const escapeCSV = (value) => {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return `"${s.replace(/"/g, '""')}"`;
};

const formatDateISO = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? "" : dt.toISOString();
};

const getOrderRevenue = (order) =>
  toNumber(
    order?.finalPayable ??
      order?.totalAmount ??
      order?.grandTotal ??
      order?.amount ??
      0
  );

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(toNumber(value));

const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
};

function PaginationBar({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  loading,
  onRefresh,
  onPageChange,
  totalRevenue,
}) {
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  const paginationItems = getPaginationItems(currentPage, totalPages);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-gray-600">
          Page <span className="font-semibold">{currentPage}</span> of{" "}
          <span className="font-semibold">{totalPages}</span>
          {totalCount > 0 ? (
            <>
              {" "}
              • Total <span className="font-semibold">{totalCount}</span> Shopify orders
            </>
          ) : null}
          {" • "}
          Revenue <span className="font-semibold">{formatINR(totalRevenue)}</span>
          <span className="text-gray-400"> • {pageSize} per page</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              loading
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.98]"
            }`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Refreshing...
              </span>
            ) : (
              "Refresh"
            )}
          </button>

          <button
            disabled={!canGoPrev || loading}
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              !canGoPrev || loading
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.98]"
            }`}
          >
            <ChevronLeft size={16} />
            Prev
          </button>

          <button
            disabled={!canGoNext || loading}
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              !canGoNext || loading
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-black text-white hover:opacity-90 active:scale-[0.98]"
            }`}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {paginationItems.map((item, idx) =>
          item === "..." ? (
            <span key={`dots-${idx}`} className="px-3 py-2 text-sm text-gray-500">
              ...
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              disabled={loading}
              className={`min-w-[42px] px-3 py-2 rounded-xl text-sm font-semibold transition ${
                currentPage === item
                  ? "bg-black text-white shadow-sm"
                  : loading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {item}
            </button>
          )
        )}
      </div>
    </div>
  );
}

const getOrderSource = (o) =>
  norm(o?.source || o?.attribution?.source || o?.medium || o?.attribution?.medium);

const applyClientFiltersToOrders = ({ orders, confirmFilter, priority, search }) => {
  let data = Array.isArray(orders) ? [...orders] : [];

  data = data.filter((o) => getOrderSource(o) === SHOPIFY_SOURCE);

  if (confirmFilter === "confirmed") {
    data = data.filter((o) => o?.isConfirmed === true);
  }

  if (confirmFilter === "not_confirmed") {
    data = data.filter((o) => o?.isConfirmed !== true);
  }

  if (priority) {
    data = data.filter((o) => norm(o?.priority) === norm(priority));
  }

  const q = String(search || "").trim().toLowerCase();
  if (!q) return data;

  return data.filter((o) => {
    const orderNumber = String(o?.orderNumber || o?.shopifyOrderName || "").toLowerCase();
    const name = String(
      o?.customerId?.name || o?.shippingAddressSnapshot?.fullName || ""
    ).toLowerCase();
    const email = String(
      o?.customerId?.email || o?.shippingAddressSnapshot?.email || ""
    ).toLowerCase();
    const phone = String(
      o?.customerId?.phone || o?.shippingAddressSnapshot?.phone || ""
    ).toLowerCase();

    return (
      orderNumber.includes(q) ||
      name.includes(q) ||
      email.includes(q) ||
      phone.includes(q)
    );
  });
};

export default function ShopifyAllOrdersPage() {
  const orders = useOrderStore((s) => s.orders);
  const loading = useOrderStore((s) => s.loading);
  const ordersMeta = useOrderStore((s) => s.ordersMeta);

  const fetchAllOrders = useOrderStore((s) => s.fetchAllOrders);
  const syncOrderInList = useOrderStore((s) => s._syncOrderInList);

  const [exportLoading, setExportLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [status, setStatus] = useState("");
  const [confirmFilter, setConfirmFilter] = useState("");
  const [priority, setPriority] = useState("");
  const [quickDate, setQuickDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 100;

  const handleOrderUpdated = useCallback(
    (updatedOrder) => {
      if (!updatedOrder?._id) return;
      syncOrderInList(updatedOrder);
    },
    [syncOrderInList]
  );

  const applySearch = useCallback(() => {
    setCurrentPage(1);
    setSearch(searchInput.trim());
  }, [searchInput]);

  const clearSearch = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
    setPaymentMethod("");
    setStatus("");
    setConfirmFilter("");
    setPriority("");
    setQuickDate("");
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    if (quickDate === "today") {
      const t = todayYMD_IST();
      setStartDate(t);
      setEndDate(t);
      return;
    }

    if (quickDate === "yesterday") {
      const y = yesterdayYMD_IST();
      setStartDate(y);
      setEndDate(y);
      return;
    }

    if (quickDate === "") {
      setStartDate("");
      setEndDate("");
    }
  }, [quickDate]);

  const backendFilters = useMemo(() => {
    const f = {
      source: SHOPIFY_SOURCE,
      page: currentPage,
      limit: pageSize,
    };

    if (search) f.customerName = search;

    if (startDate) {
      f.startDate = startDate;
      f.startAt = istStartISO(startDate);
      f.tz = IST_TZ;
    }

    if (endDate) {
      f.endDate = endDate;
      f.endAt = istEndISO(endDate);
      f.tz = IST_TZ;
    }

    if (minAmount) f.minAmount = minAmount;
    if (maxAmount) f.maxAmount = maxAmount;
    if (paymentMethod) f.paymentMethod = paymentMethod;
    if (status) f.fulfillmentStatus = status;
    if (confirmFilter) f.confirmFilter = confirmFilter;
    if (priority) f.priority = priority;

    return f;
  }, [
    search,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    paymentMethod,
    status,
    confirmFilter,
    priority,
    currentPage,
  ]);

  const loadOrders = useCallback(async () => {
    try {
      await fetchAllOrders(backendFilters);
    } catch (e) {
      console.log("Shopify Orders Fetch Error:", e);
    } finally {
      setHasLoadedOnce(true);
    }
  }, [fetchAllOrders, backendFilters]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    return applyClientFiltersToOrders({
      orders,
      confirmFilter,
      priority,
      search,
    });
  }, [orders, confirmFilter, priority, search]);

  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, order) => sum + getOrderRevenue(order), 0);
  }, [filteredOrders]);

  const sortedOrders = useMemo(() => {
    const getNum = (o) => {
      const val = String(o?.orderNumber || o?.shopifyOrderName || "");
      const m = val.match(/(\d+)$/);
      return m ? Number(m[1]) : 0;
    };

    return [...filteredOrders].sort((a, b) => {
      const an = getNum(a);
      const bn = getNum(b);
      if (bn !== an) return bn - an;

      const ad = new Date(a?.createdAt || a?.orderDate || 0).getTime();
      const bd = new Date(b?.createdAt || b?.orderDate || 0).getTime();
      return bd - ad;
    });
  }, [filteredOrders]);

  const buildCsvRows = (ordersArr) => {
    const rows = [];

    for (const order of ordersArr || []) {
      const orderId = safe(order?._id || order?.id);
      const orderNumber = safe(order?.orderNumber || order?.shopifyOrderName);
      const orderDate = formatDateISO(order?.createdAt || order?.orderDate);

      const customerName = safe(
        order?.customerId?.name || order?.shippingAddressSnapshot?.fullName
      );
      const customerEmail = safe(
        order?.customerId?.email || order?.shippingAddressSnapshot?.email
      );
      const customerPhone = safe(
        order?.customerId?.phone || order?.shippingAddressSnapshot?.phone
      );

      const subtotal = money(order?.subtotal);
      const discount = money(order?.discount);
      const shippingFee = money(order?.shippingFee);
      const tax = money(order?.tax);
      const totalAmount = money(order?.totalAmount);
      const finalPayable = money(order?.finalPayable);
      const fulfillmentStatus = safe(order?.fulfillmentStatus);
      const paymentMethod = safe(order?.paymentMethod);
      const paymentStatus = safe(order?.paymentStatus);
      const isConfirmed = order?.isConfirmed === true ? "YES" : "NO";

      const items = Array.isArray(order?.items) ? order.items : [];

      if (!items.length) {
        rows.push({
          orderId,
          orderNumber,
          orderDate,
          customerName,
          customerEmail,
          customerPhone,
          paymentStatus,
          paymentMethod,
          isConfirmed,
          fulfillmentStatus,
          subtotal,
          discount,
          shippingFee,
          tax,
          totalAmount,
          finalPayable,
          itemIndex: "",
          itemTitle: "",
          itemProductCode: "",
          itemSku: "",
          itemSize: "",
          itemQuantity: "",
          itemPrice: "",
        });
        continue;
      }

      items.forEach((item, idx) => {
        const snap = item?.productSnapshot || {};
        const attrs = Array.isArray(item?.variant?.attributes)
          ? item.variant.attributes
          : [];

        const attrSize =
          attrs.find((a) => String(a?.key || "").toLowerCase() === "size")?.value ||
          attrs.find((a) => String(a?.key || "").toLowerCase() === "sizes")?.value ||
          "";

        rows.push({
          orderId,
          orderNumber,
          orderDate,
          customerName,
          customerEmail,
          customerPhone,
          paymentStatus,
          paymentMethod,
          isConfirmed,
          fulfillmentStatus,
          subtotal,
          discount,
          shippingFee,
          tax,
          totalAmount,
          finalPayable,
          itemIndex: idx + 1,
          itemTitle: safe(snap?.title || item?.title),
          itemProductCode: safe(snap?.productCode || ""),
          itemSku: safe(item?.variant?.sku || snap?.sku || item?.sku || ""),
          itemSize: safe(item?.selectedSize || attrSize || item?.size || ""),
          itemQuantity: money(item?.quantity),
          itemPrice: money(item?.price),
        });
      });
    }

    return rows;
  };

  const exportToCSV = useCallback(async () => {
    if (exportLoading || loading) return;

    let originalFilters = null;
    setExportLoading(true);

    try {
      originalFilters = { ...backendFilters };

      const exportLimit = 500;
      const baseFilters = { ...backendFilters };
      delete baseFilters.page;
      delete baseFilters.limit;

      let page = 1;
      let totalPagesToFetch = 1;
      let allOrders = [];

      do {
        await fetchAllOrders({
          ...baseFilters,
          source: SHOPIFY_SOURCE,
          page,
          limit: exportLimit,
        });

        const state = useOrderStore.getState();
        const pageOrders = Array.isArray(state.orders) ? state.orders : [];
        const meta = state.ordersMeta || {};

        allOrders.push(...pageOrders);

        const totalCountFromMeta = toNumber(meta?.totalCount);
        const totalPagesFromMeta =
          toNumber(meta?.totalPages) ||
          Math.max(1, Math.ceil(totalCountFromMeta / exportLimit));

        totalPagesToFetch = totalPagesFromMeta;
        page += 1;
      } while (page <= totalPagesToFetch);

      const uniqueOrdersMap = new Map();

      for (const order of allOrders) {
        const key = order?._id || order?.id || order?.orderNumber || order?.shopifyOrderId;
        if (key && !uniqueOrdersMap.has(key)) {
          uniqueOrdersMap.set(key, order);
        }
      }

      const uniqueOrders = Array.from(uniqueOrdersMap.values());

      const exportOrders = applyClientFiltersToOrders({
        orders: uniqueOrders,
        confirmFilter,
        priority,
        search,
      });

      if (!exportOrders.length) {
        alert("No Shopify orders found to export for the applied filters.");
        return;
      }

      const rows = buildCsvRows(exportOrders);

      const headers = [
        "Order DB Id",
        "Order #",
        "Order Date ISO",
        "Customer Name",
        "Customer Email",
        "Customer Phone",
        "Payment Status",
        "Payment Method",
        "Is Confirmed",
        "Fulfillment Status",
        "Subtotal",
        "Discount",
        "Shipping Fee",
        "Tax",
        "Total Amount",
        "Final Payable",
        "Item #",
        "Item Title",
        "Product Code",
        "Item SKU",
        "Item Size",
        "Item Quantity",
        "Item Price",
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
            r.paymentStatus,
            r.paymentMethod,
            r.isConfirmed,
            r.fulfillmentStatus,
            r.subtotal,
            r.discount,
            r.shippingFee,
            r.tax,
            r.totalAmount,
            r.finalPayable,
            r.itemIndex,
            r.itemTitle,
            r.itemProductCode,
            r.itemSku,
            r.itemSize,
            r.itemQuantity,
            r.itemPrice,
          ]
            .map(escapeCSV)
            .join(",")
        ),
      ];

      const blob = new Blob([csvLines.join("\r\n")], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

      link.href = url;
      link.setAttribute("download", `shopify-orders-${ts}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Shopify CSV export failed:", error);
      alert("Failed to export Shopify orders.");
    } finally {
      if (originalFilters) {
        try {
          await fetchAllOrders(originalFilters);
        } catch (restoreError) {
          console.error("Failed to restore Shopify orders after export:", restoreError);
        }
      }

      setExportLoading(false);
    }
  }, [
    exportLoading,
    loading,
    backendFilters,
    fetchAllOrders,
    confirmFilter,
    priority,
    search,
  ]);

  const totalCount = toNumber(ordersMeta?.totalCount);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentMetaPage = toNumber(ordersMeta?.page) || currentPage;

  const chips = [
    { key: "", label: "All Shopify", type: "all" },
    { key: "processing", label: "Processing", type: "status" },
    { key: "packed", label: "Packed", type: "status" },
    { key: "picked", label: "Picked", type: "status" },
    { key: "shipped", label: "Shipped", type: "status" },
    { key: "out_for_delivery", label: "Out for Delivery", type: "status" },
    { key: "delivered", label: "Delivered", type: "status" },
    { key: "return_requested", label: "Return Requested", type: "status" },
    { key: "exchange_requested", label: "Exchange Requested", type: "status" },
    { key: "returned", label: "Returned", type: "status" },
    { key: "rto", label: "RTO", type: "status" },
    { key: "cancelled", label: "Cancelled", type: "status" },
    { key: "confirmed", label: "Confirmed", type: "confirm" },
    { key: "not_confirmed", label: "Not Confirmed", type: "confirm" },
    { key: "today", label: "Today", type: "quickDate" },
    { key: "yesterday", label: "Yesterday", type: "quickDate" },
  ];

  return (
    <section className="min-h-screen bg-[#f6f7fb] px-4 sm:px-6 lg:px-10 py-10">
      <div className="mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Shopify Orders
            </h1>
            <p className="text-gray-500 mt-1">
              View, filter, export and manage only Shopify synced orders.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="px-3 py-1 rounded-full bg-black text-white font-semibold">
                Source: Shopify
              </span>

              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">
                {totalCount || filteredOrders.length} Orders
              </span>

              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                Revenue: {formatINR(totalRevenue)}
              </span>

              <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 font-semibold">
                Page {currentMetaPage} of {totalPages}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 w-full md:w-80">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search Shopify order / name / email / phone..."
                className="outline-none w-full bg-transparent text-sm placeholder:text-gray-400"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applySearch()}
              />
            </div>

            <button
              onClick={applySearch}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-gray-200 text-gray-800 text-sm font-semibold shadow-sm hover:bg-gray-50 active:scale-[0.98] transition"
            >
              <Search size={18} /> Search
            </button>

            <button
              onClick={clearSearch}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gray-100 text-gray-800 text-sm font-semibold shadow-sm hover:bg-gray-200 active:scale-[0.98] transition"
            >
              Clear
            </button>

            <button
              onClick={exportToCSV}
              disabled={exportLoading || loading}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold shadow-sm active:scale-[0.98] transition ${
                exportLoading || loading
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-black text-white hover:opacity-90"
              }`}
            >
              {exportLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={18} /> Export CSV
                </>
              )}
            </button>
          </div>
        </div>

        <Card>
          <div className="grid md:grid-cols-4 gap-5">
            <div>
              <label className="text-sm font-semibold text-gray-700">Quick Date</label>
              <select
                className="w-full mt-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-black/10 transition"
                value={quickDate}
                onChange={(e) => {
                  setCurrentPage(1);
                  setQuickDate(e.target.value);
                }}
              >
                <option value="">All</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Start Date</label>
              <input
                type="date"
                className="w-full mt-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-black/10 transition"
                value={startDate}
                onChange={(e) => {
                  setCurrentPage(1);
                  setQuickDate("");
                  setStartDate(e.target.value);
                }}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">End Date</label>
              <input
                type="date"
                className="w-full mt-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-black/10 transition"
                value={endDate}
                onChange={(e) => {
                  setCurrentPage(1);
                  setQuickDate("");
                  setEndDate(e.target.value);
                }}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Payment Method</label>
              <select
                className="w-full mt-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-black/10 transition"
                value={paymentMethod}
                onChange={(e) => {
                  setCurrentPage(1);
                  setPaymentMethod(e.target.value);
                }}
              >
                <option value="">All</option>
                <option value="cod">COD</option>
                <option value="razorpay">Razorpay</option>
                <option value="shopify_payments">Shopify Payments</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Min Amount</label>
              <input
                type="number"
                className="w-full mt-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-black/10 transition"
                placeholder="₹0"
                value={minAmount}
                onChange={(e) => {
                  setCurrentPage(1);
                  setMinAmount(e.target.value);
                }}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Max Amount</label>
              <input
                type="number"
                className="w-full mt-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-black/10 transition"
                placeholder="₹5000"
                value={maxAmount}
                onChange={(e) => {
                  setCurrentPage(1);
                  setMaxAmount(e.target.value);
                }}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Confirmation</label>
              <select
                className="w-full mt-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-black/10 transition"
                value={confirmFilter}
                onChange={(e) => {
                  setCurrentPage(1);
                  setConfirmFilter(e.target.value);
                }}
              >
                <option value="">All</option>
                <option value="confirmed">Confirmed</option>
                <option value="not_confirmed">Not Confirmed</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Per Page</label>
              <input
                type="text"
                value="100"
                disabled
                className="w-full mt-2 px-3 py-2.5 rounded-xl bg-gray-100 border border-gray-200 outline-none text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {chips.map((s) => {
              const isActive =
                s.type === "status"
                  ? status === s.key
                  : s.type === "confirm"
                    ? confirmFilter === s.key
                    : s.type === "quickDate"
                      ? quickDate === s.key
                      : status === "" && confirmFilter === "" && quickDate === "";

              const onClick = () => {
                setCurrentPage(1);

                if (s.type === "all") {
                  setStatus("");
                  setConfirmFilter("");
                  setPriority("");
                  setQuickDate("");
                  return;
                }

                if (s.type === "status") {
                  setStatus((prev) => (prev === s.key ? "" : s.key));
                }

                if (s.type === "confirm") {
                  setConfirmFilter((prev) => (prev === s.key ? "" : s.key));
                }

                if (s.type === "quickDate") {
                  setQuickDate((prev) => (prev === s.key ? "" : s.key));
                }
              };

              return (
                <button
                  key={`${s.type}-${s.key || "all"}`}
                  onClick={onClick}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                    isActive
                      ? "bg-black text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <PaginationBar
              currentPage={currentMetaPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              loading={loading}
              onRefresh={loadOrders}
              onPageChange={setCurrentPage}
              totalRevenue={totalRevenue}
            />
          </div>
        </Card>

        <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-black/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold">Order</th>
                  <th className="px-5 py-4 text-left font-semibold">Customer</th>
                  <th className="px-5 py-4 text-left font-semibold">Payment Status</th>
                  <th className="px-5 py-4 text-left font-semibold">Method</th>
                  <th className="px-5 py-4 text-left font-semibold">Fulfillment</th>
                  <th className="px-5 py-4 text-left font-semibold">Amount</th>
                  <th className="px-5 py-4 text-left font-semibold">Date</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading && !hasLoadedOnce ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-gray-500">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 size={18} className="animate-spin" />
                        Loading Shopify orders...
                      </div>
                    </td>
                  </tr>
                ) : sortedOrders.length ? (
                  sortedOrders.map((order, idx) => {
                    const rowKey =
                      order?._id ||
                      order?.id ||
                      order?.orderNumber ||
                      order?.shopifyOrderId ||
                      `shopify-order-${idx}`;

                    return (
                      <OrderRow
                        key={String(rowKey)}
                        order={order}
                        onUpdated={handleOrderUpdated}
                      />
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      No Shopify orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Card>
          <PaginationBar
            currentPage={currentMetaPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            loading={loading}
            onRefresh={loadOrders}
            onPageChange={setCurrentPage}
            totalRevenue={totalRevenue}
          />
        </Card>
      </div>
    </section>
  );
}