"use client";

import { useEffect, useMemo, useState } from "react";
import { useInventoryReservationStore } from "@/store/inventoryReservationStore";

const EMPTY_FILTERS = {
  orderNumber: "",
  productCode: "",
  productTitle: "",
  status: "",
  refType: "",
  refId: "",
  productId: "",
  variantId: "",
  orderState: "",
  orderFulfillmentStatus: "",
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "reserved", label: "Reserved" },
  { value: "released", label: "Released" },
  { value: "consumed", label: "Consumed" },
  { value: "expired", label: "Expired" },
];

const ORDER_STATE_OPTIONS = [
  { value: "", label: "All order states" },
  { value: "stale", label: "Needs cleanup" },
  { value: "cancelled", label: "Cancelled orders" },
  { value: "shipped", label: "Shipped / completed orders" },
  { value: "active", label: "Active orders" },
  { value: "missing", label: "Order missing" },
];

const REF_TYPE_OPTIONS = [
  { value: "", label: "All reference types" },
  { value: "order", label: "Order" },
  { value: "production", label: "Production" },
  { value: "manual", label: "Manual" },
];

const safeString = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const safeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const normalizeCode = (value) =>
  safeString(value)
    .trim()
    .toUpperCase();

const normalizeText = (value) =>
  safeString(value)
    .trim()
    .replace(/\s+/g, " ");

