"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Layers3,
  Loader2,
  Package,
  RefreshCcw,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";

import MediaPickerModal from "@/components/media/MediaPickerModal";
import { useAdminProductStore } from "@/store/adminProductStore";
import useFabricStore from "@/store/fabricStore";
import useFabricLogStore from "@/store/fabricLogStore";
import useFabricPriceLogStore from "@/store/fabricPriceLogStore";

/* =========================================================
   CONSTANTS
========================================================= */

const ROLES = [
  ["main", "Main"],
  ["lining", "Lining"],
  ["contrast", "Contrast"],
  ["padding", "Padding"],
  ["other", "Other"],
];

const UNITS = [
  ["meter", "Meter"],
  ["cm", "CM"],
  ["gram", "Gram"],
];

const EMPTY_ARRAY = [];

const EMPTY_CONSUMPTION = {
  value: 0,
  unit: "meter",
  wastePercentage: 5,
};

/* =========================================================
   HELPERS
========================================================= */

const n = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n(value));

const date = (value) => {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeCode = (value = "") =>
  String(value || "").trim().toUpperCase();

const normalizeFabric = (fabric = {}) => ({
  fabricName: String(fabric.fabricName || ""),
  fabricCode: String(fabric.fabricCode || ""),
  fabricColor: String(fabric.fabricColor || ""),
  role: String(fabric.role || "main"),
});

const convertConsumption = (value, from, to) => {
  const amount = n(value);

  if (!amount) return 0;
  if (from === to) return amount;

  if (from === "cm" && to === "meter") return amount / 100;
  if (from === "meter" && to === "cm") return amount * 100;

  if (from === "gram" && to === "kg") return amount / 1000;
  if (from === "kg" && to === "gram") return amount * 1000;

  return null;
};

/* =========================================================
   PAGE
========================================================= */

export default function ProductFabricDetailsPage() {
  /* ---------------- STORES ---------------- */

  const fetchProductFabricDetails = useAdminProductStore(
    (s) => s.fetchProductFabricDetails,
  );

  const updateProduct = useAdminProductStore((s) => s.updateProduct);

  const productLoading = useAdminProductStore((s) => s.loading);
  const saving = useAdminProductStore((s) => s.saving);

  const fetchFabricOptions = useFabricStore((s) => s.fetchFabricOptions);
  const fabricOptions = useFabricStore((s) => s.fabricOptions);
  const fabricOptionsLoading = useFabricStore(
    (s) => s.fabricOptionsLoading,
  );
  const fetchFabricByCode = useFabricStore((s) => s.fetchFabricByCode);

  const fetchFabricLogsByCode = useFabricLogStore(
    (s) => s.fetchFabricLogsByCode,
  );

  const fetchLatestPriceByCode = useFabricPriceLogStore(
    (s) => s.fetchLatestPriceByCode,
  );

  const fetchPriceHistory = useFabricPriceLogStore(
    (s) => s.fetchPriceHistory,
  );

  const safeFabricOptions = Array.isArray(fabricOptions)
    ? fabricOptions
    : EMPTY_ARRAY;

  /* ---------------- STATE ---------------- */

  const [query, setQuery] = useState("");
  const [product, setProduct] = useState(null);
  const [searched, setSearched] = useState(false);

  const [fabricDetails, setFabricDetails] = useState("");
  const [fabricPrintFile, setFabricPrintFile] = useState("");
  const [fabrics, setFabrics] = useState([]);
  const [consumption, setConsumption] = useState(EMPTY_CONSUMPTION);

  const [original, setOriginal] = useState(null);

  const [mediaOpen, setMediaOpen] = useState(false);

  const [fabricQuery, setFabricQuery] = useState("");
  const [fabricSearchOpen, setFabricSearchOpen] = useState(false);

  const [fabricMasterMap, setFabricMasterMap] = useState({});
  const [fabricMeta, setFabricMeta] = useState({});
  const [showHistory, setShowHistory] = useState({});
  const [showActivity, setShowActivity] = useState({});

  const fabricDropdownRef = useRef(null);

  /* =========================================================
     HYDRATE
  ========================================================= */

  const hydrate = (data) => {
    const fabric = data?.fabric || {};

    const next = {
      fabricDetails: fabric.details || "",
      fabricPrintFile: fabric.printFile || "",

      fabrics: Array.isArray(fabric.fabrics)
        ? fabric.fabrics.map(normalizeFabric)
        : [],

      consumption: {
        value: fabric.avgConsumption?.value ?? 0,
        unit: fabric.avgConsumption?.unit || "meter",
        wastePercentage:
          fabric.avgConsumption?.wastePercentage ?? 5,
      },
    };

    setFabricDetails(next.fabricDetails);
    setFabricPrintFile(next.fabricPrintFile);
    setFabrics(next.fabrics);
    setConsumption(next.consumption);

    setOriginal(JSON.parse(JSON.stringify(next)));
  };

  /* =========================================================
     DIRTY STATE
  ========================================================= */

  const current = useMemo(
    () => ({
      fabricDetails,
      fabricPrintFile,
      fabrics,
      consumption,
    }),
    [fabricDetails, fabricPrintFile, fabrics, consumption],
  );

  const changed = useMemo(() => {
    if (!original) return false;

    return JSON.stringify(current) !== JSON.stringify(original);
  }, [current, original]);

  /* =========================================================
     FABRIC META
  ========================================================= */

  const loadFabricMeta = async (
    fabric,
    index,
    providedMaster = null,
  ) => {
    const code = normalizeCode(fabric?.fabricCode);

    if (!code) return;

    try {
      let master = providedMaster;

      if (!master?._id) {
        const response = await fetchFabricByCode(code);

        master =
          response?.data ||
          response?.fabric ||
          response ||
          null;
      }

      if (!master?._id) return;

      setFabricMasterMap((prev) => ({
        ...prev,
        [code]: master,
      }));

      const [priceRes, logRes, historyRes] = await Promise.all([
        fetchLatestPriceByCode(code),

        fetchFabricLogsByCode(code, {
          page: 1,
          limit: 5,
        }),

        fetchPriceHistory(master._id, {
          page: 1,
          limit: 10,
        }),
      ]);

      setFabricMeta((prev) => ({
        ...prev,

        [code]: {
          price:
            priceRes?.data ||
            priceRes?.price ||
            null,

          logs: Array.isArray(logRes?.data)
            ? logRes.data
            : [],

          history: Array.isArray(historyRes?.data)
            ? historyRes.data
            : [],
        },
      }));
    } catch (error) {
      console.error(
        `Failed loading fabric metadata for row ${index}`,
        error,
      );
    }
  };

  const loadAllFabricMeta = async (rows = []) => {
    const unique = [];
    const seen = new Set();

    rows.forEach((row, index) => {
      const code = normalizeCode(row?.fabricCode);

      if (!code || seen.has(code)) return;

      seen.add(code);

      unique.push({
        ...row,
        __index: index,
      });
    });

    await Promise.all(
      unique.map((row) =>
        loadFabricMeta(row, row.__index),
      ),
    );
  };

  /* =========================================================
     PRODUCT SEARCH
  ========================================================= */

  const handleProductSearch = async (event) => {
    event?.preventDefault();

    const value = query.trim();

    if (!value) {
      toast.error("Enter product code, slug or ID");
      return;
    }

    setSearched(true);
    setProduct(null);
    setFabricMasterMap({});
    setFabricMeta({});
    setShowHistory({});
    setShowActivity({});

    const result = await fetchProductFabricDetails(value);

    if (!result) return;

    setProduct(result);
    hydrate(result);

    await loadAllFabricMeta(
      result?.fabric?.fabrics || [],
    );
  };

  /* =========================================================
     FABRIC MASTER
  ========================================================= */

  useEffect(() => {
    fetchFabricOptions();
  }, [fetchFabricOptions]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (
        fabricDropdownRef.current &&
        !fabricDropdownRef.current.contains(event.target)
      ) {
        setFabricSearchOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setFabricSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const filteredFabricOptions = useMemo(() => {
    const q = fabricQuery.trim().toLowerCase();

    const assigned = new Set(
      fabrics
        .map((fabric) =>
          normalizeCode(fabric.fabricCode),
        )
        .filter(Boolean),
    );

    return safeFabricOptions.filter((fabric) => {
      const code = normalizeCode(fabric?.code);

      if (code && assigned.has(code)) return false;

      if (!q) return true;

      return [
        fabric?.name,
        fabric?.code,
        fabric?.category,
        fabric?.unit,
        fabric?.gsm,
        fabric?.width,
      ]
        .filter(
          (value) =>
            value != null && value !== "",
        )
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [safeFabricOptions, fabricQuery, fabrics]);

  const selectFabric = async (master) => {
    if (!master) return;

    const code = normalizeCode(master.code);

    if (
      fabrics.some(
        (fabric) =>
          normalizeCode(fabric.fabricCode) === code,
      )
    ) {
      toast.error("Fabric already assigned");
      return;
    }

    const row = {
      fabricName: master.name || "",
      fabricCode: code,
      fabricColor: "",
      role: fabrics.length ? "other" : "main",
    };

    const index = fabrics.length;

    setFabrics((prev) => [...prev, row]);

    setFabricMasterMap((prev) => ({
      ...prev,
      [code]: master,
    }));

    setFabricQuery("");
    setFabricSearchOpen(false);

    await loadFabricMeta(row, index, master);
  };

  /* =========================================================
     FABRIC ACTIONS
  ========================================================= */

  const updateFabric = (index, key, value) => {
    setFabrics((prev) =>
      prev.map((fabric, i) =>
        i === index
          ? {
              ...fabric,
              [key]: value,
            }
          : fabric,
      ),
    );
  };

  const removeFabric = (index) => {
    setFabrics((prev) =>
      prev.filter((_, i) => i !== index),
    );
  };

  /* =========================================================
     MEDIA
  ========================================================= */

  const handleMediaSelect = (media) => {
    const selected = Array.isArray(media)
      ? media[0]
      : media;

    if (!selected?.url) {
      toast.error("Invalid media");
      return;
    }

    setFabricPrintFile(selected.url);
    setMediaOpen(false);
  };

  /* =========================================================
     RESET
  ========================================================= */

  const resetForm = () => {
    if (!original) return;

    setFabricDetails(original.fabricDetails);
    setFabricPrintFile(original.fabricPrintFile);

    setFabrics(
      JSON.parse(JSON.stringify(original.fabrics)),
    );

    setConsumption({
      ...original.consumption,
    });
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const save = async () => {
    if (!product?._id) return;

    const cleaned = fabrics
      .map((fabric) => ({
        fabricName: String(
          fabric.fabricName || "",
        ).trim(),

        fabricCode: normalizeCode(
          fabric.fabricCode,
        ),

        fabricColor: String(
          fabric.fabricColor || "",
        ).trim(),

        role: ROLES.some(
          ([value]) => value === fabric.role,
        )
          ? fabric.role
          : "main",
      }))
      .filter(
        (fabric) =>
          fabric.fabricName ||
          fabric.fabricCode ||
          fabric.fabricColor,
      );

    if (
      cleaned.some(
        (fabric) => !fabric.fabricName,
      )
    ) {
      toast.error(
        "Fabric name is required for every fabric",
      );
      return;
    }

    const payload = {
      fabricDetails: fabricDetails.trim(),
      fabricPrintFile: fabricPrintFile.trim(),

      fabrics: cleaned,

      avgFabricConsumption: {
        value: Math.max(
          0,
          n(consumption.value),
        ),

        unit: consumption.unit || "meter",

        wastePercentage: Math.max(
          0,
          n(consumption.wastePercentage),
        ),
      },
    };

    try {
      await updateProduct(product._id, payload);

      const refreshed =
        await fetchProductFabricDetails(
          product._id,
        );

      if (refreshed) {
        setProduct(refreshed);
        hydrate(refreshed);

        await loadAllFabricMeta(
          refreshed?.fabric?.fabrics || [],
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <main className="min-h-screen bg-[#f7f7f5] text-neutral-950">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">

          {/* =================================================
              HEADER
          ================================================= */}

          <header className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-px w-8 bg-black" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400">
                Product Management
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Fabric Details
            </h1>

            <p className="mt-2 max-w-lg text-sm leading-6 text-neutral-500">
              Manage fabric composition, sourcing,
              consumption and costing for a product.
            </p>
          </header>

          {/* =================================================
              SEARCH
          ================================================= */}

          <div className="mb-5 rounded-[22px] border border-neutral-200/80 bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <form
              onSubmit={handleProductSearch}
              className="flex items-center gap-2"
            >
              <div className="relative min-w-0 flex-1">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />

                <input
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                  placeholder="Search product code, slug or ID"
                  className="h-12 w-full rounded-2xl border-0 bg-transparent pl-10 pr-3 text-sm outline-none placeholder:text-neutral-400"
                />
              </div>

              <button
                type="submit"
                disabled={productLoading}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-black px-5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-40"
              >
                {productLoading ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <Search size={15} />
                )}

                <span className="hidden sm:inline">
                  Search
                </span>
              </button>
            </form>
          </div>

          {!product &&
            !productLoading &&
            !searched && (
              <Empty>
                Search a product to manage its
                fabric details.
              </Empty>
            )}

          {!product &&
            !productLoading &&
            searched && (
              <Empty>Product not found.</Empty>
            )}

          {product && (
            <div className="space-y-4">

              {/* =================================================
                  PRODUCT
              ================================================= */}

              <section className="overflow-hidden rounded-[26px] bg-neutral-950 p-5 text-white sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-[18px] bg-neutral-900">
                    {product.thumbnail ||
                    product.images?.[0] ? (
                      <Image
                        src={
                          product.thumbnail ||
                          product.images[0]
                        }
                        alt={
                          product.title || "Product"
                        }
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <Package className="absolute inset-0 m-auto text-neutral-700" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-neutral-300">
                        #{product.productCode}
                      </span>

                      {product.isActive && (
                        <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
                          Active
                        </span>
                      )}

                      {changed && (
                        <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-amber-300">
                          Unsaved
                        </span>
                      )}
                    </div>

                    <h2 className="truncate text-lg font-medium tracking-[-0.02em]">
                      {product.title}
                    </h2>

                    <p className="mt-1 truncate text-xs text-neutral-500">
                      {product.slug}
                    </p>
                  </div>
                </div>
              </section>

              {/* =================================================
                  DETAILS
              ================================================= */}

              <Section
                eyebrow="Description"
                title="Fabric Details"
              >
                <textarea
                  value={fabricDetails}
                  onChange={(event) =>
                    setFabricDetails(
                      event.target.value,
                    )
                  }
                  rows={4}
                  placeholder="Describe composition, texture, finish or other important fabric details..."
                  className="luxury-input min-h-[120px] resize-none py-3.5"
                />
              </Section>

              {/* =================================================
                  PRINT
              ================================================= */}

              <Section
                eyebrow="Reference"
                title="Fabric Print / Pattern"
              >
                {fabricPrintFile ? (
                  <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 p-3">
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                      <Image
                        src={fabricPrintFile}
                        alt="Fabric print"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        Print reference
                      </p>

                      <p className="mt-1 text-xs text-neutral-400">
                        Media Library
                      </p>

                      <div className="mt-3 flex gap-2">
                        <MiniButton
                          onClick={() =>
                            setMediaOpen(true)
                          }
                        >
                          <ImagePlus size={14} />
                          Change
                        </MiniButton>

                        <MiniButton
                          muted
                          onClick={() =>
                            setFabricPrintFile("")
                          }
                        >
                          <Trash2 size={14} />
                          Remove
                        </MiniButton>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setMediaOpen(true)
                    }
                    className="group flex w-full items-center gap-4 rounded-2xl border border-dashed border-neutral-300 p-4 text-left transition hover:border-neutral-400 hover:bg-neutral-50"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 transition group-hover:bg-white">
                      <ImagePlus size={18} />
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        Add print reference
                      </p>

                      <p className="mt-0.5 text-xs text-neutral-400">
                        Select an image from Media
                        Library
                      </p>
                    </div>
                  </button>
                )}
              </Section>

              {/* =================================================
                  ASSIGNED FABRICS
              ================================================= */}

              <Section
                eyebrow={`${fabrics.length} assigned`}
                title="Assigned Fabrics"
              >
                {/* SEARCH FABRIC */}

                <div
                  ref={fabricDropdownRef}
                  className="relative"
                >
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-neutral-400"
                  />

                  <input
                    value={fabricQuery}
                    onFocus={() =>
                      setFabricSearchOpen(true)
                    }
                    onChange={(event) => {
                      setFabricQuery(
                        event.target.value,
                      );

                      setFabricSearchOpen(true);
                    }}
                    placeholder="Search Fabric Master..."
                    className="luxury-input pl-10 pr-10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setFabricSearchOpen(
                        (prev) => !prev,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-black"
                  >
                    <ChevronDown size={17} />
                  </button>

                  {fabricSearchOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-[330px] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
                      {fabricOptionsLoading ? (
                        <div className="flex items-center gap-2 p-4 text-sm text-neutral-500">
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />

                          Loading fabrics...
                        </div>
                      ) : filteredFabricOptions.length ? (
                        filteredFabricOptions.map(
                          (fabric) => (
                            <button
                              key={
                                fabric._id ||
                                fabric.code
                              }
                              type="button"
                              onClick={() =>
                                selectFabric(
                                  fabric,
                                )
                              }
                              className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-neutral-50"
                            >
                              <FabricImage
                                src={
                                  fabric.imageLink
                                }
                                name={
                                  fabric.name
                                }
                                size="small"
                              />

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {fabric.name}
                                </p>

                                <p className="mt-0.5 text-[11px] text-neutral-400">
                                  {fabric.code}

                                  {fabric.category
                                    ? ` · ${fabric.category}`
                                    : ""}
                                </p>
                              </div>

                              <span className="shrink-0 text-[11px] text-neutral-500">
                                {n(
                                  fabric.currentStock,
                                )}{" "}
                                {fabric.unit}
                              </span>
                            </button>
                          ),
                        )
                      ) : (
                        <div className="p-4 text-center text-sm text-neutral-400">
                          No fabrics found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* FABRIC CARDS */}

                <div className="mt-4 space-y-3">
                  {fabrics.map(
                    (fabric, index) => {
                      const code = normalizeCode(
                        fabric.fabricCode,
                      );

                      const master =
                        fabricMasterMap[code];

                      const meta =
                        fabricMeta[code] || {};

                      const price = n(
                        meta.price?.newPrice,
                      );

                      const base = n(
                        consumption.value,
                      );

                      const waste = n(
                        consumption.wastePercentage,
                      );

                      const effective =
                        base *
                        (1 + waste / 100);

                      const stock = n(
                        master?.currentStock,
                      );

                      const effectiveInFabricUnit =
                        master?.unit
                          ? convertConsumption(
                              effective,
                              consumption.unit,
                              master.unit,
                            )
                          : null;

                      const cost =
                        effectiveInFabricUnit !==
                          null && price > 0
                          ? effectiveInFabricUnit *
                            price
                          : null;

                      const possible =
                        effectiveInFabricUnit !==
                          null &&
                        effectiveInFabricUnit > 0
                          ? Math.floor(
                              stock /
                                effectiveInFabricUnit,
                            )
                          : null;

                      return (
                        <article
                          key={`${code}-${index}`}
                          className="overflow-hidden rounded-[22px] border border-neutral-200 bg-white"
                        >
                          {/* FABRIC TOP */}

                          <div className="p-4 sm:p-5">
                            <div className="flex items-start gap-3">
                              <FabricImage
                                src={
                                  master?.imageLink
                                }
                                name={
                                  fabric.fabricName
                                }
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h3 className="truncate text-sm font-semibold">
                                      {fabric.fabricName ||
                                        master?.name ||
                                        "Fabric"}
                                    </h3>

                                    <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                                      {code ||
                                        "No code"}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeFabric(
                                        index,
                                      )
                                    }
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-red-50 hover:text-red-500"
                                  >
                                    <Trash2
                                      size={14}
                                    />
                                  </button>
                                </div>

                                {master && (
                                  <div className="mt-3 flex flex-wrap gap-1.5">
                                    <Pill
                                      positive={
                                        !master.isLowStock
                                      }
                                      warning={
                                        master.isLowStock
                                      }
                                    >
                                      {stock}{" "}
                                      {master.unit}
                                    </Pill>

                                    {master.status && (
                                      <Pill>
                                        {
                                          master.status
                                        }
                                      </Pill>
                                    )}

                                    {master.movementStatus && (
                                      <Pill>
                                        {
                                          master.movementStatus
                                        }
                                      </Pill>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* MASTER DETAILS */}

                            {master && (
                              <div className="mt-5 grid grid-cols-4 divide-x divide-neutral-100 rounded-2xl bg-[#f8f8f6] px-2 py-3">
                                <Meta
                                  label="Category"
                                  value={
                                    master.category ||
                                    "—"
                                  }
                                />

                                <Meta
                                  label="GSM"
                                  value={
                                    master.gsm ||
                                    "—"
                                  }
                                />

                                <Meta
                                  label="Width"
                                  value={
                                    master.width ||
                                    "—"
                                  }
                                />

                                <Meta
                                  label="Stock"
                                  value={`${stock} ${
                                    master.unit ||
                                    ""
                                  }`}
                                />
                              </div>
                            )}

                            {/* PRODUCT SPECIFIC */}

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                              <Field
                                label="Product Color"
                              >
                                <input
                                  value={
                                    fabric.fabricColor
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateFabric(
                                      index,
                                      "fabricColor",
                                      event.target
                                        .value,
                                    )
                                  }
                                  placeholder="Black, Ivory..."
                                  className="luxury-input"
                                />
                              </Field>

                              <Field label="Role">
                                <select
                                  value={
                                    fabric.role
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateFabric(
                                      index,
                                      "role",
                                      event.target
                                        .value,
                                    )
                                  }
                                  className="luxury-input appearance-none"
                                >
                                  {ROLES.map(
                                    ([
                                      value,
                                      label,
                                    ]) => (
                                      <option
                                        key={
                                          value
                                        }
                                        value={
                                          value
                                        }
                                      >
                                        {label}
                                      </option>
                                    ),
                                  )}
                                </select>
                              </Field>
                            </div>
                          </div>

                          {/* COST SUMMARY */}

                          {master && (
                            <div className="bg-neutral-950 px-4 py-4 text-white sm:px-5">
                              <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-4">
                                <Cost
                                  label="Price"
                                  value={
                                    price
                                      ? `${money(
                                          price,
                                        )}/${
                                          master.unit
                                        }`
                                      : "—"
                                  }
                                />

                                <Cost
                                  label="Effective"
                                  value={
                                    effectiveInFabricUnit !==
                                    null
                                      ? `${effectiveInFabricUnit.toFixed(
                                          2,
                                        )} ${
                                          master.unit
                                        }`
                                      : `${effective.toFixed(
                                          2,
                                        )} ${
                                          consumption.unit
                                        }`
                                  }
                                />

                                <Cost
                                  label="Cost / Piece"
                                  value={
                                    cost !== null
                                      ? money(cost)
                                      : "—"
                                  }
                                />

                                <Cost
                                  label="Possible"
                                  value={
                                    possible ??
                                    "—"
                                  }
                                />
                              </div>
                            </div>
                          )}

                          {/* SECONDARY DATA */}

                          {(meta.logs?.length >
                            0 ||
                            meta.history?.length >
                              0) && (
                            <div className="divide-y divide-neutral-100 border-t border-neutral-100">
                              {meta.logs?.length >
                                0 && (
                                <Disclosure
                                  title="Stock Activity"
                                  open={
                                    !!showActivity[
                                      code
                                    ]
                                  }
                                  onClick={() =>
                                    setShowActivity(
                                      (prev) => ({
                                        ...prev,
                                        [code]:
                                          !prev[
                                            code
                                          ],
                                      }),
                                    )
                                  }
                                >
                                  <div className="space-y-1">
                                    {meta.logs
                                      .slice(0, 3)
                                      .map(
                                        (log) => (
                                          <div
                                            key={
                                              log._id
                                            }
                                            className="flex items-center justify-between gap-4 rounded-xl bg-neutral-50 px-3 py-2.5"
                                          >
                                            <div className="min-w-0">
                                              <p className="truncate text-xs font-medium">
                                                {log.description ||
                                                  log.action}
                                              </p>

                                              <p className="mt-0.5 text-[10px] text-neutral-400">
                                                {date(
                                                  log.logDate,
                                                )}
                                              </p>
                                            </div>

                                            <span className="shrink-0 text-xs font-medium">
                                              {
                                                log.previousStock
                                              }{" "}
                                              →{" "}
                                              {
                                                log.newStock
                                              }
                                            </span>
                                          </div>
                                        ),
                                      )}
                                  </div>
                                </Disclosure>
                              )}

                              {meta.history
                                ?.length >
                                0 && (
                                <Disclosure
                                  title="Price History"
                                  open={
                                    !!showHistory[
                                      code
                                    ]
                                  }
                                  onClick={() =>
                                    setShowHistory(
                                      (prev) => ({
                                        ...prev,
                                        [code]:
                                          !prev[
                                            code
                                          ],
                                      }),
                                    )
                                  }
                                >
                                  <div className="space-y-1">
                                    {meta.history.map(
                                      (row) => (
                                        <div
                                          key={
                                            row._id
                                          }
                                          className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2.5 text-xs"
                                        >
                                          <span className="text-neutral-500">
                                            {date(
                                              row.effectiveFrom,
                                            )}
                                          </span>

                                          <span className="font-semibold">
                                            {money(
                                              row.newPrice,
                                            )}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </Disclosure>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    },
                  )}

                  {!fabrics.length && (
                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center">
                      <Layers3 className="mx-auto h-5 w-5 text-neutral-300" />

                      <p className="mt-2 text-sm text-neutral-400">
                        No fabrics assigned yet.
                      </p>
                    </div>
                  )}
                </div>
              </Section>

              {/* =================================================
                  CONSUMPTION
              ================================================= */}

              <Section
                eyebrow="Per piece"
                title="Fabric Consumption"
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Average">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={consumption.value}
                      onChange={(event) =>
                        setConsumption(
                          (prev) => ({
                            ...prev,
                            value:
                              event.target
                                .value,
                          }),
                        )
                      }
                      className="luxury-input"
                    />
                  </Field>

                  <Field label="Unit">
                    <select
                      value={consumption.unit}
                      onChange={(event) =>
                        setConsumption(
                          (prev) => ({
                            ...prev,
                            unit: event.target
                              .value,
                          }),
                        )
                      }
                      className="luxury-input appearance-none"
                    >
                      {UNITS.map(
                        ([value, label]) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>

                  <Field label="Waste %">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={
                        consumption.wastePercentage
                      }
                      onChange={(event) =>
                        setConsumption(
                          (prev) => ({
                            ...prev,
                            wastePercentage:
                              event.target
                                .value,
                          }),
                        )
                      }
                      className="luxury-input"
                    />
                  </Field>
                </div>

                <div className="mt-4 flex items-end justify-between rounded-2xl bg-[#f7f7f5] p-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                      Effective consumption
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      Including{" "}
                      {n(
                        consumption.wastePercentage,
                      )}
                      % wastage
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-semibold tracking-[-0.04em]">
                      {(
                        n(consumption.value) *
                        (1 +
                          n(
                            consumption.wastePercentage,
                          ) /
                            100)
                      ).toFixed(2)}
                    </span>

                    <span className="ml-1.5 text-xs font-medium uppercase text-neutral-400">
                      {consumption.unit}
                    </span>
                  </div>
                </div>
              </Section>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <div className="sticky bottom-4 z-30 pt-1">
                <div className="flex items-center justify-between gap-3 rounded-[20px] border border-neutral-200 bg-white/95 p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.09)] backdrop-blur-xl">
                  <div className="hidden pl-2 sm:block">
                    <p className="text-xs font-medium">
                      {changed
                        ? "Unsaved changes"
                        : "Everything saved"}
                    </p>

                    <p className="mt-0.5 text-[10px] text-neutral-400">
                      {changed
                        ? "Review and save your updates"
                        : "Product fabric data is up to date"}
                    </p>
                  </div>

                  <div className="flex w-full gap-2 sm:w-auto">
                    <button
                      type="button"
                      disabled={
                        !changed || saving
                      }
                      onClick={resetForm}
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-30 sm:flex-none"
                    >
                      <RefreshCcw
                        size={14}
                      />
                      Reset
                    </button>

                    <button
                      type="button"
                      disabled={
                        !changed || saving
                      }
                      onClick={save}
                      className="inline-flex h-11 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30 sm:flex-none"
                    >
                      {saving ? (
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                      ) : (
                        <Save size={15} />
                      )}

                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* =====================================================
          MEDIA
      ===================================================== */}

      <MediaPickerModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        multiple={false}
        folder="miray/products/fabric-prints"
        onSelect={handleMediaSelect}
      />

      {/* =====================================================
          GLOBAL INPUT STYLE
      ===================================================== */}

      <style jsx global>{`
        .luxury-input {
          width: 100%;
          min-height: 46px;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          background: #fafaf9;
          padding: 0 13px;
          font-size: 13px;
          color: #171717;
          outline: none;
          transition:
            border-color 150ms ease,
            background 150ms ease,
            box-shadow 150ms ease;
        }

        .luxury-input::placeholder {
          color: #a3a3a3;
        }

        .luxury-input:hover {
          border-color: #d4d4d4;
        }

        .luxury-input:focus {
          border-color: #171717;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.035);
        }
      `}</style>
    </>
  );
}

/* =========================================================
   UI
========================================================= */

function Section({
  eyebrow,
  title,
  children,
}) {
  return (
    <section className="rounded-[26px] border border-neutral-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:p-6">
      <div className="mb-5">
        {eyebrow && (
          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
            {eyebrow}
          </p>
        )}

        <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium text-neutral-500">
        {label}
      </span>

      {children}
    </label>
  );
}

function FabricImage({
  src,
  name = "Fabric",
  size = "default",
}) {
  const classes =
    size === "small"
      ? "h-11 w-11 rounded-xl"
      : "h-14 w-14 rounded-2xl";

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-neutral-100 ${classes}`}
    >
      {src ? (
        <Image
          src={src}
          alt={name || "Fabric"}
          fill
          unoptimized
          className="object-cover"
        />
      ) : (
        <Layers3
          size={17}
          className="absolute inset-0 m-auto text-neutral-300"
        />
      )}
    </div>
  );
}

function Pill({
  children,
  positive,
  warning,
}) {
  let classes =
    "bg-neutral-100 text-neutral-500";

  if (positive) {
    classes =
      "bg-emerald-50 text-emerald-700";
  }

  if (warning) {
    classes =
      "bg-amber-50 text-amber-700";
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${classes}`}
    >
      {children}
    </span>
  );
}

function Meta({ label, value }) {
  return (
    <div className="min-w-0 px-2 text-center">
      <p className="truncate text-[9px] font-medium uppercase tracking-wider text-neutral-400">
        {label}
      </p>

      <p className="mt-1 truncate text-[11px] font-semibold text-neutral-700">
        {value}
      </p>
    </div>
  );
}

function Cost({ label, value }) {
  return (
    <div>
      <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold tracking-[-0.01em] text-white">
        {value}
      </p>
    </div>
  );
}

function Disclosure({
  title,
  open,
  onClick,
  children,
}) {
  return (
    <div className="px-4 sm:px-5">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between py-3.5 text-left"
      >
        <span className="text-xs font-medium text-neutral-600">
          {title}
        </span>

        {open ? (
          <ChevronUp
            size={14}
            className="text-neutral-400"
          />
        ) : (
          <ChevronDown
            size={14}
            className="text-neutral-400"
          />
        )}
      </button>

      {open && (
        <div className="pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

function MiniButton({
  children,
  muted,
  ...props
}) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-[11px] font-medium transition ${
        muted
          ? "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
          : "bg-black text-white hover:bg-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}

function Empty({ children }) {
  return (
    <div className="rounded-[24px] border border-dashed border-neutral-300 bg-white/50 px-6 py-16 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
        <Package
          size={18}
          className="text-neutral-300"
        />
      </div>

      <p className="mt-4 text-sm text-neutral-400">
        {children}
      </p>
    </div>
  );
}