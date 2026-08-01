"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Factory,
  IndianRupee,
  Loader2,
  Package,
  Phone,
  RefreshCcw,
  Shirt,
  UserRoundCog,
} from "lucide-react";
import { toast } from "react-hot-toast";

import useTailorProductionJobStore from "@/store/useTailorProductionJobStore";

/* =========================================================
   CONSTANTS
========================================================= */

const JOB_STATUSES = [
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
];

const SIZE_ORDER = [
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
   HELPERS
========================================================= */

const numberValue = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

const cleanText = (
  value,
  fallback = "—",
) => {
  const text = String(value ?? "").trim();

  return text || fallback;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numberValue(value));

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatLabel = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );

const getStatusClasses = (status) => {
  const styles = {
    assigned:
      "border-blue-200 bg-blue-50 text-blue-700",

    in_progress:
      "border-amber-200 bg-amber-50 text-amber-700",

    completed:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    cancelled:
      "border-red-200 bg-red-50 text-red-700",
  };

  return (
    styles[status] ||
    "border-gray-200 bg-gray-50 text-gray-600"
  );
};

const getProductImage = (product) =>
  product?.productThumbnail ||
  product?.product?.thumbnail ||
  product?.product?.images?.[0]?.url ||
  product?.product?.images?.[0] ||
  "";

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {label}
          </p>

          <p className="mt-2 truncate text-2xl font-bold text-gray-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#800020]/8 text-[#800020]">
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  action,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#800020]/8 text-[#800020]">
            <Icon size={17} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-950 sm:text-base">
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

function DetailItem({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-gray-800">
        {cleanText(value)}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fcfafb]">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <Loader2
          size={30}
          className="animate-spin text-[#800020]"
        />

        <p className="text-sm font-medium">
          Loading production job...
        </p>
      </div>
    </main>
  );
}

