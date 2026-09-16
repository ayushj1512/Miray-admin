"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Box,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";

import { useOrderStore } from "@/store/orderStore";

/* =========================================================
   HELPERS
========================================================= */

const text = (value) => String(value ?? "").trim();

const number = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getCondition = (item = {}) => {
  const wrong = number(item?.wrongQty);
  const damaged = number(item?.damagedQty);

  if (wrong > 0 && damaged > 0) return "mixed";
  if (damaged > 0) return "damaged";
  if (wrong > 0) return "wrong";

  return "clean";
};

const getLogCondition = (log = {}) => {
  if (log?.condition) {
    return text(log.condition).toLowerCase();
  }

  const items = Array.isArray(log?.items) ? log.items : [];

  const hasWrong = items.some(
    (item) => number(item?.wrongQty) > 0
  );

  const hasDamaged = items.some(
    (item) => number(item?.damagedQty) > 0
  );

  if (hasWrong && hasDamaged) return "mixed";
  if (hasDamaged) return "damaged";
  if (hasWrong) return "wrong";

  return "clean";
};

const conditionConfig = {
  clean: {
    label: "Clean",
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  },

  wrong: {
    label: "Wrong",
    className:
      "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  },

  damaged: {
    label: "Damaged",
    className:
      "bg-red-50 text-red-700 ring-1 ring-red-100",
  },

  mixed: {
    label: "Mixed",
    className:
      "bg-orange-50 text-orange-700 ring-1 ring-orange-100",
  },
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function ConditionBadge({ condition }) {
  const key = conditionConfig[condition]
    ? condition
    : "clean";

  const config = conditionConfig[key];

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function QtyBadge({
  value,
  type = "default",
}) {
  const qty = number(value);

  const classes = {
    default: "bg-gray-100 text-gray-700",
    correct: "bg-emerald-50 text-emerald-700",
    wrong: "bg-amber-50 text-amber-700",
    damaged: "bg-red-50 text-red-700",
    received: "bg-blue-50 text-blue-700",
  };

  return (
    <span
      className={`inline-flex min-w-7 justify-center rounded-md px-2 py-1 text-xs font-semibold ${
        classes[type] || classes.default
      }`}
    >
      {qty}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  subtitle,
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.05]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-gray-950">
            {number(value).toLocaleString("en-IN")}
          </p>

          {subtitle ? (
            <p className="mt-1 text-[11px] text-gray-400">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="rounded-lg bg-gray-50 p-2">
          <Icon
            size={17}
            strokeWidth={1.8}
            className="text-gray-600"
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PRODUCT DETAILS
========================================================= */

function ProductDetails({ items = [] }) {
  const safeItems = Array.isArray(items)
    ? items
    : [];

  if (!safeItems.length) {
    return (
      <span className="text-xs text-gray-400">
        No product details
      </span>
    );
  }

  return (
    <div className="min-w-[480px] space-y-2">
      {safeItems.map((item, index) => {
        const condition = getCondition(item);

        const image =
          item?.image ||
          item?.thumbnail ||
          item?.productSnapshot?.thumbnail ||
          item?.productSnapshot?.images?.[0] ||
          "";

        const title =
          item?.title ||
          item?.productTitle ||
          item?.productSnapshot?.title ||
          "Product";

        const code =
          item?.productCode ||
          item?.productSnapshot?.productCode ||
          item?.sku ||
          "—";

        const sku =
          item?.sku ||
          item?.variantSku ||
          item?.variant?.sku ||
          "";

        const size =
          item?.selectedSize ||
          item?.size ||
          "";

        return (
          <div
            key={
              item?.lineId ||
              item?._id ||
              `${code}-${index}`
            }
            className="flex items-center gap-3 rounded-lg bg-gray-50/80 p-2.5"
          >
            <div className="h-14 w-11 shrink-0 overflow-hidden rounded-md bg-white ring-1 ring-black/[0.06]">
              {image ? (
                <img
                  src={image}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Box
                    size={16}
                    className="text-gray-300"
                  />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="max-w-[220px] truncate text-xs font-semibold text-gray-900">
                  {title}
                </p>

                <ConditionBadge
                  condition={condition}
                />
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                <span>
                  Code:{" "}
                  <b className="font-semibold text-gray-700">
                    {code}
                  </b>
                </span>

                {size ? (
                  <span>
                    Size:{" "}
                    <b className="font-semibold text-gray-700">
                      {size}
                    </b>
                  </span>
                ) : null}

                {sku ? (
                  <span>
                    SKU:{" "}
                    <b className="font-semibold text-gray-700">
                      {sku}
                    </b>
                  </span>
                ) : null}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-gray-400">
                  Ordered
                </span>

                <QtyBadge
                  value={
                    item?.orderedQty ??
                    item?.quantity
                  }
                />

                <span className="ml-1 text-[10px] text-gray-400">
                  Received
                </span>

                <QtyBadge
                  value={item?.receivedQty}
                  type="received"
                />

                <span className="ml-1 text-[10px] text-gray-400">
                  Correct
                </span>

                <QtyBadge
                  value={item?.correctQty}
                  type="correct"
                />

                {number(item?.wrongQty) > 0 ? (
                  <>
                    <span className="ml-1 text-[10px] text-gray-400">
                      Wrong
                    </span>

                    <QtyBadge
                      value={item?.wrongQty}
                      type="wrong"
                    />
                  </>
                ) : null}

                {number(item?.damagedQty) > 0 ? (
                  <>
                    <span className="ml-1 text-[10px] text-gray-400">
                      Damaged
                    </span>

                    <QtyBadge
                      value={item?.damagedQty}
                      type="damaged"
                    />
                  </>
                ) : null}
              </div>

              {item?.remark ? (
                <p className="mt-1.5 text-[11px] text-gray-500">
                  {item.remark}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function RtoLogsPage() {
  const {
    rtoLogs,
    rtoLogsSummary,
    rtoLogsPagination,
    loading,
    error,
    fetchRtoLogs,
  } = useOrderStore();

  const [search, setSearch] = useState("");
  const [condition, setCondition] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [page, setPage] = useState(1);

  const limit = 50;

  /* =========================================================
     FETCH
  ========================================================= */

  const loadLogs = useCallback(async () => {
    try {
      await fetchRtoLogs({
        search,
        condition,
        startDate,
        endDate,
        page,
        limit,
      });
    } catch (err) {
      console.error(
        "RTO logs fetch failed:",
        err
      );
    }
  }, [
    fetchRtoLogs,
    search,
    condition,
    startDate,
    endDate,
    page,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadLogs]);

  /* =========================================================
     DATA
  ========================================================= */

  const logs = useMemo(
    () =>
      Array.isArray(rtoLogs)
        ? rtoLogs
        : [],
    [rtoLogs]
  );

  const summary =
    rtoLogsSummary || {};

  const pagination =
    rtoLogsPagination || {};

  const currentPage =
    number(pagination?.page) || page;

  const totalPages = Math.max(
    1,
    number(
      pagination?.pages ??
        pagination?.totalPages
    ) || 1
  );

  const totalRecords = number(
    pagination?.total ??
      pagination?.totalCount
  );

  /* =========================================================
     FILTER ACTIONS
  ========================================================= */

  const resetFilters = () => {
    setSearch("");
    setCondition("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasFilters =
    Boolean(search) ||
    Boolean(condition) ||
    Boolean(startDate) ||
    Boolean(endDate);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
        {/* HEADER */}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <RotateCcw
                size={20}
                strokeWidth={1.8}
              />

              <h1 className="text-xl font-bold tracking-tight text-gray-950">
                RTO Logs
              </h1>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              Complete record of received RTO
              orders and returned inventory.
            </p>
          </div>

          <button
            type="button"
            onClick={loadLogs}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-black px-3 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={
                loading ? "animate-spin" : ""
              }
            />

            Refresh
          </button>
        </div>

        {/* SUMMARY */}

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <SummaryCard
            label="RTO Received"
            value={
              summary?.orders ??
              summary?.totalOrders
            }
            icon={PackageCheck}
            subtitle="Total received orders"
          />

          <SummaryCard
            label="Received Qty"
            value={summary?.receivedQty}
            icon={Box}
            subtitle="Total units received"
          />

          <SummaryCard
            label="Correct Qty"
            value={summary?.correctQty}
            icon={CheckCircle2}
            subtitle="Good inventory"
          />

          <SummaryCard
            label="Wrong Qty"
            value={summary?.wrongQty}
            icon={AlertTriangle}
            subtitle="Wrong items received"
          />

          <SummaryCard
            label="Damaged Qty"
            value={summary?.damagedQty}
            icon={XCircle}
            subtitle="Damaged inventory"
          />
        </div>

        {/* FILTERS */}

        <div className="mb-4 rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/[0.05]">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            {/* SEARCH */}

            <div className="relative min-w-0 flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search order, customer, phone, AWB, product code..."
                className="h-10 w-full rounded-lg bg-gray-50 pl-9 pr-3 text-xs text-gray-900 outline-none ring-1 ring-gray-200 transition focus:bg-white focus:ring-gray-400"
              />
            </div>

            {/* CONDITION */}

            <select
              value={condition}
              onChange={(e) => {
                setCondition(e.target.value);
                setPage(1);
              }}
              className="h-10 min-w-[150px] rounded-lg bg-gray-50 px-3 text-xs font-medium text-gray-700 outline-none ring-1 ring-gray-200 focus:bg-white focus:ring-gray-400"
            >
              <option value="">
                All Conditions
              </option>

              <option value="clean">
                Clean
              </option>

              <option value="wrong">
                Wrong
              </option>

              <option value="damaged">
                Damaged
              </option>

              <option value="mixed">
                Mixed
              </option>
            </select>

            {/* START DATE */}

            <div className="relative">
              <CalendarDays
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-lg bg-gray-50 pl-9 pr-3 text-xs text-gray-700 outline-none ring-1 ring-gray-200 focus:bg-white focus:ring-gray-400"
              />
            </div>

            {/* END DATE */}

            <div className="relative">
              <CalendarDays
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-lg bg-gray-50 pl-9 pr-3 text-xs text-gray-700 outline-none ring-1 ring-gray-200 focus:bg-white focus:ring-gray-400"
              />
            </div>

            {hasFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="h-10 rounded-lg px-3 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {/* ERROR */}

        {error ? (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {/* TABLE */}

        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.05]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1450px] border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Order
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Received At
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Courier
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Products
                  </th>

                  <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Condition
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Remark
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading && !logs.length ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-20 text-center"
                    >
                      <RefreshCw
                        size={20}
                        className="mx-auto animate-spin text-gray-400"
                      />

                      <p className="mt-2 text-xs text-gray-500">
                        Loading RTO logs...
                      </p>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-20 text-center"
                    >
                      <PackageCheck
                        size={28}
                        strokeWidth={1.4}
                        className="mx-auto text-gray-300"
                      />

                      <p className="mt-3 text-sm font-semibold text-gray-700">
                        No RTO logs found
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Try changing the filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log, index) => {
                    const conditionValue =
                      getLogCondition(log);

                    const customerName =
                      log?.customer?.name ||
                      log?.customerName ||
                      "—";

                    const customerPhone =
                      log?.customer?.phone ||
                      log?.customerPhone ||
                      "";

                    const courier =
                      log?.shipment?.courierName ||
                      log?.courierName ||
                      log?.shipment?.provider ||
                      log?.provider ||
                      "—";

                    const awb =
                      log?.shipment?.awb ||
                      log?.awb ||
                      "";

                    return (
                      <tr
                        key={
                          log?._id ||
                          log?.orderId ||
                          `${log?.orderNumber}-${index}`
                        }
                        className="align-top transition hover:bg-gray-50/50 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-gray-100"
                      >
                        {/* ORDER */}

                        <td className="px-4 py-4">
                          <p className="whitespace-nowrap text-sm font-bold text-gray-950">
                            #
                            {log?.orderNumber ||
                              "—"}
                          </p>

                          {log?.paymentMethod ? (
                            <p className="mt-1 text-[11px] uppercase text-gray-400">
                              {log.paymentMethod}
                            </p>
                          ) : null}
                        </td>

                        {/* DATE */}

                        <td className="px-4 py-4">
                          <p className="whitespace-nowrap text-xs font-medium text-gray-700">
                            {formatDate(
                              log?.receivedAt ||
                                log?.rtoReceived
                                  ?.receivedAt
                            )}
                          </p>
                        </td>

                        {/* CUSTOMER */}

                        <td className="px-4 py-4">
                          <p className="max-w-[170px] truncate text-xs font-semibold text-gray-900">
                            {customerName}
                          </p>

                          {customerPhone ? (
                            <p className="mt-1 text-[11px] text-gray-500">
                              {customerPhone}
                            </p>
                          ) : null}
                        </td>

                        {/* COURIER */}

                        <td className="px-4 py-4">
                          <p className="max-w-[160px] text-xs font-semibold text-gray-800">
                            {courier}
                          </p>

                          {awb ? (
                            <p className="mt-1 max-w-[180px] break-all font-mono text-[10px] text-gray-400">
                              AWB: {awb}
                            </p>
                          ) : null}
                        </td>

                        {/* PRODUCTS */}

                        <td className="px-4 py-3">
                          <ProductDetails
                            items={
                              log?.items ||
                              log?.rtoReceived
                                ?.items ||
                              []
                            }
                          />
                        </td>

                        {/* CONDITION */}

                        <td className="px-4 py-4 text-center">
                          <ConditionBadge
                            condition={
                              conditionValue
                            }
                          />
                        </td>

                        {/* REMARK */}

                        <td className="px-4 py-4">
                          <p className="max-w-[220px] whitespace-pre-wrap text-xs leading-5 text-gray-600">
                            {log?.remark ||
                              log?.rtoReceived
                                ?.remark ||
                              "—"}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}

          <div className="flex flex-col gap-3 bg-gray-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              {totalRecords > 0 ? (
                <>
                  <span className="font-semibold text-gray-700">
                    {totalRecords.toLocaleString(
                      "en-IN"
                    )}
                  </span>{" "}
                  RTO records
                </>
              ) : (
                `${logs.length} records`
              )}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={
                  currentPage <= 1 ||
                  loading
                }
                onClick={() =>
                  setPage((prev) =>
                    Math.max(1, prev - 1)
                  )
                }
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-white px-2.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Prev
              </button>

              <span className="min-w-[90px] text-center text-xs font-medium text-gray-500">
                Page{" "}
                <b className="text-gray-900">
                  {currentPage}
                </b>{" "}
                of{" "}
                <b className="text-gray-900">
                  {totalPages}
                </b>
              </span>

              <button
                type="button"
                disabled={
                  currentPage >=
                    totalPages ||
                  loading
                }
                onClick={() =>
                  setPage((prev) =>
                    Math.min(
                      totalPages,
                      prev + 1
                    )
                  )
                }
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-white px-2.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}