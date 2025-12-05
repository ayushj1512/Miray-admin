import React from "react";
import Link from "next/link";
import {
  Activity,
  RefreshCw,
  Package,
  Eye,
  ShoppingCart,
  Heart,
  BadgeDollarSign,
  AlertTriangle,
  ArrowRight,
  IndianRupee,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "";

/* ---------------- helpers ---------------- */
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

const safeNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const formatInt = (n) => new Intl.NumberFormat("en-IN").format(safeNum(n));

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(safeNum(n));

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

const Stat = ({ icon: Icon, label, value, hint, href }) => (
  <Card href={href} className="min-w-[260px] flex-1">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {hint ? <p className="text-xs text-gray-500 mt-2">{hint}</p> : null}
      </div>
      <div className="w-11 h-11 rounded-2xl bg-gray-50 ring-1 ring-black/5 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-gray-700" />
      </div>
    </div>

    {href ? (
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>Open</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    ) : (
      <p className="text-xs text-gray-500 mt-3">Live snapshot</p>
    )}
  </Card>
);

function getProducts(payload) {
  if (!payload) return [];
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function pickId(p) {
  return p?.slug || p?._id || p?.id || "—";
}

function pickTitle(p) {
  return p?.title || p?.name || p?.slug || "Untitled";
}

function pickPrice(p) {
  return p?.price ?? p?.regularPrice ?? p?.salePrice ?? 0;
}

function sumAnalytics(p) {
  const a = p?.analytics || {};
  return {
    views: safeNum(a.views),
    purchases: safeNum(a.purchases),
    wishlist: safeNum(a.wishlistCount),
    cartAdds: safeNum(a.cartAdds),
  };
}

function sortDesc(list, getVal) {
  return [...list].sort((a, b) => getVal(b) - getVal(a));
}

function ListTable({ title, rows, cols }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5 flex-1 min-w-[360px]">
      <p className="text-sm font-semibold text-gray-900">{title}</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              {cols.map((c) => (
                <th key={c.key} className="py-2 pr-4 font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-gray-900">
            {rows.length ? (
              rows.map((r, idx) => (
                <tr key={`${pickId(r)}-${idx}`} className="border-b border-black/5 last:border-b-0">
                  {cols.map((c) => (
                    <td key={c.key} className="py-3 pr-4">
                      {c.render(r)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={cols.length} className="py-6 text-center text-gray-500">
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function AnalyticsProductsPage() {
  if (!API) {
    return (
      <div className="p-6 w-full">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Products Analytics</h1>
          <p className="text-sm text-gray-600 mt-2">
            Missing API base URL. Set{" "}
            <code className="px-2 py-1 bg-gray-50 rounded">NEXT_PUBLIC_API_URL</code>{" "}
            (or{" "}
            <code className="px-2 py-1 bg-gray-50 rounded">API_URL</code>).
          </p>
        </div>
      </div>
    );
  }

  const AUTO_REFRESH_SECONDS = 10;
  const now = new Date();

  // Pull a big-ish sample for ranking cards
  const res = await safeJson(`${API}/api/products?limit=200&page=1`);
  const ok = res.ok;

  const products = getProducts(res.json);

  // Totals
  const totalCount = safeNum(res?.json?.total) || products.length;

  const totals = products.reduce(
    (acc, p) => {
      const a = sumAnalytics(p);
      acc.views += a.views;
      acc.purchases += a.purchases;
      acc.wishlist += a.wishlist;
      acc.cartAdds += a.cartAdds;
      acc.revenueProxy += a.purchases * safeNum(pickPrice(p));
      return acc;
    },
    { views: 0, purchases: 0, wishlist: 0, cartAdds: 0, revenueProxy: 0 }
  );

  // Top lists
  const topViewed = sortDesc(products, (p) => sumAnalytics(p).views).slice(0, 10);
  const topPurchased = sortDesc(products, (p) => sumAnalytics(p).purchases).slice(0, 10);
  const topWishlisted = sortDesc(products, (p) => sumAnalytics(p).wishlist).slice(0, 10);
  const mostCarted = sortDesc(products, (p) => sumAnalytics(p).cartAdds).slice(0, 10);

  // Low stock (best effort)
  const lowStock = [...products]
    .filter((p) => {
      const st = safeNum(p?.stock);
      const isInStock = p?.isInStock;
      if (isInStock === false) return true;
      return st >= 0 && st <= 5;
    })
    .sort((a, b) => safeNum(a.stock) - safeNum(b.stock))
    .slice(0, 10);

  return (
    <div className="p-6 w-full">
      <meta httpEquiv="refresh" content={`${AUTO_REFRESH_SECONDS}`} />

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-blue-700">Products Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time snapshot · Auto refresh every {AUTO_REFRESH_SECONDS}s
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

      {/* Warning */}
      {!ok && (
        <div className="mb-6 rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-4">
          <p className="text-sm font-semibold text-amber-900">
            Products API didn’t respond ({res.status || "no status"}).
          </p>
          <p className="text-xs text-amber-800 mt-1">
            Expected: <code className="px-2 py-0.5 bg-white/70 rounded">GET /api/products?limit=200</code>
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        <Stat
          icon={Package}
          label="Total Products"
          value={formatInt(totalCount)}
          hint="From /api/products total"
          href="/products/manage"
        />
        <Stat
          icon={Eye}
          label="Total Views (sample)"
          value={formatInt(totals.views)}
          hint="Sum of products[].analytics.views"
          href="/analytics/traffic"
        />
        <Stat
          icon={BadgeDollarSign}
          label="Total Purchases (sample)"
          value={formatInt(totals.purchases)}
          hint="Sum of products[].analytics.purchases"
          href="/analytics/sales"
        />
        <Stat
          icon={Heart}
          label="Wishlist Adds (sample)"
          value={formatInt(totals.wishlist)}
          hint="Sum of products[].analytics.wishlistCount"
          href="/customers/wishlist"
        />
        <Stat
          icon={ShoppingCart}
          label="Cart Adds (sample)"
          value={formatInt(totals.cartAdds)}
          hint="Sum of products[].analytics.cartAdds"
          href="/analytics/funnel"
        />
        <Stat
          icon={IndianRupee}
          label="Revenue Proxy (sample)"
          value={formatINR(totals.revenueProxy)}
          hint="purchases × product.price (approx)"
          href="/analytics/sales"
        />
      </div>

      {/* Tables */}
      <div className="mt-6 flex flex-wrap gap-4">
        <ListTable
          title="Top Viewed Products"
          rows={topViewed}
          cols={[
            {
              key: "title",
              label: "Product",
              render: (p) => (
                <Link
                  href={`/products/manage?search=${encodeURIComponent(pickTitle(p))}`}
                  className="text-gray-900 hover:underline font-semibold"
                >
                  {pickTitle(p)}
                </Link>
              ),
            },
            {
              key: "views",
              label: "Views",
              render: (p) => formatInt(sumAnalytics(p).views),
            },
            {
              key: "price",
              label: "Price",
              render: (p) => formatINR(pickPrice(p)),
            },
          ]}
        />

        <ListTable
          title="Top Purchased Products"
          rows={topPurchased}
          cols={[
            {
              key: "title",
              label: "Product",
              render: (p) => (
                <span className="font-semibold text-gray-900">{pickTitle(p)}</span>
              ),
            },
            {
              key: "purchases",
              label: "Purchases",
              render: (p) => formatInt(sumAnalytics(p).purchases),
            },
            {
              key: "price",
              label: "Price",
              render: (p) => formatINR(pickPrice(p)),
            },
          ]}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <ListTable
          title="Most Wishlisted"
          rows={topWishlisted}
          cols={[
            { key: "title", label: "Product", render: (p) => <span className="font-semibold">{pickTitle(p)}</span> },
            { key: "wishlist", label: "Wishlist", render: (p) => formatInt(sumAnalytics(p).wishlist) },
          ]}
        />

        <ListTable
          title="Most Added to Cart"
          rows={mostCarted}
          cols={[
            { key: "title", label: "Product", render: (p) => <span className="font-semibold">{pickTitle(p)}</span> },
            { key: "cartAdds", label: "Cart Adds", render: (p) => formatInt(sumAnalytics(p).cartAdds) },
          ]}
        />

        <ListTable
          title="Low Stock (≤ 5 or Out of Stock)"
          rows={lowStock}
          cols={[
            {
              key: "title",
              label: "Product",
              render: (p) => <span className="font-semibold text-gray-900">{pickTitle(p)}</span>,
            },
            {
              key: "stock",
              label: "Stock",
              render: (p) => (
                <span className="inline-flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  {formatInt(p?.stock)}
                </span>
              ),
            },
            {
              key: "inStock",
              label: "In Stock?",
              render: (p) => (p?.isInStock === false ? "No" : "Yes"),
            },
          ]}
        />
      </div>

      {/* Bottom nav */}
      <div className="mt-6 flex flex-wrap gap-3">
        {[
          { label: "Analytics Overview", href: "/analytics/overview" },
          { label: "Sales", href: "/analytics/sales" },
          { label: "Traffic", href: "/analytics/traffic" },
          { label: "Funnel", href: "/analytics/funnel" },
          { label: "Marketing", href: "/analytics/marketing" },
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
