// components/orders/OrderStatusDropdown.jsx
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import { useOrderStore } from "@/store/orderStore";
import { useCancelOrderFlow } from "@/hooks/useCancelOrderFlow";
import CancelOrderModal from "@/components/orders/CancelOrderModal";

const STATUS_OPTIONS = [
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "picked", label: "Picked" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "return_requested", label: "Return Requested" },
  { value: "exchange_requested", label: "Exchange Requested" },
  { value: "pickup_initiated", label: "Pickup Initiated" },
  { value: "returned", label: "Returned" },
  { value: "refunded", label: "Refunded" },
  { value: "rto", label: "RTO" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
];

const normalize = (value = "") =>
  String(value || "").trim().toLowerCase();

const isShopifyOrder = (order = {}) =>
  normalize(order?.source) === "shopify" ||
  normalize(order?.attribution?.source) === "shopify" ||
  String(order?.orderNumber || "")
    .trim()
    .toUpperCase()
    .startsWith("SHOP-");

const statusStyle = (status) => {
  const styles = {
    processing:
      "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
    packed:
      "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    picked:
      "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
    shipped:
      "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    out_for_delivery:
      "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
    delivered:
      "bg-green-50 text-green-700 ring-1 ring-green-200",
    return_requested:
      "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
    exchange_requested:
      "bg-pink-50 text-pink-700 ring-1 ring-pink-200",
    pickup_initiated:
      "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    returned:
      "bg-orange-100 text-orange-800 ring-1 ring-orange-200",
    refunded:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    rto:
      "bg-gray-200 text-gray-800 ring-1 ring-gray-300",
    cancelled:
      "bg-red-50 text-red-700 ring-1 ring-red-200",
    failed:
      "bg-rose-100 text-rose-800 ring-1 ring-rose-300",
  };

  return (
    styles[status] ||
    "bg-gray-100 text-gray-700 ring-1 ring-gray-200"
  );
};

export default function OrderStatusDropdown({
  orderId,
  currentStatus,
  order,
  onUpdated,
}) {
  const updateOrderStatus = useOrderStore(
    (state) => state.updateOrderStatus
  );

  const {
    cancelModalOpen,
    cancelTargetOrder,
    cancelLoading,
    openCancelModal,
    closeCancelModal,
    confirmCancel,
  } = useCancelOrderFlow();

  const normalizedPropStatus = useMemo(
    () => normalize(currentStatus || "processing"),
    [currentStatus]
  );

  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(normalizedPropStatus);

  const lastAppliedRef = useRef({
    orderId: null,
    status: null,
  });

  useEffect(() => {
    const orderChanged =
      lastAppliedRef.current.orderId !== orderId;

    if (orderChanged) {
      lastAppliedRef.current = {
        orderId,
        status: normalizedPropStatus,
      };

      setValue(normalizedPropStatus);
      return;
    }

    if (loading || cancelLoading) return;

    if (
      lastAppliedRef.current.status !==
      normalizedPropStatus
    ) {
      lastAppliedRef.current.status =
        normalizedPropStatus;

      setValue(normalizedPropStatus);
    }
  }, [
    orderId,
    normalizedPropStatus,
    loading,
    cancelLoading,
  ]);

  const resetStatus = useCallback(() => {
    lastAppliedRef.current = {
      orderId,
      status: normalizedPropStatus,
    };

    setValue(normalizedPropStatus);
  }, [orderId, normalizedPropStatus]);

  const buildPayload = useCallback((newStatus) => {
    if (newStatus === "refunded") {
      return {
        fulfillmentStatus: "refunded",
        paymentStatus: "refunded",
      };
    }

    if (newStatus === "failed") {
      return {
        fulfillmentStatus: "failed",
        paymentStatus: "failed",
      };
    }

    return {
      fulfillmentStatus: newStatus,
    };
  }, []);

  const handleChange = async (event) => {
    const newStatus = normalize(event.target.value);

    if (!newStatus || newStatus === value) return;

    /*
     * Never use generic updateOrderStatus for cancellation.
     * cancelOrder endpoint must handle Shopify + local cancellation.
     */
    if (newStatus === "cancelled") {
      const modalOrder = order || {
        _id: orderId,
        orderNumber: "",
        source: "",
        fulfillmentStatus: value,
      };

      openCancelModal(modalOrder);
      return;
    }

    setValue(newStatus);
    setLoading(true);

    try {
      const response = await updateOrderStatus(
        orderId,
        buildPayload(newStatus)
      );

      const updatedOrder =
        response?.order || response || null;

      const serverStatus = normalize(
        updatedOrder?.fulfillmentStatus || newStatus
      );

      lastAppliedRef.current = {
        orderId,
        status: serverStatus,
      };

      setValue(serverStatus);
      onUpdated?.(updatedOrder);
    } catch (error) {
      resetStatus();

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update order status"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirm = async (reason = "") => {
    try {
      /*
       * First argument remains reason for backward compatibility.
       * Second argument gives the hook Shopify cancellation context.
       */
      const response = await confirmCancel(reason, {
        orderId,
        orderNumber: order?.orderNumber || "",
        source: isShopifyOrder(order)
          ? "shopify"
          : order?.source || "website",
        isShopifyOrder: isShopifyOrder(order),
        notifyCustomer: true,
      });

      if (response?.success === false) {
        throw new Error(
          response?.message || "Failed to cancel order"
        );
      }

      const updatedOrder =
        response?.order || response || null;

      const serverStatus = normalize(
        updatedOrder?.fulfillmentStatus
      );

      if (serverStatus && serverStatus !== "cancelled") {
        throw new Error(
          response?.message ||
            "Order cancellation was not completed"
        );
      }

      lastAppliedRef.current = {
        orderId,
        status: "cancelled",
      };

      setValue("cancelled");
      onUpdated?.(updatedOrder);
    } catch (error) {
      resetStatus();

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to cancel order"
      );
    }
  };

  const busy = loading || cancelLoading;

  return (
    <>
      <div className="relative inline-flex items-center">
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(
            value
          )}`}
        >
          {String(value || "").replace(/_/g, " ")}

          {busy ? (
            <Loader2
              size={14}
              className="animate-spin"
            />
          ) : (
            <ChevronDown
              size={14}
              className="opacity-60"
            />
          )}
        </div>

        <select
          value={value}
          disabled={busy}
          onChange={handleChange}
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          aria-label="Update order status"
        >
          {STATUS_OPTIONS.map((status) => (
            <option
              key={status.value}
              value={status.value}
            >
              {status.label}
            </option>
          ))}
        </select>
      </div>

      <CancelOrderModal
        open={cancelModalOpen}
        order={cancelTargetOrder}
        loading={cancelLoading}
        onClose={closeCancelModal}
        onConfirm={handleCancelConfirm}
      />
    </>
  );
}