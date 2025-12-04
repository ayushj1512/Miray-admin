"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TicketPercent,
  Pencil,
  Trash2,
  RefreshCcw,
  AlertTriangle,
} from "lucide-react";

export default function ManageCouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/coupons`);
      const data = await res.json();
      setCoupons(data.data || []);
    } catch (error) {
      console.log("Error fetching coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      setDeletingId(id);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/coupons/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete coupon");

      setCoupons((prev) => prev.filter((c) => c._id !== id));
    } catch (error) {
      alert("Error deleting coupon.");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (coupon) => {
    const now = new Date();
    const expiry = new Date(coupon.validTill);

    if (!coupon.isActive)
      return <span className="badge bg-red-100 text-red-700">Inactive</span>;

    if (expiry < now)
      return <span className="badge bg-orange-100 text-orange-700">Expired</span>;

    return <span className="badge bg-green-100 text-green-700">Active</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10">
      {/* HEADER */}
      <div className="mb-10 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md">
            <TicketPercent size={42} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800">Manage Coupons</h1>
        <p className="text-gray-500 mt-2">View, edit and delete all coupons.</p>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={fetchCoupons}
          className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-100 transition"
        >
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-10 text-gray-500 flex flex-col items-center gap-3">
            <AlertTriangle size={32} className="text-gray-400" />
            No coupons found.
          </div>
        ) : (
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-sm text-gray-600">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Min Purchase</th>
                <th className="py-3 px-4">Valid Till</th>
                <th className="py-3 px-4">Used</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {coupons.map((coupon) => (
                <tr
                  key={coupon._id}
                  className="border-b hover:bg-gray-50 transition text-sm"
                >
                  <td className="py-3 px-4 font-semibold">{coupon.code}</td>
                  <td className="py-3 px-4 capitalize">{coupon.type}</td>
                  <td className="py-3 px-4">
                    {coupon.discountType === "percentage"
                      ? `${coupon.discountValue}%`
                      : `₹${coupon.discountValue}`}
                  </td>
                  <td className="py-3 px-4">₹{coupon.minPurchase}</td>
                  <td className="py-3 px-4">
                    {new Date(coupon.validTill).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">{coupon.usedCount || 0}</td>

                  <td className="py-3 px-4">{getStatusBadge(coupon)}</td>

                  <td className="py-3 px-4 text-right flex gap-2 justify-end">
                    {/* EDIT BUTTON */}
                    <button
                      onClick={() => router.push(`/coupons/edit/${coupon._id}`)}
                      className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                    >
                      <Pencil size={16} />
                    </button>

                    {/* DELETE BUTTON */}
                    <button
                      onClick={() => handleDelete(coupon._id)}
                      disabled={deletingId === coupon._id}
                      className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                    >
                      {deletingId === coupon._id ? (
                        "..."
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
