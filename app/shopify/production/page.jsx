"use client";

import { useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import adminShopifyStore from "@/store/adminshopifystore";

const SIZES = ["XS", "S", "M", "L", "XL"];

export default function ShopifyProductionPage() {
  const {
    loading,
    error,
    productionQueue,
    productionSummary,
    fetchProductionQueue,
  } = adminShopifyStore();

  useEffect(() => {
    fetchProductionQueue();
  }, [fetchProductionQueue]);

  const sortedQueue = useMemo(
    () =>
      [...productionQueue].sort(
        (a, b) => Number(b.totalToProduce || 0) - Number(a.totalToProduce || 0)
      ),
    [productionQueue]
  );

  const downloadExcel = () => {
    const summaryRows = [
      ["Shopify Production Queue"],
      ["Generated At", new Date().toLocaleString("en-IN")],
      [],
      ["Summary"],
      ["Products", productionSummary?.totalProducts || 0],
      ["Required Units", productionSummary?.totalRequired || 0],
      ["Available Units", productionSummary?.totalAvailable || 0],
      ["To Produce Units", productionSummary?.totalToProduce || 0],
      [],
    ];

    const tableRows = sortedQueue.map((item) => ({
      Priority: item.priority,
      "Product Code": item.productCode,
      "Product Name": item.productName,
      Linked: item.linked ? "Yes" : "No",

      "Req XS": item.required?.XS || 0,
      "Req S": item.required?.S || 0,
      "Req M": item.required?.M || 0,
      "Req L": item.required?.L || 0,
      "Req XL": item.required?.XL || 0,

      "Avail XS": item.available?.XS || 0,
      "Avail S": item.available?.S || 0,
      "Avail M": item.available?.M || 0,
      "Avail L": item.available?.L || 0,
      "Avail XL": item.available?.XL || 0,

      "Make XS": item.toProduce?.XS || 0,
      "Make S": item.toProduce?.S || 0,
      "Make M": item.toProduce?.M || 0,
      "Make L": item.toProduce?.L || 0,
      "Make XL": item.toProduce?.XL || 0,

      "Total Required": item.totalRequired || 0,
      "Total Available": item.totalAvailable || 0,
      "Total To Produce": item.totalToProduce || 0,
      Orders: item.orderNumbers?.join(", ") || "",
    }));

    const worksheet = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.sheet_add_json(worksheet, tableRows, {
      origin: "A10",
      skipHeader: false,
    });

    worksheet["!cols"] = [
      { wch: 10 },
      { wch: 14 },
      { wch: 42 },
      { wch: 10 },
      ...Array(15).fill({ wch: 9 }),
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 36 },
    ];

    worksheet["!freeze"] = { xSplit: 0, ySplit: 10 };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Production Queue");

    XLSX.writeFile(
      workbook,
      `shopify-production-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] p-4 text-black sm:p-6">
      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
              Shopify Operations
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Production Queue
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Required, available and to-produce quantities from unfulfilled
              Shopify orders.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchProductionQueue}
              disabled={loading}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <button
              onClick={downloadExcel}
              disabled={!sortedQueue.length}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Download Excel
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Products" value={productionSummary?.totalProducts || 0} />
          <SummaryCard label="Required" value={productionSummary?.totalRequired || 0} />
          <SummaryCard label="Available" value={productionSummary?.totalAvailable || 0} />
          <SummaryCard
            label="To Produce"
            value={productionSummary?.totalToProduce || 0}
            dark
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Production Breakdown</h2>
            <p className="text-xs text-gray-500">
              Showing only products where production is required.
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {sortedQueue.length} items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1450px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <th rowSpan="2" className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left">
                  Product
                </th>
                <th colSpan="5" className="border-l px-3 py-3 text-center">
                  Required
                </th>
                <th colSpan="5" className="border-l px-3 py-3 text-center">
                  Available
                </th>
                <th colSpan="5" className="border-l px-3 py-3 text-center">
                  To Produce
                </th>
                <th rowSpan="2" className="border-l px-4 py-3 text-center">
                  Total
                </th>
                <th rowSpan="2" className="px-4 py-3 text-left">
                  Orders
                </th>
              </tr>

              <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
                {["required", "available", "toProduce"].map((group) =>
                  SIZES.map((size) => (
                    <th key={`${group}-${size}`} className="border-l px-3 py-2 text-center">
                      {size}
                    </th>
                  ))
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <EmptyRow text="Loading production queue..." />
              ) : sortedQueue.length ? (
                sortedQueue.map((item) => (
                  <tr
                    key={item.productCode}
                    className="border-b border-gray-100 hover:bg-gray-50/70"
                  >
                    <td className="sticky left-0 z-10 bg-white px-4 py-3">
                      <div className="flex min-w-[320px] items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="h-14 w-14 rounded-xl border border-gray-100 object-cover"
                          />
                        ) : (
                          <div className="grid h-14 w-14 place-items-center rounded-xl bg-gray-100 text-xs text-gray-400">
                            No Img
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-semibold text-white">
                              #{item.priority}
                            </span>
                            <span className="font-mono text-xs text-gray-500">
                              {item.productCode}
                            </span>
                          </div>

                          <div className="mt-1 line-clamp-2 font-medium">
                            {item.productName}
                          </div>

                          {!item.linked && (
                            <div className="mt-1 text-xs font-medium text-red-500">
                              Not linked with internal product
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {SIZES.map((size) => (
                      <SizeCell key={`req-${size}`} value={item.required?.[size]} />
                    ))}

                    {SIZES.map((size) => (
                      <SizeCell key={`av-${size}`} value={item.available?.[size]} muted />
                    ))}

                    {SIZES.map((size) => (
                      <SizeCell key={`make-${size}`} value={item.toProduce?.[size]} strong />
                    ))}

                    <td className="border-l px-4 py-3 text-center">
                      <span className="inline-flex min-w-10 justify-center rounded-lg bg-black px-3 py-1.5 font-semibold text-white">
                        {item.totalToProduce || 0}
                      </span>
                    </td>

                    <td className="max-w-[260px] px-4 py-3 text-xs text-gray-500">
                      {item.orderNumbers?.length
                        ? item.orderNumbers.join(", ")
                        : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow text="No production items found." />
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, dark = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        dark
          ? "border-black bg-black text-white"
          : "border-gray-200 bg-gray-50 text-black"
      }`}
    >
      <p className={`text-xs uppercase tracking-wide ${dark ? "text-gray-300" : "text-gray-500"}`}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function SizeCell({ value = 0, strong = false, muted = false }) {
  const qty = Number(value || 0);

  return (
    <td className="border-l px-3 py-3 text-center">
      <span
        className={`inline-flex min-w-9 justify-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
          strong && qty > 0
            ? "bg-black text-white"
            : muted
            ? "bg-gray-50 text-gray-500"
            : qty > 0
            ? "bg-gray-200 text-black"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        {qty}
      </span>
    </td>
  );
}

function EmptyRow({ text }) {
  return (
    <tr>
      <td colSpan="22" className="px-4 py-12 text-center text-sm text-gray-500">
        {text}
      </td>
    </tr>
  );
}