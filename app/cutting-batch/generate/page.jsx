"use client";

import { useEffect } from "react";
import { Download, RefreshCw, Scissors } from "lucide-react";
import cuttingBatchStore from "@/store/cuttingbatchstore";
import CuttingBatchTable from "@/components/cutting-batch/CuttingBatchTable";
import CuttingBatchStats from "@/components/cutting-batch/CuttingBatchStats";
import CuttingBatchExcelButton from "@/components/cutting-batch/CuttingBatchExcelButton";

export default function GenerateCuttingBatchPage() {
  const {
    batches,
    selectedBatch,
    lastCreatedBatch,
    loading,
    creating,
    error,
    fetchCuttingBatches,
    createCuttingBatch,
    clearError,
  } = cuttingBatchStore();

  useEffect(() => {
    fetchCuttingBatches();
  }, [fetchCuttingBatches]);

  const batch = lastCreatedBatch || selectedBatch || batches?.[0];

  const handleGenerate = async () => {
    clearError();

    const res = await createCuttingBatch();

    if (res?.success) {
      await fetchCuttingBatches();
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Scissors size={20} />
                <h1 className="text-xl font-semibold">
                  Generate Cutting Batch
                </h1>
              </div>

              <p className="mt-1 text-sm text-zinc-500">
                Automatically create the next Miray cutting list from pending Shopify reservations.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={fetchCuttingBatches}
                disabled={loading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                onClick={handleGenerate}
                disabled={creating}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {creating ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                Generate
              </button>

              {batch && <CuttingBatchExcelButton batch={batch} label="Download" />}
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
        </section>

        <CuttingBatchStats batches={batches} />

        {batch ? (
          <CuttingBatchTable batch={batch} />
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
            No cutting batch available yet.
          </div>
        )}
      </div>
    </main>
  );
}
