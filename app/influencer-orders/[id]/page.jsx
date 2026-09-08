"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  ExternalLink,
  History,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Send,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import { useInfluencerOrderStore } from "@/store/influencerorderstore";

const formatDate = (value) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getLogTitle = (action) => {
  const titles = {
    created: "Order created",
    updated: "Order updated",
    dispatched: "Order dispatched",
  };

  return titles[action] || "Order activity";
};

const getCompleteAddress = (address = {}) =>
  [
    address.addressLine1,
    address.addressLine2,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");

export default function InfluencerOrderDetailsPage() {
  const params = useParams();
  const orderId = params?.id;

  const selectedOrder =
    useInfluencerOrderStore(
      (state) => state.selectedOrder
    );

  const selectedOrderLoading =
    useInfluencerOrderStore(
      (state) =>
        state.selectedOrderLoading
    );

  const dispatchingId =
    useInfluencerOrderStore(
      (state) => state.dispatchingId
    );

  const error = useInfluencerOrderStore(
    (state) => state.error
  );

  const successMessage =
    useInfluencerOrderStore(
      (state) => state.successMessage
    );

  const fetchOrderById =
    useInfluencerOrderStore(
      (state) => state.fetchOrderById
    );

  const markAsDispatched =
    useInfluencerOrderStore(
      (state) => state.markAsDispatched
    );

  const clearSelectedOrder =
    useInfluencerOrderStore(
      (state) =>
        state.clearSelectedOrder
    );

  const clearError = useInfluencerOrderStore(
    (state) => state.clearError
  );

  const clearSuccessMessage =
    useInfluencerOrderStore(
      (state) =>
        state.clearSuccessMessage
    );

  const [dispatchModalOpen, setDispatchModalOpen] =
    useState(false);

  const [dispatchedBy, setDispatchedBy] =
    useState("");

  const [dispatchNote, setDispatchNote] =
    useState("");

  const [localError, setLocalError] =
    useState("");

  useEffect(() => {
    if (!orderId) return;

    fetchOrderById(orderId).catch(() => {});

    return () => {
      clearSelectedOrder();
    };
  }, [
    orderId,
    fetchOrderById,
    clearSelectedOrder,
  ]);

  const order =
    selectedOrder?._id === orderId
      ? selectedOrder
      : null;

  const sortedLogs = useMemo(() => {
    return [...(order?.logs || [])].sort(
      (first, second) =>
        new Date(second.timestamp).getTime() -
        new Date(first.timestamp).getTime()
    );
  }, [order?.logs]);

  const isDispatching =
    dispatchingId === orderId;

  const handleDispatch = async (event) => {
    event.preventDefault();

    if (!dispatchedBy.trim()) {
      setLocalError(
        "Please enter the name of the warehouse team member."
      );
      return;
    }

    setLocalError("");

    try {
      await markAsDispatched(orderId, {
        dispatchedBy: dispatchedBy.trim(),
        dispatchNote: dispatchNote.trim(),
      });

      setDispatchModalOpen(false);
      setDispatchedBy("");
      setDispatchNote("");
    } catch {
      // Error is already available in the store.
    }
  };

  if (selectedOrderLoading && !order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 animate-spin text-[#800020]" />

          <p className="text-sm text-gray-500">
            Loading influencer order...
          </p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fafafa] p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <Package
            size={36}
            className="mx-auto mb-3 text-gray-300"
          />

          <h1 className="text-xl font-bold">
            Influencer order not found
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {error ||
              "The requested order does not exist."}
          </p>

          <Link
            href="/influencer-orders"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#800020] px-4 text-sm font-semibold text-white"
          >
            <ArrowLeft size={17} />
            Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafafa] p-3 text-black sm:p-5 lg:p-7">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/influencer-orders"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-[#800020]"
        >
          <ArrowLeft size={17} />
          Back to Influencer Orders
        </Link>

        {/* Header */}
        <section className="mb-5 overflow-hidden rounded-2xl border border-[#800020]/15 bg-white shadow-sm">
          <div
            className={`h-1.5 ${
              order.isDispatched
                ? "bg-green-600"
                : "bg-[#800020]"
            }`}
          />

          <div className="flex flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    order.isDispatched
                      ? "bg-green-100 text-green-700"
                      : "bg-[#800020]/10 text-[#800020]"
                  }`}
                >
                  {order.isDispatched ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Clock3 size={14} />
                  )}

                  {order.isDispatched
                    ? "Dispatched"
                    : "Pending Dispatch"}
                </span>

                <span className="text-xs text-gray-400">
                  ID: {order._id}
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {order.influencerName}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {order.totalQuantity || 0} pieces
                across {order.products?.length || 0}{" "}
                products
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {!order.isDispatched && (
                <Link
                  href={`/influencer-orders/${order._id}/edit`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold transition hover:border-[#800020] hover:text-[#800020]"
                >
                  <Edit3 size={17} />
                  Edit Order
                </Link>
              )}

              {!order.isDispatched && (
                <button
                  type="button"
                  onClick={() => {
                    clearError();
                    setLocalError("");
                    setDispatchModalOpen(true);
                  }}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#800020] px-4 text-sm font-semibold text-white transition hover:bg-[#68001a]"
                >
                  <Truck size={17} />
                  Mark Dispatched
                </button>
              )}
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={clearError}
            >
              <X size={17} />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={17} />
              {successMessage}
            </span>

            <button
              type="button"
              onClick={clearSuccessMessage}
            >
              <X size={17} />
            </button>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            {/* Products */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#800020]/10 text-[#800020]">
                    <Package size={20} />
                  </div>

                  <div>
                    <h2 className="font-bold">
                      Products
                    </h2>

                    <p className="text-xs text-gray-500">
                      Warehouse packing list
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white">
                  {order.totalQuantity || 0} pieces
                </span>
              </div>

              <div className="space-y-3">
                {order.products?.map(
                  (product) => (
                    <article
                      key={
                        product._id ||
                        `${product.productId}-${product.variantId}`
                      }
                      className="flex gap-3 rounded-xl border border-gray-200 p-3"
                    >
                      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {product.thumbnail ? (
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="m-auto mt-8 text-gray-300" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                          {product.title}
                        </p>

                        <p className="mt-1 text-xs font-bold text-[#800020]">
                          {product.productCode ||
                            "No product code"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          {product.selectedSize && (
                            <span className="rounded-lg bg-gray-100 px-2 py-1 font-semibold">
                              Size:{" "}
                              {product.selectedSize}
                            </span>
                          )}

                          {product.selectedColor && (
                            <span className="rounded-lg bg-gray-100 px-2 py-1 font-semibold">
                              Color:{" "}
                              {product.selectedColor}
                            </span>
                          )}

                          {product.sku && (
                            <span className="rounded-lg bg-gray-100 px-2 py-1">
                              SKU: {product.sku}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xs text-gray-500">
                          Quantity
                        </p>

                        <p className="text-2xl font-bold text-[#800020]">
                          {product.quantity}
                        </p>
                      </div>
                    </article>
                  )
                )}
              </div>
            </section>

            {/* Address */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#800020]/10 text-[#800020]">
                  <MapPin size={20} />
                </div>

                <div>
                  <h2 className="font-bold">
                    Delivery Address
                  </h2>

                  <p className="text-xs text-gray-500">
                    Copy this address for shipment booking
                  </p>
                </div>
              </div>

              <p className="text-sm leading-7 text-gray-700">
                {getCompleteAddress(
                  order.address
                )}
              </p>
            </section>

            {/* Notes */}
            {(order.notes ||
              order.dispatchNote) && (
              <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-4 font-bold">
                  Internal Notes
                </h2>

                {order.notes && (
                  <div className="mb-3 rounded-xl bg-gray-50 p-3">
                    <p className="mb-1 text-xs font-bold uppercase text-gray-400">
                      Marketing note
                    </p>

                    <p className="text-sm text-gray-700">
                      {order.notes}
                    </p>
                  </div>
                )}

                {order.dispatchNote && (
                  <div className="rounded-xl bg-green-50 p-3">
                    <p className="mb-1 text-xs font-bold uppercase text-green-600">
                      Dispatch note
                    </p>

                    <p className="text-sm text-green-800">
                      {order.dispatchNote}
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="space-y-5">
            {/* Influencer */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <UserRound className="text-[#800020]" />

                <h2 className="font-bold">
                  Influencer Details
                </h2>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">
                    Full name
                  </p>

                  <p className="font-semibold">
                    {order.influencerName}
                  </p>
                </div>

                {order.instagramUsername && (
                  <a
                    href={`https://instagram.com/${order.instagramUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 font-semibold text-[#800020]"
                  >
                    @
                    {order.instagramUsername}
                    <ExternalLink size={14} />
                  </a>
                )}

                <a
                  href={`tel:${order.phone}`}
                  className="flex items-center gap-2 text-gray-700"
                >
                  <Phone size={15} />
                  {order.phone}
                </a>

                {order.email && (
                  <a
                    href={`mailto:${order.email}`}
                    className="flex items-center gap-2 break-all text-gray-700"
                  >
                    <Mail size={15} />
                    {order.email}
                  </a>
                )}
              </div>
            </section>

            {/* Timing */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <CalendarDays className="text-[#800020]" />

                <h2 className="font-bold">
                  Timing
                </h2>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400">
                    Created by
                  </p>

                  <p className="font-semibold">
                    {order.createdBy}
                  </p>

                  <p className="text-xs text-gray-500">
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    Last updated
                  </p>

                  <p className="font-medium">
                    {formatDate(order.updatedAt)}
                  </p>
                </div>

                {order.isDispatched && (
                  <div className="rounded-xl bg-green-50 p-3">
                    <p className="text-xs text-green-600">
                      Dispatched by
                    </p>

                    <p className="font-semibold text-green-800">
                      {order.dispatchedBy}
                    </p>

                    <p className="text-xs text-green-700">
                      {formatDate(
                        order.dispatchedAt
                      )}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Activity logs */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <History className="text-[#800020]" />

                <div>
                  <h2 className="font-bold">
                    Activity Logs
                  </h2>

                  <p className="text-xs text-gray-500">
                    Complete order history
                  </p>
                </div>
              </div>

              {sortedLogs.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No activity recorded.
                </p>
              ) : (
                <div className="space-y-0">
                  {sortedLogs.map(
                    (log, index) => (
                      <div
                        key={
                          log._id ||
                          `${log.timestamp}-${index}`
                        }
                        className="relative flex gap-3 pb-5 last:pb-0"
                      >
                        {index <
                          sortedLogs.length - 1 && (
                          <div className="absolute left-[7px] top-5 h-full w-px bg-gray-200" />
                        )}

                        <div className="relative mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-white bg-[#800020] ring-1 ring-[#800020]/20" />

                        <div>
                          <p className="text-sm font-semibold">
                            {getLogTitle(
                              log.action
                            )}
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
                  )}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      {/* Dispatch modal */}
      {dispatchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setDispatchModalOpen(false);
            }
          }}
        >
          <form
            onSubmit={handleDispatch}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <div>
                <h2 className="font-bold">
                  Confirm Dispatch
                </h2>

                <p className="text-xs text-gray-500">
                  This action records the dispatch time.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDispatchModalOpen(false)
                }
                disabled={isDispatching}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-4">
              {(localError || error) && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {localError || error}
                </div>
              )}

              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">
                  Dispatched by *
                </span>

                <input
                  value={dispatchedBy}
                  onChange={(event) =>
                    setDispatchedBy(
                      event.target.value
                    )
                  }
                  placeholder="Enter warehouse team member name"
                  className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10"
                  autoFocus
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">
                  Dispatch note
                </span>

                <textarea
                  rows={4}
                  value={dispatchNote}
                  onChange={(event) =>
                    setDispatchNote(
                      event.target.value
                    )
                  }
                  placeholder="Courier, AWB or packing note (optional)"
                  className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 p-4">
              <button
                type="button"
                onClick={() =>
                  setDispatchModalOpen(false)
                }
                disabled={isDispatching}
                className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isDispatching}
                className="inline-flex h-11 min-w-[170px] items-center justify-center gap-2 rounded-xl bg-[#800020] px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isDispatching ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    Confirm Dispatch
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}