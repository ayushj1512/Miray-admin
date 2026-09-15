"use client";

import ProductionJobLogs from "@/components/production-job/ProductionJobLogs";

export default function TailorProductionJobLogsPage() {
  return (
    <ProductionJobLogs
      title="Production Job Logs"
      description="Track tailor production assignments, receiving progress and completion history."
      defaultLimit={30}
    />
  );
}