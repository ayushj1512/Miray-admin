"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Check,
  Clipboard,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  MapPinned,
  PackageCheck,
  RefreshCw,
  Truck,
} from "lucide-react";
import { toast } from "react-hot-toast";

const PROVIDER_LABELS = {
  shiprocket: "Shiprocket",
  xpressbees: "XpressBees",
  eshipz: "Eshipz",
  bluedart: "Blue Dart",
};

const pretty = (value = "") =>
  String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

const firstValue = (...values) =>
  values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
  ) || "";

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getProviderShipment = (shipment = {}) => {
  const provider = String(shipment?.provider || "").toLowerCase();

  if (provider && shipment?.[provider]) {
    return shipment[provider];
  }

  const availableProvider = [
    "shiprocket",
    "xpressbees",
    "eshipz",
    "bluedart",
  ].find((key) => {
    const data = shipment?.[key];

    return Boolean(
      data?.awb ||
        data?.shipmentId ||
        data?.orderId ||
        data?.labelUrl ||
        data?.trackingUrl
    );
  });

  return availableProvider ? shipment[availableProvider] : {};
};

const getShippingDetails = (order = {}) => {
  const shipment = order?.shipment || {};
  const tracking = order?.trackingDetails || {};
  const providerShipment = getProviderShipment(shipment);

  const provider = String(
    firstValue(
      shipment?.provider,
      tracking?.provider,
      providerShipment?.provider
    )
  ).toLowerCase();

  return {
    provider,
    providerLabel:
      PROVIDER_LABELS[provider] ||
      pretty(provider) ||
      "Shipping Provider",

    awb: firstValue(
      shipment?.awb,
      providerShipment?.awb,
      providerShipment?.awbCode,
      tracking?.awb,
      tracking?.trackingId
    ),

    courierName: firstValue(
      shipment?.courierName,
      providerShipment?.courierName,
      tracking?.courierName
    ),

    shipmentId: firstValue(
      shipment?.shipmentId,
      providerShipment?.shipmentId
    ),

    providerOrderId: firstValue(
      shipment?.orderId,
      providerShipment?.orderId
    ),

    trackingUrl: firstValue(
      shipment?.trackingUrl,
      providerShipment?.trackingUrl,
      tracking?.trackingUrl
    ),

    labelUrl: firstValue(
      shipment?.labelUrl,
      providerShipment?.labelUrl
    ),

    invoiceUrl: firstValue(
      shipment?.invoiceUrl,
      providerShipment?.invoiceUrl
    ),

    manifestUrl: firstValue(
      shipment?.manifestUrl,
      providerShipment?.manifestUrl
    ),

    status: firstValue(
      shipment?.status,
      providerShipment?.status,
      order?.fulfillmentStatus
    ),

    rawStatus: firstValue(
      shipment?.rawStatus,
      providerShipment?.rawStatus
    ),

    statusCode: firstValue(
      shipment?.statusCode,
      providerShipment?.statusCode
    ),

    expectedDelivery: firstValue(
      shipment?.expectedDelivery,
      providerShipment?.expectedDelivery
    ),

    pickupScheduledAt: shipment?.pickupScheduledAt || "",

    lastUpdatedAt: firstValue(
      shipment?.lastUpdatedAt,
      shipment?.lastSyncedAt,
      shipment?.lastTrackAt,
      tracking?.lastUpdatedAt
    ),

    bookingError:
      shipment?.booking?.lastError ||
      shipment?.lastError ||
      "",
  };
};

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);

  const copyValue = async () => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      toast.success(`${label} copied`);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      toast.error(`Could not copy ${label}`);
    }
  };

  return (
    <button
      type="button"
      onClick={copyValue}
      disabled={!value}
      title={`Copy ${label}`}
      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
    >
      {copied ? <Check size={15} /> : <Clipboard size={15} />}
    </button>
  );
}

function DetailItem({
  label,
  value,
  copyable = false,
  mono = false,
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <div className="mt-1 flex min-h-6 items-center justify-between gap-2">
        <p
          className={`break-all text-sm font-semibold text-gray-900 ${
            mono ? "font-mono" : ""
          }`}
        >
          {value || "Not available"}
        </p>

        {copyable && value ? (
          <CopyButton value={value} label={label} />
        ) : null}
      </div>
    </div>
  );
}

