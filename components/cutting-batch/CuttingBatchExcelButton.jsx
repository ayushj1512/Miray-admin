"use client";

import * as XLSX from "xlsx";
import { Download } from "lucide-react";

const safeFileName = (value = "") =>
  String(value || "")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/\s+/g, "_");

const formatDateTime = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const reasonLabel = (reason = "") =>
  String(reason || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function CuttingBatchExcelButton({
  batch,
  rows,
  fileName,
  label = "Excel",
  className = "",
}) {
  const downloadExcel = () => {
    const productRows = Array.isArray(rows)
      ? rows
      : Array.isArray(batch?.rows)
        ? batch.rows
        : [];

    const includedOrders = Array.isArray(batch?.includedOrders)
      ? batch.includedOrders
      : [];

    const skippedOrders = Array.isArray(batch?.skippedOrders)
      ? batch.skippedOrders
      : [];

    if (
      !productRows.length &&
      !includedOrders.length &&
      !skippedOrders.length
    ) {
      alert("No data available for Excel export.");
      return;
    }

    const workbook = XLSX.utils.book_new();

    if (productRows.length) {
      const cuttingRows = productRows.map((item) => ({
        Batch: batch?.batchNumber || "",
        Status: batch?.status || "generated",
        "From Order": batch?.fromOrderNumber || "",
        "To Order": batch?.toOrderNumber || "",
        "Product Name": item.productTitle || item.productName || "",
        Code: item.productCode || "",
        Image: item.productImage || "",
        XS: Number(item.xs || 0),
        S: Number(item.s || 0),
        M: Number(item.m || 0),
        L: Number(item.l || 0),
        XL: Number(item.xl || 0),
        Total: Number(item.totalQty || item.total || 0),
      }));

      const cuttingSheet = XLSX.utils.json_to_sheet(cuttingRows);

      cuttingSheet["!cols"] = [
        { wch: 28 },
        { wch: 16 },
        { wch: 18 },
        { wch: 18 },
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

      XLSX.utils.book_append_sheet(
        workbook,
        cuttingSheet,
        "Cutting List"
      );
    }

    if (includedOrders.length) {
      const includedRows = includedOrders.map((order) => ({
        Batch: batch?.batchNumber || "",
        "Order Number": order.orderNumber || "",
        "Order Date": formatDateTime(order.orderDate),
        "Confirmed At": formatDateTime(order.confirmedAt),
        Pieces: Number(order.totalPieces || 0),
      }));

      const includedSheet = XLSX.utils.json_to_sheet(includedRows);

      includedSheet["!cols"] = [
        { wch: 28 },
        { wch: 20 },
        { wch: 24 },
        { wch: 24 },
        { wch: 12 },
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        includedSheet,
        "Included Orders"
      );
    }

    if (skippedOrders.length) {
      const skippedRows = skippedOrders.map((order) => ({
        Batch: batch?.batchNumber || "",
        "Order Number": order.orderNumber || "",
        Reason: reasonLabel(order.reason),
        Note: order.note || "",
        "Can Be Picked Later": order.canBePickedLater ? "Yes" : "No",
        "Skipped At": formatDateTime(order.skippedAt),
      }));

      const skippedSheet = XLSX.utils.json_to_sheet(skippedRows);

      skippedSheet["!cols"] = [
        { wch: 28 },
        { wch: 20 },
        { wch: 24 },
        { wch: 60 },
        { wch: 22 },
        { wch: 24 },
      ];

      XLSX.utils.book_append_sheet(
        workbook,
        skippedSheet,
        "Skipped Orders"
      );
    }

    const defaultName = `${batch?.batchNumber || "miray-cutting-list"}-${
      batch?.fromOrderNumber || "start"
    }-to-${batch?.toOrderNumber || "latest"}`;

    const cleanName = safeFileName(fileName || defaultName);

    XLSX.writeFile(
      workbook,
      cleanName.toLowerCase().endsWith(".xlsx")
        ? cleanName
        : `${cleanName}.xlsx`
    );
  };

  return (
    <button
      type="button"
      onClick={downloadExcel}
      className={
        className ||
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-3 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      }
    >
      <Download size={14} />
      {label}
    </button>
  );
}