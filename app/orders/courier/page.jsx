"use client";

import { useState } from "react";
import {
  Search,
  Loader2,
  PackageSearch,
  ShoppingBag,
  Globe2,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { useOrderStore } from "@/store/orderStore";
import OrderCourierDetailsCard from "@/components/orders/OrderCourierDetailsCard";

const normalizeOrderNumber = (value, type) => {
  const raw = String(value || "").trim();

  if (!raw) return "";

  // only numeric part
  const number = raw
    .replace(/^SHOP-?/i, "")
    .replace(/^MIRAY-?/i, "")
    .replace(/^#/, "")
    .replace(/\D/g, "");

  if (!number) return raw;

  if (type === "website") {
    return `MIRAY-${number.padStart(6, "0")}`;
  }

  return `SHOP-${number.padStart(4, "0")}`;
};

export default function CourierPage() {
  const { fetchAllOrders, loading } = useOrderStore();

  const [orderType, setOrderType] = useState("shopify");
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState(null);
  const [searched, setSearched] = useState(false);

  const normalizedSearch = normalizeOrderNumber(search, orderType);

  const searchOrder = async (value = search) => {
    const term = String(value || "").trim();

    if (!term) {
      toast.error("Enter order number");
      return;
    }

    const normalized = normalizeOrderNumber(term, orderType);

    try {
      setSearched(true);

      const orders = await fetchAllOrders({
        search: normalized,
        page: 1,
        limit: 10,
      });

      if (!orders?.length) {
        setOrder(null);
        toast.error(`Order ${normalized} not found`);
        return;
      }

      setOrder(orders[0]);
    } catch (error) {
      setOrder(null);
      toast.error(error?.message || "Failed to search order");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    searchOrder();
  };

  const changeType = (type) => {
    setOrderType(type);
    setOrder(null);
    setSearched(false);
  };

  const refreshOrder = () => {
    if (search.trim()) searchOrder(search);
  };

  const address = order?.shippingAddressSnapshot || {};

  return (
    <section className="min-h-screen bg-[#f6f7fb] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Courier Details
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Search an order and view shipment details.
          </p>
        </div>

        {/* SEARCH */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

          {/* ORDER TYPE */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold text-gray-500">
              Order Source
            </p>

            <div className="inline-flex rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => changeType("shopify")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  orderType === "shopify"
                    ? "bg-black text-white shadow-sm"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                <ShoppingBag size={15} />
                Shopify Order
              </button>

              <button
                type="button"
                onClick={() => changeType("website")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  orderType === "website"
                    ? "bg-black text-white shadow-sm"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                <Globe2 size={15} />
                Website Order
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  orderType === "shopify"
                    ? "Enter Shopify order e.g. 1234"
                    : "Enter website order e.g. 1234"
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-black/5"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !search.trim()}
              className="inline-flex min-w-[125px] items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Searching
                </>
              ) : (
                <>
                  <Search size={16} />
                  Search
                </>
              )}
            </button>
          </form>

          {/* NORMALIZED PREVIEW */}
          {search.trim() && (
            <p className="mt-3 text-xs text-gray-400">
              Searching as{" "}
              <span className="font-semibold text-gray-700">
                {normalizedSearch}
              </span>
            </p>
          )}
        </div>

        {/* ORDER */}
        {order && (
          <>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-[11px] font-medium uppercase text-gray-400">
                    Order
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {order.orderNumber || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase text-gray-400">
                    Source
                  </p>

                  <p className="mt-1 font-semibold capitalize text-gray-900">
                    {order.isShopify ? "Shopify" : "Website"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase text-gray-400">
                    Payment
                  </p>

                  <p className="mt-1 font-semibold uppercase text-gray-900">
                    {order.paymentMethod === "cod"
                      ? "COD"
                      : "PREPAID"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase text-gray-400">
                    Fulfillment
                  </p>

                  <p className="mt-1 font-semibold capitalize text-gray-900">
                    {String(
                      order.fulfillmentStatus || "-"
                    ).replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            </div>

            <OrderCourierDetailsCard
              order={order}
              onRefresh={refreshOrder}
            />

            {/* SHIPPING ADDRESS */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                Shipping Address
              </h2>

              <div className="text-sm leading-6 text-gray-600">
                <p className="font-semibold text-gray-900">
                  {address.fullName || "-"}
                </p>

                {address.line1 && <p>{address.line1}</p>}
                {address.line2 && <p>{address.line2}</p>}

                <p>
                  {[address.city, address.state, address.pincode]
                    .filter(Boolean)
                    .join(", ")}
                </p>

                {address.phone && (
                  <p className="mt-2">{address.phone}</p>
                )}

                {address.email && <p>{address.email}</p>}
              </div>
            </div>
          </>
        )}

        {/* EMPTY */}
        {!order && !loading && (
          <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-center">
            <PackageSearch
              size={38}
              className="mb-3 text-gray-300"
            />

            <p className="font-semibold text-gray-700">
              {searched
                ? "Order not found"
                : "Search Courier Details"}
            </p>

            <p className="mt-1 text-sm text-gray-400">
              {orderType === "shopify"
                ? "Shopify orders will be searched as SHOP-0000"
                : "Website orders will be searched as MIRAY-000000"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}   