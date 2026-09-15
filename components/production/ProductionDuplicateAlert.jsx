"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  PackageCheck,
} from "lucide-react";

const safe = (value) => String(value ?? "").trim();

const buildCaseKey = (group) => {
  const phone = safe(group?.phone)
    .replace(/\D/g, "")
    .slice(-10);

  const codes = [...(group?.productCodes || [])]
    .map((code) => safe(code).toUpperCase())
    .filter(Boolean)
    .sort();

  if (!phone || !codes.length) return "";

  return `${phone}::${codes.join("|")}`;
};

/* =========================================================
   STATUS COLORS

   YELLOW = PROCESSING
   RED    = PACKED / SHIPPED / CANCELLED
========================================================= */

const statusClass = (status) => {
  const value = safe(status).toLowerCase();

  if (value === "processing") {
    return "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200";
  }

  if (
    ["packed", "shipped", "cancelled"].includes(value)
  ) {
    return "bg-red-100 text-red-700 ring-1 ring-inset ring-red-200";
  }

  return "bg-neutral-100 text-neutral-600 ring-1 ring-inset ring-neutral-200";
};

export default function ProductionDuplicateAlert({
  duplicates = [],
}) {
  const [expanded, setExpanded] = useState(false);

  /* =========================================================
     CASES
  ========================================================= */

  const cases = useMemo(() => {
  return (duplicates || [])
    .filter((group) => {
      // CASE tabhi show hoga jab at least
      // ek duplicate order PROCESSING mein ho
      return (group?.orders || []).some(
        (order) =>
          safe(
            order?.fulfillmentStatus
          ).toLowerCase() === "processing"
      );
    })
    .map((group) => ({
      ...group,

      // Case ke saare relevant orders rakho
      // comparison/reference ke liye
      orders: (group?.orders || []).filter(
        (order) =>
          [
            "processing",
            "packed",
            "shipped",
            "cancelled",
          ].includes(
            safe(
              order?.fulfillmentStatus
            ).toLowerCase()
          )
      ),

      caseKey: buildCaseKey(group),
    }))
    .filter(
      (group) =>
        group.caseKey &&
        group.orders.length
    );
}, [duplicates]);

  /* =========================================================
     UNIQUE ORDERS
  ========================================================= */

  const allOrders = useMemo(() => {
    const map = new Map();

    cases.forEach((group) => {
      (group?.orders || []).forEach((order) => {
        const key = String(
          order?._id ||
            order?.orderNumber ||
            ""
        );

        if (!key || map.has(key)) return;

        map.set(key, order);
      });
    });

    return [...map.values()];
  }, [cases]);

  const processingCount = useMemo(
    () =>
      allOrders.filter(
        (order) =>
          safe(
            order?.fulfillmentStatus
          ).toLowerCase() === "processing"
      ).length,
    [allOrders]
  );

  const redCount = useMemo(
    () =>
      allOrders.filter((order) =>
        [
          "packed",
          "shipped",
          "cancelled",
        ].includes(
          safe(
            order?.fulfillmentStatus
          ).toLowerCase()
        )
      ).length,
    [allOrders]
  );

  /* =========================================================
     OPEN CASE
  ========================================================= */

  const openCase = (group) => {
    if (!group?.caseKey) return;

    const url =
      `/orders/duplicate-orders/${encodeURIComponent(
        group.caseKey
      )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (!cases.length) return null;

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-neutral-200">
      {/* =====================================================
          COMPACT HEADER
      ===================================================== */}

      <button
        type="button"
        onClick={() =>
          setExpanded((prev) => !prev)
        }
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-neutral-50"
      >
        {/* ICON */}

        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600">
          <AlertTriangle className="h-4 w-4" />
        </div>

        {/* TITLE */}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-neutral-900">
              Duplicate Orders
            </span>

            <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-[9px] font-bold text-white">
              {cases.length} CASE
              {cases.length !== 1 ? "S" : ""}
            </span>
          </div>

          <div className="mt-0.5 text-[10px] text-neutral-500">
            Review duplicate cases before dispatch
          </div>
        </div>

        {/* STATUS COUNTS */}

        <div className="ml-auto hidden items-center gap-1.5 sm:flex">
          {processingCount > 0 && (
            <span className="rounded bg-amber-100 px-2 py-1 text-[9px] font-bold text-amber-800 ring-1 ring-inset ring-amber-200">
              {processingCount} PROCESSING
            </span>
          )}

          {redCount > 0 && (
            <span className="rounded bg-red-100 px-2 py-1 text-[9px] font-bold text-red-700 ring-1 ring-inset ring-red-200">
              {redCount} PACKED / SHIPPED / CANCELLED
            </span>
          )}
        </div>

        {/* ARROW */}

        <div className="shrink-0">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-neutral-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          )}
        </div>
      </button>

      {/* =====================================================
          EXPANDED
      ===================================================== */}

      {expanded && (
        <div className="border-t border-neutral-100 bg-neutral-50/70 p-2">
          {/* =================================================
              COLOR LEGEND
          ================================================= */}

          <div className="mb-2 flex flex-col gap-2 rounded-md bg-white px-2.5 py-2 ring-1 ring-neutral-200 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
              <PackageCheck className="h-3.5 w-3.5" />

              <span>
                {allOrders.length} orders across{" "}
                <b className="text-neutral-700">
                  {cases.length}
                </b>{" "}
                duplicate cases
              </span>
            </div>

            {/* LEGEND */}

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-semibold uppercase text-neutral-400">
                Colors:
              </span>

              <div className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />

                <span className="text-[9px] font-semibold text-amber-700">
                  Processing
                </span>
              </div>

              <div className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />

                <span className="text-[9px] font-semibold text-red-700">
                  Packed / Shipped / Cancelled
                </span>
              </div>
            </div>
          </div>

          {/* =================================================
              CASE GRID
          ================================================= */}

          <div className="grid gap-1.5 lg:grid-cols-2 xl:grid-cols-3">
            {cases.map(
              (group, groupIndex) => {
                const hasRedStatus = (
                  group?.orders || []
                ).some((order) =>
                  [
                    "packed",
                    "shipped",
                    "cancelled",
                  ].includes(
                    safe(
                      order?.fulfillmentStatus
                    ).toLowerCase()
                  )
                );

                return (
                  <button
                    key={
                      group?.caseKey ||
                      `${group?.phone}-${groupIndex}`
                    }
                    type="button"
                    onClick={() =>
                      openCase(group)
                    }
                    className={`group flex min-w-0 items-center gap-2 rounded-md bg-white p-2 text-left transition hover:bg-neutral-100 ${
                      hasRedStatus
                        ? "ring-1 ring-red-200"
                        : "ring-1 ring-amber-200"
                    }`}
                  >
                    {/* CASE NUMBER */}

                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
                        hasRedStatus
                          ? "bg-red-50 text-red-600"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {groupIndex + 1}
                    </div>

                    {/* DETAILS */}

                    <div className="min-w-0 flex-1">
                      {/* ORDER NUMBERS */}

                      <div className="flex flex-wrap items-center gap-1">
                        {(group?.orders || []).map(
                          (order) => (
                            <span
                              key={
                                order?._id ||
                                order?.orderNumber
                              }
                              title={safe(
                                order?.fulfillmentStatus
                              )}
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${statusClass(
                                order?.fulfillmentStatus
                              )}`}
                            >
                              #
                              {order?.orderNumber ||
                                "-"}
                            </span>
                          )
                        )}
                      </div>

                      {/* PHONE + PRODUCTS */}

                      <div className="mt-1 flex items-center gap-1.5 truncate text-[9px] text-neutral-400">
                        <span>
                          {group?.phone || "-"}
                        </span>

                        <span>•</span>

                        <span className="truncate font-mono">
                          {(
                            group?.productCodes ||
                            []
                          ).join(", ")}
                        </span>
                      </div>
                    </div>

                    {/* OPEN */}

                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-neutral-300 transition group-hover:text-black" />
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}