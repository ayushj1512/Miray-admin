"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Package,
  User,
  Receipt,
  FileText,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function OrderDetailsClient({ id }) {
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const [trackingId, setTrackingId] = useState("");
  const [courierName, setCourierName] = useState("");

  const [remarks, setRemarks] = useState("");
  const [remarksSaving, setRemarksSaving] = useState(false);

  const loadOrder = async () => {
    try {
      const res = await fetch(`${API}/api/orders/${id}`, {
        cache: "no-store"
      });

      const data = await res.json();

      setOrder(data);
      setNewStatus(data.fulfillmentStatus);
      setTrackingId(data.trackingDetails?.trackingId || "");
      setCourierName(data.trackingDetails?.courierName || "");
      setRemarks(data.adminRemarks || "");
      setLoading(false);

    } catch (err) {
      console.log("Error fetching order:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, []);

  // ------------------------------
  // UPDATE ORDER STATUS
  // ------------------------------
  const updateStatus = async () => {
    setStatusUpdating(true);

    await fetch(`${API}/api/orders/${order._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fulfillmentStatus: newStatus }),
    });

    setStatusUpdating(false);
    loadOrder();
  };

  // ------------------------------
  // UPDATE TRACKING
  // ------------------------------
  const updateTracking = async () => {
    await fetch(`${API}/api/orders/${order._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingDetails: { trackingId, courierName },
      }),
    });

    alert("Tracking updated!");
    loadOrder();
  };

  // ------------------------------
  // UPDATE REMARKS
  // ------------------------------
  const updateRemarks = async () => {
    setRemarksSaving(true);

    await fetch(`${API}/api/orders/${order._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminRemarks: remarks }),
    });

    setRemarksSaving(false);
    alert("Remarks updated!");
  };

  if (loading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin" size={34} />
      </div>
    );

  if (!order)
    return <p className="p-10 text-red-500">Order not found</p>;

  return (
    <section className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* BACK */}
        <button
          onClick={() => router.push("/orders/all")}
          className="flex items-center gap-2 text-gray-600 hover:text-black"
        >
          <ArrowLeft size={20} /> Back to Orders
        </button>

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">
            Order #{order.orderNumber}
          </h1>

          <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 capitalize">
            {order.fulfillmentStatus.replace(/_/g, " ")}
          </span>
        </div>

        {/* CUSTOMER */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <User size={20} /> Customer
          </h2>

          <p className="font-semibold text-lg">
            {order.customerId?.name}
          </p>

          <p className="flex items-center gap-2 text-gray-600">
            <Phone size={16} /> {order.customerId?.phone}
          </p>

          <p className="flex items-center gap-2 text-gray-600">
            <Mail size={16} /> {order.customerId?.email}
          </p>
        </div>

        {/* ADDRESSES */}
        <div className="grid md:grid-cols-2 gap-8 bg-white p-6 rounded-xl shadow">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
              <MapPin size={20} /> Shipping Address
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p>{order.shippingAddressSnapshot.fullName}</p>
              <p>{order.shippingAddressSnapshot.line1}</p>
              <p>{order.shippingAddressSnapshot.line2}</p>
              <p>
                {order.shippingAddressSnapshot.city},{" "}
                {order.shippingAddressSnapshot.state} -{" "}
                {order.shippingAddressSnapshot.pincode}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
              <Receipt size={20} /> Billing Address
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p>{order.billingAddressSnapshot.fullName}</p>
              <p>{order.billingAddressSnapshot.line1}</p>
              <p>{order.billingAddressSnapshot.line2}</p>
              <p>
                {order.billingAddressSnapshot.city},{" "}
                {order.billingAddressSnapshot.state} -{" "}
                {order.billingAddressSnapshot.pincode}
              </p>
            </div>
          </div>
        </div>

        {/* ITEMS */}
        <div className="bg-white p-6 rounded-xl shadow space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Package size={20} /> Order Items
          </h2>

          {order.items.map((item, index) => (
            <div key={index} className="border-b pb-4">
              <p className="font-semibold">{item.name}</p>
              <p className="text-gray-600">Qty: {item.quantity}</p>
              <p className="text-gray-600">Price: ₹{item.price}</p>
              <p className="font-semibold">Subtotal: ₹{item.subtotal}</p>
            </div>
          ))}
        </div>

        {/* PRICING */}
        <div className="bg-white p-6 rounded-xl shadow space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText size={20} /> Pricing Summary
          </h2>

          <p>Subtotal: ₹{order.subtotal}</p>
          <p>Discount: ₹{order.discount}</p>
          <p>Shipping Fee: ₹{order.shippingFee}</p>
          <p>Tax: ₹{order.tax}</p>

          <p className="text-xl font-bold mt-2">
            Total: ₹{order.finalPayable}
          </p>
        </div>

        {/* STATUS */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold">Update Order Status</h2>

          <div className="flex gap-4 items-center">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="p-3 bg-gray-100 rounded-xl"
            >
              <option value="processing">Processing</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="returned">Returned</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              onClick={updateStatus}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl"
            >
              {statusUpdating ? "Updating..." : "Update"}
            </button>
          </div>
        </div>

        {/* TRACKING */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold">Tracking</h2>

          <input
            className="p-3 bg-gray-100 rounded-xl w-full"
            placeholder="Tracking ID"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
          />

          <input
            className="p-3 bg-gray-100 rounded-xl w-full"
            placeholder="Courier Name"
            value={courierName}
            onChange={(e) => setCourierName(e.target.value)}
          />

          <button
            onClick={updateTracking}
            className="px-5 py-3 bg-green-600 text-white rounded-xl"
          >
            Save Tracking
          </button>
        </div>

        {/* REMARKS */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold">Admin Remarks</h2>

          <textarea
            className="p-3 bg-gray-100 rounded-xl w-full h-32"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <button
            onClick={updateRemarks}
            className="px-5 py-3 bg-purple-600 text-white rounded-xl"
          >
            {remarksSaving ? "Saving..." : "Save Remarks"}
          </button>
        </div>
      </div>
    </section>
  );
}
