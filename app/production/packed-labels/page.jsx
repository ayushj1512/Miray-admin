"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    Check,
    Copy,
    Download,
    ExternalLink,
    FileText,
    Loader2,
    PackageCheck,
    RefreshCw,
    Search,
} from "lucide-react";

import { useOrderStore } from "@/store/orderStore";

const text = (value) => String(value || "").trim();

const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
};

const copyText = async (value) => {
    const cleanValue = text(value);
    if (!cleanValue) return false;

    await navigator.clipboard.writeText(cleanValue);
    return true;
};

export default function PackedLabelsPage() {
    const [search, setSearch] = useState("");
    const [labelStatus, setLabelStatus] = useState("all");
    const [selectedIds, setSelectedIds] = useState([]);
    const [message, setMessage] = useState("");

    const {
        packedOrderLabels,
        packedOrderLabelsSummary,
        loading,
        downloadingMergedLabels,
        error,
        fetchPackedOrderLabels,
        downloadMergedLabels,
    } = useOrderStore();

    const orders = Array.isArray(packedOrderLabels)
        ? packedOrderLabels
        : [];

    const labelReadyOrders = useMemo(
        () => orders.filter((order) => order?.shipment?.hasLabel),
        [orders]
    );

    const missingLabelOrders = useMemo(
        () => orders.filter((order) => !order?.shipment?.hasLabel),
        [orders]
    );

    const missingOrderNumbers = useMemo(
        () =>
            missingLabelOrders
                .map((order) => text(order?.orderNumber))
                .filter(Boolean),
        [missingLabelOrders]
    );

    const selectedLabelOrders = useMemo(
        () =>
            labelReadyOrders.filter((order) =>
                selectedIds.includes(String(order?._id))
            ),
        [labelReadyOrders, selectedIds]
    );

    const allVisibleSelected =
        labelReadyOrders.length > 0 &&
        labelReadyOrders.every((order) =>
            selectedIds.includes(String(order?._id))
        );

    const loadOrders = async (overrides = {}) => {
        setMessage("");

        try {
            const nextStatus = overrides.labelStatus ?? labelStatus;

            await fetchPackedOrderLabels({
                q: overrides.search ?? search,
                labelStatus: nextStatus,
                page: 1,
                limit: 200,
            });

            setSelectedIds([]);
        } catch (err) {
            setMessage(err?.message || "Failed to load packed orders");
        }
    };

    useEffect(() => {
        fetchPackedOrderLabels({
            labelStatus: "all",
            page: 1,
            limit: 200,
        }).catch(() => { });
    }, [fetchPackedOrderLabels]);

    const changeLabelStatus = async (value) => {
        setLabelStatus(value);

        try {
            await loadOrders({ labelStatus: value });
        } catch {
            // Store already handles the error.
        }
    };

    const toggleOrder = (orderId) => {
        const id = String(orderId);

        setSelectedIds((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id]
        );
    };

    const toggleAll = () => {
        if (allVisibleSelected) {
            setSelectedIds([]);
            return;
        }

        setSelectedIds(
            labelReadyOrders.map((order) => String(order?._id))
        );
    };

    const downloadSelected = async () => {
        if (!selectedIds.length) {
            setMessage("Select at least one available label.");
            return;
        }

        setMessage("");

        try {
            await downloadMergedLabels({ orderIds: selectedIds });

            setMessage(
                `${selectedIds.length} label${selectedIds.length === 1 ? "" : "s"
                } downloaded in one PDF.`
            );
        } catch (err) {
            setMessage(err?.message || "Failed to download labels");
        }
    };

    const downloadAll = async () => {
        setMessage("");

        try {
            await downloadMergedLabels({
                allPackedWithLabels: true,
            });

            setMessage("All available packed labels downloaded in one PDF.");
        } catch (err) {
            setMessage(err?.message || "Failed to download all labels");
        }
    };

    const handleCopyAwb = async (awb) => {
        try {
            if (await copyText(awb)) {
                setMessage(`AWB ${awb} copied.`);
            }
        } catch {
            setMessage("Failed to copy AWB.");
        }
    };

    const copyMissingOrderNumbers = async () => {
        try {
            const copied = await copyText(missingOrderNumbers.join("\n"));

            if (copied) {
                setMessage(
                    `${missingOrderNumbers.length} missing-label order numbers copied.`
                );
            }
        } catch {
            setMessage("Failed to copy missing order numbers.");
        }
    };

    return (
        <main className="min-h-screen bg-zinc-50 p-4 text-zinc-950 md:p-6">
            <div className="mx-auto max-w-7xl space-y-4">
                <header className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <PackageCheck className="h-6 w-6" />

                            <h1 className="text-xl font-semibold">
                                Packed Order Labels
                            </h1>
                        </div>

                        <p className="mt-1 text-sm text-zinc-500">
                            Merge all available shipping labels into one printable PDF.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <ActionButton
                            onClick={() => loadOrders()}
                            disabled={loading || downloadingMergedLabels}
                            icon={
                                <RefreshCw
                                    className={`h-4 w-4 ${loading ? "animate-spin" : ""
                                        }`}
                                />
                            }
                            label="Refresh"
                        />

                        <ActionButton
                            onClick={downloadSelected}
                            disabled={
                                !selectedIds.length ||
                                loading ||
                                downloadingMergedLabels
                            }
                            dark
                            icon={
                                downloadingMergedLabels ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )
                            }
                            label={`Download Selected${selectedIds.length ? ` (${selectedIds.length})` : ""
                                }`}
                        />

                        <ActionButton
                            onClick={downloadAll}
                            disabled={
                                !packedOrderLabelsSummary?.totalWithLabels ||
                                loading ||
                                downloadingMergedLabels
                            }
                            success
                            icon={
                                downloadingMergedLabels ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <FileText className="h-4 w-4" />
                                )
                            }
                            label="Download All Labels"
                        />
                    </div>
                </header>

                <section className="grid gap-3 sm:grid-cols-3">
                    <SummaryCard
                        label="Packed Orders"
                        value={packedOrderLabelsSummary?.totalPacked}
                    />

                    <SummaryCard
                        label="Labels Available"
                        value={packedOrderLabelsSummary?.totalWithLabels}
                    />

                    <SummaryCard
                        label="Labels Missing"
                        value={packedOrderLabelsSummary?.totalWithoutLabels}
                        warning
                    />
                </section>

                {missingOrderNumbers.length > 0 && (
                    <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-amber-900">
                                    <AlertTriangle className="h-5 w-5" />

                                    <h2 className="font-semibold">
                                        Labels missing for {missingOrderNumbers.length} orders
                                    </h2>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {missingOrderNumbers.map((orderNumber) => (
                                        <span
                                            key={orderNumber}
                                            className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-sm font-semibold text-amber-900"
                                        >
                                            {orderNumber}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex shrink-0 gap-2">
                                <button
                                    type="button"
                                    onClick={copyMissingOrderNumbers}
                                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-amber-400 bg-white px-3 text-sm font-medium text-amber-900 hover:bg-amber-100"
                                >
                                    <Copy className="h-4 w-4" />
                                    Copy All
                                </button>

                                <button
                                    type="button"
                                    onClick={() => changeLabelStatus("missing")}
                                    className="h-9 rounded-lg bg-amber-900 px-3 text-sm font-medium text-white"
                                >
                                    Show Missing
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            loadOrders();
                        }}
                        className="flex flex-col gap-3 md:flex-row"
                    >
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search order, customer, phone or AWB..."
                                className="h-11 w-full rounded-xl border border-zinc-300 pl-10 pr-4 text-sm outline-none focus:border-zinc-950"
                            />
                        </div>

                        <select
                            value={labelStatus}
                            onChange={(event) =>
                                changeLabelStatus(event.target.value)
                            }
                            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-950"
                        >
                            <option value="all">All Packed Orders</option>
                            <option value="available">Labels Available</option>
                            <option value="missing">Labels Missing</option>
                        </select>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white disabled:opacity-50"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Search
                        </button>
                    </form>
                </section>

                {(message || error) && (
                    <div
                        className={`rounded-xl border px-4 py-3 text-sm ${error
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}
                    >
                        {error || message}
                    </div>
                )}

                <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                        <label className="flex items-center gap-3 text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={allVisibleSelected}
                                onChange={toggleAll}
                                disabled={!labelReadyOrders.length}
                                className="h-4 w-4 rounded"
                            />

                            Select all available labels
                        </label>

                        <span className="text-sm text-zinc-500">
                            {orders.length} orders shown
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex min-h-72 items-center justify-center">
                            <Loader2 className="h-7 w-7 animate-spin text-zinc-500" />
                        </div>
                    ) : !orders.length ? (
                        <EmptyState />
                    ) : (
                        <>
                            <div className="hidden overflow-x-auto lg:block">
                                <table className="w-full min-w-[1050px]">
                                    <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                                        <tr>
                                            <th className="w-12 px-4 py-3" />
                                            <th className="px-4 py-3">Order</th>
                                            <th className="px-4 py-3">Customer</th>
                                            <th className="px-4 py-3">Items</th>
                                            <th className="px-4 py-3">Payment</th>
                                            <th className="px-4 py-3">Courier</th>
                                            <th className="px-4 py-3">AWB</th>
                                            <th className="px-4 py-3">Label</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-zinc-100">
                                        {orders.map((order) => (
                                            <OrderTableRow
                                                key={order?._id}
                                                order={order}
                                                selected={selectedIds.includes(
                                                    String(order?._id)
                                                )}
                                                onToggle={() => toggleOrder(order?._id)}
                                                onCopyAwb={() =>
                                                    handleCopyAwb(order?.shipment?.awb)
                                                }
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="divide-y divide-zinc-100 lg:hidden">
                                {orders.map((order) => (
                                    <OrderCard
                                        key={order?._id}
                                        order={order}
                                        selected={selectedIds.includes(
                                            String(order?._id)
                                        )}
                                        onToggle={() => toggleOrder(order?._id)}
                                        onCopyAwb={() =>
                                            handleCopyAwb(order?.shipment?.awb)
                                        }
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </section>

                {selectedLabelOrders.length > 0 && (
                    <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl bg-zinc-950 p-3 text-white shadow-xl">
                        <div className="px-2">
                            <p className="text-sm font-medium">
                                {selectedLabelOrders.length} labels selected
                            </p>

                            <p className="text-xs text-zinc-400">
                                Labels will merge into one printable PDF.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={downloadSelected}
                            disabled={downloadingMergedLabels}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 disabled:opacity-50"
                        >
                            {downloadingMergedLabels ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            Download PDF
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}

function ActionButton({
    onClick,
    disabled,
    icon,
    label,
    dark,
    success,
}) {
    const style = success
        ? "bg-emerald-600 text-white hover:bg-emerald-700"
        : dark
            ? "bg-zinc-950 text-white hover:bg-zinc-800"
            : "border border-zinc-300 bg-white hover:bg-zinc-50";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${style}`}
        >
            {icon}
            {label}
        </button>
    );
}

function SummaryCard({ label, value, warning = false }) {
    return (
        <div
            className={`rounded-2xl border bg-white p-4 shadow-sm ${warning ? "border-amber-300" : "border-zinc-200"
                }`}
        >
            <p className="text-sm text-zinc-500">{label}</p>

            <p
                className={`mt-1 text-2xl font-semibold ${warning ? "text-amber-700" : ""
                    }`}
            >
                {Number(value || 0)}
            </p>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
            <PackageCheck className="mb-3 h-10 w-10 text-zinc-300" />
            <h2 className="font-medium">No packed orders found</h2>
            <p className="mt-1 text-sm text-zinc-500">
                Packed orders will appear here after processing.
            </p>
        </div>
    );
}

function OrderTableRow({
    order,
    selected,
    onToggle,
    onCopyAwb,
}) {
    const hasLabel = Boolean(order?.shipment?.hasLabel);
    const items = Array.isArray(order?.items) ? order.items : [];

    return (
        <tr
            className={
                hasLabel
                    ? "align-top hover:bg-zinc-50"
                    : "align-top bg-amber-50/60"
            }
        >
            <td className="px-4 py-4">
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={onToggle}
                    disabled={!hasLabel}
                    className="h-4 w-4 rounded"
                />
            </td>

            <td className="px-4 py-4">
                <p
                    className={`font-semibold ${!hasLabel ? "text-amber-900" : ""
                        }`}
                >
                    {order?.orderNumber || "-"}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                    {formatDate(order?.packedAt || order?.orderDate)}
                </p>
            </td>

            <td className="px-4 py-4">
                <p className="font-medium">
                    {order?.customer?.name || "-"}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                    {order?.customer?.phone || "-"}
                </p>

                <p className="text-xs text-zinc-500">
                    {[order?.customer?.city, order?.customer?.pincode]
                        .filter(Boolean)
                        .join(" · ") || "-"}
                </p>
            </td>

            <td className="px-4 py-4">
                <p className="text-sm font-medium">
                    {order?.itemCount || 0} item(s)
                </p>

                <div className="mt-1 max-w-64 space-y-1">
                    {items.slice(0, 2).map((item) => (
                        <p
                            key={item?.lineId || item?.productCode}
                            className="truncate text-xs text-zinc-500"
                        >
                            {item?.productCode || item?.title || "Product"}
                            {item?.size ? ` · ${item.size}` : ""}
                            {item?.quantity > 1 ? ` × ${item.quantity}` : ""}
                        </p>
                    ))}

                    {items.length > 2 && (
                        <p className="text-xs text-zinc-400">
                            +{items.length - 2} more
                        </p>
                    )}
                </div>
            </td>

            <td className="px-4 py-4">
                <p className="text-sm uppercase">
                    {order?.paymentMethod || "-"}
                </p>

                <p className="mt-1 text-xs capitalize text-zinc-500">
                    {order?.paymentStatus || "-"}
                </p>
            </td>

            <td className="px-4 py-4">
                <p className="max-w-44 text-sm">
                    {order?.shipment?.courierName || "-"}
                </p>

                <p className="mt-1 text-xs capitalize text-zinc-500">
                    {order?.shipment?.provider || "-"}
                </p>
            </td>

            <td className="px-4 py-4">
                {order?.shipment?.awb ? (
                    <button
                        type="button"
                        onClick={onCopyAwb}
                        className="text-left text-sm font-medium hover:underline"
                    >
                        {order.shipment.awb}
                    </button>
                ) : (
                    <span className="text-sm text-amber-700">AWB Missing</span>
                )}
            </td>

            <td className="px-4 py-4">
                {hasLabel ? (
                    <a
                        href={order?.shipment?.labelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                        <Check className="h-3.5 w-3.5" />
                        Open Label
                        <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-semibold text-amber-800">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Label Missing
                    </span>
                )}
            </td>
        </tr>
    );
}

function OrderCard({
    order,
    selected,
    onToggle,
    onCopyAwb,
}) {
    const hasLabel = Boolean(order?.shipment?.hasLabel);
    const items = Array.isArray(order?.items) ? order.items : [];

    return (
        <article className={hasLabel ? "p-4" : "bg-amber-50/60 p-4"}>
            <div className="flex items-start gap-3">
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={onToggle}
                    disabled={!hasLabel}
                    className="mt-1 h-4 w-4 rounded"
                />

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2
                                className={`font-semibold ${!hasLabel ? "text-amber-900" : ""
                                    }`}
                            >
                                {order?.orderNumber || "-"}
                            </h2>

                            <p className="mt-0.5 text-xs text-zinc-500">
                                {formatDate(order?.packedAt || order?.orderDate)}
                            </p>
                        </div>

                        <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${hasLabel
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                        >
                            {hasLabel ? "Label Ready" : "Label Missing"}
                        </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-xs text-zinc-500">Customer</p>
                            <p className="mt-1 font-medium">
                                {order?.customer?.name || "-"}
                            </p>
                            <p className="text-xs text-zinc-500">
                                {order?.customer?.phone || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-zinc-500">Courier</p>
                            <p className="mt-1 font-medium">
                                {order?.shipment?.courierName || "-"}
                            </p>
                            <p className="text-xs capitalize text-zinc-500">
                                {order?.shipment?.provider || "-"}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-white/80 p-3">
                        <p className="text-xs font-medium text-zinc-500">
                            {order?.itemCount || 0} item(s)
                        </p>

                        <div className="mt-2 space-y-1">
                            {items.slice(0, 3).map((item) => (
                                <p
                                    key={item?.lineId || item?.productCode}
                                    className="truncate text-xs"
                                >
                                    {item?.productCode || item?.title || "Product"}
                                    {item?.size ? ` · ${item.size}` : ""}
                                    {item?.quantity > 1 ? ` × ${item.quantity}` : ""}
                                </p>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {order?.shipment?.awb && (
                            <button
                                type="button"
                                onClick={onCopyAwb}
                                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium"
                            >
                                Copy AWB
                            </button>
                        )}

                        {hasLabel && (
                            <a
                                href={order?.shipment?.labelUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white"
                            >
                                Open Label
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}
