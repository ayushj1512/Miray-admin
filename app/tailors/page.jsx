"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Clock3,
  Eye,
  Loader2,
  MoreVertical,
  Pencil,
  RefreshCcw,
  Search,
  Shirt,
  UserRoundCheck,
  UserRoundCog,
  UserRoundX,
  Users,
} from "lucide-react";

import useTailorStore from "@/store/useTailorStore";

const STATUS_STYLES = {
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  inactive:
    "border-gray-200 bg-gray-50 text-gray-600",

  blocked:
    "border-red-200 bg-red-50 text-red-700",
};

const AVAILABILITY_STYLES = {
  available:
    "border-emerald-200 bg-emerald-50 text-emerald-700",

  busy:
    "border-amber-200 bg-amber-50 text-amber-700",

  on_leave:
    "border-blue-200 bg-blue-50 text-blue-700",

  unavailable:
    "border-gray-200 bg-gray-50 text-gray-600",
};

const formatLabel = (value) => {
  if (!value) return "—";

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
};

const getInitials = (name = "") => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const SummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-950">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-xs text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-[#800020]/8 p-2.5 text-[#800020]">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ onCreate }) => {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">
      <div className="rounded-2xl bg-[#800020]/8 p-4 text-[#800020]">
        <UserRoundCog size={34} />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-gray-950">
        No tailors found
      </h3>

      <p className="mt-1 max-w-sm text-sm text-gray-500">
        Create your first tailor profile or change the
        current filters.
      </p>

      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#800020] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#68001a]"
      >
        <CirclePlus size={17} />
        Create Tailor
      </button>
    </div>
  );
};

