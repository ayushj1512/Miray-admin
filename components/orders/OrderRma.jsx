"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Undo2,
  RefreshCcw,
  Package,
  Calendar,
  User,
  Phone,
  MapPin,
  BadgeIndianRupee,
  ImageIcon,
} from "lucide-react";
import { useRmaStore } from "@/store/useRmaStore";

const small = (v) => (v === null || v === undefined || v === "" ? "-" : v);

const norm = (v) => String(v || "").trim().toLowerCase();

const getAttr = (attrs = [], keys = []) =>
  attrs.find((a) => keys.includes(norm(a?.key)))?.value || "";

const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString("en-IN");
};

const badgeStyle = (status) => {
  const s = norm(status);
  if (s === "requested") return "bg-blue-50 text-blue-700 ring-blue-100";
  if (s === "approved") return "bg-green-50 text-green-700 ring-green-100";
  if (s === "rejected") return "bg-red-50 text-red-700 ring-red-100";
  if (s === "closed") return "bg-gray-900 text-white ring-gray-900";
  return "bg-gray-100 text-gray-700 ring-gray-200";
};

const InfoCard = ({ title, icon, children }) => (
  <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100">
    <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {icon}
      {title}
    </p>
    <div className="space-y-1.5 text-xs text-gray-700">{children}</div>
  </div>
);

