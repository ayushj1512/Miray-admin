"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Package,
  X,
  CircleHelp,
} from "lucide-react";

import { useOrderStore } from "@/store/orderStore";

const norm = (v) =>
  String(v || "").trim().toLowerCase();

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

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

export default function RtoReceived() {
  const orders = useOrderStore((s) => s.orders);

  const fetchRtoReceivedOrders = useOrderStore(
    (s) => s.fetchRtoReceivedOrders
  );

  const loading = useOrderStore((s) => s.loading);

  const [search, setSearch] = useState("");
  const [range, setRange] = useState("all");
  const [size, setSize] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [productSearch, setProductSearch] = useState("");
const [condition, setCondition] = useState("all");
const [city, setCity] = useState("");
const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");
const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    fetchRtoReceivedOrders().catch(() => {});
  }, [fetchRtoReceivedOrders]);

  /* ================= BASE ================= */

  const rtoOrders = useMemo(
    () =>
      (orders || [])
        .filter((o) => o?.rtoReceived?.isReceived)
        .sort(
          (a, b) =>
            new Date(
              b?.rtoReceived?.receivedAt || 0
            ) -
            new Date(
              a?.rtoReceived?.receivedAt || 0
            )
        ),
    [orders]
  );

  /* ================= SIZES ================= */

  const sizes = useMemo(() => {
    const set = new Set();

    rtoOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        if (item.selectedSize) {
          set.add(item.selectedSize);
        }
      });
    });

    return [...set].sort();
  }, [rtoOrders]);

  /* ================= FILTER ================= */

const filtered = useMemo(() => {
  const q = norm(search);
  const pq = norm(productSearch);
  const cq = norm(city);

  return rtoOrders.filter((order) => {
    const receivedAt = new Date(
      order?.rtoReceived?.receivedAt
    );

    /* DATE */

    if (fromDate) {
      const from = new Date(`${fromDate}T00:00:00`);

      if (receivedAt < from) return false;
    }

    if (toDate) {
      const to = new Date(`${toDate}T23:59:59`);

      if (receivedAt > to) return false;
    }

    /* ORDER / CUSTOMER */

    if (q) {
      const match = [
        order.orderNumber,
        order.customerId?.name,
        order.shippingAddressSnapshot?.fullName,
        order.shippingAddressSnapshot?.phone,
      ].some((v) =>
        norm(v).includes(q)
      );

      if (!match) return false;
    }

    /* CITY / STATE */

    if (cq) {
      const locationMatch = [
        order.shippingAddressSnapshot?.city,
        order.shippingAddressSnapshot?.state,
      ].some((v) =>
        norm(v).includes(cq)
      );

      if (!locationMatch) return false;
    }

    /* PRODUCT / SIZE / CONDITION */

    const itemMatch = (order.items || []).some((item) => {
      const product =
        item.productSnapshot || {};

      const saved =
        order?.rtoReceived?.items?.find(
          (x) =>
            String(x.lineId) ===
            String(item.lineId)
        ) || {};

      if (
        size !== "all" &&
        String(item.selectedSize || "") !== size
      ) {
        return false;
      }

      if (pq) {
        const match = [
          product.title,
          product.productCode,
          item.variant?.sku,
        ].some((v) =>
          norm(v).includes(pq)
        );

        if (!match) return false;
      }

      if (condition === "correct") {
        return Number(saved.correctQty || 0) > 0;
      }

      if (condition === "wrong") {
        return Number(saved.wrongQty || 0) > 0;
      }

      if (condition === "damaged") {
        return Number(saved.damagedQty || 0) > 0;
      }

      if (condition === "missing") {
        const received =
          Number(saved.correctQty || 0) +
          Number(saved.wrongQty || 0) +
          Number(saved.damagedQty || 0);

        return received < Number(item.quantity || 0);
      }

      return true;
    });

    return itemMatch;
  });
}, [
  rtoOrders,
  search,
  productSearch,
  size,
  condition,
  city,
  fromDate,
  toDate,
]);

  /* ================= PRODUCT REPORT ================= */

  const productReport = useMemo(() => {
    const map = new Map();

    filtered.forEach((order) => {
      (order.items || []).forEach((item) => {
        const product =
          item.productSnapshot || {};

        const saved =
          order?.rtoReceived?.items?.find(
            (x) =>
              String(x.lineId) ===
              String(item.lineId)
          ) || {};

        const correct = Number(
          saved.correctQty || 0
        );

        const wrong = Number(
          saved.wrongQty || 0
        );

        const damaged = Number(
          saved.damagedQty || 0
        );

        const received =
          correct + wrong + damaged;

        const key =
          product.productCode ||
          item.productId ||
          product.title;

        if (!map.has(key)) {
          map.set(key, {
            key,
            title: product.title || "Product",
            code: product.productCode || "-",
            image: product.thumbnail || "",
            total: 0,
            correct: 0,
            wrong: 0,
            damaged: 0,
            sizes: {},
          });
        }

        const row = map.get(key);

        row.total += received;
        row.correct += correct;
        row.wrong += wrong;
        row.damaged += damaged;

        const itemSize =
          item.selectedSize || "NA";

        row.sizes[itemSize] =
          Number(row.sizes[itemSize] || 0) +
          received;
      });
    });

    return [...map.values()].sort(
      (a, b) => b.total - a.total
    );
  }, [filtered]);

  /* ================= SUMMARY ================= */

  const summary = useMemo(() => {
    let received = 0;
    let correct = 0;
    let wrong = 0;
    let damaged = 0;

    productReport.forEach((p) => {
      received += p.total;
      correct += p.correct;
      wrong += p.wrong;
      damaged += p.damaged;
    });

    return {
      parcels: filtered.length,
      products: productReport.length,
      received,
      correct,
      wrong,
      damaged,
    };
  }, [filtered, productReport]);

  /* ================= DATE GROUPS ================= */

  const grouped = useMemo(() => {
    const map = {};

    filtered.forEach((order) => {
      const key = dateKey(
        order?.rtoReceived?.receivedAt
      );

      if (!map[key]) map[key] = [];

      map[key].push(order);
    });

    return Object.entries(map).sort(
      ([a], [b]) =>
        new Date(b) - new Date(a)
    );
  }, [filtered]);

