"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileSpreadsheet,
  History,
  Loader2,
  Package,
  RotateCcw,
  Search,
  Truck,
  Users,
} from "lucide-react";

import { useInfluencerOrderStore } from "@/store/influencerorderstore";

const inputClass =
  "h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10";

const formatDate = (value) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const toDateInput = (date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(date.getDate()).padStart(
    2,
    "0"
  );

  return `${year}-${month}-${day}`;
};

const getQuickRange = (type) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (type === "today") {
    // Keep current date
  } else if (type === "yesterday") {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
  } else if (type === "this_week") {
    const day = start.getDay();
    const distance = day === 0 ? 6 : day - 1;

    start.setDate(start.getDate() - distance);
  } else if (type === "last_week") {
    const day = start.getDay();
    const distance = day === 0 ? 6 : day - 1;

    end.setDate(end.getDate() - distance - 1);

    start.setTime(end.getTime());
    start.setDate(start.getDate() - 6);
  } else if (type === "this_month") {
    start.setDate(1);
  } else if (type === "last_month") {
    start.setMonth(start.getMonth() - 1, 1);

    end.setDate(1);
    end.setDate(0);
  } else {
    return {
      createdFrom: "",
      createdTo: "",
    };
  }

  return {
    createdFrom: toDateInput(start),
    createdTo: toDateInput(end),
  };
};

const getDispatchDuration = (
  createdAt,
  dispatchedAt
) => {
  if (!createdAt || !dispatchedAt) {
    return "Pending";
  }

  const difference =
    new Date(dispatchedAt).getTime() -
    new Date(createdAt).getTime();

  const totalMinutes = Math.max(
    0,
    Math.floor(difference / 60000)
  );

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(
    totalMinutes / 60
  );

  if (hours < 24) {
    return `${hours} hr ${totalMinutes % 60} min`;
  }

  const days = Math.floor(hours / 24);

  return `${days} day${days === 1 ? "" : "s"} ${
    hours % 24
  } hr`;
};

const getActionLabel = (action) => {
  const labels = {
    created: "Created",
    updated: "Updated",
    dispatched: "Dispatched",
  };

  return labels[action] || action || "Activity";
};

