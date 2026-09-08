"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
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

const getAddress = (address = {}) =>
  [
    address.addressLine1,
    address.addressLine2,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ");

const getWaitingTime = (createdAt) => {
  if (!createdAt) return "Unknown";

  const difference =
    Date.now() - new Date(createdAt).getTime();

  const hours = Math.floor(
    difference / (1000 * 60 * 60)
  );

  if (hours < 1) return "Less than 1 hour";

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  const days = Math.floor(hours / 24);

  return `${days} day${days === 1 ? "" : "s"}`;
};

export default function PendingInfluencerOrdersPage() {
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

  const [searchInput, setSearchInput] =
    useState("");

  useEffect(() => {
    replaceFilters({
      isDispatched: "false",
      sortBy: "createdAt",
      sortOrder: "asc",
    });

    return () => {
      resetFilters();
    };
  }, [replaceFilters, resetFilters]);

  const markAsDispatched =
  useInfluencerOrderStore(
    (state) => state.markAsDispatched
  );

const dispatchingId =
  useInfluencerOrderStore(
    (state) => state.dispatchingId
  );

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
    if (
      filters.isDispatched !== "false"
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

  const handleRefresh = () => {
    fetchOrders().catch(() => {});
  };

  const handleDispatch = async (order) => {
  const dispatchedBy = window.prompt(
    "Enter warehouse team member name:"
  );

  if (!dispatchedBy?.trim()) return;

  const dispatchNote =
    window.prompt(
      "Enter dispatch note or AWB (optional):"
    ) || "";

  const confirmed = window.confirm(
    `Mark ${order.influencerName}'s order as dispatched?`
  );

  if (!confirmed) return;

  try {
    await markAsDispatched(order._id, {
      dispatchedBy: dispatchedBy.trim(),
      dispatchNote: dispatchNote.trim(),
    });

    await fetchOrders();
  } catch {
    // Store handles the error.
  }
};

  return (
    <main className="min-h-screen bg-[#fafafa] p-3 text-black sm:p-5 lg:p-7">
      <div className="mx-auto ">
        {/* Header */}
        <section className="mb-5 overflow-hidden rounded-2xl border border-[#800020]/15 bg-white shadow-sm">
          <div className="h-1.5 bg-[#800020]" />

          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <div className="mb-1 flex items-center gap-2 text-[#800020]">
                <Truck size={18} />

                <span className="text-xs font-bold uppercase tracking-[0.18em]">
                  Warehouse Queue
                </span>
              </div>

              <h1 className="text-2xl font-bold sm:text-3xl">
                Pending Influencer Orders
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Verify the products, packing details
                and delivery address before dispatch.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRefresh}
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

              <Link
                href="/influencer-orders"
                className="inline-flex h-11 items-center rounded-xl bg-black px-4 text-sm font-semibold text-white"
              >
                All Orders
              </Link>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#800020]/10 text-[#800020]">
              <Clock3 size={18} />
            </div>

            <p className="text-2xl font-bold">
              {summary.pendingOrders ||
                pagination.total ||
                0}
            </p>

            <p className="mt-1 text-xs font-medium text-gray-500">
              Pending Orders
            </p>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#800020]/10 text-[#800020]">
              <Package size={18} />
            </div>

            <p className="text-2xl font-bold">
              {summary.totalQuantity || 0}
            </p>

            <p className="mt-1 text-xs font-medium text-gray-500">
              Pieces to Pack
            </p>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#800020]/10 text-[#800020]">
              <Users size={18} />
            </div>

            <p className="text-2xl font-bold">
              {orders.length}
            </p>

            <p className="mt-1 text-xs font-medium text-gray-500">
              On This Page
            </p>
          </article>

          <article className="rounded-2xl bg-[#800020] p-4 text-white shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Truck size={18} />
            </div>

            <p className="text-lg font-bold">
              Oldest First
            </p>

            <p className="mt-1 text-xs text-white/70">
              Priority dispatch sequence
            </p>
          </article>
        </section>

        {/* Filters */}
        <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(250px,1fr)_180px_180px]">
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
                placeholder="Search influencer, phone or product code"
                className="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10"
              />
            </div>

            <input
              type="date"
              value={filters.createdFrom}
              onChange={(event) =>
                setFilter(
                  "createdFrom",
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#800020]"
              title="Created from"
            />

            <input
              type="date"
              value={filters.createdTo}
              onChange={(event) =>
                setFilter(
                  "createdTo",
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#800020]"
              title="Created to"
            />
          </div>
        </section>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Queue */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
            <div>
              <h2 className="font-bold">
                Packing Queue
              </h2>

              <p className="text-xs text-gray-500">
                {pagination.total || 0} orders
                waiting for dispatch
              </p>
            </div>

            <span className="rounded-full bg-[#800020]/10 px-3 py-1.5 text-xs font-bold text-[#800020]">
              Pending only
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="mx-auto mb-3 animate-spin text-[#800020]" />

              <p className="text-sm text-gray-500">
                Loading warehouse queue...
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 text-center">
              <Truck
                size={38}
                className="mx-auto mb-3 text-gray-300"
              />

              <h3 className="font-bold">
                Dispatch queue is clear
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                No pending influencer orders found.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map((order) => (
                <article
                  key={order._id}
                  className="p-4 transition hover:bg-[#800020]/[0.02] sm:p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                    {/* Influencer */}
                    <div className="min-w-[210px] xl:w-[22%]">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#800020] text-xs font-bold text-white">
                          {order.influencerName
                            ?.charAt(0)
                            ?.toUpperCase() || "I"}
                        </span>

                        <div>
                          <p className="font-bold">
                            {order.influencerName}
                          </p>

                          <p className="text-xs text-[#800020]">
                            {order.instagramUsername
                              ? `@${order.instagramUsername}`
                              : order.phone}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Products */}
                    <div className="flex-1">
                      <p className="mb-2 text-xs font-bold uppercase text-gray-400">
                        Packing list
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {order.products?.map(
                          (product) => (
                            <div
                              key={
                                product._id ||
                                `${product.productId}-${product.variantId}`
                              }
                              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-2"
                            >
                              {product.thumbnail && (
                                <img
                                  src={
                                    product.thumbnail
                                  }
                                  alt={
                                    product.title
                                  }
                                  className="h-9 w-8 rounded object-cover"
                                />
                              )}

                              <div>
                                <p className="max-w-[180px] truncate text-xs font-semibold">
                                  {product.productCode ||
                                    product.title}
                                </p>

                                <p className="text-[11px] text-gray-500">
                                  {product.selectedSize
                                    ? `${product.selectedSize} • `
                                    : ""}
                                  Qty:{" "}
                                  {product.quantity}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <div className="xl:w-[22%]">
                      <p className="mb-1 flex items-center gap-1 text-xs font-bold uppercase text-gray-400">
                        <MapPin size={13} />
                        Address
                      </p>

                      <p className="line-clamp-2 text-sm text-gray-600">
                        {getAddress(
                          order.address
                        )}
                      </p>
                    </div>

                    {/* Waiting */}
                    <div className="xl:w-[120px]">
                      <p className="text-xs text-gray-400">
                        Waiting
                      </p>

                      <p className="text-sm font-bold text-[#800020]">
                        {getWaitingTime(
                          order.createdAt
                        )}
                      </p>

                      <p className="text-[11px] text-gray-400">
                        {formatDate(
                          order.createdAt
                        )}
                      </p>
                    </div>

                    {/* Action */}
                <div className="flex shrink-0 flex-wrap gap-2">
  <Link
    href={`/influencer-orders/${order._id}`}
    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold transition hover:border-[#800020] hover:text-[#800020]"
  >
    <Eye size={16} />
    Open
  </Link>

  <button
    type="button"
    onClick={() => handleDispatch(order)}
    disabled={dispatchingId === order._id}
    className="inline-flex h-10 min-w-[155px] items-center justify-center gap-2 rounded-xl bg-[#800020] px-4 text-sm font-semibold text-white transition hover:bg-[#68001a] disabled:cursor-not-allowed disabled:opacity-50"
  >
    {dispatchingId === order._id ? (
      <>
        <Loader2
          size={16}
          className="animate-spin"
        />
        Dispatching
      </>
    ) : (
      <>
        <Truck size={16} />
        Mark Dispatched
      </>
    )}
  </button>
</div>
                  </div>
                </article>
              ))}
            </div>
          )}

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