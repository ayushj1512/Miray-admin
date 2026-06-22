"use client";

export default function CuttingBatchStats({ batches = [] }) {
  const totalBatches = batches.length;

  const totalOrders = batches.reduce(
    (sum, batch) => sum + Number(batch.totalOrders || 0),
    0
  );

  const totalPieces = batches.reduce(
    (sum, batch) => sum + Number(batch.totalPieces || 0),
    0
  );

  const lastBatch = batches?.[0];

  const cards = [
    {
      label: "Total Batches",
      value: totalBatches,
    },
    {
      label: "Total Orders",
      value: totalOrders,
    },
    {
      label: "Total Pieces",
      value: totalPieces,
    },
    {
      label: "Last Batch",
      value: lastBatch?.batchNumber || "-",
    },
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

          <h3 className="mt-2 text-2xl font-semibold text-zinc-950">
            {item.value}
          </h3>
        </div>
      ))}
    </div>
  );
}