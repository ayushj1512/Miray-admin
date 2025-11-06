"use client";

import { useState } from "react";
import {
  Package,
  Truck,
  Factory,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function InventoryPage() {
  // 📦 Product-based Inventory Data
  const [inventory, setInventory] = useState([
    { id: 1, name: "Cotton Shirt", quantity: 45, unit: "pcs" },
    { id: 2, name: "Silk Dress", quantity: 20, unit: "pcs" },
    { id: 3, name: "Denim Jacket", quantity: 10, unit: "pcs" },
    { id: 4, name: "Linen Kurta", quantity: 0, unit: "pcs" },
  ]);

  // 🧾 Incoming Orders (product-based)
  const [orders, setOrders] = useState([
    { id: 101, product: "Cotton Shirt", requiredQty: 10, status: "Pending" },
    { id: 102, product: "Silk Dress", requiredQty: 15, status: "Pending" },
    { id: 103, product: "Denim Jacket", requiredQty: 5, status: "Pending" },
    { id: 104, product: "Linen Kurta", requiredQty: 8, status: "Pending" },
  ]);

  // ⚙️ Order Processing Logic (product-level)
  const processOrder = (orderId) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        if (order.id === orderId) {
          const productItem = inventory.find((p) => p.name === order.product);

          if (productItem && productItem.quantity >= order.requiredQty) {
            // ✅ Enough product stock — mark Ready to Ship
            setInventory((prev) =>
              prev.map((inv) =>
                inv.id === productItem.id
                  ? { ...inv, quantity: inv.quantity - order.requiredQty }
                  : inv
              )
            );
            return { ...order, status: "Ready to Ship" };
          } else {
            // 🚫 Not enough — send to Production
            return { ...order, status: "Send to Production" };
          }
        }
        return order;
      })
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10 text-gray-800">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">
        Product Inventory Management
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* 📦 Inventory Section */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-700">
            <Package size={20} />
            Product Stock
          </h2>
          <table className="w-full text-sm border-t border-gray-100">
            <thead>
              <tr className="text-left text-gray-600 border-b border-gray-100">
                <th className="py-2">Product</th>
                <th className="py-2 text-center">Available</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="py-2 font-medium">{item.name}</td>
                  <td
                    className={`py-2 text-center font-medium ${
                      item.quantity > 0
                        ? "text-gray-700"
                        : "text-red-600 font-semibold"
                    }`}
                  >
                    {item.quantity} {item.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🚚 Orders Section */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-700">
            <Truck size={20} />
            Orders
          </h2>

          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-100 rounded-lg p-4 mb-4 hover:shadow-sm transition bg-gray-50"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-800">{order.product}</h3>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    order.status === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : order.status === "Ready to Ship"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-2">
                Requires <strong>{order.requiredQty}</strong> pcs
              </p>

              <button
                onClick={() => processOrder(order.id)}
                disabled={order.status !== "Pending"}
                className={`mt-2 text-sm px-3 py-2 rounded-lg font-medium flex items-center gap-2 transition ${
                  order.status === "Pending"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-100 text-gray-500 cursor-not-allowed"
                }`}
              >
                {order.status === "Pending" ? (
                  <>
                    <CheckCircle size={16} /> Process Order
                  </>
                ) : order.status === "Ready to Ship" ? (
                  <>
                    <Truck size={16} /> Ready
                  </>
                ) : (
                  <>
                    <Factory size={16} /> Production
                  </>
                )}
              </button>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="flex flex-col items-center justify-center text-gray-400 mt-10">
              <AlertCircle size={40} className="mb-2" />
              <p>No orders available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
