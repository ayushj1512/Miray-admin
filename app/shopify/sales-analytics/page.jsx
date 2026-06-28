"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  IndianRupee,
  MapPin,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import * as XLSX from "xlsx";
import adminShopifyStore from "@/store/adminshopifystore";
import ShopifySalesGraph from "@/components/shopify/ShopifySalesGraph";

const DEFAULT_DAYS = 7;

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const number = (value) => Number(value || 0).toLocaleString("en-IN");

const StatCard = ({ title, value, sub, icon: Icon }) => (
  <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
          {title}
        </p>
        <h3 className="mt-3 text-2xl font-semibold text-zinc-950">{value}</h3>
        {sub ? <p className="mt-1 text-sm text-zinc-500">{sub}</p> : null}
      </div>

      <div className="rounded-xl bg-[#800020]/10 p-3 text-[#800020]">
        <Icon size={18} />
      </div>
    </div>
  </div>
);

const SimpleBar = ({ label, value, max, suffix = "" }) => {
  const width = max ? Math.max((Number(value || 0) / max) * 100, 4) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="line-clamp-1 font-medium text-zinc-800">{label}</span>
        <span className="shrink-0 text-zinc-500">
          {number(value)}
          {suffix}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-[#800020]"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};

const statusRows = (rows = []) =>
  rows.map((item) => ({
    Name: item.name,
    Count: item.count,
  }));

export default function ShopifySalesAnalyticsPage() {
  const [days, setDays] = useState(DEFAULT_DAYS);

  const {
    orderAnalytics,
    orderAnalyticsLoading,
    orderAnalyticsError,
    fetchShopifyOrderAnalytics,
  } = adminShopifyStore();

  useEffect(() => {
    fetchShopifyOrderAnalytics({ days });
  }, [days, fetchShopifyOrderAnalytics]);

  const summary = orderAnalytics?.summary || {};
  const charts = orderAnalytics?.charts || {};

  const daily = charts.daily || [];
  const topProducts = charts.topProducts || [];
  const financialStatus = charts.financialStatus || [];
  const fulfillmentStatus = charts.fulfillmentStatus || [];
  const topStates = charts.topStates || [];
  const topCities = charts.topCities || [];
  const sizeBreakdown = charts.sizeBreakdown || [];

  const maxProductQty = useMemo(
    () => Math.max(...topProducts.map((item) => Number(item.quantity || 0)), 0),
    [topProducts]
  );

  const maxStateCount = useMemo(
    () => Math.max(...topStates.map((item) => Number(item.count || 0)), 0),
    [topStates]
  );

  const maxSizeQty = useMemo(
    () =>
      Math.max(...sizeBreakdown.map((item) => Number(item.quantity || 0)), 0),
    [sizeBreakdown]
  );

  const handleExcelDownload = () => {
    const workbook = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.json_to_sheet([
      {
        Range: `Last ${days} days including today`,
        Orders: summary.orders || 0,
        Revenue: summary.revenue || 0,
        AOV: summary.aov || 0,
        Items: summary.items || 0,
        CancelledOrders: summary.cancelledOrders || 0,
        Discounts: summary.discounts || 0,
        Tax: summary.tax || 0,
        Shipping: summary.shipping || 0,
      },
    ]);

    const dailySheet = XLSX.utils.json_to_sheet(
      daily.map((item) => ({
        Date: item.date,
        Orders: item.orders,
        Revenue: item.revenue,
        AOV: item.aov,
        Items: item.items,
        Discounts: item.discounts,
        Tax: item.tax,
        Shipping: item.shipping,
      }))
    );

    const productSheet = XLSX.utils.json_to_sheet(
      topProducts.map((item) => ({
        Product: item.title,
        SKU: item.sku,
        Quantity: item.quantity,
        Revenue: item.revenue,
      }))
    );

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(workbook, dailySheet, "Daily");
    XLSX.utils.book_append_sheet(workbook, productSheet, "Top Products");
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(statusRows(topStates)),
      "Top States"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(statusRows(topCities)),
      "Top Cities"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        sizeBreakdown.map((item) => ({
          Size: item.name,
          Quantity: item.quantity,
        }))
      ),
      "Sizes"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(statusRows(financialStatus)),
      "Financial Status"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(statusRows(fulfillmentStatus)),
      "Fulfillment Status"
    );

    XLSX.writeFile(workbook, `miray-shopify-sales-last-${days}-days.xlsx`);
  };

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#800020]">
              Miray Shopify
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              Sales Analytics
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">
              Daily orders, revenue, products, sizes, status and location
              breakdown from Shopify. Default range is last 7 days including
              today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchShopifyOrderAnalytics({ days })}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-[#800020]"
            >
              <RefreshCw size={15} />
              Refresh
            </button>

            <button
              onClick={handleExcelDownload}
              disabled={!orderAnalytics}
              className="inline-flex items-center gap-2 rounded-full border border-[#800020] bg-white px-4 py-2 text-sm font-medium text-[#800020] transition hover:bg-[#800020] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={15} />
              Excel
            </button>
          </div>
        </div>

        {orderAnalyticsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {orderAnalyticsError}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Revenue"
            value={money(summary.revenue)}
            sub={`Last ${days} days`}
            icon={IndianRupee}
          />
          <StatCard
            title="Orders"
            value={number(summary.orders)}
            sub={`AOV ${money(summary.aov)}`}
            icon={ShoppingBag}
          />
          <StatCard
            title="Items Sold"
            value={number(summary.items)}
            sub={`${number(summary.cancelledOrders)} cancelled`}
            icon={Package}
          />
          <StatCard
            title="Discounts"
            value={money(summary.discounts)}
            sub={`Tax ${money(summary.tax)}`}
            icon={TrendingUp}
          />
        </section>

        <ShopifySalesGraph
          daily={daily}
          loading={orderAnalyticsLoading}
          selectedDays={days}
          onRangeChange={(nextDays) => setDays(nextDays)}
        />

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Top products</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Best selling products by quantity.
            </p>

            <div className="mt-6 space-y-5">
              {topProducts.length ? (
                topProducts.map((item) => (
                  <SimpleBar
                    key={`${item.title}-${item.sku}`}
                    label={item.title}
                    value={item.quantity}
                    max={maxProductQty}
                  />
                ))
              ) : (
                <p className="text-sm text-zinc-500">No product data.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Top states</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Where orders are coming from.
            </p>

            <div className="mt-6 space-y-5">
              {topStates.length ? (
                topStates.map((item) => (
                  <SimpleBar
                    key={item.name}
                    label={item.name}
                    value={item.count}
                    max={maxStateCount}
                  />
                ))
              ) : (
                <p className="text-sm text-zinc-500">No location data.</p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Financial status</h2>
            <div className="mt-5 space-y-3">
              {financialStatus.length ? (
                financialStatus.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 text-sm"
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="text-zinc-500">{number(item.count)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No data.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Fulfillment status</h2>
            <div className="mt-5 space-y-3">
              {fulfillmentStatus.length ? (
                fulfillmentStatus.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 text-sm"
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="text-zinc-500">{number(item.count)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No data.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Size breakdown</h2>
              <MapPin className="text-[#800020]" size={18} />
            </div>

            <div className="mt-5 space-y-5">
              {sizeBreakdown.length ? (
                sizeBreakdown.map((item) => (
                  <SimpleBar
                    key={item.name}
                    label={item.name}
                    value={item.quantity}
                    max={maxSizeQty}
                  />
                ))
              ) : (
                <p className="text-sm text-zinc-500">No size data.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}