"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Printer,
  X,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import adminShopifyStore from "@/store/adminshopifystore";
import InvoiceTemplate from "@/components/invoice/InvoiceTemplate";
import { buildInvoiceDataFromShopify } from "@/components/invoice/buildInvoiceDataFromShopify";
import ShopifyOrderRow from "@/components/shopify/ShopifyOrderRow";

const shopifyGidToId = (gid = "") => {
  const raw = String(gid || "").trim();
  return raw.includes("/") ? raw.split("/").pop() : raw;
};

export default function ShopifyOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [printOrders, setPrintOrders] = useState([]);
  const [importedOrderMap, setImportedOrderMap] = useState({});
  const [checkingImported, setCheckingImported] = useState(false);

  const {
    loading,
    error,
    orders,
    orderCount,
    orderPageInfo,
    orderFilters,
    setOrderFilters,
    fetchShopifyOrders,
    fetchNextOrders,
    clearError,
  } = adminShopifyStore();

  useEffect(() => {
    fetchShopifyOrders({ limit: 20, after: "" });
  }, [fetchShopifyOrders]);

  const invoiceData = useMemo(() => {
    return selectedOrder ? buildInvoiceDataFromShopify(selectedOrder) : null;
  }, [selectedOrder]);

  const selectedOrders = useMemo(() => {
    return orders.filter((order) => selectedIds.includes(order.id));
  }, [orders, selectedIds]);

  const rawMoney = (moneySet) => Number(moneySet?.shopMoney?.amount || 0);

  const fetchImportedStatus = async (list = []) => {
    try {
      const ids = list.map((order) => shopifyGidToId(order.id)).filter(Boolean);

      if (!ids.length) {
        setImportedOrderMap({});
        return;
      }

      setCheckingImported(true);

      const res = await fetch(
        `/api/shopify/orders/imported-status?ids=${encodeURIComponent(
          ids.join(",")
        )}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to check imported orders");
      }

      setImportedOrderMap(data?.importedMap || {});
    } catch (error) {
      console.error("❌ Shopify imported status fetch failed:", error);
      setImportedOrderMap({});
    } finally {
      setCheckingImported(false);
    }
  };

  useEffect(() => {
    if (orders.length) fetchImportedStatus(orders);
    else setImportedOrderMap({});
  }, [orders]);

  const searchOrders = () => {
    setSelectedIds([]);
    fetchShopifyOrders({ after: "" });
  };

  const refreshOrders = () => {
    setSelectedIds([]);
    fetchShopifyOrders({ after: "" });
  };

  const toggleOrder = (orderId) => {
    setSelectedIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === orders.length) setSelectedIds([]);
    else setSelectedIds(orders.map((order) => order.id));
  };

  const printSingleInvoice = (order) => {
    setPrintOrders([order]);
    setTimeout(() => window.print(), 150);
  };

  const printSelectedInvoices = () => {
    if (!selectedOrders.length) return;
    setPrintOrders(selectedOrders);
    setTimeout(() => window.print(), 150);
  };

  const buildExcelRows = (list = []) => {
    return list.map((order) => {
      const customerName = order.customer
        ? `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim()
        : order.shippingAddress?.name || "";

      const items = order?.lineItems?.edges || [];

      const itemSummary = items
        .map((edge) => {
          const item = edge.node;
          return `${item.title || "-"} ${
            item.variantTitle ? `(${item.variantTitle})` : ""
          } x ${item.quantity || 1}`;
        })
        .join(" | ");

      const tracking = order?.fulfillments?.[0]?.trackingInfo?.[0];
      const importedInfo = importedOrderMap[shopifyGidToId(order.id)];

      return {
        "Order No": order.name || "",
        "Order Date": order.createdAt || "",
        "Customer Name": customerName || "",
        Email: order.customer?.email || "",
        Phone: order.customer?.phone || order.shippingAddress?.phone || "",
        "Payment Status": order.displayFinancialStatus || "",
        "Fulfillment Status": order.displayFulfillmentStatus || "",
        "Import Status": importedInfo?.isImported ? "Imported" : "Not Imported",
        "Local Order Number": importedInfo?.localOrderNumber || "",
        Subtotal: rawMoney(order.subtotalPriceSet),
        Shipping: rawMoney(order.totalShippingPriceSet),
        Total: rawMoney(order.totalPriceSet),
        Currency: order?.totalPriceSet?.shopMoney?.currencyCode || "INR",
        "Shipping Name": order.shippingAddress?.name || "",
        "Address 1": order.shippingAddress?.address1 || "",
        "Address 2": order.shippingAddress?.address2 || "",
        City: order.shippingAddress?.city || "",
        State: order.shippingAddress?.province || "",
        Pincode: order.shippingAddress?.zip || "",
        Country: order.shippingAddress?.country || "",
        Items: itemSummary,
        "Tracking Company": tracking?.company || "",
        AWB: tracking?.number || "",
        "Tracking URL": tracking?.url || "",
        "Cancelled At": order.cancelledAt || "",
        "Cancel Reason": order.cancelReason || "",
      };
    });
  };

  const exportOrdersExcel = (type = "all") => {
    const list = type === "selected" ? selectedOrders : orders;
    if (!list.length) return;

    const rows = buildExcelRows(list);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Shopify Orders");

    const fileName =
      type === "selected"
        ? `shopify-selected-orders-${selectedOrders.length}.xlsx`
        : "shopify-orders.xlsx";

    XLSX.writeFile(wb, fileName);
  };

  const importedCount = useMemo(() => {
    return orders.reduce((count, order) => {
      const id = shopifyGidToId(order.id);
      return importedOrderMap[id]?.isImported ? count + 1 : count;
    }, 0);
  }, [orders, importedOrderMap]);

  return (
    <div className="min-h-screen bg-[#faf9f8] p-4 md:p-7">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          #shopify-print-area,
          #shopify-print-area * {
            visibility: visible !important;
          }

          #shopify-print-area {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            background: white !important;
          }

          .invoice-print-page {
            page-break-after: always;
            break-after: page;
          }

          .invoice-print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>

      <div className="mx-auto max-w-7xl space-y-5 print:hidden">
        <div className="rounded-[30px] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.055)] md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#800020]">
                Miray Shopify
              </p>
              <h1 className="mt-2 text-2xl font-black text-black">
                Orders & Invoicing
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Import Shopify orders, review products, export Excel and print invoices.
              </p>
              <p className="mt-2 text-xs font-black uppercase tracking-wide text-neutral-400">
                Imported: {importedCount}/{orders.length}
                {checkingImported ? " · Checking..." : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => exportOrdersExcel("all")}
                disabled={!orders.length}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-black shadow disabled:opacity-40"
              >
                <FileSpreadsheet size={16} />
                Export Excel
              </button>

              <button
                onClick={() => exportOrdersExcel("selected")}
                disabled={!selectedIds.length}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fff1f5] px-5 py-3 text-sm font-bold text-[#800020] disabled:opacity-40"
              >
                <FileSpreadsheet size={16} />
                Selected Excel ({selectedIds.length})
              </button>

              <button
                onClick={printSelectedInvoices}
                disabled={!selectedIds.length}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#800020] px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                <Download size={16} />
                Download Selected ({selectedIds.length})
              </button>

              <button
                onClick={refreshOrders}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-[#fff3f6] px-4 py-3 text-sm font-semibold text-[#800020]">
            {error}
            <button onClick={clearError} className="ml-3 underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid gap-3 rounded-[28px] bg-white p-4 shadow-[0_18px_55px_rgba(0,0,0,0.045)] md:grid-cols-6">
          <Input
            icon
            placeholder="Search order #1001..."
            value={orderFilters.search}
            onChange={(e) =>
              setOrderFilters({ search: e.target.value, after: "" })
            }
          />

          <Select
            value={orderFilters.financialStatus}
            onChange={(e) =>
              setOrderFilters({ financialStatus: e.target.value, after: "" })
            }
          >
            <option value="">Payment Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="partially_refunded">Partially Refunded</option>
          </Select>

          <Select
            value={orderFilters.fulfillmentStatus}
            onChange={(e) =>
              setOrderFilters({ fulfillmentStatus: e.target.value, after: "" })
            }
          >
            <option value="">Fulfillment</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="unfulfilled">Unfulfilled</option>
            <option value="partial">Partial</option>
          </Select>

          <Input
            type="date"
            value={orderFilters.createdAfter}
            onChange={(e) =>
              setOrderFilters({ createdAfter: e.target.value, after: "" })
            }
          />

          <Input
            type="date"
            value={orderFilters.createdBefore}
            onChange={(e) =>
              setOrderFilters({ createdBefore: e.target.value, after: "" })
            }
          />

          <button
            onClick={searchOrders}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#800020] px-5 text-sm font-black text-white"
          >
            <Search size={15} />
            Search
          </button>
        </div>

        <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.045)]">
          <div className="flex flex-col gap-3 px-5 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-black">Shopify Orders</h2>
              <p className="text-sm font-bold text-neutral-400">
                Total: {orderCount || 0} · Imported on page: {importedCount}
              </p>
            </div>

            <button
              onClick={toggleAll}
              disabled={!orders.length}
              className="rounded-full bg-[#fff1f5] px-4 py-2 text-xs font-black text-[#800020] disabled:opacity-40"
            >
              {selectedIds.length === orders.length && orders.length
                ? "Clear All"
                : "Select All"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#faf9f8] text-[11px] uppercase tracking-wide text-neutral-400">
                  <th className="px-5 py-3">Select</th>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Fulfillment</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => {
                  const shopifyOrderId = shopifyGidToId(order.id);

                  return (
                    <ShopifyOrderRow
                      key={order.id}
                      order={order}
                      syncedInfo={importedOrderMap[shopifyOrderId]}
                      checked={selectedIds.includes(order.id)}
                      onToggle={() => toggleOrder(order.id)}
                      onPreview={() => setSelectedOrder(order)}
                      onPrint={() => printSingleInvoice(order)}
                    />
                  );
                })}

                {!loading && orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-10 text-center text-sm font-semibold text-neutral-400"
                    >
                      No Shopify orders found.
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-10 text-center text-sm font-semibold text-neutral-400"
                    >
                      Loading Shopify orders...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[24px] bg-white px-5 py-4 text-sm shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
          <p className="font-bold text-neutral-500">
            Showing {orders.length} of {orderCount || 0}
          </p>

          <button
            onClick={fetchNextOrders}
            disabled={!orderPageInfo?.hasNextPage || loading}
            className="rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Load Next
          </button>
        </div>
      </div>

      {selectedOrder && invoiceData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 print:hidden">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] bg-white">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-5 py-4 shadow-sm">
              <div>
                <p className="text-xs font-bold text-neutral-400">
                  Order {selectedOrder.name}
                </p>
                <h2 className="font-black text-black">Tax Invoice Preview</h2>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => printSingleInvoice(selectedOrder)}
                  className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-bold text-white"
                >
                  <Printer size={15} />
                  Download
                </button>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1f5] text-[#800020]"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="bg-[#f6f6f6] p-5">
              <InvoiceTemplate data={invoiceData} />
            </div>
          </div>
        </div>
      )}

      <div id="shopify-print-area" className="hidden print:block">
        {printOrders.map((order) => {
          const data = buildInvoiceDataFromShopify(order);

          return (
            <div key={order.id} className="invoice-print-page">
              <InvoiceTemplate data={data} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Input({ icon, className = "", ...props }) {
  return (
    <div className={`relative ${className}`}>
      {icon && (
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />
      )}

      <input
        {...props}
        className={`h-11 w-full rounded-full bg-[#faf9f8] px-4 text-sm font-semibold text-black outline-none placeholder:text-neutral-400 ${
          icon ? "pl-9" : ""
        }`}
      />
    </div>
  );
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="h-11 w-full rounded-full bg-[#faf9f8] px-4 text-sm font-semibold text-black outline-none"
    >
      {children}
    </select>
  );
}