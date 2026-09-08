"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Loader2,
  PackageCheck,
  RefreshCw,
  Search,
  Truck,
  UserRound,
} from "lucide-react";

import { useInfluencerOrderStore } from "@/store/influencerorderstore";

const formatDate = (value) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getProductSummary = (products = []) =>
  products
    .map((product) => {
      const code =
        product.productCode ||
        product.title ||
        "Product";

      const size = product.selectedSize
        ? ` (${product.selectedSize})`
        : "";

      return `${code}${size} × ${product.quantity}`;
    })
    .join(", ");

export default function DispatchedInfluencerOrdersPage() {
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

  const setPage = useInfluencerOrderStore(
    (state) => state.setPage
  );

  const resetFilters = useInfluencerOrderStore(
    (state) => state.resetFilters
  );

  const exportExcel = useInfluencerOrderStore(
    (state) => state.exportExcel
  );

  const [searchInput, setSearchInput] =
    useState("");

  useEffect(() => {
    replaceFilters({
      isDispatched: "true",
      sortBy: "dispatchedAt",
      sortOrder: "desc",
    });

    return () => {
      resetFilters();
    };
  }, [replaceFilters, resetFilters]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== filters.search) {
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
    if (
      filters.isDispatched !== "true"
    ) {
      return;
    }

    fetchOrders().catch(() => {});
  }, [
    filters,
    pagination.page,
    pagination.limit,
    fetchOrders,
  ]);

  const handleExport = async () => {
    try {
      await exportExcel();
    } catch {
      // Store already handles the error.
    }
  };

  return (
    <main className="min-h-screen bg-[#fafafa] p-3 text-black sm:p-5 lg:p-7">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <section className="mb-5 overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm">
          <div className="h-1.5 bg-green-600" />

          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <div className="mb-1 flex items-center gap-2 text-green-700">
                <CheckCircle2 size={18} />

                <span className="text-xs font-bold uppercase tracking-[0.18em]">
                  Dispatch History
                </span>
              </div>

              <h1 className="text-2xl font-bold sm:text-3xl">
                Dispatched Influencer Orders
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Review completed influencer
                dispatches, timings and warehouse
                activity.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  fetchOrders().catch(() => {})
                }
                disabled={loading}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold transition hover:border-[#800020] hover:text-[#800020] disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#800020] px-4 text-sm font-semibold text-white transition hover:bg-[#68001a] disabled:opacity-50"
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
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <CheckCircle2 size={18} />
            </div>

            <p className="text-2xl font-bold">
              {summary.dispatchedOrders ||
                pagination.total ||
                0}
            </p>

            <p className="mt-1 text-xs font-medium text-gray-500">
              Dispatched Orders
            </p>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#800020]/10 text-[#800020]">
              <PackageCheck size={18} />
            </div>

            <p className="text-2xl font-bold">
              {summary.totalQuantity || 0}
            </p>

            <p className="mt-1 text-xs font-medium text-gray-500">
              Dispatched Pieces
            </p>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#800020]/10 text-[#800020]">
              <UserRound size={18} />
            </div>

            <p className="text-2xl font-bold">
              {orders.length}
            </p>

            <p className="mt-1 text-xs font-medium text-gray-500">
              Records on Page
            </p>
          </article>

          <article className="rounded-2xl bg-black p-4 text-white shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Truck size={18} />
            </div>

            <p className="text-lg font-bold">
              Latest First
            </p>

            <p className="mt-1 text-xs text-white/70">
              Sorted by dispatch time
            </p>
          </article>
        </section>

        {/* Filters */}
        <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(250px,1fr)_190px_180px_180px]">
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
                placeholder="Search influencer, phone or product"
                className="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10"
              />
            </div>

            <input
              value={filters.dispatchedBy}
              onChange={(event) =>
                setFilter(
                  "dispatchedBy",
                  event.target.value
                )
              }
              placeholder="Dispatched by"
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#800020]"
            />

            <input
              type="date"
              value={filters.dispatchedFrom}
              onChange={(event) =>
                setFilter(
                  "dispatchedFrom",
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#800020]"
              title="Dispatched from"
            />

            <input
              type="date"
              value={filters.dispatchedTo}
              onChange={(event) =>
                setFilter(
                  "dispatchedTo",
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#800020]"
              title="Dispatched to"
            />
          </div>
        </section>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead className="bg-black text-xs uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-3">
                    Influencer
                  </th>
                  <th className="px-4 py-3">
                    Products
                  </th>
                  <th className="px-4 py-3">
                    Created By
                  </th>
                  <th className="px-4 py-3">
                    Dispatched By
                  </th>
                  <th className="px-4 py-3">
                    Dispatch Time
                  </th>
                  <th className="px-4 py-3">
                    Note
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
                      colSpan={7}
                      className="px-4 py-16 text-center"
                    >
                      <Loader2 className="mx-auto mb-2 animate-spin text-[#800020]" />

                      <p className="text-sm text-gray-500">
                        Loading dispatched orders...
                      </p>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-16 text-center"
                    >
                      <Truck
                        size={36}
                        className="mx-auto mb-3 text-gray-300"
                      />

                      <p className="font-semibold">
                        No dispatched orders found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Change the search or date
                        filters.
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
                            : order.phone}
                        </p>
                      </td>

                      <td className="max-w-[300px] px-4 py-4">
                        <p className="line-clamp-2 text-sm font-medium">
                          {getProductSummary(
                            order.products
                          )}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {order.totalQuantity || 0}{" "}
                          total pieces
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-medium">
                          {order.createdBy || "—"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(
                            order.createdAt
                          )}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                          {order.dispatchedBy ||
                            "Warehouse"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-sm font-medium">
                          {formatDate(
                            order.dispatchedAt
                          )}
                        </p>
                      </td>

                      <td className="max-w-[220px] px-4 py-4">
                        <p className="line-clamp-2 text-sm text-gray-600">
                          {order.dispatchNote || "—"}
                        </p>
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
                  setPage(
                    pagination.page - 1
                  )
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
                  setPage(
                    pagination.page + 1
                  )
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