function ErrorState({
  message,
  onRetry,
  onBack,
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fcfafb] px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertCircle size={22} />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-red-900">
          Production job not found
        </h2>

        <p className="mt-2 text-sm text-red-700">
          {cleanText(
            message,
            "Unable to load production job.",
          )}
        </p>

        <div className="mt-5 flex justify-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="h-10 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700"
          >
            Go Back
          </button>

          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"
          >
            <RefreshCcw size={15} />
            Retry
          </button>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({ product }) {
  const sizes = useMemo(() => {
    const rows = Array.isArray(product?.sizes)
      ? product.sizes
      : [];

    return [...rows].sort(
      (first, second) => {
        const firstIndex =
          SIZE_ORDER.indexOf(first.size);

        const secondIndex =
          SIZE_ORDER.indexOf(second.size);

        if (
          firstIndex === -1 &&
          secondIndex === -1
        ) {
          return String(
            first.size,
          ).localeCompare(
            String(second.size),
          );
        }

        if (firstIndex === -1) return 1;
        if (secondIndex === -1) return -1;

        return firstIndex - secondIndex;
      },
    );
  }, [product?.sizes]);

  const image = getProductImage(product);

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50/40 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white">
          {image ? (
            <img
              src={image}
              alt={
                product.productTitle ||
                "Product"
              }
              className="h-full w-full object-cover"
            />
          ) : (
            <Shirt
              size={24}
              className="text-gray-400"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-950">
                {cleanText(
                  product.productTitle,
                  "Untitled Product",
                )}
              </p>

              <p className="mt-1 text-xs font-semibold text-[#800020]">
                {cleanText(
                  product.productCode,
                  "No product code",
                )}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-bold text-gray-950">
                {numberValue(
                  product.quantity,
                )}{" "}
                pieces
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {formatCurrency(
                  product.amount,
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">
            Work Rate
          </p>

          <p className="mt-1 text-base font-bold text-gray-900">
            {formatCurrency(
              product.workRate,
            )}{" "}
            <span className="text-xs font-medium text-gray-400">
              / piece
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">
            Product Amount
          </p>

          <p className="mt-1 text-base font-bold text-[#800020]">
            {formatCurrency(
              product.amount,
            )}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Size Quantities
        </p>

        {sizes.length ? (
          <div className="flex flex-wrap gap-2">
            {sizes.map((row) => (
              <div
                key={row.size}
                className="inline-flex items-center overflow-hidden rounded-lg border border-gray-200 bg-white"
              >
                <span className="bg-gray-100 px-2.5 py-1.5 text-xs font-bold text-gray-700">
                  {row.size}
                </span>

                <span className="px-2.5 py-1.5 text-xs font-semibold text-gray-900">
                  {numberValue(
                    row.quantity,
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            No size quantities.
          </p>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function TailorProductionJobDetailPage() {
  const router = useRouter();
  const params = useParams();

  const jobId = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  const {
    currentJob,
    detailLoading,
    statusUpdating,
    error,

    fetchProductionJobById,
    updateProductionJobStatus,
    clearProductionJob,
    clearError,
  } = useTailorProductionJobStore();

  const [selectedStatus, setSelectedStatus] =
    useState("");

  /* Load job */
  const loadJob = useCallback(async () => {
    if (!jobId) return;

    clearError();

    try {
      const job =
        await fetchProductionJobById(
          jobId,
        );

      setSelectedStatus(
        job?.status || "",
      );
    } catch (requestError) {
      console.error(
        "Failed to load production job:",
        requestError,
      );
    }
  }, [
    jobId,
    fetchProductionJobById,
    clearError,
  ]);

  useEffect(() => {
    loadJob();

    return () => {
      clearProductionJob();
    };
  }, [
    loadJob,
    clearProductionJob,
  ]);

  useEffect(() => {
    if (currentJob?.status) {
      setSelectedStatus(
        currentJob.status,
      );
    }
  }, [currentJob?.status]);

  const job = currentJob;

  const products = useMemo(
    () =>
      Array.isArray(job?.products)
        ? job.products
        : [],
    [job?.products],
  );

  const tailor =
    job?.tailorSnapshot ||
    job?.tailor ||
    {};

  const totalSizes = useMemo(
    () =>
      products.reduce(
        (total, product) =>
          total +
          (Array.isArray(product.sizes)
            ? product.sizes.length
            : 0),
        0,
      ),
    [products],
  );

  const isLocked = [
    "completed",
    "cancelled",
  ].includes(job?.status);

  const handleStatusUpdate = async () => {
    if (
      !jobId ||
      !selectedStatus ||
      selectedStatus === job?.status ||
      statusUpdating
    ) {
      return;
    }

    try {
      await updateProductionJobStatus(
        jobId,
        selectedStatus,
      );

      toast.success(
        `Job marked as ${formatLabel(
          selectedStatus,
        )}.`,
      );
    } catch (requestError) {
      toast.error(
        requestError?.message ||
          "Unable to update status.",
      );
    }
  };

  if (detailLoading && !job) {
    return <LoadingState />;
  }

  if (!detailLoading && !job) {
    return (
      <ErrorState
        message={error}
        onRetry={loadJob}
        onBack={() =>
          router.push(
            "/tailor-production-jobs",
          )
        }
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#fcfafb] px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        {/* Back */}

        <button
          type="button"
          onClick={() =>
            router.push(
              "/tailor-production-jobs",
            )
          }
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#800020]"
        >
          <ArrowLeft size={17} />
          All Production Jobs
        </button>

        {/* Header */}

        <section className="rounded-2xl border border-[#800020]/10 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#800020] text-white">
                <Factory size={23} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#800020]">
                    Production Job
                  </p>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                      job.status,
                    )}`}
                  >
                    {formatLabel(
                      job.status,
                    )}
                  </span>
                </div>

                <h1 className="mt-2 text-2xl font-bold text-gray-950 sm:text-3xl">
                  {cleanText(
                    job.jobNumber,
                    `JOB-${String(
                      jobId,
                    ).slice(-6)}`,
                  )}
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Created{" "}
                  {formatDateTime(
                    job.createdAt,
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadJob}
              disabled={detailLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:text-[#800020] disabled:opacity-60"
            >
              <RefreshCcw
                size={16}
                className={
                  detailLoading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>

          {/* Status */}

          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-xs">
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Update Job Status
              </label>

              <select
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(
                    event.target.value,
                  )
                }
                disabled={
                  statusUpdating ||
                  isLocked
                }
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800 outline-none focus:border-[#800020] disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                {JOB_STATUSES.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {formatLabel(status)}
                    </option>
                  ),
                )}
              </select>

              {isLocked && (
                <p className="mt-1 text-xs text-gray-400">
                  Completed or cancelled jobs cannot be reopened.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleStatusUpdate}
              disabled={
                statusUpdating ||
                isLocked ||
                selectedStatus ===
                  job.status
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#800020] px-4 text-sm font-semibold text-white hover:bg-[#68001a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {statusUpdating ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <CheckCircle2 size={16} />
              )}

              {statusUpdating
                ? "Updating..."
                : "Update Status"}
            </button>
          </div>
        </section>

        {/* Error */}

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <p>{error}</p>
          </div>
        )}

        {/* Summary */}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <SummaryCard
            label="Products"
            value={products.length}
            description="Product codes allocated"
            icon={Shirt}
          />

          <SummaryCard
            label="Total Quantity"
            value={numberValue(
              job.totalQuantity,
            )}
            description="Total production pieces"
            icon={Package}
          />

          <SummaryCard
            label="Total Amount"
            value={formatCurrency(
              job.totalAmount,
            )}
            description="Calculated work value"
            icon={IndianRupee}
          />

          <SummaryCard
            label="Size Entries"
            value={totalSizes}
            description="Size allocations"
            icon={BriefcaseBusiness}
          />

          <SummaryCard
            label="Work Type"
            value={formatLabel(
              job.workType,
            )}
            description="Production operation"
            icon={Factory}
          />
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-5">
            {/* Products */}

            <SectionCard
              title="Allocated Products"
              description="Product codes, sizes, rates and quantities."
              icon={Shirt}
            >
              {products.length ? (
                <div className="grid gap-4">
                  {products.map(
                    (product) => (
                      <ProductCard
                        key={
                          product._id ||
                          product.productCode
                        }
                        product={product}
                      />
                    ),
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <Shirt
                    size={28}
                    className="mx-auto text-gray-400"
                  />

                  <p className="mt-3 text-sm font-semibold text-gray-700">
                    No products found
                  </p>
                </div>
              )}
            </SectionCard>

            {/* Job Details */}

            <SectionCard
              title="Job Details"
              description="Production configuration and schedule."
              icon={Factory}
            >
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  label="Job Number"
                  value={job.jobNumber}
                />

                <DetailItem
                  label="Work Type"
                  value={formatLabel(
                    job.workType,
                  )}
                />

                <DetailItem
                  label="Status"
                  value={formatLabel(
                    job.status,
                  )}
                />

                <DetailItem
                  label="Assigned At"
                  value={formatDateTime(
                    job.assignedAt,
                  )}
                />

                <DetailItem
                  label="Expected Date"
                  value={formatDate(
                    job.expectedAt,
                  )}
                />

                <DetailItem
                  label="Started At"
                  value={formatDateTime(
                    job.startedAt,
                  )}
                />

                <DetailItem
                  label="Completed At"
                  value={formatDateTime(
                    job.completedAt,
                  )}
                />

                <DetailItem
                  label="Cancelled At"
                  value={formatDateTime(
                    job.cancelledAt,
                  )}
                />

                <DetailItem
                  label="Last Updated"
                  value={formatDateTime(
                    job.updatedAt,
                  )}
                />
              </div>
            </SectionCard>

            {/* Notes */}

            <SectionCard
              title="Production Notes"
              description="Instructions added to this job."
              icon={Package}
            >
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {cleanText(
                  job.notes,
                  "No production notes added.",
                )}
              </p>
            </SectionCard>
          </div>

          {/* Sidebar */}

          <aside className="grid content-start gap-5">
            {/* Tailor */}

            <SectionCard
              title="Assigned Tailor"
              icon={UserRoundCog}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#800020]/8 text-[#800020]">
                  <UserRoundCog size={22} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-950">
                    {cleanText(
                      tailor.name,
                      "Unknown Tailor",
                    )}
                  </p>

                  <p className="mt-0.5 text-xs text-gray-500">
                    {cleanText(
                      tailor.tailorCode,
                      "No tailor code",
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone
                    size={15}
                    className="text-gray-400"
                  />

                  {cleanText(
                    tailor.mobile,
                    "No mobile number",
                  )}
                </div>

                {job.tailor?._id && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/tailors/${job.tailor._id}`,
                      )
                    }
                    className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:text-[#800020]"
                  >
                    View Tailor Profile
                  </button>
                )}
              </div>
            </SectionCard>

            {/* Amount */}

            <SectionCard
              title="Amount Summary"
              icon={IndianRupee}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-500">
                    Products
                  </span>

                  <span className="text-sm font-semibold text-gray-900">
                    {products.length}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-500">
                    Total Quantity
                  </span>

                  <span className="text-sm font-semibold text-gray-900">
                    {numberValue(
                      job.totalQuantity,
                    )}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-700">
                      Total Amount
                    </span>

                    <span className="text-lg font-bold text-[#800020]">
                      {formatCurrency(
                        job.totalAmount,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Schedule */}

            <SectionCard
              title="Schedule"
              icon={CalendarDays}
            >
              <div className="space-y-4">
                <DetailItem
                  label="Assigned"
                  value={formatDateTime(
                    job.assignedAt,
                  )}
                />

                <DetailItem
                  label="Expected"
                  value={formatDate(
                    job.expectedAt,
                  )}
                />

                <DetailItem
                  label="Completed"
                  value={formatDateTime(
                    job.completedAt,
                  )}
                />
              </div>
            </SectionCard>

            {/* Current State */}

            <SectionCard
              title="Current State"
              icon={Clock3}
            >
              <div
                className={`rounded-xl border p-4 ${getStatusClasses(
                  job.status,
                )}`}
              >
                <p className="text-sm font-bold">
                  {formatLabel(
                    job.status,
                  )}
                </p>

                <p className="mt-1 text-xs opacity-80">
                  {job.status ===
                    "assigned" &&
                    "Job has been allocated to the tailor."}

                  {job.status ===
                    "in_progress" &&
                    "Tailor is currently working on this job."}

                  {job.status ===
                    "completed" &&
                    "Production job has been completed."}

                  {job.status ===
                    "cancelled" &&
                    "Production job has been cancelled."}
                </p>
              </div>
            </SectionCard>
          </aside>
        </div>
      </div>
    </main>
  );
}