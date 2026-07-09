"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import adminShopifyStore from "@/store/adminshopifystore";

const getCustomerName = (order) =>
  order?.customer?.displayName ||
  `${order?.customer?.firstName || ""} ${order?.customer?.lastName || ""}`.trim() ||
  "Guest";

const getAmount = (order) =>
  Number(
    order?.currentTotalPriceSet?.shopMoney?.amount ||
      order?.totalPriceSet?.shopMoney?.amount ||
      0
  );

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const getLineItems = (order) => order?.lineItems?.edges || [];
const getSkuCode = (sku = "") => String(sku).split("-")?.[1] || "";

export default function UnfulfilledOrderRow({ order, onDone }) {
  const { manualFulfillOrder, fulfillmentLoading } = adminShopifyStore();

  const [open, setOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierName, setCourierName] = useState("DTDC Surface");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  const orderNumber = order?.localOrderNumber || order?.orderNumber || order?.name;

  const handleFulfill = async () => {
    if (!trackingNumber.trim()) return toast.error("AWB / Tracking number required");
    if (!courierName.trim()) return toast.error("Courier name required");

    const res = await manualFulfillOrder({
      orderNumber,
      trackingNumber,
      courierName,
      trackingUrl,
      notifyCustomer,
    });

    if (!res?.success) return toast.error(res?.message || "Fulfillment failed");

    toast.success("Order fulfilled on Shopify");
    setOpen(false);
    onDone?.();
  };

  return (
    <>
      <tr className="border-t border-gray-100 align-top hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="font-semibold">{order.name}</div>
          <div className="mt-1 text-xs text-gray-500">
            {getLineItems(order).length} product(s)
          </div>
        </td>

        <td className="px-4 py-3">
          <div className="font-medium">{getCustomerName(order)}</div>
          <div className="text-xs text-gray-500">
            {order?.customer?.email || order?.email || "-"}
          </div>
          <div className="text-xs text-gray-500">
            {order?.shippingAddress?.phone || order?.customer?.phone || "-"}
          </div>
        </td>

        <td className="max-w-[430px] px-4 py-3">
          <div className="flex flex-col gap-2">
            {getLineItems(order).map(({ node }, index) => {
              const sku = node?.sku || node?.variant?.sku || "";
              const image =
                node?.variant?.image?.url ||
                node?.variant?.product?.featuredMedia?.preview?.image?.url ||
                "";

              return (
                <div
                  key={`${order.id}-${sku}-${index}`}
                  className="flex gap-3 rounded-xl border border-gray-100 bg-white p-2"
                >
                  {image ? (
                    <img
                      src={image}
                      alt={node.title}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-lg bg-gray-100 text-[10px] text-gray-400">
                      No Img
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="line-clamp-1 font-medium">{node.title}</div>
                    <div className="mt-0.5 text-[11px] text-gray-500">
                      {sku || "No SKU"} • Code: {getSkuCode(sku)} • Qty:{" "}
                      {node.quantity || 0}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </td>

        <td className="px-4 py-3">
          <Badge>{order.displayFinancialStatus || "-"}</Badge>
        </td>

        <td className="px-4 py-3">
          <Badge dark>{order.displayFulfillmentStatus || "-"}</Badge>
        </td>

        <td className="px-4 py-3 text-right font-semibold">
          {money(getAmount(order))}
        </td>

        <td className="px-4 py-3">{order?.shippingAddress?.city || "-"}</td>

        <td className="px-4 py-3 text-xs text-gray-500">
          {order.createdAt
            ? new Date(order.createdAt).toLocaleString("en-IN")
            : "-"}
        </td>

        <td className="px-4 py-3 text-right">
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
          >
            Fulfill
          </button>
        </td>
      </tr>

      {open ? (
        <tr>
          <td colSpan="9" className="border-t border-gray-100 bg-gray-50 px-4 py-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Fulfill {order.name}</h3>
                  <p className="text-xs text-gray-500">
                    Add AWB and courier details to mark this Shopify order fulfilled.
                  </p>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border px-3 py-1 text-xs"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="AWB / Tracking number"
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none"
                />

                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none"
                >
                  <option>DTDC Surface</option>
                  <option>Delhivery</option>
                  <option>Amazon COD Surface 500gm</option>
                  <option>Blue Dart</option>
                  <option>Shiprocket</option>
                  <option>India Post</option>
                  <option>Other</option>
                </select>

                <input
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="Tracking URL optional"
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none"
                />

                <button
                  onClick={handleFulfill}
                  disabled={fulfillmentLoading}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {fulfillmentLoading ? "Fulfilling..." : "Mark Fulfilled"}
                </button>
              </div>

              <label className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                />
                Notify customer from Shopify
              </label>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function Badge({ children, dark = false }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        dark ? "bg-black text-white" : "bg-gray-100 text-gray-700"
      }`}
    >
      {children}
    </span>
  );
}
