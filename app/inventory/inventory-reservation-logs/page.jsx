"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Archive,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  Timer,
  XCircle,
} from "lucide-react";

import { useInventoryReservationStore } from "@/store/inventoryReservationStore";

/* =========================================================
   HELPERS
========================================================= */

const STATUS_META = {
  pending: {
    label: "Pending",
    icon: Clock3,
    className: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  reserved: {
    label: "Reserved",
    icon: Archive,
    className: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  consumed: {
    label: "Consumed",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  released: {
    label: "Released",
    icon: RotateCcw,
    className: "bg-gray-100 text-gray-700",
    dot: "bg-gray-500",
  },
  expired: {
    label: "Expired",
    icon: XCircle,
    className: "bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
};

const fmtDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fmtDuration = (minutes) => {
  if (minutes == null) return "—";

  const value = Math.max(0, Number(minutes) || 0);

  if (value < 60) return `${value}m`;

  const hours = Math.floor(value / 60);
  const mins = value % 60;

  if (hours < 24) {
    return `${hours}h ${mins ? `${mins}m` : ""}`.trim();
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return `${days}d ${
    remainingHours ? `${remainingHours}h` : ""
  }`.trim();
};

const getFinalTime = (row) =>
  row?.timestamps?.consumedAt ||
  row?.timestamps?.releasedAt ||
  row?.timestamps?.expiredAt ||
  null;

/* =========================================================
   COMPONENTS
========================================================= */

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">
            {value}
          </p>

          {sub ? (
            <p className="mt-1 text-xs text-gray-400">
              {sub}
            </p>
          ) : null}
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50">
          <Icon className="h-4 w-4 text-gray-600" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const meta =
    STATUS_META[status] || STATUS_META.pending;

  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function TimelinePoint({
  label,
  value,
  active = false,
  last = false,
}) {
  return (
    <div className="relative flex gap-3">
      {!last && (
        <div className="absolute left-[5px] top-3 h-full w-px bg-gray-200" />
      )}

      <div
        className={`relative z-10 mt-1 h-[11px] w-[11px] shrink-0 rounded-full ${
          active
            ? "bg-black"
            : value
              ? "bg-gray-400"
              : "bg-gray-200"
        }`}
      />

      <div className={last ? "" : "pb-4"}>
        <p className="text-xs font-medium text-gray-800">
          {label}
        </p>

        <p className="mt-0.5 text-[11px] text-gray-400">
          {fmtDate(value)}
        </p>
      </div>
    </div>
  );
}

function ReservationCard({ row }) {
  const product = row?.product || {};
  const reservation = row?.reservation || {};
  const timestamps = row?.timestamps || {};
  const durations = row?.durations || {};

  const finalAt = getFinalTime(row);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
        {/* PRODUCT */}

        <div className="flex min-w-0 gap-3 lg:w-[30%]">
          <div className="h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
            {product.image ? (
              <img
                src={product.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-5 w-5 text-gray-300" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="mb-1">
              <StatusBadge
                status={reservation.status}
              />
            </div>

            <p className="truncate text-sm font-semibold text-gray-950">
              {product.title || "Product"}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {product.code || "—"}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {product.size && (
                <span className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-medium">
                  {product.size}
                </span>
              )}

              {product.color && (
                <span className="rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-medium">
                  {product.color}
                </span>
              )}

              <span className="rounded-lg bg-gray-950 px-2 py-1 text-[10px] font-semibold text-white">
                Qty {reservation.qty || 0}
              </span>
            </div>
          </div>
        </div>

        {/* REFERENCE */}

        <div className="lg:w-[20%]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Reference
          </p>

          <p className="mt-2 text-sm font-semibold text-gray-900">
            {reservation.orderNumber ||
              reservation.refType ||
              "—"}
          </p>

          <p className="mt-1 text-xs capitalize text-gray-500">
            {reservation.refType || "—"}
          </p>

          {reservation.notes ? (
            <p className="mt-3 line-clamp-3 text-[11px] leading-5 text-gray-400">
              {reservation.notes}
            </p>
          ) : null}
        </div>

        {/* TIMELINE */}

        <div className="lg:w-[27%]">
          <TimelinePoint
            label="Created / Pending"
            value={
              timestamps.pendingAt ||
              timestamps.createdAt
            }
            active={reservation.status === "pending"}
          />

          <TimelinePoint
            label="Reserved"
            value={timestamps.reservedAt}
            active={reservation.status === "reserved"}
          />

          <TimelinePoint
            label={
              reservation.status === "released"
                ? "Released"
                : reservation.status === "expired"
                  ? "Expired"
                  : "Consumed"
            }
            value={finalAt}
            active={[
              "consumed",
              "released",
              "expired",
            ].includes(reservation.status)}
            last
          />
        </div>

        {/* DURATIONS */}

        <div className="lg:w-[18%]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Timing
          </p>

          <div className="mt-2 space-y-2">
            <Timing
              label="Pending"
              value={fmtDuration(
                durations.pendingMinutes
              )}
            />

            <Timing
              label="Reserved"
              value={fmtDuration(
                durations.reservedMinutes
              )}
            />

            <Timing
              label="Lifecycle"
              value={fmtDuration(
                durations.lifecycleMinutes
              )}
              strong
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Timing({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-gray-500">
        {label}
      </span>

      <span
        className={`text-xs ${
          strong
            ? "font-semibold text-gray-950"
            : "font-medium text-gray-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function InventoryReservationLogsPage() {
  const {
    productTimeline,
    productTimelineLoading,
    fetchProductTimeline,
    clearProductTimeline,
    error,
    clearError,
  } = useInventoryReservationStore();

  const [productId, setProductId] =
    useState("");

  const [filters, setFilters] = useState({
    variantId: "",
    status: "",
    refType: "",
    orderNumber: "",
    from: "",
    to: "",
    page: 1,
    limit: 50,
  });

  const data = productTimeline?.data || [];
  const stats = productTimeline?.stats || {};
  const stock = productTimeline?.stock || {};
  const pagination =
    productTimeline?.pagination || {};

  const load = async (
    nextFilters = filters
  ) => {
    const id = productId.trim();

    if (!id) return;

    try {
      await fetchProductTimeline(
        id,
        nextFilters
      );
    } catch {}
  };

  const changeFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const reset = () => {
    const next = {
      variantId: "",
      status: "",
      refType: "",
      orderNumber: "",
      from: "",
      to: "",
      page: 1,
      limit: 50,
    };

    setFilters(next);

    if (productId.trim()) {
      load(next);
    }
  };

  const goPage = (page) => {
    const next = {
      ...filters,
      page,
    };

    setFilters(next);
    load(next);
  };

  const statusCards = useMemo(
    () => [
      {
        key: "pending",
        icon: Clock3,
      },
      {
        key: "reserved",
        icon: Archive,
      },
      {
        key: "consumed",
        icon: CheckCircle2,
      },
      {
        key: "released",
        icon: RotateCcw,
      },
      {
        key: "expired",
        icon: XCircle,
      },
    ],
    []
  );

  useEffect(() => {
    return () => {
      clearProductTimeline?.();
    };
  }, [clearProductTimeline]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1600px] p-4 md:p-6">
        {/* HEADER */}

        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />

              <h1 className="text-xl font-semibold tracking-tight text-gray-950 md:text-2xl">
                Inventory Reservation Logs
              </h1>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              Complete reservation lifecycle,
              stock and timing history.
            </p>
          </div>

          {productTimeline && (
            <button
              onClick={() => load()}
              disabled={
                productTimelineLoading
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  productTimelineLoading
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </button>
          )}
        </div>

        {/* PRODUCT SEARCH */}

        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-medium text-gray-700">
            Product ID
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                value={productId}
                onChange={(e) =>
                  setProductId(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    load();
                  }
                }}
                placeholder="Paste product MongoDB ID..."
                className="h-10 w-full rounded-xl bg-gray-50 pl-9 pr-3 text-sm outline-none ring-1 ring-gray-100 transition focus:ring-gray-300"
              />
            </div>

            <button
              onClick={() => load()}
              disabled={
                !productId.trim() ||
                productTimelineLoading
              }
              className="h-10 rounded-xl bg-black px-5 text-xs font-semibold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {productTimelineLoading
                ? "Loading..."
                : "View History"}
            </button>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">
            <span>{error}</span>

            <button
              onClick={clearError}
              className="font-semibold"
            >
              Close
            </button>
          </div>
        )}

        {/* EMPTY INITIAL */}

        {!productTimeline &&
          !productTimelineLoading && (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl bg-white text-center shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                <Timer className="h-5 w-5 text-gray-500" />
              </div>

              <h2 className="mt-4 text-sm font-semibold text-gray-900">
                Select a product
              </h2>

              <p className="mt-1 max-w-sm text-xs leading-5 text-gray-400">
                Enter a product ID to view
                reservation history and lifecycle
                timings.
              </p>
            </div>
          )}

        {/* LOADING */}

        {productTimelineLoading &&
          !productTimeline && (
            <div className="flex min-h-[420px] items-center justify-center">
              <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          )}

        {/* CONTENT */}

        {productTimeline && (
          <>
            {/* PRODUCT */}

            <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-16 w-14 overflow-hidden rounded-xl bg-gray-100">
                  {productTimeline?.product
                    ?.image ? (
                    <img
                      src={
                        productTimeline.product
                          .image
                      }
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-gray-950">
                    {productTimeline?.product
                      ?.title || "Product"}
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    {productTimeline?.product
                      ?.productCode || "—"}
                  </p>

                  {productTimeline?.variant && (
                    <p className="mt-1 text-[11px] text-gray-400">
                      {productTimeline.variant
                        .size || ""}
                      {productTimeline.variant
                        .color
                        ? ` · ${productTimeline.variant.color}`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* STOCK */}

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="Physical Stock"
                value={stock.stock || 0}
                icon={Package}
              />

              <StatCard
                label="Reserved Stock"
                value={
                  stock.reservedStock || 0
                }
                icon={Archive}
              />

              <StatCard
                label="Available"
                value={
                  stock.availableStock || 0
                }
                icon={CheckCircle2}
              />

              <StatCard
                label="Total Reservations"
                value={
                  stats.totalReservations ||
                  0
                }
                sub={`${stats.totalQty || 0} units`}
                icon={Activity}
              />
            </div>

            {/* STATUS SUMMARY */}

            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              {statusCards.map(
                ({ key, icon }) => (
                  <StatCard
                    key={key}
                    label={
                      STATUS_META[key].label
                    }
                    value={
                      stats?.[key]
                        ?.reservations || 0
                    }
                    sub={`${
                      stats?.[key]?.qty || 0
                    } units`}
                    icon={icon}
                  />
                )
              )}
            </div>

            {/* FILTERS */}

            <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
                <select
                  value={filters.status}
                  onChange={(e) =>
                    changeFilter(
                      "status",
                      e.target.value
                    )
                  }
                  className="h-10 rounded-xl bg-gray-50 px-3 text-xs outline-none"
                >
                  <option value="">
                    All Status
                  </option>
                  <option value="pending">
                    Pending
                  </option>
                  <option value="reserved">
                    Reserved
                  </option>
                  <option value="consumed">
                    Consumed
                  </option>
                  <option value="released">
                    Released
                  </option>
                  <option value="expired">
                    Expired
                  </option>
                </select>

                <select
                  value={filters.refType}
                  onChange={(e) =>
                    changeFilter(
                      "refType",
                      e.target.value
                    )
                  }
                  className="h-10 rounded-xl bg-gray-50 px-3 text-xs outline-none"
                >
                  <option value="">
                    All Sources
                  </option>
                  <option value="order">
                    Order
                  </option>
                  <option value="production">
                    Production
                  </option>
                  <option value="manual">
                    Manual
                  </option>
                </select>

                <input
                  value={
                    filters.orderNumber
                  }
                  onChange={(e) =>
                    changeFilter(
                      "orderNumber",
                      e.target.value
                    )
                  }
                  placeholder="Order number"
                  className="h-10 rounded-xl bg-gray-50 px-3 text-xs outline-none"
                />

                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) =>
                    changeFilter(
                      "from",
                      e.target.value
                    )
                  }
                  className="h-10 rounded-xl bg-gray-50 px-3 text-xs outline-none"
                />

                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) =>
                    changeFilter(
                      "to",
                      e.target.value
                    )
                  }
                  className="h-10 rounded-xl bg-gray-50 px-3 text-xs outline-none"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => load()}
                    className="flex h-10 flex-1 items-center justify-center rounded-xl bg-black px-3 text-xs font-semibold text-white"
                  >
                    Apply
                  </button>

                  <button
                    onClick={reset}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100"
                    title="Reset filters"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* RESULTS HEADER */}

            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Reservation History
                </h2>

                <p className="mt-0.5 text-[11px] text-gray-400">
                  {pagination.total || 0} records
                </p>
              </div>

              {productTimelineLoading && (
                <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>

            {/* RECORDS */}

            {data.length ? (
              <div className="space-y-3">
                {data.map((row) => (
                  <ReservationCard
                    key={row._id}
                    row={row}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
                <Archive className="mx-auto h-6 w-6 text-gray-300" />

                <p className="mt-3 text-sm font-medium text-gray-700">
                  No reservations found
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Try changing the filters.
                </p>
              </div>
            )}

            {/* PAGINATION */}

            {pagination.pages > 1 && (
              <div className="mt-5 flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
                <p className="text-xs text-gray-500">
                  Page{" "}
                  <span className="font-semibold text-gray-900">
                    {pagination.page || 1}
                  </span>{" "}
                  of{" "}
                  {pagination.pages || 1}
                </p>

                <div className="flex gap-2">
                  <button
                    disabled={
                      !pagination.hasPrev ||
                      productTimelineLoading
                    }
                    onClick={() =>
                      goPage(
                        Number(
                          pagination.page
                        ) - 1
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <button
                    disabled={
                      !pagination.hasNext ||
                      productTimelineLoading
                    }
                    onClick={() =>
                      goPage(
                        Number(
                          pagination.page
                        ) + 1
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}