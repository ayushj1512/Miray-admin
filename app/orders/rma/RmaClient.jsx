// app/orders/rma/RmaClient.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, RefreshCcw } from "lucide-react";

import OrderStatusDropdown from "@/components/orders/OrderStatusDropdown";
import { useOrderRmaStore } from "@/store/orderRmaStore";

const toStr = (v) => (v == null ? "" : String(v));
const norm = (v) => toStr(v).trim().toLowerCase();

const parseDate = (d) => {
  const dt = d ? new Date(d) : null;
  return dt && !Number.isNaN(dt.getTime()) ? dt : null;
};

const fmtDate = (d) => {
  const dt = parseDate(d);
  return dt ? dt.toLocaleDateString("en-IN") : "-";
};

const todayInput = () => new Date().toISOString().slice(0, 10);

const daysAgoInput = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const STATUS_OPTIONS = [
  "all",
  "requested",
  "approved",
  "rejected",
  "pickup_scheduled",
  "picked",
  "in_transit",
  "received",
  "qc_pass",
  "qc_fail",
  "refund_initiated",
  "refund_completed",
  "replacement_shipped",
  "closed",
];

const TYPE_OPTIONS = ["all", "return", "exchange"];

const FEE_OPTIONS = ["all", "waived", "unpaid", "paid"];

const statusBadge = (statusRaw) => {
  const st = norm(statusRaw);
  if (st === "requested") return "bg-purple-50 text-purple-700 ring-purple-100";
  if (st === "approved") return "bg-green-50 text-green-700 ring-green-100";
  if (st === "rejected") return "bg-red-50 text-red-700 ring-red-100";
  if (st === "pickup_scheduled") return "bg-blue-50 text-blue-700 ring-blue-100";
  if (st === "replacement_shipped") return "bg-amber-50 text-amber-800 ring-amber-100";
  if (st === "closed") return "bg-gray-900 text-white ring-gray-900";
  return "bg-gray-100 text-gray-700 ring-gray-200";
};

const typeBadge = (typeRaw) => {
  const tp = norm(typeRaw);
  if (tp === "exchange") return "bg-amber-50 text-amber-800 ring-amber-100";
  if (tp === "return") return "bg-sky-50 text-sky-700 ring-sky-100";
  return "bg-gray-100 text-gray-700 ring-gray-200";
};

