"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  Loader2,
  Package2,
  Plus,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useAdminProductionStore } from "@/store/adminProductionStore";
import useTailorStore from "@/store/useTailorStore";
import useTailorProductionJobStore from "@/store/useTailorProductionJobStore";

/* =========================================================
   CONSTANTS
========================================================= */

const SIZE_COLUMNS = ["XS", "S", "M", "L", "XL"];

/* =========================================================
   HELPERS
========================================================= */

const num = (value) => {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
};

const clean = (value) =>
  String(value ?? "").trim();

const getProductId = (row) =>
  row?.productId ||
  row?.product?._id ||
  row?.product ||
  row?.productModel?._id ||
  row?.productModel ||
  row?._id ||
  "";

const normalizeSizes = (sizes = []) => {
  const map = new Map();

  for (const item of sizes || []) {
    const size = clean(
      item?.size,
    ).toUpperCase();

    const quantity = Math.max(
      0,
      num(
        item?.qty ??
          item?.quantity ??
          item?.count,
      ),
    );

    if (!size) continue;

    map.set(
      size,
      (map.get(size) || 0) +
        quantity,
    );
  }

  return Array.from(
    map.entries(),
  ).map(([size, quantity]) => ({
    size,
    quantity,
  }));
};

const mergeRowsByProductCode = (
  rows = [],
) => {
  const map = new Map();

  for (const row of rows || []) {
    const productCode =
      clean(row?.productCode) ||
      clean(row?.sku) ||
      clean(row?._id);

    if (!productCode) continue;

    if (!map.has(productCode)) {
      map.set(productCode, {
        ...row,
        productCode,
        sizes: [],
        orderNumbers: [],
        totalQty: 0,
      });
    }

    const current =
      map.get(productCode);

    current.totalQty += num(
      row?.totalQty,
    );

    current.sizes.push(
      ...normalizeSizes(row?.sizes),
    );

    current.orderNumbers.push(
      ...(Array.isArray(
        row?.orderNumbers,
      )
        ? row.orderNumbers
        : row?.orderNumber
          ? [row.orderNumber]
          : []),
    );

    if (
      !current.productTitle &&
      row?.productTitle
    ) {
      current.productTitle =
        row.productTitle;
    }

    if (
      !current.productImage &&
      row?.productImage
    ) {
      current.productImage =
        row.productImage;
    }

    if (
      !getProductId(current) &&
      getProductId(row)
    ) {
      current.productId =
        getProductId(row);
    }
  }

  return Array.from(
    map.values(),
  ).map((row) => {
    const sizes = normalizeSizes(
      row.sizes,
    );

    return {
      ...row,

      sizes,

      totalQty:
        sizes.reduce(
          (sum, item) =>
            sum + item.quantity,
          0,
        ) || num(row.totalQty),

      orderNumbers: Array.from(
        new Set(
          row.orderNumbers
            .map(clean)
            .filter(Boolean),
        ),
      ),
    };
  });
};

const toSizeMap = (rows = []) =>
  Object.fromEntries(
    normalizeSizes(rows).map(
      (item) => [
        item.size,
        item.quantity,
      ],
    ),
  );

const getCoverageForProduct = (
  coverageRows = [],
  productId,
  productCode,
) => {
  const normalizedCode = clean(
    productCode,
  ).toUpperCase();

  return (
    coverageRows.find((item) => {
      const sameId =
        productId &&
        String(item?.productId) ===
          String(productId);

      const sameCode =
        normalizedCode &&
        clean(item?.productCode)
          .toUpperCase() ===
          normalizedCode;

      return sameId || sameCode;
    }) || {
      sizes: [],
      totalQuantity: 0,
      activeJobsCount: 0,
    }
  );
};

const subtractSizeRows = (
  demandRows = [],
  coverageRows = [],
) => {
  const demandMap =
    toSizeMap(demandRows);

  const coverageMap =
    toSizeMap(coverageRows);

  return SIZE_COLUMNS.map(
    (size) => ({
      size,

      quantity: Math.max(
        0,
        num(demandMap[size]) -
          num(coverageMap[size]),
      ),
    }),
  ).filter(
    (item) => item.quantity > 0,
  );
};

