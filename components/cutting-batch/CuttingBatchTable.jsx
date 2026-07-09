"use client";

import CuttingBatchExcelButton from "./CuttingBatchExcelButton";

export default function CuttingBatchTable({ batch }) {
  if (!batch) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 p-5">
        <div>
          <h2 className="font-semibold">
            {batch.batchNumber}
          </h2>

          <p className="text-sm text-zinc-500">
            {batch.fromOrderNumber} → {batch.toOrderNumber}
          </p>
        </div>

        <CuttingBatchExcelButton batch={batch} />
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
            {batch.rows?.map((row, index) => (
              <tr
                key={`${row.productCode}-${index}`}
                className="border-t border-zinc-100"
              >
                <td className="px-4 py-3">
                  <img
                    src={row.productImage}
                    alt={row.productTitle}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                </td>

                <td className="px-4 py-3">
                  {row.productTitle}
                </td>

                <td className="px-4 py-3">
                  {row.productCode}
                </td>

                <td className="px-4 py-3 text-center">
                  {row.xs}
                </td>

                <td className="px-4 py-3 text-center">
                  {row.s}
                </td>

                <td className="px-4 py-3 text-center">
                  {row.m}
                </td>

                <td className="px-4 py-3 text-center">
                  {row.l}
                </td>

                <td className="px-4 py-3 text-center">
                  {row.xl}
                </td>

                <td className="px-4 py-3 text-center font-semibold">
                  {row.totalQty}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
