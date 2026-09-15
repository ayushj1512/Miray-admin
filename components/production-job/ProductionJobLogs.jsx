"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  Download,
  RefreshCw,
  Package,
  CheckCircle2,
  Clock3,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  CalendarDays,
  UserRound,
  Boxes,
} from "lucide-react";

import * as XLSX from "xlsx";

import useTailorProductionJobStore from "@/store/useTailorProductionJobStore";

/* =========================================================
   OPTIONS
========================================================= */

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "assigned", label: "Assigned" },
  {
    value: "partially_received",
    label: "Partially Received",
  },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const WORK_TYPES = [
  { value: "", label: "All Work Types" },
  { value: "sampling", label: "Sampling" },
  { value: "pattern", label: "Pattern" },
  { value: "cutting", label: "Cutting" },
  { value: "stitching", label: "Stitching" },
  { value: "finishing", label: "Finishing" },
  { value: "full_garment", label: "Full Garment" },
];

const initialFilters = {
  search: "",
  status: "",
  workType: "",
  dateFrom: "",
  dateTo: "",
};

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (value, withTime = false) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  }).format(date);
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const labelize = (value = "") =>
  String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );

const getPendingQuantity = (job) =>
  Math.max(
    0,
    Number(job?.totalQuantity || 0) -
      Number(
        job?.totalReceivedQuantity || 0,
      ),
  );

const getStatusStyle = (status) => {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700";

    case "partially_received":
      return "bg-amber-50 text-amber-700";

    case "cancelled":
      return "bg-rose-50 text-rose-600";

    default:
      return "bg-blue-50 text-blue-700";
  }
};