const clear = () => {
  setSearch("");
  setProductSearch("");
  setSize("all");
  setCondition("all");
  setCity("");
  setFromDate("");
  setToDate("");
};

  return (
    <div className="min-h-screen bg-[#f7f7f8] p-4">

{/* HEADER */}

<div className="mb-3 flex items-end justify-between">
  <div>
    <h1 className="text-lg font-bold">
      RTO Received Report
    </h1>

    <p className="text-[11px] text-gray-500">
      Product, size and date-wise warehouse report.
    </p>
  </div>

  <div className="flex items-center gap-3">
    <span className="text-[11px] text-gray-500">
      <b className="text-gray-900">{summary.parcels}</b> parcels
    </span>

    <button
      onClick={() => setShowHelp(!showHelp)}
      className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-[10px] font-semibold transition ${
        showHelp
          ? "bg-[#800020] text-white"
          : "bg-white text-[#800020] shadow-sm"
      }`}
    >
      <CircleHelp size={13} />
      How to Use
    </button>
  </div>
</div>

{/* HOW TO USE */}

{showHelp && (
  <div className="mb-3 rounded-xl bg-[#800020]/[0.04] px-4 py-3">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-bold text-[#800020]">
          How to Use This Report
        </p>

        <p className="mt-0.5 text-[10px] text-gray-500">
          Use one or multiple filters together to find the exact RTO data you need.
        </p>
      </div>

      <button
        onClick={() => setShowHelp(false)}
        className="text-gray-400 hover:text-[#800020]"
      >
        <X size={14} />
      </button>
    </div>

    <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      <HelpStep
        number="01"
        title="Find Orders"
        text="Search by order number or customer."
      />

      <HelpStep
        number="02"
        title="Filter Products"
        text="Use product, code, SKU, size or condition."
      />

      <HelpStep
        number="03"
        title="Select Period"
        text="Choose city, from date and to date."
      />

      <HelpStep
        number="04"
        title="Read Report"
        text="Check totals, size breakup and date-wise RTO."
      />
    </div>

    <div className="mt-3 flex flex-wrap gap-2 text-[9px]">
      <Info text="Correct = restored to inventory" />
      <Info text="Wrong = not restored" />
      <Info text="Damaged = not restored" />
      <Info text="Missing = not received" />
    </div>
  </div>
)}

{/* FILTER BAR */}

<div className="rounded-xl bg-white p-3 shadow-sm">
  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">

    {/* ORDER / GENERAL */}
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Order / Customer"
      className="h-9 rounded-lg bg-gray-50 px-3 text-xs outline-none"
    />

    {/* PRODUCT */}
    <input
      value={productSearch}
      onChange={(e) => setProductSearch(e.target.value)}
      placeholder="Product / Code / SKU"
      className="h-9 rounded-lg bg-gray-50 px-3 text-xs outline-none"
    />

    {/* SIZE */}
    <select
      value={size}
      onChange={(e) => setSize(e.target.value)}
      className="h-9 rounded-lg bg-gray-50 px-3 text-xs outline-none"
    >
      <option value="all">All Sizes</option>

      {sizes.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>

    {/* CONDITION */}
    <select
      value={condition}
      onChange={(e) => setCondition(e.target.value)}
      className="h-9 rounded-lg bg-gray-50 px-3 text-xs outline-none"
    >
      <option value="all">
        All Conditions
      </option>
      <option value="correct">Correct</option>
      <option value="wrong">Wrong</option>
      <option value="damaged">Damaged</option>
      <option value="missing">Missing</option>
    </select>

    {/* CITY */}
    <input
      value={city}
      onChange={(e) => setCity(e.target.value)}
      placeholder="City / State"
      className="h-9 rounded-lg bg-gray-50 px-3 text-xs outline-none"
    />

    {/* FROM DATE */}
    <input
      type="date"
      value={fromDate}
      onChange={(e) => setFromDate(e.target.value)}
      className="h-9 rounded-lg bg-gray-50 px-3 text-xs outline-none"
    />

    {/* TO DATE */}
    <input
      type="date"
      value={toDate}
      onChange={(e) => setToDate(e.target.value)}
      className="h-9 rounded-lg bg-gray-50 px-3 text-xs outline-none"
    />

    {/* CLEAR */}
    <button
      onClick={clear}
      className="h-9 rounded-lg bg-gray-100 px-3 text-xs font-semibold text-gray-600"
    >
      Clear Filters
    </button>
  </div>
</div>

      {/* RANGE */}

      <div className="mt-2 flex gap-1">
        {[
          ["all", "All"],
          ["today", "Today"],
          ["7", "7 Days"],
          ["30", "30 Days"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setRange(value)}
            className={`rounded-md px-3 py-1.5 text-[10px] font-semibold ${
              range === value
                ? "bg-[#800020] text-white"
                : "bg-white text-gray-500"
            }`}
          >
            {label}
          </button>
        ))}

        {(search ||
          size !== "all" ||
          range !== "all") && (
          <button
            onClick={clear}
            className="ml-1 px-2 text-[10px] font-semibold text-[#800020]"
          >
            Clear
          </button>
        )}
      </div>

      {/* SUMMARY */}

      <div className="mt-3 flex flex-wrap items-center gap-5 rounded-xl bg-white px-4 py-3 shadow-sm">
        <Mini
          label="Parcels"
          value={summary.parcels}
        />

        <Mini
          label="Products"
          value={summary.products}
        />

        <Mini
          label="Received"
          value={summary.received}
        />

        <Mini
          label="Correct"
          value={summary.correct}
        />

        <Mini
          label="Wrong"
          value={summary.wrong}
        />

        <Mini
          label="Damaged"
          value={summary.damaged}
        />
      </div>

      {/* OVERALL */}

      <section className="mt-4">
        <div className="mb-2">
          <h2 className="text-sm font-semibold">
            Overall Product Report
          </h2>

          <p className="text-[10px] text-gray-400">
            Consolidated received quantity by product and size.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] text-gray-400">
                <th className="px-3 py-2">
                  Product
                </th>

                <th className="px-3 py-2">
                  Code
                </th>

                <th className="px-3 py-2">
                  Sizes
                </th>

                <th className="px-3 py-2 text-center">
                  Rec.
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
              {productReport.map((product) => (
                <tr
                  key={product.key}
                  className="border-t border-gray-100 text-xs"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-7 shrink-0 overflow-hidden rounded bg-gray-100">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package
                              size={11}
                              className="text-gray-300"
                            />
                          </div>
                        )}
                      </div>

                      <span className="max-w-[260px] truncate font-medium">
                        {product.title}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-2 font-semibold">
                    {product.code}
                  </td>

                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(
                        product.sizes
                      ).map(
                        ([s, qty]) => (
                          <span
                            key={s}
                            className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold"
                          >
                            {s} {qty}
                          </span>
                        )
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-2 text-center font-bold">
                    {product.total}
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

      {/* DATE-WISE */}

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold">
          Date-wise RTO
        </h2>

        <div className="space-y-3">
          {grouped.map(
            ([day, groupOrders]) => (
              <div key={day}>
                <div className="mb-1 flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays
                      size={12}
                      className="text-[#800020]"
                    />

                    <span className="text-[11px] font-semibold">
                      {formatDate(day)}
                    </span>
                  </div>

                  <span className="text-[10px] text-gray-400">
                    {groupOrders.length} parcels
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                  {groupOrders.map(
                    (order, index) => (
                      <OrderRow
                        key={order._id}
                        order={order}
                        open={
                          expanded === order._id
                        }
                        onToggle={() =>
                          setExpanded(
                            expanded === order._id
                              ? null
                              : order._id
                          )
                        }
                        last={
                          index ===
                          groupOrders.length - 1
                        }
                      />
                    )
                  )}
                </div>
              </div>
            )
          )}

          {!loading && !grouped.length && (
            <div className="py-10 text-center text-xs text-gray-400">
              No RTO records found.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ================= ORDER ROW ================= */

function OrderRow({
  order,
  open,
  onToggle,
  last,
}) {
  const rtoItems = order?.rtoReceived?.items || [];

  const received = rtoItems.reduce(
    (sum, x) =>
      sum +
      Number(x.correctQty || 0) +
      Number(x.wrongQty || 0) +
      Number(x.damagedQty || 0),
    0
  );

  return (
    <div className={!last ? "border-b border-gray-100" : ""}>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-3 py-2 text-left hover:bg-gray-50"
      >
        {/* ORDER */}
        <div className="w-28 shrink-0">
          <p className="text-[11px] font-bold">
            {order.orderNumber}
          </p>
        </div>

        {/* CUSTOMER */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium">
            {order.shippingAddressSnapshot?.fullName ||
              order.customerId?.name ||
              "-"}
          </p>

          <p className="truncate text-[9px] text-gray-400">
            {order.shippingAddressSnapshot?.city || "-"}
          </p>
        </div>

        {/* UNITS */}
        <span className="w-16 text-center text-[10px] font-semibold">
          {received} unit
        </span>

        {/* ARROW */}
        <div className="w-5">
          {open ? (
            <ChevronUp size={13} />
          ) : (
            <ChevronDown size={13} />
          )}
        </div>
      </button>

      {/* EXPANDED */}
      {open && (
        <div className="space-y-1 bg-gray-50 px-3 py-2">
          {(order.items || []).map((item, index) => {
            const product = item.productSnapshot || {};

            const saved =
              rtoItems.find(
                (x) =>
                  String(x.lineId) === String(item.lineId)
              ) || {};

            return (
              <div
                key={item.lineId || index}
                className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5"
              >
                <div className="h-8 w-7 shrink-0 overflow-hidden rounded bg-gray-100">
                  {product.thumbnail && (
                    <img
                      src={product.thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-medium">
                    {product.title || "Product"}
                  </p>

                  <p className="text-[9px] text-gray-400">
                    {product.productCode || "-"}
                    {" • "}
                    Size {item.selectedSize || "-"}
                  </p>
                </div>

                <div className="flex gap-3 text-[9px] font-semibold">
                  <span>C {saved.correctQty || 0}</span>
                  <span>W {saved.wrongQty || 0}</span>
                  <span>D {saved.damagedQty || 0}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="min-w-[54px]">
      <p className="text-[9px] text-gray-400">
        {label}
      </p>

      <p className="mt-0.5 text-sm font-bold">
        {value}
      </p>
    </div>
  );
}

function HelpStep({ number, title, text }) {
  return (
    <div className="flex gap-2 rounded-lg bg-white p-2.5">
      <span className="text-[9px] font-bold text-[#800020]">
        {number}
      </span>

      <div>
        <p className="text-[10px] font-semibold text-gray-900">
          {title}
        </p>

        <p className="mt-0.5 text-[9px] leading-4 text-gray-500">
          {text}
        </p>
      </div>
    </div>
  );
}

function Info({ text }) {
  return (
    <span className="rounded-md bg-white px-2 py-1 font-medium text-gray-600">
      {text}
    </span>
  );
}