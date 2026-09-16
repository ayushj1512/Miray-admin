// app/production/barcode/page.jsx
"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import JsBarcode from "jsbarcode";
import jsPDF from "jspdf";
import { useAdminProductStore } from "@/store/adminProductStore";

/* =========================================================
   LABEL SIZE (2 x 1 inch)  (length x breadth)
========================================================= */
const LABEL_W_IN = 2;
const LABEL_H_IN = 1;

const INCH_TO_MM = 25.4;
const LABEL_W_MM = LABEL_W_IN * INCH_TO_MM; // 50.8
const LABEL_H_MM = LABEL_H_IN * INCH_TO_MM; // 25.4

/* ---------------- helpers ---------------- */
const pad5 = (v) => {
  const digits = String(v ?? "").trim().replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits.slice(-5).padStart(5, "0");
};
const safe = (v) => (v == null ? "" : String(v));
const toStr = (v) => String(v ?? "").trim();
const normalizeSize = (v) => toStr(v).toUpperCase();

const parseCodes = (raw) => {
  const parts = String(raw || "")
    .split(/[\s,]+/g)
    .map((x) => pad5(x))
    .filter(Boolean);

  const seen = new Set();
  const out = [];
  for (const c of parts) {
    if (seen.has(c)) continue;
    seen.add(c);
    out.push(c);
  }
  return out;
};

const getVariantSize = (variant) => {
  if (!variant) return "";
  if (variant.size) return String(variant.size);

  const attrs = Array.isArray(variant.attributes) ? variant.attributes : [];
  const hit = attrs.find((a) => {
    const k = String(a?.key || "").trim().toLowerCase();
    return k === "size" || k === "sizes";
  });

  return hit?.value ? String(hit.value) : "";
};

const getBestImage = (p) =>
  p?.thumbnail || (Array.isArray(p?.images) && p.images[0]) || "";

/* =========================================================
   BARCODE -> PNG DATAURL
========================================================= */
function barcodeToPngDataUrl(value) {
  const v = toStr(value);
  if (!v) return "";

  const canvas = document.createElement("canvas");

  try {
    JsBarcode(canvas, v, {
      format: "CODE128",

      // scanner-friendly proportions
      width: 2,
      height: 52,

      displayValue: true,
      font: "Arial",
      fontSize: 14,
      textMargin: 3,

      // IMPORTANT: quiet zone around actual bars
      margin: 12,
      marginTop: 5,
      marginBottom: 5,

      background: "#ffffff",
      lineColor: "#000000",
    });

    return canvas.toDataURL("image/png");
  } catch (e) {
    console.error("Barcode generation failed:", e);
    return "";
  }
}

/* =========================================================
   RELIABLE PRINT (NO POPUP)
   - Creates hidden iframe
   - Waits for ALL images to load
   - Then calls print()
========================================================= */
async function printHtmlViaIframe(html) {
  return new Promise((resolve, reject) => {
    try {
      // remove old iframe if any
      const old = document.getElementById("__print_iframe__");
      if (old) old.remove();

      const iframe = document.createElement("iframe");
      iframe.id = "__print_iframe__";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.opacity = "0";
      iframe.setAttribute("aria-hidden", "true");

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        iframe.remove();
        reject(new Error("Print iframe not available"));
        return;
      }

      doc.open();
      doc.write(html);
      doc.close();

      const win = iframe.contentWindow;
      if (!win) {
        iframe.remove();
        reject(new Error("Print window not available"));
        return;
      }

      // wait for images to load inside iframe
      const waitImages = () => {
        const imgs = Array.from(doc.images || []);
        if (!imgs.length) return Promise.resolve();

        return new Promise((res) => {
          let done = 0;
          const finish = () => {
            done += 1;
            if (done >= imgs.length) res();
          };

          imgs.forEach((img) => {
            // if already loaded
            if (img.complete && img.naturalWidth > 0) return finish();
            img.onload = finish;
            img.onerror = finish; // still proceed (better than stuck)
          });
        });
      };

      // when iframe finishes parsing + images loaded -> print
      setTimeout(async () => {
        await waitImages();
        // small delay helps layout settle
        setTimeout(() => {
          try {
            win.focus();
            win.print();
            // cleanup after print
            setTimeout(() => {
              iframe.remove();
              resolve(true);
            }, 500);
          } catch (e) {
            iframe.remove();
            reject(e);
          }
        }, 150);
      }, 50);
    } catch (e) {
      reject(e);
    }
  });
}