const getProductDetails = (item) => ({
  name:
    item?.product?.title ||
    item?.productTitle ||
    "Product",

  code:
    item?.product?.productCode ||
    item?.productCode ||
    "—",

  image:
    item?.product?.thumbnail ||
    item?.productThumbnail ||
    "",
});

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}) {
  return (
    <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">
            {label}
          </p>

          <p className="mt-2 text-xl font-semibold tracking-tight text-neutral-900">
            {value}
          </p>

          {sub && (
            <p className="mt-1 text-xs text-neutral-400">
              {sub}
            </p>
          )}
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
          <Icon size={17} />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyState({ onReset }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-5 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
        <Boxes
          size={21}
          className="text-neutral-500"
        />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-neutral-900">
        No production logs found
      </h3>

      <p className="mt-1 max-w-sm text-xs leading-5 text-neutral-500">
        Try changing search, status, work type
        or date filters.
      </p>

      <button
        onClick={onReset}
        className="mt-4 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-medium text-white hover:bg-black"
      >
        Clear filters
      </button>
    </div>
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ProductionJobLogs({
  title = "Production Logs",
  description = "Track production assignments, receiving progress and completion.",
  defaultLimit = 30,
  compact = false,
}) {
  const {
    productionLogs,
    logsLoading,
    logsPagination,
    fetchProductionLogs,
  } = useTailorProductionJobStore();

  const [filters, setFilters] =
    useState(initialFilters);

  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState(initialFilters);

  /* =======================================================
     LOAD
  ======================================================= */

  const loadLogs = useCallback(
    async (extra = {}) => {
      try {
        await fetchProductionLogs({
          ...appliedFilters,
          page: extra.page || 1,
          limit: defaultLimit,
        });
      } catch (error) {
        console.error(
          "Production logs:",
          error,
        );
      }
    },
    [
      appliedFilters,
      defaultLimit,
      fetchProductionLogs,
    ],
  );

  useEffect(() => {
    loadLogs({ page: 1 });
  }, [loadLogs]);

  /* =======================================================
     FILTERS
  ======================================================= */

  const applyFilters = () => {
    setAppliedFilters(filters);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const hasFilters =
    Object.values(filters).some(Boolean);

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      applyFilters();
    }
  };

  /* =======================================================
     STATS
  ======================================================= */

  const stats = useMemo(() => {
    return (productionLogs || []).reduce(
      (acc, job) => {
        acc.assigned +=
          Number(job.totalQuantity) || 0;

        acc.received +=
          Number(
            job.totalReceivedQuantity,
          ) || 0;

        acc.pending +=
          getPendingQuantity(job);

        acc.amount +=
          Number(job.totalAmount) || 0;

        return acc;
      },
      {
        assigned: 0,
        received: 0,
        pending: 0,
        amount: 0,
      },
    );
  }, [productionLogs]);

  /* =======================================================
     EXCEL
  ======================================================= */

  const downloadExcel = () => {
    if (!productionLogs?.length) return;

    const rows = [];

    productionLogs.forEach((job) => {
      const products = job.products || [];

      if (!products.length) {
        rows.push({
          "Job Number":
            job.jobNumber || "",
          "Tailor Code":
            job.tailorSnapshot
              ?.tailorCode || "",
          "Tailor Name":
            job.tailorSnapshot?.name || "",
          Mobile:
            job.tailorSnapshot?.mobile ||
            "",
          "Work Type": labelize(
            job.workType,
          ),
          Status: labelize(job.status),
          Product: "",
          "Product Code": "",
          Size: "",
          Assigned:
            job.totalQuantity || 0,
          Received:
            job.totalReceivedQuantity ||
            0,
          Pending:
            getPendingQuantity(job),
          Rate: "",
          Amount: job.totalAmount || 0,
          "Assigned Date": formatDate(
            job.assignedAt,
          ),
          "Expected Date": formatDate(
            job.expectedAt,
          ),
          "Last Received": formatDate(
            job.lastReceivedAt,
            true,
          ),
          "Created At": formatDate(
            job.createdAt,
            true,
          ),
          "Updated At": formatDate(
            job.updatedAt,
            true,
          ),
          Notes: job.notes || "",
        });

        return;
      }

      products.forEach((item) => {
        const productDetails =
          getProductDetails(item);

        const sizes = item.sizes || [];

        if (!sizes.length) {
          rows.push({
            "Job Number":
              job.jobNumber || "",

            "Tailor Code":
              job.tailorSnapshot
                ?.tailorCode || "",

            "Tailor Name":
              job.tailorSnapshot?.name ||
              "",

            Mobile:
              job.tailorSnapshot?.mobile ||
              "",

            "Work Type": labelize(
              job.workType,
            ),

            Status: labelize(job.status),

            Product:
              productDetails.name,

            "Product Code":
              productDetails.code,

            Size: "",

            Assigned:
              item.quantity || 0,

            Received:
              item.receivedQuantity || 0,

            Pending: Math.max(
              0,
              Number(item.quantity || 0) -
                Number(
                  item.receivedQuantity ||
                    0,
                ),
            ),

            Rate: item.workRate || 0,

            Amount: item.amount || 0,

            "Assigned Date": formatDate(
              job.assignedAt,
            ),

            "Expected Date": formatDate(
              job.expectedAt,
            ),

            "Last Received": formatDate(
              item.lastReceivedAt,
              true,
            ),

            "Created At": formatDate(
              job.createdAt,
              true,
            ),

            "Updated At": formatDate(
              job.updatedAt,
              true,
            ),

            Notes: job.notes || "",
          });

          return;
        }

        sizes.forEach((size) => {
          rows.push({
            "Job Number":
              job.jobNumber || "",

            "Tailor Code":
              job.tailorSnapshot
                ?.tailorCode || "",

            "Tailor Name":
              job.tailorSnapshot?.name ||
              "",

            Mobile:
              job.tailorSnapshot?.mobile ||
              "",

            "Work Type": labelize(
              job.workType,
            ),

            Status: labelize(job.status),

            Product:
              productDetails.name,

            "Product Code":
              productDetails.code,

            Size: size.size || "",

            Assigned:
              size.quantity || 0,

            Received:
              size.receivedQuantity || 0,

            Pending: Math.max(
              0,
              Number(size.quantity || 0) -
                Number(
                  size.receivedQuantity ||
                    0,
                ),
            ),

            Rate: item.workRate || 0,

            Amount:
              Number(size.quantity || 0) *
              Number(item.workRate || 0),

            "Assigned Date": formatDate(
              job.assignedAt,
            ),

            "Expected Date": formatDate(
              job.expectedAt,
            ),

            "Last Received": formatDate(
              size.lastReceivedAt,
              true,
            ),

            "Created At": formatDate(
              job.createdAt,
              true,
            ),

            "Updated At": formatDate(
              job.updatedAt,
              true,
            ),

            Notes: job.notes || "",
          });
        });
      });
    });

    const worksheet =
      XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 14 },
      { wch: 22 },
      { wch: 15 },
      { wch: 18 },
      { wch: 20 },
      { wch: 32 },
      { wch: 16 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 35 },
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Production Logs",
    );

    XLSX.writeFile(
      workbook,
      `production-logs-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`,
    );
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <section
      className={
        compact
          ? "w-full"
          : "min-h-screen w-full bg-[#f7f7f7] p-3 sm:p-5 lg:p-6"
      }
    >
      {/* FULL WIDTH - NO MAX WIDTH */}
      <div className="w-full">
        {/* HEADER */}

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              Production
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
              {title}
            </h1>

            <p className="mt-1 text-sm text-neutral-500">
              {description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                loadLogs({
                  page:
                    logsPagination?.page ||
                    1,
                })
              }
              disabled={logsLoading}
              className="flex h-10 items-center gap-2 rounded-xl bg-white px-3.5 text-xs font-medium text-neutral-700 shadow-sm ring-1 ring-black/[0.04] transition hover:bg-neutral-50 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  logsLoading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              onClick={downloadExcel}
              disabled={
                logsLoading ||
                !productionLogs?.length
              }
              className="flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-xs font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={15} />
              Excel
            </button>
          </div>
        </div>

        {/* STATS */}

        <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <StatCard
            icon={Package}
            label="Assigned"
            value={stats.assigned}
            sub="Current page"
          />

          <StatCard
            icon={CheckCircle2}
            label="Received"
            value={stats.received}
            sub="Inventory received"
          />

          <StatCard
            icon={Clock3}
            label="Pending"
            value={stats.pending}
            sub="Yet to receive"
          />

          <StatCard
            icon={IndianRupee}
            label="Job Value"
            value={formatMoney(
              stats.amount,
            )}
            sub="Current page"
          />
        </div>

        {/* FILTERS */}

        <div className="mb-4 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/[0.04]">
          <div className="flex flex-col gap-2 xl:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />

              <input
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    search:
                      e.target.value,
                  }))
                }
                onKeyDown={
                  handleSearchKeyDown
                }
                placeholder="Job no, product code, tailor..."
                className="h-10 w-full rounded-xl bg-neutral-50 pl-9 pr-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:bg-neutral-100"
              />
            </div>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
              className="h-10 rounded-xl bg-neutral-50 px-3 text-xs font-medium text-neutral-700 outline-none"
            >
              {STATUS_OPTIONS.map(
                (item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ),
              )}
            </select>

            <select
              value={filters.workType}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  workType:
                    e.target.value,
                }))
              }
              className="h-10 rounded-xl bg-neutral-50 px-3 text-xs font-medium text-neutral-700 outline-none"
            >
              {WORK_TYPES.map(
                (item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ),
              )}
            </select>

            <div className="flex items-center gap-1.5 rounded-xl bg-neutral-50 px-3">
              <CalendarDays
                size={14}
                className="shrink-0 text-neutral-400"
              />

              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateFrom:
                      e.target.value,
                  }))
                }
                className="h-10 min-w-0 bg-transparent text-xs text-neutral-600 outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 rounded-xl bg-neutral-50 px-3">
              <CalendarDays
                size={14}
                className="shrink-0 text-neutral-400"
              />

              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateTo:
                      e.target.value,
                  }))
                }
                className="h-10 min-w-0 bg-transparent text-xs text-neutral-600 outline-none"
              />
            </div>

            <button
              onClick={applyFilters}
              className="h-10 rounded-xl bg-neutral-900 px-5 text-xs font-medium text-white transition hover:bg-black"
            >
              Apply
            </button>

            {hasFilters && (
              <button
                onClick={resetFilters}
                title="Clear filters"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-900"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04]">
          {logsLoading &&
          !productionLogs?.length ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Loading production logs...
              </div>
            </div>
          ) : !productionLogs?.length ? (
            <EmptyState
              onReset={resetFilters}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1280px]">
                  <thead>
                    <tr className="bg-neutral-50/80">
                      {[
                        "Job",
                        "Tailor",
                        "Products",
                        "Work",
                        "Assigned",
                        "Received",
                        "Pending",
                        "Amount",
                        "Status",
                        "Expected",
                        "Updated",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {productionLogs.map(
                      (job, index) => {
                        const pending =
                          getPendingQuantity(
                            job,
                          );

                        return (
                          <tr
                            key={job._id}
                            className={`transition hover:bg-neutral-50/70 ${
                              index !==
                              productionLogs.length -
                                1
                                ? "border-b border-neutral-100"
                                : ""
                            }`}
                          >
                            {/* JOB */}

                            <td className="px-4 py-4 align-top">
                              <p className="whitespace-nowrap text-sm font-semibold text-neutral-900">
                                {job.jobNumber ||
                                  "—"}
                              </p>

                              <p className="mt-1 whitespace-nowrap text-[11px] text-neutral-400">
                                {formatDate(
                                  job.assignedAt,
                                )}
                              </p>
                            </td>

                            {/* TAILOR */}

                            <td className="px-4 py-4 align-top">
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                                  <UserRound
                                    size={13}
                                    className="text-neutral-500"
                                  />
                                </div>

                                <div>
                                  <p className="whitespace-nowrap text-sm font-medium text-neutral-800">
                                    {job
                                      .tailorSnapshot
                                      ?.name ||
                                      "—"}
                                  </p>

                                  <p className="mt-0.5 text-[11px] text-neutral-400">
                                    {job
                                      .tailorSnapshot
                                      ?.tailorCode ||
                                      "No code"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* PRODUCTS */}

                            <td className="px-4 py-4 align-top">
                              <div className="flex flex-col gap-2">
                                {(
                                  job.products ||
                                  []
                                )
                                  .slice(0, 3)
                                  .map(
                                    (
                                      item,
                                      productIndex,
                                    ) => {
                                      const {
                                        name,
                                        code,
                                        image,
                                      } =
                                        getProductDetails(
                                          item,
                                        );

                                      return (
                                        <div
                                          key={
                                            item
                                              ?.product
                                              ?._id ||
                                            item?._id ||
                                            `${code}-${productIndex}`
                                          }
                                          className="flex min-w-[220px] items-center gap-2.5"
                                        >
                                          <div className="h-11 w-9 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                                            {image ? (
                                              <img
                                                src={
                                                  image
                                                }
                                                alt={
                                                  name
                                                }
                                                loading="lazy"
                                                className="h-full w-full object-cover"
                                              />
                                            ) : (
                                              <div className="flex h-full w-full items-center justify-center">
                                                <Package
                                                  size={
                                                    14
                                                  }
                                                  className="text-neutral-300"
                                                />
                                              </div>
                                            )}
                                          </div>

                                          <div className="min-w-0">
                                            <p
                                              title={
                                                name
                                              }
                                              className="max-w-[220px] truncate text-xs font-medium text-neutral-800"
                                            >
                                              {
                                                name
                                              }
                                            </p>

                                            <p className="mt-0.5 text-[10px] font-medium text-neutral-400">
                                              #
                                              {
                                                code
                                              }
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    },
                                  )}

                                {(job.products ||
                                  []).length >
                                  3 && (
                                  <p className="pl-[46px] text-[10px] font-medium text-neutral-400">
                                    +
                                    {job
                                      .products
                                      .length -
                                      3}{" "}
                                    more products
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* WORK */}

                            <td className="px-4 py-4 align-top text-xs font-medium text-neutral-600">
                              {labelize(
                                job.workType,
                              )}
                            </td>

                            {/* ASSIGNED */}

                            <td className="px-4 py-4 align-top">
                              <span className="text-sm font-semibold text-neutral-900">
                                {Number(
                                  job.totalQuantity,
                                ) || 0}
                              </span>
                            </td>

                            {/* RECEIVED */}

                            <td className="px-4 py-4 align-top">
                              <span className="text-sm font-semibold text-emerald-600">
                                {Number(
                                  job.totalReceivedQuantity,
                                ) || 0}
                              </span>
                            </td>

                            {/* PENDING */}

                            <td className="px-4 py-4 align-top">
                              <span
                                className={`text-sm font-semibold ${
                                  pending >
                                  0
                                    ? "text-amber-600"
                                    : "text-neutral-400"
                                }`}
                              >
                                {pending}
                              </span>
                            </td>

                            {/* AMOUNT */}

                            <td className="px-4 py-4 align-top whitespace-nowrap text-sm font-medium text-neutral-800">
                              {formatMoney(
                                job.totalAmount,
                              )}
                            </td>

                            {/* STATUS */}

                            <td className="px-4 py-4 align-top">
                              <span
                                className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStatusStyle(
                                  job.status,
                                )}`}
                              >
                                {labelize(
                                  job.status,
                                )}
                              </span>
                            </td>

                            {/* EXPECTED */}

                            <td className="px-4 py-4 align-top">
                              <p className="whitespace-nowrap text-xs font-medium text-neutral-600">
                                {formatDate(
                                  job.expectedAt,
                                )}
                              </p>
                            </td>

                            {/* UPDATED */}

                            <td className="px-4 py-4 align-top">
                              <p className="whitespace-nowrap text-xs text-neutral-500">
                                {formatDate(
                                  job.updatedAt,
                                  true,
                                )}
                              </p>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}

              <div className="flex flex-col gap-3 bg-neutral-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-neutral-500">
                  Showing{" "}
                  <span className="font-medium text-neutral-800">
                    {
                      productionLogs.length
                    }
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-neutral-800">
                    {logsPagination?.total ||
                      0}
                  </span>{" "}
                  production jobs
                </p>

                <div className="flex items-center gap-2">
                  <span className="mr-2 text-xs text-neutral-400">
                    Page{" "}
                    {logsPagination?.page ||
                      1}{" "}
                    of{" "}
                    {logsPagination?.totalPages ||
                      1}
                  </span>

                  <button
                    disabled={
                      logsLoading ||
                      (logsPagination?.page ||
                        1) <= 1
                    }
                    onClick={() =>
                      loadLogs({
                        page:
                          (logsPagination?.page ||
                            1) - 1,
                      })
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-neutral-600 shadow-sm transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft
                      size={15}
                    />
                  </button>

                  <button
                    disabled={
                      logsLoading ||
                      (logsPagination?.page ||
                        1) >=
                        (logsPagination?.totalPages ||
                          1)
                    }
                    onClick={() =>
                      loadLogs({
                        page:
                          (logsPagination?.page ||
                            1) + 1,
                      })
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-neutral-600 shadow-sm transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronRight
                      size={15}
                    />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}