/* =========================================================
   QUANTITY CARD
========================================================= */

function QuantityCard({
  label,
  value,
  emphasis = false,
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4",

        emphasis
          ? "border-black bg-black text-white"
          : "border-zinc-200 bg-zinc-50",
      ].join(" ")}
    >
      <p
        className={[
          "text-[10px] font-semibold uppercase tracking-[0.16em]",

          emphasis
            ? "text-zinc-300"
            : "text-zinc-500",
        ].join(" ")}
      >
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {num(value)}
      </p>
    </div>
  );
}

/* =========================================================
   CREATE JOB MODAL
========================================================= */

function CreateProductionJobModal({
  row,
  onClose,
  onCreated,
}) {
  const productId =
    getProductId(row);

  const productCode = clean(
    row?.productCode,
  );

  const productTitle =
    clean(row?.productTitle) ||
    "Untitled Product";

  const productImage =
    row?.productImage || "";

  const demandSizes = useMemo(
    () =>
      normalizeSizes(row?.sizes),
    [row?.sizes],
  );

  const productionSizes = useMemo(
    () =>
      normalizeSizes(
        row?.productionCoverage
          ?.sizes,
      ),
    [
      row?.productionCoverage
        ?.sizes,
    ],
  );

  const remainingSizes = useMemo(
    () =>
      row?.remainingSizes?.length
        ? normalizeSizes(
            row.remainingSizes,
          )
        : subtractSizeRows(
            demandSizes,
            productionSizes,
          ),
    [
      row?.remainingSizes,
      demandSizes,
      productionSizes,
    ],
  );

  const {
    activeTailors = [],
    activeLoading,
    fetchActiveTailors,
  } = useTailorStore();

  const {
    creating,
    createProductionJob,
  } =
    useTailorProductionJobStore();

  const [tailorId, setTailorId] =
    useState("");

  const [workType, setWorkType] =
    useState("full_garment");

  const [sizeMap, setSizeMap] =
    useState(() =>
      toSizeMap(remainingSizes),
    );

  const [workRate, setWorkRate] =
    useState("");

  const [expectedAt, setExpectedAt] =
    useState("");

  const [notes, setNotes] =
    useState("");

  /* Load active tailors */
  useEffect(() => {
    fetchActiveTailors().catch(
      () => {
        toast.error(
          "Unable to load active tailors.",
        );
      },
    );
  }, [fetchActiveTailors]);

  /* Fill only remaining quantities */
  useEffect(() => {
    setSizeMap(
      toSizeMap(remainingSizes),
    );
  }, [remainingSizes]);

  const demandSizeMap = useMemo(
    () => toSizeMap(demandSizes),
    [demandSizes],
  );

  const productionSizeMap =
    useMemo(
      () =>
        toSizeMap(
          productionSizes,
        ),
      [productionSizes],
    );

  const remainingSizeMap =
    useMemo(
      () =>
        toSizeMap(
          remainingSizes,
        ),
      [remainingSizes],
    );

  const selectedSizes = useMemo(
    () =>
      SIZE_COLUMNS.map(
        (size) => ({
          size,

          quantity: Math.max(
            0,
            num(sizeMap[size]),
          ),
        }),
      ).filter(
        (item) =>
          item.quantity > 0,
      ),
    [sizeMap],
  );

  const totalQuantity = useMemo(
    () =>
      selectedSizes.reduce(
        (total, item) =>
          total + item.quantity,
        0,
      ),
    [selectedSizes],
  );

  const totalAmount =
    totalQuantity *
    num(workRate);

  const selectedTailor =
    activeTailors.find(
      (tailor) =>
        String(tailor._id) ===
        String(tailorId),
    );

  const updateSizeQuantity = (
    size,
    value,
  ) => {
    const maximum =
      remainingSizeMap[size] || 0;

    setSizeMap((current) => ({
      ...current,

      [size]: Math.min(
        maximum,
        Math.max(
          0,
          num(value),
        ),
      ),
    }));
  };

  const handleCreate = async () => {
    if (!productId) {
      toast.error(
        "Product ID is missing.",
      );

      return;
    }

    if (!tailorId) {
      toast.error(
        "Select a tailor.",
      );

      return;
    }

    if (!workType) {
      toast.error(
        "Select a job type.",
      );

      return;
    }

    if (!selectedSizes.length) {
      toast.error(
        "Enter at least one size quantity.",
      );

      return;
    }

    const exceedsRemaining =
      selectedSizes.some(
        (item) => {
          const allowed =
            remainingSizeMap[
              item.size
            ] || 0;

          return (
            item.quantity >
            allowed
          );
        },
      );

    if (exceedsRemaining) {
      toast.error(
        "Production quantity cannot exceed remaining demand.",
      );

      return;
    }

    if (num(workRate) < 0) {
      toast.error(
        "Enter a valid work rate.",
      );

      return;
    }

    try {
      const job =
        await createProductionJob({
          tailorId,

          workType,

          products: [
            {
              productId,

              workRate:
                num(workRate),

              sizes:
                selectedSizes,
            },
          ],

          expectedAt:
            expectedAt || null,

          notes: clean(notes),
        });

      toast.success(
        `${
          job?.jobNumber ||
          "Production job"
        } created successfully`,
      );

      await onCreated?.(job);

      onClose();
    } catch (error) {
      toast.error(
        error?.message ||
          "Unable to create production job.",
      );
    }
  };

  const canCreate =
    Boolean(productId) &&
    Boolean(tailorId) &&
    Boolean(workType) &&
    totalQuantity > 0 &&
    !creating;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center sm:p-5">
      <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:rounded-[2rem]">
        {/* Header */}

        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-zinc-200 bg-white px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Create Production Job
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              {productTitle}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {productCode}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="rounded-xl border border-zinc-200 p-2 hover:bg-zinc-50 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-5 sm:p-7">
          {!productId && (
            <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              Product ID is missing.
            </div>
          )}

          {/* Product */}

          <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              {productImage ? (
                <img
                  src={productImage}
                  alt={productTitle}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package2 className="h-6 w-6 text-zinc-400" />
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold text-zinc-950">
                {productTitle}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                {productCode}
              </p>
            </div>
          </div>

          {/* Demand summary */}

          <div className="grid grid-cols-3 gap-3">
            <QuantityCard
              label="Demand"
              value={row.totalQty}
            />

            <QuantityCard
              label="In Production"
              value={
                row.activeProductionQuantity
              }
            />

            <QuantityCard
              label="Remaining"
              value={
                row.remainingQuantity
              }
              emphasis
            />
          </div>

          {/* Job details */}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Tailor
              </label>

              <select
                value={tailorId}
                onChange={(event) =>
                  setTailorId(
                    event.target.value,
                  )
                }
                disabled={activeLoading}
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-black disabled:bg-zinc-100"
              >
                <option value="">
                  {activeLoading
                    ? "Loading tailors..."
                    : "Select tailor"}
                </option>

                {activeTailors.map(
                  (tailor) => (
                    <option
                      key={tailor._id}
                      value={tailor._id}
                    >
                      {tailor.tailorCode
                        ? `${tailor.tailorCode} · `
                        : ""}

                      {tailor.name}
                    </option>
                  ),
                )}
              </select>

              {!activeLoading &&
                activeTailors.length ===
                  0 && (
                  <p className="mt-2 text-xs text-red-600">
                    No active tailors found.
                  </p>
                )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Job Type
              </label>

              <select
                value={workType}
                onChange={(event) =>
                  setWorkType(
                    event.target.value,
                  )
                }
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-black"
              >
                <option value="full_garment">
                  Full Garment
                </option>

                <option value="sampling">
                  Sampling
                </option>

                <option value="pattern">
                  Pattern
                </option>

                <option value="cutting">
                  Cutting
                </option>

                <option value="stitching">
                  Stitching
                </option>

                <option value="finishing">
                  Finishing
                </option>
              </select>
            </div>
          </div>

          {/* Size quantities */}

          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  Size Quantities
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  Only remaining demand is prefilled.
                </p>
              </div>

              <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                {totalQuantity} pieces
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {SIZE_COLUMNS.map(
                (size) => {
                  const demand =
                    demandSizeMap[
                      size
                    ] || 0;

                  const inProduction =
                    productionSizeMap[
                      size
                    ] || 0;

                  const remaining =
                    remainingSizeMap[
                      size
                    ] || 0;

                  return (
                    <div
                      key={size}
                      className="rounded-2xl border border-zinc-200 bg-white p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          {size}
                        </span>

                        <span className="text-[10px] font-semibold text-zinc-500">
                          Need{" "}
                          {
                            remaining
                          }
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-[10px]">
                        <div className="flex justify-between text-zinc-500">
                          <span>
                            Demand
                          </span>

                          <span>
                            {demand}
                          </span>
                        </div>

                        <div className="flex justify-between text-blue-600">
                          <span>
                            In production
                          </span>

                          <span>
                            {
                              inProduction
                            }
                          </span>
                        </div>
                      </div>

                      <input
                        type="number"
                        min="0"
                        max={
                          remaining
                        }
                        value={
                          sizeMap[
                            size
                          ] ?? 0
                        }
                        onChange={(
                          event,
                        ) =>
                          updateSizeQuantity(
                            size,
                            event
                              .target
                              .value,
                          )
                        }
                        disabled={
                          remaining <=
                          0
                        }
                        className="mt-3 h-10 w-full rounded-xl border border-zinc-200 px-3 text-center font-semibold outline-none focus:border-black disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                      />
                    </div>
                  );
                },
              )}
            </div>
          </div>

          {/* Rate and date */}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Work Rate Per Piece
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={workRate}
                onChange={(event) =>
                  setWorkRate(
                    event.target.value,
                  )
                }
                placeholder="Enter rate"
                className="h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Expected Date
              </label>

              <input
                type="date"
                value={expectedAt}
                onChange={(event) =>
                  setExpectedAt(
                    event.target.value,
                  )
                }
                className="h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Job total */}

          <div className="grid grid-cols-2 gap-3">
            <QuantityCard
              label="Job Quantity"
              value={totalQuantity}
            />

            <div className="rounded-2xl border border-black bg-black p-4 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
                Total Amount
              </p>

              <p className="mt-2 text-2xl font-semibold">
                ₹
                {new Intl.NumberFormat(
                  "en-IN",
                ).format(
                  totalAmount,
                )}
              </p>
            </div>
          </div>

          {selectedTailor && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Allocating To
              </p>

              <p className="mt-2 font-semibold text-zinc-950">
                {selectedTailor.name}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                {
                  selectedTailor.tailorCode
                }

                {selectedTailor.mobile
                  ? ` · ${selectedTailor.mobile}`
                  : ""}
              </p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Notes
            </label>

            <textarea
              rows={3}
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value,
                )
              }
              placeholder="Production or quality instructions..."
              className="w-full resize-none rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>
        </div>

        {/* Actions */}

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-zinc-200 bg-white px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCreate}
            disabled={!canCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}

            {creating
              ? "Creating..."
              : `Create Job (${totalQuantity})`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AllProductionJobPage() {
  const {
    productionJobs = [],
    productionJobSummary = {},
    productionJobFilters = {},
    loadingProductionJobs,
    error,
    setProductionJobSearch,
    fetchProcessingOrderProducts,
  } = useAdminProductionStore();

  const {
    productionCoverage = [],
    coverageLoading,
    fetchProductionCoverage,
  } =
    useTailorProductionJobStore();

  const [selectedRow, setSelectedRow] =
    useState(null);

  /* Load demand and production coverage */
  useEffect(() => {
    Promise.allSettled([
      fetchProcessingOrderProducts(),
      fetchProductionCoverage(),
    ]);
  }, [
    fetchProcessingOrderProducts,
    fetchProductionCoverage,
  ]);

  /* Merge demand and active jobs */
  const rows = useMemo(() => {
    return mergeRowsByProductCode(
      productionJobs,
    ).map((row) => {
      const productId =
        getProductId(row);

      const coverage =
        getCoverageForProduct(
          productionCoverage,
          productId,
          row.productCode,
        );

      const remainingSizes =
        subtractSizeRows(
          row.sizes,
          coverage.sizes,
        );

      const remainingQuantity =
        remainingSizes.reduce(
          (total, item) =>
            total +
            num(item.quantity),
          0,
        );

      return {
        ...row,

        productionCoverage:
          coverage,

        activeProductionQuantity:
          num(
            coverage.totalQuantity,
          ),

        activeJobsCount:
          num(
            coverage.activeJobsCount,
          ),

        remainingSizes,
        remainingQuantity,
      };
    });
  }, [
    productionJobs,
    productionCoverage,
  ]);

  const coverageSummary =
    useMemo(
      () =>
        rows.reduce(
          (summary, row) => {
            summary.inProduction +=
              num(
                row.activeProductionQuantity,
              );

            summary.remaining +=
              num(
                row.remainingQuantity,
              );

            return summary;
          },
          {
            inProduction: 0,
            remaining: 0,
          },
        ),
      [rows],
    );

  const handleSearch = (
    event,
  ) => {
    if (event.key !== "Enter") {
      return;
    }

    fetchProcessingOrderProducts({
      ...productionJobFilters,

      q: event.currentTarget.value,

      page: 1,
    });
  };

  const handleJobCreated =
    async () => {
      await Promise.allSettled([
        fetchProcessingOrderProducts({
          ...productionJobFilters,
        }),

        fetchProductionCoverage(),
      ]);
    };

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4 text-black sm:p-6 lg:p-8">
      {/* Header */}

      <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
              <Package2 className="h-3.5 w-3.5" />

              Production Demand
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Create tailor jobs from demand
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Demand minus active production automatically gives the remaining quantity.
            </p>
          </div>

          <div className="flex min-w-full items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 lg:min-w-[340px]">
            <Search className="h-4 w-4 text-zinc-400" />

            <input
              value={
                productionJobFilters?.q ||
                ""
              }
              onChange={(event) =>
                setProductionJobSearch(
                  event.target.value,
                )
              }
              onKeyDown={handleSearch}
              placeholder="Search product code or title..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>
      </div>

      {/* Summary */}

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <QuantityCard
          label="Products"
          value={rows.length}
        />

        <QuantityCard
          label="Ordered Quantity"
          value={
            productionJobSummary
              ?.totalOrderedQty
          }
        />

        <QuantityCard
          label="Reserved"
          value={
            productionJobSummary
              ?.totalReservedQty
          }
        />

        <QuantityCard
          label="In Production"
          value={
            coverageSummary.inProduction
          }
        />

        <QuantityCard
          label="Remaining"
          value={
            coverageSummary.remaining
          }
          emphasis
        />
      </div>

      {/* Error */}

      {error && (
        <div className="mt-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          {error}
        </div>
      )}

      {/* Table */}

      <div className="mt-5 overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px]">
            <thead className="bg-zinc-50">
              <tr className="border-b border-zinc-200">
                {[
                  "Product",
                  "Code",
                  "Demand",
                  "In Production",
                  "To Produce",
                  "Orders",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loadingProductionJobs ||
              coverageLoading ? (
                Array.from({
                  length: 6,
                }).map(
                  (_, index) => (
                    <tr
                      key={index}
                      className="border-b border-zinc-100"
                    >
                      {Array.from({
                        length: 7,
                      }).map(
                        (
                          __,
                          cell,
                        ) => (
                          <td
                            key={
                              cell
                            }
                            className="px-4 py-4"
                          >
                            <div className="h-10 animate-pulse rounded-xl bg-zinc-100" />
                          </td>
                        ),
                      )}
                    </tr>
                  ),
                )
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-16 text-center text-sm text-zinc-500"
                  >
                    No production demand found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={
                      row.productCode
                    }
                    className="border-b border-zinc-100 align-top hover:bg-zinc-50"
                  >
                    {/* Product */}

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
                          {row.productImage ? (
                            <img
                              src={
                                row.productImage
                              }
                              alt={
                                row.productTitle
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package2 className="h-5 w-5 text-zinc-400" />
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="max-w-[260px] font-semibold">
                            {row.productTitle ||
                              "Untitled product"}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            {getProductId(
                              row,
                            )
                              ? "Product linked"
                              : "Product ID missing"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Product code */}

                    <td className="px-4 py-4">
                      <span className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium">
                        {
                          row.productCode
                        }
                      </span>
                    </td>

                    {/* Demand */}

                    <td className="px-4 py-4">
                      <div className="flex max-w-[240px] flex-wrap gap-1.5">
                        {normalizeSizes(
                          row.sizes,
                        ).map(
                          (item) => (
                            <span
                              key={
                                item.size
                              }
                              className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs"
                            >
                              {
                                item.size
                              }
                              :{" "}
                              {
                                item.quantity
                              }
                            </span>
                          ),
                        )}
                      </div>

                      <p className="mt-2 text-xs font-semibold text-zinc-500">
                        Total:{" "}
                        {row.totalQty}
                      </p>
                    </td>

                    {/* Active production */}

                    <td className="px-4 py-4">
                      <div className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 font-semibold text-blue-700">
                        <Boxes className="h-4 w-4" />

                        {
                          row.activeProductionQuantity
                        }
                      </div>

                      <p className="mt-2 text-xs text-zinc-500">
                        {
                          row.activeJobsCount
                        }{" "}
                        active{" "}
                        {row.activeJobsCount ===
                        1
                          ? "job"
                          : "jobs"}
                      </p>

                      <div className="mt-2 flex max-w-[220px] flex-wrap gap-1">
                        {normalizeSizes(
                          row
                            .productionCoverage
                            ?.sizes,
                        ).map(
                          (item) => (
                            <span
                              key={
                                item.size
                              }
                              className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700"
                            >
                              {
                                item.size
                              }
                              :{" "}
                              {
                                item.quantity
                              }
                            </span>
                          ),
                        )}
                      </div>
                    </td>

                    {/* Remaining */}

                    <td className="px-4 py-4">
                      <div
                        className={[
                          "inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold",

                          row.remainingQuantity >
                          0
                            ? "bg-black text-white"
                            : "bg-emerald-50 text-emerald-700",
                        ].join(" ")}
                      >
                        {row.remainingQuantity >
                        0 ? (
                          <Boxes className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}

                        {
                          row.remainingQuantity
                        }
                      </div>

                      <div className="mt-2 flex max-w-[220px] flex-wrap gap-1">
                        {row.remainingSizes.map(
                          (item) => (
                            <span
                              key={
                                item.size
                              }
                              className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-medium text-zinc-600"
                            >
                              {
                                item.size
                              }
                              :{" "}
                              {
                                item.quantity
                              }
                            </span>
                          ),
                        )}
                      </div>
                    </td>

                    {/* Orders */}

                    <td className="px-4 py-4 text-sm text-zinc-600">
                      {
                        row
                          .orderNumbers
                          .length
                      }
                    </td>

                    {/* Action */}

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedRow(
                            row,
                          )
                        }
                        disabled={
                          !getProductId(
                            row,
                          ) ||
                          row.remainingQuantity <=
                            0 ||
                          coverageLoading
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {row.remainingQuantity >
                        0 ? (
                          <>
                            <Plus className="h-4 w-4" />

                            Create{" "}
                            {
                              row.remainingQuantity
                            }
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />

                            Covered
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}

      {selectedRow && (
        <CreateProductionJobModal
          row={selectedRow}
          onClose={() =>
            setSelectedRow(null)
          }
          onCreated={
            handleJobCreated
          }
        />
      )}
    </div>
  );
}