"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Box,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  Loader2,
  PackageCheck,
  Plus,
  RotateCcw,
  Search,
  Truck,
  Users,
} from "lucide-react";

import { useInfluencerOrderStore } from "@/store/influencerorderstore";

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

const getQuickDateRange = (type) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (type === "today") {
    return {
      createdFrom: toDateInput(start),
      createdTo: toDateInput(end),
    };
  }

  if (type === "yesterday") {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);

    return {
      createdFrom: toDateInput(start),
      createdTo: toDateInput(end),
    };
  }

  if (type === "this_week") {
    const currentDay = start.getDay();
    const difference =
      currentDay === 0 ? 6 : currentDay - 1;

    start.setDate(start.getDate() - difference);

    return {
      createdFrom: toDateInput(start),
      createdTo: toDateInput(end),
    };
  }

  if (type === "last_7_days") {
    start.setDate(start.getDate() - 6);

    return {
      createdFrom: toDateInput(start),
      createdTo: toDateInput(end),
    };
  }

  if (type === "this_month") {
    start.setDate(1);

    return {
      createdFrom: toDateInput(start),
      createdTo: toDateInput(end),
    };
  }

  return {
    createdFrom: "",
    createdTo: "",
  };
};

const getProductsText = (products = []) => {
  if (!products.length) return "No products";

  return products
    .map((product) => {
      const size = product.selectedSize
        ? ` / ${product.selectedSize}`
        : "";

      return `${product.productCode || product.title}${size} × ${product.quantity}`;
    })
    .join(", ");
};

const summaryCards = [
  {
    key: "totalOrders",
    label: "Total Orders",
    icon: Box,
  },
  {
    key: "pendingOrders",
    label: "Pending Dispatch",
    icon: Truck,
  },
  {
    key: "dispatchedOrders",
    label: "Dispatched",
    icon: CheckCircle2,
  },
  {
    key: "totalQuantity",
    label: "Total Pieces",
    icon: PackageCheck,
  },
];

