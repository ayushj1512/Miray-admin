"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Eye,
  Loader2,
  Pencil,
  RefreshCcw,
  Search,
  UserRoundCheck,
  UserRoundCog,
  UserRoundX,
  Users,
} from "lucide-react";

import useTailorStore from "@/store/useTailorStore";

/* =========================================================
   SMALL UI HELPERS
========================================================= */

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const SummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-gray-500">
          {title}
        </p>

        <p className="mt-2 text-2xl font-bold text-gray-950">
          {value}
        </p>

        <p className="mt-1 text-xs text-gray-400">
          {subtitle}
        </p>
      </div>

      <div className="rounded-xl bg-[#800020]/8 p-2.5 text-[#800020]">
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const EmptyState = ({ onCreate }) => (
  <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">
    <div className="rounded-2xl bg-[#800020]/8 p-4 text-[#800020]">
      <UserRoundCog size={34} />
    </div>

    <h3 className="mt-4 text-lg font-semibold text-gray-950">
      No tailors found
    </h3>

    <p className="mt-1 max-w-sm text-sm text-gray-500">
      Create a tailor or change the current filters.
    </p>

    <button
      type="button"
      onClick={onCreate}
      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#800020] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#68001a]"
    >
      <CirclePlus size={17} />
      Create Tailor
    </button>
  </div>
);

/* =========================================================
   PAGE
========================================================= */

