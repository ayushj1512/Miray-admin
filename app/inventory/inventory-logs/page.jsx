"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Package,
  Activity,
  X,
} from "lucide-react";

import { useInventoryReservationStore } from "@/store/inventoryReservationStore";

const SIZES = ["XS", "S", "M", "L", "XL"];

const EMPTY_SUMMARY = {
  totalLogs: 0,
  totalAdded: 0,
  totalSubtracted: 0,
  netMovement: 0,
};

const EMPTY_PAGINATION = {
  page: 1,
  limit: 50,
  total: 0,
  pages: 0,
  hasNext: false,
  hasPrev: false,
};

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN");

const formatDate = (value) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const getImage = (value) => {
  if (!value) return "";

  if (typeof value === "string") return value;

  return (
    value?.url ||
    value?.secure_url ||
    value?.src ||
    ""
  );
};

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            {label}
          </p>

          <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-950">
            {formatNumber(value)}
          </p>

          {sub && (
            <p className="mt-1 text-xs text-gray-400">
              {sub}
            </p>
          )}
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
          <Icon
            size={17}
            className="text-gray-500"
          />
        </div>
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
}) {
  return (
    <select
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
      className="h-10 rounded-lg bg-gray-50 px-3 text-xs font-medium text-gray-700 outline-none ring-1 ring-gray-200 transition focus:bg-white focus:ring-black"
    >
      {children}
    </select>
  );
}

