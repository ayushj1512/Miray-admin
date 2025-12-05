import React from "react";
import Link from "next/link";
import {
  Package,
  ShoppingBag,
  Users,
  Mail,
  Tag,
  Layers,
  Ticket,
  RefreshCw,
  Activity,
  ArrowRight,
  TrendingUp, // ✅ FIX: import it
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "";

async function safeJson(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, json };
  } catch (e) {
    return { ok: false, status: 0, json: null, error: String(e?.message || e) };
  }
}

const safeNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);

const formatInt = (n) => {
  const x = safeNum(n);
  if (x == null) return "—";
  return new Intl.NumberFormat("en-IN").format(x);
};

const Chip = ({ children }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 ring-1 ring-black/5 px-3 py-1 text-xs text-gray-700">
    {children}
  </span>
);

const Card = ({ children, href, className = "" }) => {
  const base =
    "rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5 hover:shadow-md transition";
  if (!href) return <div className={`${base} ${className}`}>{children}</div>;
  return (
    <Link href={href} className={`${base} ${className}`}>
      {children}
    </Link>
  );
};

const MetricCard = ({ icon: Icon, label, value, href }) => (
  <Card href={href} className="min-w-[240px] flex-1">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className="w-11 h-11 rounded-2xl bg-gray-50 ring-1 ring-black/5 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-gray-700" />
      </div>
    </div>

    {href ? (
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>Open report</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    ) : (
      <p className="text-xs text-gray-500 mt-3">Live snapshot</p>
    )}
  </Card>
);

export default async function AnalyticsOverviewPage() {
  if (!API) {
    return (
      <div className="p-6 w-full">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Overview</h1>
          <p className="text-sm text-gray-600 mt-2">
            Missing API base URL. Set{" "}
            <code className="px-2 py-1 bg-gray-50 rounded">NEXT_PUBLIC_API_URL</code>{" "}
            (or{" "}
            <code className="px-2 py-1 bg-gray-50 rounded">API_URL</code>)
          </p>
        </div>
      </div>
    );
  }

  const AUTO_REFRESH_SECONDS = 10;
  const now = new Date();

  const [
    productsRes,
    ordersRes,
    newslettersRes,
    customersRes,
    couponsRes,
    collectionsRes,
    categoriesRes,
    ticketsRes,
  ] = await Promise.all([
    safeJson(`${API}/api/products?limit=1`),
    safeJson(`${API}/api/orders?limit=1`),
    safeJson(`${API}/api/newsletters`),
    safeJson(`${API}/api/customers?limit=1`),
    safeJson(`${API}/api/coupons?limit=1`),
    safeJson(`${API}/api/collections?limit=1`),
    safeJson(`${API}/api/categories?limit=1`),
    safeJson(`${API}/api/tickets?limit=1`),
  ]);

  const productsTotal = safeNum(productsRes?.json?.total);
  const ordersTotal = safeNum(ordersRes?.json?.total);

  const newsletterList = Array.isArray(newslettersRes?.json)
    ? newslettersRes.json
    : Array.isArray(newslettersRes?.json?.subscribers)
    ? newslettersRes.json.subscribers
    : [];
  const subscribersTotal = safeNum(newsletterList.length);

  const customersTotal = safeNum(customersRes?.json?.total);
  const couponsTotal = safeNum(couponsRes?.json?.total);
  const collectionsTotal = safeNum(collectionsRes?.json?.total);
  const categoriesTotal = safeNum(categoriesRes?.json?.total);
  const ticketsTotal = safeNum(ticketsRes?.json?.total);

  const warnings = [];
  const warn = (label, r) => {
    if (!r?.ok) warnings.push(`${label} failed (${r?.status || "no status"})`);
  };
  warn("Products", productsRes);
  warn("Orders", ordersRes);
  warn("Newsletters", newslettersRes);
  warn("Customers", customersRes);
  warn("Coupons", couponsRes);
  warn("Collections", collectionsRes);
  warn("Categories", categoriesRes);
  warn("Tickets", ticketsRes);

  return (
    <div className="p-6 w-full">
      <meta httpEquiv="refresh" content={`${AUTO_REFRESH_SECONDS}`} />

      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">Analytics Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time overview · Auto refresh every {AUTO_REFRESH_SECONDS}s
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip>
            <Activity className="w-4 h-4 text-gray-600" />
            Live
          </Chip>
          <Chip>
            <RefreshCw className="w-4 h-4 text-gray-600" />
            Updated: <span className="font-semibold">{now.toLocaleString("en-IN")}</span>
          </Chip>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mb-6 rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-4">
          <p className="text-sm font-semibold text-amber-900">
            Some APIs didn’t respond:
          </p>
          <ul className="list-disc ml-5 mt-1 text-sm text-amber-800">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <MetricCard icon={Package} label="Products" value={formatInt(productsTotal)} href="/analytics/products" />
        <MetricCard icon={ShoppingBag} label="Orders" value={formatInt(ordersTotal)} href="/analytics/sales" />
        <MetricCard icon={Users} label="Customers" value={formatInt(customersTotal)} href="/analytics/customers" />
        <MetricCard
          icon={Mail}
          label="Newsletter Subscribers"
          value={formatInt(subscribersTotal)}
          href="/analytics/marketing"
        />
        <MetricCard icon={Tag} label="Coupons" value={formatInt(couponsTotal)} href="/coupons/manage" />
        <MetricCard icon={Layers} label="Collections" value={formatInt(collectionsTotal)} href="/products/collections" />
        <MetricCard icon={TrendingUp} label="Categories" value={formatInt(categoriesTotal)} href="/products/category" />
        <MetricCard icon={Ticket} label="Support Tickets" value={formatInt(ticketsTotal)} href="/support-tickets/all" />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {[
          { label: "Sales Analytics", href: "/analytics/sales" },
          { label: "Marketing Performance", href: "/analytics/marketing" },
          { label: "Products Performance", href: "/analytics/products" },
          { label: "Customer Insights", href: "/analytics/customers" },
          { label: "Abandoned Carts", href: "/analytics/abandoned-carts" },
          { label: "Reports Export", href: "/analytics/reports" },
        ].map((x) => (
          <Link
            key={x.href}
            href={x.href}
            className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 px-4 py-2 text-sm text-gray-800 hover:shadow-md transition"
          >
            {x.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
