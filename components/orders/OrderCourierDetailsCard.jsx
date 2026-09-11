"use client";

import {
  Copy,
  ExternalLink,
  FileText,
  Package,
  RefreshCw,
  Truck,
} from "lucide-react";
import { toast } from "react-hot-toast";

const Row = ({ label, value }) => (
  <div>
    <p className="text-[11px] font-medium uppercase text-gray-400">{label}</p>
    <p className="mt-1 break-all text-sm font-semibold text-gray-800">
      {value || "-"}
    </p>
  </div>
);

const pretty = (v) =>
  String(v || "-").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function OrderCourierDetailsCard({ order, onRefresh }) {
  const shipment = order?.shipment || {};
  const tracking = order?.trackingDetails || {};

  const provider = shipment.provider || "";
  const providerData = shipment?.[provider] || {};

  const awb =
    shipment.awb ||
    providerData.awb ||
    tracking.awb ||
    tracking.trackingId ||
    "";

  const courier =
    shipment.courierName ||
    providerData.courierName ||
    tracking.courierName ||
    "";

  const trackingUrl =
    shipment.trackingUrl ||
    providerData.trackingUrl ||
    tracking.trackingUrl ||
    "";

  const labelUrl =
    shipment.labelUrl ||
    providerData.labelUrl ||
    "";

  const invoiceUrl =
    providerData.invoiceUrl ||
    shipment?.eshipz?.invoiceUrl ||
    "";

  const manifestUrl =
    providerData.manifestUrl ||
    shipment?.eshipz?.manifestUrl ||
    "";

  const copyAwb = async () => {
    if (!awb) return toast.error("AWB not available");

    await navigator.clipboard.writeText(awb);
    toast.success("AWB copied");
  };

  const open = (url) => {
    if (!url) return toast.error("URL not available");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <Truck size={18} />
            Courier Details
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Shipment, AWB and courier documents.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Row label="Provider" value={pretty(provider)} />
        <Row label="Courier" value={courier} />
        <Row label="AWB" value={awb} />
        <Row label="Status" value={pretty(shipment.status)} />

        <Row
          label="Shipment ID"
          value={shipment.shipmentId || providerData.shipmentId}
        />

        <Row
          label="Courier Order ID"
          value={shipment.orderId || providerData.orderId}
        />

        <Row
          label="Last Sync"
          value={
            shipment.lastSyncedAt
              ? new Date(shipment.lastSyncedAt).toLocaleString("en-IN")
              : "-"
          }
        />

        <Row
          label="Expected Delivery"
          value={
            providerData.expectedDelivery ||
            tracking.expectedDelivery ||
            "-"
          }
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={copyAwb}
          disabled={!awb}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold hover:bg-gray-50 disabled:opacity-40"
        >
          <Copy size={14} />
          Copy AWB
        </button>

        <button
          onClick={() => open(trackingUrl)}
          disabled={!trackingUrl}
          className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          <ExternalLink size={14} />
          Track Shipment
        </button>

        <button
          onClick={() => open(labelUrl)}
          disabled={!labelUrl}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold hover:bg-gray-50 disabled:opacity-40"
        >
          <Package size={14} />
          Download Label
        </button>

        {invoiceUrl && (
          <button
            onClick={() => open(invoiceUrl)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold hover:bg-gray-50"
          >
            <FileText size={14} />
            Invoice
          </button>
        )}

        {manifestUrl && (
          <button
            onClick={() => open(manifestUrl)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold hover:bg-gray-50"
          >
            <FileText size={14} />
            Manifest
          </button>
        )}
      </div>
    </div>
  );
}