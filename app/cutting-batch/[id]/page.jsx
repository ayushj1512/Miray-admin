"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import cuttingBatchStore from "@/store/cuttingbatchstore";
import CuttingBatchTable from "@/components/cutting-batch/CuttingBatchTable";

export default function CuttingBatchDetailPage() {
  const { id } = useParams();

  const {
    selectedBatch,
    loading,
    error,
    fetchCuttingBatchById,
  } = cuttingBatchStore();

  useEffect(() => {
    if (id) fetchCuttingBatchById(id);
  }, [id, fetchCuttingBatchById]);

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-7xl space-y-5">
        <div>
          <h1 className="text-xl font-semibold">Cutting Batch Details</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Product-wise size breakdown for this Miray cutting batch.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
            Loading batch...
          </div>
        ) : (
          <CuttingBatchTable batch={selectedBatch} />
        )}
      </div>
    </main>
  );
}