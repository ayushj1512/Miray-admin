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
    fetchCuttingBatches,
    createCuttingBatch,
  } = cuttingBatchStore();

  useEffect(() => {
    fetchCuttingBatches();
  }, []);

  const handleGenerate = async () => {
    await createCuttingBatch();
    await fetchCuttingBatches();
  };

  return (
    <div className="space-y-6 p-6">
      <CuttingBatchHeader
        loading={loading}
        creating={creating}
        onRefresh={fetchCuttingBatches}
        onGenerate={handleGenerate}
      />

      <CuttingBatchStats batches={batches} />

      <CuttingBatchTable
        batch={selectedBatch || batches?.[0]}
      />
    </div>
  );
}