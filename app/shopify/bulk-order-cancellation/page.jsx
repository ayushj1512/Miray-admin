"use client";

import { useState } from "react";
import BulkOrderCancellation from "@/components/orders/BulkOrderCancellation";
import { useOrderStore } from "@/store/orderStore";

export default function ShopifyBulkOrderCancellationPage() {
  const [message, setMessage] = useState("");

  const {
    bulkLookupOrders,
    bulkCancelOrders,
    bulkCancellationLoading,
  } = useOrderStore();

  const handleLookup = async (orderNumbers) => {
    try {
      setMessage("");

      return await bulkLookupOrders(
        orderNumbers,
        "shopify"
      );
    } catch (error) {
      setMessage(
        error?.message ||
          "Failed to verify Shopify orders."
      );

      throw error;
    }
  };

  const handleConfirm = async ({
    orderIds,
    reason,
  }) => {
    try {
      setMessage("");

      const response = await bulkCancelOrders(
        orderIds,
        {
          reason,
          cancelledBy: "admin",
          sendEmail: true,
        }
      );

      const summary = response?.summary || {};

      setMessage(
        `${Number(summary.cancelled || 0)} cancelled, ${Number(
          summary.alreadyCancelled || 0
        )} already cancelled, ${Number(
          summary.failed || 0
        )} failed.`
      );

      return response;
    } catch (error) {
      setMessage(
        error?.message ||
          "Bulk cancellation failed."
      );

      throw error;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        {message && (
          <div className="mb-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
            {message}
          </div>
        )}

        <BulkOrderCancellation
          source="shopify"
          loading={bulkCancellationLoading}
          onLookup={handleLookup}
          onConfirm={handleConfirm}
          title="Shopify Bulk Order Cancellation"
          description="Upload or paste Shopify order numbers. Values such as 12, #2513 or SHOP-2513 will normalize automatically and verify directly from the backend."
        />
      </div>
    </main>
  );
}