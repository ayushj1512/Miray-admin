"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertCircle,
    ArrowRight,
    Check,
    ChevronDown,
    Download,
    FileSpreadsheet,
    Loader2,
    Package,
    PackagePlus,
    Trash2,
    Upload,
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

    const {
        importBarcodeInventoryExcel,
        fetchSelectedProductsByCodes,
        saving,
    } = useAdminProductStore();

    const [file, setFile] = useState(null);
    const [scans, setScans] = useState([]);
    const [invalid, setInvalid] = useState([]);
    const [reading, setReading] = useState(false);
    const [result, setResult] = useState(null);
    const [showHowTo, setShowHowTo] = useState(false);
    const [productDetails, setProductDetails] = useState({});
    const [loadingProducts, setLoadingProducts] = useState(false);
const [previewImage, setPreviewImage] = useState(null);
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

    const uniqueProductCodes = useMemo(() => {
        return [
            ...new Set(
                scans
                    .map((scan) => scan.productCode)
                    .filter(Boolean)
            ),
        ];
    }, [scans]);

    useEffect(() => {
        if (!uniqueProductCodes.length) {
            setProductDetails({});
            return;
        }

        let cancelled = false;

        const loadProductDetails = async () => {
            try {
                setLoadingProducts(true);

                const products =
                    await fetchSelectedProductsByCodes(
                        uniqueProductCodes
                    );

                if (cancelled) return;

                const map = {};

                (products || []).forEach((product) => {
                    const code = String(
                        product?.productCode || ""
                    )
                        .trim()
                        .toUpperCase();

                    if (!code) return;

                    map[code] = {
                        title:
                            product?.title ||
                            product?.name ||
                            "Untitled Product",

                        image:
                            product?.images?.[0]?.url ||
                            product?.images?.[0] ||
                            product?.image?.url ||
                            product?.image ||
                            product?.featuredImage?.url ||
                            product?.featuredImage ||
                            "",
                    };
                });

                setProductDetails(map);
            } catch (error) {
                console.error(
                    "Failed to load product details:",
                    error
                );
            } finally {
                if (!cancelled) {
                    setLoadingProducts(false);
                }
            }
        };

        loadProductDetails();

        return () => {
            cancelled = true;
        };
    }, [uniqueProductCodes, fetchSelectedProductsByCodes]);

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
                 {/* INVENTORY */}
