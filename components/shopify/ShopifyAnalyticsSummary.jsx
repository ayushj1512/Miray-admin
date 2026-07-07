"use client";

import {
  Banknote,
  Boxes,
  CalendarDays,
  CreditCard,
  IndianRupee,
  Package,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");

export default function ShopifyAnalyticsSummary({
  productCount = 0,
  orderCount = 0,
  customerCount = 0,
  inventoryCount = 0,
  stats = {},
}) {
  const cards = [
    {
      title: "Products",
      value: formatNumber(productCount),
      sub: "Live products",
      icon: Package,
    },
    {
      title: "Orders",
      value: formatNumber(orderCount),
      sub: "Total Shopify orders",
      icon: ShoppingBag,
    },
    {
      title: "Customers",
      value: formatNumber(customerCount),
      sub: "Shopify customers",
      icon: Users,
    },
    {
      title: "Inventory",
      value: formatNumber(inventoryCount),
      sub: "Available units",
      icon: Boxes,
    },
    {
      title: "Total Revenue",
      value: formatMoney(stats.totalRevenue),
      sub: "Shopify revenue",
      icon: IndianRupee,
    },
    {
      title: "AOV",
      value: formatMoney(stats.aov),
      sub: "Average order value",
      icon: TrendingUp,
    },
    {
      title: "Paid Orders",
      value: formatNumber(stats.paidOrders),
      sub: "Payment received",
      icon: CreditCard,
    },
    {
      title: "COD Orders",
      value: formatNumber(stats.codOrders),
      sub: "Cash / pending orders",
      icon: Banknote,
    },
    {
      title: "Today Orders",
      value: formatNumber(stats.todayOrders),
      sub: `${formatMoney(stats.todayRevenue)} today`,
      icon: CalendarDays,
    },
    {
      title: "Month Revenue",
      value: formatMoney(stats.thisMonthRevenue),
      sub: "Current month",
      icon: IndianRupee,
    },
    {
      title: "Fulfilled",
      value: formatNumber(stats.fulfilledOrders),
      sub: "Dispatched orders",
      icon: Truck,
    },
    {
      title: "Unfulfilled",
      value: formatNumber(stats.unfulfilledOrders),
      sub: "Needs action",
      icon: Boxes,
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </section>
  );
}

function StatCard({ title, value, sub, icon: Icon }) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_45px_rgba(0,0,0,0.045)]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1f5] text-[#800020]">
        <Icon size={18} />
      </div>

      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
        {title}
      </p>

      <h2 className="mt-1 text-2xl font-black text-black md:text-3xl">
        {value}
      </h2>

      <p className="mt-1 text-xs font-semibold text-neutral-400">{sub}</p>
    </div>
  );
}