export default function InfluencerOrdersPage() {
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

  const exportExcel = useInfluencerOrderStore(
    (state) => state.exportExcel
  );

  const [searchInput, setSearchInput] = useState(
    filters.search
  );

  const [quickFilter, setQuickFilter] =
    useState("all");

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilter("search", searchInput);
      }
    }, 450);

    return () => clearTimeout(timeout);
  }, [searchInput, filters.search, setFilter]);

  useEffect(() => {
    fetchOrders().catch(() => {});
  }, [
    fetchOrders,
    filters,
    pagination.page,
    pagination.limit,
  ]);

  const handleQuickFilter = useCallback(
    (value) => {
      setQuickFilter(value);
      setFilters(getQuickDateRange(value));
    },
    [setFilters]
  );

  const handleReset = () => {
    setSearchInput("");
    setQuickFilter("all");
    resetFilters();
  };

  const handleExport = async () => {
    try {
      await exportExcel();
    } catch {
      // Store already exposes the error.
    }
  };

  return (
    <main className="min-h-screen bg-[#fafafa] p-3 text-black sm:p-5 lg:p-7">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <section className="mb-5 overflow-hidden rounded-2xl border border-[#800020]/15 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <div className="mb-1 flex items-center gap-2 text-[#800020]">
                <Users size={18} />
                <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                  Marketing & Warehouse
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Influencer Orders
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Create product dispatch requests and
                track warehouse completion.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#800020] bg-white px-4 text-sm font-semibold text-[#800020] transition hover:bg-[#fff5f7] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exporting ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Download size={17} />
                )}

                Download Excel
              </button>

              <Link
                href="/influencer-orders/create"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#800020] px-4 text-sm font-semibold text-white transition hover:bg-[#68001a]"
              >
                <Plus size={17} />
                Create Order
              </Link>
            </div>
          </div>

          {/* How to use */}
          <details className="group p-4 sm:px-6">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#800020]">
              <span>How to use Influencer Orders</span>
              <span className="transition group-open:rotate-180">
                ↓
              </span>
            </summary>

            <div className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-3">
              <div className="rounded-xl bg-[#fff7f8] p-3">
                <span className="mb-1 block font-bold text-[#800020]">
                  01. Marketing
                </span>
                Add influencer details, delivery
                address, products, sizes and creator
                name.
              </div>

              <div className="rounded-xl bg-[#fff7f8] p-3">
                <span className="mb-1 block font-bold text-[#800020]">
                  02. Warehouse
                </span>
                Open pending orders, verify the items
                and mark the shipment as dispatched.
              </div>

              <div className="rounded-xl bg-[#fff7f8] p-3">
                <span className="mb-1 block font-bold text-[#800020]">
                  03. Reports
                </span>
                Apply filters and download the same
                filtered records in Excel format.
              </div>
            </div>
          </details>
        </section>

        {/* Summary */}
        <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summaryCards.map(
            ({ key, label, icon: Icon }) => (
              <article
                key={key}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#800020]/10 text-[#800020]">
                  <Icon size={18} />
                </div>

                <p className="text-2xl font-bold">
                  {summary[key] || 0}
                </p>

                <p className="mt-1 text-xs font-medium text-gray-500 sm:text-sm">
                  {label}
                </p>
              </article>
            )
          )}
        </section>

        {/* Filters */}
        <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px_180px_auto]">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search influencer, phone or product code"
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10"
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
              className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#800020]"
            >
              <option value="">All statuses</option>
              <option value="false">
                Pending dispatch
              </option>
              <option value="true">Dispatched</option>
            </select>

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
              className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#800020]"
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
              className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#800020]"
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
              ["last_7_days", "Last 7 Days"],
              ["this_month", "This Month"],
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
                    : "border border-gray-200 bg-white text-gray-600 hover:border-[#800020] hover:text-[#800020]"
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

        {/* Table */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
            <div>
              <h2 className="font-bold">
                Order Records
              </h2>

              <p className="text-xs text-gray-500">
                {pagination.total || 0} matching
                records
              </p>
            </div>

            <FileSpreadsheet
              size={20}
              className="text-[#800020]"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1150px] w-full text-left">
              <thead className="bg-black text-xs uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-3">
                    Influencer
                  </th>
                  <th className="px-4 py-3">
                    Products
                  </th>
                  <th className="px-4 py-3">
                    Address
                  </th>
                  <th className="px-4 py-3">
                    Created
                  </th>
                  <th className="px-4 py-3">
                    Dispatch
                  </th>
                  <th className="px-4 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-16 text-center"
                    >
                      <Loader2 className="mx-auto mb-2 animate-spin text-[#800020]" />

                      <p className="text-sm text-gray-500">
                        Loading influencer orders...
                      </p>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-16 text-center"
                    >
                      <Users
                        size={35}
                        className="mx-auto mb-3 text-gray-300"
                      />

                      <p className="font-semibold">
                        No influencer orders found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Create a new order or change
                        the active filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order._id}
                      className="align-top transition hover:bg-[#800020]/[0.025]"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold">
                          {order.influencerName}
                        </p>

                        <p className="mt-1 text-xs text-[#800020]">
                          {order.instagramUsername
                            ? `@${order.instagramUsername}`
                            : "No Instagram username"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {order.phone}
                        </p>
                      </td>

                      <td className="max-w-[330px] px-4 py-4">
                        <p className="line-clamp-2 text-sm font-medium">
                          {getProductsText(
                            order.products
                          )}
                        </p>

                        <p className="mt-2 text-xs text-gray-500">
                          {order.totalQuantity || 0}{" "}
                          total pieces
                        </p>
                      </td>

                      <td className="max-w-[240px] px-4 py-4">
                        <p className="line-clamp-2 text-sm">
                          {order.address?.addressLine1}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {order.address?.city},{" "}
                          {order.address?.state} –{" "}
                          {order.address?.pincode}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-medium">
                          {order.createdBy}
                        </p>

                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                          <CalendarDays size={13} />
                          {formatDate(order.createdAt)}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            order.isDispatched
                              ? "bg-green-100 text-green-700"
                              : "bg-[#800020]/10 text-[#800020]"
                          }`}
                        >
                          {order.isDispatched
                            ? "Dispatched"
                            : "Pending"}
                        </span>

                        {order.isDispatched && (
                          <div className="mt-2 text-xs text-gray-500">
                            <p>
                              By{" "}
                              {order.dispatchedBy ||
                                "Warehouse"}
                            </p>
                            <p>
                              {formatDate(
                                order.dispatchedAt
                              )}
                            </p>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/influencer-orders/${order._id}`}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-semibold transition hover:border-[#800020] hover:text-[#800020]"
                        >
                          <Eye size={15} />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
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
                  setPage(pagination.page - 1)
                }
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
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
                  setPage(pagination.page + 1)
                }
                className="inline-flex h-9 items-center gap-1 rounded-lg bg-black px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}