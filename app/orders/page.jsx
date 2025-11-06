"use client";

import { useEffect, useState } from "react";
import api from "../../lib/woocommerce";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      console.log("🟦 [WooCommerce] Fetching orders...");
      console.log("➡️ Store URL:", process.env.NEXT_PUBLIC_WC_STORE_URL);
      console.log("➡️ Consumer Key present:", !!process.env.WC_CONSUMER_KEY);
      console.log("➡️ Consumer Secret present:", !!process.env.WC_CONSUMER_SECRET);

      try {
        const response = await api.get("orders", { params: { per_page: 10 } });

        console.log("✅ [WooCommerce] API Response received:");
        console.log("Status:", response.status);
        console.log("Headers:", response.headers);
        console.log("Data:", response.data);

        setOrders(response.data);
      } catch (error) {
        console.error("❌ [WooCommerce] Error fetching orders!");
        if (error.response) {
          console.error("Status:", error.response.status);
          console.error("Data:", error.response.data);
          console.error("Headers:", error.response.headers);
        } else {
          console.error("Message:", error.message);
        }
      } finally {
        console.log("🟢 [WooCommerce] Fetching complete.");
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-600 text-lg">
        Loading orders... (check console logs)
      </div>
    );

  if (orders.length === 0)
    return (
      <div className="p-10 text-center text-gray-500 text-lg">
        No orders found. Check console logs for details.
      </div>
    );

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Recent Orders (Debug Enabled)
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border border-gray-200 bg-white rounded-xl shadow-sm hover:shadow-md transition p-6"
          >
            <p className="font-semibold text-blue-700 mb-2">
              Order #{order.id}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              Status:{" "}
              <span className="font-medium capitalize text-gray-800">
                {order.status}
              </span>
            </p>
            <p className="text-sm text-gray-600 mb-1">
              Customer: {order.billing.first_name} {order.billing.last_name}
            </p>
            <p className="text-sm text-gray-600 mb-3">
              Total:{" "}
              <span className="font-semibold text-green-600">
                ₹{parseFloat(order.total).toFixed(2)}
              </span>
            </p>
            <button className="mt-2 text-sm font-medium text-blue-600 hover:underline">
              View Details →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
