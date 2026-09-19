"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Boxes,
  Search,
  RefreshCw,
  PackageCheck,
  PackageOpen,
  BookmarkCheck,
  X,
} from "lucide-react";

import { useAdminProductStore } from "@/store/adminProductStore";

const SIZES = ["XS", "S", "M", "L", "XL"];

/* ============================================================
   HELPERS
============================================================ */

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeSize = (value = "") =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

const getImageUrl = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return (
    value?.url ||
    value?.secure_url ||
    value?.src ||
    value?.path ||
    ""
  );
};

/* ============================================================
   PAGE
============================================================ */

export default function InHandInventoryPage() {
  const {
    inventorySummary,
    inventorySummaryRows,
    inventorySummaryLoading,
    inventorySummaryError,
    fetchInventoryInHandSummary,
  } = useAdminProductStore();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [category, setCategory] = useState("");

  /* ============================================================
     SEARCH DEBOUNCE
  ============================================================ */

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /* ============================================================
     FETCH INVENTORY
  ============================================================ */

  const loadInventory = useCallback(() => {
    fetchInventoryInHandSummary({
      q: debouncedSearch,
      category,
    });
  }, [
    debouncedSearch,
    category,
    fetchInventoryInHandSummary,
  ]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  /* ============================================================
     GROUP VARIANTS INTO PRODUCTS
  ============================================================ */

  const products = useMemo(() => {
    const map = new Map();

    for (const row of inventorySummaryRows || []) {
      const productId = String(
        row?.productId ||
          row?._id ||
          row?.productCode ||
          ""
      );

      if (!productId) continue;

      if (!map.has(productId)) {
        map.set(productId, {
          productId,
          productCode: row?.productCode || "",
          title: row?.title || "Untitled Product",
          image: getImageUrl(row?.image),
          category: row?.category || "",

          physical: 0,
          reserved: 0,
          available: 0,

          sizes: SIZES.reduce((acc, size) => {
            acc[size] = {
              physical: 0,
              reserved: 0,
              available: 0,
            };

            return acc;
          }, {}),
        });
      }

      const product = map.get(productId);

      const physical = num(row?.physical);
      const reserved = num(row?.reserved);
      const available = num(row?.available);

      product.physical += physical;
      product.reserved += reserved;
      product.available += available;

      const size = normalizeSize(row?.size);

      if (SIZES.includes(size)) {
        product.sizes[size].physical += physical;
        product.sizes[size].reserved += reserved;
        product.sizes[size].available += available;
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      String(a.productCode).localeCompare(
        String(b.productCode),
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        }
      )
    );
  }, [inventorySummaryRows]);

  /* ============================================================
     CATEGORY OPTIONS
  ============================================================ */

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        (inventorySummaryRows || [])
          .map((row) =>
            String(row?.category || "").trim()
          )
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [inventorySummaryRows]);

  /* ============================================================
     CLEAR FILTERS
  ============================================================ */

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategory("");
  };

  const hasFilters = Boolean(search || category);

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="mx-auto max-w-[1700px] p-4 md:p-6">
        {/* HEADER */}

        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-gray-700" />

              <h1 className="text-xl font-semibold tracking-tight text-gray-950 md:text-2xl">
                In-Hand Inventory
              </h1>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Physical, available and reserved stock by
              size.
            </p>
          </div>

          <button
            type="button"
            onClick={loadInventory}
            disabled={inventorySummaryLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                inventorySummaryLoading
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>
        </div>

        {/* SUMMARY */}

        <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <SummaryCard
            label="In Hand"
            value={inventorySummary?.totalPhysical}
            sub="Physical stock"
            icon={Boxes}
          />

          <SummaryCard
            label="Available"
            value={inventorySummary?.totalAvailable}
            sub="Ready to sell"
            icon={PackageCheck}
          />

          <SummaryCard
            label="Reserved"
            value={inventorySummary?.totalReserved}
            sub="Reserved for orders"
            icon={BookmarkCheck}
          />

          <SummaryCard
            label="Products"
            value={inventorySummary?.totalProducts}
            sub={`${num(
              inventorySummary?.productsOutOfStock
            )} out of stock`}
            icon={PackageOpen}
          />
        </div>

        {/* FILTER BAR */}

        <div className="mb-4 rounded-2xl bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            {/* SEARCH */}

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search title, product code, SKU or size..."
                className="h-10 w-full rounded-xl bg-gray-50 pl-10 pr-10 text-sm text-gray-900 outline-none ring-1 ring-inset ring-gray-200 transition placeholder:text-gray-400 focus:bg-white focus:ring-gray-400"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-black"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* CATEGORY */}

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              className="h-10 min-w-[200px] rounded-xl bg-gray-50 px-3 text-sm text-gray-700 outline-none ring-1 ring-inset ring-gray-200 focus:bg-white focus:ring-gray-400"
            >
              <option value="">All Categories</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {/* CLEAR */}

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-10 rounded-xl px-4 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-black"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {/* TABLE HEADER */}

          <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Inventory by Size
              </h2>

              <p className="mt-0.5 text-xs text-gray-400">
                {products.length} products
              </p>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <Legend
                className="bg-gray-900"
                label="Physical"
              />

              <Legend
                className="bg-emerald-500"
                label="Available"
              />

              <Legend
                className="bg-amber-500"
                label="Reserved"
              />
            </div>
          </div>

          {/* ERROR */}

          {inventorySummaryError && (
            <div className="m-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {inventorySummaryError}
            </div>
          )}

          {/* TABLE */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Product
                  </th>

                {SIZES.map((size) => (
  <th
    key={size}
    className="w-[118px] px-2 py-3 text-center"
  >
    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
      {size}
    </span>
  </th>
))}

                  <TotalHeader
                    title="In Hand"
                    sub="Physical"
                  />

                  <TotalHeader
                    title="Available"
                    sub="Sellable"
                  />

                  <TotalHeader
                    title="Reserved"
                    sub="Orders"
                  />
                </tr>
              </thead>

              <tbody>
                {inventorySummaryLoading &&
                  !products.length && (
                    <LoadingRows />
                  )}

                {!inventorySummaryLoading &&
                  products.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-20 text-center"
                      >
                        <PackageOpen className="mx-auto mb-3 h-8 w-8 text-gray-200" />

                        <p className="text-sm font-medium text-gray-700">
                          No inventory found
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Try changing your search or
                          category.
                        </p>
                      </td>
                    </tr>
                  )}

                {products.map((product) => (
                  <tr
                    key={product.productId}
                    className="border-t border-gray-100 transition hover:bg-gray-50/50"
                  >
                    {/* PRODUCT */}

                    <td className="px-4 py-3">
                      <div className="flex min-w-[310px] items-center gap-3">
                        <ProductImage
                          src={product.image}
                          title={product.title}
                        />

                        <div className="min-w-0">
                          <p className="max-w-[310px] truncate text-sm font-medium text-gray-950">
                            {product.title}
                          </p>

                          <div className="mt-1 flex items-center gap-2">
                            <span className="font-mono text-[11px] font-medium text-gray-500">
                              {product.productCode ||
                                "NO-CODE"}
                            </span>

                            {product.category && (
                              <>
                                <span className="text-gray-300">
                                  •
                                </span>

                                <span className="max-w-[140px] truncate text-[11px] text-gray-400">
                                  {product.category}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* SIZES */}

                    {SIZES.map((size) => (
                      <td
                        key={size}
                        className="px-2 py-3 text-center"
                      >
                        <StockCell
                          stock={
                            product.sizes[size]
                          }
                        />
                      </td>
                    ))}

                    {/* TOTAL PHYSICAL */}

                    <td className="px-3 py-3 text-center">
                      <TotalValue
                        value={product.physical}
                        type="physical"
                      />
                    </td>

                    {/* TOTAL AVAILABLE */}

                    <td className="px-3 py-3 text-center">
                      <TotalValue
                        value={product.available}
                        type="available"
                      />
                    </td>

                    {/* TOTAL RESERVED */}

                    <td className="px-3 py-3 text-center">
                      <TotalValue
                        value={product.reserved}
                        type="reserved"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SIZE CELL
============================================================ */

function StockCell({ stock }) {
  const physical = num(stock?.physical);
  const available = num(stock?.available);
  const reserved = num(stock?.reserved);

  const empty = physical === 0 && reserved === 0;

  return (
    <div
      className={`mx-auto flex h-[92px] w-[92px] flex-col overflow-hidden rounded-2xl ring-1 ring-inset ${
        empty
          ? "bg-gray-50 ring-gray-100"
          : available === 0
            ? "bg-red-50/60 ring-red-100"
            : "bg-white ring-gray-200"
      }`}
    >
      {/* AVAILABLE */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <span
          className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${
            available === 0 && !empty
              ? "text-red-400"
              : "text-gray-400"
          }`}
        >
          Available
        </span>

        <span
          className={`mt-0.5 text-[26px] font-bold leading-none tabular-nums ${
            empty
              ? "text-gray-300"
              : available === 0
                ? "text-red-600"
                : "text-gray-950"
          }`}
        >
          {available}
        </span>
      </div>

      {/* BREAKUP */}
      <div className="grid grid-cols-2 border-t border-gray-100">
        <div className="py-1.5 text-center">
          <div className="text-[8px] font-medium uppercase tracking-wide text-gray-400">
            In Hand
          </div>

          <div className="mt-0.5 text-[11px] font-semibold tabular-nums text-gray-700">
            {physical}
          </div>
        </div>

        <div className="border-l border-gray-100 py-1.5 text-center">
          <div className="text-[8px] font-medium uppercase tracking-wide text-gray-400">
            Reserved
          </div>

          <div
            className={`mt-0.5 text-[11px] font-semibold tabular-nums ${
              reserved > 0
                ? "text-amber-600"
                : "text-gray-300"
            }`}
          >
            {reserved}
          </div>
        </div>
      </div>
    </div>
  );
}
/* ============================================================
   TOTAL VALUE
============================================================ */

function TotalValue({ value, type }) {
  const count = num(value);

  const classes = {
    physical: "text-gray-950",
    available:
      count > 0
        ? "text-emerald-600"
        : "text-gray-300",
    reserved:
      count > 0
        ? "text-amber-600"
        : "text-gray-300",
  };

  return (
    <span
      className={`text-sm font-semibold tabular-nums ${
        classes[type] || "text-gray-900"
      }`}
    >
      {count}
    </span>
  );
}

/* ============================================================
   PRODUCT IMAGE
============================================================ */

function ProductImage({ src, title }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-14 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100">
        <PackageOpen className="h-4 w-4 text-gray-300" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title || "Product"}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-14 w-11 shrink-0 rounded-lg bg-gray-100 object-cover"
    />
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-950 md:text-3xl">
            {num(value).toLocaleString("en-IN")}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {sub}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50">
          <Icon className="h-4 w-4 text-gray-600" />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TABLE HEADER
============================================================ */

function TotalHeader({ title, sub }) {
  return (
    <th className="w-[105px] px-3 py-3 text-center">
      <div className="text-xs font-semibold text-gray-900">
        {title}
      </div>

      <div className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-gray-400">
        {sub}
      </div>
    </th>
  );
}

/* ============================================================
   LEGEND
============================================================ */

function Legend({ className, label }) {
  return (
    <div className="flex items-center gap-1.5 text-gray-500">
      <span
        className={`h-1.5 w-1.5 rounded-full ${className}`}
      />

      <span>{label}</span>
    </div>
  );
}

/* ============================================================
   LOADING
============================================================ */

function LoadingRows() {
  return Array.from({ length: 7 }).map((_, index) => (
    <tr
      key={index}
      className="border-t border-gray-100"
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-14 w-11 animate-pulse rounded-lg bg-gray-100" />

          <div>
            <div className="h-3 w-48 animate-pulse rounded bg-gray-100" />
            <div className="mt-2 h-2.5 w-24 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </td>

      {Array.from({ length: 8 }).map((__, i) => (
        <td key={i} className="px-3 py-4">
          <div className="mx-auto h-7 w-10 animate-pulse rounded bg-gray-100" />
        </td>
      ))}
    </tr>
  ));
}