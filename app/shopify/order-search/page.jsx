"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  MapPin,
  Package,
  Search,
  Truck,
  User,
} from "lucide-react";

import { useOrderStore } from "@/store/orderStore";

const normalizeOrderNumber = (value = "") => {
  const input = String(value).trim().toUpperCase();
  const digits = input.replace(/\D/g, "");

  if (!digits) return "";

  return `SHOP-${digits}`;
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getAddress = (order = {}) =>
  order?.shippingAddressSnapshot ||
  order?.shippingAddress ||
  order?.shopify?.raw?.shippingAddress ||
  {};

const getItems = (order = {}) => {
  if (Array.isArray(order?.items)) return order.items;
  if (Array.isArray(order?.lineItems)) return order.lineItems;

  return [];
};

function StatusBadge({ children }) {
  return (
    <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium capitalize text-neutral-700">
      {children || "—"}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 py-2.5 last:border-0">
      <span className="text-sm text-neutral-500">{label}</span>

      <span className="max-w-[70%] text-right text-sm font-medium text-neutral-900">
        {value || "—"}
      </span>
    </div>
  );
}

export default function ShopifyOrderSearchPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState("");

  const { loading, fetchOrderByNumber } = useOrderStore();

  const handleSearch = async (event) => {
    event.preventDefault();

    const orderNumber = normalizeOrderNumber(query);

    if (!orderNumber) {
      setResult(null);
      setMessage("Enter a valid Shopify order number.");
      return;
    }

    setQuery(orderNumber);
    setMessage("");
    setResult(null);

    try {
      const order = await fetchOrderByNumber(
        encodeURIComponent(orderNumber)
      );

      if (!order) {
        setMessage("Order not found.");
        return;
      }

      const isShopify =
        order?.isShopify === true ||
        String(order?.source || "").toLowerCase() === "shopify" ||
        Boolean(order?.shopify?.orderId) ||
        String(order?.orderNumber || "")
          .toUpperCase()
          .startsWith("SHOP-");

      if (!isShopify) {
        setMessage("This order is not a Shopify order.");
        return;
      }

      setResult(order);
    } catch (error) {
      setMessage(error?.message || "Shopify order not found.");
    }
  };

  const copyText = async (value, key) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(key);

      window.setTimeout(() => {
        setCopied("");
      }, 1500);
    } catch {
      setCopied("");
    }
  };

  const order = result;
  const address = getAddress(order);
  const items = getItems(order);

  const orderNumber =
    order?.orderNumber ||
    order?.shopify?.orderName ||
    order?.name ||
    "—";

  const customerName =
    order?.customerName ||
    address?.fullName ||
    address?.name ||
    `${address?.firstName || ""} ${address?.lastName || ""}`.trim() ||
    order?.customerId?.name ||
    "—";

  const customerPhone =
    order?.customerPhone ||
    address?.phone ||
    address?.mobile ||
    order?.customerId?.phone ||
    "—";

  const customerEmail =
    order?.customerEmail ||
    address?.email ||
    order?.customerId?.email ||
    "—";

  const awb =
    order?.awb ||
    order?.shipment?.awb ||
    order?.trackingDetails?.awb ||
    "";

  const courierName =
    order?.courierName ||
    order?.shipment?.courierName ||
    order?.trackingDetails?.courierName ||
    "";

  const trackingUrl =
    order?.trackingUrl ||
    order?.shipment?.trackingUrl ||
    order?.trackingDetails?.trackingUrl ||
    "";

  const labelUrl =
    order?.labelUrl ||
    order?.shipment?.labelUrl ||
    "";

  const totalItems = items.reduce(
    (total, item) => total + Number(item?.quantity || item?.qty || 0),
    0
  );

  return (
    <main className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm md:p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Miray Shopify
            </p>

            <h1 className="mt-1 text-2xl font-semibold text-neutral-950">
              Shopify Order Search
            </h1>

            <p className="mt-1 text-sm text-neutral-500">
              Search using SHOP-1234, #1234 or 1234.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />

              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setMessage("");
                }}
                placeholder="SHOP-1234"
                autoFocus
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 text-sm font-medium uppercase outline-none transition focus:border-neutral-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Search size={17} />
              )}

              Search Order
            </button>
          </form>

          {message && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {message}
            </div>
          )}
        </section>

        {order && (
          <>
            <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-neutral-950">
                      {orderNumber}
                    </h2>

                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                      Shopify
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-neutral-500">
                    Created{" "}
                    {formatDate(order?.orderDate || order?.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatusBadge>
                    {order?.fulfillmentStatus}
                  </StatusBadge>

                  <StatusBadge>{order?.paymentStatus}</StatusBadge>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl bg-neutral-50 p-3">
                  <p className="text-xs text-neutral-500">
                    Final Amount
                  </p>

                  <p className="mt-1 font-semibold text-neutral-950">
                    {formatMoney(
                      order?.finalPayable ?? order?.totalAmount
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-neutral-50 p-3">
                  <p className="text-xs text-neutral-500">Items</p>

                  <p className="mt-1 font-semibold text-neutral-950">
                    {totalItems || items.length}
                  </p>
                </div>

                <div className="rounded-xl bg-neutral-50 p-3">
                  <p className="text-xs text-neutral-500">
                    Payment Method
                  </p>

                  <p className="mt-1 font-semibold uppercase text-neutral-950">
                    {order?.paymentMethod || "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-neutral-50 p-3">
                  <p className="text-xs text-neutral-500">
                    Confirmation
                  </p>

                  <p className="mt-1 font-semibold text-neutral-950">
                    {order?.isConfirmed
                      ? "Confirmed"
                      : "Not Confirmed"}
                  </p>
                </div>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm md:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <User size={18} />
                  <h3 className="font-semibold">Customer</h3>
                </div>

                <InfoRow label="Name" value={customerName} />
                <InfoRow label="Phone" value={customerPhone} />
                <InfoRow label="Email" value={customerEmail} />
              </section>

              <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm md:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <MapPin size={18} />
                  <h3 className="font-semibold">
                    Shipping Address
                  </h3>
                </div>

                <p className="text-sm leading-6 text-neutral-700">
                  {[
                    address?.line1 || address?.address1,
                    address?.line2 || address?.address2,
                    address?.city,
                    address?.state || address?.province,
                    address?.pincode ||
                      address?.zip ||
                      address?.postalCode,
                    address?.country,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Address not available"}
                </p>
              </section>
            </div>

            <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <Package size={18} />
                <h3 className="font-semibold">Order Items</h3>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => {
                  const snapshot = item?.productSnapshot || {};
                  const variant = item?.variant || {};

                  const title =
                    snapshot?.title ||
                    item?.title ||
                    item?.name ||
                    "Product";

                  const image =
                    snapshot?.thumbnail ||
                    snapshot?.images?.[0] ||
                    item?.thumbnail ||
                    item?.image ||
                    item?.imageUrl ||
                    "";

                  const productCode =
                    snapshot?.productCode ||
                    item?.productCode ||
                    variant?.sku ||
                    item?.sku ||
                    "—";

                  const size =
                    item?.selectedSize ||
                    item?.size ||
                    variant?.attributes?.find((attribute) =>
                      ["size", "sizes"].includes(
                        String(
                          attribute?.key || ""
                        ).toLowerCase()
                      )
                    )?.value ||
                    "";

                  const color =
                    item?.selectedColor ||
                    item?.color ||
                    variant?.attributes?.find((attribute) =>
                      ["color", "colour"].includes(
                        String(
                          attribute?.key || ""
                        ).toLowerCase()
                      )
                    )?.value ||
                    "";

                  const quantity = Number(
                    item?.quantity || item?.qty || 1
                  );

                  const price = Number(item?.price || 0);

                  const subtotal = Number(
                    item?.subtotal ?? price * quantity
                  );

                  return (
                    <article
                      key={item?.lineId || item?._id || index}
                      className="flex gap-3 rounded-xl border border-neutral-100 p-3"
                    >
                      <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                        {image ? (
                          <img
                            src={image}
                            alt={title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package
                              size={20}
                              className="text-neutral-400"
                            />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-neutral-950">
                          {title}
                        </p>

                        <p className="mt-1 text-xs text-neutral-500">
                          Code: {productCode}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-600">
                          {size && (
                            <span className="rounded-md bg-neutral-100 px-2 py-1">
                              Size: {size}
                            </span>
                          )}

                          {color && (
                            <span className="rounded-md bg-neutral-100 px-2 py-1">
                              Color: {color}
                            </span>
                          )}

                          <span className="rounded-md bg-neutral-100 px-2 py-1">
                            Qty: {quantity}
                          </span>
                        </div>
                      </div>

                      <p className="shrink-0 text-sm font-semibold">
                        {formatMoney(subtotal)}
                      </p>
                    </article>
                  );
                })}

                {!items.length && (
                  <div className="rounded-xl bg-neutral-50 p-5 text-center text-sm text-neutral-500">
                    No order items available.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <Truck size={18} />
                <h3 className="font-semibold">
                  Shipping Details
                </h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <InfoRow
                    label="Courier"
                    value={courierName}
                  />

                  <div className="flex items-center justify-between gap-3 border-b border-neutral-100 py-2.5">
                    <span className="text-sm text-neutral-500">
                      AWB
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {awb || "—"}
                      </span>

                      {awb && (
                        <button
                          type="button"
                          onClick={() => copyText(awb, "awb")}
                          className="rounded-md p-1.5 transition hover:bg-neutral-100"
                          aria-label="Copy AWB"
                        >
                          {copied === "awb" ? (
                            <Check
                              size={15}
                              className="text-green-600"
                            />
                          ) : (
                            <Copy size={15} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {trackingUrl && (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 text-sm font-medium transition hover:bg-neutral-50"
                    >
                      Track Shipment
                      <ExternalLink size={15} />
                    </a>
                  )}

                  {labelUrl && (
                    <a
                      href={labelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-black text-sm font-medium text-white transition hover:bg-neutral-800"
                    >
                      Download Label
                      <ExternalLink size={15} />
                    </a>
                  )}

                  {!trackingUrl && !labelUrl && (
                    <div className="rounded-xl bg-neutral-50 p-4 text-center text-sm text-neutral-500">
                      Shipment details are not available yet.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm md:p-5">
              <div className="mb-3 flex items-center gap-2">
                <CreditCard size={18} />
                <h3 className="font-semibold">
                  Payment Summary
                </h3>
              </div>

              <InfoRow
                label="Subtotal"
                value={formatMoney(order?.subtotal)}
              />

              <InfoRow
                label="Discount"
                value={`-${formatMoney(order?.discount)}`}
              />

              <InfoRow
                label="Shipping"
                value={formatMoney(order?.shippingFee)}
              />

              <div className="flex items-center justify-between pt-3">
                <span className="font-semibold">Final Payable</span>

                <span className="text-lg font-bold">
                  {formatMoney(
                    order?.finalPayable ?? order?.totalAmount
                  )}
                </span>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}