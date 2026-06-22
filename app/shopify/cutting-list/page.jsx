// app/shopify/cutting-list/page.jsx

"use client";

import { useEffect } from "react";
import * as XLSX from "xlsx";
import {
    AlertCircle,
    Clock,
    Download,
    Eye,
    RefreshCw,
    Scissors,
} from "lucide-react";
import cuttingBatchStore from "@/store/cuttingbatchstore";

export default function ShopifyCuttingListPage() {
    const {
        batches,
        selectedBatch,
        loading,
        creating,
        error,
        fetchCuttingBatches,
        createCuttingBatch,
        setSelectedBatch,
        clearError,
    } = cuttingBatchStore();

    useEffect(() => {
        fetchCuttingBatches();
    }, [fetchCuttingBatches]);

    const lastBatch = batches?.[0] || null;

    const formatDateTime = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const downloadExcel = (batch) => {
        if (!batch?.rows?.length) {
            alert("No items found in this cutting batch.");
            return;
        }

        const rows = batch.rows.map((item) => ({
            "Product Name": item.productTitle || "",
            Code: item.productCode || "",
            Image: item.productImage || "",
            XS: item.xs || 0,
            S: item.s || 0,
            M: item.m || 0,
            L: item.l || 0,
            XL: item.xl || 0,
            Total: item.totalQty || 0,
        }));

        const ws = XLSX.utils.json_to_sheet(rows);

        ws["!cols"] = [
            { wch: 42 },
            { wch: 18 },
            { wch: 55 },
            { wch: 8 },
            { wch: 8 },
            { wch: 8 },
            { wch: 8 },
            { wch: 8 },
            { wch: 10 },
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Cutting List");

        XLSX.writeFile(
            wb,
            `${batch.batchNumber || "cutting-list"}-${batch.fromOrderNumber}-to-${batch.toOrderNumber
            }.xlsx`
        );
    };

    const handleGenerate = async () => {
        clearError();

        const res = await createCuttingBatch();

        if (res?.success && res?.batch) {
            downloadExcel(res.batch);
            await fetchCuttingBatches();
        }
    };

    return (
        <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950">
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-zinc-200 p-5 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Scissors size={20} />
                                <h1 className="text-xl font-semibold tracking-tight">
                                    Cutting List
                                </h1>
                            </div>

                            <p className="mt-1 text-sm text-zinc-500">
                                Generate cutting batches from pending Shopify inventory reservations.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                                onClick={fetchCuttingBatches}
                                disabled={loading}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60"
                            >
                                <RefreshCw
                                    size={16}
                                    className={loading ? "animate-spin" : ""}
                                />
                                Refresh
                            </button>

                            <button
                                onClick={handleGenerate}
                                disabled={creating}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                            >
                                {creating ? (
                                    <RefreshCw size={16} className="animate-spin" />
                                ) : (
                                    <Download size={16} />
                                )}
                                Generate & Download
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-4 p-5 md:grid-cols-4">
                        <Stat label="Last Batch" value={lastBatch?.batchNumber || "-"} />
                        <Stat label="Last Range" value={lastBatch ? `${lastBatch.fromOrderNumber} → ${lastBatch.toOrderNumber}` : "-"} />
                        <Stat label="Last Generated" value={formatDateTime(lastBatch?.createdAt)} />
                        <Stat label="Last Quantity" value={lastBatch?.totalPieces || 0} />
                    </div>

                    {error && (
                        <div className="mx-5 mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            <AlertCircle size={18} className="mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}
                </section>

                {selectedBatch && (
                    <BatchDetails
                        batch={selectedBatch}
                        formatDateTime={formatDateTime}
                        onDownload={() => downloadExcel(selectedBatch)}
                    />
                )}

                <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
                    <div className="border-b border-zinc-200 p-5">
                        <h2 className="text-base font-semibold">Batch History</h2>
                        <p className="mt-1 text-sm text-zinc-500">
                            Review previously generated cutting lists by date and time.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-sm">
                            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                                <tr>
                                    <Th>Batch</Th>
                                    <Th>Generated At</Th>
                                    <Th>Order Range</Th>
                                    <Th>Orders</Th>
                                    <Th>Pieces</Th>
                                    <Th align="right">Actions</Th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-zinc-100">
                                {batches?.length ? (
                                    batches.map((batch) => (
                                        <tr key={batch._id} className="hover:bg-zinc-50">
                                            <Td bold>{batch.batchNumber}</Td>

                                            <Td>
                                                <span className="inline-flex items-center gap-2">
                                                    <Clock size={14} />
                                                    {formatDateTime(batch.createdAt)}
                                                </span>
                                            </Td>

                                            <Td>
                                                {batch.fromOrderNumber} → {batch.toOrderNumber}
                                            </Td>

                                            <Td>{batch.totalOrders || 0}</Td>
                                            <Td bold>{batch.totalPieces || 0}</Td>

                                            <Td align="right">
                                                <div className="flex justify-end gap-2">
                                                    <ActionButton onClick={() => setSelectedBatch(batch)}>
                                                        <Eye size={14} />
                                                        View
                                                    </ActionButton>

                                                    <ActionButton dark onClick={() => downloadExcel(batch)}>
                                                        <Download size={14} />
                                                        Excel
                                                    </ActionButton>
                                                </div>
                                            </Td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-10 text-center text-zinc-500"
                                        >
                                            No cutting batches generated yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}

function BatchDetails({ batch, formatDateTime, onDownload }) {
    return (
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-zinc-200 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-base font-semibold">{batch.batchNumber}</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                        {batch.fromOrderNumber} → {batch.toOrderNumber}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                        Generated: {formatDateTime(batch.createdAt)}
                    </p>
                </div>

                <button
                    onClick={onDownload}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
                >
                    <Download size={16} />
                    Download Excel
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-sm">
                    <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                        <tr>
                            <Th>Image</Th>
                            <Th>Product</Th>
                            <Th>Code</Th>
                            <Th align="center">XS</Th>
                            <Th align="center">S</Th>
                            <Th align="center">M</Th>
                            <Th align="center">L</Th>
                            <Th align="center">XL</Th>
                            <Th align="center">Total</Th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-100">
                        {batch.rows?.map((item, index) => (
                            <tr key={`${item.productCode}-${index}`}>
                                <Td>
                                    {item.productImage ? (
                                        <img
                                            src={item.productImage}
                                            alt={item.productTitle || "Product"}
                                            className="h-14 w-14 rounded-lg border border-zinc-200 object-cover"
                                        />
                                    ) : (
                                        <div className="h-14 w-14 rounded-lg bg-zinc-100" />
                                    )}
                                </Td>

                                <Td bold>{item.productTitle || "-"}</Td>
                                <Td>{item.productCode || "-"}</Td>
                                <Td align="center">{item.xs || 0}</Td>
                                <Td align="center">{item.s || 0}</Td>
                                <Td align="center">{item.m || 0}</Td>
                                <Td align="center">{item.l || 0}</Td>
                                <Td align="center">{item.xl || 0}</Td>
                                <Td align="center" bold>{item.totalQty || 0}</Td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function Stat({ label, value }) {
    return (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-950">{value}</p>
        </div>
    );
}

function Th({ children, align = "left" }) {
    return (
        <th className={`px-4 py-3 text-${align}`}>
            {children}
        </th>
    );
}

function Td({ children, align = "left", bold = false }) {
    return (
        <td
            className={`px-4 py-3 text-${align} ${bold ? "font-medium text-zinc-950" : "text-zinc-600"
                }`}
        >
            {children}
        </td>
    );
}

function ActionButton({ children, onClick, dark = false }) {
    return (
        <button
            onClick={onClick}
            className={
                dark
                    ? "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-3 text-xs font-medium text-white hover:bg-zinc-800"
                    : "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium hover:bg-zinc-50"
            }
        >
            {children}
        </button>
    );
}