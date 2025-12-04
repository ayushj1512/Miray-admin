"use client";

import { useEffect, useState } from "react";
import {
  TicketPercent,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function CouponReportsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/coupons`);
      const data = await res.json();

      setCoupons(data.data || []);
    } catch (error) {
      console.log("Error fetching coupon reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const now = new Date();

  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(
    (c) => c.isActive && new Date(c.validTill) > now
  ).length;
  const expiredCoupons = coupons.filter(
    (c) => new Date(c.validTill) < now
  ).length;

  // Top Used Coupons
  const topUsed = [...coupons]
    .sort((a, b) => b.usedCount - a.usedCount)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10">
      {/* HEADER */}
      <div className="mb-10 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-500 text-white shadow-md">
            <TicketPercent size={42} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800">Coupon Usage Reports</h1>
        <p className="text-gray-500 mt-2">Track how your coupons are performing.</p>
      </div>

      {/* ANALYTIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-10">
        {/* TOTAL */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <TrendingUp className="text-blue-600" size={28} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Coupons</p>
              <h2 className="text-2xl font-semibold">{totalCoupons}</h2>
            </div>
          </div>
        </div>

        {/* ACTIVE */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="text-green-600" size={28} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Active Coupons</p>
              <h2 className="text-2xl font-semibold">{activeCoupons}</h2>
            </div>
          </div>
        </div>

        {/* EXPIRED */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="text-red-600" size={28} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Expired Coupons</p>
              <h2 className="text-2xl font-semibold">{expiredCoupons}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* TOP USED COUPONS */}
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl border shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Top Used Coupons
        </h2>

        {loading ? (
          <div className="text-gray-500 text-center py-10">Loading analytics...</div>
        ) : topUsed.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No coupon usage found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-sm text-gray-600">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Used Count</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {topUsed.map((c) => {
                  const expired = new Date(c.validTill) < now;

                  return (
                    <tr key={c._id} className="border-b hover:bg-gray-50 transition">
                      <td className="py-3 px-4 font-semibold">{c.code}</td>
                      <td className="py-3 px-4 capitalize">{c.type}</td>
                      <td className="py-3 px-4">
                        {c.discountType === "percentage"
                          ? `${c.discountValue}%`
                          : `₹${c.discountValue}`}
                      </td>
                      <td className="py-3 px-4">{c.usedCount}</td>

                      <td className="py-3 px-4">
                        {expired ? (
                          <span className="badge bg-red-100 text-red-700">
                            Expired
                          </span>
                        ) : (
                          <span className="badge bg-green-100 text-green-700">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER GAP */}
      <div className="py-6"></div>
    </div>
  );
}
