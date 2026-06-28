"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, LineChart } from "lucide-react";

const RANGE_OPTIONS = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 15 days", value: 15 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 60 days", value: 60 },
  { label: "Last 90 days", value: 90 },
];

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const formatDate = (value) => {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload || {};

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {formatDate(label)}
      </p>
      <div className="mt-2 space-y-1 text-sm">
        <p className="font-semibold text-zinc-950">
          Revenue: {formatMoney(row.revenue)}
        </p>
        <p className="text-zinc-600">Orders: {row.orders || 0}</p>
        <p className="text-zinc-600">Items: {row.items || 0}</p>
        <p className="text-zinc-600">AOV: {formatMoney(row.aov)}</p>
      </div>
    </div>
  );
};

export default function ShopifySalesGraph({
  daily = [],
  loading = false,
  selectedDays = 30,
  onRangeChange,
}) {
  const [graphType, setGraphType] = useState("area");

  const chartData = useMemo(() => {
    return (daily || []).map((item) => ({
      ...item,
      label: formatDate(item.date),
      revenue: Number(item.revenue || 0),
      orders: Number(item.orders || 0),
      items: Number(item.items || 0),
      aov: Number(item.aov || 0),
    }));
  }, [daily]);

  const totalRevenue = useMemo(
    () => chartData.reduce((sum, item) => sum + Number(item.revenue || 0), 0),
    [chartData]
  );

  const totalOrders = useMemo(
    () => chartData.reduce((sum, item) => sum + Number(item.orders || 0), 0),
    [chartData]
  );

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#800020]">
            Sales trend
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
            Shopify revenue graph
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Revenue, orders and item movement for selected date range.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {RANGE_OPTIONS.map((item) => {
            const active = Number(selectedDays) === item.value;

            return (
              <button
                key={item.value}
                onClick={() => onRangeChange?.(item.value)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                  active
                    ? "bg-[#800020] text-white"
                    : "border border-zinc-200 bg-white text-zinc-700 hover:border-[#800020] hover:text-[#800020]"
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <div className="ml-0 flex rounded-full border border-zinc-200 bg-zinc-50 p-1 md:ml-2">
            <button
              onClick={() => setGraphType("area")}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                graphType === "area"
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              <LineChart size={13} />
              Area
            </button>

            <button
              onClick={() => setGraphType("bar")}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                graphType === "bar"
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              <BarChart3 size={13} />
              Bar
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-zinc-50 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
            Revenue
          </p>
          <p className="mt-2 text-xl font-semibold text-zinc-950">
            {formatMoney(totalRevenue)}
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-50 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
            Orders
          </p>
          <p className="mt-2 text-xl font-semibold text-zinc-950">
            {totalOrders.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-50 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
            AOV
          </p>
          <p className="mt-2 text-xl font-semibold text-zinc-950">
            {formatMoney(totalOrders ? totalRevenue / totalOrders : 0)}
          </p>
        </div>
      </div>

      <div className="mt-6 h-[320px] w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center rounded-2xl bg-zinc-50 text-sm text-zinc-500">
            Loading graph...
          </div>
        ) : chartData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            {graphType === "bar" ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(value) => `₹${Number(value) / 1000}k`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#800020" radius={[10, 10, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="mirayRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#800020" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#800020" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(value) => `₹${Number(value) / 1000}k`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#800020"
                  strokeWidth={3}
                  fill="url(#mirayRevenue)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl bg-zinc-50 text-sm text-zinc-500">
            No graph data found.
          </div>
        )}
      </div>
    </section>
  );
}