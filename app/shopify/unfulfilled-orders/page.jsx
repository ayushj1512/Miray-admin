"use client";

import { useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import adminShopifyStore from "@/store/adminshopifystore";
import ImportShopifyOrdersButton from "@/components/shopify/ImportShopifyOrdersButton";
import UnfulfilledOrderRow from "@/components/shopify/UnfulfilledOrderRow";

const getAmount = (order) =>
  Number(
    order?.currentTotalPriceSet?.shopMoney?.amount ||
      order?.totalPriceSet?.shopMoney?.amount ||
      order?.totalPrice ||
      0
  );

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getProductCodeFromSku = (sku = "") => String(sku).split("-")?.[1] || "";
const getLineItems = (order) => order?.lineItems?.edges || [];

const getLineImage = (node) =>
  node?.variant?.image?.url ||
  node?.variant?.product?.featuredMedia?.preview?.image?.url ||
  "";

const getCustomerName = (order) =>
  order?.customer?.displayName ||
  `${order?.customer?.firstName || ""} ${order?.customer?.lastName || ""}`.trim() ||
  "Guest";

export default function UnfulfilledOrdersPage() {
  const { loading, error, orders, fetchShopifyOrders } = adminShopifyStore();

  const refreshOrders = () =>
    fetchShopifyOrders({
      fulfillmentStatus: "UNFULFILLED",
      after: "",
      limit: 50,
    });

  useEffect(() => {
    refreshOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      ["Shopify Unfulfilled Orders"],
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
        Phone:
          order?.shippingAddress?.phone ||
          order?.customer?.phone ||
          order?.phone ||
          "",
        "Financial Status": order.displayFinancialStatus || "",
        "Fulfillment Status": order.displayFulfillmentStatus || "",
        Total: getAmount(order),
        Items:
          items.map(({ node }) => `${node.title} x ${node.quantity}`).join(", ") ||
          "",
        SKUs:
          items
            .map(({ node }) => node?.sku || node?.variant?.sku)
            .filter(Boolean)
            .join(", ") || "",
        "Product Codes":
          items
            .map(({ node }) =>
              getProductCodeFromSku(node?.sku || node?.variant?.sku)
            )
            .filter(Boolean)
            .join(", ") || "",
        "Image URLs":
          items
            .map(({ node }) => getLineImage(node))
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
    XLSX.utils.book_append_sheet(wb, ws, "Unfulfilled Orders");

    XLSX.writeFile(
      wb,
      `shopify-unfulfilled-orders-${new Date().toISOString().slice(0, 10)}.xlsx`
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
              Unfulfilled Orders
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Orders pending fulfillment and Shopify dispatch sync.
            </p>
          </div>

          <div className="flex flex-wrap items-start gap-2">
            <ImportShopifyOrdersButton
              refreshAfterImport
              size="md"
              label="Import Orders"
              params={{
                limit: 50,
                fulfillmentStatus: "UNFULFILLED",
              }}
            />

            <button
              onClick={refreshOrders}
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
          {typeof error === "string" ? error : error?.message || JSON.stringify(error)}
        </div>
      )}

      <OrdersTable
        orders={orders}
        loading={loading}
        emptyText="No unfulfilled orders found."
        onDone={refreshOrders}
      />
    </div>
  );
}

function OrdersTable({ orders, loading, emptyText, onDone }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1400px] text-sm">
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
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <Empty text="Loading orders..." />
            ) : orders.length ? (
              orders.map((order) => (
                <UnfulfilledOrderRow
                  key={order.id}
                  order={order}
                  onDone={onDone}
                />
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

function Empty({ text }) {
  return (
    <tr>
      <td colSpan="9" className="px-4 py-12 text-center text-gray-500">
        {text}
      </td>
    </tr>
  );
}
