"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Factory,
  IndianRupee,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Shirt,
  UserRoundCog,
} from "lucide-react";

import useTailorProductionJobStore from "@/store/useTailorProductionJobStore";

/* =========================================================
   HELPERS
========================================================= */

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
      partially_received:
  "border-violet-200 bg-violet-50 text-violet-700",
  };

  return (
    styles[status] ||
    "border-gray-200 bg-gray-50 text-gray-600"
  );
};

const inputClass =
  "h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition focus:border-[#800020]/40 focus:bg-white";

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  loading,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {label}
          </p>

          {loading ? (
            <div className="mt-3 h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <p className="mt-2 text-2xl font-bold text-gray-950">
              {value}
            </p>
          )}

          <p className="mt-1 text-xs text-gray-500">
            {description}
          </p>
        </div>

        <div className="rounded-xl bg-[#800020]/8 p-2.5 text-[#800020]">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-5 text-center">
      <div className="rounded-2xl bg-[#800020]/8 p-4 text-[#800020]">
        <Factory size={30} />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-gray-950">
        No production jobs found
      </h3>

      <p className="mt-1 max-w-sm text-sm text-gray-500">
        Create a job and allocate product codes to a tailor.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#800020] px-4 text-sm font-semibold text-white hover:bg-[#68001a]"
      >
        <Plus size={17} />
        Create Production Job
      </button>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function TailorProductionJobsPage() {
  const router = useRouter();

  const {
    productionJobs = [],
    productionSummary = {},
    pagination,
    filters,

    listLoading,
    summaryLoading,
    error,

    fetchProductionJobs,
    fetchProductionSummary,
    setFilters,
  } = useTailorProductionJobStore();

  const [searchInput, setSearchInput] =
    useState(filters.search || "");

  /* Initial load */
  useEffect(() => {
    Promise.allSettled([
      fetchProductionSummary(),
      fetchProductionJobs(),
    ]);
  }, [
    fetchProductionJobs,
    fetchProductionSummary,
  ]);

  const handleSearch = () => {
    const search = searchInput
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .join(",");

    setFilters({
      search,
      page: 1,
    });

    fetchProductionJobs({
      search,
      page: 1,
    }).catch(console.error);
  };

  const summary = useMemo(() => {
    const statuses =
      productionSummary.statuses || {};

    return {
      totalJobs:
        productionSummary.totalJobs || 0,

      totalProducts:
        productionSummary.totalProducts || 0,

      totalQuantity:
        productionSummary.totalQuantity || 0,

      totalAmount:
        productionSummary.totalAmount || 0,

      overdueCount:
        productionSummary.overdueCount || 0,

      completedJobs:
        statuses.completed?.jobs || 0,

   activeJobs:
  (statuses.assigned?.jobs || 0) +
  (statuses.in_progress?.jobs || 0) +
  (statuses.partially_received?.jobs || 0),
    };
  }, [productionSummary]);

  const handleRefresh = async () => {
    await Promise.allSettled([
      fetchProductionSummary(),
      fetchProductionJobs(),
    ]);
  };

  const handleFilterChange = (
    key,
    value,
  ) => {
    const nextFilters = {
      [key]: value,
      page: 1,
    };

    setFilters(nextFilters);

    fetchProductionJobs(
      nextFilters,
    ).catch(console.error);
  };

  const handlePageChange = (
    nextPage,
  ) => {
    const totalPages =
      Number(pagination?.totalPages) || 1;

    if (
      nextPage < 1 ||
      nextPage > totalPages ||
      listLoading
    ) {
      return;
    }

    setFilters({
      page: nextPage,
    });

    fetchProductionJobs({
      page: nextPage,
    }).catch(console.error);
  };

  return (
    <main className="min-h-screen bg-[#fcfafb] px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}

        <section className="rounded-2xl border border-[#800020]/10 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#800020]">
                <Factory size={15} />
                Production
              </div>

              <h1 className="mt-2 text-2xl font-bold text-gray-950 sm:text-3xl">
                Tailor Production Jobs
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Allocate multiple product codes and size-wise quantities to a tailor.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={
                  listLoading ||
                  summaryLoading
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:text-[#800020] disabled:opacity-60"
              >
                <RefreshCcw
                  size={17}
                  className={
                    listLoading ||
                      summaryLoading
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/tailor-production-jobs/create",
                  )
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#800020] px-5 text-sm font-semibold text-white hover:bg-[#68001a]"
              >
                <Plus size={18} />
                Create Job
              </button>
            </div>
          </div>
        </section>

        {/* Error */}

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Unable to load production jobs
              </p>

              <p className="mt-0.5 text-xs">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Summary */}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
          <SummaryCard
            label="Total Jobs"
            value={summary.totalJobs}
            description="All jobs"
            icon={Factory}
            loading={summaryLoading}
          />

          <SummaryCard
            label="Active"
            value={summary.activeJobs}
            description="Current jobs"
            icon={Clock3}
            loading={summaryLoading}
          />

          <SummaryCard
            label="Completed"
            value={summary.completedJobs}
            description="Finished jobs"
            icon={CheckCircle2}
            loading={summaryLoading}
          />

          <SummaryCard
            label="Products"
            value={summary.totalProducts}
            description="Product allocations"
            icon={Shirt}
            loading={summaryLoading}
          />

          <SummaryCard
            label="Quantity"
            value={summary.totalQuantity}
            description="Total pieces"
            icon={BriefcaseBusiness}
            loading={summaryLoading}
          />

          <SummaryCard
            label="Overdue"
            value={summary.overdueCount}
            description="Past deadline"
            icon={CalendarClock}
            loading={summaryLoading}
          />

          <SummaryCard
            label="Total Value"
            value={formatCurrency(
              summary.totalAmount,
            )}
            description="Work amount"
            icon={IndianRupee}
            loading={summaryLoading}
          />
        </section>

        {/* Filters */}

{/* Filters */}

<section className="mt-5 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
  {/* Main Filters */}
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

    {/* Search */}
    <div className="flex gap-2 sm:col-span-2">
      <div className="relative flex-1">
        <Search
          size={17}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          value={searchInput}
          onChange={(e) =>
            setSearchInput(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          placeholder="Job, product codes, tailor..."
          className={`${inputClass} w-full pl-10`}
        />
      </div>

      <button
        type="button"
        onClick={handleSearch}
        disabled={listLoading}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#800020] px-4 text-sm font-semibold text-white disabled:opacity-50"
      >
        {listLoading ? (
          <Loader2
            size={16}
            className="animate-spin"
          />
        ) : (
          <Search size={16} />
        )}
        Search
      </button>
    </div>

    {/* Status */}
    <select
      value={filters.status}
      onChange={(e) =>
        handleFilterChange(
          "status",
          e.target.value,
        )
      }
      className={inputClass}
    >
      <option value="">All statuses</option>
      <option value="assigned">Assigned</option>
      <option value="in_progress">
        In Progress
      </option>
      <option value="partially_received">
        Partially Received
      </option>
      <option value="completed">
        Completed
      </option>
      <option value="cancelled">
        Cancelled
      </option>
    </select>

    {/* Work Type */}
    <select
      value={filters.workType}
      onChange={(e) =>
        handleFilterChange(
          "workType",
          e.target.value,
        )
      }
      className={inputClass}
    >
      <option value="">All work types</option>
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

    {/* Received */}
    <select
      value={filters.receivedStatus || ""}
      onChange={(e) =>
        handleFilterChange(
          "receivedStatus",
          e.target.value,
        )
      }
      className={inputClass}
    >
      <option value="">All receiving</option>
      <option value="pending">
        Nothing Received
      </option>
      <option value="partial">
        Partially Received
      </option>
      <option value="complete">
        Fully Received
      </option>
    </select>

    {/* Overdue */}
    <select
      value={filters.overdue || ""}
      onChange={(e) =>
        handleFilterChange(
          "overdue",
          e.target.value,
        )
      }
      className={inputClass}
    >
      <option value="">All deadlines</option>
      <option value="true">
        Overdue Only
      </option>
    </select>

    {/* Created From */}
    <input
      type="date"
      value={filters.dateFrom || ""}
      onChange={(e) =>
        handleFilterChange(
          "dateFrom",
          e.target.value,
        )
      }
      className={inputClass}
      title="Created From"
    />

    {/* Created To */}
    <input
      type="date"
      value={filters.dateTo || ""}
      onChange={(e) =>
        handleFilterChange(
          "dateTo",
          e.target.value,
        )
      }
      className={inputClass}
      title="Created To"
    />

    {/* Expected From */}
    <input
      type="date"
      value={filters.expectedFrom || ""}
      onChange={(e) =>
        handleFilterChange(
          "expectedFrom",
          e.target.value,
        )
      }
      className={inputClass}
      title="Expected From"
    />

    {/* Expected To */}
    <input
      type="date"
      value={filters.expectedTo || ""}
      onChange={(e) =>
        handleFilterChange(
          "expectedTo",
          e.target.value,
        )
      }
      className={inputClass}
      title="Expected To"
    />

    {/* Minimum Quantity */}
    <input
      type="number"
      min="0"
      value={filters.minQuantity || ""}
      onChange={(e) =>
        handleFilterChange(
          "minQuantity",
          e.target.value,
        )
      }
      placeholder="Min quantity"
      className={inputClass}
    />

    {/* Maximum Quantity */}
    <input
      type="number"
      min="0"
      value={filters.maxQuantity || ""}
      onChange={(e) =>
        handleFilterChange(
          "maxQuantity",
          e.target.value,
        )
      }
      placeholder="Max quantity"
      className={inputClass}
    />

    {/* Minimum Amount */}
    <input
      type="number"
      min="0"
      value={filters.minAmount || ""}
      onChange={(e) =>
        handleFilterChange(
          "minAmount",
          e.target.value,
        )
      }
      placeholder="Min amount ₹"
      className={inputClass}
    />

    {/* Maximum Amount */}
    <input
      type="number"
      min="0"
      value={filters.maxAmount || ""}
      onChange={(e) =>
        handleFilterChange(
          "maxAmount",
          e.target.value,
        )
      }
      placeholder="Max amount ₹"
      className={inputClass}
    />

    {/* Sort */}
    <select
      value={filters.sort}
      onChange={(e) =>
        handleFilterChange(
          "sort",
          e.target.value,
        )
      }
      className={inputClass}
    >
      <option value="newest">
        Newest first
      </option>

      <option value="oldest">
        Oldest first
      </option>

      <option value="deadline_asc">
        Deadline first
      </option>

      <option value="deadline_desc">
        Deadline latest
      </option>

      <option value="quantity_desc">
        Quantity high → low
      </option>

      <option value="quantity_asc">
        Quantity low → high
      </option>

      <option value="amount_desc">
        Value high → low
      </option>

      <option value="amount_asc">
        Value low → high
      </option>

      <option value="received_desc">
        Received high → low
      </option>

      <option value="received_asc">
        Received low → high
      </option>

      <option value="updated_desc">
        Recently updated
      </option>
    </select>
  </div>
</section>

        {/* Jobs Table */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {listLoading &&
            productionJobs.length === 0 ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Loader2
                  size={20}
                  className="animate-spin text-[#800020]"
                />

                Loading production jobs...
              </div>
            </div>
          ) : productionJobs.length === 0 ? (
            <EmptyState
              onCreate={() =>
                router.push(
                  "/tailor-production-jobs/create",
                )
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px]">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3">
                        Job
                      </th>

                      <th className="px-4 py-3">
                        Tailor
                      </th>

                      <th className="px-4 py-3">
                        Products
                      </th>

                      <th className="px-4 py-3">
                        Quantity
                      </th>

                      <th className="px-4 py-3">
                        Amount
                      </th>

                      <th className="px-4 py-3">
                        Expected
                      </th>

                      <th className="px-4 py-3">
                        Status
                      </th>

                      <th className="px-4 py-3 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {productionJobs.map(
                      (job) => {
                        const products =
                          Array.isArray(
                            job.products,
                          )
                            ? job.products
                            : [];

                        return (
                          <tr
                            key={job._id}
                            className="transition hover:bg-[#800020]/[0.02]"
                          >
                            <td className="px-4 py-4">
                              <p className="text-sm font-semibold text-gray-950">
                                {job.jobNumber}
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                {formatDate(
                                  job.createdAt,
                                )}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                                  <UserRoundCog
                                    size={17}
                                  />
                                </div>

                                <div>
                                  <p className="text-sm font-semibold text-gray-800">
                                    {job
                                      .tailorSnapshot
                                      ?.name ||
                                      job.tailor
                                        ?.name ||
                                      "Unknown"}
                                  </p>

                                  <p className="text-xs text-gray-400">
                                    {job
                                      .tailorSnapshot
                                      ?.tailorCode ||
                                      job.tailor
                                        ?.tailorCode ||
                                      ""}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="max-w-[280px]">
                                <p className="text-sm font-semibold text-gray-800">
                                  {products.length}{" "}
                                  product
                                  {products.length !==
                                    1
                                    ? "s"
                                    : ""}
                                </p>

                                <div className="mt-1 flex flex-wrap gap-1">
                                  {products
                                    .slice(0, 3)
                                    .map(
                                      (
                                        product,
                                      ) => (
                                        <span
                                          key={
                                            product._id ||
                                            product.productCode
                                          }
                                          className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600"
                                        >
                                          {
                                            product.productCode
                                          }
                                        </span>
                                      ),
                                    )}

                                  {products.length >
                                    3 && (
                                      <span className="text-xs text-gray-400">
                                        +
                                        {products.length -
                                          3}
                                      </span>
                                    )}
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <p className="text-sm font-bold text-gray-900">
                                {
                                  job.totalQuantity
                                }
                              </p>

                              <p className="text-xs text-gray-400">
                                Pieces
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <p className="text-sm font-semibold text-gray-900">
                                {formatCurrency(
                                  job.totalAmount,
                                )}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <p className="text-sm text-gray-700">
                                {formatDate(
                                  job.expectedAt,
                                )}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                                  job.status,
                                )}`}
                              >
                                {formatLabel(
                                  job.status,
                                )}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/tailor-production-jobs/${job._id}`,
                                  )
                                }
                                className="inline-flex h-9 items-center rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 hover:text-[#800020]"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}

              <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-gray-800">
                    {productionJobs.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-800">
                    {pagination.total}
                  </span>{" "}
                  jobs
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      !pagination.hasPreviousPage ||
                      listLoading
                    }
                    onClick={() =>
                      handlePageChange(
                        pagination.page - 1,
                      )
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </button>

                  <span className="min-w-20 text-center text-xs font-medium text-gray-600">
                    Page{" "}
                    {pagination.page || 1} of{" "}
                    {pagination.totalPages || 1}
                  </span>

                  <button
                    type="button"
                    disabled={
                      !pagination.hasNextPage ||
                      listLoading
                    }
                    onClick={() =>
                      handlePageChange(
                        pagination.page + 1,
                      )
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}