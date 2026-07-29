"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Factory,
  IndianRupee,
  Loader2,
  Plus,
  RefreshCcw,
  Scissors,
  Shirt,
  UserRoundCog,
} from "lucide-react";

import useTailorProductionJobStore from "@/store/useTailorProductionJobStore";

const numberValue = (value) => {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : 0;
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

const cleanText = (value, fallback = "—") => {
  const text = String(value ?? "").trim();

  return text || fallback;
};

const getStatusClasses = (status) => {
  const normalizedStatus = String(status ?? "")
    .trim()
    .toLowerCase();

  const styles = {
    draft:
      "border-gray-200 bg-gray-50 text-gray-600",

    issued:
      "border-blue-200 bg-blue-50 text-blue-700",

    active:
      "border-amber-200 bg-amber-50 text-amber-700",

    "in-progress":
      "border-amber-200 bg-amber-50 text-amber-700",

    in_progress:
      "border-amber-200 bg-amber-50 text-amber-700",

    partially_received:
      "border-violet-200 bg-violet-50 text-violet-700",

    completed:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    overdue:
      "border-red-200 bg-red-50 text-red-700",

    cancelled:
      "border-gray-200 bg-gray-100 text-gray-500",
  };

  return (
    styles[normalizedStatus] ||
    "border-gray-200 bg-gray-50 text-gray-600"
  );
};

const getStatusLabel = (status) => {
  const value = String(status ?? "")
    .trim()
    .replaceAll("_", " ")
    .replaceAll("-", " ");

  if (!value) return "Unknown";

  return value.replace(/\b\w/g, (character) =>
    character.toUpperCase(),
  );
};

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  loading,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
            {label}
          </p>

          <div className="mt-2">
            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
            ) : (
              <p className="text-2xl font-bold text-gray-950">
                {value}
              </p>
            )}
          </div>

          <p className="mt-1 text-xs leading-5 text-gray-500">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#800020]/8 text-[#800020]">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 px-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#800020]/8 text-[#800020]">
        <Scissors size={25} />
      </div>

      <h3 className="mt-4 text-base font-semibold text-gray-950">
        No production jobs found
      </h3>

      <p className="mt-1 max-w-md text-sm leading-6 text-gray-500">
        Create your first tailor production job to start
        tracking issued, received and pending quantities.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#800020] px-4 text-sm font-semibold text-white transition hover:bg-[#68001a]"
      >
        <Plus size={17} />
        Create Production Job
      </button>
    </div>
  );
}