export default function TailorsPage() {
  const router = useRouter();

  const {
    tailors = [],
    tailorSummary = {},
    pagination,
    filters,

    listLoading,
    summaryLoading,
    updating,

    setFilters,
    fetchTailors,
    fetchTailorSummary,
    updateTailorStatus,
  } = useTailorStore();

  const [searchInput, setSearchInput] = useState(
    filters.search || "",
  );

  /* Initial load */
  useEffect(() => {
    Promise.all([
      fetchTailors(),
      fetchTailorSummary(),
    ]).catch((error) => {
      console.error(
        "Failed to load tailor data:",
        error,
      );
    });
  }, [fetchTailors, fetchTailorSummary]);

  /* Debounced search */
  useEffect(() => {
    const timeout = setTimeout(() => {
      const search = searchInput.trim();

      if (search === filters.search) return;

      setFilters({
        search,
        page: 1,
      });

      fetchTailors({
        search,
        page: 1,
      }).catch(console.error);
    }, 400);

    return () => clearTimeout(timeout);
  }, [
    searchInput,
    filters.search,
    setFilters,
    fetchTailors,
  ]);

  /* Fallback stats from current list */
  const statistics = useMemo(() => {
    const active = tailors.filter(
      (tailor) => tailor.isActive,
    ).length;

    const inactive = tailors.filter(
      (tailor) => !tailor.isActive,
    ).length;

    return {
      total:
        tailorSummary.totalTailors ??
        pagination?.total ??
        tailors.length,

      active:
        tailorSummary.activeTailors ??
        active,

      inactive:
        tailorSummary.inactiveTailors ??
        inactive,

      totalJobs:
        tailorSummary.totalJobs ?? 0,

      totalQuantity:
        tailorSummary.totalQuantity ?? 0,
    };
  }, [
    tailors,
    tailorSummary,
    pagination,
  ]);

  const handleFilterChange = (
    key,
    value,
  ) => {
    const nextFilters = {
      [key]: value,
      page: 1,
    };

    setFilters(nextFilters);

    fetchTailors(nextFilters).catch(
      console.error,
    );
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([
        fetchTailors(),
        fetchTailorSummary(),
      ]);
    } catch (error) {
      console.error(
        "Failed to refresh tailors:",
        error,
      );
    }
  };

  const handlePageChange = async (
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

    await fetchTailors({
      page: nextPage,
    });
  };

  const handleStatusChange = async (
    tailor,
  ) => {
    try {
      await updateTailorStatus(
        tailor._id,
        !tailor.isActive,
      );

      await fetchTailorSummary();
    } catch (error) {
      console.error(
        "Failed to update tailor status:",
        error,
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfafb] px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#800020] p-2 text-white">
              <UserRoundCog size={22} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">
                Tailors
              </h1>

              <p className="text-xs text-gray-500 sm:text-sm">
                Manage tailor profiles and production jobs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={
                listLoading ||
                summaryLoading
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm hover:text-[#800020] disabled:opacity-60"
            >
              <RefreshCcw
                size={16}
                className={
                  listLoading ||
                  summaryLoading
                    ? "animate-spin"
                    : ""
                }
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/tailors/create",
                )
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#800020] px-4 text-sm font-semibold text-white hover:bg-[#68001a]"
            >
              <CirclePlus size={17} />
              Add Tailor
            </button>
          </div>
        </div>

        {/* Summary */}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <SummaryCard
            title="Total Tailors"
            value={statistics.total}
            subtitle="All registered tailors"
            icon={Users}
          />

          <SummaryCard
            title="Active"
            value={statistics.active}
            subtitle="Can receive jobs"
            icon={UserRoundCheck}
          />

          <SummaryCard
            title="Inactive"
            value={statistics.inactive}
            subtitle="Not receiving jobs"
            icon={UserRoundX}
          />

          <SummaryCard
            title="Production Jobs"
            value={statistics.totalJobs}
            subtitle="All active history"
            icon={BriefcaseBusiness}
          />

          <SummaryCard
            title="Total Quantity"
            value={statistics.totalQuantity}
            subtitle="Pieces allocated"
            icon={UserRoundCog}
          />
        </section>

        {/* Filters */}

        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_180px_180px]">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value,
                  )
                }
                placeholder="Search name, code, mobile or product"
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm outline-none focus:border-[#800020]/40 focus:bg-white"
              />
            </div>

            <select
              value={filters.isActive}
              onChange={(event) =>
                handleFilterChange(
                  "isActive",
                  event.target.value,
                )
              }
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-[#800020]/40"
            >
              <option value="">
                All statuses
              </option>

              <option value="true">
                Active
              </option>

              <option value="false">
                Inactive
              </option>
            </select>

            <select
              value={filters.sort}
              onChange={(event) =>
                handleFilterChange(
                  "sort",
                  event.target.value,
                )
              }
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-[#800020]/40"
            >
              <option value="newest">
                Newest first
              </option>

              <option value="oldest">
                Oldest first
              </option>

              <option value="name_asc">
                Name A-Z
              </option>

              <option value="name_desc">
                Name Z-A
              </option>

              <option value="code_asc">
                Code ascending
              </option>
            </select>
          </div>
        </section>

        {/* Table */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {listLoading &&
          tailors.length === 0 ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <Loader2
                  size={28}
                  className="animate-spin text-[#800020]"
                />

                <p className="text-sm">
                  Loading tailors...
                </p>
              </div>
            </div>
          ) : tailors.length === 0 ? (
            <EmptyState
              onCreate={() =>
                router.push(
                  "/tailors/create",
                )
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="border-b border-gray-200 bg-gray-50/80">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Tailor
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Contact
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Jobs
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Products
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {tailors.map((tailor) => {
                      const productionJobs =
                        Array.isArray(
                          tailor.productionJobs,
                        )
                          ? tailor.productionJobs
                          : [];

                      const productCodes = [
                        ...new Set(
                          productionJobs
                            .map(
                              (item) =>
                                item.productCode,
                            )
                            .filter(Boolean),
                        ),
                      ];

                      const totalQuantity =
                        productionJobs.reduce(
                          (total, item) =>
                            total +
                            Number(
                              item.assignedQuantity ||
                                0,
                            ),
                          0,
                        );

                      return (
                        <tr
                          key={tailor._id}
                          className="transition hover:bg-[#800020]/[0.018]"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#800020]/8 text-sm font-bold text-[#800020]">
                                {getInitials(
                                  tailor.name,
                                ) || "T"}
                              </div>

                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(
                                      `/tailors/${tailor._id}`,
                                    )
                                  }
                                  className="max-w-[220px] truncate text-left text-sm font-semibold text-gray-950 hover:text-[#800020]"
                                >
                                  {tailor.name ||
                                    "Unnamed Tailor"}
                                </button>

                                <p className="mt-0.5 text-xs text-gray-500">
                                  {tailor.tailorCode ||
                                    "No code"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <p className="text-sm font-medium text-gray-800">
                              {tailor.mobile ||
                                "No mobile"}
                            </p>

                            {tailor.alternateMobile && (
                              <p className="mt-1 text-xs text-gray-500">
                                Alt:{" "}
                                {
                                  tailor.alternateMobile
                                }
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <p className="text-sm font-semibold text-gray-900">
                              {
                                productionJobs.length
                              }{" "}
                              jobs
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {totalQuantity} pieces
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            {productCodes.length ? (
                              <div className="flex max-w-[260px] flex-wrap gap-1.5">
                                {productCodes
                                  .slice(0, 3)
                                  .map((code) => (
                                    <span
                                      key={code}
                                      className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-700"
                                    >
                                      {code}
                                    </span>
                                  ))}

                                {productCodes.length >
                                  3 && (
                                  <span className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-500">
                                    +
                                    {productCodes.length -
                                      3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">
                                No products assigned
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <button
                              type="button"
                              disabled={updating}
                              onClick={() =>
                                handleStatusChange(
                                  tailor,
                                )
                              }
                              className={[
                                "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50",

                                tailor.isActive
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-gray-200 bg-gray-50 text-gray-600",
                              ].join(" ")}
                            >
                              {tailor.isActive
                                ? "Active"
                                : "Inactive"}
                            </button>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                title="View tailor"
                                onClick={() =>
                                  router.push(
                                    `/tailors/${tailor._id}`,
                                  )
                                }
                                className="rounded-lg p-2 text-gray-500 hover:bg-[#800020]/8 hover:text-[#800020]"
                              >
                                <Eye size={17} />
                              </button>

                              <button
                                type="button"
                                title="Edit tailor"
                                onClick={() =>
                                  router.push(
                                    `/tailors/${tailor._id}/edit`,
                                  )
                                }
                                className="rounded-lg p-2 text-gray-500 hover:bg-[#800020]/8 hover:text-[#800020]"
                              >
                                <Pencil
                                  size={17}
                                />
                              </button>

                              <button
                                type="button"
                                title="Create production job"
                                onClick={() =>
                                  router.push(
                                    `/tailor-production-jobs/create?tailorId=${tailor._id}`,
                                  )
                                }
                                className="rounded-lg p-2 text-gray-500 hover:bg-[#800020]/8 hover:text-[#800020]"
                              >
                                <BriefcaseBusiness
                                  size={17}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}

              <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-gray-800">
                    {tailors.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-800">
                    {pagination.total}
                  </span>{" "}
                  tailors
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