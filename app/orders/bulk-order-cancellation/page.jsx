"use client";

import { useState } from "react";
import BulkOrderCancellation from "@/components/orders/BulkOrderCancellation";
import { useOrderStore } from "@/store/orderStore";

export default function WebsiteBulkOrderCancellationPage() {
  const [message, setMessage] = useState("");

  const {
    orders,
    loading,
    bulkCancellationLoading,
    fetchAllOrdersAllPages,
    bulkCancelOrders,
  } = useOrderStore();

  const handleFetchOrders = async () => {
    setMessage("");

    const fetchedOrders = await fetchAllOrdersAllPages({
      limit: 200,
    });

    setMessage(`${fetchedOrders.length} website orders loaded.`);
  };

  const handleConfirm = async ({ orderIds, reason }) => {
    setMessage("");

    const response = await bulkCancelOrders(orderIds, {
      reason,
      cancelledBy: "admin",
      sendEmail: true,
    });

    const summary = response?.summary || {};

    setMessage(
      `${Number(summary.cancelled || 0)} cancelled, ${Number(
        summary.alreadyCancelled || 0
      )} already cancelled, ${Number(summary.failed || 0)} failed.`
    );

    return response;
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
          source="website"
          orders={orders}
          fetching={loading}
          loading={bulkCancellationLoading}
          onFetchOrders={handleFetchOrders}
          onConfirm={handleConfirm}
          title="Website Bulk Order Cancellation"
          description="Upload or paste Miray website order numbers. Values such as 12, 2513 or MIRAY-2513 will normalize to MIRAY-000012 and MIRAY-002513."
        />
      </div>
    </main>
  );
}