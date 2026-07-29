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

const SIZE_ORDER = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "FREE",
];

const ACTIVE_STATUSES = [
  "draft",
  "issued",
  "in_progress",
  "partially_received",
  "completed",
  "cancelled",
];

/* =========================================================
   HELPERS
========================================================= */

const numberValue = (value) => {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
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
    maximumFractionDigits: 2,
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

const normalizeStatus = (status) =>
  String(status ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

const getStatusLabel = (status) => {
  const normalizedStatus =
    normalizeStatus(status);

  if (!normalizedStatus) {
    return "Unknown";
  }

  return normalizedStatus
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
};

const getStatusClasses = (status) => {
  const normalizedStatus =
    normalizeStatus(status);

  const styles = {
    draft:
      "border-gray-200 bg-gray-50 text-gray-600",

    issued:
      "border-blue-200 bg-blue-50 text-blue-700",

    in_progress:
      "border-amber-200 bg-amber-50 text-amber-700",

    partially_received:
      "border-violet-200 bg-violet-50 text-violet-700",

    completed:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    cancelled:
      "border-red-200 bg-red-50 text-red-700",

    overdue:
      "border-red-200 bg-red-50 text-red-700",
  };

  return (
    styles[normalizedStatus] ||
    "border-gray-200 bg-gray-50 text-gray-600"
  );
};

const getPriorityClasses = (priority) => {
  const normalizedPriority = String(
    priority ?? "",
  )
    .trim()
    .toLowerCase();

  const styles = {
    low:
      "border-gray-200 bg-gray-50 text-gray-600",

    normal:
      "border-blue-200 bg-blue-50 text-blue-700",

    high:
      "border-orange-200 bg-orange-50 text-orange-700",

    urgent:
      "border-red-200 bg-red-50 text-red-700",
  };

  return (
    styles[normalizedPriority] ||
    styles.normal
  );
};

const getJobFromResponse = (response) =>
  response?.job ||
  response?.data?.job ||
  response?.data ||
  response ||
  null;

/* =========================================================
   REUSABLE COMPONENTS
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
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">
            {label}
          </p>

          <p className="mt-2 truncate text-2xl font-bold text-gray-950">
            {value}
          </p>

          <p className="mt-1 text-xs leading-5 text-gray-500">
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
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
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
              <p className="mt-0.5 text-xs leading-5 text-gray-500">
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
    <div className="flex min-h-[500px] items-center justify-center">
      <div className="flex flex-col items-center text-center">
        <Loader2
          size={28}
          className="animate-spin text-[#800020]"
        />

        <p className="mt-3 text-sm font-semibold text-gray-700">
          Loading production job...
        </p>

        <p className="mt-1 text-xs text-gray-400">
          Fetching tailor and production details.
        </p>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  onBack,
}) {
  return (
    <div className="flex min-h-[500px] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertCircle size={22} />
        </div>

        <h2 className="mt-4 text-base font-semibold text-red-900">
          Unable to load production job
        </h2>

        <p className="mt-2 text-sm leading-6 text-red-700">
          {cleanText(
            message,
            "Production job could not be found.",
          )}
        </p>

        <div className="mt-5 flex justify-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700"
          >
            Go Back
          </button>

          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white"
          >
            <RefreshCcw size={15} />
            Retry
          </button>
        </div>
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
    loading,
    error,
    fetchProductionJobById,
    updateProductionJobStatus,
    clearProductionJob,
    clearError,
  } = useTailorProductionJobStore();

  const [
    localJob,
    setLocalJob,
  ] = useState(null);

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState("");

  const [
    statusUpdating,
    setStatusUpdating,
  ] = useState(false);

  /* =======================================================
     LOAD JOB
  ======================================================= */

  const loadJob = useCallback(
    async ({
      silent = false,
    } = {}) => {
      if (!jobId) return;

      if (!silent) {
        clearError?.();
      }

      try {
        const response =
          await fetchProductionJobById(
            jobId,
          );

        const fetchedJob =
          getJobFromResponse(response);

        if (fetchedJob) {
          setLocalJob(fetchedJob);

          setSelectedStatus(
            normalizeStatus(
              fetchedJob?.status,
            ),
          );
        }
      } catch (requestError) {
        if (!silent) {
          toast.error(
            requestError?.message ||
              "Unable to load production job.",
          );
        }
      }
    },
    [
      jobId,
      fetchProductionJobById,
      clearError,
    ],
  );

  useEffect(() => {
    loadJob();

    return () => {
      clearProductionJob?.();
    };
  }, [
    loadJob,
    clearProductionJob,
  ]);

  useEffect(() => {
    if (currentJob) {
      setLocalJob(currentJob);

      setSelectedStatus(
        normalizeStatus(
          currentJob?.status,
        ),
      );
    }
  }, [currentJob]);

  const job =
    localJob || currentJob;

  /* =======================================================
     DERIVED DETAILS
  ======================================================= */

  const tailor = useMemo(() => {
    return (
      job?.tailorSnapshot ||
      job?.tailor ||
      job?.tailorId ||
      {}
    );
  }, [job]);

  const product = useMemo(() => {
    return (
      job?.productSnapshot ||
      job?.product ||
      job?.productId ||
      {}
    );
  }, [job]);

  const sizeRows = useMemo(() => {
    const source =
      job?.sizeQuantities ||
      job?.quantities ||
      job?.sizeWiseQuantities ||
      [];

    if (Array.isArray(source)) {
      return source
        .map((row) => {
          const issuedQuantity =
            numberValue(
              row?.issuedQuantity ??
                row?.quantity ??
                row?.issued,
            );

          const receivedQuantity =
            numberValue(
              row?.receivedQuantity ??
                row?.received,
            );

          const rejectedQuantity =
            numberValue(
              row?.rejectedQuantity ??
                row?.rejected,
            );

          const pendingQuantity =
            Math.max(
              0,
              numberValue(
                row?.pendingQuantity,
              ) ||
                issuedQuantity -
                  receivedQuantity -
                  rejectedQuantity,
            );

          return {
            size: cleanText(
              row?.size,
              "NA",
            ),

            issuedQuantity,
            receivedQuantity,
            rejectedQuantity,
            pendingQuantity,
          };
        })
        .sort((firstRow, secondRow) => {
          const firstIndex =
            SIZE_ORDER.indexOf(
              firstRow.size,
            );

          const secondIndex =
            SIZE_ORDER.indexOf(
              secondRow.size,
            );

          if (
            firstIndex === -1 &&
            secondIndex === -1
          ) {
            return firstRow.size.localeCompare(
              secondRow.size,
            );
          }

          if (firstIndex === -1) {
            return 1;
          }

          if (secondIndex === -1) {
            return -1;
          }

          return firstIndex - secondIndex;
        });
    }

    if (
      source &&
      typeof source === "object"
    ) {
      return Object.entries(source).map(
        ([size, quantity]) => ({
          size,
          issuedQuantity:
            numberValue(quantity),
          receivedQuantity: 0,
          rejectedQuantity: 0,
          pendingQuantity:
            numberValue(quantity),
        }),
      );
    }

    return [];
  }, [job]);

  const totals = useMemo(() => {
    const calculated = sizeRows.reduce(
      (result, row) => {
        result.issued +=
          numberValue(
            row.issuedQuantity,
          );

        result.received +=
          numberValue(
            row.receivedQuantity,
          );

        result.rejected +=
          numberValue(
            row.rejectedQuantity,
          );

        result.pending +=
          numberValue(
            row.pendingQuantity,
          );

        return result;
      },
      {
        issued: 0,
        received: 0,
        rejected: 0,
        pending: 0,
      },
    );

    return {
      issued:
        calculated.issued ||
        numberValue(
          job?.totalIssuedQuantity ??
            job?.issuedQuantity ??
            job?.totalQuantity,
        ),

      received:
        calculated.received ||
        numberValue(
          job?.totalReceivedQuantity ??
            job?.receivedQuantity,
        ),

      rejected:
        calculated.rejected ||
        numberValue(
          job?.totalRejectedQuantity ??
            job?.rejectedQuantity,
        ),

      pending:
        calculated.pending ||
        Math.max(
          0,
          numberValue(
            job?.totalPendingQuantity ??
              job?.pendingQuantity,
          ) ||
            numberValue(
              job?.totalIssuedQuantity ??
                job?.issuedQuantity ??
                job?.totalQuantity,
            ) -
              numberValue(
                job?.totalReceivedQuantity ??
                  job?.receivedQuantity,
              ) -
              numberValue(
                job?.totalRejectedQuantity ??
                  job?.rejectedQuantity,
              ),
        ),
    };
  }, [job, sizeRows]);

  const rateType =
    job?.rate?.type ||
    job?.rateType ||
    "per-piece";

  const rateAmount =
    numberValue(
      job?.rate?.amount ??
        job?.rateAmount ??
        job?.stitchingRate,
    );

  const estimatedAmount =
    numberValue(
      job?.estimatedAmount ??
        job?.totalAmount ??
        (rateType === "fixed"
          ? rateAmount
          : rateAmount *
            totals.issued),
    );

  const paidAmount =
    numberValue(
      job?.paidAmount ??
        job?.paymentSummary?.paidAmount,
    );

  const pendingPayment =
    Math.max(
      0,
      numberValue(
        job?.pendingAmount ??
          job?.paymentSummary
            ?.pendingAmount,
      ) ||
        estimatedAmount -
          paidAmount,
    );

  const progressPercentage =
    totals.issued > 0
      ? Math.min(
          100,
          Math.round(
            (totals.received /
              totals.issued) *
              100,
          ),
        )
      : 0;

  const normalizedStatus =
    normalizeStatus(job?.status);

  const isLocked =
    normalizedStatus === "completed" ||
    normalizedStatus === "cancelled";

  /* =======================================================
     STATUS UPDATE
  ======================================================= */

  const handleStatusUpdate =
    async () => {
      if (
        !jobId ||
        !selectedStatus ||
        selectedStatus ===
          normalizedStatus
      ) {
        return;
      }

      setStatusUpdating(true);

      try {
        const response =
          await updateProductionJobStatus(
            jobId,
            selectedStatus,
          );

        const updatedJob =
          getJobFromResponse(response);

        setLocalJob(
          updatedJob || {
            ...job,
            status: selectedStatus,
          },
        );

        toast.success(
          `Job marked as ${getStatusLabel(
            selectedStatus,
          )}.`,
        );
      } catch (requestError) {
        toast.error(
          requestError?.message ||
            "Unable to update job status.",
        );
      } finally {
        setStatusUpdating(false);
      }
    };

  /* =======================================================
     LOADING / ERROR
  ======================================================= */

  if (loading && !job) {
    return (
      <main className="min-h-screen bg-[#fcfafb]">
        <LoadingState />
      </main>
    );
  }

  if (!job) {
    return (
      <main className="min-h-screen bg-[#fcfafb]">
        <ErrorState
          message={error}
          onRetry={() => loadJob()}
          onBack={() =>
            router.push(
              "/tailor-production-jobs",
            )
          }
        />
      </main>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#fcfafb] px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* BACK BUTTON */}

        <button
          type="button"
          onClick={() =>
            router.push(
              "/tailor-production-jobs",
            )
          }
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-[#800020]"
        >
          <ArrowLeft size={17} />
          All Production Jobs
        </button>

        {/* HEADER */}

        <section className="rounded-2xl border border-[#800020]/10 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#800020] text-white">
                <Factory size={23} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#800020]">
                    Tailor Production Job
                  </p>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                      job?.status,
                    )}`}
                  >
                    {getStatusLabel(
                      job?.status,
                    )}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${getPriorityClasses(
                      job?.priority,
                    )}`}
                  >
                    {cleanText(
                      job?.priority,
                      "Normal",
                    )}
                  </span>
                </div>

                <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                  {cleanText(
                    job?.jobNumber ||
                      job?.productionJobNumber,
                    `JOB-${String(
                      jobId,
                    ).slice(-6)}`,
                  )}
                </h1>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Created{" "}
                  {formatDateTime(
                    job?.createdAt,
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  loadJob({
                    silent: true,
                  })
                }
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:border-[#800020]/20 hover:bg-[#800020]/5 hover:text-[#800020] disabled:opacity-60"
              >
                {loading ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <RefreshCcw
                    size={16}
                  />
                )}

                Refresh
              </button>
            </div>
          </div>

          {/* STATUS ACTION */}

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
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800 outline-none transition focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                {ACTIVE_STATUSES.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {getStatusLabel(
                        status,
                      )}
                    </option>
                  ),
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={
                handleStatusUpdate
              }
              disabled={
                statusUpdating ||
                isLocked ||
                selectedStatus ===
                  normalizedStatus
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#800020] px-4 text-sm font-semibold text-white transition hover:bg-[#68001a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {statusUpdating ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <CheckCircle2
                  size={16}
                />
              )}

              {statusUpdating
                ? "Updating..."
                : "Update Status"}
            </button>
          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-0.5 text-xs leading-5">
                {cleanText(error)}
              </p>
            </div>
          </div>
        )}

        {/* SUMMARY CARDS */}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="Issued"
            value={totals.issued}
            description="Total pieces issued"
            icon={Package}
          />

          <SummaryCard
            label="Received"
            value={totals.received}
            description={`${progressPercentage}% production received`}
            icon={CheckCircle2}
          />

          <SummaryCard
            label="Pending"
            value={totals.pending}
            description="Pieces yet to receive"
            icon={Clock3}
          />

          <SummaryCard
            label="Job Amount"
            value={formatCurrency(
              estimatedAmount,
            )}
            description="Estimated labour payable"
            icon={IndianRupee}
          />
        </section>

        {/* PROGRESS */}

        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-950">
                Production Progress
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                {totals.received} of{" "}
                {totals.issued} pieces
                received
              </p>
            </div>

            <span className="text-lg font-bold text-[#800020]">
              {progressPercentage}%
            </span>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-[#800020] transition-all duration-500"
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
          <div className="space-y-5">
            {/* SIZE-WISE PRODUCTION */}

            <SectionCard
              title="Size-wise Production"
              description="Issued, received, rejected and pending quantities."
              icon={Shirt}
            >
              {sizeRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <Shirt
                    size={24}
                    className="mx-auto text-gray-400"
                  />

                  <p className="mt-2 text-sm font-semibold text-gray-700">
                    No size quantities found
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-hidden rounded-xl border border-gray-200 sm:block">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                          <th className="px-4 py-3">
                            Size
                          </th>

                          <th className="px-4 py-3 text-center">
                            Issued
                          </th>

                          <th className="px-4 py-3 text-center">
                            Received
                          </th>

                          <th className="px-4 py-3 text-center">
                            Rejected
                          </th>

                          <th className="px-4 py-3 text-center">
                            Pending
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {sizeRows.map(
                          (row) => (
                            <tr
                              key={row.size}
                            >
                              <td className="px-4 py-3">
                                <span className="inline-flex min-w-10 items-center justify-center rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-gray-800">
                                  {row.size}
                                </span>
                              </td>

                              <td className="px-4 py-3 text-center text-sm font-semibold text-gray-800">
                                {
                                  row.issuedQuantity
                                }
                              </td>

                              <td className="px-4 py-3 text-center text-sm font-semibold text-emerald-700">
                                {
                                  row.receivedQuantity
                                }
                              </td>

                              <td className="px-4 py-3 text-center text-sm font-semibold text-red-600">
                                {
                                  row.rejectedQuantity
                                }
                              </td>

                              <td className="px-4 py-3 text-center text-sm font-semibold text-amber-700">
                                {
                                  row.pendingQuantity
                                }
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>

                      <tfoot className="border-t border-gray-200 bg-gray-50">
                        <tr className="text-sm font-bold text-gray-900">
                          <td className="px-4 py-3">
                            Total
                          </td>

                          <td className="px-4 py-3 text-center">
                            {totals.issued}
                          </td>

                          <td className="px-4 py-3 text-center text-emerald-700">
                            {totals.received}
                          </td>

                          <td className="px-4 py-3 text-center text-red-600">
                            {totals.rejected}
                          </td>

                          <td className="px-4 py-3 text-center text-amber-700">
                            {totals.pending}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="space-y-2 sm:hidden">
                    {sizeRows.map(
                      (row) => (
                        <div
                          key={row.size}
                          className="rounded-xl border border-gray-200 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-800">
                              {row.size}
                            </span>

                            <span className="text-xs font-semibold text-amber-700">
                              {
                                row.pendingQuantity
                              }{" "}
                              pending
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-lg bg-gray-50 p-2">
                              <p className="text-[10px] uppercase text-gray-400">
                                Issued
                              </p>

                              <p className="mt-1 text-sm font-bold text-gray-800">
                                {
                                  row.issuedQuantity
                                }
                              </p>
                            </div>

                            <div className="rounded-lg bg-emerald-50 p-2">
                              <p className="text-[10px] uppercase text-emerald-500">
                                Received
                              </p>

                              <p className="mt-1 text-sm font-bold text-emerald-700">
                                {
                                  row.receivedQuantity
                                }
                              </p>
                            </div>

                            <div className="rounded-lg bg-red-50 p-2">
                              <p className="text-[10px] uppercase text-red-400">
                                Rejected
                              </p>

                              <p className="mt-1 text-sm font-bold text-red-600">
                                {
                                  row.rejectedQuantity
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </>
              )}
            </SectionCard>

            {/* PRODUCTION DETAILS */}

            <SectionCard
              title="Production Details"
              description="Work, rate, schedule and job configuration."
              icon={Factory}
            >
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  label="Work Type"
                  value={getStatusLabel(
                    job?.workType,
                  )}
                />

                <DetailItem
                  label="Rate Type"
                  value={getStatusLabel(
                    rateType,
                  )}
                />

                <DetailItem
                  label="Rate Amount"
                  value={formatCurrency(
                    rateAmount,
                  )}
                />

                <DetailItem
                  label="Issue Date"
                  value={formatDate(
                    job?.issueDate,
                  )}
                />

                <DetailItem
                  label="Expected Completion"
                  value={formatDate(
                    job?.expectedCompletionDate ||
                      job?.expectedDate ||
                      job?.dueDate,
                  )}
                />

                <DetailItem
                  label="Last Updated"
                  value={formatDateTime(
                    job?.updatedAt,
                  )}
                />
              </div>
            </SectionCard>

            {/* NOTES */}

            <SectionCard
              title="Production Notes"
              description="Material and production instructions."
              icon={Package}
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                    Material Notes
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {cleanText(
                      job?.materialNotes,
                      "No material notes added.",
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
                    Production Instructions
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {cleanText(
                      job?.productionNotes ||
                        job?.notes,
                      "No production instructions added.",
                    )}
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* SIDEBAR */}

          <aside className="space-y-5">
            {/* TAILOR */}

            <SectionCard
              title="Assigned Tailor"
              icon={UserRoundCog}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#800020]/8 text-[#800020]">
                  <UserRoundCog
                    size={22}
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-950">
                    {cleanText(
                      tailor?.name ||
                        job?.tailorName,
                      "Unassigned Tailor",
                    )}
                  </p>

                  <p className="mt-0.5 text-xs text-gray-500">
                    {cleanText(
                      tailor?.tailorCode,
                      "No tailor code",
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone
                    size={15}
                    className="shrink-0 text-gray-400"
                  />

                  {cleanText(
                    tailor?.phone,
                    "No phone number",
                  )}
                </div>

                {(tailor?._id ||
                  tailor?.id) && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/tailors/${
                          tailor?._id ||
                          tailor?.id
                        }`,
                      )
                    }
                    className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 transition hover:border-[#800020]/20 hover:bg-[#800020]/5 hover:text-[#800020]"
                  >
                    View Tailor Profile
                  </button>
                )}
              </div>
            </SectionCard>

            {/* PRODUCT */}

            <SectionCard
              title="Assigned Product"
              icon={Shirt}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                  {product?.thumbnail ||
                  product?.image ? (
                    <img
                      src={
                        product?.thumbnail ||
                        product?.image
                      }
                      alt={cleanText(
                        product?.title,
                        "Product",
                      )}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Shirt
                      size={24}
                      className="text-gray-400"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-bold leading-5 text-gray-950">
                    {cleanText(
                      product?.title ||
                        product?.name ||
                        job?.productTitle,
                      "Untitled Product",
                    )}
                  </p>

                  <p className="mt-1 text-xs font-medium text-gray-500">
                    {cleanText(
                      product?.productCode ||
                        product?.code ||
                        job?.productCode,
                      "No product code",
                    )}
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* PAYMENT */}

            <SectionCard
              title="Payment Summary"
              icon={IndianRupee}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-500">
                    Job Amount
                  </span>

                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(
                      estimatedAmount,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-500">
                    Paid Amount
                  </span>

                  <span className="text-sm font-semibold text-emerald-700">
                    {formatCurrency(
                      paidAmount,
                    )}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-700">
                      Pending Payment
                    </span>

                    <span className="text-base font-bold text-[#800020]">
                      {formatCurrency(
                        pendingPayment,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* DATES */}

            <SectionCard
              title="Schedule"
              icon={CalendarDays}
            >
              <div className="space-y-4">
                <DetailItem
                  label="Issue Date"
                  value={formatDate(
                    job?.issueDate,
                  )}
                />

                <DetailItem
                  label="Expected Completion"
                  value={formatDate(
                    job?.expectedCompletionDate ||
                      job?.expectedDate ||
                      job?.dueDate,
                  )}
                />

                <DetailItem
                  label="Completed At"
                  value={formatDateTime(
                    job?.completedAt,
                  )}
                />
              </div>
            </SectionCard>
          </aside>
        </div>
      </div>
    </main>
  );
}