/* =========================================================
   PAGE
========================================================= */
export default function BarcodePage() {
  const storeLoading = useAdminProductStore((s) => s.loading);
  const fetchProducts = useAdminProductStore((s) => s.fetchProducts);

  const [inputCodes, setInputCodes] = useState("");
  const [loadError, setLoadError] = useState("");

  const [loaded, setLoaded] = useState([]); // rows
  const [loadingCodes, setLoadingCodes] = useState(false);

  // sheet items = labels
  const [sheet, setSheet] = useState([]);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState("");

  const buildSkuOptions = (p) => {
    const variants = Array.isArray(p?.variants) ? p.variants : [];
    if (variants.length) {
      const map = new Map(); // size -> sku
      for (const v of variants) {
        const size = normalizeSize(getVariantSize(v));
        const sku = toStr(v?.sku);
        if (!size || !sku) continue;
        if (!map.has(size)) map.set(size, sku);
      }
      return Array.from(map.entries())
        .map(([size, sku]) => ({ size, sku }))
        .sort((a, b) => a.size.localeCompare(b.size));
    }

    const sku = toStr(p?.sku);
    return sku ? [{ size: "—", sku }] : [];
  };

  async function fetchOneProductByCode(code) {
    await fetchProducts({ productCode: code, page: 1, limit: 1 });
    const { products } = useAdminProductStore.getState();
    return Array.isArray(products) ? products[0] : null;
  }

  const loadProducts = async () => {
    const codes = parseCodes(inputCodes);
    if (!codes.length) {
      setLoadError("Enter product codes (comma or space separated).");
      return;
    }

    setLoadError("");
    setPrinting(false);
    setPrintError("");
    setLoadingCodes(true);

    try {
      const results = [];

      for (const code of codes) {
        try {
          const p = await fetchOneProductByCode(code);

          if (!p) {
            results.push({
              code,
              product: null,
              img: "",
              isVariable: false,
              skuOptions: [],
              selectedSize: "",
              selectedSku: "",
              error: `No product found for code ${code}`,
            });
            continue;
          }

          const skuOptions = buildSkuOptions(p);
          const isVariable = Array.isArray(p?.variants) && p.variants.length > 0;
          const img = getBestImage(p);

          let selectedSize = "";
          let selectedSku = "";
          if (skuOptions.length) {
            selectedSize = skuOptions[0].size;
            selectedSku = skuOptions[0].sku;
          }

          results.push({
            code,
            product: p,
            img,
            isVariable,
            skuOptions,
            selectedSize,
            selectedSku,
            error: skuOptions.length ? "" : "Product found, but SKU not set yet.",
          });
        } catch (e) {
          results.push({
            code,
            product: null,
            img: "",
            isVariable: false,
            skuOptions: [],
            selectedSize: "",
            selectedSku: "",
            error: e?.message || "Failed to load product",
          });
        }
      }

      setLoaded(results);
    } finally {
      setLoadingCodes(false);
    }
  };

  const onSelectSize = (code, size) => {
    setLoaded((prev) =>
      prev.map((r) => {
        if (r.code !== code) return r;
        const s = normalizeSize(size);
        const hit = r.skuOptions.find((x) => x.size === s);
        return { ...r, selectedSize: s, selectedSku: hit?.sku || "" };
      })
    );
  };

  const askQty = (defaultQty = 1) => {
    const raw = window.prompt(
      "How many barcodes to print for this product?",
      String(defaultQty)
    );
    if (raw == null) return 0;
    const n = Number(String(raw).trim());
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.min(Math.floor(n), 999);
  };

  const addRowToSheet = (row) => {
    const p = row?.product;
    const sku = toStr(row?.selectedSku);
    if (!p || !sku) return;

    const qty = askQty(1);
    if (!qty) return;

    const barcodePng = barcodeToPngDataUrl(sku);
    if (!barcodePng) return;

    const title = safe(p?.title || "");
    const productCode = safe(p?.productCode || row.code || "");
    const size = safe(row?.selectedSize || "—");

    setSheet((prev) => {
      const next = [...prev];
      for (let i = 0; i < qty; i++) {
        next.push({
          id: `${productCode}-${sku}-${Date.now()}-${i}-${Math.random()
            .toString(16)
            .slice(2)}`,
          productCode,
          title,
          sku,
          size,
          barcodePng,
        });
      }
      return next;
    });
  };

  const clearSheet = () => setSheet([]);
  const removeOne = (id) => setSheet((prev) => prev.filter((x) => x.id !== id));

  /* =========================
     PRINT ALL (FIXED)
  ========================= */
 const printSheet = async () => {
  if (!sheet.length) return;

  setPrinting(true);
  setPrintError("");

  try {
    // 2 labels = 1 physical printer row
    const rows = [];

    for (let i = 0; i < sheet.length; i += 2) {
      rows.push([sheet[i], sheet[i + 1] ?? null]);
    }

    const renderLabel = (item) => {
      if (!item) {
        return `<div class="label empty"></div>`;
      }

      return `
        <div class="label">
          <img
            src="${item.barcodePng}"
            alt="${item.sku || ""}"
          />
        </div>
      `;
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Barcodes</title>

          <style>
            @page {
              size: 101.6mm 25.4mm;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              width: 101.6mm;
              margin: 0;
              padding: 0;
              background: #fff;
            }

            body {
              font-family: Arial, Helvetica, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .print-root {
              width: 101.6mm;
              margin: 0;
              padding: 0;
            }

            /* One physical row = two 2×1 labels */
            .print-row {
              display: grid;
              grid-template-columns: 50.8mm 50.8mm;

              width: 101.6mm;
              height: 25.4mm;

              margin: 0;
              padding: 0;
              gap: 0;

              overflow: hidden;

              break-after: page;
              page-break-after: always;

              break-inside: avoid;
              page-break-inside: avoid;
            }

            .print-row:last-child {
              break-after: auto;
              page-break-after: auto;
            }

            .label {
  width: 50.8mm;
  height: 25.4mm;

  margin: 0;

  /* ~20% safe area around content */
  padding: 2.5mm 5mm;

  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #fff;
}

.label.empty {
  padding: 0;
}

.label img {
  display: block;

  width: 100%;
  height: 100%;

  object-fit: contain;

  margin: 0;
  padding: 0;
}
          </style>
        </head>

        <body>
          <div class="print-root">
            ${rows
              .map(
                ([left, right]) => `
                  <div class="print-row">
                    ${renderLabel(left)}
                    ${renderLabel(right)}
                  </div>
                `
              )
              .join("")}
          </div>
        </body>
      </html>
    `;

    await printHtmlViaIframe(html);
  } catch (e) {
    setPrintError(
      e?.message ||
        "Print failed. Please check printer settings and try again."
    );
  } finally {
    setPrinting(false);
  }
};

  /* =========================
     PDF SHEET (A4, paginate)
  ========================= */
const downloadSheetPdf = async () => {
  if (!sheet.length) return;

  setExportingPdf(true);
  setPrintError("");

  try {
    // =====================================================
    // PHYSICAL PRINTER ROW
    // 2 labels × 2 inch = 4 inch
    // 4 × 1 inch = 101.6 × 25.4 mm
    // =====================================================

    const ROW_W_MM = 101.6;
    const ROW_H_MM = 25.4;
    const SINGLE_LABEL_W_MM = 50.8;

    /*
      Safe barcode area inside each 2×1 label.

      Horizontal:
      5mm left + 40.8mm content + 5mm right

      Vertical:
      2.5mm top + 20.4mm content + 2.5mm bottom
    */
    const SIDE_MARGIN = 5;
    const VERTICAL_MARGIN = 2.5;

    const CONTENT_W =
      SINGLE_LABEL_W_MM - SIDE_MARGIN * 2;

    const CONTENT_H =
      ROW_H_MM - VERTICAL_MARGIN * 2;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",

      // jsPDF custom format
      format: [ROW_H_MM, ROW_W_MM],

      compress: true,
    });

    const drawLabel = (item, labelStartX) => {
      if (!item) return;

      const x = labelStartX + SIDE_MARGIN;
      const y = VERTICAL_MARGIN;

      /*
        IMPORTANT:
        Don't make barcode touch label edges.
        Keep scanner-safe white area.
      */
      doc.addImage(
        item.barcodePng,
        "PNG",
        x,
        y,
        CONTENT_W,
        CONTENT_H,
        undefined,
        "FAST"
      );
    };

    // =====================================================
    // 2 LABELS = 1 PDF PAGE
    // =====================================================

    for (let i = 0; i < sheet.length; i += 2) {
      if (i > 0) {
        doc.addPage(
          [ROW_H_MM, ROW_W_MM],
          "landscape"
        );
      }

      const left = sheet[i];
      const right = sheet[i + 1] ?? null;

      // LEFT LABEL
      drawLabel(left, 0);

      // RIGHT LABEL
      drawLabel(right, SINGLE_LABEL_W_MM);
    }

    doc.save(
      `barcodes_${sheet.length}_labels_2x1.pdf`
    );
  } catch (e) {
    console.error("PDF generation failed:", e);

    setPrintError(
      e?.message ||
        "Failed to generate barcode PDF."
    );
  } finally {
    setExportingPdf(false);
  }
};

  const loadedOkCount = useMemo(
    () => loaded.filter((r) => r.product && r.selectedSku && !r.error).length,
    [loaded]
  );

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="px-4 py-6 md:px-8">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Barcode Sheet Generator
            </h1>
            <p className="text-sm text-neutral-600">
              Label size: <span className="font-mono">2 × 1 inch</span>
            </p>
          </div>
          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-600">
            /production/barcode
          </span>
        </div>

        {/* Input */}
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4">
          <label className="text-xs font-medium text-neutral-700">
            Product Codes (comma / space separated)
          </label>

          <div className="mt-1 flex flex-col gap-2 md:flex-row">
            <input
              value={inputCodes}
              onChange={(e) => setInputCodes(e.target.value)}
              placeholder="e.g. 00123, 00124, 00125"
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") loadProducts();
              }}
            />
            <button
              onClick={loadProducts}
              disabled={storeLoading || loadingCodes}
              className="whitespace-nowrap rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {loadingCodes || storeLoading ? "Loading..." : "Load Products"}
            </button>
          </div>

          {loadError ? (
            <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-red-600">
              {loadError}
            </div>
          ) : null}

          {loaded.length ? (
            <div className="mt-3 text-xs text-neutral-600">
              Loaded: <span className="font-mono">{loaded.length}</span> • Ready:{" "}
              <span className="font-mono">{loadedOkCount}</span>
            </div>
          ) : null}
        </div>

        {/* Loaded products */}
        {loaded.length ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {loaded.map((row) => {
              const p = row.product;
              const img = row.img;

              return (
                <div
                  key={row.code}
                  className="rounded-2xl border border-neutral-200 bg-white p-4"
                >
                  <div className="flex gap-3">
                    <div className="relative h-24 w-20 overflow-hidden rounded-xl bg-neutral-50">
                      {img ? (
                        <Image
                          src={img}
                          alt={safe(p?.title)}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-neutral-100" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-neutral-900">
                        {p ? safe(p?.title) : "Not found"}
                      </div>
                      <div className="mt-1 text-xs text-neutral-600">
                        Code: <span className="font-mono">{row.code}</span>
                      </div>

                      {p ? (
                        <div className="text-xs text-neutral-600">
                          Type:{" "}
                          <span className="font-mono">
                            {row.isVariable ? "variable" : "simple"}
                          </span>
                        </div>
                      ) : null}

                      {row.error ? (
                        <div className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-red-600">
                          {row.error}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Size/SKU */}
                  <div className="mt-3 grid gap-2">
                    <label className="text-xs font-medium text-neutral-700">
                      {p ? (row.isVariable ? "Size (auto SKU)" : "SKU") : "Size / SKU"}
                    </label>

                    {p && row.isVariable ? (
                      <select
                        value={row.selectedSize}
                        onChange={(e) => onSelectSize(row.code, e.target.value)}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400"
                      >
                        {row.skuOptions.length ? (
                          row.skuOptions.map((o) => (
                            <option key={o.size} value={o.size}>
                              {o.size} — {o.sku}
                            </option>
                          ))
                        ) : (
                          <option value="">No SKU found</option>
                        )}
                      </select>
                    ) : (
                      <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm">
                        <span className="font-mono">{row.selectedSku || "—"}</span>
                      </div>
                    )}

                    <div className="text-xs text-neutral-500">
                      Selected SKU:{" "}
                      <span className="font-mono">{row.selectedSku || "—"}</span>
                    </div>

                    {/* Preview 2x1 inch */}
                    {p && row.selectedSku ? (
                      <div className="mt-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                        <div className="text-xs text-neutral-600 mb-2">
                          Preview (2×1 inch)
                        </div>
                        <div
                          className="border border-neutral-200 bg-white overflow-hidden"
                          style={{ width: `${LABEL_W_IN}in`, height: `${LABEL_H_IN}in` }}
                        >
                          <img
                            src={barcodeToPngDataUrl(row.selectedSku)}
                            alt={row.selectedSku}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              display: "block",
                            }}
                          />
                        </div>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => addRowToSheet(row)}
                        disabled={!p || !row.selectedSku || !!row.error}
                        className="rounded-xl bg-black px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
                      >
                        Add to Sheet (asks qty)
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Sheet controls */}
   <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4">
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <div className="text-sm font-semibold text-neutral-900">
        Print Sheet
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-600">
        <span>
          Labels:{" "}
          <span className="font-mono font-medium text-black">
            {sheet.length}
          </span>
        </span>

        <span>•</span>

        <span>
          Physical rows:{" "}
          <span className="font-mono font-medium text-black">
            {Math.ceil(sheet.length / 2)}
          </span>
        </span>

        <span>•</span>

        <span>
          Label:{" "}
          <span className="font-mono font-medium text-black">
            2×1 inch
          </span>
        </span>

        <span>•</span>

        <span>
          2 labels / row
        </span>
      </div>

      {printError ? (
        <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {printError}
        </div>
      ) : null}
    </div>

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={printSheet}
        disabled={!sheet.length || printing}
        className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {printing ? "Opening Print..." : "Print All"}
      </button>

      <button
        type="button"
        onClick={downloadSheetPdf}
        disabled={!sheet.length || exportingPdf}
        className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {exportingPdf ? "Creating PDF..." : "Download PDF"}
      </button>

      <button
        type="button"
        onClick={clearSheet}
        disabled={!sheet.length}
        className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Clear
      </button>
    </div>
  </div>

  {sheet.length ? (
    <div className="mt-5 border-t border-neutral-100 pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-xs font-medium text-neutral-600">
          Label Preview
        </div>

        <div className="text-[11px] text-neutral-400">
          Print order: left → right
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sheet.slice(0, 12).map((x, index) => (
          <div
            key={x.id}
            className="rounded-xl bg-neutral-50 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-black px-1.5 text-[10px] font-medium text-white">
                    {index + 1}
                  </span>

                  <div className="truncate text-xs font-semibold text-neutral-900">
                    {x.title || "—"}
                  </div>
                </div>

                <div className="mt-2 space-y-0.5 text-[11px] text-neutral-500">
                  <div>
                    Code:{" "}
                    <span className="font-mono text-neutral-800">
                      {x.productCode}
                    </span>
                  </div>

                  <div>
                    SKU:{" "}
                    <span className="font-mono text-neutral-800">
                      {x.sku}
                    </span>
                  </div>

                  <div>
                    Size:{" "}
                    <span className="font-mono text-neutral-800">
                      {x.size}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeOne(x.id)}
                className="shrink-0 rounded-lg px-2 py-1 text-[11px] text-red-500 transition hover:bg-red-50"
              >
                Remove
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-lg bg-white p-2">
              <img
                src={x.barcodePng}
                alt={x.sku}
                className="block h-auto w-full"
              />
            </div>

            <div className="mt-2 text-[10px] text-neutral-400">
              Row {Math.floor(index / 2) + 1} •{" "}
              {index % 2 === 0 ? "Left" : "Right"}
            </div>
          </div>
        ))}
      </div>

      {sheet.length > 12 ? (
        <div className="mt-3 text-xs text-neutral-500">
          Showing first 12 labels. Print/PDF includes all{" "}
          <span className="font-mono font-medium text-black">
            {sheet.length}
          </span>{" "}
          labels.
        </div>
      ) : null}

      <div className="mt-4 rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
        TSC Print:{" "}
        <span className="font-medium text-neutral-800">
          2 X 1
        </span>
        {" • "}Portrait
        {" • "}100% Scale
        {" • "}No Margins
        {" • "}1 Page Per Sheet
      </div>
    </div>
  ) : (
    <div className="mt-4 border-t border-neutral-100 pt-4 text-xs text-neutral-500">
      Add products above to create your print sheet.
    </div>
  )}
</div>

        <div className="mt-3 text-xs text-neutral-500">
          Tip: For perfect physical size, in the browser print dialog set{" "}
          <span className="font-mono">Scale = 100% / Actual size</span>.
        </div>
      </div>
    </div>
  );
}

