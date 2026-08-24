"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

import {
  AlertCircle,
  Boxes,
  Download,
  Hash,
  Package2,
  RefreshCcw,
  Search,
  ShoppingBag,
} from "lucide-react";

import { useAdminProductionStore } from "@/store/adminProductionStore";

const SIZES = ["XS", "S", "M", "L", "XL"];

const DEFAULT_FILTERS = {
  q: "",
  productCode: "",
  title: "",
  sku: "",
  size: "",
  color: "",
  orderNumber: "",
  from: "",
  to: "",
  sort: "qty_desc",
  limit: 25,
};

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const getSizeQty = (sizes = [], targetSize) =>
  (Array.isArray(sizes) ? sizes : []).reduce((total, item) => {
    const size = String(item?.size || "")
      .trim()
      .toUpperCase();

    return size === targetSize
      ? total + num(item?.qty)
      : total;
  }, 0);

function StatCard({ title, value, icon: Icon, hint }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {title}
          </p>

          <h3 className="mt-3 text-3xl font-semibold tracking-tight">
            {value}
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            {hint}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
      />
    </div>
  );
}

export default function ProductionJobPage() {
  const {
    productionJobs,
    productionJobSummary,
    productionJobPagination,
    productionJobFilters,

    loadingProductionJobs,
    error,

    setProductionJobFilters,
    resetProductionJobFilters,
    fetchProductionJobs,
  } = useAdminProductionStore();

  const initialFetchDone = useRef(false);

  const [refreshing, setRefreshing] = useState(false);

  const [draftFilters, setDraftFilters] = useState({
    ...DEFAULT_FILTERS,
    ...productionJobFilters,
    limit: productionJobFilters?.limit || 25,
  });

  /* =========================================================
     INITIAL LOAD — ONE REQUEST
  ========================================================= */

  useEffect(() => {
    if (initialFetchDone.current) return;

    initialFetchDone.current = true;

    fetchProductionJobs({
      ...productionJobFilters,
      page: 1,
      limit: productionJobFilters?.limit || 25,
      all: false,
    });
  }, []);

  const rows = Array.isArray(productionJobs)
    ? productionJobs
    : [];

  const summary = productionJobSummary || {};
  const pagination = productionJobPagination || {};

  /* =========================================================
     ACTIVE FILTER COUNT
  ========================================================= */

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (productionJobFilters?.q) count++;
    if (productionJobFilters?.productCode) count++;
    if (productionJobFilters?.title) count++;
    if (productionJobFilters?.sku) count++;
    if (productionJobFilters?.size) count++;
    if (productionJobFilters?.color) count++;
    if (productionJobFilters?.orderNumber) count++;
    if (productionJobFilters?.from) count++;
    if (productionJobFilters?.to) count++;

    if (
      productionJobFilters?.sort &&
      productionJobFilters.sort !== "qty_desc"
    ) {
      count++;
    }

    return count;
  }, [productionJobFilters]);

  /* =========================================================
     APPLY FILTERS
  ========================================================= */

  const handleApplyFilters = async () => {
    const filters = {
      ...draftFilters,
      page: 1,
      limit: Number(draftFilters.limit) || 25,
      all: false,
    };

    setProductionJobFilters(filters);

    await fetchProductionJobs(filters);
  };

  /* =========================================================
     RESET
  ========================================================= */

  const handleReset = async () => {
    setDraftFilters(DEFAULT_FILTERS);

    resetProductionJobFilters();

    await fetchProductionJobs({
      ...DEFAULT_FILTERS,
      page: 1,
      all: false,
    });
  };

  /* =========================================================
     REFRESH
  ========================================================= */

  const handleRefresh = async () => {
    if (loadingProductionJobs || refreshing) return;

    setRefreshing(true);

    try {
      await fetchProductionJobs({
        ...productionJobFilters,
        page: num(pagination?.page) || 1,
        limit: num(productionJobFilters?.limit) || 25,
        all: false,
      });
    } finally {
      setRefreshing(false);
    }
  };

  /* =========================================================
     PAGINATION
  ========================================================= */

  const handlePageChange = async (page) => {
    await fetchProductionJobs({
      ...productionJobFilters,
      page,
      limit: num(productionJobFilters?.limit) || 25,
      all: false,
    });
  };

  /* =========================================================
     EXCEL — CURRENT PAGE ONLY
     NO EXTRA API CALL
  ========================================================= */

  const handleDownloadExcel = () => {
    const excelRows = rows.map((row) => ({
      "Product Title": row?.productTitle || "",
      "Product Code": row?.productCode || "",
      SKU: row?.sku || "",

      XS: getSizeQty(row?.sizes, "XS"),
      S: getSizeQty(row?.sizes, "S"),
      M: getSizeQty(row?.sizes, "M"),
      L: getSizeQty(row?.sizes, "L"),
      XL: getSizeQty(row?.sizes, "XL"),

      Qty: num(row?.totalQty),
      Orders: num(row?.ordersCount),
      Reservations: num(row?.reservationsCount),

      "Order Numbers": Array.isArray(row?.orderNumbers)
        ? row.orderNumbers.join(", ")
        : "",
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);

    ws["!cols"] = [
      { wch: 38 },
      { wch: 16 },
      { wch: 24 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 45 },
    ];

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Production Jobs"
    );

    XLSX.writeFile(
      wb,
      "production-jobs.xlsx"
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-black">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8">

        {/* ================= HEADER ================= */}

        <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                <Package2 className="h-4 w-4" />
                Production Jobs
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Pending production queue
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                Pending reservations from confirmed orders,
                grouped by product code.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleRefresh}
                disabled={
                  loadingProductionJobs ||
                  refreshing
                }
                className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
              >
                <RefreshCcw
                  className={`h-4 w-4 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>

              <button
                onClick={handleDownloadExcel}
                disabled={!rows.length}
                className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Download Excel
              </button>
            </div>
          </div>
        </section>

        {/* ================= STATS ================= */}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Product Codes"
            value={num(
              summary?.totalProductCodes
            )}
            icon={Hash}
            hint="Filtered total"
          />

          <StatCard
            title="Qty To Produce"
            value={num(
              summary?.totalQtyToProduce
            )}
            icon={Boxes}
            hint="Pending quantity"
          />

          <StatCard
            title="Orders"
            value={num(
              summary?.totalOrdersCovered
            )}
            icon={ShoppingBag}
            hint="Confirmed orders"
          />

          <StatCard
            title="Reservations"
            value={num(
              summary?.totalReservations
            )}
            icon={Package2}
            hint="Pending reservation lines"
          />
        </div>

        {/* ================= FILTERS ================= */}

        <section className="mt-5 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

            <div>
              <h2 className="text-lg font-semibold">
                Filters
              </h2>

              <p className="text-sm text-zinc-500">
                Change filters, then click Apply Filters.
              </p>
            </div>

            <div className="flex items-center gap-2">

              <span className="rounded-full bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-600">
                Active: {activeFilterCount}
              </span>

              <button
                onClick={handleReset}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium hover:bg-zinc-50"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

            <FilterInput
              label="Global Search"
              value={draftFilters.q}
              placeholder="Anything..."
              onChange={(q) =>
                setDraftFilters((p) => ({
                  ...p,
                  q,
                }))
              }
            />

            <FilterInput
              label="Product Code"
              value={draftFilters.productCode}
              placeholder="00398"
              onChange={(productCode) =>
                setDraftFilters((p) => ({
                  ...p,
                  productCode,
                }))
              }
            />

            <FilterInput
              label="Product Title"
              value={draftFilters.title}
              placeholder="Product title"
              onChange={(title) =>
                setDraftFilters((p) => ({
                  ...p,
                  title,
                }))
              }
            />

            <FilterInput
              label="SKU"
              value={draftFilters.sku}
              placeholder="SKU"
              onChange={(sku) =>
                setDraftFilters((p) => ({
                  ...p,
                  sku,
                }))
              }
            />

            <FilterInput
              label="Order Number"
              value={draftFilters.orderNumber}
              placeholder="SHOP-..."
              onChange={(orderNumber) =>
                setDraftFilters((p) => ({
                  ...p,
                  orderNumber,
                }))
              }
            />

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Size
              </label>

              <select
                value={draftFilters.size}
                onChange={(e) =>
                  setDraftFilters((p) => ({
                    ...p,
                    size: e.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
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
              </select>
            </div>

            <FilterInput
              label="Color"
              value={draftFilters.color}
              placeholder="Black"
              onChange={(color) =>
                setDraftFilters((p) => ({
                  ...p,
                  color,
                }))
              }
            />

            <FilterInput
              label="From"
              type="date"
              value={draftFilters.from}
              onChange={(from) =>
                setDraftFilters((p) => ({
                  ...p,
                  from,
                }))
              }
            />

            <FilterInput
              label="To"
              type="date"
              value={draftFilters.to}
              onChange={(to) =>
                setDraftFilters((p) => ({
                  ...p,
                  to,
                }))
              }
            />

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Sort
              </label>

              <select
                value={draftFilters.sort}
                onChange={(e) =>
                  setDraftFilters((p) => ({
                    ...p,
                    sort: e.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="qty_desc">
                  Qty high to low
                </option>

                <option value="qty_asc">
                  Qty low to high
                </option>

                <option value="orders_desc">
                  Orders high to low
                </option>

                <option value="orders_asc">
                  Orders low to high
                </option>

                <option value="product_code_asc">
                  Product Code A-Z
                </option>

                <option value="product_code_desc">
                  Product Code Z-A
                </option>

                <option value="title_asc">
                  Title A-Z
                </option>

                <option value="title_desc">
                  Title Z-A
                </option>

                <option value="sku_asc">
                  SKU A-Z
                </option>

                <option value="sku_desc">
                  SKU Z-A
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Per Page
              </label>

              <select
                value={draftFilters.limit}
                onChange={(e) =>
                  setDraftFilters((p) => ({
                    ...p,
                    limit: Number(
                      e.target.value
                    ),
                  }))
                }
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleApplyFilters}
                disabled={loadingProductionJobs}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                <Search className="h-4 w-4" />

                {loadingProductionJobs
                  ? "Applying..."
                  : "Apply Filters"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </section>

        {/* ================= TABLE ================= */}

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1350px]">

              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  {[
                    "Product",
                    "Product Code",
                    "SKU",
                    "XS",
                    "S",
                    "M",
                    "L",
                    "XL",
                    "Qty",
                    "Orders",
                    "Reservations",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>

                {loadingProductionJobs ? (

                  Array.from({
                    length: 5,
                  }).map((_, index) => (

                    <tr
                      key={index}
                      className="border-b border-zinc-100"
                    >

                      {Array.from({
                        length: 11,
                      }).map((__, i) => (

                        <td
                          key={i}
                          className="px-4 py-4"
                        >
                          <div className="h-9 animate-pulse rounded-xl bg-zinc-100" />
                        </td>
                      ))}
                    </tr>
                  ))

                ) : !rows.length ? (

                  <tr>
                    <td
                      colSpan={11}
                      className="px-6 py-16 text-center"
                    >
                      <Package2 className="mx-auto h-8 w-8 text-zinc-300" />

                      <p className="mt-3 font-semibold">
                        No production jobs found
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        Try changing your filters.
                      </p>
                    </td>
                  </tr>

                ) : (

                  rows.map((row) => (

                    <tr
                      key={
                        row?.productCode ||
                        row?.sku
                      }
                      className="border-b border-zinc-100 hover:bg-zinc-50/70"
                    >

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">

                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100">

                            {row?.productImage ? (

                              <img
                                src={row.productImage}
                                alt={
                                  row?.productTitle ||
                                  "Product"
                                }
                                className="h-full w-full object-cover"
                              />

                            ) : (

                              <div className="flex h-full w-full items-center justify-center">
                                <Package2 className="h-5 w-5 text-zinc-400" />
                              </div>

                            )}
                          </div>

                          <p className="max-w-[260px] text-sm font-semibold">
                            {row?.productTitle ||
                              "Untitled"}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold">
                        {row?.productCode || "—"}
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-600">
                        {row?.sku || "—"}
                      </td>

                      {SIZES.map((size) => (
                        <td
                          key={size}
                          className="px-4 py-4 text-sm font-medium"
                        >
                          {getSizeQty(
                            row?.sizes,
                            size
                          )}
                        </td>
                      ))}

                      <td className="px-4 py-4 text-base font-bold">
                        {num(row?.totalQty)}
                      </td>

                      <td className="px-4 py-4">

                        <div className="flex flex-col gap-1">

                          <span className="text-sm font-semibold">
                            {num(
                              row?.ordersCount
                            )}{" "}
                            orders
                          </span>

                          <span className="max-w-[240px] truncate text-xs text-zinc-500">
                            {Array.isArray(
                              row?.orderNumbers
                            )
                              ? row.orderNumbers.join(
                                  ", "
                                )
                              : ""}
                          </span>

                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold">
                        {num(
                          row?.reservationsCount
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ================= PAGINATION ================= */}

          <div className="flex flex-col gap-3 border-t border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm text-zinc-500">
              Page{" "}
              <strong className="text-black">
                {num(pagination?.page) || 1}
              </strong>{" "}
              of{" "}
              <strong className="text-black">
                {num(pagination?.pages) || 1}
              </strong>
              {" · "}
              {num(pagination?.total)} products
            </p>

            <div className="flex gap-2">

              <button
                disabled={
                  loadingProductionJobs ||
                  num(pagination?.page) <= 1
                }
                onClick={() =>
                  handlePageChange(
                    Math.max(
                      1,
                      num(pagination?.page) - 1
                    )
                  )
                }
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-40"
              >
                Previous
              </button>

              <button
                disabled={
                  loadingProductionJobs ||
                  num(pagination?.page) >=
                    num(pagination?.pages)
                }
                onClick={() =>
                  handlePageChange(
                    num(pagination?.page) + 1
                  )
                }
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-40"
              >
                Next
              </button>

            </div>
          </div>
        </section>
      </div>
    </div>
  );
}