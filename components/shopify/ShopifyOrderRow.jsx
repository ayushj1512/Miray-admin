"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Printer,
  Package,
  Truck,
  CreditCard,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import adminShopifyStore from "@/store/adminshopifystore";

const money = (amount, currency = "INR") =>
  amount || amount === 0
    ? new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount))
    : "-";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "-";

const formatTime = (date) =>
  date
    ? new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    : "-";

function getCustomerName(order) {
  if (order.customer) {
    return `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim();
  }

  return order.shippingAddress?.name || "-";
}

function getOrderNameForSearch(order) {
  return String(order?.name || "").trim();
}

function getOrderTotal(order) {
  return (
    order?.currentTotalPriceSet?.shopMoney?.amount ||
    order?.totalPriceSet?.shopMoney?.amount ||
    0
  );
}

function getOrderCurrency(order) {
  return (
    order?.currentTotalPriceSet?.shopMoney?.currencyCode ||
    order?.totalPriceSet?.shopMoney?.currencyCode ||
    "INR"
  );
}

function getLineImage(item) {
  return (
    item?.variant?.image?.url ||
    item?.variant?.product?.featuredMedia?.preview?.image?.url ||
    ""
  );
}

function StatusBadge({ type, value }) {
  const text = value || "-";
  const key = String(text).toLowerCase();

  const styles =
    type === "payment"
      ? key.includes("paid")
        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
        : key.includes("pending")
          ? "bg-amber-50 text-amber-700 border-amber-100"
          : key.includes("refunded")
            ? "bg-blue-50 text-blue-700 border-blue-100"
            : "bg-neutral-100 text-neutral-600 border-neutral-200"
      : key.includes("fulfilled")
        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
        : key.includes("partial")
          ? "bg-blue-50 text-blue-700 border-blue-100"
          : "bg-amber-50 text-amber-700 border-amber-100";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${styles}`}
    >
      {text}
    </span>
  );
}

