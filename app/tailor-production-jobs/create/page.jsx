"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  Factory,
  IndianRupee,
  Loader2,
  Package,
  Plus,
  Save,
  Search,
  Shirt,
  Trash2,
  UserRoundCog,
} from "lucide-react";
import { toast } from "react-hot-toast";

import useTailorProductionJobStore from "@/store/useTailorProductionJobStore";
import useTailorStore from "@/store/useTailorStore";

const SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "FREE",
];

const WORK_TYPES = [
  "stitching",
  "finishing",
  "alteration",
  "sampling",
  "complete-production",
];

const RATE_TYPES = [
  {
    value: "per-piece",
    label: "Per Piece",
  },
  {
    value: "fixed",
    label: "Fixed Job Rate",
  },
];

const initialQuantities = SIZES.reduce(
  (result, size) => {
    result[size] = 0;
    return result;
  },
  {},
);

const initialForm = {
  tailorId: "",
  productId: "",

  workType: "stitching",

  rateType: "per-piece",
  rateAmount: "",

  issueDate: new Date()
    .toISOString()
    .slice(0, 10),

  expectedCompletionDate: "",

  priority: "normal",

  quantities: initialQuantities,

  materialNotes: "",
  productionNotes: "",
};

const numberValue = (value) => {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
};

const cleanText = (value) =>
  String(value ?? "").trim();

const getTailorId = (tailor) =>
  tailor?._id || tailor?.id || "";

const getProductId = (product) =>
  product?._id ||
  product?.id ||
  product?.productId ||
  "";

const getProductTitle = (product) =>
  product?.title ||
  product?.name ||
  product?.productSnapshot?.title ||
  "Untitled Product";

const getProductCode = (product) =>
  product?.productCode ||
  product?.code ||
  product?.sku ||
  product?.productSnapshot?.productCode ||
  "No code";

const getProductImage = (product) =>
  product?.thumbnail ||
  product?.image ||
  product?.images?.[0]?.url ||
  product?.images?.[0] ||
  product?.productSnapshot?.thumbnail ||
  "";

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#800020]/8 text-[#800020]">
          <Icon size={19} />
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-950">
            {title}
          </h2>

          <p className="mt-0.5 text-xs leading-5 text-gray-500">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

function FieldLabel({
  children,
  required = false,
}) {
  return (
    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
      {children}

      {required && (
        <span className="ml-1 text-red-500">
          *
        </span>
      )}
    </label>
  );
}