export default function TailorsPage() {
  const router = useRouter();

  const {
    tailors,
    summary,
    pagination,
    filters,

    listLoading,
    summaryLoading,

    setFilters,
    setPage,
    fetchTailors,
    fetchTailorSummary,
    updateTailorAvailability,
  } = useTailorStore();

  const [searchInput, setSearchInput] = useState(
    filters.search || "",
  );

  const [openMenuId, setOpenMenuId] =
    useState(null);

  useEffect(() => {
    fetchTailors();
    fetchTailorSummary();
  }, []);

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
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const statistics = useMemo(() => {
    return {
      total:
        summary?.totalTailors ??
        summary?.total ??
        pagination.total ??
        0,

      active:
        summary?.activeTailors ??
        summary?.active ??
        0,

      available:
        summary?.availableTailors ??
        summary?.available ??
        0,

      busy:
        summary?.busyTailors ??
        summary?.busy ??
        0,

      inactive:
        summary?.inactiveTailors ??
        summary?.inactive ??
        0,
    };
  }, [summary, pagination.total]);

  const handleFilterChange = (
    key,
    value,
  ) => {
    const nextFilters = {
      [key]: value,
      page: 1,
    };

    setFilters(nextFilters);
    fetchTailors(nextFilters);
  };

  const handleRefresh = async () => {
    await Promise.all([
      fetchTailors(),
      fetchTailorSummary(),
    ]);
  };

  const handlePageChange = (nextPage) => {
    if (
      nextPage < 1 ||
      nextPage > pagination.totalPages
    ) {
      return;
    }

    setPage(nextPage);

    fetchTailors({
      page: nextPage,
    });
  };

  const handleAvailabilityChange = async (
    tailorId,
    availability,
  ) => {
    setOpenMenuId(null);

    await updateTailorAvailability(
      tailorId,
      availability,
    );
  };

  return (
    <main className="min-h-screen bg-[#fcfafb] px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-[#800020] p-2 text-white">
                <UserRoundCog size={22} />
              </div>

              <div>
                <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">
                  Tailors
                </h1>

                <p className="text-xs text-gray-500 sm:text-sm">
                  Manage tailor profiles, skills,
                  capacity and product assignments.
                </p>
              </div>
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
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#800020]/20 hover:text-[#800020] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw
                size={16}
                className={
                  listLoading
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
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#800020] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#68001a]"
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
            subtitle="Eligible for work"
            icon={UserRoundCheck}
          />

          <SummaryCard
            title="Available"
            value={statistics.available}
            subtitle="Ready for assignment"
            icon={Activity}
          />

          <SummaryCard
            title="Busy"
            value={statistics.busy}
            subtitle="Currently working"
            icon={Clock3}
          />

          <SummaryCard
            title="Inactive"
            value={statistics.inactive}
            subtitle="Not receiving jobs"
            icon={UserRoundX}
          />
        </section>

        {/* Filters */}

        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_170px_170px_170px]">
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
                placeholder="Search name, code or mobile"
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#800020]/40 focus:bg-white focus:ring-4 focus:ring-[#800020]/5"
              />
            </div>

            <select
              value={filters.status}
              onChange={(event) =>
                handleFilterChange(
                  "status",
                  event.target.value,
                )
              }
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-[#800020]/40 focus:bg-white"
            >
              <option value="all">
                All statuses
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>

              <option value="blocked">
                Blocked
              </option>
            </select>

            <select
              value={filters.availability}
              onChange={(event) =>
                handleFilterChange(
                  "availability",
                  event.target.value,
                )
              }
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-[#800020]/40 focus:bg-white"
            >
              <option value="all">
                All availability
              </option>

              <option value="available">
                Available
              </option>

              <option value="busy">
                Busy
              </option>

              <option value="on_leave">
                On Leave
              </option>

              <option value="unavailable">
                Unavailable
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
              className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-[#800020]/40 focus:bg-white"
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

              <option value="rating_desc">
                Highest rating
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
                <table className="w-full min-w-[1050px] text-left">
                  <thead className="border-b border-gray-200 bg-gray-50/80">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Tailor
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Skills
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Products
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Capacity
                      </th>

                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Availability
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
                    {tailors.map(
                      (tailor) => {
                        const skills =
                          Array.isArray(
                            tailor.skills,
                          )
                            ? tailor.skills
                            : [];

                        const assignedProducts =
                          Array.isArray(
                            tailor.assignedProducts,
                          )
                            ? tailor.assignedProducts
                            : [];

                        const capacity =
                          tailor.capacity ||
                          {};

                        return (
                          <tr
                            key={tailor._id}
                            className="transition hover:bg-[#800020]/[0.018]"
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                {tailor.photo ? (
                                  <img
                                    src={
                                      tailor.photo
                                    }
                                    alt={
                                      tailor.name ||
                                      "Tailor"
                                    }
                                    className="h-11 w-11 rounded-xl border border-gray-200 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#800020]/8 text-sm font-bold text-[#800020]">
                                    {getInitials(
                                      tailor.name,
                                    ) ||
                                      "T"}
                                  </div>
                                )}

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

                                  <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                                    <span>
                                      {tailor.tailorCode ||
                                        "No code"}
                                    </span>

                                    {tailor.mobile && (
                                      <>
                                        <span>
                                          •
                                        </span>

                                        <span>
                                          {
                                            tailor.mobile
                                          }
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex max-w-[240px] flex-wrap gap-1.5">
                                {skills.length >
                                0 ? (
                                  <>
                                    {skills
                                      .slice(0, 3)
                                      .map(
                                        (
                                          skill,
                                        ) => (
                                          <span
                                            key={
                                              skill
                                            }
                                            className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-600"
                                          >
                                            {formatLabel(
                                              skill,
                                            )}
                                          </span>
                                        ),
                                      )}

                                    {skills.length >
                                      3 && (
                                      <span className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-500">
                                        +
                                        {skills.length -
                                          3}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    No skills
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/tailors/${tailor._id}/products`,
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:border-[#800020]/20 hover:text-[#800020]"
                              >
                                <Shirt
                                  size={14}
                                />

                                {
                                  assignedProducts.length
                                }{" "}
                                Products
                              </button>
                            </td>

                            <td className="px-4 py-4">
                              <div className="text-xs text-gray-600">
                                <div>
                                  Daily:{" "}
                                  <span className="font-semibold text-gray-900">
                                    {capacity.daily ??
                                      tailor.dailyCapacity ??
                                      0}
                                  </span>
                                </div>

                                <div className="mt-1">
                                  Monthly:{" "}
                                  <span className="font-semibold text-gray-900">
                                    {capacity.monthly ??
                                      tailor.monthlyCapacity ??
                                      0}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={[
                                  "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",

                                  AVAILABILITY_STYLES[
                                    tailor.availability
                                  ] ||
                                    AVAILABILITY_STYLES.unavailable,
                                ].join(
                                  " ",
                                )}
                              >
                                {formatLabel(
                                  tailor.availability,
                                )}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={[
                                  "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",

                                  STATUS_STYLES[
                                    tailor.status
                                  ] ||
                                    STATUS_STYLES.inactive,
                                ].join(
                                  " ",
                                )}
                              >
                                {formatLabel(
                                  tailor.status,
                                )}
                              </span>
                            </td>

                            <td className="relative px-4 py-4">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  title="View tailor"
                                  onClick={() =>
                                    router.push(
                                      `/tailors/${tailor._id}`,
                                    )
                                  }
                                  className="rounded-lg p-2 text-gray-500 transition hover:bg-[#800020]/8 hover:text-[#800020]"
                                >
                                  <Eye
                                    size={17}
                                  />
                                </button>

                                <button
                                  type="button"
                                  title="Edit tailor"
                                  onClick={() =>
                                    router.push(
                                      `/tailors/${tailor._id}/edit`,
                                    )
                                  }
                                  className="rounded-lg p-2 text-gray-500 transition hover:bg-[#800020]/8 hover:text-[#800020]"
                                >
                                  <Pencil
                                    size={17}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenMenuId(
                                      (
                                        current,
                                      ) =>
                                        current ===
                                        tailor._id
                                          ? null
                                          : tailor._id,
                                    )
                                  }
                                  className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                                >
                                  <MoreVertical
                                    size={17}
                                  />
                                </button>
                              </div>

                              {openMenuId ===
                                tailor._id && (
                                <div className="absolute right-4 top-12 z-30 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(
                                        null,
                                      );

                                      router.push(
                                        `/tailors/${tailor._id}/products`,
                                      );
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
                                  >
                                    <BriefcaseBusiness
                                      size={
                                        15
                                      }
                                    />

                                    Manage
                                    Products
                                  </button>

                                  <div className="my-1 border-t border-gray-100" />

                                  {[
                                    "available",
                                    "busy",
                                    "on_leave",
                                    "unavailable",
                                  ].map(
                                    (
                                      availability,
                                    ) => (
                                      <button
                                        key={
                                          availability
                                        }
                                        type="button"
                                        onClick={() =>
                                          handleAvailabilityChange(
                                            tailor._id,
                                            availability,
                                          )
                                        }
                                        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
                                      >
                                        Mark{" "}
                                        {formatLabel(
                                          availability,
                                        )}
                                      </button>
                                    ),
                                  )}
                                </div>
                              )}
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
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition hover:border-[#800020]/20 hover:text-[#800020] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft
                      size={15}
                    />
                    Previous
                  </button>

                  <span className="min-w-20 text-center text-xs font-medium text-gray-600">
                    Page{" "}
                    {pagination.page || 1}{" "}
                    of{" "}
                    {pagination.totalPages ||
                      1}
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
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition hover:border-[#800020]/20 hover:text-[#800020] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight
                      size={15}
                    />
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