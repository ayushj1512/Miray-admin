"use client";

export default function CuttingBatchStats({ batches = [] }) {
  const totalBatches = batches.length;

  const totalOrders = batches.reduce(
    (sum, batch) =>
      sum + Number(batch.totalOrders || batch.includedOrders?.length || 0),
    0
  );

  const totalPieces = batches.reduce(
    (sum, batch) => sum + Number(batch.totalPieces || 0),
    0
  );

  const skippedOrders = batches.reduce(
    (sum, batch) => sum + Number(batch.skippedOrders?.length || 0),
    0
  );

  const lastBatch = batches?.[0];

  const cards = [
    { label: "Total Batches", value: totalBatches },
    { label: "Included Orders", value: totalOrders },
    { label: "Total Pieces", value: totalPieces },
    { label: "Skipped Orders", value: skippedOrders },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-zinc-200 bg-white p-5"
        >
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {item.label}
          </p>

          <h3 className="mt-2 truncate text-2xl font-semibold text-zinc-950">
            {item.value}
          </h3>
        </div>
      ))}

      {lastBatch && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 md:col-span-4">
          <p className="text-xs uppercase tracking-wide text-emerald-700">
            Last Batch
          </p>

          <h3 className="mt-2 font-semibold text-emerald-950">
            {lastBatch.batchNumber}
          </h3>

          <p className="mt-1 text-sm text-emerald-700">
            {lastBatch.fromOrderNumber} → {lastBatch.toOrderNumber}
          </p>
        </div>
      )}
    </div>
  );
}