"use client";

import { RefreshCw, Scissors } from "lucide-react";

export default function CuttingBatchHeader({
  loading,
  onRefresh,
  onGenerate,
  creating,
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Scissors size={20} />
            <h1 className="text-xl font-semibold">
              Miray Cutting Batch
            </h1>
          </div>

          <p className="mt-1 text-sm text-zinc-500">
            Generate cutting lists directly from Shopify reservations.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            onClick={onGenerate}
            disabled={creating}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-black px-4 text-sm text-white"
          >
            <Scissors size={16} />
            Generate Batch
          </button>
        </div>
      </div>
    </div>
  );
}
