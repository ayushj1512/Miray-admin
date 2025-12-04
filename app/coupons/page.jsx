"use client";

import { useRouter } from "next/navigation";
import {
  TicketPercent,
  PlusCircle,
  FileSpreadsheet,
  Settings,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function CouponDashboard() {
  const router = useRouter();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const cards = [
    {
      id: "create",
      title: "Create New Coupon",
      desc: "Add a new coupon code with discount rules and expiry.",
      icon: PlusCircle,
      route: "/coupons/create",
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "manage",
      title: "Manage Coupons",
      desc: "View, edit, activate or deactivate existing coupons.",
      icon: Settings,
      route: "/coupons/manage",
      color: "from-blue-500 to-indigo-500",
    },
    {
      id: "reports",
      title: "Coupon Usage Reports",
      desc: "Track coupon performance, usage statistics & customer activity.",
      icon: FileSpreadsheet,
      route: "/coupons/reports",
      color: "from-orange-500 to-amber-500",
    },
  ];

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/coupons`);
      const data = await res.json();
      setCoupons(data.data || []);
    } catch (err) {
      console.log("Error fetching coupons:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const now = new Date();

  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(
    (c) => c.isActive && new Date(c.validTill) > now
  ).length;
  const expiredCoupons = coupons.filter(
    (c) => new Date(c.validTill) < now
  ).length;

  const recentCoupons = [...coupons]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10">
      {/* HEADER */}
      <div className="mb-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-500 text-white shadow-md">
            <TicketPercent size={42} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800">Coupons Dashboard</h1>
        <p className="text-gray-500 mt-2">
          Overview of coupon performance, recent activity & quick actions.
        </p>
      </div>

      {/* ANALYTIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
        {/* Total Coupons */}
        <div className="bg-white p-6 rounded-2xl shadow border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <TrendingUp className="text-blue-600" size={28} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Coupons</p>
              <h2 className="text-2xl font-semibold">{loading ? "…" : totalCoupons}</h2>
            </div>
          </div>
        </div>

        {/* Active */}
        <div className="bg-white p-6 rounded-2xl shadow border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="text-green-600" size={28} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Active Coupons</p>
              <h2 className="text-2xl font-semibold">{loading ? "…" : activeCoupons}</h2>
            </div>
          </div>
        </div>

        {/* Expired */}
        <div className="bg-white p-6 rounded-2xl shadow border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="text-red-600" size={28} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Expired Coupons</p>
              <h2 className="text-2xl font-semibold">{loading ? "…" : expiredCoupons}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTION CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => router.push(card.route)}
              className="
                cursor-pointer p-6
                bg-white border rounded-2xl shadow-sm
                hover:shadow-md hover:-translate-y-1
                transition-all duration-300 group
              "
            >
              <div
                className={`w-fit p-4 rounded-xl mb-4 bg-gradient-to-br ${card.color} text-white shadow-md group-hover:scale-110 transition-transform`}
              >
                <Icon size={28} />
              </div>

              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700">
                {card.title}
              </h2>
              <p className="text-gray-500 text-sm mt-1">{card.desc}</p>
            </div>
          );
        })}
      </div>

      {/* RECENT COUPONS */}
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Coupons</h2>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading coupons…</div>
        ) : recentCoupons.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No coupons found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-600">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentCoupons.map((c) => (
                  <tr key={c._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold">{c.code}</td>
                    <td className="py-3 px-4 capitalize">{c.type}</td>
                    <td className="py-3 px-4">
                      {c.discountType === "percentage"
                        ? `${c.discountValue}%`
                        : `₹${c.discountValue}`}
                    </td>
                    <td className="py-3 px-4">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="py-10"></div>
    </div>
  );
}
