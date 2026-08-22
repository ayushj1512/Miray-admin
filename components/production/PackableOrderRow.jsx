"use client";

import {
  ExternalLink,
  FileText,
  PackageCheck,
  Tag,
} from "lucide-react";

export default function PackableOrderRow({
  order,
  selected,
  onSelect,
  onOpen,
  onInvoice,
  onLabel,
  onPack,
  packing = false,
  statusTab = "processing",
}) {
  const blacklisted =
    order?.customerId?.isBlacklisted === true;

  const live =
    order?.packability?.live === true;

  const mismatch =
    order?.packability?.syncMismatch === true;

  const canSelect =
    !blacklisted &&
    (statusTab === "packed"
      ? order?.fulfillmentStatus === "packed"
      : live);

  return (
    <div className="rounded-xl bg-white px-3 py-2.5 shadow-sm">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          disabled={!canSelect}
          checked={selected}
          onChange={onSelect}
          className="mt-1 h-4 w-4 shrink-0"
        />

        <div className="min-w-0 flex-1">
          {/* TOP */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={onOpen}
                  className="text-sm font-semibold text-zinc-950 hover:underline"
                >
                  {order?.orderNumber}
                </button>

                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                    statusTab === "packed"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {statusTab === "packed"
                    ? "Packed"
                    : "Live Packable"}
                </span>

                {mismatch && (
                  <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
                    Mismatch
                  </span>
                )}
              </div>

              <div className="mt-0.5 text-[11px] text-zinc-500">
                {order?.customerId?.name ||
                  order?.shippingAddressSnapshot?.fullName ||
                  "Customer"}
                {" · "}
                {order?.paymentMethod?.toUpperCase()}
                {" · ₹"}
                {Number(
                  order?.finalPayable || 0
                ).toLocaleString("en-IN")}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={onOpen}
                className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] font-medium"
              >
                <ExternalLink size={12} />
                Open
              </button>

              <button
                onClick={onInvoice}
                className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] font-medium"
              >
                <FileText size={12} />
                Invoice
              </button>

              <button
                onClick={onLabel}
                disabled={!order?.hasLabel}
                className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] font-medium disabled:opacity-35"
              >
                <Tag size={12} />
                Label
              </button>

              {statusTab === "processing" && (
                <button
                  onClick={onPack}
                  disabled={!live || blacklisted || packing}
                  className="inline-flex items-center gap-1 rounded-lg bg-zinc-950 px-2.5 py-1.5 text-[11px] font-medium text-white disabled:opacity-40"
                >
                  <PackageCheck size={12} />
                  {packing ? "Packing..." : "Mark Packed"}
                </button>
              )}
            </div>
          </div>

          {/* PRODUCTS */}
          <div className="mt-2 flex flex-wrap gap-2">
            {(order?.items || []).map((item, index) => {
              const image =
                item?.productSnapshot?.thumbnail ||
                item?.productSnapshot?.images?.[0] ||
                "";

              const title =
                item?.productSnapshot?.title || "Product";

              const code =
                item?.productSnapshot?.productCode ||
                item?.variant?.sku ||
                "-";

              return (
                <div
                  key={item?.lineId || index}
                  className="flex w-[220px] items-center gap-2 rounded-lg bg-zinc-50 p-1.5"
                >
                  <div className="h-12 w-10 shrink-0 overflow-hidden rounded-md bg-white">
                    {image ? (
                      <img
                        src={image}
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[8px] text-zinc-400">
                        No img
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-medium text-zinc-900">
                      {title}
                    </div>

                    <div className="text-[10px] text-zinc-500">
                      {code}
                      {item?.selectedSize
                        ? ` · ${item.selectedSize}`
                        : ""}
                      {" · Qty "}
                      {item?.quantity || 0}
                    </div>

                    {item?.packability?.requiredQty != null && (
                      <div className="mt-0.5 text-[10px] font-medium text-emerald-700">
                        {item?.packability?.reservedQty || 0}/
                        {item?.packability?.requiredQty || 0} reserved
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}