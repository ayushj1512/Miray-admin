"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  PackageSearch,
  RefreshCw,
  Search,
} from "lucide-react";

import { useOrderStore } from "@/store/orderStore";

const ORDER_SOURCES = {
  shopify: {
    label: "Shopify Order",
    prefix: "SHOP",
  },
  website: {
    label: "Website Order",
    prefix: "MIRAY",
  },
};

const SIZE_OPTIONS = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
  "4XL",
  "5XL",
  "FREE",
];

const normalizeOrderNumber = (value, source = "shopify") => {
  const raw = String(value || "").trim().toUpperCase();

  if (!raw) return "";

  const prefix =
    source === "website"
      ? ORDER_SOURCES.website.prefix
      : ORDER_SOURCES.shopify.prefix;

  const cleaned = raw
    .replace(/^SHOP[-\s]?/i, "")
    .replace(/^MIRAY[-\s]?/i, "")
    .replace(/^#/, "")
    .trim();

  return cleaned ? `${prefix}-${cleaned}` : "";
};

const getItemImage = (item = {}) =>
  item?.productSnapshot?.thumbnail ||
  item?.productSnapshot?.images?.[0] ||
  "/placeholder.png";

const getItemTitle = (item = {}) =>
  item?.productSnapshot?.title || "Untitled product";

const getItemCode = (item = {}) =>
  item?.productSnapshot?.productCode ||
  item?.variant?.sku ||
  item?.productSnapshot?.sku ||
  "—";

const getCurrentSize = (item = {}) => {
  const selectedSize = String(item?.selectedSize || "")
    .trim()
    .toUpperCase();

  if (selectedSize) return selectedSize;

  const sizeAttribute = item?.variant?.attributes?.find((attribute) =>
    ["size", "sizes", "shirt_size"].includes(
      String(attribute?.key || "").trim().toLowerCase()
    )
  );

  return String(sizeAttribute?.value || "")
    .trim()
    .toUpperCase();
};

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function OrderSizeChange({
  defaultSource = "shopify",
  showSourceSelector = true,
  title = "Change Order Item Size",
  description = "Search an order and update the selected size of any order item.",
}) {
  const {
    order,
    loading,
    error,
    fetchOrderByNumber,
    updateOrderItemSize,
    clearOrder,
  } = useOrderStore();

  const [source, setSource] = useState(defaultSource);
  const [orderInput, setOrderInput] = useState("");
  const [selectedSizes, setSelectedSizes] = useState({});
  const [updatingLineId, setUpdatingLineId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const normalizedPreview = useMemo(
    () => normalizeOrderNumber(orderInput, source),
    [orderInput, source]
  );

  const orderItems = Array.isArray(order?.items) ? order.items : [];
  const isShopify = source === "shopify";

  const clearMessage = () => {
    setMessage("");
    setMessageType("");
  };

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const resetOrderState = () => {
    setSelectedSizes({});
    setUpdatingLineId("");
    clearMessage();
    clearOrder();
  };

  const handleSourceChange = (nextSource) => {
    setSource(nextSource);
    setOrderInput("");
    resetOrderState();
  };

  const handleSearch = async (event) => {
    event.preventDefault();

    const orderNumber = normalizeOrderNumber(orderInput, source);

    if (!orderNumber) {
      showMessage("Please enter an order number.");
      return;
    }

    try {
      resetOrderState();

      const foundOrder = await fetchOrderByNumber(orderNumber);

      if (!foundOrder?._id) {
        showMessage("Order not found.");
        return;
      }

      const actualSource = String(foundOrder?.source || "")
        .trim()
        .toLowerCase();

      if (source === "shopify" && actualSource !== "shopify") {
        clearOrder();
        showMessage("This is not a Shopify order.");
        return;
      }

      if (source === "website" && actualSource === "shopify") {
        clearOrder();
        showMessage("This is a Shopify order. Use the Shopify size-change page.");
        return;
      }

      const initialSizes = {};

      for (const item of foundOrder.items || []) {
        if (item?.lineId) {
          initialSizes[item.lineId] = getCurrentSize(item);
        }
      }

      setSelectedSizes(initialSizes);
    } catch (searchError) {
      showMessage(searchError?.message || "Unable to find order.");
    }
  };

  const handleUpdateSize = async (item) => {
    const lineId = item?.lineId;
    const currentSize = getCurrentSize(item);
    const newSize = String(selectedSizes[lineId] || "")
      .trim()
      .toUpperCase();

    if (!lineId) {
      showMessage("Order item line ID is missing.");
      return;
    }

    if (!newSize) {
      showMessage("Please select a size.");
      return;
    }

    if (newSize === currentSize) {
      showMessage("Please select a different size.");
      return;
    }

    try {
      setUpdatingLineId(lineId);
      clearMessage();

const requestLineId = isShopify
  ? encodeURIComponent(lineId)
  : lineId;

await updateOrderItemSize(
  order._id,
  requestLineId,
  newSize,
  {
    source,
    quantity: isShopify
      ? Number(item?.quantity || 1)
      : null,
    notifyCustomer: false,
  }
);

      showMessage(
        `${getItemTitle(item)} size changed from ${
          currentSize || "Not set"
        } to ${newSize}${isShopify ? " on Shopify and local admin" : ""}.`,
        "success"
      );
    } catch (updateError) {
      showMessage(updateError?.message || "Unable to update size.");
    } finally {
      setUpdatingLineId("");
    }
  };

  const handleReset = () => {
    setSource(defaultSource);
    setOrderInput("");
    resetOrderState();
  };

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Order Management
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
            {title}
          </h1>

          <p className="mt-2 text-sm text-neutral-500">{description}</p>
        </header>

        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
          {showSourceSelector ? (
            <div className="mb-5">
              <p className="mb-3 text-sm font-semibold text-neutral-900">
                Select order source
              </p>

              <div className="grid grid-cols-2 gap-2 rounded-xl bg-neutral-100 p-1">
                {Object.entries(ORDER_SOURCES).map(([value, option]) => {
                  const active = source === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleSourceChange(value)}
                      className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                        active
                          ? "bg-neutral-950 text-white shadow-sm"
                          : "text-neutral-600 hover:bg-white hover:text-neutral-950"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mb-5">
              <span className="inline-flex rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white">
                {ORDER_SOURCES[source]?.label}
              </span>
            </div>
          )}

          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="min-w-0 flex-1">
              <label
                htmlFor="orderNumber"
                className="mb-2 block text-sm font-medium text-neutral-700"
              >
                Order number
              </label>

              <div className="relative">
                <PackageSearch
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />

                <input
                  id="orderNumber"
                  value={orderInput}
                  onChange={(event) => {
                    setOrderInput(event.target.value);
                    clearMessage();
                  }}
                  placeholder={
                    isShopify
                      ? "Enter 123 or SHOP-123"
                      : "Enter 123 or MIRAY-123"
                  }
                  className="h-12 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-4 text-sm font-medium text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950"
                />
              </div>

              {normalizedPreview && (
                <p className="mt-2 text-xs text-neutral-500">
                  Search as:{" "}
                  <span className="font-semibold text-neutral-900">
                    {normalizedPreview}
                  </span>
                </p>
              )}
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={loading || !orderInput.trim()}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Search size={18} />
                )}

                Search order
              </button>

              <button
                type="button"
                onClick={handleReset}
                title="Reset"
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-neutral-300 bg-white text-neutral-700 transition hover:border-neutral-950 hover:text-neutral-950"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </form>
        </section>

        {(message || error) && (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${
              messageType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message || error}
          </div>
        )}

        {order?._id && (
          <section className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    Order found
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-neutral-950">
                    {order.orderNumber}
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    {order?.shippingAddressSnapshot?.fullName ||
                      "Customer name unavailable"}

                    {order?.shippingAddressSnapshot?.phone
                      ? ` · ${order.shippingAddressSnapshot.phone}`
                      : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold capitalize text-neutral-700">
                    {source}
                  </span>

                  <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold capitalize text-neutral-700">
                    {order.fulfillmentStatus || "processing"}
                  </span>

                  <span className="rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white">
                    {orderItems.length} item
                    {orderItems.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>

            {!orderItems.length ? (
              <div className="p-8 text-center text-sm text-neutral-500">
                No order items found.
              </div>
            ) : (
              <div className="divide-y divide-neutral-200">
                {orderItems.map((item, index) => {
                  const lineId = item?.lineId;
                  const currentSize = getCurrentSize(item);
                  const selectedSize =
                    selectedSizes[lineId] || currentSize || "";

                  const isUpdating = updatingLineId === lineId;
                  const hasChanged =
                    Boolean(selectedSize) && selectedSize !== currentSize;

                  return (
                    <article
                      key={lineId || `${item?.productId}-${index}`}
                      className="p-4 sm:p-6"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                        <div className="flex min-w-0 flex-1 gap-4">
                          <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                            <img
                              src={getItemImage(item)}
                              alt={getItemTitle(item)}
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.src = "/placeholder.png";
                              }}
                            />
                          </div>

                          <div className="min-w-0 py-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                              Item {index + 1}
                            </p>

                            <h3 className="mt-1 line-clamp-2 text-base font-bold text-neutral-950">
                              {getItemTitle(item)}
                            </h3>

                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500">
                              <span>
                                Code:{" "}
                                <strong className="text-neutral-800">
                                  {getItemCode(item)}
                                </strong>
                              </span>

                              <span>
                                Qty:{" "}
                                <strong className="text-neutral-800">
                                  {item?.quantity || 1}
                                </strong>
                              </span>

                              <span>{formatPrice(item?.price)}</span>
                            </div>

                            <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700">
                              Current size:
                              <span className="text-neutral-950">
                                {currentSize || "Not set"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-end">
                          <div className="w-full sm:w-52">
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
                              New size
                            </label>

                            <select
                              value={selectedSize}
                              onChange={(event) =>
                                setSelectedSizes((current) => ({
                                  ...current,
                                  [lineId]: event.target.value,
                                }))
                              }
                              disabled={!lineId || isUpdating}
                              className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-950 outline-none transition focus:border-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-100"
                            >
                              <option value="">Select size</option>

                              {SIZE_OPTIONS.map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleUpdateSize(item)}
                            disabled={
                              !lineId ||
                              !hasChanged ||
                              isUpdating ||
                              Boolean(updatingLineId)
                            }
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {isUpdating ? (
                              <>
                                <Loader2 size={17} className="animate-spin" />
                                Updating
                              </>
                            ) : hasChanged ? (
                              <>
                                Change size
                                <ArrowRight size={17} />
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={17} />
                                Current size
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}