export default function InfluencerOrderReportsPage() {
  const orders = useInfluencerOrderStore(
    (state) => state.orders
  );

  const filters = useInfluencerOrderStore(
    (state) => state.filters
  );

  const pagination = useInfluencerOrderStore(
    (state) => state.pagination
  );

  const summary = useInfluencerOrderStore(
    (state) => state.summary
  );

  const loading = useInfluencerOrderStore(
    (state) => state.loading
  );

  const exporting = useInfluencerOrderStore(
    (state) => state.exporting
  );

  const error = useInfluencerOrderStore(
    (state) => state.error
  );

  const fetchOrders = useInfluencerOrderStore(
    (state) => state.fetchOrders
  );

  const replaceFilters =
    useInfluencerOrderStore(
      (state) => state.replaceFilters
    );

  const setFilter = useInfluencerOrderStore(
    (state) => state.setFilter
  );

  const setFilters = useInfluencerOrderStore(
    (state) => state.setFilters
  );

  const resetFilters = useInfluencerOrderStore(
    (state) => state.resetFilters
  );

  const setPage = useInfluencerOrderStore(
    (state) => state.setPage
  );

  const setLimit = useInfluencerOrderStore(
    (state) => state.setLimit
  );

  const exportExcel = useInfluencerOrderStore(
    (state) => state.exportExcel
  );

  const [searchInput, setSearchInput] =
    useState("");

  const [quickFilter, setQuickFilter] =
    useState("all");

  const [ready, setReady] = useState(false);

  useEffect(() => {
    replaceFilters({
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    setLimit(100);
    setReady(true);

    return () => {
      resetFilters();
      setLimit(20);
    };
  }, [
    replaceFilters,
    resetFilters,
    setLimit,
  ]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (
        searchInput !== filters.search
      ) {
        setFilter("search", searchInput);
      }
    }, 450);

    return () => clearTimeout(timeout);
  }, [
    searchInput,
    filters.search,
    setFilter,
  ]);

  useEffect(() => {
    if (!ready) return;

    fetchOrders().catch(() => {});
  }, [
    ready,
    filters,
    pagination.page,
    pagination.limit,
    fetchOrders,
  ]);

  const activityLogs = useMemo(() => {
    return orders
      .flatMap((order) =>
        (order.logs || []).map((log) => ({
          ...log,
          orderId: order._id,
          influencerName:
            order.influencerName,
          productCount:
            order.totalQuantity || 0,
        }))
      )
      .sort(
        (first, second) =>
          new Date(
            second.timestamp
          ).getTime() -
          new Date(first.timestamp).getTime()
      );
  }, [orders]);

  const productSummary = useMemo(() => {
    const grouped = new Map();

    orders.forEach((order) => {
      (order.products || []).forEach(
        (product) => {
          const key = [
            product.productCode ||
              product.productId,
            product.selectedSize || "",
          ].join("::");

          const existing = grouped.get(key) || {
            productCode:
              product.productCode || "—",
            title: product.title || "Product",
            selectedSize:
              product.selectedSize || "—",
            quantity: 0,
            orderCount: 0,
          };

          existing.quantity +=
            Number(product.quantity) || 0;

          existing.orderCount += 1;

          grouped.set(key, existing);
        }
      );
    });

    return [...grouped.values()].sort(
      (first, second) =>
        second.quantity - first.quantity
    );
  }, [orders]);

  const handleQuickFilter = (value) => {
    setQuickFilter(value);
    setFilters(getQuickRange(value));
  };

  const handleReset = () => {
    setSearchInput("");
    setQuickFilter("all");

    replaceFilters({
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const handleExport = async () => {
    try {
      await exportExcel();
    } catch {
      // Store exposes the error.
    }
  };

  return (
    <main className="min-h-screen bg-[#fafafa] p-3 text-black sm:p-5 lg:p-7">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <section className="mb-5 overflow-hidden rounded-2xl border border-[#800020]/15 bg-white shadow-sm">
          <div className="h-1.5 bg-[#800020]" />

          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <div className="mb-1 flex items-center gap-2 text-[#800020]">
                <FileSpreadsheet size={18} />

                <span className="text-xs font-bold uppercase tracking-[0.18em]">
                  Reports & Audit
                </span>
              </div>

              <h1 className="text-2xl font-bold sm:text-3xl">
                Influencer Order Reports
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Review activity, dispatch timings and
                download filtered Excel reports.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#800020] px-4 text-sm font-semibold text-white transition hover:bg-[#68001a] disabled:opacity-50"
            >
              {exporting ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Download size={17} />
              )}

              Download Filtered Excel
            </button>
          </div>
        </section>

        {/* Summary */}
        <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Total Orders",
              value: summary.totalOrders,
              icon: Users,
            },
            {
              label: "Total Pieces",
              value: summary.totalQuantity,
              icon: Package,
            },
            {
              label: "Pending",
              value: summary.pendingOrders,
              icon: Clock3,
            },
            {
              label: "Dispatched",
              value: summary.dispatchedOrders,
              icon: CheckCircle2,
            },
          ].map(
            ({ label, value, icon: Icon }) => (
              <article
                key={label}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#800020]/10 text-[#800020]">
                  <Icon size={18} />
                </div>

                <p className="text-2xl font-bold">
                  {value || 0}
                </p>

                <p className="mt-1 text-xs font-medium text-gray-500">
                  {label}
                </p>
              </article>
            )
          )}
        </section>

        {/* Filters */}
        <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_170px_170px_170px_170px_auto]">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value
                  )
                }
                placeholder="Search name, phone, product code"
                className={`${inputClass} w-full pl-10`}
              />
            </div>

            <select
              value={filters.isDispatched}
              onChange={(event) =>
                setFilter(
                  "isDispatched",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="">
                All statuses
              </option>
              <option value="false">
                Pending
              </option>
              <option value="true">
                Dispatched
              </option>
            </select>

            <input
              value={filters.createdBy}
              onChange={(event) =>
                setFilter(
                  "createdBy",
                  event.target.value
                )
              }
              placeholder="Created by"
              className={inputClass}
            />

            <input
              type="date"
              value={filters.createdFrom}
              onChange={(event) => {
                setQuickFilter("custom");

                setFilter(
                  "createdFrom",
                  event.target.value
                );
              }}
              className={inputClass}
              title="Created from"
            />

            <input
              type="date"
              value={filters.createdTo}
              onChange={(event) => {
                setQuickFilter("custom");

                setFilter(
                  "createdTo",
                  event.target.value
                );
              }}
              className={inputClass}
              title="Created to"
            />

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold transition hover:border-[#800020] hover:text-[#800020]"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["today", "Today"],
              ["yesterday", "Yesterday"],
              ["this_week", "This Week"],
              ["last_week", "Last Week"],
              ["this_month", "This Month"],
              ["last_month", "Last Month"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  handleQuickFilter(value)
                }
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  quickFilter === value
                    ? "bg-[#800020] text-white"
                    : "border border-gray-200 text-gray-600 hover:border-[#800020] hover:text-[#800020]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Product summary */}
        <section className="mb-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-4">
            <div>
              <h2 className="font-bold">
                Product Summary
              </h2>

              <p className="text-xs text-gray-500">
                Grouped from the currently loaded
                records
              </p>
            </div>

            <Package
              size={20}
              className="text-[#800020]"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead className="bg-black text-xs uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-3">
                    Product Code
                  </th>
                  <th className="px-4 py-3">
                    Product
                  </th>
                  <th className="px-4 py-3">
                    Size
                  </th>
                  <th className="px-4 py-3 text-right">
                    Orders
                  </th>
                  <th className="px-4 py-3 text-right">
                    Quantity
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {productSummary.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-gray-500"
                    >
                      No product data found.
                    </td>
                  </tr>
                ) : (
                  productSummary.map(
                    (product) => (
                      <tr
                        key={`${product.productCode}-${product.selectedSize}`}
                      >
                        <td className="px-4 py-3 text-sm font-bold text-[#800020]">
                          {product.productCode}
                        </td>

                        <td className="px-4 py-3 text-sm font-medium">
                          {product.title}
                        </td>

                        <td className="px-4 py-3 text-sm">
                          {product.selectedSize}
                        </td>

                        <td className="px-4 py-3 text-right text-sm">
                          {product.orderCount}
                        </td>

                        <td className="px-4 py-3 text-right text-lg font-bold">
                          {product.quantity}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
          {/* Timing table */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <div>
                <h2 className="font-bold">
                  Dispatch Timings
                </h2>

                <p className="text-xs text-gray-500">
                  Time taken from creation to dispatch
                </p>
              </div>

              <Truck
                size={20}
                className="text-[#800020]"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-black text-xs uppercase tracking-wider text-white">
                  <tr>
                    <th className="px-4 py-3">
                      Influencer
                    </th>
                    <th className="px-4 py-3">
                      Created
                    </th>
                    <th className="px-4 py-3">
                      Dispatched
                    </th>
                    <th className="px-4 py-3">
                      Duration
                    </th>
                    <th className="px-4 py-3">
                      Status
                    </th>
                    <th className="px-4 py-3">
                      View
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center"
                      >
                        <Loader2 className="mx-auto animate-spin text-[#800020]" />
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-sm text-gray-500"
                      >
                        No matching records.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order._id}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold">
                            {order.influencerName}
                          </p>

                          <p className="text-xs text-gray-500">
                            By {order.createdBy}
                          </p>
                        </td>

                        <td className="px-4 py-3 text-xs">
                          {formatDate(
                            order.createdAt
                          )}
                        </td>

                        <td className="px-4 py-3 text-xs">
                          {formatDate(
                            order.dispatchedAt
                          )}
                        </td>

                        <td className="px-4 py-3 text-sm font-bold">
                          {getDispatchDuration(
                            order.createdAt,
                            order.dispatchedAt
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              order.isDispatched
                                ? "bg-green-100 text-green-700"
                                : "bg-[#800020]/10 text-[#800020]"
                            }`}
                          >
                            {order.isDispatched
                              ? "Dispatched"
                              : "Pending"}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <Link
                            href={`/influencer-orders/${order._id}`}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-2.5 text-xs font-semibold hover:border-[#800020] hover:text-[#800020]"
                          >
                            <Eye size={14} />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 p-4">
              <p className="text-sm text-gray-500">
                Page {pagination.page || 1} of{" "}
                {pagination.totalPages || 1}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    loading ||
                    !pagination.hasPreviousPage
                  }
                  onClick={() =>
                    setPage(
                      pagination.page - 1
                    )
                  }
                  className="flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-sm font-semibold disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    loading ||
                    !pagination.hasNextPage
                  }
                  onClick={() =>
                    setPage(
                      pagination.page + 1
                    )
                  }
                  className="flex h-9 items-center gap-1 rounded-lg bg-black px-3 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>

          {/* Activity */}
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold">
                  Activity Logs
                </h2>

                <p className="text-xs text-gray-500">
                  Activity from loaded records
                </p>
              </div>

              <History
                size={20}
                className="text-[#800020]"
              />
            </div>

            <div className="max-h-[620px] space-y-0 overflow-y-auto pr-2">
              {activityLogs.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-500">
                  No activity logs found.
                </p>
              ) : (
                activityLogs.map(
                  (log, index) => (
                    <div
                      key={
                        log._id ||
                        `${log.timestamp}-${index}`
                      }
                      className="relative flex gap-3 pb-5 last:pb-0"
                    >
                      {index <
                        activityLogs.length - 1 && (
                        <span className="absolute left-[7px] top-5 h-full w-px bg-gray-200" />
                      )}

                      <span className="relative mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-white bg-[#800020] ring-1 ring-[#800020]/20" />

                      <div className="min-w-0">
                        <p className="text-sm font-bold">
                          {getActionLabel(
                            log.action
                          )}
                          {" · "}
                          {log.influencerName}
                        </p>

                        <p className="text-xs text-gray-500">
                          By{" "}
                          {log.performedBy ||
                            "Unknown"}
                        </p>

                        {log.note && (
                          <p className="mt-1 text-xs text-gray-600">
                            {log.note}
                          </p>
                        )}

                        <p className="mt-1 text-[11px] text-gray-400">
                          {formatDate(
                            log.timestamp
                          )}
                        </p>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}