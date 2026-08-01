"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Eye,
  Loader2,
  MoreVertical,
  XCircle,
} from "lucide-react";

import {
  getVariantIdFromItem,
  resolveItemImage,
  safeId,
} from "./productionUtils";

function Tag({ label }) {
  return (
    <span className="rounded-full bg-white px-2 py-1 text-[11px] text-gray-700 ring-1 ring-black/5">
      {label}
    </span>
  );
}

function StatusPill({ status }) {
  const value = String(status || "processing");

  const styles = {
    processing: "bg-yellow-100 text-yellow-800",
    packed: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    out_for_delivery: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    rto: "bg-gray-200 text-gray-800",
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-medium ${
        styles[value] || "bg-gray-100 text-gray-800"
      }`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

function ItemStatusBadge({ item }) {
  const allocated = Number(item?.fulfillment?.allocatedQty || 0);
  const pending = Number(item?.fulfillment?.toProduceQty || 0);
  const shipped = Number(item?.fulfillment?.shippedQty || 0);

  const status =
    shipped > 0
      ? ["Shipped", "bg-blue-100 text-blue-800"]
      : pending > 0
        ? ["Pending", "bg-amber-100 text-amber-800"]
        : allocated > 0
          ? ["Reserved", "bg-green-100 text-green-800"]
          : null;

  if (!status) return null;

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${status[1]}`}
    >
      {status[0]}
    </span>
  );
}

function ItemRow({ item }) {
  const title = item?.productSnapshot?.title || "Item";
  const image = resolveItemImage(item);
  const quantity = Number(item?.quantity || 1);
  const size = item?.selectedSize || "";
  const color = item?.selectedColor || "";
  const sku = item?.variant?.sku || item?.productSnapshot?.sku || "";

  return (
    <div className="flex gap-2 rounded-xl bg-gray-50 p-2">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-[10px] text-gray-400">No Image</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-xs font-medium text-gray-900">
            {title}
          </p>

          <ItemStatusBadge item={item} />
        </div>

        <div className="mt-1 flex flex-wrap gap-1">
          <Tag label={`Qty: ${quantity}`} />
          {size && <Tag label={`Size: ${size}`} />}
          {color && <Tag label={`Color: ${color}`} />}
          {sku && <Tag label={`SKU: ${sku}`} />}
        </div>
      </div>
    </div>
  );
}

export default function ProductionOrderCard({
  order,
  onOpen,
  onMarkPacked,
  onCancel,
  canMarkPacked,
  showSelect = false,
  isPackable = false,
  isBlacklisted = false,
  selected = false,
  onToggleSelect,
  packing = false,
  cancelling = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const items = order?.items || [];

  const itemsCount = items.reduce(
    (sum, item) => sum + Number(item?.quantity || 0),
    0
  );

  const blacklistReason =
    order?.customerId?.blacklistReason ||
    order?.customer?.blacklistReason ||
    "";

  const disablePack =
    !isPackable || packing || cancelling || isBlacklisted;

  useEffect(() => {
    const closeMenu = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeMenu);

    return () => {
      document.removeEventListener("mousedown", closeMenu);
    };
  }, []);

  return (
    <div
      onClick={onOpen}
      className={[
        "cursor-pointer rounded-2xl shadow-sm ring-1 transition hover:shadow",
        isBlacklisted
          ? "bg-red-50 ring-red-300"
          : "bg-white ring-black/5",
        selected ? "ring-2 ring-black/70" : "",
      ].join(" ")}
    >
      {isBlacklisted && (
        <div className="flex gap-2 rounded-t-2xl border-b border-red-200 bg-red-100 px-3 py-2 text-red-800">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />

          <div>
            <p className="text-xs font-semibold">
              Blacklisted customer — do not pack or ship
            </p>

            {blacklistReason && (
              <p className="mt-0.5 text-[11px]">
                Reason: {blacklistReason}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 px-3 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          {showSelect && (
            <div
              className="pt-0.5"
              onClick={(event) => event.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={selected}
                disabled={!isPackable || isBlacklisted}
                onChange={() => onToggleSelect?.()}
                className="h-4 w-4 accent-black disabled:opacity-40"
              />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-gray-900">
                {order?.orderNumber}
              </h3>

              <StatusPill status={order?.fulfillmentStatus} />

              <span className="text-[11px] text-gray-500">
                • {itemsCount} pcs
              </span>

              {isBlacklisted ? (
                <span className="rounded-full bg-red-600 px-2 py-1 text-[11px] font-medium text-white">
                  Shipping Blocked
                </span>
              ) : showSelect ? (
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                    isPackable
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {isPackable ? "Packable" : "Unpackable"}
                </span>
              ) : null}
            </div>

            <p className="mt-0.5 truncate text-[11px] text-gray-500">
              {order?.shippingAddressSnapshot?.fullName || "—"} •{" "}
              {order?.shippingAddressSnapshot?.phone || "—"} •{" "}
              {new Date(
                order?.createdAt || order?.orderDate || Date.now()
              ).toLocaleString()}
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              ₹{Number(order?.finalPayable || 0).toFixed(0)}
            </p>

            <p className="text-[11px] text-gray-500">
              {String(order?.paymentMethod || "").toUpperCase()} •{" "}
              {order?.paymentStatus || "pending"}
            </p>
          </div>

          {canMarkPacked && (
            <button
              type="button"
              onClick={onMarkPacked}
              disabled={disablePack}
              className="rounded-xl bg-black px-3 py-2 text-xs text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isBlacklisted
                ? "Blocked"
                : packing
                  ? "Packing..."
                  : "Mark Packed"}
            </button>
          )}

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            >
              <MoreVertical size={18} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-11 z-30 w-44 rounded-xl border border-gray-200 bg-white p-1 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpen?.();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-100"
                >
                  <Eye size={15} />
                  View Order
                </button>

                {order?.fulfillmentStatus !== "cancelled" && (
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={() => {
                      setMenuOpen(false);
                      onCancel?.();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {cancelling ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <XCircle size={15} />
                    )}

                    Cancel Order
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 pb-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {items.map((item, index) => (
            <ItemRow
              key={String(
                item?._id ||
                  `${safeId(item?.productId)}-${
                    getVariantIdFromItem(item) || "simple"
                  }-${index}`
              )}
              item={item}
            />
          ))}
        </div>
      </div>
    </div>
  );
}