"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ArrowRight,
  Search,
  Filter,
  ChevronDown,
  Download,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function OrdersListPage() {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔍 Filters
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [status, setStatus] = useState("");

  // ------------------------------------
  // LOAD ORDERS WITH FILTERS
  // ------------------------------------
  const loadOrders = async () => {
    try {
      let url = `${API}/api/orders?`;

      if (search) url += `customerName=${encodeURIComponent(search)}&`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      if (minAmount) url += `minAmount=${minAmount}&`;
      if (maxAmount) url += `maxAmount=${maxAmount}&`;
      if (paymentMethod) url += `paymentMethod=${paymentMethod}&`;
      if (status) url += `fulfillmentStatus=${status}&`;

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      setOrders(data);
      setLoading(false);
    } catch (err) {
      console.log("Orders Fetch Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, startDate, endDate, minAmount, maxAmount, paymentMethod, status]);

  const filteredOrders = orders;

  // ------------------------------------
  // CSV HELPER
  // ------------------------------------
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    // Escape double quotes by replacing " with ""
    const escaped = str.replace(/"/g, '""');
    // Wrap in quotes to be safe with commas/newlines
    return `"${escaped}"`;
  };

  // ------------------------------------
  // EXPORT CURRENT VIEW TO CSV
  // ------------------------------------
  const exportToCSV = () => {
    if (!filteredOrders || filteredOrders.length === 0) {
      alert("No orders to export for the current filters.");
      return;
    }

    const headers = [
      "Order #",
      "Customer Name",
      "Customer Phone",
      "Products", // ✅ Product details column
      "Payment Method",
      "Fulfillment Status",
      "Amount",
      "Date",
    ];

    const rows = filteredOrders.map((order) => {
      const customerName = order?.customerId?.name || "Unknown";
      const customerPhone = order?.customerId?.phone || "";
      const payment = order?.paymentMethod || "";
      const fulfillment = order?.fulfillmentStatus
        ? order.fulfillmentStatus.replace(/_/g, " ")
        : "";
      const amount = order?.finalPayable ?? "";
      const date = order?.createdAt
        ? new Date(order.createdAt).toLocaleDateString()
        : "";

      // 🔹 PRODUCT DETAILS (per order)
      // Expected shape: order.items = [ { productName/title/name, sku, quantity/qty, ... } ]
      // Future: warehouse info add karna ho to yahin per warehouseName bhi include kar sakte hain.
      const productDetails = Array.isArray(order?.items)
        ? order.items
            .map((item) => {
              const name =
                item.productName ||
                item.title ||
                item.name ||
                item.product?.title ||
                "Unknown Product";

              const sku =
                item.sku ||
                item.productSku ||
                item.product?.sku ||
                "";

              const qty =
                item.quantity !== undefined
                  ? item.quantity
                  : item.qty !== undefined
                  ? item.qty
                  : 0;

              // If later you add warehouse:
              // const warehouse =
              //   item.warehouseName || item.warehouse?.name || "";

              const parts = [name];

              if (sku) parts.push(`SKU: ${sku}`);
              parts.push(`Qty: ${qty}`);

              // If warehouse is added later:
              // if (warehouse) parts.push(`WH: ${warehouse}`);

              return parts.join(" | ");
            })
            .join(" || ")
        : "";

      return [
        escapeCSV(order.orderNumber),
        escapeCSV(customerName),
        escapeCSV(customerPhone),
        escapeCSV(productDetails),
        escapeCSV(payment),
        escapeCSV(fulfillment),
        escapeCSV(amount),
        escapeCSV(date),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-");
    link.href = url;
    link.setAttribute("download", `orders-${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* =======================================
              PAGE HEADER & SEARCH BAR
        ======================================== */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">All Orders</h1>
            <p className="text-gray-500 mt-1">
              View, filter and manage all customer orders.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full md:w-auto">
            {/* Search Input */}
            <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm w-full md:w-80">
              <Search size={20} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search customer or order..."
                className="outline-none w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2 rounded-xl bg-black text-white text-sm font-medium shadow-sm hover:bg-gray-900 transition"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* =======================================
              ADVANCED FILTERS
        ======================================== */}
        <div className="bg-white p-5 rounded-xl shadow grid md:grid-cols-4 gap-5 border">
          {/* Date Range */}
          <div>
            <label className="text-sm font-semibold">Start Date</label>
            <input
              type="date"
              className="w-full mt-1 p-2 rounded-lg bg-gray-100"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold">End Date</label>
            <input
              type="date"
              className="w-full mt-1 p-2 rounded-lg bg-gray-100"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Amount Range */}
          <div>
            <label className="text-sm font-semibold">Min Amount</label>
            <input
              type="number"
              className="w-full mt-1 p-2 rounded-lg bg-gray-100"
              placeholder="₹0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Max Amount</label>
            <input
              type="number"
              className="w-full mt-1 p-2 rounded-lg bg-gray-100"
              placeholder="₹5000"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-sm font-semibold">Payment Method</label>
            <select
              className="w-full mt-1 p-2 rounded-lg bg-gray-100"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="">All</option>
              <option value="cod">Cash on Delivery</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="wallet">Wallet</option>
              <option value="netbanking">Netbanking</option>
            </select>
          </div>

          {/* Fulfillment Buttons */}
          <div className="md:col-span-4 flex gap-3 overflow-x-auto pt-3">
            {[
              { key: "", label: "All" },
              { key: "processing", label: "Processing" },
              { key: "packed", label: "Packed" },
              { key: "shipped", label: "Shipped" },
              { key: "out_for_delivery", label: "Out for Delivery" },
              { key: "delivered", label: "Delivered" },
              { key: "returned", label: "Returned" },
              { key: "cancelled", label: "Cancelled" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setStatus(s.key)}
                className={`px-4 py-2 rounded-lg border text-sm ${
                  status === s.key
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* =======================================
                ORDERS TABLE
        ======================================== */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-gray-600">
              <tr>
                <th className="py-3 px-4 text-left">Order #</th>
                <th className="py-3 px-4 text-left">Customer</th>
                <th className="py-3 px-4 text-left">Payment</th>
                <th className="py-3 px-4 text-left">Fulfillment</th>
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
                      {order.paymentMethod}
                    </td>

                    <td className="py-3 px-4 capitalize">
                      {order.fulfillmentStatus?.replace(/_/g, " ")}
                    </td>

                    <td className="py-3 px-4 font-semibold">
                      ₹{order.finalPayable}
                    </td>

                    <td className="py-3 px-4">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : ""}
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
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    No orders found for applied filters.
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
