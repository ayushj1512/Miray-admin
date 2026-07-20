"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Boxes,
  CircleDollarSign,
  Clock3,
  CreditCard,
  IndianRupee,
  PackageCheck,
  PackageX,
  ReceiptIndianRupee,
  RefreshCcw,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const number = (value) =>
  Number(value || 0).toLocaleString("en-IN");

const percent = (value) => `${Number(value || 0).toFixed(1)}%`;

export default function ShopifyCommandCenter({ stats = {} }) {
  const executiveCards = [
    {
      title: "Today Revenue",
      value: money(stats.todayRevenue),
      sub: `${number(stats.todayOrders)} orders today`,
      growth: stats.todayRevenueGrowth,
      icon: IndianRupee,
    },
    {
      title: "Today Orders",
      value: number(stats.todayOrders),
      sub: `${number(stats.todayItems)} items sold`,
      growth: stats.todayOrderGrowth,
      icon: ShoppingBag,
    },
    {
      title: "Month Revenue",
      value: money(stats.thisMonthRevenue),
      sub: `${number(stats.thisMonthOrders)} orders`,
      growth: stats.monthRevenueGrowth,
      icon: TrendingUp,
    },
    {
      title: "Average Order",
      value: money(stats.aov),
      sub: `${Number(stats.averageItemsPerOrder || 0).toFixed(1)} items/order`,
      icon: CircleDollarSign,
    },
    {
      title: "Fulfillment Rate",
      value: percent(stats.fulfillmentRate),
      sub: `${number(stats.fulfilledOrders)} fulfilled`,
      icon: PackageCheck,
    },
    {
      title: "Cancellation Rate",
      value: percent(stats.cancellationRate),
      sub: `${number(stats.cancelledOrders)} cancelled`,
      icon: PackageX,
      danger: Number(stats.cancellationRate || 0) > 10,
    },
  ];

  const healthCards = [
    {
      title: "Unfulfilled Value",
      value: money(stats.unfulfilledValue),
      sub: `${number(stats.unfulfilledOrders)} orders`,
      icon: ReceiptIndianRupee,
      danger: Number(stats.unfulfilledOrders || 0) > 0,
    },
    {
      title: "Pending 24+ Hours",
      value: number(stats.pendingOver24Hours),
      sub: `${number(stats.pendingOver48Hours)} over 48 hours`,
      icon: Clock3,
      danger: Number(stats.pendingOver24Hours || 0) > 0,
    },
    {
      title: "Low Stock",
      value: number(stats.lowStockVariants),
      sub: "Variants with 1–5 units",
      icon: AlertTriangle,
      danger: Number(stats.lowStockVariants || 0) > 0,
    },
    {
      title: "Out of Stock",
      value: number(stats.outOfStockVariants),
      sub: `${number(stats.negativeStockVariants)} negative stock`,
      icon: Boxes,
      danger: Number(stats.outOfStockVariants || 0) > 0,
    },
  ];

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {executiveCards.map((card) => (
          <ExecutiveCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <GrowthPanel stats={stats} />
        <PaymentPanel stats={stats} />
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#800020]">
              Operations
            </p>

            <h2 className="mt-1 text-lg font-black text-black">
              Action Required
            </h2>
          </div>

          <p className="text-xs font-semibold text-neutral-400">
            Live Shopify health
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {healthCards.map((card) => (
            <HealthCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ExecutiveCard({
  title,
  value,
  sub,
  growth,
  icon: Icon,
  danger = false,
}) {
  return (
    <article className="rounded-[24px] bg-white p-4 shadow-[0_16px_45px_rgba(0,0,0,0.045)] md:p-5">
      <div className="flex items-start justify-between gap-2">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            danger
              ? "bg-red-50 text-red-600"
              : "bg-[#fff1f5] text-[#800020]"
          }`}
        >
          <Icon size={18} />
        </div>

        {growth !== undefined && growth !== null && (
          <GrowthBadge value={growth} />
        )}
      </div>

      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.17em] text-neutral-400">
        {title}
      </p>

      <h3 className="mt-1 text-xl font-black tracking-tight text-black md:text-2xl">
        {value}
      </h3>

      <p className="mt-1 truncate text-xs font-semibold text-neutral-400">
        {sub}
      </p>
    </article>
  );
}

function GrowthPanel({ stats }) {
  const rows = [
    {
      label: "Revenue today",
      current: money(stats.todayRevenue),
      previous: money(stats.yesterdayRevenue),
      growth: stats.todayRevenueGrowth,
    },
    {
      label: "Orders today",
      current: number(stats.todayOrders),
      previous: number(stats.yesterdayOrders),
      growth: stats.todayOrderGrowth,
    },
    {
      label: "Revenue this month",
      current: money(stats.thisMonthRevenue),
      previous: money(stats.lastMonthRevenue),
      growth: stats.monthRevenueGrowth,
    },
    {
      label: "Orders this month",
      current: number(stats.thisMonthOrders),
      previous: number(stats.lastMonthOrders),
      growth: stats.monthOrderGrowth,
    },
  ];

  return (
    <article className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.045)] md:p-6">
      <div className="mb-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#800020]">
          Performance
        </p>

        <h2 className="mt-1 text-lg font-black text-black">
          Growth Comparison
        </h2>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-2xl bg-[#faf9f8] px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-black">
                {row.label}
              </p>

              <p className="mt-0.5 text-[11px] font-semibold text-neutral-400">
                Previous: {row.previous}
              </p>
            </div>

            <p className="text-sm font-black text-black">
              {row.current}
            </p>

            <GrowthBadge value={row.growth} />
          </div>
        ))}
      </div>
    </article>
  );
}

function PaymentPanel({ stats }) {
  const totalPaymentOrders =
    Number(stats.paidOrders || 0) + Number(stats.codOrders || 0);

  const prepaidWidth =
    totalPaymentOrders > 0
      ? (Number(stats.paidOrders || 0) / totalPaymentOrders) * 100
      : 0;

  const codWidth =
    totalPaymentOrders > 0
      ? (Number(stats.codOrders || 0) / totalPaymentOrders) * 100
      : 0;

  return (
    <article className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.045)] md:p-6">
      <div className="mb-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#800020]">
          Payments
        </p>

        <h2 className="mt-1 text-lg font-black text-black">
          Payment Mix
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PaymentStat
          icon={CreditCard}
          label="Prepaid"
          value={money(stats.prepaidRevenue)}
          sub={`${number(stats.paidOrders)} orders`}
        />

        <PaymentStat
          icon={Banknote}
          label="COD"
          value={money(stats.codRevenue)}
          sub={`${number(stats.codOrders)} orders`}
        />
      </div>

      <div className="mt-5">
        <div className="flex h-3 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="bg-black"
            style={{ width: `${prepaidWidth}%` }}
          />

          <div
            className="bg-[#800020]"
            style={{ width: `${codWidth}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs font-bold">
          <span className="text-neutral-500">
            Prepaid {percent(stats.prepaidOrderPercentage)}
          </span>

          <span className="text-[#800020]">
            COD {percent(stats.codOrderPercentage)}
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-[#faf9f8] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-black">
              Pending Payments
            </p>

            <p className="mt-0.5 text-[11px] font-semibold text-neutral-400">
              {number(stats.pendingOrders)} orders awaiting payment
            </p>
          </div>

          <p className="text-sm font-black text-[#800020]">
            {money(stats.pendingPaymentValue)}
          </p>
        </div>
      </div>
    </article>
  );
}

function PaymentStat({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-2xl bg-[#faf9f8] p-4">
      <Icon size={17} className="text-[#800020]" />

      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-black">
        {value}
      </p>

      <p className="mt-0.5 text-[11px] font-semibold text-neutral-400">
        {sub}
      </p>
    </div>
  );
}

function HealthCard({
  title,
  value,
  sub,
  icon: Icon,
  danger = false,
}) {
  return (
    <article
      className={`rounded-[24px] border p-4 shadow-[0_14px_40px_rgba(0,0,0,0.035)] md:p-5 ${
        danger
          ? "border-red-100 bg-red-50/60"
          : "border-transparent bg-white"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          danger
            ? "bg-white text-red-600"
            : "bg-[#fff1f5] text-[#800020]"
        }`}
      >
        <Icon size={17} />
      </div>

      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">
        {title}
      </p>

      <p
        className={`mt-1 text-xl font-black ${
          danger ? "text-red-700" : "text-black"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs font-semibold text-neutral-400">
        {sub}
      </p>
    </article>
  );
}

function GrowthBadge({ value }) {
  const numericValue = Number(value || 0);
  const positive = numericValue >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${
        positive
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      <Icon size={12} />
      {Math.abs(numericValue).toFixed(1)}%
    </span>
  );
}