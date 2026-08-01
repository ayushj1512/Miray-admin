"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CirclePlus,
  IndianRupee,
  Loader2,
  Package,
  Plus,
  Save,
  Search,
  Trash2,
  UserRoundCog,
} from "lucide-react";

import useTailorStore from "@/store/useTailorStore";
import useTailorProductionJobStore from "@/store/useTailorProductionJobStore";
import { useAdminProductStore } from "@/store/adminProductStore";
/* =========================================================
   OPTIONS
========================================================= */

const WORK_TYPES = [
  "full_garment",
  "sampling",
  "pattern",
  "cutting",
  "stitching",
  "finishing",
];

const SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
  "4XL",
  "5XL",
  "FREE",
];

/* =========================================================
   DEFAULTS
========================================================= */

const createEmptySizeRows = () =>
  SIZES.map((size) => ({
    size,
    quantity: "",
  }));

const createProductRow = () => ({
  rowId: crypto.randomUUID(),
  productId: "",
  productCode: "",
  productTitle: "",
  productThumbnail: "",
  workRate: "",
  sizes: createEmptySizeRows(),
});

const INITIAL_FORM = {
  tailorId: "",
  workType: "full_garment",
  products: [createProductRow()],
  expectedAt: "",
  notes: "",
};

/* =========================================================
   HELPERS
========================================================= */

const clean = (value) =>
  String(value ?? "").trim();

const numberValue = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numberValue(value));

const getProductImage = (product) =>
  product?.thumbnail ||
  product?.images?.[0]?.url ||
  product?.images?.[0] ||
  "";

const inputClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#800020]/40 focus:bg-white focus:ring-4 focus:ring-[#800020]/5 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClass =
  "min-h-28 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#800020]/40 focus:bg-white focus:ring-4 focus:ring-[#800020]/5";

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function Field({
  label,
  required = false,
  children,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

function Section({
  title,
  description,
  icon: Icon,
  children,
  action,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#800020]/10 p-2.5 text-[#800020]">
            <Icon size={18} />
          </div>

          <div>
            <h2 className="font-bold text-gray-950">
              {title}
            </h2>

            {description && (
              <p className="mt-0.5 text-xs text-gray-500">
                {description}
              </p>
            )}
          </div>
        </div>

        {action}
      </div>

      <div className="p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   PRODUCT ROW
========================================================= */

function ProductAllocationCard({
  index,
  row,
  products,
  onProductChange,
  onRateChange,
  onSizeChange,
  onRemove,
  canRemove,
}) {
  const rowQuantity = row.sizes.reduce(
    (total, item) =>
      total + numberValue(item.quantity),
    0,
  );

  const rowAmount =
    rowQuantity *
    numberValue(row.workRate);

  const availableProducts = products.filter(
    (product) =>
      String(product._id) ===
      String(row.productId) ||
      true,
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-900">
            Product {index + 1}
          </p>

          <p className="mt-0.5 text-xs text-gray-500">
            Select product, quantities and rate.
          </p>
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={17} />
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
        <Field
          label="Product"
          required
        >
          <select
            value={row.productId}
            onChange={(event) =>
              onProductChange(
                event.target.value,
              )
            }
            className={inputClass}
          >
            <option value="">
              Select product
            </option>

            {availableProducts.map(
              (product) => (
                <option
                  key={product._id}
                  value={product._id}
                >
                  {product.productCode
                    ? `${product.productCode} — `
                    : ""}
                  {product.title}
                </option>
              ),
            )}
          </select>
        </Field>

        <Field
          label="Rate Per Piece"
          required
        >
          <div className="relative">
            <IndianRupee
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="number"
              min="0"
              step="0.01"
              value={row.workRate}
              onChange={(event) =>
                onRateChange(
                  event.target.value,
                )
              }
              placeholder="Rate"
              className={`${inputClass} pl-9`}
            />
          </div>
        </Field>
      </div>

      {row.productId && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
          {row.productThumbnail ? (
            <img
              src={row.productThumbnail}
              alt={row.productTitle}
              className="h-14 w-14 rounded-xl border border-gray-200 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
              <Package size={22} />
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              {row.productTitle}
            </p>

            <p className="mt-0.5 text-xs font-medium text-gray-500">
              {row.productCode}
            </p>
          </div>
        </div>
      )}

      <div className="mt-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Size-wise Quantity
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {row.sizes.map((item) => (
            <div
              key={item.size}
              className="rounded-xl border border-gray-200 bg-white p-3"
            >
              <label className="block text-center text-xs font-bold text-gray-700">
                {item.size}
              </label>

              <input
                type="number"
                min="0"
                value={item.quantity}
                onChange={(event) =>
                  onSizeChange(
                    item.size,
                    event.target.value,
                  )
                }
                placeholder="0"
                className="mt-2 h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 text-center text-sm font-semibold outline-none focus:border-[#800020]/40 focus:bg-white"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">
            Product Quantity
          </p>

          <p className="mt-1 text-lg font-bold text-gray-950">
            {rowQuantity}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">
            Product Amount
          </p>

          <p className="mt-1 text-lg font-bold text-[#800020]">
            {formatCurrency(rowAmount)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function CreateProductionJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const preselectedTailorId =
    searchParams.get("tailorId") || "";

  const {
    activeTailors = [],
    activeLoading,
    fetchActiveTailors,
  } = useTailorStore();

  const {
    createProductionJob,
    creating,
  } = useTailorProductionJobStore();

  const {
    products = [],
    fetchProducts,
    loading: productsLoading,
  } = useAdminProductStore();

  const [form, setForm] = useState({
    ...INITIAL_FORM,
    tailorId: preselectedTailorId,
  });

  const [productSearch, setProductSearch] =
    useState("");

  const [error, setError] = useState("");

  /* Load dropdown data */
  useEffect(() => {
    Promise.allSettled([
      fetchActiveTailors(),
      fetchProducts?.({
        page: 1,
        limit: 100,
        search: "",
      }),
    ]);
  }, [
    fetchActiveTailors,
    fetchProducts,
  ]);

  /* Apply tailor from query */
  useEffect(() => {
    if (!preselectedTailorId) return;

    setForm((current) => ({
      ...current,
      tailorId: preselectedTailorId,
    }));
  }, [preselectedTailorId]);

  const productList = useMemo(() => {
    const safeProducts = Array.isArray(products)
      ? products
      : [];

    const search =
      productSearch.trim().toLowerCase();

    if (!search) {
      return safeProducts;
    }

    return safeProducts.filter((product) =>
      [
        product.title,
        product.productCode,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(search),
      ),
    );
  }, [products, productSearch]);

  const totals = useMemo(() => {
    return form.products.reduce(
      (result, product) => {
        const quantity =
          product.sizes.reduce(
            (total, item) =>
              total +
              numberValue(item.quantity),
            0,
          );

        result.totalQuantity +=
          quantity;

        result.totalAmount +=
          quantity *
          numberValue(
            product.workRate,
          );

        return result;
      },
      {
        totalQuantity: 0,
        totalAmount: 0,
      },
    );
  }, [form.products]);

  const updateField = (
    field,
    value,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateProductRow = (
    rowId,
    updater,
  ) => {
    setForm((current) => ({
      ...current,

      products: current.products.map(
        (row) =>
          row.rowId === rowId
            ? updater(row)
            : row,
      ),
    }));
  };

  const handleProductChange = (
    rowId,
    productId,
  ) => {
    const product = products.find(
      (item) =>
        String(item._id) ===
        String(productId),
    );

    updateProductRow(
      rowId,
      (row) => ({
        ...row,

        productId,

        productCode:
          product?.productCode || "",

        productTitle:
          product?.title || "",

        productThumbnail:
          getProductImage(product),
      }),
    );
  };

  const handleRateChange = (
    rowId,
    workRate,
  ) => {
    updateProductRow(
      rowId,
      (row) => ({
        ...row,
        workRate,
      }),
    );
  };

  const handleSizeChange = (
    rowId,
    size,
    quantity,
  ) => {
    updateProductRow(
      rowId,
      (row) => ({
        ...row,

        sizes: row.sizes.map(
          (item) =>
            item.size === size
              ? {
                ...item,
                quantity,
              }
              : item,
        ),
      }),
    );
  };

  const addProductRow = () => {
    setForm((current) => ({
      ...current,

      products: [
        ...current.products,
        createProductRow(),
      ],
    }));
  };

  const removeProductRow = (rowId) => {
    setForm((current) => ({
      ...current,

      products: current.products.filter(
        (row) => row.rowId !== rowId,
      ),
    }));
  };

  const validateForm = () => {
    if (!form.tailorId) {
      return "Select a tailor.";
    }

    if (!form.workType) {
      return "Select a work type.";
    }

    if (!form.products.length) {
      return "Add at least one product.";
    }

    const productIds = new Set();

    for (let index = 0; index < form.products.length; index += 1) {
      const product =
        form.products[index];

      if (!product.productId) {
        return `Select product ${index + 1
          }.`;
      }

      if (
        productIds.has(
          product.productId,
        )
      ) {
        return `${product.productCode || "Product"} is added more than once.`;
      }

      productIds.add(
        product.productId,
      );

      const quantity =
        product.sizes.reduce(
          (total, item) =>
            total +
            numberValue(item.quantity),
          0,
        );

      if (quantity <= 0) {
        return `Enter quantity for ${product.productCode ||
          `product ${index + 1}`
          }.`;
      }

      if (
        numberValue(
          product.workRate,
        ) < 0
      ) {
        return `Enter a valid rate for ${product.productCode ||
          `product ${index + 1}`
          }.`;
      }
    }

    return "";
  };

  const buildPayload = () => ({
    tailorId: form.tailorId,

    workType: form.workType,

    products: form.products.map(
      (product) => ({
        productId:
          product.productId,

        workRate: numberValue(
          product.workRate,
        ),

        sizes: product.sizes
          .filter(
            (item) =>
              numberValue(
                item.quantity,
              ) > 0,
          )
          .map((item) => ({
            size: item.size,

            quantity: numberValue(
              item.quantity,
            ),
          })),
      }),
    ),

    expectedAt:
      form.expectedAt || null,

    notes: clean(form.notes),
  });

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (creating) return;

    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const job =
        await createProductionJob(
          buildPayload(),
        );

      router.push(
        job?._id
          ? `/tailor-production-jobs/${job._id}`
          : "/tailor-production-jobs",
      );
    } catch (submitError) {
      setError(
        submitError?.message ||
        "Unable to create production job.",
      );
    }
  };

  const canSubmit =
    Boolean(form.tailorId) &&
    form.products.length > 0 &&
    totals.totalQuantity > 0 &&
    !creating;

  return (
    <main className="min-h-screen bg-[#fcfafb] px-3 py-5 sm:px-6 lg:px-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-6xl"
      >
        {/* Header */}

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm hover:text-[#800020]"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">
                Create Production Job
              </h1>

              <p className="text-xs text-gray-500 sm:text-sm">
                Allocate products and quantities to a tailor.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#800020] px-5 text-sm font-semibold text-white hover:bg-[#68001a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save size={17} />
            )}

            {creating
              ? "Creating..."
              : "Create Job"}
          </button>
        </div>

        {/* Error */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-5">
          {/* Job details */}

          <Section
            title="Job Details"
            description="Select tailor and basic production information."
            icon={UserRoundCog}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Tailor"
                required
              >
                <select
                  value={form.tailorId}
                  onChange={(event) =>
                    updateField(
                      "tailorId",
                      event.target.value,
                    )
                  }
                  disabled={activeLoading}
                  className={inputClass}
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
                          ? `${tailor.tailorCode} — `
                          : ""}
                        {tailor.name}
                      </option>
                    ),
                  )}
                </select>
              </Field>

              <Field
                label="Work Type"
                required
              >
                <select
                  value={form.workType}
                  onChange={(event) =>
                    updateField(
                      "workType",
                      event.target.value,
                    )
                  }
                  className={inputClass}
                >
                  {WORK_TYPES.map(
                    (workType) => (
                      <option
                        key={workType}
                        value={workType}
                      >
                        {workType
                          .replaceAll(
                            "_",
                            " ",
                          )
                          .replace(
                            /\b\w/g,
                            (letter) =>
                              letter.toUpperCase(),
                          )}
                      </option>
                    ),
                  )}
                </select>
              </Field>

              <Field label="Expected Date">
                <div className="relative">
                  <CalendarDays
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="date"
                    value={form.expectedAt}
                    onChange={(event) =>
                      updateField(
                        "expectedAt",
                        event.target.value,
                      )
                    }
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </Field>
            </div>
          </Section>

          {/* Product search */}

          <Section
            title="Product Allocation"
            description="Add one or more product codes."
            icon={Package}
            action={
              <button
                type="button"
                onClick={addProductRow}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#800020] px-3 text-xs font-semibold text-white hover:bg-[#68001a]"
              >
                <Plus size={15} />
                Add Product
              </button>
            }
          >
            <div className="mb-4">
              <div className="relative max-w-md">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  value={productSearch}
                  onChange={(event) =>
                    setProductSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Filter product dropdown by code or title"
                  className={`${inputClass} pl-9`}
                />
              </div>

              {productsLoading && (
                <p className="mt-2 text-xs text-gray-500">
                  Loading products...
                </p>
              )}
            </div>

            <div className="grid gap-4">
              {form.products.map(
                (row, index) => (
                  <ProductAllocationCard
                    key={row.rowId}
                    index={index}
                    row={row}
                    products={productList}
                    canRemove={
                      form.products.length >
                      1
                    }
                    onProductChange={(
                      productId,
                    ) =>
                      handleProductChange(
                        row.rowId,
                        productId,
                      )
                    }
                    onRateChange={(
                      workRate,
                    ) =>
                      handleRateChange(
                        row.rowId,
                        workRate,
                      )
                    }
                    onSizeChange={(
                      size,
                      quantity,
                    ) =>
                      handleSizeChange(
                        row.rowId,
                        size,
                        quantity,
                      )
                    }
                    onRemove={() =>
                      removeProductRow(
                        row.rowId,
                      )
                    }
                  />
                ),
              )}
            </div>

            <button
              type="button"
              onClick={addProductRow}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#800020]/30 bg-[#800020]/[0.02] text-sm font-semibold text-[#800020] hover:bg-[#800020]/5"
            >
              <CirclePlus size={17} />
              Add Another Product
            </button>
          </Section>

          {/* Notes */}

          <Section
            title="Notes"
            description="Optional job instructions."
            icon={Package}
          >
            <textarea
              value={form.notes}
              onChange={(event) =>
                updateField(
                  "notes",
                  event.target.value,
                )
              }
              placeholder="Add production instructions, priority notes or quality requirements..."
              className={textareaClass}
            />
          </Section>

          {/* Totals */}

          <Section
            title="Job Summary"
            description="Automatically calculated totals."
            icon={IndianRupee}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  Products
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-950">
                  {form.products.length}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">
                  Total Quantity
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-950">
                  {totals.totalQuantity}
                </p>
              </div>

              <div className="col-span-2 rounded-xl border border-[#800020]/10 bg-[#800020]/[0.035] p-4">
                <p className="text-xs font-medium text-[#800020]/70">
                  Total Work Amount
                </p>

                <p className="mt-1 text-2xl font-bold text-[#800020]">
                  {formatCurrency(
                    totals.totalAmount,
                  )}
                </p>
              </div>
            </div>
          </Section>
        </div>

        {/* Bottom Actions */}

        <div className="sticky bottom-3 z-20 mt-5 flex justify-end gap-2 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur">
          <button
            type="button"
            disabled={creating}
            onClick={() =>
              router.push(
                "/tailor-production-jobs",
              )
            }
            className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:text-[#800020] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#800020] px-5 text-sm font-semibold text-white hover:bg-[#68001a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save size={17} />
            )}

            {creating
              ? "Creating..."
              : "Create Production Job"}
          </button>
        </div>
      </form>
    </main>
  );
}