export default function OrderRmaDetailsFull({
  orderId,
  order,
  showIfNone = false,
  rmaPanelHref = "/rma",
}) {
  const { rmas, fetchAllRmas, loading } = useRmaStore();
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (!Array.isArray(rmas) || rmas.length === 0) fetchAllRmas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rma = useMemo(() => {
    if (!orderId || !Array.isArray(rmas)) return null;

    return (
      rmas
        .filter((x) => String(x?.orderId) === String(orderId))
        .sort(
          (a, b) =>
            new Date(b?.createdAt || 0).getTime() -
            new Date(a?.createdAt || 0).getTime()
        )[0] || null
    );
  }, [rmas, orderId]);

  if (loading) return null;

  if (!rma) {
    if (!showIfNone) return null;

    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-600">No RMA raised for this order.</p>
      </div>
    );
  }

  const shipping = order?.shippingAddressSnapshot || {};
  const customerName =
    shipping?.fullName || order?.customerId?.name || rma?.customer?.name || "-";

  const customerPhone =
    shipping?.phone || order?.customerId?.phone || rma?.customer?.phone || "-";

  const exchangeAttrs = rma?.exchangeRequest?.attributes || [];
  const requestedSize = getAttr(exchangeAttrs, ["size", "sizes"]);
  const requestedColor = getAttr(exchangeAttrs, ["color", "colour"]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <Undo2 size={18} /> RMA Details
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Submitted return/exchange details for this order.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ${badgeStyle(
              rma?.status
            )}`}
          >
            {small(rma?.status)}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAllRmas()}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-gray-50"
            >
              <RefreshCcw size={14} /> Refresh
            </button>

            <Link
              href={rmaPanelHref}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              RMA Panel →
            </Link>
          </div>
        </div>
      </div>

      <div className="px-5 py-3">
        <button
          onClick={() => setExpanded((p) => !p)}
          className="text-xs font-semibold text-gray-700 hover:text-black"
        >
          {expanded ? "Hide details" : "Show details"}
        </button>
      </div>

      {expanded && (
        <div className="space-y-5 px-5 pb-6">
          <div className="grid gap-4 md:grid-cols-3">
            <InfoCard title="RMA" icon={<Package size={14} />}>
              <p>
                <b>RMA #:</b> {small(rma?.rmaNumber)}
              </p>
              <p>
                <b>Type:</b> {small(rma?.type)}
              </p>
              <p>
                <b>Reason:</b> {small(rma?.reason)}
              </p>
              <p>
                <b>Note:</b> {small(rma?.customerNote)}
              </p>
            </InfoCard>

            <InfoCard title="Customer" icon={<User size={14} />}>
              <p className="font-medium text-gray-900">{small(customerName)}</p>
              <p className="flex items-center gap-2">
                <Phone size={13} /> {small(customerPhone)}
              </p>
              <p>
                <b>Email:</b> {small(shipping?.email || rma?.customer?.email)}
              </p>
            </InfoCard>

            <InfoCard title="Timeline & Fee" icon={<Calendar size={14} />}>
              <p>
                <b>Created:</b> {formatDate(rma?.createdAt)}
              </p>
              <p>
                <b>Updated:</b> {formatDate(rma?.updatedAt)}
              </p>
              <p className="flex items-center gap-1">
                <BadgeIndianRupee size={13} />
                {Number(rma?.fee?.amount || 0) > 0
                  ? `₹${rma.fee.amount} (${small(rma.fee.status)})`
                  : "No extra fee"}
              </p>
            </InfoCard>
          </div>

          {rma?.type === "exchange" && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">
                Exchange Requested
              </p>

              <div className="mt-3 grid gap-3 text-xs text-blue-800 md:grid-cols-3">
                <p>
                  <b>Requested Size:</b>{" "}
                  {requestedSize ? String(requestedSize).toUpperCase() : "-"}
                </p>
                <p>
                  <b>Requested Color:</b> {small(requestedColor)}
                </p>
                <p>
                  <b>New SKU:</b> {small(rma?.exchangeRequest?.variantSku)}
                </p>
              </div>

              {rma?.exchangeRequest?.note && (
                <p className="mt-2 text-xs text-blue-700">
                  <b>Note:</b> {rma.exchangeRequest.note}
                </p>
              )}
            </div>
          )}

          <div className="rounded-xl bg-white p-4 ring-1 ring-gray-100">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Package size={16} /> RMA Items
            </p>

            {!Array.isArray(rma?.items) || rma.items.length === 0 ? (
              <p className="text-xs text-gray-500">No RMA items attached.</p>
            ) : (
              <div className="space-y-3">
                {rma.items.map((it, idx) => {
                  const original = it?.orderItem || {};
                  const attrs = original?.variant?.attributes || [];

                  const orderedSize =
                    original?.selectedSize ||
                    getAttr(attrs, ["size", "sizes"]) ||
                    it?.selectedSize ||
                    "";

                  const orderedColor =
                    original?.selectedColor ||
                    getAttr(attrs, ["color", "colour"]) ||
                    it?.selectedColor ||
                    "";

                  const image =
                    original?.productSnapshot?.thumbnail ||
                    original?.productSnapshot?.images?.[0] ||
                    "";

                  return (
                    <div
                      key={`${rma?.rmaNumber || "rma"}-item-${idx}`}
                      className="flex gap-3 rounded-xl bg-gray-50 p-3"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={it?.title || "RMA item"}
                          className="h-20 w-16 rounded-lg object-cover"
                        />
                      ) : null}

                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">
                          {small(it?.title || original?.productSnapshot?.title)}
                        </p>

                        <div className="mt-2 grid gap-1 text-xs text-gray-600 sm:grid-cols-2">
                          <p>
                            <b>RMA Qty:</b> {small(it?.quantity || 1)}
                          </p>
                          <p>
                            <b>Original SKU:</b> {small(it?.variantSku)}
                          </p>
                          <p>
                            <b>Ordered Size:</b>{" "}
                            {orderedSize ? String(orderedSize).toUpperCase() : "-"}
                          </p>
                          <p>
                            <b>Ordered Color:</b> {small(orderedColor)}
                          </p>

                          {rma?.type === "exchange" && (
                            <>
                              <p className="font-semibold text-blue-700">
                                <b>Exchange Size:</b>{" "}
                                {requestedSize
                                  ? String(requestedSize).toUpperCase()
                                  : "-"}
                              </p>
                              <p className="font-semibold text-blue-700">
                                <b>Exchange SKU:</b>{" "}
                                {small(rma?.exchangeRequest?.variantSku)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-4 ring-1 ring-gray-100">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <MapPin size={16} /> Shipping Snapshot
            </p>

            <div className="grid gap-2 text-xs text-gray-700 md:grid-cols-2">
              <p>
                <b>Name:</b> {small(shipping?.fullName)}
              </p>
              <p>
                <b>Phone:</b> {small(shipping?.phone)}
              </p>
              <p>
                <b>Address:</b>{" "}
                {[shipping?.line1, shipping?.line2].filter(Boolean).join(", ") ||
                  "-"}
              </p>
              <p>
                <b>City/State:</b>{" "}
                {[shipping?.city, shipping?.state].filter(Boolean).join(", ") ||
                  "-"}
              </p>
              <p>
                <b>Pincode:</b> {small(shipping?.pincode)}
              </p>
              <p>
                <b>Country:</b> {small(shipping?.country)}
              </p>
            </div>
          </div>

          {(rma?.reverseShipment?.awb ||
            rma?.reverseShipment?.courierName ||
            rma?.reverseShipment?.trackingUrl) && (
            <div className="rounded-xl bg-white p-4 ring-1 ring-gray-100">
              <p className="mb-3 text-sm font-semibold text-gray-900">
                Pickup / Reverse Shipment
              </p>

              <div className="grid gap-2 text-xs text-gray-700 md:grid-cols-3">
                <p>
                  <b>AWB:</b> {small(rma?.reverseShipment?.awb)}
                </p>
                <p>
                  <b>Courier:</b> {small(rma?.reverseShipment?.courierName)}
                </p>
                <p>
                  <b>Tracking:</b>{" "}
                  {rma?.reverseShipment?.trackingUrl ? (
                    <a
                      href={rma.reverseShipment.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 underline"
                    >
                      Open
                    </a>
                  ) : (
                    "-"
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-white p-4 ring-1 ring-gray-100">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <ImageIcon size={16} /> Customer Proof Images
            </p>

            {!Array.isArray(rma?.images) || rma.images.length === 0 ? (
              <p className="text-xs text-gray-500">No images uploaded.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {rma.images.map((img, idx) => (
                  <a
                    href={img}
                    target="_blank"
                    rel="noreferrer"
                    key={`${rma?.rmaNumber || "rma"}-img-${idx}`}
                    className="overflow-hidden rounded-xl border border-gray-100"
                  >
                    <img
                      src={img}
                      alt="RMA proof"
                      className="h-28 w-full object-cover transition hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>

          {(rma?.qcResult || rma?.adminNote || rma?.adminRemarks) && (
            <div className="rounded-xl bg-white p-4 ring-1 ring-gray-100">
              <p className="mb-3 text-sm font-semibold text-gray-900">
                Internal Notes
              </p>

              <div className="space-y-2 text-xs text-gray-700">
                {rma?.qcResult && (
                  <p>
                    <b>QC Result:</b> {rma.qcResult}
                  </p>
                )}
                {rma?.adminNote && (
                  <p>
                    <b>Admin Note:</b> {rma.adminNote}
                  </p>
                )}
                {rma?.adminRemarks && (
                  <p>
                    <b>Admin Remarks:</b> {rma.adminRemarks}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
