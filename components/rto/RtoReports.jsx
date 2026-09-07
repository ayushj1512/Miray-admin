"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  PackageCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  PackageX,
  ArrowRight,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useOrderStore } from "@/store/orderStore";

const dateKey = (value) => {
  if (!value) return "";

  const d = new Date(value);

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(d.getDate()).padStart(
    2,
    "0"
  )}`;
};

const fmt = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      })
    : "-";

export default function RtoReports() {
  const router = useRouter();

  const orders = useOrderStore((s) => s.orders);

  const fetchRtoReceivedOrders = useOrderStore(
    (s) => s.fetchRtoReceivedOrders
  );

  const [range, setRange] = useState("30");

  useEffect(() => {
    fetchRtoReceivedOrders().catch(() => {});
  }, [fetchRtoReceivedOrders]);

  /* ================= FILTER ================= */

  const filtered = useMemo(() => {
    if (range === "all") return orders || [];

    const now = new Date();

    return (orders || []).filter((order) => {
      const receivedAt = new Date(
        order?.rtoReceived?.receivedAt
      );

      if (range === "today") {
        return (
          dateKey(receivedAt) === dateKey(now)
        );
      }

      const diff =
        (now - receivedAt) / 86400000;

      return diff <= Number(range);
    });
  }, [orders, range]);

  /* ================= ANALYTICS ================= */

  const report = useMemo(() => {
    let units = 0;
    let correct = 0;
    let wrong = 0;
    let damaged = 0;
    let missing = 0;

    const productMap = new Map();
    const sizeMap = new Map();
    const dayMap = new Map();

    filtered.forEach((order) => {
      let orderUnits = 0;

      (order.items || []).forEach((item) => {
        const product =
          item.productSnapshot || {};

        const saved =
          order?.rtoReceived?.items?.find(
            (x) =>
              String(x.lineId) ===
              String(item.lineId)
          ) || {};

        const c = Number(saved.correctQty || 0);
        const w = Number(saved.wrongQty || 0);
        const d = Number(saved.damagedQty || 0);

        const received = c + w + d;

        const miss = Math.max(
          0,
          Number(item.quantity || 0) - received
        );

        units += received;
        correct += c;
        wrong += w;
        damaged += d;
        missing += miss;
        orderUnits += received;

        const productKey =
          product.productCode ||
          item.productId ||
          product.title;

        if (!productMap.has(productKey)) {
          productMap.set(productKey, {
            title: product.title || "Product",
            code: product.productCode || "-",
            image: product.thumbnail || "",
            units: 0,
            correct: 0,
            wrong: 0,
            damaged: 0,
            sizes: {},
          });
        }

        const p = productMap.get(productKey);

        p.units += received;
        p.correct += c;
        p.wrong += w;
        p.damaged += d;

        const s = item.selectedSize || "NA";

        p.sizes[s] =
          Number(p.sizes[s] || 0) + received;

        sizeMap.set(
          s,
          Number(sizeMap.get(s) || 0) + received
        );
      });

      const day = dateKey(
        order?.rtoReceived?.receivedAt
      );

      if (!dayMap.has(day)) {
        dayMap.set(day, {
          parcels: 0,
          units: 0,
        });
      }

      const dayRow = dayMap.get(day);

      dayRow.parcels += 1;
      dayRow.units += orderUnits;
    });

    const products = [...productMap.values()].sort(
      (a, b) => b.units - a.units
    );

    const sizes = [...sizeMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([size, qty]) => ({
        size,
        qty,
      }));

    const daily = [...dayMap.entries()]
      .sort(
        ([a], [b]) =>
          new Date(b) - new Date(a)
      )
      .slice(0, 7);

    const recoveryRate = units
      ? ((correct / units) * 100).toFixed(1)
      : "0.0";

    return {
      parcels: filtered.length,
      units,
      correct,
      wrong,
      damaged,
      missing,
      recoveryRate,
      products,
      sizes,
      daily,
    };
  }, [filtered]);

  return (
    <div className="min-h-screen bg-[#f7f7f8] p-4 md:p-6">

      {/* HEADER */}

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#800020]">
            Analytics
          </p>

          <h1 className="mt-1 text-xl font-bold">
            RTO Analytics
          </h1>

          <p className="mt-1 text-xs text-gray-500">
            High-level warehouse return and recovery insights.
          </p>
        </div>

        <div className="flex gap-1">
          {[
            ["today", "Today"],
            ["7", "7 Days"],
            ["30", "30 Days"],
            ["all", "All"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`rounded-lg px-3 py-2 text-[10px] font-semibold ${
                range === value
                  ? "bg-[#800020] text-white"
                  : "bg-white text-gray-500 shadow-sm"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI STRIP */}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={RotateCcw}
          label="RTO Parcels"
          value={report.parcels}
        />

        <Kpi
          icon={PackageCheck}
          label="Units Received"
          value={report.units}
        />

        <Kpi
          icon={CheckCircle2}
          label="Inventory Restored"
          value={report.correct}
        />

        <Kpi
          icon={BarChart3}
          label="Recovery Rate"
          value={`${report.recoveryRate}%`}
        />
      </div>

      {/* QUALITY BREAKUP */}

      <div className="mt-3 flex flex-wrap gap-2">
        <Mini
          label="Correct"
          value={report.correct}
        />

        <Mini
          label="Wrong"
          value={report.wrong}
        />

        <Mini
          label="Damaged"
          value={report.damaged}
        />

        <Mini
          label="Missing"
          value={report.missing}
        />
      </div>

      {/* MAIN GRID */}

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">

        {/* TOP PRODUCTS */}

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold">
                Top RTO Products
              </h2>

              <p className="text-[10px] text-gray-400">
                Highest physically received return volume.
              </p>
            </div>

            <button
              onClick={() =>
                router.push("/rto/received")
              }
              className="flex items-center gap-1 text-[10px] font-semibold text-[#800020]"
            >
              Detailed Report
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="bg-gray-50 text-[9px] text-gray-400">
                  <th className="px-3 py-2">
                    Product
                  </th>
                  <th className="px-3 py-2">
                    Sizes
                  </th>
                  <th className="px-3 py-2 text-center">
                    Units
                  </th>
                  <th className="px-3 py-2 text-center">
                    C
                  </th>
                  <th className="px-3 py-2 text-center">
                    W
                  </th>
                  <th className="px-3 py-2 text-center">
                    D
                  </th>
                </tr>
              </thead>

              <tbody>
                {report.products
                  .slice(0, 6)
                  .map((product) => (
                    <tr
                      key={product.code + product.title}
                      className="border-t border-gray-100 text-xs"
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-7 overflow-hidden rounded bg-gray-100">
                            {product.image && (
                              <img
                                src={product.image}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-[260px] truncate font-medium">
                              {product.title}
                            </p>

                            <p className="text-[9px] text-gray-400">
                              {product.code}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(
                            product.sizes
                          ).map(([s, qty]) => (
                            <span
                              key={s}
                              className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold"
                            >
                              {s} {qty}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-3 py-2 text-center font-bold">
                        {product.units}
                      </td>

                      <td className="px-3 py-2 text-center">
                        {product.correct}
                      </td>

                      <td className="px-3 py-2 text-center">
                        {product.wrong}
                      </td>

                      <td className="px-3 py-2 text-center">
                        {product.damaged}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SIZE + DAILY */}

        <div className="space-y-4">

          {/* SIZE DISTRIBUTION */}

          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold">
              Returned Sizes
            </h2>

            <p className="mt-0.5 text-[10px] text-gray-400">
              Most frequently returned sizes.
            </p>

            <div className="mt-4 space-y-3">
              {report.sizes
                .slice(0, 6)
                .map(({ size, qty }) => {
                  const max =
                    report.sizes?.[0]?.qty || 1;

                  const percent =
                    (qty / max) * 100;

                  return (
                    <div key={size}>
                      <div className="mb-1 flex justify-between text-[10px]">
                        <span className="font-semibold">
                          {size}
                        </span>

                        <span className="text-gray-400">
                          {qty}
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-[#800020]"
                          style={{
                            width: `${percent}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>

          {/* DAILY MOVEMENT */}

          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold">
              Recent RTO Movement
            </h2>

            <p className="mt-0.5 text-[10px] text-gray-400">
              Recent warehouse receipt activity.
            </p>

            <div className="mt-3 space-y-1">
              {report.daily.map(
                ([day, data]) => (
                  <div
                    key={day}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                  >
                    <span className="text-[10px] font-semibold">
                      {fmt(day)}
                    </span>

                    <div className="flex gap-3 text-[9px] text-gray-500">
                      <span>
                        {data.parcels} parcels
                      </span>

                      <span>
                        {data.units} units
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ALERT INSIGHT */}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Insight
          icon={CheckCircle2}
          title="Healthy Recovery"
          value={`${report.recoveryRate}%`}
          text="of physically received units restored to stock"
        />

        <Insight
          icon={AlertTriangle}
          title="Wrong Returns"
          value={report.wrong}
          text="units received as incorrect items"
        />

        <Insight
          icon={PackageX}
          title="Damaged / Missing"
          value={report.damaged + report.missing}
          text="units not recoverable into sellable stock"
        />
      </div>
    </div>
  );
}

/* ================= UI ================= */

function Kpi({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-gray-400">
          {label}
        </p>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#800020]/[0.07] text-[#800020]">
          <Icon size={15} />
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded-lg bg-white px-4 py-2 shadow-sm">
      <span className="text-[9px] text-gray-400">
        {label}
      </span>

      <span className="ml-2 text-sm font-bold">
        {value}
      </span>
    </div>
  );
}

function Insight({
  icon: Icon,
  title,
  value,
  text,
}) {
  return (
    <div className="rounded-xl bg-[#800020]/[0.045] p-4">
      <div className="flex items-center gap-2">
        <Icon
          size={15}
          className="text-[#800020]"
        />

        <p className="text-xs font-semibold">
          {title}
        </p>
      </div>

      <p className="mt-3 text-xl font-bold text-[#800020]">
        {value}
      </p>

      <p className="mt-1 text-[10px] leading-4 text-gray-500">
        {text}
      </p>
    </div>
  );
}