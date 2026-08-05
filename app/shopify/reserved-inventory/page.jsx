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
    }).catch(() => { });
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

  const summary = useMemo(() => {
    return list.reduce(
      (acc, item) => {
        const status = safe(item?.status).toLowerCase();

        if (status === "pending") acc.pending++;
        if (status === "reserved") acc.reserved++;
        if (status === "expired") acc.expired++;
        if (status === "consumed") acc.consumed++;
        if (status === "released") acc.released++;

        return acc;
      },
      {
        pending: 0,
        reserved: 0,
        expired: 0,
        consumed: 0,
        released: 0,
      }
    );
  }, [list]);

  function SummaryCard({ label, value, color = "gray" }) {
    const colors = {
      yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
      green: "bg-green-50 text-green-700 border-green-200",
      red: "bg-red-50 text-red-700 border-red-200",
      blue: "bg-blue-50 text-blue-700 border-blue-200",
      gray: "bg-gray-50 text-gray-700 border-gray-200",
    };

    return (
      <div className={`rounded-2xl border p-5 ${colors[color]}`}>
        <div className="text-xs font-semibold uppercase tracking-wide">
          {label}
        </div>

        <div className="mt-2 text-3xl font-bold">
          {value}
        </div>
      </div>
    );
  }

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
    }).catch(() => { });
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
    } catch { }
  };

  const onExpireDue = async () => {
    clearError?.();

    try {
      await expireDueReservations();
      await refreshReservations();
    } catch { }
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
    } catch { }
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


        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <SummaryCard
            label="Pending"
            value={summary.pending}
            color="blue"
          />

          <SummaryCard
            label="Reserved"
            value={summary.reserved}
            color="yellow"
          />

          <SummaryCard
            label="Consumed"
            value={summary.consumed}
            color="green"
          />

          <SummaryCard
            label="Expired"
            value={summary.expired}
            color="red"
          />

          <SummaryCard
            label="Released"
            value={summary.released}
            color="gray"
          />
        </section>

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

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
  <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
    <div>
      <div className="text-sm font-bold text-gray-950">
        Shopify Reserved Inventory
      </div>

      <div className="mt-0.5 text-[11px] text-gray-500">
        {list.length} records • {summary.reserved} reserved •{" "}
        {summary.consumed} consumed
      </div>
    </div>

    <div className="flex flex-wrap gap-1.5 text-[11px]">
      <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-700">
        {summary.pending} Pending
      </span>

      <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
        {summary.reserved} Reserved
      </span>

      <span className="rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-700">
        {summary.expired} Expired
      </span>

      <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
        {summary.consumed} Consumed
      </span>
    </div>
  </div>

  <div className="w-full overflow-x-auto">
    <table className="w-full table-fixed text-left text-[12px]">
      <thead className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
        <tr>
          <th className="w-[38px] px-2 py-2">
            <input
              type="checkbox"
              checked={allReservedSelected}
              onChange={toggleAllReserved}
              disabled={
                loading || actionLoading || reservedIds.size === 0
              }
              className="h-3.5 w-3.5 accent-black"
            />
          </th>

          <th className="w-[90px] px-2 py-2">Status</th>
          <th className="w-[110px] px-2 py-2">Order</th>
          <th className="w-[240px] px-2 py-2">Product</th>
          <th className="w-[150px] px-2 py-2">Variant</th>
          <th className="w-[55px] px-2 py-2 text-center">Qty</th>
          <th className="w-[150px] px-2 py-2">Reference</th>
          <th className="w-[120px] px-2 py-2">Expires</th>
          <th className="w-[120px] px-2 py-2">Created</th>
          <th className="w-[160px] px-2 py-2">Notes</th>
          <th className="w-[220px] px-2 py-2">Actions</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">
        {!list.length ? (
          <tr>
            <td colSpan={11} className="px-4 py-12 text-center text-sm text-gray-500">
              {loading
                ? "Loading Shopify reservations..."
                : "No Shopify reservations found"}
            </td>
          </tr>
        ) : (
          list.map((r) => {
            const id = safe(r?._id);

            const status = safe(r?.status, "pending")
              .trim()
              .toLowerCase();

            const isReserved = status === "reserved";

            const title =
              safe(r?.productTitle).trim() || "Untitled product";

            const rawCode = safe(r?.productCode).trim() || "-";
            const code = normalizeProductCode(rawCode);

            const img = safe(r?.productImage).trim();

            const rawOrderNo =
              safe(r?.orderNumber).trim() ||
              safe(r?.shopifyOrderName).trim() ||
              safe(r?.orderName).trim() ||
              "-";

            const orderNo = normalizeShopifyOrderNo(rawOrderNo);

            const selectedSize = safe(r?.selectedSize).trim();
            const selectedColor = safe(r?.selectedColor).trim();
            const variantSku = safe(r?.variantSku).trim();

            const checked =
              selectedIds.has(id) && reservedIds.has(id);

            const statusClasses = {
              pending: "bg-blue-50 text-blue-700",
              reserved: "bg-amber-50 text-amber-700",
              consumed: "bg-emerald-50 text-emerald-700",
              released: "bg-gray-100 text-gray-700",
              expired: "bg-red-50 text-red-700",
            };

            return (
              <tr
                key={id}
                className={`align-middle transition hover:bg-gray-50 ${
                  checked ? "bg-blue-50/50" : ""
                }`}
              >
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOne(id)}
                    disabled={
                      !isReserved || loading || actionLoading
                    }
                    className="h-3.5 w-3.5 accent-black disabled:opacity-30"
                  />
                </td>

                <td className="px-2 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
                      statusClasses[status] ||
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {status
                      .replace(/[_-]+/g, " ")
                      .replace(/\b\w/g, (letter) =>
                        letter.toUpperCase()
                      )}
                  </span>
                </td>

                <td className="px-2 py-2">
                  <div
                    className="truncate font-semibold text-gray-950"
                    title={orderNo}
                  >
                    {orderNo}
                  </div>

                  {rawOrderNo !== orderNo ? (
                    <div
                      className="truncate text-[10px] text-gray-400"
                      title={rawOrderNo}
                    >
                      {rawOrderNo}
                    </div>
                  ) : null}
                </td>

                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt={title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[8px] font-semibold text-gray-400">
                          No Image
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div
                        className="truncate font-semibold text-gray-950"
                        title={title}
                      >
                        {title}
                      </div>

                      <div className="truncate text-[10px] text-gray-500">
                        Code: {code}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-2 py-2">
                  <div className="flex flex-wrap gap-1">
                    {selectedSize ? (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold">
                        {selectedSize.toUpperCase()}
                      </span>
                    ) : null}

                    {selectedColor ? (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold">
                        {selectedColor.toUpperCase()}
                      </span>
                    ) : null}
                  </div>

                  <div
                    className="mt-1 truncate text-[10px] text-gray-500"
                    title={variantSku}
                  >
                    {variantSku || "SKU unavailable"}
                  </div>
                </td>

                <td className="px-2 py-2 text-center">
                  <span className="inline-flex min-w-7 justify-center rounded-md bg-black px-2 py-1 text-[11px] font-bold text-white">
                    {money(r?.qty)}
                  </span>
                </td>

                <td className="px-2 py-2">
                  <div className="truncate text-[10px] font-semibold uppercase text-gray-700">
                    {safe(r?.refType).trim() || "Order"}
                  </div>

                  <div
                    className="truncate text-[10px] text-gray-500"
                    title={safe(r?.refId)}
                  >
                    {safe(r?.refId).trim() || "-"}
                  </div>
                </td>

                <td className="px-2 py-2">
                  <div className="text-[10px] leading-4 text-gray-600">
                    {r?.expiresAt ? (
                      <>
                        <div className="font-semibold text-gray-800">
                          {new Date(r.expiresAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                            }
                          )}
                        </div>

                        <div>
                          {new Date(r.expiresAt).toLocaleTimeString(
                            "en-IN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </>
                    ) : (
                      "-"
                    )}
                  </div>
                </td>

                <td className="px-2 py-2">
                  <div className="text-[10px] leading-4 text-gray-600">
                    {r?.createdAt ? (
                      <>
                        <div className="font-semibold text-gray-800">
                          {new Date(r.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                            }
                          )}
                        </div>

                        <div>
                          {new Date(r.createdAt).toLocaleTimeString(
                            "en-IN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </>
                    ) : (
                      "-"
                    )}
                  </div>
                </td>

                <td className="px-2 py-2">
                  <div
                    className="line-clamp-2 break-words text-[10px] leading-4 text-gray-600"
                    title={safe(r?.notes)}
                  >
                    {safe(r?.notes).trim() || "No notes"}
                  </div>
                </td>

                <td className="px-2 py-2">
                  <div className="space-y-1.5">
                    <input
                      value={safe(reasonById[id])}
                      onChange={(e) =>
                        setReasonById((current) => ({
                          ...current,
                          [id]: e.target.value,
                        }))
                      }
                      placeholder="Reason"
                      disabled={!isReserved || actionLoading}
                      className="h-7 w-full rounded-lg border border-gray-200 bg-white px-2 text-[10px] outline-none focus:border-black disabled:bg-gray-100 disabled:opacity-50"
                    />

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => doAction("release", id)}
                        disabled={
                          !isReserved || actionLoading || loading
                        }
                        className="h-7 rounded-md border border-gray-200 bg-white px-2 text-[10px] font-semibold hover:bg-gray-50 disabled:opacity-40"
                      >
                        Release
                      </button>

                      <button
                        type="button"
                        onClick={() => doAction("consume", id)}
                        disabled={
                          !isReserved || actionLoading || loading
                        }
                        className="h-7 rounded-md bg-black px-2 text-[10px] font-semibold text-white hover:bg-gray-800 disabled:opacity-40"
                      >
                        Consume
                      </button>

                      <button
                        type="button"
                        onClick={() => doAction("expire", id)}
                        disabled={
                          !isReserved || actionLoading || loading
                        }
                        className="h-7 rounded-md bg-red-600 px-2 text-[10px] font-semibold text-white hover:bg-red-700 disabled:opacity-40"
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
