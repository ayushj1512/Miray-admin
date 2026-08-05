"use client";

import {
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Factory,
  Package2,
  Plus,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getProductId,
  normalizeSizes,
} from "@/app/production/all-production-job/utils";

const PAGE_LIMITS = [10, 20, 50, 100];

const toSafeNumber = (value) =>
  Math.max(0, Number(value) || 0);

const getSizeQuantity = (rows = [], size) =>
  toSafeNumber(
    rows.find(
      (item) =>
        String(item?.size || "").toUpperCase() ===
        String(size || "").toUpperCase(),
    )?.quantity,
  );

export default function ProductionDemandTable({
  rows = [],
  loading = false,
  coverageLoading = false,
  onCreateJob,
}) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const totalRows = rows.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalRows / limit),
  );

  useEffect(() => {
    setPage(1);
  }, [rows, limit]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * limit;

    return rows.slice(
      startIndex,
      startIndex + limit,
    );
  }, [rows, page, limit]);

  const startRow =
    totalRows === 0
      ? 0
      : (page - 1) * limit + 1;

  const endRow = Math.min(
    page * limit,
    totalRows,
  );

  const isLoading =
    loading || coverageLoading;

  return (
    <div className="mt-5 overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1380px]">
          <thead className="bg-zinc-50">
            <tr className="border-b border-zinc-200">
              {[
                "",
                "Product",
                "Code",
                "Demand",
                "Assigned",
                "Remaining Demand",
                "Orders",
                "Action",
              ].map((heading, index) => (
                <th
                  key={`${heading}-${index}`}
                  className={[
                    "px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500",
                    index === 0
                      ? "w-14 px-3"
                      : "",
                  ].join(" ")}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({
                length: Math.min(limit, 6),
              }).map((_, index) => (
                <tr
                  key={index}
                  className="border-b border-zinc-100"
                >
                  {Array.from({
                    length: 8,
                  }).map((__, cell) => (
                    <td
                      key={cell}
                      className="px-4 py-4"
                    >
                      <div className="h-10 animate-pulse rounded-xl bg-zinc-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-16 text-center"
                >
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
                      <Package2 className="h-5 w-5 text-zinc-400" />
                    </div>

                    <p className="mt-4 text-sm font-medium text-zinc-900">
                      No production demand found
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Try changing the search or
                      refreshing the production data.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <ProductionDemandRow
                  key={
                    row.productCode ||
                    getProductId(row)
                  }
                  row={row}
                  coverageLoading={
                    coverageLoading
                  }
                  onCreateJob={onCreateJob}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && totalRows > 0 && (
        <div className="flex flex-col gap-4 border-t border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-zinc-500">
              Showing{" "}
              <span className="font-semibold text-zinc-900">
                {startRow}
              </span>
              {" - "}
              <span className="font-semibold text-zinc-900">
                {endRow}
              </span>
              {" of "}
              <span className="font-semibold text-zinc-900">
                {totalRows}
              </span>
            </p>

            <select
              value={limit}
              onChange={(event) => {
                setLimit(
                  Number(event.target.value),
                );

                setPage(1);
              }}
              className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-black"
            >
              {PAGE_LIMITS.map(
                (pageLimit) => (
                  <option
                    key={pageLimit}
                    value={pageLimit}
                  >
                    {pageLimit} rows
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setPage((current) =>
                  Math.max(1, current - 1),
                )
              }
              disabled={page <= 1}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-sm font-medium transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />

              Previous
            </button>

            <div className="rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium">
              Page {page} of {totalPages}
            </div>

            <button
              type="button"
              onClick={() =>
                setPage((current) =>
                  Math.min(
                    totalPages,
                    current + 1,
                  ),
                )
              }
              disabled={page >= totalPages}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-sm font-medium transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next

              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductionDemandRow({
  row,
  coverageLoading,
  onCreateJob,
}) {
  const [expanded, setExpanded] =
    useState(false);

  const productId = getProductId(row);

  /*
   * Production job demand se zyada bhi
   * create kiya ja sakta hai.
   */
  const canCreate =
    Boolean(productId) &&
    !coverageLoading;

  const demandQuantity = toSafeNumber(
    row.totalQty,
  );

  const assignedQuantity = toSafeNumber(
    row.activeProductionQuantity,
  );

  const remainingDemand = Math.max(
    0,
    demandQuantity - assignedQuantity,
  );

  const advanceProduction = Math.max(
    0,
    assignedQuantity - demandQuantity,
  );

  const normalizedDemandSizes =
    normalizeSizes(row.sizes);

  const normalizedAssignedSizes =
    normalizeSizes(
      row.productionCoverage?.sizes,
    );

  const sizeNames = Array.from(
    new Set([
      ...normalizedDemandSizes.map(
        (item) => item.size,
      ),
      ...normalizedAssignedSizes.map(
        (item) => item.size,
      ),
    ]),
  );

  const linkedOrderNumbers = Array.isArray(
    row.orderNumbers,
  )
    ? row.orderNumbers.filter(Boolean)
    : [];

  return (
    <>
      <tr className="border-b border-zinc-100 align-top transition hover:bg-zinc-50">
        {/* Expand */}

        <td className="px-3 py-4">
          <button
            type="button"
            onClick={() =>
              setExpanded((value) => !value)
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:border-zinc-400 hover:text-black"
            aria-label={
              expanded
                ? "Collapse product details"
                : "Expand product details"
            }
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </td>

        {/* Product */}

        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
              {row.productImage ? (
                <img
                  src={row.productImage}
                  alt={
                    row.productTitle ||
                    "Product"
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package2 className="h-5 w-5 text-zinc-400" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="max-w-[260px] truncate font-semibold text-zinc-900">
                {row.productTitle ||
                  "Untitled product"}
              </p>

              <div className="mt-1 flex items-center gap-2">
                <span
                  className={[
                    "h-1.5 w-1.5 rounded-full",
                    productId
                      ? "bg-emerald-500"
                      : "bg-red-500",
                  ].join(" ")}
                />

                <p className="text-xs text-zinc-500">
                  {productId
                    ? "Product linked"
                    : "Product ID missing"}
                </p>
              </div>
            </div>
          </div>
        </td>

        {/* Code */}

        <td className="px-4 py-4">
          <span className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium">
            {row.productCode || "—"}
          </span>
        </td>

        {/* Demand */}

        <td className="px-4 py-4">
          <p className="text-lg font-semibold text-zinc-900">
            {demandQuantity}
          </p>

          <p className="mt-0.5 text-[11px] text-zinc-500">
            Ordered demand
          </p>

          <SizeBadges
            sizes={row.sizes}
            variant="default"
          />
        </td>

        {/* Assigned */}

        <td className="px-4 py-4">
          <div className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 font-semibold text-blue-700">
            <Factory className="h-4 w-4" />

            {assignedQuantity}
          </div>

          <p className="mt-2 text-xs text-zinc-500">
            {row.activeJobsCount || 0} active{" "}
            {Number(row.activeJobsCount) === 1
              ? "job"
              : "jobs"}
          </p>

          <SizeBadges
            sizes={
              row.productionCoverage?.sizes
            }
            variant="blue"
          />
        </td>

        {/* Remaining / advance */}

        <td className="px-4 py-4">
          {advanceProduction > 0 ? (
            <>
              <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 font-semibold text-amber-700">
                <Boxes className="h-4 w-4" />

                +{advanceProduction}
              </div>

              <p className="mt-2 text-xs font-medium text-amber-700">
                Advance production
              </p>
            </>
          ) : (
            <>
              <div
                className={[
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold",
                  remainingDemand > 0
                    ? "bg-black text-white"
                    : "bg-emerald-50 text-emerald-700",
                ].join(" ")}
              >
                {remainingDemand > 0 ? (
                  <Boxes className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}

                {remainingDemand}
              </div>

              <p className="mt-2 text-xs text-zinc-500">
                {remainingDemand > 0
                  ? "Demand remaining"
                  : "Demand covered"}
              </p>
            </>
          )}

          <SizeBadges
            sizes={row.remainingSizes}
            variant="gray"
          />
        </td>

        {/* Orders */}

        <td className="px-4 py-4">
          <p className="text-lg font-semibold text-zinc-900">
            {linkedOrderNumbers.length}
          </p>

          <p className="mt-0.5 text-[11px] text-zinc-500">
            Linked orders
          </p>
        </td>

        {/* Action */}

        <td className="px-4 py-4">
          <button
            type="button"
            onClick={() =>
              onCreateJob?.(row)
            }
            disabled={!canCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />

            Create Job
          </button>

          {!productId && (
            <p className="mt-2 max-w-[150px] text-xs leading-5 text-red-600">
              Product ID is missing
            </p>
          )}

          {productId &&
            remainingDemand <= 0 && (
              <p className="mt-2 max-w-[160px] text-xs leading-5 text-zinc-500">
                Advance production allowed
              </p>
            )}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-zinc-200 bg-zinc-50/70">
          <td colSpan={8} className="p-0">
            <div className="px-5 py-6 lg:px-8">
              {/* Summary cards */}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <DetailCard
                  label="Demand"
                  value={demandQuantity}
                  description="Current order demand"
                />

                <DetailCard
                  label="Assigned"
                  value={assignedQuantity}
                  description="Quantity assigned to production"
                />

                <DetailCard
                  label="Remaining Demand"
                  value={remainingDemand}
                  description="Demand not currently covered"
                />

                <DetailCard
                  label="Advance Production"
                  value={advanceProduction}
                  description="Assigned above current demand"
                  emphasis={
                    advanceProduction > 0
                  }
                />
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
                {/* Size matrix */}

                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                  <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-zinc-900">
                        Size-wise Production
                      </h3>

                      <p className="mt-1 text-xs text-zinc-500">
                        Demand, assigned, remaining
                        and advance quantity by size.
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                      {sizeNames.length} sizes
                    </span>
                  </div>

                  {sizeNames.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[580px]">
                        <thead className="bg-zinc-50">
                          <tr>
                            {[
                              "Size",
                              "Demand",
                              "Assigned",
                              "Remaining",
                              "Advance",
                              "Status",
                            ].map((heading) => (
                              <th
                                key={heading}
                                className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500"
                              >
                                {heading}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {sizeNames.map((size) => {
                            const demand =
                              getSizeQuantity(
                                normalizedDemandSizes,
                                size,
                              );

                            const assigned =
                              getSizeQuantity(
                                normalizedAssignedSizes,
                                size,
                              );

                            const remaining =
                              Math.max(
                                0,
                                demand - assigned,
                              );

                            const advance =
                              Math.max(
                                0,
                                assigned - demand,
                              );

                            let status =
                              "Covered";

                            if (remaining > 0) {
                              status = "Pending";
                            }

                            if (advance > 0) {
                              status = "Advance";
                            }

                            return (
                              <tr
                                key={size}
                                className="border-t border-zinc-100"
                              >
                                <td className="px-4 py-3">
                                  <span className="inline-flex min-w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm font-semibold">
                                    {size}
                                  </span>
                                </td>

                                <td className="px-4 py-3 text-sm">
                                  {demand}
                                </td>

                                <td className="px-4 py-3 text-sm font-semibold text-blue-700">
                                  {assigned}
                                </td>

                                <td className="px-4 py-3 text-sm font-medium">
                                  {remaining}
                                </td>

                                <td className="px-4 py-3 text-sm font-semibold text-amber-700">
                                  {advance > 0
                                    ? `+${advance}`
                                    : "—"}
                                </td>

                                <td className="px-4 py-3">
                                  <StatusBadge
                                    status={status}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="px-5 py-12 text-center text-sm text-zinc-500">
                      No size details available.
                    </div>
                  )}
                </div>

                {/* Product details */}

                <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-zinc-900">
                        Product Details
                      </h3>

                      <p className="mt-1 text-xs text-zinc-500">
                        Product and linked order
                        information.
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                      <Package2 className="h-4 w-4 text-zinc-500" />
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    <DetailLine
                      label="Product code"
                      value={
                        row.productCode || "—"
                      }
                    />

                    <DetailLine
                      label="Active jobs"
                      value={
                        row.activeJobsCount || 0
                      }
                    />

                    <DetailLine
                      label="Linked orders"
                      value={
                        linkedOrderNumbers.length
                      }
                    />

                    <DetailLine
                      label="Product ID"
                      value={productId || "—"}
                      mono
                    />
                  </div>

                  {linkedOrderNumbers.length >
                    0 && (
                    <div className="mt-5 border-t border-zinc-200 pt-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        Linked Orders
                      </p>

                      <div className="mt-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                        {linkedOrderNumbers.map(
                          (orderNumber) => (
                            <span
                              key={orderNumber}
                              className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-700"
                            >
                              {orderNumber}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs leading-5 text-zinc-600">
                      Production jobs can be
                      created above current demand.
                      Extra quantity will be tracked
                      as advance production.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onCreateJob?.(row)
                    }
                    disabled={!canCreate}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />

                    Create Production Job
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DetailCard({
  label,
  value,
  description,
  emphasis = false,
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4",
        emphasis
          ? "border-amber-200 bg-amber-50"
          : "border-zinc-200 bg-white",
      ].join(" ")}
    >
      <p
        className={[
          "text-xs font-semibold uppercase tracking-[0.14em]",
          emphasis
            ? "text-amber-700"
            : "text-zinc-500",
        ].join(" ")}
      >
        {label}
      </p>

      <p
        className={[
          "mt-2 text-2xl font-semibold tracking-tight",
          emphasis
            ? "text-amber-800"
            : "text-zinc-900",
        ].join(" ")}
      >
        {toSafeNumber(value)}
      </p>

      <p
        className={[
          "mt-1 text-xs",
          emphasis
            ? "text-amber-700"
            : "text-zinc-500",
        ].join(" ")}
      >
        {description}
      </p>
    </div>
  );
}

function DetailLine({
  label,
  value,
  mono = false,
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-zinc-500">
        {label}
      </span>

      <span
        className={[
          "max-w-[65%] break-all text-right text-sm font-semibold text-zinc-900",
          mono ? "font-mono text-xs" : "",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const classes = {
    Pending:
      "border-zinc-900 bg-zinc-900 text-white",

    Covered:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    Advance:
      "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
        classes[status] ||
          classes.Covered,
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function SizeBadges({
  sizes = [],
  variant = "default",
}) {
  const normalizedSizes =
    normalizeSizes(sizes);

  if (!normalizedSizes.length) {
    return null;
  }

  const classes = {
    default:
      "rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-700",

    blue:
      "rounded-md bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700",

    gray:
      "rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-medium text-zinc-600",

    amber:
      "rounded-md bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700",
  };

  return (
    <div className="mt-2 flex max-w-[240px] flex-wrap gap-1.5">
      {normalizedSizes.map((item) => (
        <span
          key={item.size}
          className={
            classes[variant] ||
            classes.default
          }
        >
          {item.size}: {item.quantity}
        </span>
      ))}
    </div>
  );
}