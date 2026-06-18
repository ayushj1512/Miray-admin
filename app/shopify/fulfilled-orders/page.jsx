"use client";

import { useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import adminShopifyStore from "@/store/adminshopifystore";

const getCustomerName = (order) =>
  order?.customer?.displayName ||
  `${order?.customer?.firstName || ""} ${order?.customer?.lastName || ""}`.trim() ||
  "Guest";

const getAmount = (order) =>
  Number(order?.totalPriceSet?.shopMoney?.amount || order?.totalPrice || 0);

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getProductCodeFromSku = (sku = "") => String(sku).split("-")?.[1] || "";

const getLineItems = (order) => order?.lineItems?.edges || [];

export default function FulfilledOrdersPage() {
  const { loading, error, orders, fetchShopifyOrders } = adminShopifyStore();

  useEffect(() => {
    fetchShopifyOrders({
      fulfillmentStatus: "FULFILLED",
      after: "",
      limit: 50,
    });
  }, [fetchShopifyOrders]);

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + getAmount(order), 0),
    [orders]
  );

  const totalItems = useMemo(
    () =>
      orders.reduce(
        (sum, order) =>
          sum +
          getLineItems(order).reduce(
            (itemSum, { node }) => itemSum + Number(node?.quantity || 0),
            0
          ),
        0
      ),
    [orders]
  );

  const downloadExcel = () => {
    const summaryRows = [
      ["Shopify Fulfilled Orders"],
      ["Generated At", new Date().toLocaleString("en-IN")],
      [],
      ["Summary"],
      ["Orders", orders.length],
      ["Units", totalItems],
      ["Revenue", totalRevenue],
      [],
    ];

    const rows = orders.map((order) => {
      const items = getLineItems(order);

      return {
        "Order No": order.name || "",
        Date: order.createdAt
          ? new Date(order.createdAt).toLocaleString("en-IN")
          : "",
        Customer: getCustomerName(order),
        Email: order?.customer?.email || order?.email || "",
        Phone: order?.customer?.phone || order?.phone || "",
        "Financial Status": order.displayFinancialStatus || "",
        "Fulfillment Status": order.displayFulfillmentStatus || "",
        Total: getAmount(order),

        Items:
          items
            .map(({ node }) => `${node.title} x ${node.quantity}`)
            .join(", ") || "",

        SKUs:
          items
            .map(({ node }) => node?.sku)
            .filter(Boolean)
            .join(", ") || "",

        "Product Codes":
          items
            .map(({ node }) => getProductCodeFromSku(node?.sku))
            .filter(Boolean)
            .join(", ") || "",

        "Image URLs":
          items
            .map(({ node }) => node?.image?.url)
            .filter(Boolean)
            .join(", ") || "",

        "Shipping City": order?.shippingAddress?.city || "",
        "Shipping Province": order?.shippingAddress?.province || "",
        "Shipping Phone": order?.shippingAddress?.phone || "",
      };
    });

    const ws = XLSX.utils.aoa_to_sheet(summaryRows);

    XLSX.utils.sheet_add_json(ws, rows, {
      origin: "A9",
      skipHeader: false,
    });

    ws["!cols"] = [
      { wch: 14 },
      { wch: 22 },
      { wch: 24 },
      { wch: 28 },
      { wch: 16 },
      { wch: 18 },
      { wch: 20 },
      { wch: 12 },
      { wch: 55 },
      { wch: 35 },
      { wch: 24 },
      { wch: 70 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fulfilled Orders");

    XLSX.writeFile(
      wb,
      `shopify-fulfilled-orders-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] p-4 text-black sm:p-6">
      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
              Shopify Orders
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Fulfilled Orders
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Completed Shopify orders with product images, SKUs and product codes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                fetchShopifyOrders({
                  fulfillmentStatus: "FULFILLED",
                  after: "",
                  limit: 50,
                })
              }
              disabled={loading}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <button
              onClick={downloadExcel}
              disabled={!orders.length}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Download Excel
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Card label="Orders" value={orders.length} />
          <Card label="Units" value={totalItems} />
          <Card label="Revenue" value={money(totalRevenue)} dark />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <OrdersTable
        orders={orders}
        loading={loading}
        emptyText="No fulfilled orders found."
      />
    </div>
  );
}

function OrdersTable({ orders, loading, emptyText }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1250px] text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Fulfillment</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <Empty text="Loading orders..." />
            ) : orders.length ? (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-gray-100 align-top hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold">{order.name}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {getLineItems(order).length} product(s)
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-medium">{getCustomerName(order)}</div>
                    <div className="text-xs text-gray-500">
                      {order?.customer?.email || order?.email || "-"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order?.customer?.phone || order?.phone || "-"}
                    </div>
                  </td>

                  <td className="max-w-[430px] px-4 py-3">
                    <LineItems order={order} />
                  </td>

                  <td className="px-4 py-3">
                    <Badge>{order.displayFinancialStatus || "-"}</Badge>
                  </td>

                  <td className="px-4 py-3">
                    <Badge dark>{order.displayFulfillmentStatus || "-"}</Badge>
                  </td>

                  <td className="px-4 py-3 text-right font-semibold">
                    {money(getAmount(order))}
                  </td>

                  <td className="px-4 py-3">{order?.shippingAddress?.city || "-"}</td>

                  <td className="px-4 py-3 text-xs text-gray-500">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("en-IN")
                      : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <Empty text={emptyText} />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LineItems({ order }) {
  const items = getLineItems(order);

  if (!items.length) return "-";

  return (
    <div className="flex flex-col gap-2">
      {items.map(({ node }, index) => {
        const sku = node?.sku || "";
        const productCode = getProductCodeFromSku(sku);

        return (
          <div
            key={`${order.id}-${sku}-${index}`}
            className="flex gap-3 rounded-xl border border-gray-100 bg-white p-2"
          >
            {node?.image?.url ? (
              <img
                src={node.image.url}
                alt={node.title}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gray-100 text-[10px] text-gray-400">
                No Img
              </div>
            )}

            <div className="min-w-0">
              <div className="line-clamp-1 font-medium text-gray-900">
                {node.title}
              </div>

              <div className="mt-0.5 flex flex-wrap gap-1 text-[11px] text-gray-500">
                <span>{sku || "No SKU"}</span>
                {productCode && <span>• Code: {productCode}</span>}
                <span>• Qty: {node.quantity || 0}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Card({ label, value, dark = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        dark ? "border-black bg-black text-white" : "border-gray-200 bg-gray-50"
      }`}
    >
      <p
        className={`text-xs uppercase tracking-wide ${
          dark ? "text-gray-300" : "text-gray-500"
        }`}
      >
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Badge({ children, dark = false }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        dark ? "bg-black text-white" : "bg-gray-100 text-gray-700"
      }`}
    >
      {children}
    </span>
  );
}

function Empty({ text }) {
  return (
    <tr>
      <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
        {text}
      </td>
    </tr>
  );
}