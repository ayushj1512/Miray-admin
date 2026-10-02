"use client";

import {

  useCallback,

  useEffect,

  useMemo,

  useState,

} from "react";

import {

  Activity,

  ArrowDownRight,

  ArrowUpRight,

  BarChart3,

  CalendarDays,

  CheckCircle2,

  CheckSquare2,

  ChevronLeft,

  ChevronRight,

  Download,

  IndianRupee,

  Loader2,

  Package,

  PackageCheck,

  RefreshCcw,

  RotateCcw,

  Search,

  ShoppingBag,

  Sparkles,

  Square,

  TrendingDown,

  Truck,

  Trophy,

  X,

  XCircle,

} from "lucide-react";

import { useAdminProductStore } from "@/store/adminProductStore";

import * as XLSX from "xlsx";

/* ============================================================

   CONFIG

\============================================================ */

const DURATIONS = [

  { label: "7D", value: 7 },

  { label: "30D", value: 30 },

  { label: "60D", value: 60 },

  { label: "90D", value: 90 },

];

const SORT_OPTIONS = [

  {

    label: "Most Units Sold",

    value: "units_desc",

  },

  {

    label: "Least Units Sold",

    value: "units_asc",

  },

  {

    label: "Most Orders",

    value: "orders_desc",

  },

  {

    label: "Least Orders",

    value: "orders_asc",

  },

  {

    label: "Highest Sales",

    value: "revenue_desc",

  },

  {

    label: "Lowest Sales",

    value: "revenue_asc",

  },

  {

    label: "Most Delivered",

    value: "delivered_desc",

  },

  {

    label: "Most RTO",

    value: "rto_desc",

  },

  {

    label: "Most Cancelled",

    value: "cancelled_desc",

  },

  {

    label: "Product Code A-Z",

    value: "code_asc",

  },

  {

    label: "Product Code Z-A",

    value: "code_desc",

  },

];

/* ============================================================

   HELPERS

\============================================================ */

const number = (value) =>

  new Intl.NumberFormat("en-IN").format(

    Number(value || 0)

  );

const money = (value) =>

  new Intl.NumberFormat("en-IN", {

    style: "currency",

    currency: "INR",

    maximumFractionDigits: 0,

  }).format(Number(value || 0));

const formatDate = (value) => {

  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {

    return "—";

  }

  return date.toLocaleDateString("en-IN", {

    day: "2-digit",

    month: "short",

    year: "numeric",

  });

};

const getProductImage = (product) => {

  const thumbnail =

    product?.thumbnail ||

    product?.product?.thumbnail;

  if (typeof thumbnail === "string") {

    return thumbnail;

  }

  if (

    thumbnail &&

    typeof thumbnail === "object"

  ) {

    return (

      thumbnail.url ||

      thumbnail.src ||

      thumbnail.secure_url ||

      ""

    );

  }

  const firstImage =

    product?.product?.images?.[0] ||

    product?.images?.[0];

  if (typeof firstImage === "string") {

    return firstImage;

  }

  if (

    firstImage &&

    typeof firstImage === "object"

  ) {

    return (

      firstImage.url ||

      firstImage.src ||

      firstImage.secure_url ||

      ""

    );

  }

  return "";

};

const getCategory = (product) =>
  product?.category?.name ||
  product?.category ||
  product?.product?.category?.name ||
  product?.product?.category ||
  "";

const getSubcategory = (product) =>
  product?.subcategory?.name ||
  product?.subCategory?.name ||
  product?.subcategory ||
  product?.subCategory ||
  product?.product?.subcategory?.name ||
  product?.product?.subCategory?.name ||
  product?.product?.subcategory ||
  product?.product?.subCategory ||
  "";

const getRowKey = (product) =>
  String(
    product?.productId ||
      product?._id ||
      product?.productCode ||
      product?.sku ||
      ""
  );

const getInitials = (title = "") =>

  String(title)

    .trim()

    .split(/\s+/)

    .slice(0, 2)

    .map((word) => word[0])

    .join("")

    .toUpperCase() || "P";

/* ============================================================

   STAT CARD

\============================================================ */

function StatCard({

  title,

  value,

  subtitle,

  icon: Icon,

  accent = false,

}) {

  return (

    <div

      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 ${

        accent

          ? "border-black bg-black text-white"

          : "border-zinc-200 bg-white text-zinc-950"

      }`}

    >

      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0">

          <p

            className={`text-[10px] font-bold uppercase tracking-[0.12em] ${

              accent

                ? "text-zinc-400"

                : "text-zinc-500"

            }`}

          >

            {title}

          </p>

          <p className="mt-2 truncate text-xl font-bold tracking-tight sm:text-2xl">

            {value}

          </p>

          {subtitle ? (

            <p

              className={`mt-1 text-[11px] ${

                accent

                  ? "text-zinc-400"

                  : "text-zinc-500"

              }`}

            >

              {subtitle}

            </p>

          ) : null}

        </div>

        <div

          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${

            accent

              ? "bg-white/10"

              : "bg-zinc-100"

          }`}

        >

          <Icon size={18} />

        </div>

      </div>

      {accent ? (

        <>

          <div className="absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-white/5" />

          <div className="absolute -right-2 -top-8 h-20 w-20 rounded-full bg-white/5" />

        </>

      ) : null}

    </div>

  );

}

