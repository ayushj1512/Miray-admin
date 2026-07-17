"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  PackageCheck,
  Search,
} from "lucide-react";

const text = (value) => String(value || "").trim();

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const copyText = async (value) => {
  const cleanValue = text(value);

  if (!cleanValue) {
    return false;
  }

  await navigator.clipboard.writeText(cleanValue);

  return true;
};

const matchesSearch = (order, query) => {
  const search = text(query).toLowerCase();

  if (!search) {
    return true;
  }

  const values = [
    order?.orderNumber,
    order?.customer?.name,
    order?.customer?.phone,
    order?.customer?.city,
    order?.customer?.pincode,
    order?.shipment?.awb,
    order?.shipment?.courierName,
  ];

  return values.some((value) =>
    text(value).toLowerCase().includes(search)
  );
};

export default function LabelsAvailableTab({
  orders = [],
  loading = false,
  downloading = false,
  onDownloadSelected,
  onDownloadAll,
  onMessage,
}) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const filteredOrders = useMemo(
    () => orders.filter((order) => matchesSearch(order, search)),
    [orders, search]
  );

  const allSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((order) =>
      selectedIds.includes(String(order?._id))
    );

  const toggleOrder = (orderId) => {
    const id = String(orderId);

    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds((current) =>
        current.filter(
          (id) =>
            !filteredOrders.some(
              (order) => String(order?._id) === id
            )
        )
      );

      return;
    }

    setSelectedIds((current) => [
      ...new Set([
        ...current,
        ...filteredOrders.map((order) => String(order?._id)),
      ]),
    ]);
  };

  const downloadSelected = async () => {
    if (!selectedIds.length) {
      onMessage?.("Select at least one label.");
      return;
    }

    await onDownloadSelected?.(selectedIds);
  };

  const copyAwb = async (awb) => {
    try {
      if (await copyText(awb)) {
        onMessage?.(`AWB ${awb} copied.`);
      }
    } catch {
      onMessage?.("Failed to copy AWB.");
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order, customer, AWB or courier..."
              className="h-11 w-full rounded-xl border border-zinc-300 pl-10 pr-4 text-sm outline-none focus:border-zinc-950"
            />
          </div>

          <button
            type="button"
            onClick={downloadSelected}
            disabled={!selectedIds.length || downloading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white disabled:opacity-40"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}

            Download Selected
            {selectedIds.length > 0 && ` (${selectedIds.length})`}
          </button>

          <button
            type="button"
            onClick={onDownloadAll}
            disabled={!orders.length || downloading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white disabled:opacity-40"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}

            Download All
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              disabled={!filteredOrders.length}
              className="h-4 w-4 rounded"
            />

            Select all shown
          </label>

          <span className="text-sm text-zinc-500">
            {filteredOrders.length} labels available
          </span>
        </div>

        {loading ? (
          <LoadingState />
        ) : !filteredOrders.length ? (
          <EmptyState />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1050px]">
                <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="w-12 px-4 py-3" />
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Courier</th>
                    <th className="px-4 py-3">AWB</th>
                    <th className="px-4 py-3">Label</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100">
                  {filteredOrders.map((order) => (
                    <AvailableOrderRow
                      key={order?._id}
                      order={order}
                      selected={selectedIds.includes(
                        String(order?._id)
                      )}
                      onToggle={() => toggleOrder(order?._id)}
                      onCopyAwb={() =>
                        copyAwb(order?.shipment?.awb)
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-zinc-100 lg:hidden">
              {filteredOrders.map((order) => (
                <AvailableOrderCard
                  key={order?._id}
                  order={order}
                  selected={selectedIds.includes(
                    String(order?._id)
                  )}
                  onToggle={() => toggleOrder(order?._id)}
                  onCopyAwb={() =>
                    copyAwb(order?.shipment?.awb)
                  }
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function AvailableOrderRow({
  order,
  selected,
  onToggle,
  onCopyAwb,
}) {
  const items = Array.isArray(order?.items) ? order.items : [];

  return (
    <tr className="align-top hover:bg-zinc-50">
      <td className="px-4 py-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="h-4 w-4 rounded"
        />
      </td>

      <td className="px-4 py-4">
        <p className="font-semibold">{order?.orderNumber || "-"}</p>

        <p className="mt-1 text-xs text-zinc-500">
          {formatDate(order?.packedAt || order?.orderDate)}
        </p>
      </td>

      <td className="px-4 py-4">
        <p className="font-medium">{order?.customer?.name || "-"}</p>

        <p className="mt-1 text-xs text-zinc-500">
          {order?.customer?.phone || "-"}
        </p>

        <p className="text-xs text-zinc-500">
          {[order?.customer?.city, order?.customer?.pincode]
            .filter(Boolean)
            .join(" · ") || "-"}
        </p>
      </td>

      <td className="px-4 py-4">
        <p className="text-sm font-medium">
          {order?.itemCount || 0} item(s)
        </p>

        <div className="mt-1 max-w-64 space-y-1">
          {items.slice(0, 2).map((item, index) => (
            <p
              key={item?.lineId || item?.productCode || index}
              className="truncate text-xs text-zinc-500"
            >
              {item?.productCode || item?.title || "Product"}
              {item?.size ? ` · ${item.size}` : ""}
              {item?.quantity > 1 ? ` × ${item.quantity}` : ""}
            </p>
          ))}

          {items.length > 2 && (
            <p className="text-xs text-zinc-400">
              +{items.length - 2} more
            </p>
          )}
        </div>
      </td>

      <td className="px-4 py-4">
        <p className="text-sm uppercase">
          {order?.paymentMethod || "-"}
        </p>

        <p className="mt-1 text-xs capitalize text-zinc-500">
          {order?.paymentStatus || "-"}
        </p>
      </td>

      <td className="px-4 py-4">
        <p className="max-w-44 text-sm">
          {order?.shipment?.courierName || "-"}
        </p>

        <p className="mt-1 text-xs capitalize text-zinc-500">
          {order?.shipment?.provider || "-"}
        </p>
      </td>

      <td className="px-4 py-4">
        <button
          type="button"
          onClick={onCopyAwb}
          className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
        >
          {order?.shipment?.awb || "-"}
          <Copy className="h-3.5 w-3.5" />
        </button>
      </td>

      <td className="px-4 py-4">
        <a
          href={order?.shipment?.labelUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
        >
          <Check className="h-3.5 w-3.5" />
          Open Label
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </td>
    </tr>
  );
}

function AvailableOrderCard({
  order,
  selected,
  onToggle,
  onCopyAwb,
}) {
  return (
    <article className="p-4">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-1 h-4 w-4 rounded"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">
                {order?.orderNumber || "-"}
              </h2>

              <p className="mt-0.5 text-xs text-zinc-500">
                {formatDate(order?.packedAt || order?.orderDate)}
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Label Ready
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-zinc-500">Customer</p>
              <p className="mt-1 font-medium">
                {order?.customer?.name || "-"}
              </p>
              <p className="text-xs text-zinc-500">
                {order?.customer?.phone || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-500">Courier</p>
              <p className="mt-1 font-medium">
                {order?.shipment?.courierName || "-"}
              </p>
              <p className="text-xs text-zinc-500">
                {order?.shipment?.awb || "-"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onCopyAwb}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy AWB
            </button>

            <a
              href={order?.shipment?.labelUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white"
            >
              Open Label
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-72 items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-zinc-500" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
      <PackageCheck className="mb-3 h-10 w-10 text-zinc-300" />
      <h2 className="font-medium">No labels available</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Available shipping labels will appear here.
      </p>
    </div>
  );
}