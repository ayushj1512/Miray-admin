"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Copy,
  Loader2,
  PackageSearch,
  RefreshCw,
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

  if (!cleanValue) return false;

  await navigator.clipboard.writeText(cleanValue);
  return true;
};

const matchesSearch = (order, query) => {
  const search = text(query).toLowerCase();

  if (!search) return true;

  return [
    order?.orderNumber,
    order?.customer?.name,
    order?.customer?.phone,
    order?.customer?.city,
    order?.customer?.pincode,
    order?.shipment?.awb,
    order?.shipment?.shipmentId,
    order?.shipment?.rawStatus,
  ].some((value) =>
    text(value).toLowerCase().includes(search)
  );
};

const getMissingFields = (order) => {
  const fields = [];

  if (!text(order?.shipment?.shipmentId)) {
    fields.push("Shipment ID");
  }

  if (!text(order?.shipment?.awb)) {
    fields.push("AWB");
  }

  if (!text(order?.shipment?.labelUrl)) {
    fields.push("Label");
  }

  return fields;
};

export default function LabelsMissingTab({
  orders = [],
  loading = false,
  repairingOrderId = null,
  repairLoading = false,
  repairResults = [],
  onRepairOrder,
  onRepairAll,
  onMessage,
}) {
  const [search, setSearch] = useState("");

  const filteredOrders = useMemo(
    () => orders.filter((order) => matchesSearch(order, search)),
    [orders, search]
  );

  const resultMap = useMemo(
    () =>
      new Map(
        repairResults.map((result) => [
          String(result?.orderId),
          result,
        ])
      ),
    [repairResults]
  );

  const copyOrderNumbers = async () => {
    try {
      const orderNumbers = filteredOrders
        .map((order) => text(order?.orderNumber))
        .filter(Boolean)
        .join("\n");

      if (await copyText(orderNumbers)) {
        onMessage?.(
          `${filteredOrders.length} order numbers copied.`
        );
      }
    } catch {
      onMessage?.("Failed to copy order numbers.");
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="h-5 w-5" />

              <h2 className="font-semibold">
                {orders.length} orders need Shiprocket repair
              </h2>
            </div>

            <p className="mt-1 text-sm text-amber-800">
              Repair orders individually or repair all shown orders.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyOrderNumbers}
              disabled={!filteredOrders.length}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-400 bg-white px-4 text-sm font-medium text-amber-900 disabled:opacity-40"
            >
              <Copy className="h-4 w-4" />
              Copy Orders
            </button>

            <button
              type="button"
              onClick={() =>
                onRepairAll?.(
                  filteredOrders.map((order) =>
                    String(order?._id)
                  )
                )
              }
              disabled={!filteredOrders.length || repairLoading}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-900 px-4 text-sm font-medium text-white disabled:opacity-40"
            >
              {repairLoading && !repairingOrderId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              Repair All
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order, customer, AWB or error..."
            className="h-11 w-full rounded-xl border border-zinc-300 pl-10 pr-4 text-sm outline-none focus:border-zinc-950"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <p className="text-sm font-medium">
            Missing Shiprocket Details
          </p>

          <span className="text-sm text-zinc-500">
            {filteredOrders.length} orders shown
          </span>
        </div>

        {loading ? (
          <LoadingState />
        ) : !filteredOrders.length ? (
          <EmptyState />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Missing</th>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3">Last Error</th>
                    <th className="px-4 py-3">Result</th>
                    <th className="px-4 py-3 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100">
                  {filteredOrders.map((order) => {
                    const orderId = String(order?._id);
                    const repairing =
                      repairingOrderId === orderId;

                    return (
                      <MissingOrderRow
                        key={orderId}
                        order={order}
                        result={resultMap.get(orderId)}
                        repairing={repairing}
                        disabled={
                          repairLoading && !repairing
                        }
                        onRepair={() =>
                          onRepairOrder?.(orderId)
                        }
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-zinc-100 lg:hidden">
              {filteredOrders.map((order) => {
                const orderId = String(order?._id);
                const repairing =
                  repairingOrderId === orderId;

                return (
                  <MissingOrderCard
                    key={orderId}
                    order={order}
                    result={resultMap.get(orderId)}
                    repairing={repairing}
                    disabled={
                      repairLoading && !repairing
                    }
                    onRepair={() =>
                      onRepairOrder?.(orderId)
                    }
                  />
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function MissingOrderRow({
  order,
  result,
  repairing,
  disabled,
  onRepair,
}) {
  const missingFields = getMissingFields(order);

  return (
    <tr className="align-top bg-amber-50/30 hover:bg-amber-50/60">
      <td className="px-4 py-4">
        <p className="font-semibold text-amber-900">
          {order?.orderNumber || "-"}
        </p>

        <p className="mt-1 text-xs text-zinc-500">
          {formatDate(order?.packedAt || order?.orderDate)}
        </p>
      </td>

      <td className="px-4 py-4">
        <p className="font-medium">
          {order?.customer?.name || "-"}
        </p>

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
        <div className="flex max-w-52 flex-wrap gap-1.5">
          {missingFields.map((field) => (
            <span
              key={field}
              className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800"
            >
              {field}
            </span>
          ))}
        </div>
      </td>

      <td className="px-4 py-4 text-xs text-zinc-600">
        <p>
          AWB:{" "}
          <span className="font-medium">
            {order?.shipment?.awb || "-"}
          </span>
        </p>

        <p className="mt-1">
          Shipment:{" "}
          <span className="font-medium">
            {order?.shipment?.shipmentId || "-"}
          </span>
        </p>

        <p className="mt-1">
          Provider:{" "}
          <span className="font-medium">Shiprocket</span>
        </p>
      </td>

      <td className="max-w-64 px-4 py-4">
        <p className="line-clamp-3 text-xs text-red-700">
          {order?.shipment?.rawStatus || "-"}
        </p>
      </td>

      <td className="px-4 py-4">
        <RepairResult result={result} />
      </td>

      <td className="px-4 py-4 text-right">
        <RepairButton
          repairing={repairing}
          disabled={disabled}
          onClick={onRepair}
        />
      </td>
    </tr>
  );
}

function MissingOrderCard({
  order,
  result,
  repairing,
  disabled,
  onRepair,
}) {
  const missingFields = getMissingFields(order);

  return (
    <article className="bg-amber-50/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-amber-900">
            {order?.orderNumber || "-"}
          </h2>

          <p className="mt-0.5 text-xs text-zinc-500">
            {formatDate(order?.packedAt || order?.orderDate)}
          </p>
        </div>

        <RepairButton
          repairing={repairing}
          disabled={disabled}
          onClick={onRepair}
        />
      </div>

      <div className="mt-4">
        <p className="text-xs text-zinc-500">Missing</p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {missingFields.map((field) => (
            <span
              key={field}
              className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800"
            >
              {field}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-zinc-500">
            Customer
          </p>

          <p className="mt-1 font-medium">
            {order?.customer?.name || "-"}
          </p>

          <p className="text-xs text-zinc-500">
            {order?.customer?.phone || "-"}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">
            Current AWB
          </p>

          <p className="mt-1 font-medium">
            {order?.shipment?.awb || "-"}
          </p>

          <p className="text-xs text-zinc-500">
            Shiprocket
          </p>
        </div>
      </div>

      {order?.shipment?.rawStatus && (
        <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">
          {order.shipment.rawStatus}
        </div>
      )}

      {result && (
        <div className="mt-4">
          <RepairResult result={result} />
        </div>
      )}
    </article>
  );
}

function RepairButton({
  repairing,
  disabled,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={repairing || disabled}
      className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-950 px-3 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {repairing ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <RefreshCw className="h-3.5 w-3.5" />
      )}

      {repairing ? "Repairing..." : "Repair"}
    </button>
  );
}

function RepairResult({ result }) {
  if (!result) {
    return (
      <span className="text-xs text-zinc-400">
        Not attempted
      </span>
    );
  }

  return (
    <div
      className={`max-w-64 rounded-lg px-2.5 py-2 text-xs ${
        result?.success
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      <p className="font-semibold">
        {result?.success
          ? "Success"
          : result?.code || "Failed"}
      </p>

      <p className="mt-0.5">
        {result?.message || "-"}
      </p>
    </div>
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
      <PackageSearch className="mb-3 h-10 w-10 text-zinc-300" />

      <h2 className="font-medium">
        No missing labels
      </h2>

      <p className="mt-1 text-sm text-zinc-500">
        All packed orders currently have shipping labels.
      </p>
    </div>
  );
}
