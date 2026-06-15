"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Search, RefreshCw, Eye } from "lucide-react";
import adminShopifyStore from "@/store/adminshopifystore";

export default function ShopifyProductsPage() {
  const {
    loading,
    error,
    products,
    productCount,
    productPageInfo,
    productFilters,
    setProductFilters,
    fetchShopifyProducts,
    fetchNextProducts,
    clearError,
  } = adminShopifyStore();

  useEffect(() => {
    fetchShopifyProducts({ limit: 20, after: "" });
  }, [fetchShopifyProducts]);

  const money = (amount) =>
    amount || amount === 0
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(Number(amount))
      : "-";

  const searchProducts = () => {
    fetchShopifyProducts({ after: "" });
  };

  return (
    <div className="min-h-screen bg-[#faf9f8] p-4 md:p-7">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-[30px] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.055)] md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#800020]">
                Shopify Products
              </p>
              <h1 className="mt-2 text-2xl font-black text-black">
                Products
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                View Shopify products, variants, prices and inventory.
              </p>
            </div>

            <button
              onClick={() => fetchShopifyProducts({ after: "" })}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
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
            placeholder="Search product..."
            value={productFilters.search}
            onChange={(e) =>
              setProductFilters({ search: e.target.value, after: "" })
            }
          />

          <Select
            value={productFilters.status}
            onChange={(e) =>
              setProductFilters({ status: e.target.value, after: "" })
            }
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </Select>

          <Input
            placeholder="Vendor"
            value={productFilters.vendor}
            onChange={(e) =>
              setProductFilters({ vendor: e.target.value, after: "" })
            }
          />

          <Input
            placeholder="Product type"
            value={productFilters.productType}
            onChange={(e) =>
              setProductFilters({ productType: e.target.value, after: "" })
            }
          />

          <Select
            value={productFilters.limit}
            onChange={(e) =>
              setProductFilters({ limit: e.target.value, after: "" })
            }
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </Select>

          <button
            onClick={searchProducts}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#800020] px-5 text-sm font-black text-white"
          >
            <Search size={15} />
            Search
          </button>
        </div>

        <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.045)]">
          <div className="flex items-center justify-between px-5 py-5">
            <h2 className="text-lg font-black text-black">Shopify Products</h2>
            <p className="text-sm font-bold text-neutral-400">
              Total: {productCount || 0}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#faf9f8] text-[11px] uppercase tracking-wide text-neutral-400">
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Vendor</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Inventory</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const firstVariant = product?.variants?.edges?.[0]?.node;
                  const inventory = product?.variants?.edges?.reduce(
                    (sum, edge) =>
                      sum + Number(edge.node.inventoryQuantity || 0),
                    0
                  );

                  return (
                    <tr key={product.id} className="transition hover:bg-[#fff9fb]">
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              product?.featuredMedia?.preview?.image?.url ||
                              "/placeholder.png"
                            }
                            alt={product.title}
                            className="h-12 w-12 rounded-xl bg-neutral-100 object-cover"
                          />
                          <div>
                            <p className="font-black text-black">
                              {product.title}
                            </p>
                            <p className="text-xs text-neutral-400">
                              {product.handle}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <Badge>{product.status}</Badge>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-neutral-600">
                        {product.vendor || "-"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-neutral-600">
                        {product.productType || "-"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-bold text-black">
                        {money(firstVariant?.price)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-bold text-black">
                        {inventory}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <Link
                          href={`/shopify/products/${encodeURIComponent(
                            product.handle || product.title
                          )}`}
                          className="inline-flex items-center gap-1 rounded-full bg-black px-4 py-2 text-xs font-black text-white"
                        >
                          <Eye size={13} />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {!loading && products.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-sm font-semibold text-neutral-400"
                    >
                      No Shopify products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[24px] bg-white px-5 py-4 text-sm shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
          <p className="font-bold text-neutral-500">
            Showing {products.length} of {productCount || 0}
          </p>

          <button
            onClick={fetchNextProducts}
            disabled={!productPageInfo?.hasNextPage || loading}
            className="rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Load Next
          </button>
        </div>
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

function Badge({ children }) {
  return (
    <span className="inline-flex rounded-full bg-[#fff1f5] px-2.5 py-1 text-[11px] font-black uppercase text-[#800020]">
      {children || "-"}
    </span>
  );
}