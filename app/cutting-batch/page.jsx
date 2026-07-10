"use client";

import { useEffect } from "react";
import cuttingBatchStore from "@/store/cuttingbatchstore";

import CuttingBatchHeader from "@/components/cutting-batch/CuttingBatchHeader";
import CuttingBatchStats from "@/components/cutting-batch/CuttingBatchStats";
import CuttingBatchTable from "@/components/cutting-batch/CuttingBatchTable";

export default function CuttingBatchDashboard() {
  const {
    batches,
    selectedBatch,
    creating,
    loading,
    error,
    fetchCuttingBatches,
    createCuttingBatch,
  } = cuttingBatchStore();

  useEffect(() => {
    fetchCuttingBatches();
  }, [fetchCuttingBatches]);

  const handleGenerate = async () => {
    await createCuttingBatch();
    await fetchCuttingBatches();
  };

  const activeBatch = selectedBatch || batches?.[0] || null;

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <CuttingBatchHeader
          loading={loading}
          creating={creating}
          onRefresh={fetchCuttingBatches}
          onGenerate={handleGenerate}
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <CuttingBatchStats batches={batches} />

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
            Loading cutting batches...
          </div>
        ) : (
          <CuttingBatchTable batch={activeBatch} />
        )}
      </div>
    </main>
  );
}