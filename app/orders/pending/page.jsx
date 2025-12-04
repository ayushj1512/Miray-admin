"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ArrowRight,
  Search
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function PendingOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadOrders = async () => {
    try {
      const res = await fetch(`${API}/api/orders?fulfillmentStatus=processing`, {
        cache: "no-store",
      });

      const data = await res.json();
      setOrders(data);
      setLoading(false);
    } catch (err) {
      console.log("Pending Orders Fetch Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((o) =>
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.customerId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );

  return (
    <section className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Pending Orders</h1>
            <p className="text-gray-500 mt-1">
              Orders waiting for confirmation or packing
            </p>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm w-full md:w-80">
            <Search size={20} className="text-gray-400" />
            <input
              placeholder="Search orders..."
              className="outline-none w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-gray-600">
              <tr>
                <th className="py-3 px-4 text-left">Order #</th>
                <th className="py-3 px-4 text-left">Customer</th>
                <th className="py-3 px-4 text-left">Payment</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Amount</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="py-3 px-4 font-semibold">
                      {order.orderNumber}
                    </td>

                    <td className="py-3 px-4">
                      {order.customerId?.name || "Unknown"}
                      <div className="text-xs text-gray-500">
                        {order.customerId?.phone}
                      </div>
                    </td>

                    <td className="py-3 px-4 capitalize">
                      {order.paymentStatus}
                    </td>

                    <td className="py-3 px-4 capitalize text-yellow-600 font-semibold">
                      {order.fulfillmentStatus.replace(/_/g, " ")}
                    </td>

                    <td className="py-3 px-4 font-semibold">
                      ₹{order.finalPayable}
                    </td>

                    <td className="py-3 px-4">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => router.push(`/orders/${order._id}`)}
                        className="text-blue-600 flex items-center gap-1 hover:underline"
                      >
                        View <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="py-10 text-center text-gray-500"
                  >
                    No pending orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