function ShippingAction({
  href,
  label,
  icon: Icon,
  primary = false,
  onDownload,
  downloading = false,
}) {
  if (!href) return null;

  if (onDownload) {
    return (
      <button
        type="button"
        onClick={onDownload}
        disabled={downloading}
        className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
          primary
            ? "bg-black text-white hover:bg-gray-800"
            : "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
        }`}
      >
        {downloading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Icon size={16} />
        )}

        {downloading ? "Downloading..." : label}
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
        primary
          ? "bg-black text-white hover:bg-gray-800"
          : "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
      }`}
    >
      <Icon size={16} />
      {label}
    </a>
  );
}

export default function OrderShippingDetailsCard({
  order,
  onRefresh,
  refreshing = false,
}) {
  const [downloadingLabel, setDownloadingLabel] = useState(false);

  const details = useMemo(() => getShippingDetails(order), [order]);

  const hasShipment =
    details.awb ||
    details.shipmentId ||
    details.providerOrderId ||
    details.labelUrl ||
    details.trackingUrl;

  const downloadLabel = async () => {
    if (!details.labelUrl) return;

    setDownloadingLabel(true);

    try {
      const response = await fetch(details.labelUrl);

      if (!response.ok) {
        throw new Error("Unable to download label");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      const safeOrderNumber = String(
        order?.orderNumber || "shipping-label"
      ).replace(/[^a-zA-Z0-9-_]/g, "-");

      anchor.href = blobUrl;
      anchor.download = `${safeOrderNumber}-shipping-label.pdf`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(blobUrl);
      toast.success("Shipping label downloaded");
    } catch {
      // Some label servers block cross-origin downloads.
      // Opening the URL still lets the admin print or save it.
      window.open(
        details.labelUrl,
        "_blank",
        "noopener,noreferrer"
      );

      toast("Label opened in a new tab");
    } finally {
      setDownloadingLabel(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
              <Truck size={19} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Shipping Details
              </h2>

              <p className="text-xs text-gray-500">
                AWB, courier, tracking and shipping documents
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {details.provider ? (
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                {details.providerLabel}
              </span>
            ) : null}

            {details.status ? (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {pretty(details.status)}
              </span>
            ) : null}

            {onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={13}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {!hasShipment ? (
        <div className="px-5 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <Box size={21} />
          </div>

          <p className="mt-3 text-sm font-semibold text-gray-800">
            Shipment is not booked yet
          </p>

          <p className="mt-1 text-xs text-gray-500">
            AWB and label information will appear here after courier assignment.
          </p>

          {details.rawStatus ? (
            <p className="mt-3 text-xs font-medium text-blue-600">
              {details.rawStatus}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
            <DetailItem
              label="AWB Number"
              value={details.awb}
              copyable
              mono
            />

            <DetailItem
              label="Courier"
              value={details.courierName}
            />

            <DetailItem
              label="Shipment ID"
              value={details.shipmentId}
              copyable
              mono
            />

            <DetailItem
              label="Provider Order ID"
              value={details.providerOrderId}
              copyable
              mono
            />
          </div>

          {(details.rawStatus ||
            details.expectedDelivery ||
            details.pickupScheduledAt ||
            details.lastUpdatedAt) && (
            <div className="mx-5 mb-5 grid gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-2 xl:grid-cols-4">
              {details.rawStatus ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Shipping Status
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {details.rawStatus}
                  </p>
                </div>
              ) : null}

              {details.expectedDelivery ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Expected Delivery
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {formatDate(details.expectedDelivery) ||
                      details.expectedDelivery}
                  </p>
                </div>
              ) : null}

              {details.pickupScheduledAt ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Pickup Scheduled
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {formatDate(details.pickupScheduledAt)}
                  </p>
                </div>
              ) : null}

              {details.lastUpdatedAt ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Last Updated
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {formatDate(details.lastUpdatedAt)}
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {details.bookingError ? (
            <div className="mx-5 mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-xs font-semibold text-red-700">
                Shipping Error
              </p>
              <p className="mt-1 text-sm text-red-700">
                {details.bookingError}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-4">
            <ShippingAction
              href={details.labelUrl}
              label="Download Label"
              icon={Download}
              primary
              onDownload={downloadLabel}
              downloading={downloadingLabel}
            />

            <ShippingAction
              href={details.trackingUrl}
              label="Track Shipment"
              icon={MapPinned}
            />

            <ShippingAction
              href={details.labelUrl}
              label="Open Label"
              icon={ExternalLink}
            />

            <ShippingAction
              href={details.invoiceUrl}
              label="Invoice"
              icon={FileText}
            />

            <ShippingAction
              href={details.manifestUrl}
              label="Manifest"
              icon={PackageCheck}
            />
          </div>
        </>
      )}
    </div>
  );
}