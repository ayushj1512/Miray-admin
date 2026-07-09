"use client";

import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import adminShopifyStore from "@/store/adminshopifystore";

export default function ImportShopifyOrdersButton({
  className = "",
  size = "md",
  label = "Import Orders",
  refreshAfterImport = false,
  params = {},
}) {
  const {
    importingOrders,
    importError,
    lastImportResult,
    importShopifyOrdersToLocal,
    fetchShopifyOrders,
  } = adminShopifyStore();

  const handleImport = async () => {
    const res = await importShopifyOrdersToLocal(params);

    if (refreshAfterImport) {
      await fetchShopifyOrders({ after: "" });
    }

    return res;
  };

  const sizes = {
    sm: "h-9 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-sm",
  };

  const created = Number(lastImportResult?.created || 0);
  const skipped = Number(lastImportResult?.skipped || 0);
  const failed = Number(lastImportResult?.failed || 0);
  const total = Number(lastImportResult?.total || 0);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleImport}
        disabled={importingOrders}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-xl border border-black bg-black font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60",
          sizes[size] || sizes.md,
          className,
        ].join(" ")}
      >
        <RefreshCw
          className={`h-4 w-4 ${importingOrders ? "animate-spin" : ""}`}
        />

        {importingOrders ? "Importing..." : label}
      </button>

      {lastImportResult && (
        <div className="flex items-center gap-1 text-xs text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>
            Total {total} · Imported {created} · Already Imported {skipped} ·
            Failed {failed}
          </span>
        </div>
      )}

      {importError && (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{importError}</span>
        </div>
      )}
    </div>
  );
}
