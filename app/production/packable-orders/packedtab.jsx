"use client";

import { useMemo, useState } from "react";
import {
  ExternalLink,
  FileText,
  PackageCheck,
  Tag,
  Truck,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { useOrderStore } from "@/store/orderStore";
import PackedTrackingSyncPanel from "@/components/production/PackedTrackingSyncPanel";
import PackedBulkInvoicePrint from "@/components/production/PackedBulkInvoicePrint";

const safe = (v) => String(v ?? "").trim();

const getAwb = (order = {}) =>
  safe(order?.trackingDetails?.trackingId) ||
  safe(order?.trackingDetails?.awb) ||
  safe(order?.shipment?.shiprocket?.awb) ||
  safe(order?.shipment?.awb);

const getCourier = (order = {}) =>
  safe(order?.trackingDetails?.courierName) ||
  safe(order?.shipment?.shiprocket?.courierName) ||
  safe(order?.shipment?.courierName) ||
  "-";

const getLabelUrl = (order = {}) =>
  order?.shipment?.labelUrl ||
  order?.shipment?.shiprocket?.labelUrl ||
  order?.shipment?.xpressbees?.labelUrl ||
  order?.shipment?.eshipz?.labelUrl ||
  "";

export default function PackedTab({
  orders = [],
  reload,
  router,
  openInvoice,
  openLabel,
}) {
  const {
    updateOrderStatus,
    downloadMergedLabels,
    downloadingMergedLabels,
  } = useOrderStore();

  const [selectedIds, setSelectedIds] = useState({});
  const [shipping, setShipping] = useState(false);

  const packedOrders = useMemo(
    () =>
      orders.filter(
        (o) => o?.fulfillmentStatus === "packed"
      ),
    [orders]
  );

  const visibleIds = useMemo(
    () =>
      packedOrders
        .map((o) => String(o?._id || ""))
        .filter(Boolean),
    [packedOrders]
  );

  const selectedOrders = useMemo(
    () =>
      packedOrders.filter(
        (o) => selectedIds[String(o?._id)]
      ),
    [packedOrders, selectedIds]
  );

  const allSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedIds[id]);

  const toggle = (id) => {
    const key = String(id);

    setSelectedIds((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds({});
      return;
    }

    setSelectedIds(
      Object.fromEntries(
        visibleIds.map((id) => [id, true])
      )
    );
  };

  const bulkLabels = async () => {
    if (!selectedOrders.length) {
      return toast.error("Select packed orders first");
    }

    try {
      await downloadMergedLabels({
        orderIds: selectedOrders.map((o) => o._id),
      });

      toast.success(
        `${selectedOrders.length} labels downloaded`
      );
    } catch (e) {
      toast.error(
        e?.message || "Label download failed"
      );
    }
  };

  const markShipped = async (order) => {
    if (!order?._id) return;

    try {
      await updateOrderStatus(order._id, {
        fulfillmentStatus: "shipped",
      });

      await reload();
    } catch (e) {
      toast.error(
        e?.message || "Failed to mark shipped"
      );
    }
  };

  const bulkMarkShipped = async () => {
    if (!selectedOrders.length || shipping) return;

    if (
      !window.confirm(
        `Mark ${selectedOrders.length} selected order(s) as shipped?`
      )
    ) {
      return;
    }

    setShipping(true);

    try {
      const results = await Promise.allSettled(
        selectedOrders.map((order) =>
          updateOrderStatus(order._id, {
            fulfillmentStatus: "shipped",
          })
        )
      );

      const success = results.filter(
        (r) => r.status === "fulfilled"
      ).length;

      const failed = results.length - success;

      setSelectedIds({});
      await reload();

      failed
        ? toast.error(
            `${success} shipped, ${failed} failed`
          )
        : toast.success(
            `${success} orders marked shipped`
          );
    } finally {
      setShipping(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* BULK ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4"
          />
          Select visible
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500">
            {selectedOrders.length} selected
          </span>

          <button
            disabled={
              !selectedOrders.length ||
              downloadingMergedLabels
            }
            onClick={bulkLabels}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-medium disabled:opacity-40"
          >
            <Tag size={14} />
            {downloadingMergedLabels
              ? "Downloading..."
              : "Labels PDF"}
          </button>

          <button
            disabled={
              !selectedOrders.length || shipping
            }
            onClick={bulkMarkShipped}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
          >
            <Truck size={14} />
            {shipping
              ? "Updating..."
              : "Mark Shipped"}
          </button>
        </div>
      </div>

      {/* EXISTING BULK INVOICE FUNCTIONALITY */}
      <PackedBulkInvoicePrint
        orders={packedOrders}
        selectedIds={selectedIds}
        disabled={shipping}
      />

      {/* EXISTING TRACKING SYNC FUNCTIONALITY */}
      <PackedTrackingSyncPanel
        orders={packedOrders}
        selectedIds={selectedIds}
        disabled={shipping}
        onAfterSync={async () => {
          await reload();
        }}
      />

      {/* ORDERS */}
      {!packedOrders.length ? (
        <div className="rounded-xl bg-white p-10 text-center text-sm text-zinc-500 shadow-sm">
          No packed orders found.
        </div>
      ) : (
        packedOrders.map((order) => {
          const id = String(order?._id);
          const awb = getAwb(order);
          const courier = getCourier(order);

          return (
            <div
              key={id}
              className="rounded-xl bg-white px-3 py-3 shadow-sm"
            >
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 flex-1 gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(selectedIds[id])}
                    onChange={() => toggle(id)}
                    className="mt-1 h-4 w-4 shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    {/* ORDER */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/production/order/${id}`
                          )
                        }
                        className="text-sm font-semibold hover:underline"
                      >
                        {order?.orderNumber}
                      </button>

                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                        Packed
                      </span>

                      {awb && (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          AWB Ready
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5 text-[11px] text-zinc-500">
                      {order?.customerId?.name ||
                        order?.shippingAddressSnapshot
                          ?.fullName ||
                        "Customer"}
                      {" · "}
                      {order?.paymentMethod?.toUpperCase()}
                      {" · ₹"}
                      {Number(
                        order?.finalPayable || 0
                      ).toLocaleString("en-IN")}
                    </div>

                    {/* COURIER / AWB */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <div className="rounded-lg bg-zinc-50 px-2.5 py-1.5">
                        <div className="text-[9px] uppercase text-zinc-400">
                          Courier
                        </div>

                        <div className="text-xs font-medium text-zinc-800">
                          {courier}
                        </div>
                      </div>

                      <div className="rounded-lg bg-zinc-50 px-2.5 py-1.5">
                        <div className="text-[9px] uppercase text-zinc-400">
                          AWB
                        </div>

                        <div className="text-xs font-medium text-zinc-800">
                          {awb || "Not synced"}
                        </div>
                      </div>
                    </div>

                    {/* PRODUCTS */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(order?.items || []).map(
                        (item, index) => {
                          const image =
                            item?.productSnapshot
                              ?.thumbnail ||
                            item?.productSnapshot
                              ?.images?.[0] ||
                            "";

                          const title =
                            item?.productSnapshot
                              ?.title ||
                            "Product";

                          const code =
                            item?.productSnapshot
                              ?.productCode ||
                            item?.variant?.sku ||
                            "-";

                          return (
                            <div
                              key={
                                item?.lineId ||
                                `${id}-${index}`
                              }
                              className="flex w-[220px] items-center gap-2 rounded-lg bg-zinc-50 p-1.5"
                            >
                              <div className="h-12 w-10 shrink-0 overflow-hidden rounded-md bg-white">
                                {image ? (
                                  <img
                                    src={image}
                                    alt={title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : null}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="truncate text-[11px] font-medium">
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
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>

                {/* ROW ACTIONS */}
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  <button
                    onClick={() =>
                      router.push(
                        `/production/order/${id}`
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] font-medium"
                  >
                    <ExternalLink size={12} />
                    Open
                  </button>

                  <button
                    onClick={() => openInvoice(order)}
                    className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] font-medium"
                  >
                    <FileText size={12} />
                    Invoice
                  </button>

                  <button
                    onClick={() => openLabel(order)}
                    disabled={!getLabelUrl(order)}
                    className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] font-medium disabled:opacity-40"
                  >
                    <Tag size={12} />
                    Label
                  </button>

                  <button
                    onClick={() =>
                      markShipped(order)
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-zinc-950 px-2.5 py-1.5 text-[11px] font-medium text-white"
                  >
                    <PackageCheck size={12} />
                    Mark Shipped
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}