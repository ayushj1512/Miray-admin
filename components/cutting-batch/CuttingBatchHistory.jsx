"use client";

import { Eye } from "lucide-react";
import CuttingBatchExcelButton from "./CuttingBatchExcelButton";

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

export default function CuttingBatchHistory({ batches = [], onView }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 p-5">
        <h2 className="font-semibold">Batch History</h2>
        <p className="mt-1 text-sm text-zinc-500">
          View and download previous cutting lists.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3 text-left">Batch</th>
              <th className="px-4 py-3 text-left">Date & Time</th>
              <th className="px-4 py-3 text-left">Range</th>
              <th className="px-4 py-3 text-left">Orders</th>
              <th className="px-4 py-3 text-left">Pieces</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100">
            {batches.length ? (
              batches.map((batch) => (
                <tr key={batch._id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium">
                    {batch.batchNumber}
                  </td>

                  <td className="px-4 py-3 text-zinc-600">
                    {formatDateTime(batch.createdAt)}
                  </td>

                  <td className="px-4 py-3 text-zinc-600">
                    {batch.fromOrderNumber} → {batch.toOrderNumber}
                  </td>

                  <td className="px-4 py-3">{batch.totalOrders || 0}</td>

                  <td className="px-4 py-3 font-medium">
                    {batch.totalPieces || 0}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onView?.(batch)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium hover:bg-zinc-50"
                      >
                        <Eye size={14} />
                        View
                      </button>

                      <CuttingBatchExcelButton batch={batch} />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-zinc-500"
                >
                  No cutting batches found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
