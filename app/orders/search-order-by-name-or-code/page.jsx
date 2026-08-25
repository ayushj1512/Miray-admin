"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  RefreshCcw,
  Download,
  PackageSearch,
  Hash,
  FileText,
  AlertCircle,
  Store,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { useOrderStore } from "@/store/orderStore";

const DEFAULT_VISIBLE_ORDERS = 5;

const isDigitsOnly = (v) => /^\d+$/.test(String(v || "").trim());

const normalizeProductCode = (value) => {
  const raw = String(value || "").trim();

  if (!raw) return "";
  if (!isDigitsOnly(raw)) return raw;

  return raw.padStart(5, "0");
};

const formatLabel = (value = "") =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const FULFILLMENT_ORDER = [
  "processing",
  "packed",
  "picked",
  "shipped",
  "out_for_delivery",
  "delivered",
  "return_requested",
  "exchange_requested",
  "pickup_initiated",
  "returned",
  "refunded",
  "exchanged",
  "rto",
  "cancelled",
  "failed",
];

const FULFILLMENT_STYLES = {
  processing: "border-blue-200 bg-blue-50 text-blue-700",
  packed: "border-violet-200 bg-violet-50 text-violet-700",
  picked: "border-indigo-200 bg-indigo-50 text-indigo-700",
  shipped: "border-cyan-200 bg-cyan-50 text-cyan-700",
  out_for_delivery: "border-amber-200 bg-amber-50 text-amber-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
  failed: "border-red-200 bg-red-50 text-red-700",
  rto: "border-orange-200 bg-orange-50 text-orange-700",
};

const RESERVATION_STYLES = {
  pending: "border-blue-200 bg-blue-50 text-blue-700",
  reserved: "border-amber-200 bg-amber-50 text-amber-700",
  consumed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  released: "border-zinc-200 bg-zinc-100 text-zinc-700",
  expired: "border-red-200 bg-red-50 text-red-700",
};

