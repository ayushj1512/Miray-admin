export default function ProductionHeader({
  onRefresh,
  onReconcile,
  reconciling = false,
  onExport,
  exporting,
  canExport,
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      {/* LEFT */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 md:text-2xl">
          Production
        </h1>

        <p className="text-xs text-gray-500">
          Fast • Paginated • Easy to manage
        </p>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap items-center gap-2">
        {/* REFRESH */}
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-xl bg-white px-3 py-2 text-xs font-medium text-gray-800 shadow-sm transition hover:shadow"
        >
          Refresh
        </button>

        {/* RECONCILE */}
        <button
          type="button"
          onClick={onReconcile}
          disabled={reconciling}
          title="Reconcile pending inventory reservations"
          className="rounded-xl bg-white px-3 py-2 text-xs font-medium text-gray-800 shadow-sm transition hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
        >
          {reconciling ? "Reconciling..." : "Reconcile"}
        </button>

        {/* EXPORT */}
        <button
          type="button"
          onClick={onExport}
          disabled={exporting || !canExport}
          className="rounded-xl bg-black px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exporting ? "Exporting..." : "Export Excel"}
        </button>
      </div>
    </div>
  );
}