"use client";

import { useMemo, useRef, useState } from "react";
import {
    Upload,
    Download,
    FileSpreadsheet,
    Trash2,
    Loader2,
    PackagePlus,
    RotateCcw,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useAdminProductStore } from "@/store/adminProductStore";

const clean = (v) => String(v ?? "").trim();

const SIZES = new Set([
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "3XL",
    "4XL",
    "5XL",
    "FREE",
]);

const parseBarcode = (value) => {
    const barcode = clean(value).toUpperCase().replace(/\s+/g, "");
    const parts = barcode.split("-").filter(Boolean);

    // TEE-00398-XS
    if (parts.length !== 3) throw new Error("Invalid barcode");

    const [categoryCode, productCode, size] = parts;

    if (!categoryCode || !productCode || !SIZES.has(size)) {
        throw new Error("Invalid barcode");
    }

    return {
        barcode,
        categoryCode,
        productCode: /^\d+$/.test(productCode)
            ? productCode.padStart(5, "0")
            : productCode,
        size,
    };
};

export default function BulkAddInventoryPage() {
    const inputRef = useRef(null);

    const { importBarcodeInventoryExcel, saving } =
        useAdminProductStore();

    const [file, setFile] = useState(null);
    const [scans, setScans] = useState([]);
    const [invalid, setInvalid] = useState([]);
    const [reading, setReading] = useState(false);
    const [result, setResult] = useState(null);
    const [showHowTo, setShowHowTo] = useState(false);

    /* ---------------- AGGREGATION ---------------- */

    const aggregated = useMemo(() => {
        const map = new Map();

        scans.forEach((scan) => {
            const key = `${scan.categoryCode}-${scan.productCode}-${scan.size}`;

            if (!map.has(key)) {
                map.set(key, {
                    key,
                    categoryCode: scan.categoryCode,
                    productCode: scan.productCode,
                    size: scan.size,
                    quantity: 0,
                });
            }

            map.get(key).quantity++;
        });

        return [...map.values()].sort((a, b) =>
            `${a.categoryCode}-${a.productCode}-${a.size}`.localeCompare(
                `${b.categoryCode}-${b.productCode}-${b.size}`
            )
        );
    }, [scans]);

    const totalPieces = scans.length;

    const products = useMemo(
        () =>
            new Set(
                scans.map((x) => `${x.categoryCode}-${x.productCode}`)
            ).size,
        [scans]
    );

    /* ---------------- SAMPLE ---------------- */

    const downloadSample = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ["Barcode"],
            ["TEE-00398-XS"],
            ["TEE-00398-XS"],
            ["TEE-00398-S"],
            ["TEE-00398-M"],
            ["DRS-00125-S"],
            ["DRS-00125-M"],
            ["DRS-00125-M"],
        ]);

        ws["!cols"] = [{ wch: 25 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Inventory");

        XLSX.writeFile(wb, "miray-inventory-sample.xlsx");
    };

    /* ---------------- READ FILE ---------------- */

    const readFile = async (selectedFile) => {
        if (!selectedFile) return;

        setReading(true);
        setResult(null);

        try {
            const buffer = await selectedFile.arrayBuffer();
            const wb = XLSX.read(buffer, { type: "array" });
            const ws = wb.Sheets[wb.SheetNames[0]];

            const rows = XLSX.utils.sheet_to_json(ws, {
                header: 1,
                defval: "",
                raw: false,
            });

            const valid = [];
            const bad = [];

            rows.forEach((row, index) => {
                if (!Array.isArray(row)) return;

                const cell = row.find((v) => {
                    const value = clean(v).toUpperCase();
                    const parts = value.split("-");

                    return (
                        parts.length === 3 &&
                        SIZES.has(parts[2])
                    );
                });

                if (!cell) return;

                try {
                    valid.push({
                        id: `${index}-${Date.now()}`,
                        row: index + 1,
                        ...parseBarcode(cell),
                    });
                } catch (e) {
                    bad.push({
                        row: index + 1,
                        barcode: clean(cell),
                        reason: e.message,
                    });
                }
            });

            if (!valid.length) {
                throw new Error("No valid barcodes found");
            }

            setFile(selectedFile);
            setScans(valid);
            setInvalid(bad);
        } catch (e) {
            alert(e.message || "Failed to read Excel");
        } finally {
            setReading(false);
        }
    };

    /* ---------------- REMOVE AGGREGATED ROW ---------------- */

    const removeGroup = (row) => {
        setScans((current) =>
            current.filter(
                (scan) =>
                    !(
                        scan.categoryCode === row.categoryCode &&
                        scan.productCode === row.productCode &&
                        scan.size === row.size
                    )
            )
        );
    };

    /* ---------------- RESET ---------------- */

    const reset = () => {
        setFile(null);
        setScans([]);
        setInvalid([]);
        setResult(null);

        if (inputRef.current) inputRef.current.value = "";
    };

    /* ---------------- CREATE CLEAN FILE ---------------- */

    const createFinalFile = () => {
        const rows = [
            ["Barcode"],
            ...scans.map((scan) => [scan.barcode]),
        ];

        const ws = XLSX.utils.aoa_to_sheet(rows);

        const wb = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            wb,
            ws,
            "Inventory"
        );

        const buffer = XLSX.write(wb, {
            bookType: "xlsx",
            type: "array",
        });

        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        return new File(
            [blob],
            `miray-confirmed-inventory-${Date.now()}.xlsx`,
            {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }
        );
    };

    /* ---------------- CONFIRM ---------------- */

    const confirmImport = async () => {
        if (!scans.length) return;

        const ok = window.confirm(
            `Add ${totalPieces} pieces?\n\n` +
            `${products} products\n` +
            `${aggregated.length} size variants`
        );

        if (!ok) return;

        try {
            const finalFile = createFinalFile();

            console.log("📦 FINAL INVENTORY FILE:", {
                name: finalFile.name,
                size: finalFile.size,
                type: finalFile.type,
                scans: scans.length,
            });

            const data =
                await importBarcodeInventoryExcel(
                    finalFile
                );

            if (data) {
                setResult(data);
            }
        } catch (error) {
            console.error(
                "❌ Inventory import failed:",
                error
            );
        }
    };

    /* ---------------- RESULT ---------------- */

    if (result) {
        const summary = result?.summary || {};
        const success = result?.updated || [];
        const failed = result?.failed || [];

        return (
            <Page>




                <Header downloadSample={downloadSample} />

                {/* HOW TO USE */}
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <button
                        type="button"
                        onClick={() => setShowHowTo((prev) => !prev)}
                        className="flex w-full items-center justify-between px-5 py-4 text-left"
                    >
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                How to Use
                            </p>

                            <p className="mt-0.5 text-xs text-gray-500">
                                Quick guide for bulk inventory upload
                            </p>
                        </div>

                        <span className="text-xs font-medium text-gray-600">
                            {showHowTo ? "Hide ↑" : "Show ↓"}
                        </span>
                    </button>

                    {showHowTo && (
                        <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                            <div className="grid gap-5 md:grid-cols-4">
                                {[
                                    {
                                        step: "01",
                                        title: "Scan Barcodes",
                                        text: "Scan every finished piece into Excel. One barcode = one physical piece.",
                                    },
                                    {
                                        step: "02",
                                        title: "Upload Excel",
                                        text: "Upload XLSX, XLS or CSV. Repeated scans are automatically aggregated.",
                                    },
                                    {
                                        step: "03",
                                        title: "Review",
                                        text: "Check product, size and quantity. Remove any incorrect row before confirming.",
                                    },
                                    {
                                        step: "04",
                                        title: "Confirm",
                                        text: "Click Confirm & Add Inventory. Only remaining rows will be added.",
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.step}
                                        className="flex gap-3"
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                                            {item.step}
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {item.title}
                                            </p>

                                            <p className="mt-1 text-xs leading-5 text-gray-500">
                                                {item.text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-600">
                                <span className="font-medium text-gray-900">
                                    Barcode Format:
                                </span>{" "}
                                TEE-00398-XS → Category: TEE • Product: 00398 • Size: XS
                            </div>
                        </div>
                    )}
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />

                            <div>
                                <h2 className="font-semibold">
                                    Inventory Added
                                </h2>

                                <p className="text-sm text-gray-500">
                                    {summary.inventoryAdded || 0} pieces added
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={reset}
                            className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm text-white"
                        >
                            <RotateCcw size={16} />
                            New Upload
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Stat label="Added" value={summary.inventoryAdded} />
                    <Stat label="Success" value={summary.updated ?? success.length} />
                    <Stat label="Failed" value={summary.failed ?? failed.length} />
                    <Stat label="Scanned" value={summary.scanned} />
                </div>

                {!!success.length && (
                    <ResultTable title="Successful" rows={success} />
                )}

                {!!failed.length && (
                    <ResultTable title="Failed" rows={failed} failed />
                )}
            </Page>
        );
    }

    return (
      <Page>
  <Header downloadSample={downloadSample} />

  {/* HOW TO USE */}
  <div className="overflow-hidden rounded-xl bg-white shadow-sm">
    <button
      onClick={() => setShowHowTo((v) => !v)}
      className="flex w-full items-center justify-between p-4 text-left"
    >
      <div>
        <p className="text-sm font-semibold">How to Use</p>
        <p className="text-xs text-gray-500">
          Quick guide for bulk inventory upload
        </p>
      </div>

      <span className="text-xs font-medium">
        {showHowTo ? "Hide ↑" : "Show ↓"}
      </span>
    </button>

    {showHowTo && (
      <div className="border-t p-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["01", "Scan", "Scan every piece into Excel."],
            ["02", "Upload", "Upload XLSX, XLS or CSV."],
            ["03", "Review", "Check product, size and quantity."],
            ["04", "Confirm", "Remove errors, then confirm inventory."],
          ].map(([no, title, text]) => (
            <div key={no} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-xs text-white">
                {no}
              </span>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-gray-500">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
          <b>Format:</b> TEE-00398-XS → Category TEE • Product 00398 • Size XS
        </p>
      </div>
    )}
  </div>

  {!file ? (
    <div
      onClick={() => inputRef.current?.click()}
      className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center"
    >
      {reading ? (
        <Loader2 className="mb-3 animate-spin" />
      ) : (
        <Upload className="mb-3" />
      )}

      <h2 className="font-semibold">Upload Barcode Excel</h2>
      <p className="mt-1 text-sm text-gray-500">XLSX, XLS or CSV</p>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        hidden
        onChange={(e) => readFile(e.target.files?.[0])}
      />
    </div>
  ) : (
    <>
      {/* FILE */}
      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="text-green-600" />
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-gray-500">
              Remove incorrect rows before confirmation
            </p>
          </div>
        </div>

        <button onClick={reset} className="text-sm text-red-600">
          Remove File
        </button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Pieces" value={totalPieces} />
        <Stat label="Products" value={products} />
        <Stat label="Aggregated Rows" value={aggregated.length} />
        <Stat label="Invalid" value={invalid.length} />
      </div>

      {/* INVENTORY */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between p-5">
          <div>
            <h2 className="font-semibold">Aggregated Inventory</h2>
            <p className="text-xs text-gray-500">
              Category + Product Code + Size
            </p>
          </div>
          <b>{totalPieces} pieces</b>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-5 py-3">CATEGORY</th>
                <th className="px-5 py-3">PRODUCT</th>
                <th className="px-5 py-3">SIZE</th>
                <th className="px-5 py-3 text-right">QTY</th>
                <th className="px-5 py-3 text-right">REMOVE</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {aggregated.map((row) => (
                <tr key={row.key}>
                  <td className="px-5 py-3">{row.categoryCode}</td>
                  <td className="px-5 py-3">{row.productCode}</td>
                  <td className="px-5 py-3">{row.size}</td>
                  <td className="px-5 py-3 text-right font-semibold">
                    +{row.quantity}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => removeGroup(row)}
                      className="p-2 text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between bg-gray-50 p-5">
          <div>
            <p className="font-medium">
              Ready to add {totalPieces} pieces?
            </p>
            <p className="text-xs text-gray-500">
              Removed rows will not be sent.
            </p>
          </div>

          <button
            onClick={confirmImport}
            disabled={saving || !scans.length}
            className="rounded-xl bg-black px-6 py-3 text-sm text-white disabled:opacity-40"
          >
            {saving ? "Adding..." : "Confirm & Add Inventory"}
          </button>
        </div>
      </div>

      {/* INVALID */}
      {!!invalid.length && (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500" />
            <b>Invalid Scans ({invalid.length})</b>
          </div>

          {invalid.map((x, i) => (
            <p key={i} className="border-t py-2 text-xs text-red-600">
              Row {x.row}: {x.barcode} — {x.reason}
            </p>
          ))}
        </div>
      )}
    </>
  )}
</Page>
    );
}

/* ---------------- SMALL COMPONENTS ---------------- */

function Page({ children }) {
    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="w-full space-y-5 px-4 py-6 md:px-6 lg:px-8">
                {children}
            </div>
        </div>
    );
}

function Header({ downloadSample }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div>
                <div className="flex items-center gap-2">
                    <PackagePlus size={21} />
                    <h1 className="text-2xl font-semibold">
                        Bulk Add Inventory
                    </h1>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                    Scan → Preview → Remove → Confirm
                </p>
            </div>

            <button
                onClick={downloadSample}
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm shadow-sm"
            >
                <Download size={16} />
                Sample Excel
            </button>
        </div>
    );
}

function Stat({ label, value = 0 }) {
    return (
        <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold">
                {Number(value || 0).toLocaleString("en-IN")}
            </p>
        </div>
    );
}

function ResultTable({ title, rows, failed = false }) {
    return (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="p-5 font-semibold">
                {title} ({rows.length})
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs text-gray-500">
                        <tr>
                            <th className="px-5 py-3">PRODUCT</th>
                            <th className="px-5 py-3">SIZE</th>
                            <th className="px-5 py-3 text-right">QTY</th>
                            {failed && <th className="px-5 py-3">REASON</th>}
                        </tr>
                    </thead>

                    <tbody className="divide-y">
                        {rows.map((row, i) => (
                            <tr key={i}>
                                <td className="px-5 py-3">
                                    {row.productCode || "—"}
                                </td>

                                <td className="px-5 py-3">
                                    {row.size || "—"}
                                </td>

                                <td className="px-5 py-3 text-right font-medium">
                                    {failed
                                        ? row.quantity || 0
                                        : `+${row.quantityAdded ?? row.quantity ?? 0}`}
                                </td>

                                {failed && (
                                    <td className="px-5 py-3 text-red-600">
                                        {row.reason || "Failed"}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}