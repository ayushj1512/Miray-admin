"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import cuttingBatchStore from "@/store/cuttingbatchstore";
import CuttingBatchHistory from "@/components/cutting-batch/CuttingBatchHistory";

export default function CuttingBatchHistoryPage() {
  const router = useRouter();

  const {
    batches,
    loading,
    error,
    fetchCuttingBatches,
    setSelectedBatch,
  } = cuttingBatchStore();

  useEffect(() => {
    fetchCuttingBatches();
  }, [fetchCuttingBatches]);

  const handleView = (batch) => {
    setSelectedBatch(batch);
    router.push(`/cutting-batch/${batch._id}`);
  };

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-7xl space-y-5">
        <div>
          <h1 className="text-xl font-semibold">Cutting Batch History</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Review generated Miray cutting batches by date and time.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
            Loading batches...
          </div>
        ) : (
          <CuttingBatchHistory batches={batches} onView={handleView} />
        )}
      </div>
    </main>
  );
}