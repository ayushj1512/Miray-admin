"use client";

import { useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { Download, RefreshCw } from "lucide-react";
import cuttingBatchStore from "@/store/cuttingbatchstore";

export default function CuttingProductSummaryPage() {
  const { batches, loading, error, fetchCuttingBatches } =
    cuttingBatchStore();

  useEffect(() => {
    fetchCuttingBatches();
  }, [fetchCuttingBatches]);

  const rows = useMemo(() => {
    const map = {};

    for (const batch of batches || []) {
      for (const item of batch.rows || []) {
        const key = item.productCode || item.productTitle;

        if (!map[key]) {
          map[key] = {
            productTitle: item.productTitle || "",
            productCode: item.productCode || "",
            productImage: item.productImage || "",
            xs: 0,
            s: 0,
            m: 0,
            l: 0,
            xl: 0,
            totalQty: 0,
          };
        }

        map[key].xs += Number(item.xs || 0);
        map[key].s += Number(item.s || 0);
        map[key].m += Number(item.m || 0);
        map[key].l += Number(item.l || 0);
        map[key].xl += Number(item.xl || 0);
        map[key].totalQty += Number(item.totalQty || 0);
      }
    }

    return Object.values(map).sort((a, b) =>
      String(a.productCode).localeCompare(String(b.productCode))
    );
  }, [batches]);

  const downloadExcel = () => {
    if (!rows.length) {
      alert("No product summary available.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(
      rows.map((item) => ({
        "Product Name": item.productTitle,
        Code: item.productCode,
        Image: item.productImage,
        XS: item.xs,
        S: item.s,
        M: item.m,
        L: item.l,
        XL: item.xl,
        Total: item.totalQty,
      }))
    );

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
    XLSX.utils.book_append_sheet(wb, ws, "Product Summary");
    XLSX.writeFile(wb, "miray-cutting-product-summary.xlsx");
  };

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Product Cutting Summary</h1>
              <p className="mt-1 text-sm text-zinc-500">
                Consolidated Miray cutting quantity by product and size.
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

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
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
                    <tr key={`${item.productCode}-${index}`}>
                      <td className="px-4 py-3">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productTitle}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-zinc-100" />
                        )}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {item.productTitle || "-"}
                      </td>

                      <td className="px-4 py-3 text-zinc-600">
                        {item.productCode || "-"}
                      </td>

                      <td className="px-4 py-3 text-center">{item.xs}</td>
                      <td className="px-4 py-3 text-center">{item.s}</td>
                      <td className="px-4 py-3 text-center">{item.m}</td>
                      <td className="px-4 py-3 text-center">{item.l}</td>
                      <td className="px-4 py-3 text-center">{item.xl}</td>

                      <td className="px-4 py-3 text-center font-semibold">
                        {item.totalQty}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-zinc-500"
                    >
                      No product summary available.
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