/* ============================================================

   PRODUCT AVATAR

\============================================================ */

function ProductAvatar({

  product,

  size = "md",

}) {

  const image = getProductImage(product);

  const sizeClass =

    size === "lg"

      ? "h-14 w-14 sm:h-16 sm:w-16"

      : "h-11 w-11";

  if (image) {

    return (

      <img

        src={image}

        alt={product?.title || "Product"}

        className={`${sizeClass} shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 object-cover`}

      />

    );

  }

  return (

    <div

      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-xs font-bold text-zinc-500`}

    >

      {getInitials(product?.title)}

    </div>

  );

}

/* ============================================================

   EMPTY STATE

\============================================================ */

function EmptyState() {

  return (

    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">

        <BarChart3

          className="text-zinc-500"

          size={24}

        />

      </div>

      <h3 className="mt-4 text-base font-semibold text-zinc-900">

        No sales found

      </h3>

      <p className="mt-1 max-w-sm text-sm text-zinc-500">

        No Shopify product sales matched the

        selected order period or search.

      </p>

    </div>

  );

}

/* ============================================================

   HIGHLIGHT CARD

\============================================================ */

function HighlightCard({

  title,

  subtitle,

  icon: Icon,

  products = [],

  type = "top",

}) {

  return (

    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">

      <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-4 sm:px-5">

        <div

          className={`flex h-10 w-10 items-center justify-center rounded-xl ${

            type === "top"

              ? "bg-black text-white"

              : "bg-zinc-100 text-zinc-700"

          }`}

        >

          <Icon size={18} />

        </div>

        <div>

          <h2 className="text-sm font-bold text-zinc-950">

            {title}

          </h2>

          <p className="text-xs text-zinc-500">

            {subtitle}

          </p>

        </div>

      </div>

      <div className="divide-y divide-zinc-100">

        {products.length ? (

          products.map(

            (product, index) => (

              <div

                key={

                  product?.productId ||

                  product?._id ||

                  `${product?.productCode}-${index}`

                }

                className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-zinc-50 sm:px-5"

              >

                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-bold text-zinc-600">

                  {index + 1}

                </div>

                <ProductAvatar

                  product={product}

                />

                <div className="min-w-0 flex-1">

                  <p className="truncate text-sm font-semibold text-zinc-900">

                    {product?.title ||

                      "Untitled Product"}

                  </p>

                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-zinc-500">

                    <span>

                      {product?.productCode ||

                        "No code"}

                    </span>

                    <span>•</span>

                    <span>

                      {number(

                        product?.totalOrders

                      )}{" "}

                      orders

                    </span>

                  </div>

                </div>

                <div className="text-right">

                  <div className="flex items-center justify-end gap-1">

                    {type === "top" ? (

                      <ArrowUpRight

                        size={13}

                      />

                    ) : (

                      <ArrowDownRight

                        size={13}

                      />

                    )}

                    <span className="text-sm font-bold text-zinc-950">

                      {number(

                        product?.totalUnits

                      )}

                    </span>

                  </div>

                  <p className="text-[10px] uppercase tracking-wide text-zinc-400">

                    units

                  </p>

                  <p className="mt-0.5 text-[10px] font-semibold text-zinc-500">

                    {money(

                      product?.grossSales

                    )}

                  </p>

                </div>

              </div>

            )

          )

        ) : (

          <div className="px-5 py-12 text-center text-sm text-zinc-500">

            No sales data

          </div>

        )}

      </div>

    </section>

  );

}

/* ============================================================

   SMALL STATUS METRIC

\============================================================ */

function MiniMetric({

  label,

  value,

  icon: Icon,

}) {

  return (

    <div className="rounded-xl bg-zinc-50 p-2.5">

      <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-400">

        {Icon ? <Icon size={11} /> : null}

        {label}

      </div>

      <p className="mt-1 text-sm font-bold text-zinc-900">

        {number(value)}

      </p>

    </div>

  );

}

/* ============================================================

   MOBILE PRODUCT CARD

\============================================================ */

function MobileProductCard({

  product,

  index,
  selected = false,
  onToggle,

}) {

  return (

    <div className="border-b border-zinc-100 p-4 last:border-b-0">

      <div className="flex gap-3">

        <ProductAvatar

          product={product}

          size="lg"

        />

        <div className="min-w-0 flex-1">

          <div className="flex items-start justify-between gap-2">

            <div className="min-w-0">

              <p className="truncate text-sm font-bold text-zinc-950">

                {product?.title ||

                  "Untitled Product"}

              </p>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">

                <span className="font-semibold">

                  {product?.productCode ||

                    "—"}

                </span>

                {product?.sku ? (

                  <>

                    <span>•</span>

                    <span>

                      {product.sku}

                    </span>

                  </>

                ) : null}

              </div>

            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={onToggle} className="text-zinc-500">
                {selected ? <CheckSquare2 size={17} className="text-black" /> : <Square size={17} />}
              </button>
              <span className="rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-500">
                #{index}
              </span>
            </div>

          </div>

          {/* Main metrics */}

          <div className="mt-3 grid grid-cols-3 gap-2">

            <div className="rounded-xl bg-black p-2.5 text-white">

              <p className="text-[10px] text-zinc-400">

                Units

              </p>

              <p className="mt-0.5 text-base font-bold">

                {number(

                  product?.totalUnits

                )}

              </p>

            </div>

            <div className="rounded-xl bg-zinc-50 p-2.5">

              <p className="text-[10px] text-zinc-400">

                Orders

              </p>

              <p className="mt-0.5 text-base font-bold">

                {number(

                  product?.totalOrders

                )}

              </p>

            </div>

            <div className="rounded-xl bg-zinc-50 p-2.5">

              <p className="text-[10px] text-zinc-400">

                Gross Sales

              </p>

              <p className="mt-0.5 truncate text-sm font-bold">

                {money(

                  product?.grossSales

                )}

              </p>

            </div>

          </div>

          {/* Fulfilment metrics */}

          <div className="mt-2 grid grid-cols-3 gap-2">

            <MiniMetric

              label="Delivered"

              value={

                product?.deliveredUnits

              }

              icon={CheckCircle2}

            />

            <MiniMetric

              label="Cancelled"

              value={

                product?.cancelledUnits

              }

              icon={XCircle}

            />

            <MiniMetric

              label="RTO"

              value={product?.rtoUnits}

              icon={RotateCcw}

            />

          </div>

          <div className="mt-2 grid grid-cols-3 gap-2">

            <MiniMetric

              label="Processing"

              value={

                product?.processingUnits

              }

            />

            <MiniMetric

              label="Shipped"

              value={

                product?.shippedUnits

              }

              icon={Truck}

            />

            <MiniMetric

              label="Returns"

              value={

                product?.returnUnits

              }

              icon={RotateCcw}

            />

          </div>

          {/* Sales */}

          <div className="mt-3 flex items-center justify-between rounded-xl border border-zinc-100 px-3 py-2.5">

            <div>

              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">

                Active Sales

              </p>

              <p className="mt-0.5 text-sm font-bold text-zinc-900">

                {money(

                  product?.activeSales

                )}

              </p>

            </div>

            <div className="text-right">

              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">

                Active Units

              </p>

              <p className="mt-0.5 text-sm font-bold text-zinc-900">

                {number(

                  product?.activeUnits

                )}

              </p>

            </div>

          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400">

            <span>

              Uploaded{" "}

              {formatDate(

                product?.uploadedAt

              )}

            </span>

            {product?.currentPrice ? (

              <span>

                Current{" "}

                {money(

                  product.currentPrice

                )}

              </span>

            ) : null}

          </div>

        </div>

      </div>

    </div>

  );

}

/* ============================================================

   PAGE

\============================================================ */

export default function ProductPerformancePage() {

  const {

    fetchProductPerformanceReport,

    productPerformanceProducts,

    productPerformanceSummary,

    productPerformanceHighlights,

    productPerformancePagination,

    productPerformanceLoading,

    productPerformanceError,

  } = useAdminProductStore();

  /* ============================================================

     FILTER STATE

  ============================================================ */

  const [days, setDays] = useState(30);

  const [

    customRange,

    setCustomRange,

  ] = useState(false);

  const [from, setFrom] = useState("");

  const [to, setTo] = useState("");

  const [

    searchInput,

    setSearchInput,

  ] = useState("");

  const [search, setSearch] =

    useState("");

  const [nameInput, setNameInput] = useState("");
  const [productName, setProductName] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [productCode, setProductCode] = useState("");
  const [skuInput, setSkuInput] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");

  // Map keeps selected row data even after changing pages.
  const [selectedRows, setSelectedRows] = useState(() => new Map());

  const [sort, setSort] =

    useState("units_desc");

  const [page, setPage] =

    useState(1);

  const limit = 50;

  /* ============================================================

     LOAD REPORT

  ============================================================ */

  const loadReport = useCallback(

    async (targetPage = page) => {

      const params = {

        sort,

        page: targetPage,

        limit,

      };

      if (customRange) {

        if (from) {

          params.from = from;

        }

        if (to) {

          params.to = to;

        }

      } else {

        params.days = days;

      }

      if (search) {

        params.search = search;

      }

      if (productName) params.productName = productName;
      if (productCode) params.productCode = productCode;
      if (sku) params.sku = sku;
      if (category) params.category = category;
      if (subcategory) params.subcategory = subcategory;

      await fetchProductPerformanceReport(

        params

      );

    },

    [

      days,

      customRange,

      from,

      to,

      search,
      productName,
      productCode,
      sku,
      category,
      subcategory,

      sort,

      page,

      fetchProductPerformanceReport,

    ]

  );

  useEffect(() => {

    loadReport(page);

  }, [loadReport, page]);

  /* ============================================================

     SEARCH DEBOUNCE

  ============================================================ */

  useEffect(() => {

    const timer = setTimeout(() => {

      setPage(1);

      setSearch(

        searchInput.trim()

      );

    }, 450);

    return () =>

      clearTimeout(timer);

  }, [searchInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setProductName(nameInput.trim());
      setProductCode(codeInput.trim());
      setSku(skuInput.trim());
    }, 450);

    return () => clearTimeout(timer);
  }, [nameInput, codeInput, skuInput]);

  /* ============================================================

     DATA

  ============================================================ */

  const products = Array.isArray(

    productPerformanceProducts

  )

    ? productPerformanceProducts

    : [];

  const categoryOptions = useMemo(
    () =>
      [...new Set(products.map(getCategory).filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b))
      ),
    [products]
  );

  const subcategoryOptions = useMemo(
    () =>
      [...new Set(
        products
          .filter((product) => !category || getCategory(product) === category)
          .map(getSubcategory)
          .filter(Boolean)
      )].sort((a, b) => String(a).localeCompare(String(b))),
    [products, category]
  );

  const pageKeys = useMemo(
    () => products.map(getRowKey).filter(Boolean),
    [products]
  );

  const allPageSelected =
    pageKeys.length > 0 && pageKeys.every((key) => selectedRows.has(key));

  const selectedCount = selectedRows.size;

  const summary =

    productPerformanceSummary || {};

  const highlights =

    productPerformanceHighlights || {

      mostSold: [],

      leastSold: [],

    };

  const pagination =

    productPerformancePagination || {

      page: 1,

      pages: 0,

      total: 0,

      limit,

    };

  const hasFilters =

    Boolean(search) ||
    Boolean(productName) ||
    Boolean(productCode) ||
    Boolean(sku) ||
    Boolean(category) ||
    Boolean(subcategory) ||

    customRange ||

    days !== 30 ||

    sort !== "units_desc";

  const periodLabel = useMemo(() => {

    if (customRange) {

      if (from && to) {

        return `${formatDate(

          from

        )} – ${formatDate(to)}`;

      }

      if (from) {

        return `From ${formatDate(

          from

        )}`;

      }

      if (to) {

        return `Until ${formatDate(

          to

        )}`;

      }

      return "Custom order range";

    }

    return `Last ${days} days sales`;

  }, [

    customRange,

    from,

    to,

    days,

  ]);

  /* ============================================================

     ACTIONS

  ============================================================ */

  const handleRefresh = () => {

    loadReport(page);

  };

  const toggleRow = (product) => {
    const key = getRowKey(product);
    if (!key) return;

    setSelectedRows((previous) => {
      const next = new Map(previous);
      if (next.has(key)) next.delete(key);
      else next.set(key, product);
      return next;
    });
  };

  const toggleCurrentPage = () => {
    setSelectedRows((previous) => {
      const next = new Map(previous);
      if (allPageSelected) {
        products.forEach((product) => next.delete(getRowKey(product)));
      } else {
        products.forEach((product) => {
          const key = getRowKey(product);
          if (key) next.set(key, product);
        });
      }
      return next;
    });
  };

  const exportProducts = (rows, scopeLabel) => {
    if (!rows.length) return;

    const data = rows.map((product, index) => ({
      "S.No": index + 1,
      "Product Name": product?.title || "",
      "Product Code": product?.productCode || "",
      SKU: product?.sku || "",
      Category: getCategory(product),
      Subcategory: getSubcategory(product),
      "Current Price": Number(product?.currentPrice || 0),
      "Total Orders": Number(product?.totalOrders || 0),
      "Total Units": Number(product?.totalUnits || 0),
      "Gross Sales": Number(product?.grossSales || 0),
      "Active Units": Number(product?.activeUnits || 0),
      "Active Sales": Number(product?.activeSales || 0),
      "Delivered Units": Number(product?.deliveredUnits || 0),
      "Delivered Sales": Number(product?.deliveredSales || 0),
      "Processing Units": Number(product?.processingUnits || 0),
      "Shipped Units": Number(product?.shippedUnits || 0),
      "Cancelled Units": Number(product?.cancelledUnits || 0),
      "RTO Units": Number(product?.rtoUnits || 0),
      "Return Units": Number(product?.returnUnits || 0),
      "Uploaded At": product?.uploadedAt ? formatDate(product.uploadedAt) : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet["!autofilter"] = { ref: worksheet["!ref"] };
    worksheet["!cols"] = [
      { wch: 7 }, { wch: 38 }, { wch: 16 }, { wch: 20 },
      { wch: 20 }, { wch: 22 }, { wch: 14 }, { wch: 13 },
      { wch: 12 }, { wch: 16 }, { wch: 13 }, { wch: 16 },
      { wch: 15 }, { wch: 16 }, { wch: 17 }, { wch: 14 },
      { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 15 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Product Performance");

    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `product-performance-${scopeLabel}-${stamp}.xlsx`);
  };

  const downloadSelected = () =>
    exportProducts(Array.from(selectedRows.values()), "selected");

  const downloadCurrentPage = () =>
    exportProducts(products, `page-${pagination.page || page}`);

  const resetFilters = () => {

    setDays(30);

    setCustomRange(false);

    setFrom("");

    setTo("");

    setSearchInput("");

    setSearch("");
    setNameInput("");
    setProductName("");
    setCodeInput("");
    setProductCode("");
    setSkuInput("");
    setSku("");
    setCategory("");
    setSubcategory("");

    setSort("units_desc");

    setPage(1);

  };

  const selectDuration = (value) => {

    setCustomRange(false);

    setFrom("");

    setTo("");

    setDays(value);

    setPage(1);

  };

  /* ============================================================

     RENDER

  ============================================================ */

  return (

    <main className="min-h-screen bg-zinc-50">

      <div className="mx-auto max-w-[1700px] px-3 py-4 sm:px-5 sm:py-6 lg:px-7">

        {/* =====================================================

            HEADER

        ===================================================== */}

        <header className="mb-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="mb-2 flex items-center gap-2">

                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-white">

                  <Activity size={14} />

                </span>

                <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">

                  Products / Sales Report

                </span>

              </div>

              <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">

                Product Performance

              </h1>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">

                Analyze actual Shopify order

                data to identify your

                strongest and weakest selling

                products.

              </p>

            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={downloadCurrentPage}
                disabled={!products.length}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 disabled:opacity-40"
              >
                <Download size={15} />
                Excel Current Page
              </button>

              <button
                type="button"
                onClick={downloadSelected}
                disabled={!selectedCount}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={15} />
                Excel Selected ({selectedCount})
              </button>

              <button

              type="button"

              onClick={handleRefresh}

              disabled={

                productPerformanceLoading

              }

              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"

            >

              <RefreshCcw

                size={15}

                className={

                  productPerformanceLoading

                    ? "animate-spin"

                    : ""

                }

              />

              Refresh

              </button>
            </div>

          </div>

        </header>

        {/* =====================================================

            FILTERS

        ===================================================== */}

        <section className="mb-5 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm sm:p-4">

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">

            {/* Duration */}

            <div className="flex overflow-x-auto rounded-xl bg-zinc-100 p-1">

              {DURATIONS.map(

                (item) => {

                  const selected =

                    !customRange &&

                    days ===

                      item.value;

                  return (

                    <button

                      key={

                        item.value

                      }

                      type="button"

                      onClick={() =>

                        selectDuration(

                          item.value

                        )

                      }

                      className={`min-w-[54px] rounded-lg px-3 py-2 text-xs font-bold transition ${

                        selected

                          ? "bg-white text-black shadow-sm"

                          : "text-zinc-500 hover:text-black"

                      }`}

                    >

                      {item.label}

                    </button>

                  );

                }

              )}

              <button

                type="button"

                onClick={() => {

                  setCustomRange(

                    true

                  );

                  setPage(1);

                }}

                className={`flex min-w-[90px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${

                  customRange

                    ? "bg-white text-black shadow-sm"

                    : "text-zinc-500 hover:text-black"

                }`}

              >

                <CalendarDays

                  size={13}

                />

                Custom

              </button>

            </div>

            {/* Search */}

            <div className="relative min-w-0 flex-1">

              <Search

                size={16}

                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"

              />

              <input

                value={searchInput}

                onChange={(e) =>

                  setSearchInput(

                    e.target.value

                  )

                }

                placeholder="Search product name, code or SKU..."

                className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-9 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"

              />

              {searchInput ? (

                <button

                  type="button"

                  onClick={() => {

                    setSearchInput(

                      ""

                    );

                    setSearch("");

                    setPage(1);

                  }}

                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black"

                >

                  <X size={15} />

                </button>

              ) : null}

            </div>

            {/* Sort */}

            <select

              value={sort}

              onChange={(e) => {

                setSort(

                  e.target.value

                );

                setPage(1);

              }}

              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 outline-none focus:border-zinc-400 xl:min-w-[210px]"

            >

              {SORT_OPTIONS.map(

                (option) => (

                  <option

                    key={

                      option.value

                    }

                    value={

                      option.value

                    }

                  >

                    {option.label}

                  </option>

                )

              )}

            </select>

          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 border-t border-zinc-100 pt-3 sm:grid-cols-2 lg:grid-cols-5">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Product name..."
              className="h-10 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
            />
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Product code..."
              className="h-10 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
            />
            <input
              value={skuInput}
              onChange={(e) => setSkuInput(e.target.value)}
              placeholder="SKU..."
              className="h-10 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
            />
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSubcategory("");
                setPage(1);
              }}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            >
              <option value="">All Categories</option>
              {categoryOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select
              value={subcategory}
              onChange={(e) => {
                setSubcategory(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            >
              <option value="">All Subcategories</option>
              {subcategoryOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          {/* Custom dates */}

          {customRange ? (

            <div className="mt-3 grid grid-cols-1 gap-3 border-t border-zinc-100 pt-3 sm:grid-cols-2 lg:max-w-xl">

              <label>

                <span className="mb-1.5 block text-xs font-semibold text-zinc-500">

                  Order From

                </span>

                <input

                  type="date"

                  value={from}

                  onChange={(e) => {

                    setFrom(

                      e.target.value

                    );

                    setPage(1);

                  }}

                  className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"

                />

              </label>

              <label>

                <span className="mb-1.5 block text-xs font-semibold text-zinc-500">

                  Order To

                </span>

                <input

                  type="date"

                  value={to}

                  onChange={(e) => {

                    setTo(

                      e.target.value

                    );

                    setPage(1);

                  }}

                  className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"

                />

              </label>

            </div>

          ) : null}

          {/* Applied info */}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3">

            <div className="flex flex-wrap items-center gap-2">

              <span className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-600">

                {periodLabel}

              </span>

              <span className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-600">

                {number(

                  pagination.total

                )}{" "}

                selling products

              </span>

            </div>

            {hasFilters ? (

              <button

                type="button"

                onClick={

                  resetFilters

                }

                className="text-xs font-semibold text-zinc-500 hover:text-black"

              >

                Reset filters

              </button>

            ) : null}

          </div>

        </section>

        {/* ERROR */}

        {productPerformanceError ? (

          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            {

              productPerformanceError

            }

          </div>

        ) : null}

        {/* INITIAL LOAD */}

        {productPerformanceLoading &&

        !productPerformanceSummary ? (

          <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-zinc-200 bg-white">

            <div className="text-center">

              <Loader2

                size={28}

                className="mx-auto animate-spin text-zinc-500"

              />

              <p className="mt-3 text-sm font-medium text-zinc-500">

                Building Shopify sales

                report...

              </p>

            </div>

          </div>

        ) : (

          <>

            {/* =================================================

                SUMMARY

            ================================================= */}

            <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-5">

              <StatCard

                title="Products Sold"

                value={number(

                  summary.totalProducts

                )}

                subtitle="Products with orders"

                icon={Package}

                accent

              />

              <StatCard

                title="Orders"

                value={number(

                  summary.totalOrders

                )}

                subtitle="Product-order count"

                icon={ShoppingBag}

              />

              <StatCard

                title="Units Ordered"

                value={number(

                  summary.totalUnits

                )}

                subtitle="Total quantity ordered"

                icon={PackageCheck}

              />

              <StatCard

                title="Gross Sales"

                value={money(

                  summary.grossSales

                )}

                subtitle="Purchase-time line value"

                icon={IndianRupee}

              />

              <StatCard

                title="Active Sales"

                value={money(

                  summary.activeSales

                )}

                subtitle="Excluding cancelled orders"

                icon={Activity}

              />

              <StatCard

                title="Delivered"

                value={number(

                  summary.deliveredUnits

                )}

                subtitle={money(

                  summary.deliveredSales

                )}

                icon={CheckCircle2}

              />

              <StatCard

                title="Processing"

                value={number(

                  summary.processingUnits

                )}

                subtitle="Units in processing"

                icon={Package}

              />

              <StatCard

                title="Shipped"

                value={number(

                  summary.shippedUnits

                )}

                subtitle="Units shipped"

                icon={Truck}

              />

              <StatCard

                title="Cancelled"

                value={number(

                  summary.cancelledUnits

                )}

                subtitle="Cancelled units"

                icon={XCircle}

              />

              <StatCard

                title="RTO / Returns"

                value={`${number(

                  summary.rtoUnits

                )} / ${number(

                  summary.returnUnits

                )}`}

                subtitle="RTO / customer return units"

                icon={RotateCcw}

              />

            </section>

            {/* =================================================

                TOP / LOW

            ================================================= */}

            <section className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">

              <HighlightCard

                title="Top Sellers"

                subtitle="Highest units sold in selected order period"

                icon={Trophy}

                products={

                  highlights.mostSold ||

                  []

                }

                type="top"

              />

              <HighlightCard

                title="Low Sellers"

                subtitle="Lowest units sold in selected order period"

                icon={

                  TrendingDown

                }

                products={

                  highlights.leastSold ||

                  []

                }

                type="low"

              />

            </section>

            {/* =================================================

                REPORT

            ================================================= */}

            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

              <div className="flex flex-col gap-2 border-b border-zinc-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">

                <div>

                  <div className="flex items-center gap-2">

                    <Sparkles

                      size={16}

                      className="text-zinc-500"

                    />

                    <h2 className="text-sm font-bold text-zinc-950">

                      Sales Breakdown

                    </h2>

                  </div>

                  <p className="mt-1 text-xs text-zinc-500">

                    Product-level Shopify

                    order performance for{" "}

                    {periodLabel.toLowerCase()}.

                  </p>

                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleCurrentPage}
                    disabled={!products.length}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                  >
                    {allPageSelected ? <CheckSquare2 size={14} /> : <Square size={14} />}
                    {allPageSelected ? "Unselect Page" : "Select Page"}
                  </button>
                  {selectedCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => setSelectedRows(new Map())}
                      className="h-9 rounded-xl px-3 text-xs font-semibold text-zinc-500 hover:text-black"
                    >
                      Clear {selectedCount}
                    </button>
                  ) : null}
                </div>

                {productPerformanceLoading ? (

                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">

                    <Loader2

                      size={14}

                      className="animate-spin"

                    />

                    Updating

                  </div>

                ) : null}

              </div>

              {!products.length ? (

                <EmptyState />

              ) : (

                <>

                  {/* MOBILE */}

                  <div className="block lg:hidden">

                    {products.map(

                      (

                        product,

                        index

                      ) => (

                        <MobileProductCard

                          key={

                            product?.productId ||

                            product?._id ||

                            product?.productCode ||

                            index

                          }

                          product={

                            product

                          }
                          selected={selectedRows.has(getRowKey(product))}
                          onToggle={() => toggleRow(product)}

                          index={

                            (pagination.page -

                              1) *

                              pagination.limit +

                            index +

                            1

                          }

                        />

                      )

                    )}

                  </div>

                  {/* DESKTOP */}

                  <div className="hidden overflow-x-auto lg:block">

                    <table className="w-full min-w-[1850px] border-collapse text-left">

                      <thead>

                        <tr className="border-b border-zinc-100 bg-zinc-50/80">

                          <th className="w-12 px-3 py-3 text-center">
                            <button type="button" onClick={toggleCurrentPage} className="text-zinc-500">
                              {allPageSelected ? <CheckSquare2 size={16} /> : <Square size={16} />}
                            </button>
                          </th>

                          <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Product Name</th>
                          <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Product Code</th>
                          <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">SKU</th>
                          <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Category</th>
                          <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Subcategory</th>

                          <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">

                            Orders

                          </th>

                          <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">

                            Units

                          </th>

                          <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">

                            Gross Sales

                          </th>

                          <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">

                            Active Sales

                          </th>

                          <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">

                            Delivered

                          </th>

                          <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">

                            Processing

                          </th>

                          <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">

                            Shipped

                          </th>

                          <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">

                            Cancelled

                          </th>

                          <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">

                            RTO

                          </th>

                          <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">

                            Returns

                          </th>

                          <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">

                            Uploaded

                          </th>

                        </tr>

                      </thead>

                      <tbody className="divide-y divide-zinc-100">

                        {products.map(

                          (

                            product,

                            index

                          ) => (

                            <tr

                              key={

                                product?.productId ||

                                product?._id ||

                                product?.productCode ||

                                index

                              }

                              className="transition hover:bg-zinc-50/70"

                            >

                              <td className="px-3 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleRow(product)}
                                  className="text-zinc-500 hover:text-black"
                                >
                                  {selectedRows.has(getRowKey(product)) ? (
                                    <CheckSquare2 size={17} className="text-black" />
                                  ) : (
                                    <Square size={17} />
                                  )}
                                </button>
                              </td>

                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <ProductAvatar product={product} />
                                  <p className="max-w-[280px] truncate text-sm font-semibold text-zinc-900">
                                    {product?.title || "Untitled Product"}
                                  </p>
                                </div>
                              </td>

                              <td className="px-3 py-3 text-sm font-semibold text-zinc-700">
                                {product?.productCode || "—"}
                              </td>

                              <td className="px-3 py-3 text-xs text-zinc-600">
                                {product?.sku || "—"}
                              </td>

                              <td className="px-3 py-3 text-xs font-medium text-zinc-700">
                                {getCategory(product) || "—"}
                              </td>

                              <td className="px-3 py-3 text-xs text-zinc-600">
                                {getSubcategory(product) || "—"}
                              </td>

                              <td className="px-3 py-3 text-right">

                                <span className="text-sm font-semibold text-zinc-700">

                                  {number(

                                    product?.totalOrders

                                  )}

                                </span>

                              </td>

                              <td className="px-3 py-3 text-right">

                                <span className="inline-flex min-w-[36px] justify-center rounded-lg bg-black px-2 py-1 text-xs font-bold text-white">

                                  {number(

                                    product?.totalUnits

                                  )}

                                </span>

                              </td>

                              <td className="px-3 py-3 text-right text-sm font-semibold text-zinc-800">

                                {money(

                                  product?.grossSales

                                )}

                              </td>

                              <td className="px-3 py-3 text-right text-sm font-semibold text-zinc-700">

                                {money(

                                  product?.activeSales

                                )}

                              </td>

                              <td className="px-3 py-3 text-right text-sm font-semibold text-zinc-700">

                                {number(

                                  product?.deliveredUnits

                                )}

                              </td>

                              <td className="px-3 py-3 text-right text-sm text-zinc-600">

                                {number(

                                  product?.processingUnits

                                )}

                              </td>

                              <td className="px-3 py-3 text-right text-sm text-zinc-600">

                                {number(

                                  product?.shippedUnits

                                )}

                              </td>

                              <td className="px-3 py-3 text-right">

                                <span

                                  className={

                                    Number(

                                      product?.cancelledUnits ||

                                        0

                                    ) > 0

                                      ? "text-sm font-bold text-red-600"

                                      : "text-sm text-zinc-400"

                                  }

                                >

                                  {number(

                                    product?.cancelledUnits

                                  )}

                                </span>

                              </td>

                              <td className="px-3 py-3 text-right">

                                <span

                                  className={

                                    Number(

                                      product?.rtoUnits ||

                                        0

                                    ) > 0

                                      ? "text-sm font-bold text-orange-600"

                                      : "text-sm text-zinc-400"

                                  }

                                >

                                  {number(

                                    product?.rtoUnits

                                  )}

                                </span>

                              </td>

                              <td className="px-3 py-3 text-right">

                                <span

                                  className={

                                    Number(

                                      product?.returnUnits ||

                                        0

                                    ) > 0

                                      ? "text-sm font-bold text-amber-600"

                                      : "text-sm text-zinc-400"

                                  }

                                >

                                  {number(

                                    product?.returnUnits

                                  )}

                                </span>

                              </td>

                              <td className="px-5 py-3 text-right">

                                <p className="text-xs font-medium text-zinc-700">

                                  {formatDate(

                                    product?.uploadedAt

                                  )}

                                </p>

                                {product?.currentPrice ? (

                                  <p className="mt-0.5 text-[10px] text-zinc-400">

                                    Current{" "}

                                    {money(

                                      product.currentPrice

                                    )}

                                  </p>

                                ) : null}

                              </td>

                            </tr>

                          )

                        )}

                      </tbody>

                    </table>

                  </div>

                </>

              )}

              {/* =================================================

                  PAGINATION

              ================================================= */}

              {pagination.pages > 1 ? (

                <div className="flex flex-col gap-3 border-t border-zinc-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">

                  <p className="text-xs text-zinc-500">

                    Page{" "}

                    <strong className="text-zinc-800">

                      {

                        pagination.page

                      }

                    </strong>{" "}

                    of{" "}

                    <strong className="text-zinc-800">

                      {

                        pagination.pages

                      }

                    </strong>

                    {" · "}

                    {number(

                      pagination.total

                    )}{" "}

                    products

                  </p>

                  <div className="grid grid-cols-2 gap-2 sm:flex">

                    <button

                      type="button"

                      disabled={

                        pagination.page <=

                          1 ||

                        productPerformanceLoading

                      }

                      onClick={() =>

                        setPage(

                          (prev) =>

                            Math.max(

                              1,

                              prev - 1

                            )

                        )

                      }

                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"

                    >

                      <ChevronLeft

                        size={14}

                      />

                      Previous

                    </button>

                    <button

                      type="button"

                      disabled={

                        pagination.page >=

                          pagination.pages ||

                        productPerformanceLoading

                      }

                      onClick={() =>

                        setPage(

                          (prev) =>

                            Math.min(

                              pagination.pages,

                              prev + 1

                            )

                        )

                      }

                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-black px-3 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"

                    >

                      Next

                      <ChevronRight

                        size={14}

                      />

                    </button>

                  </div>

                </div>

              ) : null}

            </section>

            {/* =================================================

                REPORT NOTE

            ================================================= */}

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-3 text-[11px] leading-5 text-zinc-500">

              <BarChart3

                size={14}

                className="mt-0.5 shrink-0"

              />

              <p>

                This report uses locally synced

                Shopify orders for the selected

                order period. Gross sales use

                purchase-time order line values,

                not the product&apos;s current

                price. Delivered and RTO figures

                use the locally available

                fulfillment/courier status.

                Customer return units use the

                linked RMA data currently

                available in the order.

              </p>

            </div>

          </>

        )}

      </div>

    </main>

  );

}