const ReservationBadge = ({ status }) => {
  const value = String(status || "").toLowerCase();

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
        RESERVATION_STYLES[value] ||
        "border-zinc-200 bg-zinc-50 text-zinc-600"
      }`}
    >
      {formatLabel(value)}
    </span>
  );
};

const downloadCSV = (rows, filename = "product-order-search.csv") => {
  const headers = [
    "search_term",
    "order_number",
    "source",
    "fulfillment_status",
    "reservation_status",
  ];

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.search_term,
        row.order_number,
        row.source,
        row.fulfillment_status,
        row.reservation_status,
      ]
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-zinc-100 p-2">
          <Icon size={17} />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {label}
          </p>

          <p className="mt-1 text-xl font-semibold text-zinc-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function SearchOrderByNameOrCodePage() {
  const [input, setInput] = useState("");
  const [searched, setSearched] = useState("");
  const [expandedStatuses, setExpandedStatuses] = useState({});

  const {
    productOrderSearchResults = [],
    searchProductOrders,
    clearProductOrderSearchResults,
    loading,
    error,
  } = useOrderStore();

  const normalizedInput = useMemo(
    () => normalizeProductCode(input),
    [input]
  );

  // =====================================================
  // GROUP BY FULFILLMENT STATUS
  // =====================================================

  const groupedOrders = useMemo(() => {
    const groups = {};

    for (const order of productOrderSearchResults) {
      const status = String(order?.fulfillmentStatus || "processing")
        .trim()
        .toLowerCase();

      if (!groups[status]) {
        groups[status] = [];
      }

      groups[status].push(order);
    }

    return Object.entries(groups).sort(([a], [b]) => {
      const indexA = FULFILLMENT_ORDER.indexOf(a);
      const indexB = FULFILLMENT_ORDER.indexOf(b);

      const safeA =
        indexA === -1 ? FULFILLMENT_ORDER.length : indexA;

      const safeB =
        indexB === -1 ? FULFILLMENT_ORDER.length : indexB;

      return safeA - safeB;
    });
  }, [productOrderSearchResults]);

  const csvRows = useMemo(
    () =>
      productOrderSearchResults.map((order) => ({
        search_term: searched,
        order_number: order?.orderNumber || "",
        source: order?.source || "website",
        fulfillment_status: order?.fulfillmentStatus || "processing",
        reservation_status: order?.inventoryStatuses?.length
          ? order.inventoryStatuses.join(", ")
          : "none",
      })),
    [productOrderSearchResults, searched]
  );

  const handleSearch = async (e) => {
    e?.preventDefault?.();

    const q = normalizeProductCode(input);

    if (!q) return;

    setSearched(q);

    // New search = collapse everything again
    setExpandedStatuses({});

    await searchProductOrders(q);
  };

  const handleClear = () => {
    setInput("");
    setSearched("");
    setExpandedStatuses({});
    clearProductOrderSearchResults();
  };

  const handleExportCSV = () => {
    if (!csvRows.length) return;

    const safeSearch = String(searched || "search").replace(
      /[^\w-]+/g,
      "_"
    );

    downloadCSV(
      csvRows,
      `product-order-search-${safeSearch}.csv`
    );
  };

  const toggleStatus = (status) => {
    setExpandedStatuses((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  return (
    <div className="min-h-screen bg-zinc-50/40 text-zinc-900">
      <div className="w-full px-4 py-6 md:px-8 lg:px-12">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              <PackageSearch size={14} />
              Product → Order Search
            </div>

            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Search Orders by Product
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Search product name / code and view orders grouped by
              fulfillment status.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!productOrderSearchResults.length}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium hover:bg-zinc-50 disabled:opacity-40"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

        {/* STATS */}
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <StatCard
            icon={Hash}
            label="Normalized"
            value={normalizedInput || "—"}
          />

          <StatCard
            icon={FileText}
            label="Searched"
            value={searched || "—"}
          />

          <StatCard
            icon={PackageSearch}
            label="Orders"
            value={productOrderSearchResults.length}
          />
        </div>

        {/* SEARCH */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 md:flex-row"
        >
          <div className="flex h-12 flex-1 items-center gap-3 rounded-xl border border-zinc-300 px-4 focus-within:border-violet-500">
            <Search size={18} className="text-zinc-400" />

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Product name or code"
              className="h-full w-full bg-transparent text-sm outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 text-sm font-medium text-white disabled:opacity-50"
          >
            <Search size={16} />
            {loading ? "Searching..." : "Search"}
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-300 px-5 text-sm font-medium"
          >
            <RefreshCcw size={16} />
            Clear
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        {/* RESULTS */}
        <div className="mt-6 space-y-5">
          {!loading &&
          searched &&
          !productOrderSearchResults.length ? (
            <div className="rounded-2xl border border-zinc-200 bg-white py-14 text-center">
              <PackageSearch
                size={28}
                className="mx-auto text-zinc-400"
              />

              <p className="mt-3 text-sm font-medium">
                No matching orders found
              </p>
            </div>
          ) : null}

          {groupedOrders.map(([status, orders]) => {
            const isExpanded = Boolean(expandedStatuses[status]);

            const visibleOrders = isExpanded
              ? orders
              : orders.slice(0, DEFAULT_VISIBLE_ORDERS);

            const remainingOrders = Math.max(
              0,
              orders.length - DEFAULT_VISIBLE_ORDERS
            );

            return (
              <section
                key={status}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
              >
                {/* STATUS HEADER */}
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/70 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        FULFILLMENT_STYLES[status] ||
                        "border-zinc-200 bg-white text-zinc-700"
                      }`}
                    >
                      {formatLabel(status)}
                    </span>
                  </div>

                  <span className="text-sm font-semibold text-zinc-500">
                    {orders.length} Orders
                  </span>
                </div>

                {/* ORDERS */}
                <div className="divide-y divide-zinc-100">
                  {visibleOrders.map((order, index) => {
                    const reservations =
                      order?.inventoryStatuses || [];

                    return (
                      <div
                        key={
                          order?._id ||
                          order?.orderNumber ||
                          index
                        }
                        className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
                      >
                        {/* ORDER */}
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                            <Hash size={15} />
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-900">
                              {order?.orderNumber || "—"}
                            </p>

                            <div className="mt-1 flex items-center gap-2">
                              {order?.source === "shopify" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                                  <Store size={11} />
                                  Shopify
                                </span>
                              )}

                              {order?.source !== "shopify" && (
                                <span className="text-[11px] text-zinc-400">
                                  Website
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* RESERVATION */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="mr-1 text-xs font-medium text-zinc-400">
                            Inventory:
                          </span>

                          {reservations.length ? (
                            reservations.map((reservation) => (
                              <ReservationBadge
                                key={reservation}
                                status={reservation}
                              />
                            ))
                          ) : (
                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
                              No Reservation
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* EXPAND / COLLAPSE */}
                {orders.length > DEFAULT_VISIBLE_ORDERS && (
                  <button
                    type="button"
                    onClick={() => toggleStatus(status)}
                    className="flex w-full items-center justify-center gap-2 border-t border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp size={16} />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} />
                        View {remainingOrders} More{" "}
                        {remainingOrders === 1 ? "Order" : "Orders"}
                      </>
                    )}
                  </button>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}