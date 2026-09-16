"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";

import { useInventoryReservationStore } from "@/store/inventoryReservationStore";

export default function BrokenOrdersPage() {
  const {
    reservationAudit,
    actionLoading,
    error,
    detectBrokenOrderReservations,
    fixBrokenOrderReservations,
  } = useInventoryReservationStore();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [fixResult, setFixResult] = useState(null);
  const [fixingOrder, setFixingOrder] = useState("");

  useEffect(() => {
    detectBrokenOrderReservations().catch(() => {});
  }, [detectBrokenOrderReservations]);

  const summary = reservationAudit?.summary || {};

  const rows = Array.isArray(reservationAudit?.data)
    ? reservationAudit.data
    : [];

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return rows;

    return rows.filter((order) => {
      const values = [
        order?.orderNumber,
        order?.fulfillmentStatus,
        ...(order?.issues || []).flatMap((issue) => [
          issue?.productCode,
          issue?.selectedSize,
          issue?.issue,
        ]),
      ];

      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [rows, search]);

  const visibleOrderNumbers = filteredRows
    .map((x) => String(x.orderNumber || ""))
    .filter(Boolean);

  const allSelected =
    visibleOrderNumbers.length > 0 &&
    visibleOrderNumbers.every((x) =>
      selected.includes(x)
    );

  const issueCount = rows.reduce(
    (total, row) =>
      total + Number(row?.issueCount || 0),
    0
  );

  const toggleOrder = (orderNumber) => {
    setSelected((current) =>
      current.includes(orderNumber)
        ? current.filter((x) => x !== orderNumber)
        : [...current, orderNumber]
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected((current) =>
        current.filter(
          (x) => !visibleOrderNumbers.includes(x)
        )
      );
      return;
    }

    setSelected((current) =>
      Array.from(
        new Set([
          ...current,
          ...visibleOrderNumbers,
        ])
      )
    );
  };

  const handleDetect = async () => {
    setFixResult(null);
    setSelected([]);

    try {
      await detectBrokenOrderReservations();
    } catch {}
  };

  const runFix = async (orderNumbers = []) => {
    try {
      const result =
        await fixBrokenOrderReservations({
          limit: orderNumbers.length
            ? orderNumbers.length
            : 500,
          orderNumbers,
        });

      setFixResult(result);
      setSelected([]);

      return result;
    } catch {
      return null;
    }
  };

  const handleFixSelected = async () => {
    if (!selected.length) return;

    if (
      !window.confirm(
        `Fix ${selected.length} selected order${
          selected.length > 1 ? "s" : ""
        }?`
      )
    ) {
      return;
    }

    await runFix(selected);
  };

  const handleFixOne = async (orderNumber) => {
    if (!orderNumber) return;

    setFixingOrder(orderNumber);

    try {
      await runFix([orderNumber]);
    } finally {
      setFixingOrder("");
    }
  };

  const handleFixAll = async () => {
    if (!rows.length) return;

    if (
      !window.confirm(
        `Fix all ${rows.length} broken orders?`
      )
    ) {
      return;
    }

    // Explicit list = only currently detected
    // broken orders get repaired.
    await runFix(
      rows
        .map((x) => x.orderNumber)
        .filter(Boolean)
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-neutral-900" />

              <h1 className="text-xl font-semibold tracking-tight text-neutral-950">
                Inventory Health
              </h1>
            </div>

            <p className="text-sm text-neutral-500">
              Detect and repair missing inventory
              reservations for confirmed processing
              orders.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDetect}
              disabled={actionLoading}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  actionLoading
                    ? "animate-spin"
                    : ""
                }`}
              />

              Scan Again
            </button>

            <button
              onClick={handleFixAll}
              disabled={
                actionLoading || !rows.length
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Wrench className="h-4 w-4" />
              Fix All
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            label="Scanned"
            value={summary?.scannedOrders}
          />

          <Stat
            label="Healthy"
            value={summary?.healthyOrders}
            type="success"
          />

          <Stat
            label="Broken"
            value={summary?.brokenOrders}
            type="danger"
          />

          <Stat
            label="Issues"
            value={issueCount}
            type="warning"
          />
        </div>

        {/* FIX RESULT */}
        {fixResult?.summary && (
          <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-white px-4 py-3 ring-1 ring-neutral-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />

              <span className="text-sm font-medium text-neutral-900">
                Repair completed
              </span>
            </div>

            <Result
              label="Scanned"
              value={fixResult.summary.scanned}
            />

            <Result
              label="Fixed"
              value={fixResult.summary.fixed}
            />

            <Result
              label="No change"
              value={fixResult.summary.noChange}
            />

            <Result
              label="Failed"
              value={fixResult.summary.failed}
              danger
            />

            <button
              onClick={() => setFixResult(null)}
              className="ml-auto text-neutral-400 hover:text-neutral-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* TOOLBAR */}
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-10 flex-1 items-center gap-2 rounded-lg bg-white px-3 ring-1 ring-neutral-200">
            <Search className="h-4 w-4 text-neutral-400" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search order, product code, size..."
              className="h-full w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {selected.length > 0 && (
            <button
              onClick={handleFixSelected}
              disabled={actionLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              <Wrench className="h-4 w-4" />
              Fix Selected ({selected.length})
            </button>
          )}
        </div>

        {/* TABLE */}
        {actionLoading && !reservationAudit ? (
          <Loading />
        ) : filteredRows.length === 0 ? (
          <Empty />
        ) : (
          <div className="overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-neutral-50/80 text-xs text-neutral-500">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="h-4 w-4 rounded border-neutral-300"
                      />
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Order
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Product
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Size
                    </th>

                    <th className="px-3 py-3 text-center font-medium">
                      Required
                    </th>

                    <th className="px-3 py-3 text-center font-medium">
                      Reserved
                    </th>

                    <th className="px-3 py-3 text-center font-medium">
                      Pending
                    </th>

                    <th className="px-3 py-3 text-center font-medium">
                      Missing
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Issue
                    </th>

                    <th className="px-4 py-3 text-right font-medium">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100">
                  {filteredRows.map((order) => (
                    <OrderRows
                      key={order.orderId}
                      order={order}
                      checked={selected.includes(
                        order.orderNumber
                      )}
                      onToggle={() =>
                        toggleOrder(
                          order.orderNumber
                        )
                      }
                      onFix={() =>
                        handleFixOne(
                          order.orderNumber
                        )
                      }
                      fixing={
                        fixingOrder ===
                        order.orderNumber
                      }
                      disabled={actionLoading}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 text-xs text-neutral-500">
              <span>
                {filteredRows.length} broken order
                {filteredRows.length !== 1
                  ? "s"
                  : ""}
              </span>

              {selected.length > 0 && (
                <span className="font-medium text-neutral-800">
                  {selected.length} selected
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderRows({
  order,
  checked,
  onToggle,
  onFix,
  fixing,
  disabled,
}) {
  const issues = order?.issues || [];

  return issues.map((issue, index) => (
    <tr
      key={`${order.orderId}-${issue.productId}-${issue.variantId || "root"}-${index}`}
      className={`hover:bg-neutral-50/70 ${
        checked ? "bg-neutral-50" : ""
      }`}
    >
      {index === 0 && (
        <td
          rowSpan={issues.length}
          className="px-4 py-4 align-top"
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="h-4 w-4 rounded border-neutral-300"
          />
        </td>
      )}

      {index === 0 && (
        <td
          rowSpan={issues.length}
          className="px-3 py-4 align-top"
        >
          <div className="font-semibold text-neutral-950">
            {order.orderNumber}
          </div>

          <div className="mt-1 text-xs capitalize text-neutral-400">
            {order.fulfillmentStatus}
          </div>
        </td>
      )}

      <td className="px-3 py-4">
        <span className="font-medium text-neutral-800">
          {issue.productCode || "—"}
        </span>
      </td>

      <td className="px-3 py-4 text-neutral-600">
        {issue.selectedSize || "—"}
      </td>

      <Qty value={issue.requiredQty} />
      <Qty value={issue.reservedQty} />
      <Qty value={issue.pendingQty} />

      <td className="px-3 py-4 text-center">
        <span className="font-semibold text-red-600">
          {Number(issue.missingQty || 0)}
        </span>
      </td>

      <td className="px-3 py-4">
        <span className="inline-flex rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
          {formatIssue(issue.issue)}
        </span>
      </td>

      {index === 0 && (
        <td
          rowSpan={issues.length}
          className="px-4 py-4 text-right align-top"
        >
          <button
            onClick={onFix}
            disabled={disabled}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-40"
          >
            <Wrench className="h-3.5 w-3.5" />

            {fixing ? "Fixing..." : "Fix"}
          </button>
        </td>
      )}
    </tr>
  ));
}

function Stat({ label, value, type }) {
  const valueClass =
    type === "danger"
      ? "text-red-600"
      : type === "success"
        ? "text-emerald-600"
        : type === "warning"
          ? "text-amber-600"
          : "text-neutral-950";

  return (
    <div className="rounded-xl bg-white px-4 py-4 ring-1 ring-neutral-200">
      <p className="text-xs font-medium text-neutral-500">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-semibold tracking-tight ${valueClass}`}
      >
        {Number(value || 0).toLocaleString()}
      </p>
    </div>
  );
}

function Result({ label, value, danger }) {
  return (
    <span className="text-sm text-neutral-500">
      {label}{" "}
      <strong
        className={
          danger
            ? "text-red-600"
            : "text-neutral-900"
        }
      >
        {Number(value || 0)}
      </strong>
    </span>
  );
}

function Qty({ value }) {
  return (
    <td className="px-3 py-4 text-center tabular-nums text-neutral-700">
      {Number(value || 0)}
    </td>
  );
}

function Loading() {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-xl bg-white ring-1 ring-neutral-200">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Checking inventory health...
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl bg-white px-6 text-center ring-1 ring-neutral-200">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      </div>

      <p className="font-medium text-neutral-900">
        Inventory reservations are healthy
      </p>

      <p className="mt-1 max-w-sm text-sm text-neutral-500">
        No missing reservations were detected in
        confirmed processing orders.
      </p>
    </div>
  );
}

function formatIssue(value) {
  return String(value || "Issue")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (x) =>
      x.toUpperCase()
    );
}