const formatLabel = (value) => {
  const text = safeString(value).trim();

  if (!text) return "Not available";

  return text
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatDateTime = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const isOverdue = (value, status) => {
  if (!value || status !== "reserved") return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return false;

  return date.getTime() <= Date.now();
};

const fieldClassName =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/5 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-60";

const secondaryButtonClassName =
  "inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

const primaryButtonClassName =
  "inline-flex h-10 items-center justify-center rounded-xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50";

function StatusBadge({ status }) {
  const styles = {
    reserved: "border-amber-200 bg-amber-50 text-amber-700",
    consumed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    released: "border-gray-200 bg-gray-100 text-gray-700",
    expired: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status] || "border-gray-200 bg-gray-100 text-gray-700"
        }`}
    >
      {formatLabel(status)}
    </span>
  );
}

function SummaryCard({ label, value, description }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>

      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
  );
}

function LoadingRows() {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr key={index} className="border-b border-gray-100">
      {Array.from({ length: 11 }).map((__, columnIndex) => (
        <td key={columnIndex} className="px-4 py-4">
          <div className="h-4 animate-pulse rounded bg-gray-200" />
        </td>
      ))}
    </tr>
  ));
}

export default function ReservedInventoryPage() {
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
    fetchReservations,
    releaseReservation,
    consumeReservation,
    expireReservation,
    expireDueReservations,
    expireStaleOrderReservations,
    deleteStalePendingOrderReservations,
  } = useInventoryReservationStore();

  const [form, setForm] = useState({
    ...EMPTY_FILTERS,
    ...(filters || {}),
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [reasonById, setReasonById] = useState({});
  const [bulkReason, setBulkReason] = useState("");

  useEffect(() => {
    fetchReservations().catch(() => { });
  }, [fetchReservations]);

  const list = useMemo(() => {
    const records = Array.isArray(reservations) ? reservations : [];

    return [...records].sort((first, second) => {
      const firstStatus = safeString(first?.status);
      const secondStatus = safeString(second?.status);

      if (firstStatus === "reserved" && secondStatus !== "reserved") {
        return -1;
      }

      if (secondStatus === "reserved" && firstStatus !== "reserved") {
        return 1;
      }

      const firstDate = new Date(first?.createdAt || 0).getTime();
      const secondDate = new Date(second?.createdAt || 0).getTime();

      return secondDate - firstDate;
    });
  }, [reservations]);

  const summary = useMemo(() => {
    return list.reduce(
      (result, reservation) => {
        const status = safeString(reservation?.status)
          .trim()
          .toLowerCase();

        if (status === "pending") {
          result.pending += 1;
        }

        if (status === "reserved") {
          result.reserved += 1;
        }

        if (status === "expired") {
          result.expired += 1;
        }

        if (status === "consumed") {
          result.consumed += 1;
        }

        return result;
      },
      {
        pending: 0,
        reserved: 0,
        expired: 0,
        consumed: 0,
      },
    );
  }, [list]);

  const selectableIds = useMemo(() => {
    const ids = new Set();

    list.forEach((reservation) => {
      const id = safeString(reservation?._id).trim();

      const status = safeString(reservation?.status)
        .trim()
        .toLowerCase();

      if (
        id &&
        ["pending", "reserved"].includes(status)
      ) {
        ids.add(id);
      }
    });

    return ids;
  }, [list]);

  const selectedPendingIds = useMemo(() => {
    return Array.from(selectedIds).filter((id) => {
      const reservation = list.find(
        (row) => safeString(row?._id) === id
      );

      return (
        safeString(reservation?.status)
          .trim()
          .toLowerCase() === "pending"
      );
    });
  }, [selectedIds, list]);

  const selectedReservedIds = useMemo(() => {
    return Array.from(selectedIds).filter((id) => {
      const reservation = list.find(
        (row) => safeString(row?._id) === id
      );

      return (
        safeString(reservation?.status)
          .trim()
          .toLowerCase() === "reserved"
      );
    });
  }, [selectedIds, list]);

  const selectedCount = useMemo(() => {
    return Array.from(selectedIds).filter((id) =>
      selectableIds.has(id)
    ).length;
  }, [selectedIds, selectableIds]);

  const allSelectableSelected =
    selectableIds.size > 0 &&
    selectedCount === selectableIds.size;

  useEffect(() => {
    setSelectedIds((previous) => {
      const next = new Set();

      previous.forEach((id) => {
        if (selectableIds.has(id)) {
          next.add(id);
        }
      });

      return next;
    });
  }, [selectableIds]);



  const updateForm = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const applyFilters = async () => {
    clearError?.();

    const normalizedFilters = {
      orderNumber: normalizeCode(form.orderNumber),
      productCode: normalizeCode(form.productCode),
      productTitle: normalizeText(form.productTitle),
      status: normalizeText(form.status).toLowerCase(),
      refType: normalizeText(form.refType).toLowerCase(),
      refId: normalizeText(form.refId),
      productId: normalizeText(form.productId),
      variantId: normalizeText(form.variantId),
      orderState: normalizeText(form.orderState).toLowerCase(),
      orderFulfillmentStatus: normalizeText(
        form.orderFulfillmentStatus,
      ).toLowerCase(),
    };

    setForm(normalizedFilters);
    setFilters(normalizedFilters);

    await fetchReservations(normalizedFilters);
  };

  const clearFilters = async () => {
    clearError?.();
    resetFilters();
    setForm(EMPTY_FILTERS);
    setShowAdvancedFilters(false);

    await fetchReservations(EMPTY_FILTERS);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    await applyFilters();
  };

  const toggleOne = (id) => {
    if (!id || !selectableIds.has(id)) {
      return;
    }

    setSelectedIds((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const toggleAllReserved = () => {
    setSelectedIds(() => {
      if (allSelectableSelected) {
        return new Set();
      }

      return new Set(selectableIds);
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const performAction = async (type, id) => {
    if (!id) return;

    clearError?.();

    const reason = normalizeText(reasonById[id]);

    try {
      if (type === "release") {
        await releaseReservation(id, reason);
      }

      if (type === "consume") {
        await consumeReservation(id, reason);
      }

      if (type === "expire") {
        await expireReservation(id);
      }

      setReasonById((previous) => ({
        ...previous,
        [id]: "",
      }));

      await fetchReservations();
    } catch {
      // Error is handled by Zustand store.
    }
  };

  const performBulkAction = async (type) => {
    clearError?.();

    const validIds = selectedReservedIds;

    if (!validIds.length) return;

    const reason = normalizeText(bulkReason);

    try {
      for (const id of validIds) {
        if (type === "release") {
          await releaseReservation(id, reason);
        }

        if (type === "consume") {
          await consumeReservation(id, reason);
        }

        if (type === "expire") {
          await expireReservation(id);
        }
      }

      clearSelection();
      setBulkReason("");

      await fetchReservations();
    } catch {
      // Error is handled by Zustand store.
    }
  };

  const handleExpireDue = async () => {
    clearError?.();

    try {
      await expireDueReservations();
      clearSelection();
      await fetchReservations();
    } catch {
      // Error is handled by Zustand store.
    }
  };

  const handleExpireStaleOrders = async () => {
    clearError?.();

    try {
      const result = await expireStaleOrderReservations({
        orderPrefix: "MIRAY",
        includeMissingOrders: true,
        limit: 500,
      });

      clearSelection();

      setForm((previous) => ({
        ...previous,
        status: "",
        refType: "order",
        orderState: "stale",
      }));

      setFilters({
        status: "",
        refType: "order",
        orderState: "stale",
      });

      await fetchReservations({
        ...filters,
        status: "",
        refType: "order",
        orderState: "stale",
      });

      window.alert(
        `${Number(result?.expiredCount || 0)} stale MIRAY reservation(s) expired.`,
      );
    } catch {
      // Error is handled by Zustand store.
    }
  };

  const handleDeleteStalePending = async () => {
    clearError?.();

    const confirmed = window.confirm(
      "Delete all pending MIRAY reservations whose orders are no longer processing or packed?"
    );

    if (!confirmed) return;

    try {
      const result =
        await deleteStalePendingOrderReservations({
          orderPrefix: "MIRAY",
          includeMissingOrders: true,
          limit: 1000,
        });

      clearSelection();

      await fetchReservations();

      window.alert(
        `${Number(
          result?.deletedCount || 0
        )} stale pending reservations deleted.`
      );
    } catch {
      // Store handles error.
    }
  };

  const disabled = loading || actionLoading;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-950">
      <div className="mx-auto max-w-[1800px] space-y-5 p-4 md:p-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              Inventory Management
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
              Reserved Inventory
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Review stock reservations, consume allocated stock or release
              unused quantities.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fetchReservations().catch(() => { })}
              disabled={disabled}
              className={secondaryButtonClassName}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={handleExpireStaleOrders}
              disabled={disabled}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading ? "Processing..." : "Expire stale MIRAY"}
            </button>

            <button
              type="button"
              onClick={handleExpireDue}
              disabled={disabled}
              className={primaryButtonClassName}
            >
              {actionLoading ? "Processing..." : "Expire Due"}
            </button>

            <button
              type="button"
              onClick={handleDeleteStalePending}
              disabled={disabled}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading
                ? "Cleaning..."
                : "Delete stale pending"}
            </button>

          </div>
        </header>

        {error ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-red-700">
                  Unable to complete request
                </p>

                <p className="mt-1 text-sm text-red-600">{error}</p>
              </div>

              <button
                type="button"
                onClick={() => clearError?.()}
                className="text-sm font-semibold text-red-700 underline"
              >
                Dismiss
              </button>
            </div>
          </section>
        ) : null}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryCard
            label="Pending"
            value={summary.pending}
            description="Waiting for reservation"
          />

          <SummaryCard
            label="Reserved"
            value={summary.reserved}
            description="Inventory currently locked"
          />

          <SummaryCard
            label="Expired"
            value={summary.expired}
            description="Reservation validity ended"
          />

          <SummaryCard
            label="Consumed"
            value={summary.consumed}
            description="Inventory successfully used"
          />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">Search and filters</h2>

              <p className="mt-1 text-xs text-gray-500">
                Search by order number, product code, title or reservation
                status.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters((previous) => !previous)}
              className="text-sm font-semibold text-gray-700 underline"
            >
              {showAdvancedFilters
                ? "Hide advanced filters"
                : "Show advanced filters"}
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-gray-600">
                  Order number
                </span>

                <input
                  value={form.orderNumber || ""}
                  onChange={(event) =>
                    updateForm("orderNumber", event.target.value)
                  }
                  placeholder="Example: MIRAY-000187"
                  className={fieldClassName}
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-gray-600">
                  Product code
                </span>

                <input
                  value={form.productCode || ""}
                  onChange={(event) =>
                    updateForm("productCode", event.target.value)
                  }
                  placeholder="Example: 00197"
                  className={fieldClassName}
                />
              </label>

              <label className="space-y-1.5 md:col-span-2 xl:col-span-1">
                <span className="text-xs font-semibold text-gray-600">
                  Product title
                </span>

                <input
                  value={form.productTitle || ""}
                  onChange={(event) =>
                    updateForm("productTitle", event.target.value)
                  }
                  placeholder="Search product title"
                  className={fieldClassName}
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-gray-600">
                  Reservation status
                </span>

                <select
                  value={form.status || ""}
                  onChange={(event) =>
                    updateForm("status", event.target.value)
                  }
                  className={fieldClassName}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-gray-600">
                  Reference type
                </span>

                <select
                  value={form.refType || ""}
                  onChange={(event) =>
                    updateForm("refType", event.target.value)
                  }
                  className={fieldClassName}
                >
                  {REF_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-gray-600">
                  Order lifecycle
                </span>

                <select
                  value={form.orderState || ""}
                  onChange={(event) =>
                    updateForm("orderState", event.target.value)
                  }
                  className={fieldClassName}
                >
                  {ORDER_STATE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {showAdvancedFilters ? (
              <div className="grid gap-3 border-t border-gray-100 pt-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-gray-600">
                    Reference ID
                  </span>

                  <input
                    value={form.refId || ""}
                    onChange={(event) =>
                      updateForm("refId", event.target.value)
                    }
                    placeholder="Order ID, production ID or manual reference"
                    className={fieldClassName}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-gray-600">
                    Product ID
                  </span>

                  <input
                    value={form.productId || ""}
                    onChange={(event) =>
                      updateForm("productId", event.target.value)
                    }
                    placeholder="MongoDB product ID"
                    className={fieldClassName}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-gray-600">
                    Variant ID
                  </span>

                  <input
                    value={form.variantId || ""}
                    onChange={(event) =>
                      updateForm("variantId", event.target.value)
                    }
                    placeholder="MongoDB variant ID"
                    className={fieldClassName}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-gray-600">
                    Exact fulfillment status
                  </span>

                  <input
                    value={form.orderFulfillmentStatus || ""}
                    onChange={(event) =>
                      updateForm(
                        "orderFulfillmentStatus",
                        event.target.value,
                      )
                    }
                    placeholder="Example: cancelled, shipped, delivered"
                    className={fieldClassName}
                  />
                </label>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={disabled}
                className={primaryButtonClassName}
              >
                {loading ? "Applying..." : "Apply filters"}
              </button>

              <button
                type="button"
                onClick={clearFilters}
                disabled={disabled}
                className={secondaryButtonClassName}
              >
                Clear filters
              </button>
            </div>
          </form>
        </section>

        <section className="sticky top-3 z-20 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleAllReserved}
                disabled={disabled || selectableIds.size === 0}
                className={secondaryButtonClassName}
              >
                {allSelectableSelected
                  ? "Unselect all"
                  : `Select Active (${selectableIds.size})`}
              </button>

              <button
                type="button"
                onClick={clearSelection}
                disabled={disabled || selectedCount === 0}
                className={secondaryButtonClassName}
              >
                Clear selection
              </button>

              <span className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
                {selectedCount} selected
              </span>
            </div>

            <div className="flex-1" />

            <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_auto]">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-gray-600">
                  Bulk action reason
                </span>

                <input
                  value={bulkReason}
                  onChange={(event) => setBulkReason(event.target.value)}
                  placeholder="Optional note for selected reservations"
                  disabled={actionLoading}
                  className={fieldClassName}
                />
              </label>

              <div className="flex flex-wrap items-end gap-2">
                <button
                  type="button"
                  onClick={() => performBulkAction("release")}
                  disabled={disabled || selectedCount === 0}
                  className={secondaryButtonClassName}
                >
                  Release
                </button>

                <button
                  type="button"
                  onClick={() => performBulkAction("consume")}
                  disabled={disabled || selectedCount === 0}
                  className={primaryButtonClassName}
                >
                  Consume
                </button>

                <button
                  type="button"
                  onClick={() => performBulkAction("expire")}
                  disabled={disabled || selectedCount === 0}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Expire
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedPendingIds.length) return;

                    const ok = window.confirm(
                      `Delete ${selectedPendingIds.length} selected pending reservation(s)?`
                    );

                    if (!ok) return;

                    try {
                      await deleteStalePendingOrderReservations({
                        ids: selectedPendingIds,
                      });

                      clearSelection();

                      await fetchReservations();
                    } catch { }
                  }}
                  disabled={
                    disabled ||
                    selectedPendingIds.length === 0
                  }
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  Delete Pending ({selectedPendingIds.length})
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-950">
                Reservations
              </h2>

              <p className="mt-0.5 text-[11px] text-gray-500">
                {list.length} record{list.length === 1 ? "" : "s"} •{" "}
                {summary.reserved} reserved • {summary.consumed} consumed
              </p>
            </div>

            {actionLoading ? (
              <span className="text-xs font-semibold text-gray-500">
                Processing action...
              </span>
            ) : null}
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full table-fixed text-left text-[12px]">
              <thead className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="w-[38px] px-2 py-2">
                    <input
                      type="checkbox"
                      checked={allSelectableSelected}
                      onChange={toggleAllReserved}
                      disabled={disabled || selectableIds.size === 0}
                      className="h-3.5 w-3.5 accent-black"
                      aria-label="Select all reserved inventory"
                    />
                  </th>

                  <th className="w-[90px] px-2 py-2">Status</th>
                  <th className="w-[110px] px-2 py-2">Order</th>
                  <th className="w-[230px] px-2 py-2">Product</th>
                  <th className="w-[145px] px-2 py-2">Variant</th>
                  <th className="w-[55px] px-2 py-2 text-center">Qty</th>
                  <th className="w-[135px] px-2 py-2">Reference</th>
                  <th className="w-[110px] px-2 py-2">Expires</th>
                  <th className="w-[110px] px-2 py-2">Created</th>
                  <th className="w-[140px] px-2 py-2">Notes</th>
                  <th className="w-[205px] px-2 py-2">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading && !list.length ? (
                  <LoadingRows />
                ) : !list.length ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center">
                      <div className="mx-auto max-w-sm">
                        <div className="font-bold text-gray-900">
                          No reservations found
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                          Try clearing the filters or use another order number or
                          product code.
                        </p>

                        <button
                          type="button"
                          onClick={clearFilters}
                          className={`${secondaryButtonClassName} mt-4`}
                        >
                          Clear filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  list.map((reservation) => {
                    const id = safeString(reservation?._id);

                    const status = safeString(
                      reservation?.status,
                      "unknown",
                    )
                      .trim()
                      .toLowerCase();

                    const isReserved = status === "reserved";

                    const overdue = isOverdue(
                      reservation?.expiresAt,
                      status,
                    );

                    const isPending = status === "pending";

                    const isSelectable =
                      isPending || isReserved;

                    const checked =
                      selectedIds.has(id) &&
                      selectableIds.has(id);

                    const productTitle =
                      safeString(reservation?.productTitle).trim() ||
                      "Untitled product";

                    const productCode =
                      safeString(reservation?.productCode).trim() ||
                      "No code";

                    const productImage = safeString(
                      reservation?.productImage,
                    ).trim();

                    const selectedSize = safeString(
                      reservation?.selectedSize,
                    ).trim();

                    const selectedColor = safeString(
                      reservation?.selectedColor,
                    ).trim();

                    const variantSku = safeString(
                      reservation?.variantSku,
                    ).trim();

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
                        className={`align-middle transition hover:bg-gray-50 ${reservation?.staleReservation
                          ? "bg-red-50/60"
                          : checked
                            ? "bg-blue-50/50"
                            : ""
                          }`}
                      >
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOne(id)}
                            disabled={!isSelectable || disabled}
                            className="h-3.5 w-3.5 accent-black disabled:opacity-30"
                            aria-label={`Select reservation ${id}`}
                          />
                        </td>

                        <td className="px-2 py-2">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${statusClasses[status] ||
                                "bg-gray-100 text-gray-700"
                                }`}
                            >
                              {formatLabel(status)}
                            </span>

                            {overdue ? (
                              <div className="text-[9px] font-semibold text-red-600">
                                Overdue
                              </div>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-2 py-2">
                          <div
                            className="truncate font-semibold text-gray-950"
                            title={safeString(reservation?.orderNumber)}
                          >
                            {safeString(reservation?.orderNumber).trim() ||
                              "No order"}
                          </div>

                          <div className="truncate text-[10px] text-gray-400">
                            {formatLabel(reservation?.refType)}
                          </div>

                          {reservation?.refType === "order" ? (
                            <div
                              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold ${reservation?.staleReservation
                                ? "bg-red-50 text-red-700"
                                : "bg-gray-100 text-gray-600"
                                }`}
                              title={safeString(
                                reservation?.orderFulfillmentStatus,
                              )}
                            >
                              {reservation?.orderExists === false
                                ? "Order missing"
                                : formatLabel(
                                  reservation?.orderFulfillmentStatus ||
                                  reservation?.orderState,
                                )}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                              {productImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={productImage}
                                  alt={productTitle}
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
                                title={productTitle}
                              >
                                {productTitle}
                              </div>

                              <div
                                className="truncate text-[10px] text-gray-500"
                                title={productCode}
                              >
                                Code: {productCode}
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
                            {safeNumber(reservation?.qty)}
                          </span>
                        </td>

                        <td className="px-2 py-2">
                          <div className="truncate text-[10px] font-semibold uppercase text-gray-700">
                            {formatLabel(reservation?.refType)}
                          </div>

                          <div
                            className="truncate text-[10px] text-gray-500"
                            title={safeString(reservation?.refId)}
                          >
                            {safeString(reservation?.refId).trim() || "-"}
                          </div>
                        </td>

                        <td className="px-2 py-2">
                          <div
                            className={`text-[10px] leading-4 ${overdue
                              ? "font-semibold text-red-600"
                              : "text-gray-600"
                              }`}
                          >
                            {reservation?.expiresAt ? (
                              <>
                                <div>
                                  {new Date(
                                    reservation.expiresAt,
                                  ).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </div>

                                <div>
                                  {new Date(
                                    reservation.expiresAt,
                                  ).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </>
                            ) : (
                              "-"
                            )}
                          </div>
                        </td>

                        <td className="px-2 py-2">
                          <div className="text-[10px] leading-4 text-gray-600">
                            {reservation?.createdAt ? (
                              <>
                                <div>
                                  {new Date(
                                    reservation.createdAt,
                                  ).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </div>

                                <div>
                                  {new Date(
                                    reservation.createdAt,
                                  ).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
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
                            title={safeString(reservation?.notes)}
                          >
                            {safeString(reservation?.notes).trim() ||
                              "No notes"}
                          </div>
                        </td>

                        <td className="px-2 py-2">
                          <div className="space-y-1.5">
                            <input
                              value={reasonById[id] || ""}
                              onChange={(event) =>
                                setReasonById((previous) => ({
                                  ...previous,
                                  [id]: event.target.value,
                                }))
                              }
                              placeholder="Reason"
                              disabled={!isReserved || actionLoading}
                              className="h-7 w-full rounded-lg border border-gray-200 bg-white px-2 text-[10px] outline-none focus:border-black disabled:bg-gray-100 disabled:opacity-50"
                            />

                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  performAction("release", id)
                                }
                                disabled={!isReserved || disabled}
                                className="h-7 rounded-md border border-gray-200 bg-white px-2 text-[10px] font-semibold hover:bg-gray-50 disabled:opacity-40"
                              >
                                Release
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  performAction("consume", id)
                                }
                                disabled={!isReserved || disabled}
                                className="h-7 rounded-md bg-black px-2 text-[10px] font-semibold text-white hover:bg-gray-800 disabled:opacity-40"
                              >
                                Consume
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  performAction("expire", id)
                                }
                                disabled={!isReserved || disabled}
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

          <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-[10px] text-gray-500">
            Expire Due processes reserved entries whose expiry date has already
            passed.
          </div>
        </section>
      </div>
    </main>
  );
}