export default function TailorProductionJobsDashboard() {
  const router = useRouter();

  const {
    dashboardSummary,
    recentJobs,
    loading,
    summaryLoading,
    error,
    fetchDashboardSummary,
    fetchProductionJobs,
  } = useTailorProductionJobStore();

  const loadDashboard = async () => {
    await Promise.allSettled([
      fetchDashboardSummary(),
      fetchProductionJobs({
        page: 1,
        limit: 8,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    ]);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary = useMemo(() => {
    const source = dashboardSummary || {};

    return {
      totalJobs: numberValue(
        source.totalJobs ??
          source.total ??
          source.jobs,
      ),

      activeJobs: numberValue(
        source.activeJobs ??
          source.active ??
          source.inProgressJobs,
      ),

      pendingQuantity: numberValue(
        source.pendingQuantity ??
          source.pendingQty ??
          source.totalPendingQuantity,
      ),

      overdueJobs: numberValue(
        source.overdueJobs ??
          source.overdue,
      ),

      completedJobs: numberValue(
        source.completedJobs ??
          source.completed,
      ),

      totalPayable: numberValue(
        source.totalPayable ??
          source.payableAmount ??
          source.totalAmount,
      ),
    };
  }, [dashboardSummary]);

  const jobs = Array.isArray(recentJobs)
    ? recentJobs
    : [];

  const pageLoading =
    loading && jobs.length === 0;

  return (
    <main className="min-h-screen bg-[#fcfafb] px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-2xl border border-[#800020]/10 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#800020]">
                <Factory size={15} />
                Tailor Operations
              </div>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                Tailor Production Jobs
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                Create jobs, assign tailors, issue
                quantities, receive completed pieces and
                monitor pending production.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={loadDashboard}
                disabled={loading || summaryLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:border-[#800020]/20 hover:bg-[#800020]/5 hover:text-[#800020] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading || summaryLoading ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <RefreshCcw size={17} />
                )}

                Refresh
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/tailor-production-jobs/create",
                  )
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#800020] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#68001a]"
              >
                <Plus size={18} />
                Create Production Job
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Unable to load dashboard
              </p>

              <p className="mt-0.5 text-xs leading-5">
                {cleanText(
                  error,
                  "Something went wrong while loading production jobs.",
                )}
              </p>
            </div>
          </div>
        )}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <SummaryCard
            label="Total Jobs"
            value={summary.totalJobs}
            description="All production jobs"
            icon={Factory}
            loading={summaryLoading}
          />

          <SummaryCard
            label="Active Jobs"
            value={summary.activeJobs}
            description="Currently in production"
            icon={Clock3}
            loading={summaryLoading}
          />

          <SummaryCard
            label="Pending Qty"
            value={summary.pendingQuantity}
            description="Pieces yet to receive"
            icon={Shirt}
            loading={summaryLoading}
          />

          <SummaryCard
            label="Overdue"
            value={summary.overdueJobs}
            description="Past expected date"
            icon={CalendarClock}
            loading={summaryLoading}
          />

          <SummaryCard
            label="Completed"
            value={summary.completedJobs}
            description="Fully received jobs"
            icon={CheckCircle2}
            loading={summaryLoading}
          />

          <SummaryCard
            label="Total Payable"
            value={formatCurrency(
              summary.totalPayable,
            )}
            description="Calculated labour cost"
            icon={IndianRupee}
            loading={summaryLoading}
          />
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="text-base font-semibold text-gray-950">
                Recent Production Jobs
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Latest jobs created for assigned tailors.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/tailor-production-jobs/all",
                )
              }
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#800020] hover:underline"
            >
              View All
              <ArrowRight size={15} />
            </button>
          </div>

          {pageLoading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Loader2
                  size={19}
                  className="animate-spin text-[#800020]"
                />
                Loading production jobs...
              </div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-4 sm:p-5">
              <EmptyState
                onCreate={() =>
                  router.push(
                    "/tailor-production-jobs/create",
                  )
                }
              />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                      <th className="px-5 py-3">
                        Job
                      </th>

                      <th className="px-5 py-3">
                        Tailor
                      </th>

                      <th className="px-5 py-3">
                        Product
                      </th>

                      <th className="px-5 py-3">
                        Quantity
                      </th>

                      <th className="px-5 py-3">
                        Expected
                      </th>

                      <th className="px-5 py-3">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {jobs.map((job) => {
                      const jobId =
                        job?._id || job?.id;

                      const tailorName =
                        job?.tailorSnapshot?.name ||
                        job?.tailor?.name ||
                        job?.tailorId?.name ||
                        job?.tailorName;

                      const productTitle =
                        job?.productSnapshot?.title ||
                        job?.product?.title ||
                        job?.productId?.title ||
                        job?.productTitle;

                      const productCode =
                        job?.productSnapshot
                          ?.productCode ||
                        job?.product?.productCode ||
                        job?.productId?.productCode ||
                        job?.productCode;

                      const issuedQuantity =
                        numberValue(
                          job?.totalIssuedQuantity ??
                            job?.issuedQuantity ??
                            job?.totalQuantity ??
                            job?.quantity,
                        );

                      const receivedQuantity =
                        numberValue(
                          job?.totalReceivedQuantity ??
                            job?.receivedQuantity,
                        );

                      return (
                        <tr
                          key={jobId}
                          className="transition hover:bg-[#800020]/[0.025]"
                        >
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-gray-950">
                              {cleanText(
                                job?.jobNumber ||
                                  job?.productionJobNumber,
                                `JOB-${String(
                                  jobId || "",
                                ).slice(-6)}`,
                              )}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-400">
                              {formatDate(
                                job?.issueDate ||
                                  job?.createdAt,
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                                <UserRoundCog
                                  size={16}
                                />
                              </div>

                              <span className="text-sm font-medium text-gray-700">
                                {cleanText(
                                  tailorName,
                                  "Unassigned",
                                )}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="max-w-[240px] truncate text-sm font-medium text-gray-800">
                              {cleanText(
                                productTitle,
                                "Product",
                              )}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-400">
                              {cleanText(
                                productCode,
                                "No code",
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-gray-900">
                              {receivedQuantity}
                              <span className="font-normal text-gray-400">
                                {" "}
                                / {issuedQuantity}
                              </span>
                            </p>

                            <p className="mt-0.5 text-xs text-gray-400">
                              Received / Issued
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm text-gray-700">
                              {formatDate(
                                job?.expectedCompletionDate ||
                                  job?.expectedDate ||
                                  job?.dueDate,
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                                job?.status,
                              )}`}
                            >
                              {getStatusLabel(
                                job?.status,
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/tailor-production-jobs/${jobId}`,
                                )
                              }
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 transition hover:border-[#800020]/20 hover:bg-[#800020]/5 hover:text-[#800020]"
                            >
                              View
                              <ArrowRight
                                size={14}
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-gray-100 md:hidden">
                {jobs.map((job) => {
                  const jobId =
                    job?._id || job?.id;

                  const tailorName =
                    job?.tailorSnapshot?.name ||
                    job?.tailor?.name ||
                    job?.tailorId?.name ||
                    job?.tailorName;

                  const productTitle =
                    job?.productSnapshot?.title ||
                    job?.product?.title ||
                    job?.productId?.title ||
                    job?.productTitle;

                  const issuedQuantity =
                    numberValue(
                      job?.totalIssuedQuantity ??
                        job?.issuedQuantity ??
                        job?.quantity,
                    );

                  const receivedQuantity =
                    numberValue(
                      job?.totalReceivedQuantity ??
                        job?.receivedQuantity,
                    );

                  return (
                    <button
                      key={jobId}
                      type="button"
                      onClick={() =>
                        router.push(
                          `/tailor-production-jobs/${jobId}`,
                        )
                      }
                      className="block w-full p-4 text-left transition hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-950">
                            {cleanText(
                              job?.jobNumber ||
                                job?.productionJobNumber,
                              `JOB-${String(
                                jobId || "",
                              ).slice(-6)}`,
                            )}
                          </p>

                          <p className="mt-1 truncate text-sm text-gray-600">
                            {cleanText(
                              productTitle,
                              "Product",
                            )}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${getStatusClasses(
                            job?.status,
                          )}`}
                        >
                          {getStatusLabel(
                            job?.status,
                          )}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-gray-400">
                            Tailor
                          </p>

                          <p className="mt-0.5 font-medium text-gray-700">
                            {cleanText(
                              tailorName,
                              "Unassigned",
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-400">
                            Received
                          </p>

                          <p className="mt-0.5 font-medium text-gray-700">
                            {receivedQuantity} /{" "}
                            {issuedQuantity}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                        <span className="text-xs text-gray-400">
                          Expected{" "}
                          {formatDate(
                            job?.expectedCompletionDate ||
                              job?.expectedDate ||
                              job?.dueDate,
                          )}
                        </span>

                        <ArrowRight
                          size={16}
                          className="text-[#800020]"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}