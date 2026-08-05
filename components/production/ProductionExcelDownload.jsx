"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const safeArr = (value) => (Array.isArray(value) ? value : []);

const toNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};

const normalizeSize = (value) =>
    String(value || "")
        .trim()
        .toUpperCase();

const SIZE_COLUMNS = [
    "XS",
    "S",
    "M",
    "L",
    "XL",
];

const getSizeRows = (row) => {
    const candidates = [
        row?.sizes,
        row?.sizeRows,
        row?.variants,
        row?.productionSizes,
        row?.sizeBreakdown,
    ];

    return candidates.find(Array.isArray) || [];
};

const findSizeRow = (row, targetSize) => {
    const sizeRows = getSizeRows(row);

    return (
        sizeRows.find((item) => {
            const size = normalizeSize(
                item?.size ||
                item?.name ||
                item?.label ||
                item?.variantSize,
            );

            return size === targetSize;
        }) || null
    );
};

const getSizeDemand = (row, size) => {
    const sizeRow = findSizeRow(row, size);

    return toNumber(
        sizeRow?.demandQty ??
        sizeRow?.orderedQty ??
        sizeRow?.requiredQuantity ??
        sizeRow?.quantityToProduce ??
        sizeRow?.demand ??
        0,
    );
};

const getSizeAssigned = (row, size) => {
    const sizeRow = findSizeRow(row, size);

    return toNumber(
        sizeRow?.inProductionQty ??
        sizeRow?.productionQuantity ??
        sizeRow?.assignedQuantity ??
        sizeRow?.assigned ??
        0,
    );
};

const getSizeReceived = (row, size) => {
    const sizeRow = findSizeRow(row, size);

    return toNumber(
        sizeRow?.receivedQuantity ??
        sizeRow?.receivedQty ??
        sizeRow?.received ??
        0,
    );
};

const getProductionJobs = (row) => {
    const jobs =
        row?.productionJobs ||
        row?.linkedProductionJobs ||
        row?.jobs ||
        row?.jobDetails ||
        [];

    return safeArr(jobs);
};

const getJobNumbers = (row) =>
    getProductionJobs(row)
        .map(
            (job) =>
                job?.jobNumber ||
                job?.productionJobNumber ||
                job?.code ||
                job?._id,
        )
        .filter(Boolean)
        .join(", ");

const getTailors = (row) =>
    [
        ...new Set(
            getProductionJobs(row)
                .map(
                    (job) =>
                        job?.tailor?.name ||
                        job?.tailorName ||
                        job?.tailorSnapshot?.name,
                )
                .filter(Boolean),
        ),
    ].join(", ");

const getJobStatuses = (row) =>
    [
        ...new Set(
            getProductionJobs(row)
                .map((job) => job?.status)
                .filter(Boolean),
        ),
    ].join(", ");

