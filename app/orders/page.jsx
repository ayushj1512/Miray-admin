"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Clock,
  Truck,
  CheckCircle,
  RotateCcw,
  TrendingUp,
  IndianRupee,
  CalendarDays,
  BarChart3,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function OrdersDashboard() {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalOrders: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    returned: 0,
    todayOrders: 0,
    todayRevenue: 0,
  });

  const loadStats = async () => {
    try {
      const res = await fetch(`${API}/api/orders`, { cache: "no-store" });
      const data = await res.json();

      setOrders(data);

      const now = new Date();
      const todayDate = now.toISOString().slice(0, 10);

      const today = data.filter((o) =>
        new Date(o.createdAt).toISOString().startsWith(todayDate)
      );

      setStats({
        totalOrders: data.length,
        pending: data.filter((o) => o.fulfillmentStatus === "processing").length,
        processing: data.filter((o) => o.fulfillmentStatus === "packed").length,
        shipped: data.filter((o) => o.fulfillmentStatus === "shipped").length,
        delivered: data.filter((o) => o.fulfillmentStatus === "delivered").length,
        returned: data.filter((o) =>
          ["returned", "cancelled"].includes(o.fulfillmentStatus)
        ).length,

        todayOrders: today.length,
        todayRevenue: today.reduce((acc, o) => acc + (o.finalPayable || 0), 0),
      });

      setLoading(false);
    } catch (err) {
      console.log("Error fetching order stats:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const mainCards = [
    {
      title: "All Orders",
      value: stats.totalOrders,
      icon: ClipboardList,
      route: "/orders/all",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: Clock,
      route: "/orders/pending",
      color: "from-yellow-500 to-amber-600",
    },
    {
      title: "Processing",
      value: stats.processing,
      icon: TrendingUp,
      route: "/orders/processing",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Shipped",
      value: stats.shipped,
      icon: Truck,
      route: "/orders/shipped",
      color: "from-indigo-500 to-indigo-600",
    },
    {
      title: "Delivered",
      value: stats.delivered,
      icon: CheckCircle,
      route: "/orders/delivered",
      color: "from-green-500 to-emerald-600",
    },
    {
      title: "Returned / Cancelled",
      value: stats.returned,
      icon: RotateCcw,
      route: "/orders/returns",
      color: "from-red-500 to-rose-600",
    },
  ];

  const todayCards = [
    {
      title: "Today's Orders",
      value: stats.todayOrders,
      icon: CalendarDays,
      color: "from-blue-600 to-indigo-600",
    },
    {
      title: "Today's Revenue",
      value: `₹${stats.todayRevenue}`,
      icon: IndianRupee,
      color: "from-green-600 to-emerald-600",
    },
  ];

  if (loading)
    return <p className="p-10 text-center text-gray-600">Loading dashboard...</p>;

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-10">
      {/* HEADER */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md">
            <ClipboardList size={42} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800">Orders Dashboard</h1>
        <p className="text-gray-500 mt-2">
          Track, analyze and manage all customer orders in real time.
        </p>
      </div>

      {/* TODAY'S STATS */}
      <div className="max-w-6xl mx-auto mb-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        {todayCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center"
            >
              <div>
                <p className="text-gray-500 text-sm">{card.title}</p>
                <h2 className="text-3xl font-bold mt-1">{card.value}</h2>
              </div>
              <div
                className={`p-4 rounded-xl text-white bg-gradient-to-br ${card.color}`}
              >
                <Icon size={30} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ORDER CATEGORY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {mainCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <div
              key={index}
              onClick={() => router.push(card.route)}
              className="
                cursor-pointer p-6
                bg-white border border-gray-200 rounded-2xl
                shadow-sm hover:shadow-md hover:-translate-y-1
                transition-all duration-300 group
              "
            >
              <div
                className={`
                  w-fit p-4 rounded-xl mb-4
                  bg-gradient-to-br ${card.color}
                  text-white shadow-md
                  group-hover:scale-110 transition-transform
                `}
              >
                <Icon size={28} />
              </div>

              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-gray-700">
                  {card.title}
                </h2>

                <span className="text-3xl font-bold text-gray-900">
                  {card.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