export default function InventoryLogsPage() {
  const {
    inventoryLogs = [],
    inventoryLogsSummary = EMPTY_SUMMARY,
    inventoryLogsPagination = EMPTY_PAGINATION,
    inventoryLogsLoading,
    error,
    fetchInventoryLogs,
  } = useInventoryReservationStore();

  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({
    action: "",
    size: "",
    from: "",
    to: "",
    sort: "newest",
    limit: 50,
  });

  const fetchLogs = useCallback(
    async (page = 1, extra = {}) => {
      try {
        await fetchInventoryLogs({
          page,
          q: search.trim(),
          ...filters,
          ...extra,
        });
      } catch (error) {
        console.error(
          "Inventory logs:",
          error
        );
      }
    },
    [
      fetchInventoryLogs,
      search,
      filters,
    ]
  );

  /* Initial + filter changes */
  useEffect(() => {
    fetchLogs(1);
  }, [
    filters.action,
    filters.size,
    filters.from,
    filters.to,
    filters.sort,
    filters.limit,
  ]);

  /* Search debounce */
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(1);
    }, 450);

    return () => clearTimeout(timer);
  }, [search]);

  const updateFilter = (
    key,
    value
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setSearch("");

    setFilters({
      action: "",
      size: "",
      from: "",
      to: "",
      sort: "newest",
      limit: 50,
    });
  };

  const hasFilters =
    search ||
    filters.action ||
    filters.size ||
    filters.from ||
    filters.to ||
    filters.sort !== "newest" ||
    Number(filters.limit) !== 50;

  const page =
    inventoryLogsPagination?.page || 1;

  const pages =
    inventoryLogsPagination?.pages || 0;

  return (
    <main className="min-h-screen bg-[#f7f7f8]">
      <div className="mx-auto max-w-[1600px] p-4 md:p-6">

        {/* HEADER */}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400">
              Inventory
            </p>

            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-gray-950">
              Inventory Logs
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Physical stock movement history
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              fetchLogs(page)
            }
            disabled={inventoryLogsLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 text-xs font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={
                inventoryLogsLoading
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        {/* SUMMARY */}

        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Movements"
            value={
              inventoryLogsSummary.totalLogs
            }
            icon={Activity}
          />

          <StatCard
            label="Stock Added"
            value={
              inventoryLogsSummary.totalAdded
            }
            icon={ArrowUp}
            sub="Units added"
          />

          <StatCard
            label="Stock Removed"
            value={
              inventoryLogsSummary.totalSubtracted
            }
            icon={ArrowDown}
            sub="Units removed"
          />

          <StatCard
            label="Net Movement"
            value={
              inventoryLogsSummary.netMovement
            }
            icon={Package}
            sub="Added − removed"
          />
        </div>

        {/* FILTERS */}

        <div className="mb-4 rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/[0.04]">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">

            {/* SEARCH */}

            <div className="relative min-w-0 flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search product code, title, size or note..."
                className="h-10 w-full rounded-lg bg-gray-50 pl-9 pr-9 text-sm outline-none ring-1 ring-gray-200 transition placeholder:text-gray-400 focus:bg-white focus:ring-black"
              />

              {search && (
                <button
                  onClick={() =>
                    setSearch("")
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* ACTION */}

            <Select
              value={filters.action}
              onChange={(value) =>
                updateFilter(
                  "action",
                  value
                )
              }
            >
              <option value="">
                All Movements
              </option>
              <option value="add">
                Stock Added
              </option>
              <option value="subtract">
                Stock Removed
              </option>
            </Select>

            {/* SIZE */}

            <Select
              value={filters.size}
              onChange={(value) =>
                updateFilter(
                  "size",
                  value
                )
              }
            >
              <option value="">
                All Sizes
              </option>

              {SIZES.map((size) => (
                <option
                  key={size}
                  value={size}
                >
                  {size}
                </option>
              ))}
            </Select>

            {/* SORT */}

            <Select
              value={filters.sort}
              onChange={(value) =>
                updateFilter(
                  "sort",
                  value
                )
              }
            >
              <option value="newest">
                Newest
              </option>
              <option value="oldest">
                Oldest
              </option>
              <option value="qty_desc">
                Qty: High → Low
              </option>
              <option value="qty_asc">
                Qty: Low → High
              </option>
            </Select>

            {/* LIMIT */}

            <Select
              value={filters.limit}
              onChange={(value) =>
                updateFilter(
                  "limit",
                  Number(value)
                )
              }
            >
              <option value={25}>
                25 rows
              </option>
              <option value={50}>
                50 rows
              </option>
              <option value={100}>
                100 rows
              </option>
              <option value={200}>
                200 rows
              </option>
            </Select>

            {hasFilters && (
              <button
                onClick={resetFilters}
                className="h-10 whitespace-nowrap rounded-lg px-3 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-black"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* DATE */}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
              Date
            </span>

            <input
              type="date"
              value={filters.from}
              onChange={(e) =>
                updateFilter(
                  "from",
                  e.target.value
                )
              }
              className="h-9 rounded-lg bg-gray-50 px-3 text-xs outline-none ring-1 ring-gray-200 focus:bg-white focus:ring-black"
            />

            <span className="text-xs text-gray-400">
              to
            </span>

            <input
              type="date"
              value={filters.to}
              onChange={(e) =>
                updateFilter(
                  "to",
                  e.target.value
                )
              }
              className="h-9 rounded-lg bg-gray-50 px-3 text-xs outline-none ring-1 ring-gray-200 focus:bg-white focus:ring-black"
            />

            {(filters.from ||
              filters.to) && (
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    from: "",
                    to: "",
                  }))
                }
                className="text-xs font-medium text-gray-500 hover:text-black"
              >
                Clear date
              </button>
            )}
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* TABLE */}

        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">
                    Product
                  </th>

                  <th className="px-3 py-3">
                    Size
                  </th>

                  <th className="px-3 py-3">
                    Movement
                  </th>

                  <th className="px-3 py-3 text-center">
                    Qty
                  </th>

                  <th className="px-3 py-3 text-center">
                    Before
                  </th>

                  <th className="px-3 py-3 text-center">
                    After
                  </th>

                  <th className="px-3 py-3">
                    Source / Note
                  </th>

                  <th className="px-4 py-3 text-right">
                    Time
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {inventoryLogsLoading &&
                !inventoryLogs.length ? (
                  Array.from({
                    length: 8,
                  }).map((_, i) => (
                    <tr key={i}>
                      <td
                        colSpan={8}
                        className="px-4 py-2"
                      >
                        <div className="h-11 animate-pulse rounded-lg bg-gray-100" />
                      </td>
                    </tr>
                  ))
                ) : !inventoryLogs.length ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-20 text-center"
                    >
                      <Package
                        size={30}
                        className="mx-auto text-gray-300"
                      />

                      <p className="mt-3 text-sm font-medium text-gray-700">
                        No inventory logs
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Try changing your filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  inventoryLogs.map(
                    (log, index) => {
                      const isAdd =
                        log.action ===
                        "add";

                      const image =
                        getImage(
                          log.image
                        );

                      return (
                        <tr
                          key={
                            log._id ||
                            `${log.productId}-${index}`
                          }
                          className="transition hover:bg-gray-50/70"
                        >
                          {/* PRODUCT */}

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-11 w-9 shrink-0 overflow-hidden rounded-md bg-gray-100">
                                {image ? (
                                  <img
                                    src={
                                      image
                                    }
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <Package
                                      size={
                                        14
                                      }
                                      className="text-gray-300"
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-[260px] truncate text-sm font-medium text-gray-900">
                                  {log.title ||
                                    "Untitled"}
                                </p>

                                <p className="mt-0.5 font-mono text-[11px] text-gray-400">
                                  {log.productCode ||
                                    "—"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* SIZE */}

                          <td className="px-3 py-3">
                            <span className="inline-flex min-w-9 justify-center rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                              {log.size ||
                                "—"}
                            </span>
                          </td>

                          {/* ACTION */}

                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                isAdd
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {isAdd ? (
                                <ArrowUp
                                  size={
                                    11
                                  }
                                />
                              ) : (
                                <ArrowDown
                                  size={
                                    11
                                  }
                                />
                              )}

                              {isAdd
                                ? "Added"
                                : "Removed"}
                            </span>
                          </td>

                          {/* QTY */}

                          <td className="px-3 py-3 text-center">
                            <span
                              className={`text-sm font-bold ${
                                isAdd
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }`}
                            >
                              {isAdd
                                ? "+"
                                : "-"}
                              {formatNumber(
                                log.qty
                              )}
                            </span>
                          </td>

                          {/* BEFORE */}

                          <td className="px-3 py-3 text-center text-sm text-gray-500">
                            {formatNumber(
                              log.before
                            )}
                          </td>

                          {/* AFTER */}

                          <td className="px-3 py-3 text-center">
                            <span className="rounded-md bg-gray-100 px-2 py-1 text-sm font-semibold text-gray-900">
                              {formatNumber(
                                log.after
                              )}
                            </span>
                          </td>

                          {/* NOTE */}

                          <td className="px-3 py-3">
                            <p className="max-w-[260px] truncate text-xs text-gray-600">
                              {log.note ||
                                "—"}
                            </p>
                          </td>

                          {/* TIME */}

                          <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-gray-500">
                            {formatDate(
                              log.at
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}

          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-gray-500">
              <span className="font-medium text-gray-900">
                {formatNumber(
                  inventoryLogsPagination.total
                )}
              </span>{" "}
              movements
              {pages > 0 && (
                <>
                  {" "}
                  • Page{" "}
                  <span className="font-medium text-gray-900">
                    {page}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-900">
                    {pages}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={
                  !inventoryLogsPagination.hasPrev ||
                  inventoryLogsLoading
                }
                onClick={() =>
                  fetchLogs(
                    page - 1
                  )
                }
                className="inline-flex h-9 items-center gap-1 rounded-lg bg-gray-100 px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft
                  size={14}
                />
                Previous
              </button>

              <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-black px-3 text-xs font-semibold text-white">
                {page}
              </div>

              <button
                disabled={
                  !inventoryLogsPagination.hasNext ||
                  inventoryLogsLoading
                }
                onClick={() =>
                  fetchLogs(
                    page + 1
                  )
                }
                className="inline-flex h-9 items-center gap-1 rounded-lg bg-gray-100 px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight
                  size={14}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}