export default function RmaClient() {
  const [expanded, setExpanded] = useState(null);
  const [draftSearch, setDraftSearch] = useState("");

  const {
    rmas,
    loadingRmas,
    rmasError,
    rmaFilters,
    rmaMeta,
    getAdminRmaList,
    refreshAdminRmaList,
  } = useOrderRmaStore();

  const loading = loadingRmas;
  const error = rmasError;

  const fetchWith = useCallback(
    (updates = {}) => {
      return getAdminRmaList({
        ...rmaFilters,
        ...updates,
      });
    },
    [getAdminRmaList, rmaFilters]
  );

  useEffect(() => {
    getAdminRmaList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpand = useCallback((key) => {
    setExpanded((prev) => (prev === key ? null : key));
  }, []);

  const handleSearch = () => {
    fetchWith({
      page: 1,
      search: draftSearch.trim(),
    });
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleQuickRange = (value) => {
    if (value === "today") {
      fetchWith({
        page: 1,
        fromDate: todayInput(),
        toDate: todayInput(),
      });
      return;
    }

    if (value === "7d") {
      fetchWith({
        page: 1,
        fromDate: daysAgoInput(7),
        toDate: todayInput(),
      });
      return;
    }

    if (value === "30d") {
      fetchWith({
        page: 1,
        fromDate: daysAgoInput(30),
        toDate: todayInput(),
      });
      return;
    }

    fetchWith({
      page: 1,
      fromDate: "",
      toDate: "",
    });
  };

  const clearFilters = () => {
    setDraftSearch("");
    getAdminRmaList({
      page: 1,
      limit: 20,
      search: "",
      type: "all",
      status: "all",
      feeStatus: "all",
      fromDate: "",
      toDate: "",
      sortBy: "createdAt",
      sortDir: "desc",
    });
  };

  const pageStart = useMemo(() => {
    if (!rmaMeta?.total) return 0;
    return (Number(rmaMeta.page || 1) - 1) * Number(rmaMeta.limit || 20) + 1;
  }, [rmaMeta]);

  const pageEnd = useMemo(() => {
    const page = Number(rmaMeta?.page || 1);
    const limit = Number(rmaMeta?.limit || 20);
    const total = Number(rmaMeta?.total || 0);
    return Math.min(page * limit, total);
  }, [rmaMeta]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">RMA Requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Search, filter and manage return/exchange requests.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-900">
            {rmaMeta?.total || 0} requests
          </span>

          <button
            type="button"
            onClick={refreshAdminRmaList}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCcw size={14} />
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <label className="text-xs text-gray-500">Search</label>
            <div className="mt-1 flex rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-blue-100">
              <input
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Order #, RMA #, customer, AWB..."
                className="w-full rounded-l-xl px-3 py-2 text-sm outline-none"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="inline-flex items-center justify-center rounded-r-xl bg-gray-900 px-3 text-white hover:bg-black"
                title="Search"
              >
                <Search size={16} />
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="text-xs text-gray-500">From</label>
            <input
              type="date"
              value={rmaFilters.fromDate || ""}
              onChange={(e) =>
                fetchWith({ page: 1, fromDate: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="text-xs text-gray-500">To</label>
            <input
              type="date"
              value={rmaFilters.toDate || ""}
              onChange={(e) => fetchWith({ page: 1, toDate: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Quick</label>
            <select
              onChange={(e) => handleQuickRange(e.target.value)}
              defaultValue="all"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">Type</label>
            <select
              value={rmaFilters.type || "all"}
              onChange={(e) => fetchWith({ page: 1, type: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm capitalize outline-none focus:ring-2 focus:ring-blue-100"
            >
              {TYPE_OPTIONS.map((item) => (
                <option key={item} value={item} className="capitalize">
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">Status</label>
            <select
              value={rmaFilters.status || "all"}
              onChange={(e) => fetchWith({ page: 1, status: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm capitalize outline-none focus:ring-2 focus:ring-blue-100"
            >
              {STATUS_OPTIONS.map((item) => (
                <option key={item} value={item} className="capitalize">
                  {item.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">Fee</label>
            <select
              value={rmaFilters.feeStatus || "all"}
              onChange={(e) =>
                fetchWith({ page: 1, feeStatus: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm capitalize outline-none focus:ring-2 focus:ring-blue-100"
            >
              {FEE_OPTIONS.map((item) => (
                <option key={item} value={item} className="capitalize">
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">Sort</label>
            <select
              value={rmaFilters.sortDir || "desc"}
              onChange={(e) =>
                fetchWith({
                  page: 1,
                  sortBy: "createdAt",
                  sortDir: e.target.value,
                })
              }
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="desc">Newest</option>
              <option value="asc">Oldest</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          Loading RMA requests...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ❌ {toStr(error)}
        </div>
      )}

      {!loading && !rmas?.length && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-10 text-center">
          <p className="font-medium text-gray-600">No RMA requests found</p>
          <p className="mt-1 text-sm text-gray-500">
            Try changing filters or search.
          </p>
        </div>
      )}

      {!loading && rmas?.length > 0 && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr className="border-b border-gray-100">
                  <th className="w-10 p-4 text-left font-semibold" />
                  <th className="p-4 text-left font-semibold">Order #</th>
                  <th className="p-4 text-left font-semibold">RMA #</th>
                  <th className="p-4 text-left font-semibold">Type</th>
                  <th className="p-4 text-left font-semibold">Status</th>
                  <th className="p-4 text-left font-semibold">Customer</th>
                  <th className="p-4 text-left font-semibold">Fee</th>
                  <th className="p-4 text-left font-semibold">Created</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {rmas.map((rma, index) => {
                  const order = rma?.order || {};
                  const customer = rma?.customer || {};
                  const shipping = rma?.shippingAddress || {};
                  const rowKey =
                    rma?.rmaNumber ||
                    `${rma?.orderId || "order"}-${index}`;

                  const isOpen = expanded === rowKey;

                  return (
                    <React.Fragment key={rowKey}>
                      <tr
                        onClick={() => toggleExpand(rowKey)}
                        className={`cursor-pointer transition ${
                          isOpen ? "bg-blue-50/40" : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="p-4 align-middle">
                          <ChevronDown
                            size={18}
                            className={`text-gray-500 transition-transform ${
                              isOpen ? "rotate-180" : "rotate-0"
                            }`}
                          />
                        </td>

                        <td className="p-4 font-medium text-gray-900">
                          {rma?.orderNumber || order?.orderNumber || "-"}
                        </td>

                        <td className="p-4 text-gray-700">
                          {rma?.rmaNumber || "-"}
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ${typeBadge(
                              rma?.type
                            )}`}
                          >
                            {rma?.type || "-"}
                          </span>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ${statusBadge(
                              rma?.status
                            )}`}
                          >
                            {toStr(rma?.status).replaceAll("_", " ") || "-"}
                          </span>
                        </td>

                        <td className="p-4 text-gray-700">
                          {customer?.name || "-"}
                        </td>

                        <td className="p-4 text-gray-700">
                          {Number(rma?.fee?.amount || 0) > 0
                            ? `₹${rma.fee.amount} (${rma.fee.status})`
                            : rma?.fee?.status || "waived"}
                        </td>

                        <td className="p-4 text-gray-500">
                          {fmtDate(rma?.createdAt)}
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="bg-white">
                          <td colSpan={8} className="px-6 py-5">
                            <div className="space-y-5">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-gray-900">
                                  Order, RMA & Pickup Details
                                </p>
                                <span className="text-xs text-gray-500">
                                  Click row again to collapse
                                </span>
                              </div>

                              <div className="grid gap-4 text-xs lg:grid-cols-4">
                                <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100">
                                  <p className="text-gray-500">Order</p>
                                  <p className="mt-2 text-gray-900">
                                    <b>Order #:</b>{" "}
                                    {order?.orderNumber || rma?.orderNumber || "-"}
                                  </p>
                                  <p className="text-gray-700">
                                    <b>Fulfillment:</b>{" "}
                                    {order?.fulfillmentStatus || "-"}
                                  </p>
                                  <p className="text-gray-700">
                                    <b>Payment:</b>{" "}
                                    {order?.paymentMethod || "-"} /{" "}
                                    {order?.paymentStatus || "-"}
                                  </p>
                                  <p className="mt-1 text-gray-900">
                                    <b>Total:</b>{" "}
                                    {order?.finalPayable != null
                                      ? `₹${order.finalPayable}`
                                      : "-"}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100">
                                  <p className="text-gray-500">
                                    Update Order Status
                                  </p>
                                  <div className="mt-2">
                                    <OrderStatusDropdown
                                      orderId={order?._id || rma?.orderId}
                                      currentStatus={order?.fulfillmentStatus}
                                      onUpdated={refreshAdminRmaList}
                                    />
                                  </div>
                                  <p className="mt-2 text-[11px] text-gray-500">
                                    Set to <b>pickup initiated</b> when reverse
                                    pickup starts.
                                  </p>
                                </div>

                                <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100">
                                  <p className="text-gray-500">Customer</p>
                                  <p className="mt-2 font-medium text-gray-900">
                                    {customer?.name || shipping?.fullName || "-"}
                                  </p>
                                  <p className="text-gray-700">
                                    {customer?.phone || shipping?.phone || "-"}
                                  </p>
                                  <p className="text-gray-700">
                                    {customer?.email || shipping?.email || "-"}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100">
                                  <p className="text-gray-500">RMA</p>
                                  <p className="mt-2 text-gray-900">
                                    <b>Reason:</b> {rma?.reason || "-"}
                                  </p>
                                  <p className="text-gray-700">
                                    <b>Resolution:</b>{" "}
                                    {rma?.resolution || "-"}
                                  </p>
                                  <p className="text-gray-700">
                                    <b>Note:</b> {rma?.customerNote || "-"}
                                  </p>
                                  {Number(rma?.fee?.amount || 0) > 0 && (
                                    <p className="mt-2 font-medium text-blue-700">
                                      Exchange Fee: ₹{rma.fee.amount} (
                                      {rma.fee.status})
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-xl bg-white p-4 ring-1 ring-gray-100">
                                  <p className="mb-3 text-xs font-semibold text-gray-900">
                                    RMA Items
                                  </p>

                                  {!rma?.items?.length ? (
                                    <p className="text-xs text-gray-500">
                                      No RMA items found.
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {rma.items.map((it, idx) => {
                                        const original = it?.orderItem || {};
                                        const title =
                                          it?.title ||
                                          original?.productSnapshot?.title ||
                                          "Item";

                                        const image =
                                          original?.productSnapshot?.thumbnail ||
                                          original?.productSnapshot?.images?.[0] ||
                                          "";

                                        return (
                                          <div
                                            key={`${rowKey}-rmaItem-${idx}`}
                                            className="flex gap-3 rounded-lg bg-gray-50 px-3 py-2"
                                          >
                                            {image ? (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img
                                                src={image}
                                                alt={title}
                                                className="h-14 w-11 rounded-lg object-cover"
                                              />
                                            ) : null}

                                            <div className="min-w-0 flex-1">
                                              <p className="font-medium text-gray-900">
                                                {title}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                RMA Qty: {it?.quantity || 1}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                Size:{" "}
                                                {original?.selectedSize || "-"} ·
                                                Color:{" "}
                                                {original?.selectedColor || "-"}
                                              </p>
                                            </div>

                                            <div className="text-right text-xs text-gray-600">
                                              <p>
                                                {it?.variantSku
                                                  ? `SKU: ${it.variantSku}`
                                                  : "-"}
                                              </p>
                                              <p className="mt-1 font-semibold text-gray-900">
                                                ₹
                                                {original?.subtotal ??
                                                  original?.price ??
                                                  0}
                                              </p>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                <div className="rounded-xl bg-white p-4 ring-1 ring-gray-100">
                                  <p className="mb-3 text-xs font-semibold text-gray-900">
                                    Pickup / Exchange / Refund
                                  </p>

                                  <div className="space-y-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                                    <p>
                                      <b>AWB:</b>{" "}
                                      {rma?.reverseShipment?.awb || "-"}
                                    </p>
                                    <p>
                                      <b>Courier:</b>{" "}
                                      {rma?.reverseShipment?.courierName || "-"}
                                    </p>
                                    <p>
                                      <b>Tracking:</b>{" "}
                                      {rma?.reverseShipment?.trackingUrl ? (
                                        <a
                                          href={rma.reverseShipment.trackingUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-blue-700 underline"
                                        >
                                          Open
                                        </a>
                                      ) : (
                                        "-"
                                      )}
                                    </p>
                                    <p>
                                      <b>Refund:</b>{" "}
                                      {rma?.refund?.status || "not_started"} /{" "}
                                      {rma?.refund?.mode || "-"}
                                    </p>
                                    <p>
                                      <b>Exchange SKU:</b>{" "}
                                      {rma?.exchangeRequest?.variantSku || "-"}
                                    </p>

                                    {rma?.type === "exchange" && (
  <>
    <p>
      <b>Ordered Size:</b>{" "}
      {rma?.items?.[0]?.orderItem?.selectedSize || "-"}
    </p>

    <p className="font-semibold text-blue-700">
      <b>Requested Size:</b>{" "}
      {rma?.exchangeRequest?.attributes?.[0]?.value?.toUpperCase() || "-"}
    </p>
  </>
)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-900">{pageStart}</span>-
              <span className="font-medium text-gray-900">{pageEnd}</span> of{" "}
              <span className="font-medium text-gray-900">
                {rmaMeta?.total || 0}
              </span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={Number(rmaMeta?.page || 1) <= 1 || loading}
                onClick={() =>
                  fetchWith({
                    page: Math.max(1, Number(rmaMeta?.page || 1) - 1),
                  })
                }
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>

              <span className="text-xs text-gray-500">
                Page {rmaMeta?.page || 1} / {rmaMeta?.totalPages || 1}
              </span>

              <button
                type="button"
                disabled={!rmaMeta?.hasMore || loading}
                onClick={() =>
                  fetchWith({
                    page: Number(rmaMeta?.page || 1) + 1,
                  })
                }
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}