export default function CreateTailorProductionJobPage() {
  const router = useRouter();

  const {
    createProductionJob,
    creating,
    error,
    clearError,
  } = useTailorProductionJobStore();

  const {
    tailors,
    loading: tailorsLoading,
    fetchTailors,
    fetchTailorById,
  } = useTailorStore();

  const [form, setForm] =
    useState(initialForm);

  const [selectedTailor, setSelectedTailor] =
    useState(null);

  const [assignedProducts, setAssignedProducts] =
    useState([]);

  const [productsLoading, setProductsLoading] =
    useState(false);

  const [productSearch, setProductSearch] =
    useState("");

  const [formError, setFormError] =
    useState("");

  useEffect(() => {
    fetchTailors({
      page: 1,
      limit: 100,
      status: "active",
    });
  }, [fetchTailors]);

  useEffect(() => {
    clearError?.();
  }, [clearError]);

  const availableTailors = useMemo(() => {
    if (!Array.isArray(tailors)) {
      return [];
    }

    return tailors.filter(
      (tailor) =>
        tailor?.status !== "inactive" &&
        tailor?.availability !==
          "unavailable",
    );
  }, [tailors]);

  const filteredProducts = useMemo(() => {
    const search = productSearch
      .trim()
      .toLowerCase();

    if (!search) {
      return assignedProducts;
    }

    return assignedProducts.filter(
      (product) => {
        const title = getProductTitle(product)
          .toLowerCase();

        const code = getProductCode(product)
          .toLowerCase();

        return (
          title.includes(search) ||
          code.includes(search)
        );
      },
    );
  }, [
    assignedProducts,
    productSearch,
  ]);

  const selectedProduct = useMemo(() => {
    return assignedProducts.find(
      (product) =>
        getProductId(product) ===
        form.productId,
    );
  }, [
    assignedProducts,
    form.productId,
  ]);

  const totalQuantity = useMemo(() => {
    return Object.values(
      form.quantities,
    ).reduce(
      (total, quantity) =>
        total + numberValue(quantity),
      0,
    );
  }, [form.quantities]);

  const estimatedAmount = useMemo(() => {
    const rate = numberValue(
      form.rateAmount,
    );

    if (form.rateType === "fixed") {
      return rate;
    }

    return rate * totalQuantity;
  }, [
    form.rateAmount,
    form.rateType,
    totalQuantity,
  ]);

  const handleFieldChange = (
    event,
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
  };

  const handleQuantityChange = (
    size,
    value,
  ) => {
    const quantity = Math.max(
      0,
      numberValue(value),
    );

    setForm((current) => ({
      ...current,
      quantities: {
        ...current.quantities,
        [size]: quantity,
      },
    }));

    setFormError("");
  };

  const resetQuantities = () => {
    setForm((current) => ({
      ...current,
      quantities: {
        ...initialQuantities,
      },
    }));
  };

  const handleTailorChange = async (
    event,
  ) => {
    const tailorId = event.target.value;

    setForm((current) => ({
      ...current,
      tailorId,
      productId: "",
      rateAmount: "",
    }));

    setAssignedProducts([]);
    setSelectedTailor(null);
    setProductSearch("");
    setFormError("");

    if (!tailorId) {
      return;
    }

    setProductsLoading(true);

    try {
      const response =
        await fetchTailorById(tailorId);

      const tailor =
        response?.tailor ||
        response?.data?.tailor ||
        response?.data ||
        response;

      setSelectedTailor(tailor);

      const products =
        tailor?.assignedProducts ||
        tailor?.products ||
        [];

      setAssignedProducts(
        Array.isArray(products)
          ? products.filter(
              (product) =>
                product?.status !==
                "inactive",
            )
          : [],
      );
    } catch (requestError) {
      toast.error(
        requestError?.message ||
          "Unable to load tailor products.",
      );
    } finally {
      setProductsLoading(false);
    }
  };

  const handleProductSelect = (
    product,
  ) => {
    const productId =
      getProductId(product);

    const rateAmount =
      product?.rate?.amount ??
      product?.rateAmount ??
      product?.defaultRate ??
      "";

    const rateType =
      product?.rate?.type ||
      product?.rateType ||
      form.rateType;

    setForm((current) => ({
      ...current,
      productId,
      rateAmount:
        rateAmount === null
          ? ""
          : String(rateAmount),
      rateType,
    }));

    setFormError("");
  };

  const validateForm = () => {
    if (!form.tailorId) {
      return "Please select a tailor.";
    }

    if (!form.productId) {
      return "Please select an assigned product.";
    }

    if (!form.workType) {
      return "Please select a work type.";
    }

    if (totalQuantity <= 0) {
      return "Enter at least one production quantity.";
    }

    if (
      numberValue(form.rateAmount) < 0
    ) {
      return "Rate amount cannot be negative.";
    }

    if (!form.issueDate) {
      return "Please select an issue date.";
    }

    if (
      !form.expectedCompletionDate
    ) {
      return "Please select an expected completion date.";
    }

    const issueDate = new Date(
      form.issueDate,
    );

    const expectedDate = new Date(
      form.expectedCompletionDate,
    );

    if (expectedDate < issueDate) {
      return "Expected completion date cannot be before issue date.";
    }

    return "";
  };

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setFormError(validationError);
      toast.error(validationError);
      return;
    }

    const sizeQuantities = Object.entries(
      form.quantities,
    )
      .filter(
        ([, quantity]) =>
          numberValue(quantity) > 0,
      )
      .map(([size, quantity]) => ({
        size,
        issuedQuantity:
          numberValue(quantity),
      }));

    const payload = {
      tailorId: form.tailorId,
      productId: form.productId,

      workType: form.workType,

      rate: {
        type: form.rateType,
        amount: numberValue(
          form.rateAmount,
        ),
      },

      issueDate: form.issueDate,

      expectedCompletionDate:
        form.expectedCompletionDate,

      priority: form.priority,

      sizeQuantities,

      totalIssuedQuantity:
        totalQuantity,

      estimatedAmount,

      materialNotes: cleanText(
        form.materialNotes,
      ),

      productionNotes: cleanText(
        form.productionNotes,
      ),
    };

    try {
      const response =
        await createProductionJob(
          payload,
        );

      const createdJob =
        response?.job ||
        response?.data?.job ||
        response?.data ||
        response;

      const jobId =
        createdJob?._id ||
        createdJob?.id;

      toast.success(
        "Production job created successfully.",
      );

      if (jobId) {
        router.push(
          `/tailor-production-jobs/${jobId}`,
        );

        return;
      }

      router.push(
        "/tailor-production-jobs",
      );
    } catch (requestError) {
      toast.error(
        requestError?.message ||
          "Unable to create production job.",
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfafb] px-3 py-5 pb-28 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-[#800020]"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <section className="rounded-2xl border border-[#800020]/10 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#800020] text-white">
              <Factory size={23} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#800020]">
                Tailor Production
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                Create Production Job
              </h1>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Assign an approved product to a
                tailor and issue size-wise
                quantities for production.
              </p>
            </div>
          </div>
        </section>

        {(formError || error) && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Please check the form
              </p>

              <p className="mt-0.5 text-xs leading-5">
                {formError ||
                  error ||
                  "Something went wrong."}
              </p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-5"
        >
          <SectionCard
            title="Tailor and Product"
            description="Select a tailor and one of the products assigned to them."
            icon={UserRoundCog}
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <FieldLabel required>
                  Select Tailor
                </FieldLabel>

                <select
                  name="tailorId"
                  value={form.tailorId}
                  onChange={
                    handleTailorChange
                  }
                  disabled={tailorsLoading}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                >
                  <option value="">
                    {tailorsLoading
                      ? "Loading tailors..."
                      : "Choose tailor"}
                  </option>

                  {availableTailors.map(
                    (tailor) => (
                      <option
                        key={getTailorId(
                          tailor,
                        )}
                        value={getTailorId(
                          tailor,
                        )}
                      >
                        {tailor?.name ||
                          "Unnamed Tailor"}
                        {tailor?.tailorCode
                          ? ` · ${tailor.tailorCode}`
                          : ""}
                      </option>
                    ),
                  )}
                </select>

                {selectedTailor && (
                  <div className="mt-3 rounded-xl border border-[#800020]/10 bg-[#800020]/[0.025] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {selectedTailor?.name}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {selectedTailor?.tailorCode ||
                            "No tailor code"}
                        </p>
                      </div>

                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        {selectedTailor?.availability ||
                          "Available"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <FieldLabel required>
                  Assigned Product
                </FieldLabel>

                {!form.tailorId ? (
                  <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-xs text-gray-500">
                    Select a tailor to view their
                    assigned products.
                  </div>
                ) : productsLoading ? (
                  <div className="flex min-h-[120px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
                    <Loader2
                      size={17}
                      className="animate-spin text-[#800020]"
                    />
                    Loading assigned products...
                  </div>
                ) : assignedProducts.length ===
                  0 ? (
                  <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-center">
                    <Package
                      size={22}
                      className="text-amber-600"
                    />

                    <p className="mt-2 text-sm font-semibold text-amber-800">
                      No products assigned
                    </p>

                    <p className="mt-1 text-xs text-amber-700">
                      Assign products to this
                      tailor before creating a
                      production job.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/tailors/${form.tailorId}/products`,
                        )
                      }
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-white"
                    >
                      <Plus size={14} />
                      Assign Products
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        type="search"
                        value={productSearch}
                        onChange={(event) =>
                          setProductSearch(
                            event.target.value,
                          )
                        }
                        placeholder="Search product or code"
                        className="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-3 text-sm outline-none transition focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10"
                      />
                    </div>

                    <div className="mt-2 max-h-[280px] space-y-2 overflow-y-auto pr-1">
                      {filteredProducts.map(
                        (product) => {
                          const productId =
                            getProductId(
                              product,
                            );

                          const selected =
                            form.productId ===
                            productId;

                          const image =
                            getProductImage(
                              product,
                            );

                          return (
                            <button
                              key={productId}
                              type="button"
                              onClick={() =>
                                handleProductSelect(
                                  product,
                                )
                              }
                              className={[
                                "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",

                                selected
                                  ? "border-[#800020] bg-[#800020]/5 ring-1 ring-[#800020]/10"
                                  : "border-gray-200 bg-white hover:border-[#800020]/20 hover:bg-gray-50",
                              ].join(" ")}
                            >
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                                {image ? (
                                  <img
                                    src={image}
                                    alt={getProductTitle(
                                      product,
                                    )}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Shirt
                                    size={20}
                                    className="text-gray-400"
                                  />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {getProductTitle(
                                    product,
                                  )}
                                </p>

                                <p className="mt-0.5 text-xs text-gray-500">
                                  {getProductCode(
                                    product,
                                  )}
                                </p>
                              </div>

                              {selected && (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#800020] text-white">
                                  <Check
                                    size={15}
                                  />
                                </div>
                              )}
                            </button>
                          );
                        },
                      )}

                      {filteredProducts.length ===
                        0 && (
                        <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-xs text-gray-500">
                          No assigned products match
                          your search.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Production Quantities"
            description="Enter the number of pieces issued for each size."
            icon={Shirt}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {SIZES.map((size) => (
                <div key={size}>
                  <FieldLabel>
                    {size}
                  </FieldLabel>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                      form.quantities[size]
                    }
                    onChange={(event) =>
                      handleQuantityChange(
                        size,
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-xl border border-gray-200 px-3 text-center text-sm font-semibold text-gray-900 outline-none transition focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Total issued quantity
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-950">
                  {totalQuantity}
                </p>
              </div>

              <button
                type="button"
                onClick={resetQuantities}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={14} />
                Clear Quantities
              </button>
            </div>
          </SectionCard>

          <SectionCard
            title="Work and Rate"
            description="Set the production work type and labour rate."
            icon={IndianRupee}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <FieldLabel required>
                  Work Type
                </FieldLabel>

                <select
                  name="workType"
                  value={form.workType}
                  onChange={
                    handleFieldChange
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10"
                >
                  {WORK_TYPES.map(
                    (workType) => (
                      <option
                        key={workType}
                        value={workType}
                      >
                        {workType
                          .replaceAll("-", " ")
                          .replace(
                            /\b\w/g,
                            (character) =>
                              character.toUpperCase(),
                          )}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <FieldLabel>
                  Rate Type
                </FieldLabel>

                <select
                  name="rateType"
                  value={form.rateType}
                  onChange={
                    handleFieldChange
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10"
                >
                  {RATE_TYPES.map(
                    (rateType) => (
                      <option
                        key={
                          rateType.value
                        }
                        value={
                          rateType.value
                        }
                      >
                        {rateType.label}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <FieldLabel>
                  Rate Amount
                </FieldLabel>

                <div className="relative">
                  <IndianRupee
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="rateAmount"
                    value={form.rateAmount}
                    onChange={
                      handleFieldChange
                    }
                    placeholder="0"
                    className="h-11 w-full rounded-xl border border-gray-200 pl-9 pr-3 text-sm outline-none transition focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#800020]/10 bg-[#800020]/[0.025] p-4">
              <p className="text-xs font-medium text-gray-500">
                Estimated labour amount
              </p>

              <p className="mt-1 text-xl font-bold text-[#800020]">
                ₹
                {estimatedAmount.toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits: 2,
                  },
                )}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {form.rateType ===
                "per-piece"
                  ? `${totalQuantity} pieces × ₹${numberValue(
                      form.rateAmount,
                    )}`
                  : "Fixed amount for this job"}
              </p>
            </div>
          </SectionCard>

          <SectionCard
            title="Production Schedule"
            description="Set issue date, expected completion date and priority."
            icon={CalendarDays}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <FieldLabel required>
                  Issue Date
                </FieldLabel>

                <input
                  type="date"
                  name="issueDate"
                  value={form.issueDate}
                  onChange={
                    handleFieldChange
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10"
                />
              </div>

              <div>
                <FieldLabel required>
                  Expected Completion
                </FieldLabel>

                <input
                  type="date"
                  name="expectedCompletionDate"
                  value={
                    form.expectedCompletionDate
                  }
                  min={form.issueDate}
                  onChange={
                    handleFieldChange
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10"
                />
              </div>

              <div>
                <FieldLabel>
                  Priority
                </FieldLabel>

                <select
                  name="priority"
                  value={form.priority}
                  onChange={
                    handleFieldChange
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10"
                >
                  <option value="low">
                    Low
                  </option>

                  <option value="normal">
                    Normal
                  </option>

                  <option value="high">
                    High
                  </option>

                  <option value="urgent">
                    Urgent
                  </option>
                </select>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Production Notes"
            description="Add material instructions and internal production notes."
            icon={Package}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <FieldLabel>
                  Material Notes
                </FieldLabel>

                <textarea
                  name="materialNotes"
                  value={form.materialNotes}
                  onChange={
                    handleFieldChange
                  }
                  rows={5}
                  placeholder="Fabric, accessories, lining, buttons or material issued..."
                  className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none transition focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10"
                />
              </div>

              <div>
                <FieldLabel>
                  Production Instructions
                </FieldLabel>

                <textarea
                  name="productionNotes"
                  value={
                    form.productionNotes
                  }
                  onChange={
                    handleFieldChange
                  }
                  rows={5}
                  placeholder="Special stitching, finishing, measurement or quality instructions..."
                  className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none transition focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10"
                />
              </div>
            </div>
          </SectionCard>

          <div className="sticky bottom-3 z-20 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-[0_15px_45px_rgba(0,0,0,0.12)] backdrop-blur sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedProduct
                    ? getProductTitle(
                        selectedProduct,
                      )
                    : "No product selected"}
                </p>

                <p className="mt-0.5 text-xs text-gray-500">
                  {totalQuantity} pieces ·
                  Estimated ₹
                  {estimatedAmount.toLocaleString(
                    "en-IN",
                    {
                      maximumFractionDigits: 2,
                    },
                  )}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/tailor-production-jobs",
                    )
                  }
                  disabled={creating}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 sm:flex-none"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#800020] px-5 text-sm font-semibold text-white transition hover:bg-[#68001a] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
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
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}