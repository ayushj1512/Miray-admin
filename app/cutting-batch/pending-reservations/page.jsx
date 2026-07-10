"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Download, RefreshCw } from "lucide-react";
import cuttingBatchStore from "@/store/cuttingbatchstore";

export default function PendingReservationsPage() {
  const { batches, loading, error, fetchCuttingBatches } = cuttingBatchStore();

  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCuttingBatches();
  }, [fetchCuttingBatches]);

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

  const rows = useMemo(() => {
    const list = [];

    for (const batch of batches || []) {
      for (const item of batch.rows || []) {
        list.push({
          batchNumber: batch.batchNumber,
          status: batch.status || "generated",
          createdAt: batch.createdAt,
          fromOrderNumber: batch.fromOrderNumber,
          toOrderNumber: batch.toOrderNumber,
          includedOrders: batch.totalOrders || batch.includedOrders?.length || 0,
          skippedOrders: batch.skippedOrders?.length || 0,
          ...item,
        });
      }
    }

    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter((item) =>
      [
        item.batchNumber,
        item.status,
        item.productTitle,
        item.productCode,
        item.fromOrderNumber,
        item.toOrderNumber,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [batches, search]);

  const downloadExcel = () => {
    if (!rows.length) {
      alert("No data available.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(
      rows.map((item) => ({
        Batch: item.batchNumber,
        Status: item.status,
        "Generated At": formatDateTime(item.createdAt),
        Range: `${item.fromOrderNumber} to ${item.toOrderNumber}`,
        "Included Orders": item.includedOrders,
        "Skipped Orders": item.skippedOrders,
        "Product Name": item.productTitle || "",
        Code: item.productCode || "",
        Image: item.productImage || "",
        XS: item.xs || 0,
        S: item.s || 0,
        M: item.m || 0,
        L: item.l || 0,
        XL: item.xl || 0,
        Total: item.totalQty || 0,
      }))
    );

    ws["!cols"] = [
      { wch: 28 },
      { wch: 16 },
      { wch: 24 },
      { wch: 32 },
      { wch: 16 },
      { wch: 16 },
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
    XLSX.utils.book_append_sheet(wb, ws, "Cutting Records");
    XLSX.writeFile(wb, "miray-cutting-records.xlsx");
  };

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Cutting Records</h1>
              <p className="mt-1 text-sm text-zinc-500">
                Product-wise records from confirmed processing Shopify cutting
                batches.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={fetchCuttingBatches}
                disabled={loading}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                onClick={downloadExcel}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm text-white"
              >
                <Download size={16} />
                Excel
              </button>
            </div>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search batch, product, code or order range..."
            className="mt-5 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400 md:max-w-md"
          />

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1350px] text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left">Batch</th>
                  <th className="px-4 py-3 text-left">Generated</th>
                  <th className="px-4 py-3 text-left">Range</th>
                  <th className="px-4 py-3 text-left">Included</th>
                  <th className="px-4 py-3 text-left">Skipped</th>
                  <th className="px-4 py-3 text-left">Image</th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-center">XS</th>
                  <th className="px-4 py-3 text-center">S</th>
                  <th className="px-4 py-3 text-center">M</th>
                  <th className="px-4 py-3 text-center">L</th>
                  <th className="px-4 py-3 text-center">XL</th>
                  <th className="px-4 py-3 text-center">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {rows.length ? (
                  rows.map((item, index) => (
                    <tr key={`${item.batchNumber}-${item.productCode}-${index}`}>
                      <td className="px-4 py-3 font-medium">
                        {item.batchNumber}
                      </td>

                      <td className="px-4 py-3 text-zinc-600">
                        {formatDateTime(item.createdAt)}
                      </td>

                      <td className="px-4 py-3 text-zinc-600">
                        {item.fromOrderNumber} → {item.toOrderNumber}
                      </td>

                      <td className="px-4 py-3">{item.includedOrders}</td>

                      <td className="px-4 py-3">{item.skippedOrders}</td>

                      <td className="px-4 py-3">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productTitle || "Product"}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="grid h-12 w-12 place-items-center rounded-lg bg-zinc-100 text-xs text-zinc-400">
                            No img
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {item.productTitle || "-"}
                      </td>

                      <td className="px-4 py-3 text-zinc-600">
                        {item.productCode || "-"}
                      </td>

                      <td className="px-4 py-3 text-center">{item.xs || 0}</td>
                      <td className="px-4 py-3 text-center">{item.s || 0}</td>
                      <td className="px-4 py-3 text-center">{item.m || 0}</td>
                      <td className="px-4 py-3 text-center">{item.l || 0}</td>
                      <td className="px-4 py-3 text-center">{item.xl || 0}</td>

                      <td className="px-4 py-3 text-center font-semibold">
                        {item.totalQty || 0}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={14}
                      className="px-4 py-10 text-center text-zinc-500"
                    >
                      No cutting records found.
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