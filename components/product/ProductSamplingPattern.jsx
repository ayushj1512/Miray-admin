"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  Loader2,
  Ruler,
  Save,
  Scissors,
} from "lucide-react";

import { useAdminProductStore } from "@/store/adminProductStore";

const safeArr = (value) => (Array.isArray(value) ? value : []);

const text = (value) => String(value ?? "").trim();

const getVariantSize = (variant) => {
  if (variant?.size) return text(variant.size).toUpperCase();

  const attributes = safeArr(variant?.attributes);

  const sizeAttribute = attributes.find((attribute) =>
    ["size", "sizes"].includes(
      text(attribute?.key).toLowerCase(),
    ),
  );

  return text(sizeAttribute?.value).toUpperCase() || "Variant";
};

export default function ProductSamplingPattern({
  productId = "",
  variants = [],
  isSamplingDone = false,
  editable = true,
  onVariantsChange,
  onSamplingChange,
  className = "",
}) {
  const {
    saving,
    updateVariantPatternNumber,
    updateSamplingStatus,
  } = useAdminProductStore();

  const [savingVariantId, setSavingVariantId] = useState("");

  const rows = useMemo(
    () =>
      safeArr(variants).map((variant, index) => ({
        ...variant,
        rowKey: variant?._id || `variant-${index}`,
        size: getVariantSize(variant),
        patternNumber: text(variant?.patternNumber),
      })),
    [variants],
  );

  const patternsCompleted = useMemo(
    () => rows.filter((variant) => variant.patternNumber).length,
    [rows],
  );

  const isPatternReady =
    rows.length > 0 && patternsCompleted === rows.length;

  const updateLocalVariant = (index, patternNumber) => {
    const nextVariants = safeArr(variants).map((variant, variantIndex) =>
      variantIndex === index
        ? {
            ...variant,
            patternNumber,
          }
        : variant,
    );

    onVariantsChange?.(nextVariants);
  };

  const savePatternNumber = async (variant, index) => {
    const variantId = variant?._id;
    const patternNumber = text(variant?.patternNumber);

    if (!productId) {
      return;
    }

    if (!variantId) {
      throw new Error(
        "Save the product first before updating this variant separately.",
      );
    }

    try {
      setSavingVariantId(String(variantId));

      const updatedProduct = await updateVariantPatternNumber(
        productId,
        variantId,
        patternNumber,
      );

      if (Array.isArray(updatedProduct?.variants)) {
        onVariantsChange?.(updatedProduct.variants);
      }
    } finally {
      setSavingVariantId("");
    }
  };

  const handleSamplingChange = async (nextValue) => {
    onSamplingChange?.(nextValue);

    if (!productId) return;

    try {
      const updatedProduct = await updateSamplingStatus(
        productId,
        nextValue,
      );

      onSamplingChange?.(
        Boolean(updatedProduct?.isSamplingDone),
      );
    } catch {
      onSamplingChange?.(!nextValue);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-4 border-b border-gray-100 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <div className="flex items-center gap-2">
            <Scissors size={18} className="text-gray-700" />

            <h2 className="text-base font-semibold text-gray-900">
              Sampling & Pattern
            </h2>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Manage sampling status and size-wise pattern numbers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              isPatternReady
                ? "bg-green-50 text-green-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {isPatternReady ? (
              <CheckCircle2 size={14} />
            ) : (
              <Circle size={14} />
            )}

            {isPatternReady
              ? "All patterns ready"
              : `${patternsCompleted}/${rows.length} patterns added`}
          </span>

          <button
            type="button"
            disabled={!editable || saving}
            onClick={() =>
              handleSamplingChange(!isSamplingDone)
            }
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isSamplingDone
                ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : isSamplingDone ? (
              <CheckCircle2 size={15} />
            ) : (
              <Circle size={15} />
            )}

            {isSamplingDone
              ? "Sampling Done"
              : "Sampling Pending"}
          </button>
        </div>
      </div>

      <div className="p-5 md:p-6">
        {!rows.length ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
            <Ruler
              size={24}
              className="mx-auto text-gray-400"
            />

            <p className="mt-2 text-sm font-medium text-gray-700">
              No size variants available
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Add size attributes and generate variants first.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((variant, index) => {
              const isSavingThisVariant =
                savingVariantId === String(variant?._id);

              return (
                <div
                  key={variant.rowKey}
                  className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-3 md:grid-cols-[100px_minmax(0,1fr)_auto] md:items-center"
                >
                  <div>
                    <p className="text-xs text-gray-500">
                      Size
                    </p>

                    <p className="font-semibold text-gray-900">
                      {variant.size}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Pattern Number
                    </label>

                    <input
                      type="text"
                      value={variant.patternNumber}
                      disabled={!editable}
                      placeholder={`Pattern number for ${variant.size}`}
                      onChange={(event) =>
                        updateLocalVariant(
                          index,
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:border-black focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  {productId && editable ? (
                    <button
                      type="button"
                      disabled={
                        saving ||
                        isSavingThisVariant ||
                        !variant?._id
                      }
                      onClick={() =>
                        savePatternNumber(variant, index)
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-xl bg-black px-4 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSavingThisVariant ? (
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                      ) : (
                        <Save size={15} />
                      )}

                      Save
                    </button>
                  ) : variant.patternNumber ? (
                    <div className="inline-flex h-10 items-center justify-center gap-1.5 self-end rounded-xl bg-green-50 px-3 text-xs font-medium text-green-700">
                      <Check size={14} />
                      Added
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {!productId ? (
          <p className="mt-3 text-xs text-gray-500">
            Pattern numbers and sampling status will be saved
            when the product is created.
          </p>
        ) : null}
      </div>
    </div>
  );
}