const buildExcelRows = (rows = []) =>
    safeArr(rows).map((row, index) => {
        const demandQty = toNumber(
            row?.demandQty ??
            row?.orderedQty ??
            row?.requiredQuantity ??
            row?.quantityToProduce ??
            0,
        );

        const assignedQty = toNumber(
            row?.inProductionQty ??
            row?.productionQuantity ??
            row?.assignedQuantity ??
            row?.inProduction ??
            0,
        );

        const receivedQty = toNumber(
            row?.receivedQuantity ??
            row?.receivedQty ??
            row?.totalReceivedQuantity ??
            0,
        );

        const pendingProduction = Math.max(
            0,
            assignedQty - receivedQty,
        );

        const remainingDemand = Math.max(
            0,
            demandQty - assignedQty,
        );

        const advanceProduction = Math.max(
            0,
            assignedQty - demandQty,
        );

        const excelRow = {
            "S.No.": index + 1,

            "Product Code":
                row?.productCode ||
                row?.code ||
                row?.product?.productCode ||
                "",

            "Product Name":
                row?.productTitle ||
                row?.title ||
                row?.productName ||
                row?.product?.title ||
                "",

            SKU:
                row?.sku ||
                row?.product?.sku ||
                "",

            "Ordered Quantity": toNumber(
                row?.orderedQty ??
                row?.totalOrderedQty ??
                demandQty,
            ),

            "Reserved Quantity": toNumber(
                row?.reservedQty ??
                row?.totalReservedQty ??
                row?.reservedQuantity ??
                0,
            ),

            "Demand Quantity": demandQty,

            "Production Assigned": assignedQty,

            "Inventory Received": receivedQty,

            "Pending Production": pendingProduction,

            "Remaining Demand": remainingDemand,

            "Advance Production": advanceProduction,

            "Production Jobs": getJobNumbers(row),

            Tailors: getTailors(row),

            "Job Status": getJobStatuses(row),

            "Order Count": toNumber(
                row?.orderCount ??
                row?.ordersCount ??
                row?.totalOrders ??
                row?.ordersCovered ??
                0,
            ),

            "Reservation Count": toNumber(
                row?.reservationCount ??
                row?.reservationsCount ??
                row?.totalReservations ??
                0,
            ),
        };

        SIZE_COLUMNS.forEach((size) => {
            excelRow[`${size} Demand`] =
                getSizeDemand(row, size);

            excelRow[`${size} Assigned`] =
                getSizeAssigned(row, size);

            excelRow[`${size} Received`] =
                getSizeReceived(row, size);

            excelRow[`${size} Pending`] = Math.max(
                0,
                getSizeAssigned(row, size) -
                getSizeReceived(row, size),
            );
        });

        return excelRow;
    });

export default function ProductionExcelDownload({
    rows = [],
    fileName = "production-job-report",
    className = "",
}) {
    const [exporting, setExporting] =
        useState(false);

    const downloadExcel = async () => {
        if (!Array.isArray(rows) || rows.length === 0) {
            toast.error(
                "No production data available to export.",
            );
            return;
        }

        if (exporting) return;

        try {
            setExporting(true);

            const XLSX = await import("xlsx");

            const excelRows = buildExcelRows(rows);

            const worksheet =
                XLSX.utils.json_to_sheet(excelRows);

            const workbook =
                XLSX.utils.book_new();

            worksheet["!freeze"] = {
                xSplit: 0,
                ySplit: 1,
            };

            worksheet["!autofilter"] = {
                ref: worksheet["!ref"],
            };

            worksheet["!cols"] = Object.keys(
                excelRows[0] || {},
            ).map((column) => {
                if (column === "Product Name") {
                    return { wch: 34 };
                }

                if (
                    [
                        "Production Jobs",
                        "Tailors",
                        "Job Status",
                    ].includes(column)
                ) {
                    return { wch: 24 };
                }

                if (column.includes("Quantity")) {
                    return { wch: 18 };
                }

                if (
                    column.includes("Demand") ||
                    column.includes("Assigned") ||
                    column.includes("Received") ||
                    column.includes("Pending")
                ) {
                    return { wch: 15 };
                }

                return { wch: 14 };
            });

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Production Report",
            );

            const date = new Date()
                .toISOString()
                .slice(0, 10);

            XLSX.writeFile(
                workbook,
                `${fileName}-${date}.xlsx`,
            );

            toast.success(
                `${rows.length} products exported successfully.`,
            );
        } catch (error) {
            console.error(
                "Production Excel export error:",
                error,
            );

            toast.error(
                error?.message ||
                "Unable to download production Excel.",
            );
        } finally {
            setExporting(false);
        }
    };

    return (
        <button
            type="button"
            onClick={downloadExcel}
            disabled={exporting || rows.length === 0}
            className={[
                "inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black px-5 text-sm font-medium text-white",
                "transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40",
                className,
            ].join(" ")}
        >
            {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Download className="h-4 w-4" />
            )}

            {exporting
                ? "Exporting..."
                : "Download Full Excel"}
        </button>
    );
}