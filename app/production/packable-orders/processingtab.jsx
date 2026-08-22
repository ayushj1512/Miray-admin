"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import { FileSpreadsheet } from "lucide-react";

import useAdminProductionStore from "@/store/adminProductionStore";
import PackableOrderRow from "@/components/production/PackableOrderRow";

const downloadExcel = (orders = []) => {
  const rows = orders.map((o, i) => ({
    "S.No": i + 1,
    "Order Number": o?.orderNumber || "",
    Status: o?.fulfillmentStatus || "",
    Payment: o?.paymentMethod || "",
    Amount: Number(o?.finalPayable || 0),
    AWB:
      o?.shipment?.awb ||
      o?.trackingDetails?.awb ||
      "",
    Time: new Date().toLocaleString("en-IN"),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  XLSX.utils.book_append_sheet(wb, ws, "Packing Batch");

  XLSX.writeFile(
    wb,
    `packing-batch-${Date.now()}.xlsx`
  );
};

export default function ProcessingTab({
  orders = [],
  reload,
  router,
  openInvoice,
  openLabel,
}) {
  const { markOrderPacked } =
    useAdminProductionStore();

  const [selectedIds, setSelectedIds] =
    useState(() => new Set());

  const [packingIds, setPackingIds] =
    useState(() => new Set());

  const [bulkPacking, setBulkPacking] =
    useState(false);

  const selectableOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o?.fulfillmentStatus === "processing" &&
          o?.packability?.live === true &&
          o?.customerId?.isBlacklisted !== true
      ),
    [orders]
  );

  const selectedOrders = useMemo(
    () =>
      selectableOrders.filter((o) =>
        selectedIds.has(String(o._id))
      ),
    [selectableOrders, selectedIds]
  );

  const allSelected =
    selectableOrders.length > 0 &&
    selectableOrders.every((o) =>
      selectedIds.has(String(o._id))
    );

  const toggle = (id) => {
    id = String(id);

    setSelectedIds((prev) => {
      const next = new Set(prev);

      next.has(id)
        ? next.delete(id)
        : next.add(id);

      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(
      new Set(
        selectableOrders.map((o) =>
          String(o._id)
        )
      )
    );
  };

  const packSingle = async (order) => {
    const id = String(order._id);

    if (packingIds.has(id)) return;

    setPackingIds((prev) =>
      new Set(prev).add(id)
    );

    try {
      downloadExcel([order]);

      await markOrderPacked(id);

      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      await reload();
    } catch (e) {
      toast.error(
        e?.message || "Packing failed"
      );
    } finally {
      setPackingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const bulkPack = async () => {
    if (!selectedOrders.length || bulkPacking)
      return;

    if (
      !window.confirm(
        `Download Excel and mark ${selectedOrders.length} orders packed?`
      )
    ) {
      return;
    }

    setBulkPacking(true);

    try {
      // IMPORTANT: snapshot before any mutation
      downloadExcel(selectedOrders);

      let success = 0;
      let failed = 0;

      for (const order of selectedOrders) {
        try {
          await markOrderPacked(order._id);
          success++;
        } catch {
          failed++;
        }
      }

      setSelectedIds(new Set());
      await reload();

      failed
        ? toast.error(
            `${success} packed, ${failed} failed`
          )
        : toast.success(
            `${success} orders packed`
          );
    } finally {
      setBulkPacking(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* BULK */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
          />
          Select visible
        </label>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            {selectedIds.size} selected
          </span>

          <button
            disabled={
              !selectedOrders.length ||
              bulkPacking
            }
            onClick={bulkPack}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
          >
            <FileSpreadsheet size={14} />

            {bulkPacking
              ? "Packing..."
              : "Excel & Mark Packed"}
          </button>
        </div>
      </div>

      {/* ORDERS */}
      {orders.map((order) => {
        const id = String(order._id);

        return (
          <PackableOrderRow
            key={id}
            order={order}
            statusTab="processing"
            selected={selectedIds.has(id)}
            packing={packingIds.has(id)}
            onSelect={() => toggle(id)}
            onOpen={() =>
              router.push(
                `/production/order/${id}`
              )
            }
            onInvoice={() =>
              openInvoice(order)
            }
            onLabel={() => openLabel(order)}
            onPack={() => packSingle(order)}
          />
        );
      })}
    </div>
  );
}