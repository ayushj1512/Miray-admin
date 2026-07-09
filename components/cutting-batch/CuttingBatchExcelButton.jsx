"use client";

import * as XLSX from "xlsx";
import { Download } from "lucide-react";

const safe = (v) => String(v || "").replace(/[^\w-]/g, "_");

export default function CuttingBatchExcelButton({
  batch,
  rows,
  fileName,
  label = "Excel",
  className = "",
}) {
  const downloadExcel = () => {
    const data = rows || batch?.rows || [];

    if (!data.length) {
      alert("No data available for Excel export.");
      return;
    }

    const excelRows = data.map((item) => ({
      "Product Name": item.productTitle || item.productName || "",
      Code: item.productCode || "",
      Image: item.productImage || "",
      XS: item.xs || 0,
      S: item.s || 0,
      M: item.m || 0,
      L: item.l || 0,
      XL: item.xl || 0,
      Total: item.totalQty || item.total || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);

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
    XLSX.utils.book_append_sheet(wb, ws, "Miray Cutting List");

    const name =
      fileName ||
      `${batch?.batchNumber || "miray-cutting-list"}-${
        batch?.fromOrderNumber || "start"
      }-to-${batch?.toOrderNumber || "latest"}.xlsx`;

    XLSX.writeFile(wb, safe(name).replace("_xlsx", ".xlsx"));
  };

  return (
    <button
      type="button"
      onClick={downloadExcel}
      className={
        className ||
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-3 text-xs font-medium text-white hover:bg-zinc-800"
      }
    >
      <Download size={14} />
      {label}
    </button>
  );
}
