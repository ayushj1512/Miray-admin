"use client";

import ProductionJobLogs from "@/components/production-job/ProductionJobLogs";

export default function ProductionJobLogsPage() {
  return (
    <ProductionJobLogs
      title="Production Job Logs"
      description="View production activity, assigned quantities, received stock, pending units and job values."
      defaultLimit={30}
    />
  );
}