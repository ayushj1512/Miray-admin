"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useInventoryReservationStore } from "@/store/inventoryReservationStore";

const SHOPIFY_SOURCE = "shopify";

const safe = (v, fb = "") => (v == null ? fb : String(v));

const money = (n) => {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
};

const fmtDateTime = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";

  return dt.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const normalizeProductCode = (value) => {
  const raw = safe(value).trim();
  if (!raw) return "-";

  const digits = raw.match(/(\d+)/)?.[1];
  if (!digits) return raw;

  return digits.padStart(5, "0");
};

const normalizeShopifyOrderNo = (value) => {
  const raw = safe(value).trim();
  if (!raw) return "-";

  const digits =
    raw.match(/SHOP-(\d+)/i)?.[1] ||
    raw.match(/#?(\d+)$/)?.[1] ||
    raw.match(/(\d+)/)?.[1];

  if (!digits) return raw;

  return `SHOP-${digits.padStart(4, "0")}`;
};

const STATUS_OPTIONS = ["", "reserved", "released", "consumed", "expired"];

export default function ShopifyReservedInventoryPage() {
  const {
    loading,
    actionLoading,
    error,
    clearError,
    reservations,
    total,
    filters,
    setFilters,
    resetFilters,
    fetchShopifyReservations,
    releaseReservation,
    consumeReservation,
    expireReservation,
    expireDueReservations,
  } = useInventoryReservationStore();

  const [form, setForm] = useState({
    ...filters,
    source: SHOPIFY_SOURCE,
    refType: "order",
  });

  const [reasonById, setReasonById] = useState({});
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkReason, setBulkReason] = useState("");

  const shopifyFilters = useMemo(
    () => ({
      ...filters,
      source: SHOPIFY_SOURCE,
      refType: "order",
    }),
    [filters]
  );

  useEffect(() => {
    fetchShopifyReservations({
      source: SHOPIFY_SOURCE,
      refType: "order",
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = useMemo(() => {
    const arr = Array.isArray(reservations) ? reservations : [];

    return [...arr].sort((a, b) => {
      const sa = safe(a?.status);
      const sb = safe(b?.status);

      if (sa === "reserved" && sb !== "reserved") return -1;
      if (sb === "reserved" && sa !== "reserved") return 1;

      return (
        new Date(b?.createdAt || 0).getTime() -
        new Date(a?.createdAt || 0).getTime()
      );
    });
  }, [reservations]);

  const reservedIds = useMemo(() => {
    const set = new Set();

    for (const r of list) {
      if (safe(r?.status) === "reserved") {
        set.add(safe(r?._id));
      }
    }

    return set;
  }, [list]);

  const selectedCount = useMemo(() => {
    let count = 0;

    selectedIds.forEach((id) => {
      if (reservedIds.has(id)) count += 1;
    });

    return count;
  }, [selectedIds, reservedIds]);

  const allReservedSelected = useMemo(() => {
    if (!reservedIds.size) return false;
    if (!selectedCount) return false;
    return selectedCount === reservedIds.size;
  }, [reservedIds.size, selectedCount]);

  const anyReservedSelected = selectedCount > 0;

  useEffect(() => {
    setSelectedIds((prev) => {
      if (!prev?.size) return prev;

      const next = new Set();

      prev.forEach((id) => {
        if (reservedIds.has(id)) next.add(id);
      });

      return next;
    });
  }, [reservedIds]);

  const applyFilters = async () => {
    clearError?.();

    const next = {
      source: SHOPIFY_SOURCE,
      refType: "order",
      productCode: safe(form.productCode).trim(),
      orderNumber: safe(form.orderNumber).trim(),
      productTitle: safe(form.productTitle).trim(),
      productId: safe(form.productId).trim(),
      variantId: safe(form.variantId).trim(),
      status: safe(form.status).trim(),
      refId: safe(form.refId).trim(),
    };

    setFilters(next);
    await fetchShopifyReservations(next);
  };

  const clearFilters = async () => {
    clearError?.();
    resetFilters();

    const empty = {
      source: SHOPIFY_SOURCE,
      refType: "order",
      productCode: "",
      orderNumber: "",
      productTitle: "",
      productId: "",
      variantId: "",
      status: "",
      refId: "",
    };

    setForm(empty);
    setFilters(empty);
    await fetchShopifyReservations(empty);
  };

  const refreshReservations = async () => {
    await fetchShopifyReservations({
      ...shopifyFilters,
      source: SHOPIFY_SOURCE,
      refType: "order",
    }).catch(() => {});
  };

  const doAction = async (type, id) => {
    if (!id) return;

    clearError?.();

    const reason = safe(reasonById[id]).trim();

    try {
      if (type === "release") await releaseReservation(id, reason);
      if (type === "consume") await consumeReservation(id, reason);
      if (type === "expire") await expireReservation(id, reason);

      await refreshReservations();
    } catch {}
  };

  const onExpireDue = async () => {
    clearError?.();

    try {
      await expireDueReservations();
      await refreshReservations();
    } catch {}
  };

  const toggleOne = (id) => {
    if (!id) return;
    if (!reservedIds.has(id)) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  };

  const toggleAllReserved = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const shouldSelectAll = !allReservedSelected;

      reservedIds.forEach((id) => next.delete(id));

      if (shouldSelectAll) {
        reservedIds.forEach((id) => next.add(id));
      }

      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const runBulk = async (type) => {
    clearError?.();

    const ids = Array.from(selectedIds).filter((id) => reservedIds.has(id));
    if (!ids.length) return;

    const reason = safe(bulkReason).trim();

    try {
      for (const id of ids) {
        if (type === "release") await releaseReservation(id, reason);
        if (type === "consume") await consumeReservation(id, reason);
        if (type === "expire") await expireReservation(id, reason);
      }

      clearSelection();
      setBulkReason("");
      await refreshReservations();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <div className="text-2xl font-extrabold tracking-tight">
              Shopify Reserved Inventory
            </div>

            <div className="text-sm text-gray-600 mt-1">
              Shopify records: <span className="font-semibold">{list.length}</span>
              {" / "}
              Total: <span className="font-semibold">{total}</span>
              {loading ? (
                <span className="ml-2 text-xs text-gray-500">loading...</span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={refreshReservations}
              disabled={loading || actionLoading}
              className="h-10 px-4 rounded-xl bg-white ring-1 ring-black/10 hover:ring-black/20 disabled:opacity-60"
            >
              Refresh
            </button>

            <button
              onClick={onExpireDue}
              disabled={loading || actionLoading}
              className="h-10 px-4 rounded-xl bg-black text-white hover:bg-black/90 disabled:opacity-60"
            >
              Expire Due
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3">
            <div className="text-sm font-semibold text-red-700">Error</div>
            <div className="text-sm text-red-700 mt-1">{error}</div>

            <button
              onClick={() => clearError?.()}
              className="mt-2 text-xs underline text-red-700"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="rounded-2xl bg-white ring-1 ring-black/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-bold">Shopify Filters</div>
              <div className="text-xs text-gray-500 mt-1">
                Backend locked to SHOP- orders only. MIRAY orders will not show here.
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-black text-white text-xs font-semibold">
              SHOP orders only
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-8 gap-2">
            <input
              value={form.orderNumber || ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, orderNumber: e.target.value }))
              }
              placeholder="SHOP-0001"
              className="h-10 px-3 rounded-xl bg-gray-100/70 ring-1 ring-black/10 outline-none md:col-span-2"
            />

            <input
              value={form.productCode || ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, productCode: e.target.value }))
              }
              placeholder="00001"
              className="h-10 px-3 rounded-xl bg-gray-100/70 ring-1 ring-black/10 outline-none"
            />

            <input
              value={form.productTitle || ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, productTitle: e.target.value }))
              }
              placeholder="product title"
              className="h-10 px-3 rounded-xl bg-gray-100/70 ring-1 ring-black/10 outline-none md:col-span-2"
            />

            <select
              value={form.status || ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, status: e.target.value }))
              }
              className="h-10 px-3 rounded-xl bg-gray-100/70 ring-1 ring-black/10 outline-none"
            >
              {STATUS_OPTIONS.map((x) => (
                <option key={x} value={x}>
                  {x ? `status: ${x}` : "status: any"}
                </option>
              ))}
            </select>

            <input
              value={form.refId || ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, refId: e.target.value }))
              }
              placeholder="refId / orderId"
              className="h-10 px-3 rounded-xl bg-gray-100/70 ring-1 ring-black/10 outline-none md:col-span-2"
            />

            <input
              value={form.productId || ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, productId: e.target.value }))
              }
              placeholder="productId"
              className="h-10 px-3 rounded-xl bg-gray-100/70 ring-1 ring-black/10 outline-none md:col-span-2"
            />

            <input
              value={form.variantId || ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, variantId: e.target.value }))
              }
              placeholder="variantId"
              className="h-10 px-3 rounded-xl bg-gray-100/70 ring-1 ring-black/10 outline-none md:col-span-2"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={applyFilters}
              disabled={loading || actionLoading}
              className="h-10 px-4 rounded-xl bg-black text-white hover:bg-black/90 disabled:opacity-60"
            >
              Apply
            </button>

            <button
              onClick={clearFilters}
              disabled={loading || actionLoading}
              className="h-10 px-4 rounded-xl bg-white ring-1 ring-black/10 hover:ring-black/20 disabled:opacity-60"
            >
              Clear
            </button>

            <div className="ml-auto text-xs text-gray-500 flex items-center">
              {actionLoading ? "Working..." : ""}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white ring-1 ring-black/10 p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAllReserved}
                disabled={loading || actionLoading || reservedIds.size === 0}
                className="h-10 px-4 rounded-xl bg-white ring-1 ring-black/10 hover:ring-black/20 disabled:opacity-60"
              >
                {allReservedSelected ? "Unselect All" : "Select All"}
              </button>

              <button
                onClick={clearSelection}
                disabled={loading || actionLoading || !selectedIds.size}
                className="h-10 px-4 rounded-xl bg-white ring-1 ring-black/10 hover:ring-black/20 disabled:opacity-60"
              >
                Clear Selection
              </button>

              <div className="text-sm text-gray-700">
                Selected:{" "}
                <span className="font-semibold">
                  {selectedCount}/{reservedIds.size}
                </span>{" "}
                <span className="text-xs text-gray-500">(reserved only)</span>
              </div>
            </div>

            <div className="flex-1" />

            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <input
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder="bulk reason optional"
                className="h-10 px-3 rounded-xl bg-gray-100/70 ring-1 ring-black/10 outline-none text-sm w-full md:w-[320px]"
                disabled={actionLoading}
              />

              <div className="flex gap-2">
                <button
                  onClick={() => runBulk("release")}
                  disabled={!anyReservedSelected || actionLoading || loading}
                  className="h-10 px-4 rounded-xl bg-white ring-1 ring-black/10 hover:ring-black/20 disabled:opacity-50"
                >
                  Bulk Release
                </button>

                <button
                  onClick={() => runBulk("consume")}
                  disabled={!anyReservedSelected || actionLoading || loading}
                  className="h-10 px-4 rounded-xl bg-black text-white hover:bg-black/90 disabled:opacity-50"
                >
                  Bulk Consume
                </button>

                <button
                  onClick={() => runBulk("expire")}
                  disabled={!anyReservedSelected || actionLoading || loading}
                  className="h-10 px-4 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Bulk Expire
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white ring-1 ring-black/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="font-bold">Shopify Reservations</div>

            <div className="text-xs text-gray-500">
              Showing: <span className="font-semibold">{list.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1280px]">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left font-semibold px-4 py-3 w-[56px]">
                    <input
                      type="checkbox"
                      checked={allReservedSelected}
                      onChange={toggleAllReserved}
                      disabled={loading || actionLoading || reservedIds.size === 0}
                      className="h-4 w-4 accent-black"
                    />
                  </th>

                  <th className="text-left font-semibold px-4 py-3">Status</th>
                  <th className="text-left font-semibold px-4 py-3">Shopify Order</th>
                  <th className="text-left font-semibold px-4 py-3">Product</th>
                  <th className="text-left font-semibold px-4 py-3">Variant</th>
                  <th className="text-right font-semibold px-4 py-3">Qty</th>
                  <th className="text-left font-semibold px-4 py-3">Ref</th>
                  <th className="text-left font-semibold px-4 py-3">Expires</th>
                  <th className="text-left font-semibold px-4 py-3">Created</th>
                  <th className="text-left font-semibold px-4 py-3">Notes</th>
                  <th className="text-left font-semibold px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {!list.length ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-gray-500" colSpan={11}>
                      {loading
                        ? "Loading Shopify reservations..."
                        : "No SHOP reservations found"}
                    </td>
                  </tr>
                ) : (
                  list.map((r) => {
                    const id = safe(r?._id);
                    const status = safe(r?.status, "-");
                    const isReserved = status === "reserved";

                    const title = safe(r?.productTitle) || "-";
                    const rawCode = safe(r?.productCode) || "-";
                    const code = normalizeProductCode(rawCode);
                    const img = safe(r?.productImage);

                    const rawOrderNo =
                      safe(r?.orderNumber) ||
                      safe(r?.shopifyOrderName) ||
                      safe(r?.orderName) ||
                      "-";

                    const orderNo = normalizeShopifyOrderNo(rawOrderNo);
                    const checked = selectedIds.has(id) && reservedIds.has(id);

                    return (
                      <tr key={id} className="hover:bg-gray-50/70">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOne(id)}
                            disabled={!isReserved || loading || actionLoading}
                            className="h-4 w-4 accent-black disabled:opacity-50"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={[
                              "inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold",
                              status === "reserved"
                                ? "bg-yellow-50 text-yellow-700"
                                : status === "consumed"
                                  ? "bg-green-50 text-green-700"
                                  : status === "released"
                                    ? "bg-gray-100 text-gray-700"
                                    : status === "expired"
                                      ? "bg-red-50 text-red-700"
                                      : "bg-gray-100 text-gray-700",
                            ].join(" ")}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold">{orderNo}</div>
                          <div className="text-xs text-gray-500">Raw: {rawOrderNo}</div>
                          <div className="text-xs text-gray-500 break-all">
                            {safe(r?.refType)} • {safe(r?.refId)}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3 min-w-[260px]">
                            <div className="h-12 w-12 rounded-xl bg-gray-100 ring-1 ring-black/5 overflow-hidden shrink-0">
                              {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={img}
                                  alt={title}
                                  className="h-full w-full object-contain"
                                  loading="lazy"
                                />
                              ) : null}
                            </div>

                            <div className="min-w-0">
                              <div className="font-semibold truncate">{title}</div>
                              <div className="text-xs text-gray-500">
                                Code: <span className="font-semibold">{code}</span>
                              </div>
                              {rawCode !== code ? (
                                <div className="text-[11px] text-gray-400">
                                  Raw Code: {rawCode}
                                </div>
                              ) : null}
                              <div className="text-xs text-gray-500 break-all">
                                {safe(r?.productId) || "-"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-700 break-all">
                            {safe(r?.variantId) || "-"}
                          </div>

                          <div className="text-[11px] text-gray-500">
                            {safe(r?.variantSku)
                              ? `SKU: ${safe(r?.variantSku)}`
                              : ""}
                          </div>

                          <div className="text-[11px] text-gray-500">
                            {(safe(r?.selectedSize) || safe(r?.selectedColor)) &&
                              `${safe(r?.selectedSize) || "-"} • ${
                                safe(r?.selectedColor) || "-"
                              }`}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right font-semibold">
                          {money(r?.qty)}
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-xs">
                            <span className="font-semibold">
                              {safe(r?.refType) || "-"}
                            </span>
                          </div>

                          <div className="text-xs text-gray-500 break-all">
                            {safe(r?.refId) || "-"}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-xs">
                          {r?.expiresAt ? fmtDateTime(r.expiresAt) : "-"}
                        </td>

                        <td className="px-4 py-3 text-xs">
                          {r?.createdAt ? fmtDateTime(r.createdAt) : "-"}
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[320px]">
                          <div className="line-clamp-3 break-words">
                            {safe(r?.notes) || "-"}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2 min-w-[220px]">
                            <input
                              value={safe(reasonById[id])}
                              onChange={(e) =>
                                setReasonById((m) => ({
                                  ...m,
                                  [id]: e.target.value,
                                }))
                              }
                              placeholder="reason optional"
                              className="h-9 px-3 rounded-xl bg-gray-100/70 ring-1 ring-black/10 outline-none text-xs"
                              disabled={!isReserved || actionLoading}
                            />

                            <div className="flex gap-2">
                              <button
                                onClick={() => doAction("release", id)}
                                disabled={!isReserved || actionLoading}
                                className="h-9 px-3 rounded-xl bg-white ring-1 ring-black/10 hover:ring-black/20 text-xs disabled:opacity-50"
                              >
                                Release
                              </button>

                              <button
                                onClick={() => doAction("consume", id)}
                                disabled={!isReserved || actionLoading}
                                className="h-9 px-3 rounded-xl bg-black text-white hover:bg-black/90 text-xs disabled:opacity-50"
                              >
                                Consume
                              </button>

                              <button
                                onClick={() => doAction("expire", id)}
                                disabled={!isReserved || actionLoading}
                                className="h-9 px-3 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs disabled:opacity-50"
                              >
                                Expire
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            Product codes display as{" "}
            <span className="font-semibold">00000</span> format and Shopify
            orders display as <span className="font-semibold">SHOP-0000</span>.
          </div>
        </div>
      </div>
    </div>
  );
}
