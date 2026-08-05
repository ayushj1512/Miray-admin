"use client";

import {
  AlertCircle,
  Factory,
  Loader2,
  Package2,
  Plus,
  TrendingUp,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import useTailorStore from "@/store/useTailorStore";
import useTailorProductionJobStore from "@/store/useTailorProductionJobStore";

import QuantityCard from "./QuantityCard";

import {
  SIZE_COLUMNS,
  clean,
  getProductId,
  normalizeSizes,
  num,
  subtractSizeRows,
  toSizeMap,
} from "@/app/production/all-production-job/utils";

const toSafeNumber = (value) =>
  Math.max(0, Number(value) || 0);

export default function CreateProductionJobModal({
  row,
  onClose,
  onCreated,
}) {
  const productId = getProductId(row);

  const productCode = clean(
    row?.productCode,
  );

  const productTitle =
    clean(row?.productTitle) ||
    "Untitled Product";

  const productImage =
    row?.productImage || "";

  const {
    activeTailors = [],
    activeLoading,
    fetchActiveTailors,
  } = useTailorStore();

  const {
    creating,
    createProductionJob,
  } = useTailorProductionJobStore();

  const demandSizes = useMemo(
    () => normalizeSizes(row?.sizes),
    [row?.sizes],
  );

  const productionSizes = useMemo(
    () =>
      normalizeSizes(
        row?.productionCoverage?.sizes,
      ),
    [row?.productionCoverage?.sizes],
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

  const [tailorId, setTailorId] =
    useState("");

  const [workType, setWorkType] =
    useState("full_garment");

  /*
   * Remaining demand is only used as an initial
   * suggestion. Admin may increase any size above it.
   */
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

  useEffect(() => {
    fetchActiveTailors().catch(() => {
      toast.error(
        "Unable to load active tailors.",
      );
    });
  }, [fetchActiveTailors]);

  useEffect(() => {
    setSizeMap(
      toSizeMap(remainingSizes),
    );
  }, [remainingSizes]);

  const demandSizeMap = useMemo(
    () => toSizeMap(demandSizes),
    [demandSizes],
  );

  const productionSizeMap = useMemo(
    () => toSizeMap(productionSizes),
    [productionSizes],
  );

  const remainingSizeMap = useMemo(
    () => toSizeMap(remainingSizes),
    [remainingSizes],
  );

  const selectedSizes = useMemo(
    () =>
      SIZE_COLUMNS.map((size) => ({
        size,
        quantity: Math.max(
          0,
          num(sizeMap[size]),
        ),
      })).filter(
        (item) => item.quantity > 0,
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

  const demandQuantity = toSafeNumber(
    row?.totalQty,
  );

  const assignedQuantity = toSafeNumber(
    row?.activeProductionQuantity,
  );

  const remainingDemand = Math.max(
    0,
    demandQuantity - assignedQuantity,
  );

  /*
   * Quantity from this new job that goes above
   * the current remaining demand.
   */
  const advanceQuantity = Math.max(
    0,
    totalQuantity - remainingDemand,
  );

  const totalAssignedAfterJob =
    assignedQuantity + totalQuantity;

  const totalAdvanceAfterJob = Math.max(
    0,
    totalAssignedAfterJob - demandQuantity,
  );

  const totalAmount =
    totalQuantity * num(workRate);

  const selectedTailor =
    activeTailors.find(
      (tailor) =>
        String(tailor._id) ===
        String(tailorId),
    );

  /*
   * No demand-based maximum.
   * Any non-negative quantity is allowed.
   */
  const updateSizeQuantity = (
    size,
    value,
  ) => {
    setSizeMap((current) => ({
      ...current,
      [size]: Math.max(
        0,
        num(value),
      ),
    }));
  };

  const fillRemainingDemand = () => {
    setSizeMap(
      toSizeMap(remainingSizes),
    );
  };

  const clearAllSizes = () => {
    setSizeMap(
      Object.fromEntries(
        SIZE_COLUMNS.map((size) => [
          size,
          0,
        ]),
      ),
    );
  };

  const handleCreate = async () => {
    if (!productId) {
      toast.error(
        "Product ID is missing.",
      );

      return;
    }

    if (!tailorId) {
      toast.error("Select a tailor.");
      return;
    }

    if (!workType) {
      toast.error("Select a job type.");
      return;
    }

    if (!selectedSizes.length) {
      toast.error(
        "Enter at least one size quantity.",
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
              workRate: num(workRate),
              sizes: selectedSizes,
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
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-[2px] sm:items-center sm:p-5">
      <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:rounded-[2rem]">
        {/* Header */}

        <div className="sticky top-0 z-20 flex items-start justify-between border-b border-zinc-200 bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              <Factory className="h-3.5 w-3.5" />

              Create Production Job
            </div>

            <h2 className="mt-3 text-xl font-semibold tracking-tight">
              {productTitle}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {productCode || "No product code"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="rounded-xl border border-zinc-200 p-2 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-5 sm:p-7">
          {!productId && (
            <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              Product ID is missing. This job
              cannot be created until the product
              is properly linked.
            </div>
          )}

          {/* Product snapshot */}

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

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {productTitle}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                {productCode || "No code"}
              </p>
            </div>

            <div className="hidden rounded-xl border border-zinc-200 bg-white px-3 py-2 text-right sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Product ID
              </p>

              <p className="mt-1 max-w-[180px] truncate font-mono text-xs">
                {productId || "Missing"}
              </p>
            </div>
          </div>

          {/* Existing production summary */}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <QuantityCard
              label="Demand"
              value={demandQuantity}
            />

            <QuantityCard
              label="Already Assigned"
              value={assignedQuantity}
            />

            <QuantityCard
              label="Remaining Demand"
              value={remainingDemand}
              emphasis
            />

            <QuantityCard
              label="Active Jobs"
              value={
                row?.activeJobsCount || 0
              }
            />
          </div>

          {/* Advance production notice */}

          <div className="flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" />

            <div>
              <p className="font-semibold">
                Advance production is allowed
              </p>

              <p className="mt-1 leading-6 text-blue-700">
                You may assign more than the
                current remaining demand. Extra
                quantity will be tracked as advance
                production for future inventory.
              </p>
            </div>
          </div>

          {/* Tailor and type */}

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
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-black disabled:bg-zinc-100"
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
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-black"
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
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="font-semibold">
                  Size Quantities
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  Remaining demand is prefilled,
                  but every size can be increased
                  freely.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={fillRemainingDemand}
                  disabled={creating}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold transition hover:bg-zinc-50 disabled:opacity-40"
                >
                  Fill Remaining
                </button>

                <button
                  type="button"
                  onClick={clearAllSizes}
                  disabled={creating}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold transition hover:bg-zinc-50 disabled:opacity-40"
                >
                  Clear
                </button>

                <span className="rounded-full bg-black px-3 py-2 text-xs font-semibold text-white">
                  {totalQuantity} pieces
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {SIZE_COLUMNS.map((size) => {
                const demand =
                  demandSizeMap[size] || 0;

                const inProduction =
                  productionSizeMap[size] || 0;

                const remaining =
                  remainingSizeMap[size] || 0;

                const entered = toSafeNumber(
                  sizeMap[size],
                );

                const sizeAdvance = Math.max(
                  0,
                  entered - remaining,
                );

                return (
                  <div
                    key={size}
                    className={[
                      "rounded-2xl border bg-white p-3 transition",
                      sizeAdvance > 0
                        ? "border-amber-300 ring-1 ring-amber-100"
                        : "border-zinc-200",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">
                        {size}
                      </span>

                      <span
                        className={[
                          "rounded-full px-2 py-1 text-[9px] font-semibold",
                          remaining > 0
                            ? "bg-zinc-100 text-zinc-600"
                            : "bg-emerald-50 text-emerald-700",
                        ].join(" ")}
                      >
                        Need {remaining}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-[10px]">
                      <div className="flex justify-between text-zinc-500">
                        <span>Demand</span>
                        <span>{demand}</span>
                      </div>

                      <div className="flex justify-between text-blue-600">
                        <span>
                          Already assigned
                        </span>

                        <span>
                          {inProduction}
                        </span>
                      </div>

                      {sizeAdvance > 0 && (
                        <div className="flex justify-between font-semibold text-amber-700">
                          <span>Advance</span>

                          <span>
                            +{sizeAdvance}
                          </span>
                        </div>
                      )}
                    </div>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        sizeMap[size] ?? 0
                      }
                      onChange={(event) =>
                        updateSizeQuantity(
                          size,
                          event.target.value,
                        )
                      }
                      disabled={creating}
                      className={[
                        "mt-3 h-10 w-full rounded-xl border px-3 text-center font-semibold outline-none transition disabled:cursor-not-allowed disabled:bg-zinc-100",
                        sizeAdvance > 0
                          ? "border-amber-300 bg-amber-50 focus:border-amber-500"
                          : "border-zinc-200 focus:border-black",
                      ].join(" ")}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rate and expected date */}

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
                className="h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none transition focus:border-black"
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
                className="h-12 w-full rounded-2xl border border-zinc-200 px-4 text-sm outline-none transition focus:border-black"
              />
            </div>
          </div>

          {/* New job summary */}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <QuantityCard
              label="New Job Quantity"
              value={totalQuantity}
            />

            <QuantityCard
              label="Advance in This Job"
              value={advanceQuantity}
            />

            <QuantityCard
              label="Assigned After Job"
              value={totalAssignedAfterJob}
            />

            <QuantityCard
              label="Total Advance After Job"
              value={totalAdvanceAfterJob}
              emphasis={
                totalAdvanceAfterJob > 0
              }
            />
          </div>

          {/* Amount */}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Job Quantity
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {totalQuantity}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Across {selectedSizes.length}{" "}
                selected{" "}
                {selectedSizes.length === 1
                  ? "size"
                  : "sizes"}
              </p>
            </div>

            <div className="rounded-2xl border border-black bg-black p-4 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
                Total Amount
              </p>

              <p className="mt-2 text-2xl font-semibold">
                ₹
                {new Intl.NumberFormat(
                  "en-IN",
                ).format(totalAmount)}
              </p>

              <p className="mt-1 text-xs text-zinc-400">
                {totalQuantity} × ₹
                {new Intl.NumberFormat(
                  "en-IN",
                ).format(num(workRate))}
              </p>
            </div>
          </div>

          {/* Selected tailor */}

          {selectedTailor && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Allocating To
              </p>

              <p className="mt-2 font-semibold">
                {selectedTailor.name}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                {selectedTailor.tailorCode}

                {selectedTailor.mobile
                  ? ` · ${selectedTailor.mobile}`
                  : ""}
              </p>
            </div>
          )}

          {/* Notes */}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Notes
            </label>

            <textarea
              rows={3}
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Production, stitching or quality instructions..."
              className="w-full resize-none rounded-2xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-black"
            />
          </div>
        </div>

        {/* Footer */}

        <div className="sticky bottom-0 z-20 flex flex-col gap-3 border-t border-zinc-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="text-sm text-zinc-500">
            {advanceQuantity > 0 ? (
              <span className="font-medium text-amber-700">
                This job includes{" "}
                {advanceQuantity} advance pieces.
              </span>
            ) : (
              <span>
                This job is within current
                remaining demand.
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-medium transition hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCreate}
              disabled={!canCreate}
              className="inline-flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
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
    </div>
  );
}