"use client";

import CuttingBatchExcelButton from "./CuttingBatchExcelButton";

const fmtDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const reasonLabel = (reason = "") =>
  String(reason || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function CuttingBatchTable({ batch }) {
  if (!batch) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
        No cutting batch found.
      </div>
    );
  }

  const rows = Array.isArray(batch.rows) ? batch.rows : [];
  const includedOrders = Array.isArray(batch.includedOrders)
    ? batch.includedOrders
    : [];
  const skippedOrders = Array.isArray(batch.skippedOrders)
    ? batch.skippedOrders
    : [];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-zinc-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{batch.batchNumber}</h2>

              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                {batch.status || "generated"}
              </span>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                Confirmed Processing
              </span>
            </div>

            <p className="mt-1 text-sm text-zinc-500">
              {batch.fromOrderNumber} → {batch.toOrderNumber}
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Created: {fmtDate(batch.createdAt)}
            </p>
          </div>

          <CuttingBatchExcelButton batch={batch} />
        </div>

        <div className="grid gap-3 border-b border-zinc-200 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">Included Orders</p>
            <p className="mt-1 text-xl font-semibold">
              {batch.totalOrders || includedOrders.length || 0}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">Total Pieces</p>
            <p className="mt-1 text-xl font-semibold">
              {batch.totalPieces || 0}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">Product Rows</p>
            <p className="mt-1 text-xl font-semibold">{rows.length}</p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs text-zinc-500">Skipped Orders</p>
            <p className="mt-1 text-xl font-semibold">
              {skippedOrders.length}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-zinc-50">
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

            <tbody>
              {rows.length ? (
                rows.map((row, index) => (
                  <tr
                    key={`${row.productCode || row.productTitle}-${index}`}
                    className="border-t border-zinc-100"
                  >
                    <td className="px-4 py-3">
                      {row.productImage ? (
                        <img
                          src={row.productImage}
                          alt={row.productTitle || "Product"}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="grid h-12 w-12 place-items-center rounded-lg bg-zinc-100 text-xs text-zinc-400">
                          No img
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 font-medium text-zinc-800">
                      {row.productTitle || "-"}
                    </td>

                    <td className="px-4 py-3 text-zinc-600">
                      {row.productCode || "-"}
                    </td>

                    <td className="px-4 py-3 text-center">{row.xs || 0}</td>
                    <td className="px-4 py-3 text-center">{row.s || 0}</td>
                    <td className="px-4 py-3 text-center">{row.m || 0}</td>
                    <td className="px-4 py-3 text-center">{row.l || 0}</td>
                    <td className="px-4 py-3 text-center">{row.xl || 0}</td>

                    <td className="px-4 py-3 text-center font-semibold">
                      {row.totalQty || 0}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="border-t border-zinc-100 px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    No product rows found in this batch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!!includedOrders.length && (
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 p-5">
            <h3 className="font-semibold">Included Orders</h3>
            <p className="mt-1 text-sm text-zinc-500">
              These orders were confirmed, processing, and had pending
              reservations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left">Order Date</th>
                  <th className="px-4 py-3 text-left">Confirmed At</th>
                  <th className="px-4 py-3 text-center">Pieces</th>
                </tr>
              </thead>

              <tbody>
                {includedOrders.map((order, index) => (
                  <tr
                    key={`${order.orderNumber}-${index}`}
                    className="border-t border-zinc-100"
                  >
                    <td className="px-4 py-3 font-medium">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {fmtDate(order.orderDate)}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {fmtDate(order.confirmedAt)}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {order.totalPieces || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!!skippedOrders.length && (
        <div className="rounded-2xl border border-amber-200 bg-white">
          <div className="border-b border-amber-100 p-5">
            <h3 className="font-semibold text-amber-900">Skipped Orders</h3>
            <p className="mt-1 text-sm text-amber-700">
              These orders were not included. Not confirmed / not processing
              orders can be picked in a future batch.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="bg-amber-50">
                <tr>
                  <th className="px-4 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-left">Note</th>
                  <th className="px-4 py-3 text-center">Pick Later</th>
                </tr>
              </thead>

              <tbody>
                {skippedOrders.map((order, index) => (
                  <tr
                    key={`${order.orderNumber}-${index}`}
                    className="border-t border-amber-100"
                  >
                    <td className="px-4 py-3 font-medium">
                      {order.orderNumber || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                        {reasonLabel(order.reason)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {order.note || "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {order.canBePickedLater ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}