export default function ShopifyOrderRow({
  order,
  syncedInfo,
  checked,
  onToggle,
  onPreview,
  onPrint,
}) {
  const [open, setOpen] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  const { syncingOrders, syncShopifyOrdersToLocal } = adminShopifyStore();

  const lineItems = useMemo(() => order?.lineItems?.edges || [], [order]);
  const tracking = order?.fulfillments?.[0]?.trackingInfo?.[0];

  const alreadyImported = Boolean(
    syncedInfo?.isImported || syncedInfo?.isSynced
  );

  const handleImportOne = async () => {
    if (alreadyImported) {
      setImportStatus({
        type: "success",
        message: "Already imported",
      });
      return;
    }

    const orderName = getOrderNameForSearch(order);
    if (!orderName || syncingOrders) return;

    setImportStatus(null);

    const res = await syncShopifyOrdersToLocal({
      search: orderName,
      limit: 1,
    });

    if (res?.success === false) {
      setImportStatus({
        type: "error",
        message: res?.message || "Import failed",
      });
      return;
    }

    const summary = res?.summary || res?.data || res;
    const failed = Number(summary?.failed || 0);
    const created = Number(summary?.created || 0);

    if (failed > 0) {
      setImportStatus({
        type: "error",
        message: summary?.errors?.[0]?.message || "Import failed",
      });
      return;
    }

    setImportStatus({
      type: "success",
      message: created > 0 ? "Imported" : "Already imported",
    });
  };

  return (
    <>
      <tr className="border-t border-neutral-100 bg-white transition hover:bg-[#fff9fb]">
        <td className="px-5 py-4">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="h-4 w-4 accent-[#800020]"
          />
        </td>

        <td className="px-5 py-4">
          <div className="font-black text-black">{order.name}</div>

          <div className="mt-1 text-xs font-semibold text-neutral-400">
            {lineItems.length} item{lineItems.length === 1 ? "" : "s"}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {alreadyImported && (
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">
                <CheckCircle2 size={12} />
                Imported
              </div>
            )}

            {syncedInfo?.localOrderNumber && (
              <div className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-black text-neutral-600">
                {syncedInfo.localOrderNumber}
              </div>
            )}

            {importStatus && (
              <div
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${importStatus.type === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                  }`}
              >
                {importStatus.type === "success" ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <AlertCircle size={12} />
                )}
                {importStatus.message}
              </div>
            )}
          </div>
        </td>

        <td className="px-5 py-4">
          <div className="font-bold text-neutral-800">{getCustomerName(order)}</div>
          <div className="mt-1 text-xs text-neutral-400">
            {order.customer?.email || order.shippingAddress?.phone || "-"}
          </div>
        </td>

        <td className="px-5 py-4">
          <div className="font-bold text-neutral-700">
            {formatDate(order.createdAt)}
          </div>

          <div className="mt-1 text-xs font-semibold text-neutral-400">
            {formatTime(order.createdAt)}
          </div>
        </td>

        <td className="px-5 py-4">
          <StatusBadge type="payment" value={order.displayFinancialStatus} />
        </td>

        <td className="px-5 py-4">
          <StatusBadge type="fulfillment" value={order.displayFulfillmentStatus} />
        </td>

        <td className="px-5 py-4 font-black text-black">
          {money(getOrderTotal(order), getOrderCurrency(order))}
        </td>

        <td className="px-5 py-4 text-right">
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-2 text-xs font-black text-black"
            >
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Details
            </button>

            <button
              onClick={handleImportOne}
              disabled={syncingOrders || alreadyImported}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-black disabled:cursor-not-allowed disabled:opacity-60 ${alreadyImported
                  ? "bg-neutral-100 text-neutral-500"
                  : "bg-emerald-50 text-emerald-700"
                }`}
            >
              {alreadyImported ? (
                <CheckCircle2 size={13} />
              ) : (
                <RefreshCw
                  size={13}
                  className={syncingOrders ? "animate-spin" : ""}
                />
              )}

              {alreadyImported
                ? "Imported"
                : syncingOrders
                  ? "Importing"
                  : "Import"}
            </button>

            <button
              onClick={onPreview}
              className="inline-flex items-center gap-1 rounded-full bg-[#fff1f5] px-3 py-2 text-xs font-black text-[#800020]"
            >
              <Eye size={13} />
              Preview
            </button>

            <button
              onClick={onPrint}
              className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-2 text-xs font-black text-white"
            >
              <Printer size={13} />
              Invoice
            </button>
          </div>
        </td>
      </tr>

      {open && (
        <tr className="bg-[#faf9f8]">
          <td colSpan={8} className="px-5 pb-5">
            <div className="rounded-[24px] border border-neutral-100 bg-white p-5">
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard
                  icon={<CreditCard size={16} />}
                  label="Payment"
                  value={order.displayFinancialStatus || "-"}
                />
                <InfoCard
                  icon={<Truck size={16} />}
                  label="Tracking"
                  value={tracking?.number || "Not shipped yet"}
                  sub={tracking?.company}
                />
                <InfoCard
                  icon={<Package size={16} />}
                  label="Delivery Address"
                  value={order.shippingAddress?.city || "-"}
                  sub={`${order.shippingAddress?.province || ""} ${order.shippingAddress?.zip || ""
                    }`}
                />
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-neutral-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#faf9f8] text-[11px] uppercase tracking-wide text-neutral-400">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Variant</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Price</th>
                    </tr>
                  </thead>

                  <tbody>
                    {lineItems.map((edge) => {
                      const item = edge.node;
                      const image = getLineImage(item);

                      return (
                        <tr
                          key={item.id || item.title}
                          className="border-t border-neutral-100"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {image ? (
                                <img
                                  src={image}
                                  alt={item.title || "Product"}
                                  className="h-11 w-11 rounded-xl object-cover"
                                />
                              ) : (
                                <div className="grid h-11 w-11 place-items-center rounded-xl bg-neutral-100 text-[10px] text-neutral-400">
                                  No Img
                                </div>
                              )}

                              <div>
                                <p className="font-bold text-black">
                                  {item.title || "-"}
                                </p>
                                <p className="text-xs font-semibold text-neutral-400">
                                  {item.sku || item?.variant?.sku || "No SKU"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-neutral-500">
                            {item.variantTitle || item?.variant?.title || "-"}
                          </td>

                          <td className="px-4 py-3 font-bold text-neutral-700">
                            {item.quantity || 1}
                          </td>

                          <td className="px-4 py-3 font-bold text-black">
                            {money(
                              item?.discountedUnitPriceSet?.shopMoney?.amount ||
                              item?.originalUnitPriceSet?.shopMoney?.amount,
                              item?.discountedUnitPriceSet?.shopMoney?.currencyCode ||
                              item?.originalUnitPriceSet?.shopMoney?.currencyCode
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {!lineItems.length && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-6 text-center text-sm font-semibold text-neutral-400"
                        >
                          No product details found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function InfoCard({ icon, label, value, sub }) {
  return (
    <div className="rounded-2xl bg-[#faf9f8] p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#800020] shadow-sm">
        {icon}
      </div>
      <p className="text-[11px] font-black uppercase tracking-wide text-neutral-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-black">{value}</p>
      {sub && <p className="mt-1 text-xs font-semibold text-neutral-400">{sub}</p>}
    </div>
  );
}