<div className="overflow-hidden rounded-[24px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.04)]">
    {/* HEADER */}
    <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white">
                    <Package size={15} />
                </div>

                <h2 className="text-[15px] font-semibold tracking-tight text-gray-950">
                    Inventory Review
                </h2>
            </div>

            <p className="mt-2 text-xs leading-5 text-gray-500">
                Review products, sizes and quantities before adding stock.
            </p>
        </div>

        <div className="flex items-center gap-2">
            {loadingProducts && (
                <div className="flex items-center gap-2 rounded-full bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
                    <Loader2 size={13} className="animate-spin" />
                    Loading products
                </div>
            )}

            <div className="rounded-full bg-black px-3.5 py-2 text-xs font-semibold text-white">
                {totalPieces} pieces
            </div>
        </div>
    </div>

    {/* TABLE */}
    <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
            <thead>
                <tr className="border-b border-gray-100 bg-[#FAFAFA]">
                    <th className="px-6 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                        Product
                    </th>

                    <th className="px-4 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                        Category
                    </th>

                    <th className="px-4 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                        Size
                    </th>

                    <th className="px-4 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                        Quantity
                    </th>

                    <th className="w-[70px] px-6 py-3.5" />
                </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
                {aggregated.map((row) => {
                    const code = String(
                        row.productCode
                    )
                        .trim()
                        .toUpperCase();

                    const details =
                        productDetails[code];

                    return (
                        <tr
                            key={row.key}
                            className="group transition-colors duration-150 hover:bg-gray-50/60"
                        >
                            {/* PRODUCT */}
                            <td className="px-6 py-4">
                                <div className="flex min-w-[300px] items-center gap-3.5">
                                    {/* IMAGE */}
                                  <button
    type="button"
    disabled={!details?.image}
    onClick={() => {
        if (!details?.image) return;

        setPreviewImage({
            src: details.image,
            title:
                details?.title ||
                row.productCode,
            code: row.productCode,
        });
    }}
    className="group/image relative h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100 disabled:cursor-default"
>
    {details?.image ? (
        <>
            <img
                src={details.image}
                alt={
                    details?.title ||
                    row.productCode
                }
                className="h-full w-full object-cover transition duration-300 group-hover/image:scale-110"
            />

            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover/image:bg-black/20">
                <span className="scale-75 rounded-full bg-white/95 px-2 py-1 text-[9px] font-semibold text-black opacity-0 shadow-sm transition group-hover/image:scale-100 group-hover/image:opacity-100">
                    VIEW
                </span>
            </div>
        </>
    ) : (
        <div className="flex h-full w-full items-center justify-center text-[9px] font-medium text-gray-400">
            IMG
        </div>
    )}
</button>
                                    {/* DETAILS */}
                                    <div className="min-w-0">
                                        <p className="max-w-[330px] truncate text-[13px] font-semibold leading-5 text-gray-950">
                                            {loadingProducts &&
                                            !details
                                                ? "Loading product..."
                                                : details?.title ||
                                                  "Product not found"}
                                        </p>

                                        <div className="mt-1.5 flex items-center gap-2">
                                            <span className="font-mono text-[11px] font-medium tracking-wide text-gray-400">
                                                {row.productCode}
                                            </span>

                                            {!loadingProducts &&
                                                !details && (
                                                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-red-600">
                                                        Missing
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </td>

                            {/* CATEGORY */}
                            <td className="px-4 py-4">
                                <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600">
                                    {row.categoryCode}
                                </span>
                            </td>

                            {/* SIZE */}
                            <td className="px-4 py-4">
                                <span className="inline-flex h-8 min-w-10 items-center justify-center rounded-lg bg-black px-2.5 text-[11px] font-bold text-white">
                                    {row.size}
                                </span>
                            </td>

                            {/* QUANTITY */}
                            <td className="px-4 py-4 text-right">
                                <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2">
                                    <span className="text-xs font-semibold text-emerald-500">
                                        +
                                    </span>

                                    <span className="text-[13px] font-bold tabular-nums text-emerald-700">
                                        {row.quantity}
                                    </span>
                                </div>
                            </td>

                            {/* REMOVE */}
                            <td className="px-6 py-4 text-right">
                                <button
                                    type="button"
                                    onClick={() =>
                                        removeGroup(row)
                                    }
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-300 transition-all duration-150 hover:bg-red-50 hover:text-red-500 active:scale-95"
                                    title="Remove from import"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>

    {/* EMPTY */}
    {!aggregated.length && (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                <Package
                    size={20}
                    className="text-gray-400"
                />
            </div>

            <p className="mt-3 text-sm font-semibold text-gray-900">
                No inventory to add
            </p>

            <p className="mt-1 text-xs text-gray-500">
                No valid barcode rows remain in this file.
            </p>
        </div>
    )}

    {/* CONFIRM FOOTER */}
    <div className="border-t border-gray-100 bg-[#FAFAFA] px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <Check
                        size={16}
                        strokeWidth={2.5}
                        className="text-emerald-700"
                    />
                </div>

                <div>
                    <p className="text-[13px] font-semibold text-gray-900">
                        Ready to update inventory
                    </p>

                    <p className="mt-0.5 text-[11px] text-gray-500">
                        {totalPieces} pieces across{" "}
                        {products} products will be
                        added.
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={confirmImport}
                disabled={
                    saving ||
                    loadingProducts ||
                    !scans.length
                }
                className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-gray-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
                {saving ? (
                    <>
                        <Loader2
                            size={15}
                            className="animate-spin"
                        />
                        Adding Inventory...
                    </>
                ) : (
                    <>
                        Confirm & Add Inventory
                        <ArrowRight
                            size={15}
                            className="transition-transform group-hover:translate-x-0.5"
                        />
                    </>
                )}
            </button>
        </div>
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

            {/* IMAGE LIGHTBOX */}
{previewImage && (
    <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={() =>
            setPreviewImage(null)
        }
    >
        {/* CLOSE */}
        <button
            type="button"
            onClick={() =>
                setPreviewImage(null)
            }
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-light text-black shadow-lg transition hover:scale-105"
        >
            ×
        </button>

        {/* IMAGE CARD */}
        <div
            className="flex max-h-[92vh] max-w-[92vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) =>
                e.stopPropagation()
            }
        >
            {/* IMAGE */}
            <div className="flex min-h-0 items-center justify-center bg-[#f5f5f5]">
                <img
                    src={previewImage.src}
                    alt={
                        previewImage.title
                    }
                    className="max-h-[80vh] max-w-[88vw] object-contain"
                />
            </div>

            {/* PRODUCT INFO */}
            <div className="flex items-center justify-between gap-6 border-t border-gray-100 px-5 py-4">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-950">
                        {
                            previewImage.title
                        }
                    </p>

                    <p className="mt-0.5 font-mono text-[11px] text-gray-400">
                        {
                            previewImage.code
                        }
                    </p>
                </div>

                <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-[10px] font-semibold text-gray-500">
                    PRODUCT IMAGE
                </span>
            </div>
        </div>
    </div>
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