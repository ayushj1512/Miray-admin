"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, RefreshCw, Package, Boxes } from "lucide-react";
import adminShopifyStore from "@/store/adminshopifystore";

export default function ShopifyProductDetailPage() {
  const params = useParams();
  const productName = decodeURIComponent(params.product_name || "");

  const {
    loading,
    error,
    products,
    fetchShopifyProducts,
    clearError,
  } = adminShopifyStore();

  useEffect(() => {
    fetchShopifyProducts({
      search: productName.replaceAll("-", " "),
      limit: 20,
      after: "",
    });
  }, [productName, fetchShopifyProducts]);

  const product = useMemo(() => {
    const normalized = productName.toLowerCase();

    return (
      products.find((p) => p.handle?.toLowerCase() === normalized) ||
      products.find((p) => p.title?.toLowerCase() === normalized) ||
      products[0]
    );
  }, [products, productName]);

  const variants = product?.variants?.edges?.map((edge) => edge.node) || [];

  const totalInventory = variants.reduce(
    (sum, variant) => sum + Number(variant.inventoryQuantity || 0),
    0
  );

  const money = (amount) =>
    amount || amount === 0
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(Number(amount))
      : "-";

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

  return (
    <div className="min-h-screen bg-[#faf9f8] p-4 md:p-7">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-[30px] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.055)] md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Link
                href="/shopify/products"
                className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-[#800020]"
              >
                <ArrowLeft size={16} />
                Back to Products
              </Link>

              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#800020]">
                Shopify Product
              </p>

              <h1 className="mt-2 text-2xl font-black text-black">
                {product?.title || "Product Detail"}
              </h1>

              <p className="mt-1 text-sm text-neutral-500">
                Product variants, price and inventory details.
              </p>
            </div>

            <button
              onClick={() =>
                fetchShopifyProducts({
                  search: productName.replaceAll("-", " "),
                  limit: 20,
                  after: "",
                })
              }
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

        {loading && (
          <div className="rounded-[28px] bg-white p-12 text-center text-sm font-semibold text-neutral-500 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
            Loading product...
          </div>
        )}

        {!loading && !product && (
          <div className="rounded-[28px] bg-white p-12 text-center text-sm font-semibold text-neutral-500 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
            Product not found.
          </div>
        )}

        {!loading && product && (
          <>
            <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
              <div className="rounded-[30px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.045)]">
                <img
                  src={
                    product?.featuredMedia?.preview?.image?.url ||
                    "/placeholder.png"
                  }
                  alt={product.title}
                  className="aspect-[4/5] w-full rounded-[24px] bg-neutral-100 object-cover"
                />
              </div>

              <div className="space-y-5">
                <div className="rounded-[30px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.045)] md:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-black">
                        {product.title}
                      </h2>
                      <p className="mt-1 text-sm font-semibold text-neutral-400">
                        {product.handle}
                      </p>
                    </div>

                    <Badge>{product.status}</Badge>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Stat
                      icon={<Package size={17} />}
                      label="Variants"
                      value={variants.length}
                    />
                    <Stat
                      icon={<Boxes size={17} />}
                      label="Inventory"
                      value={totalInventory}
                    />
                    <Stat label="Vendor" value={product.vendor || "-"} />
                    <Stat label="Type" value={product.productType || "-"} />
                  </div>

                  <div className="mt-6 grid gap-3 text-sm md:grid-cols-2">
                    <Info label="Created At" value={formatDate(product.createdAt)} />
                    <Info label="Updated At" value={formatDate(product.updatedAt)} />
                    <Info label="Product ID" value={product.id} />
                    <Info label="Handle" value={product.handle} />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.045)]">
              <div className="px-5 py-5">
                <h2 className="text-lg font-black text-black">Variants</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-[#faf9f8] text-[11px] uppercase tracking-wide text-neutral-400">
                      <th className="px-5 py-3">Variant</th>
                      <th className="px-5 py-3">SKU</th>
                      <th className="px-5 py-3">Price</th>
                      <th className="px-5 py-3">Compare Price</th>
                      <th className="px-5 py-3">Available</th>
                      <th className="px-5 py-3">Inventory</th>
                    </tr>
                  </thead>

                  <tbody>
                    {variants.map((variant) => (
                      <tr key={variant.id} className="transition hover:bg-[#fff9fb]">
                        <td className="whitespace-nowrap px-5 py-4 font-black text-black">
                          {variant.title}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-neutral-600">
                          {variant.sku || "-"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-bold text-black">
                          {money(variant.price)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-neutral-600">
                          {money(variant.compareAtPrice)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <Badge>
                            {variant.availableForSale ? "Available" : "Unavailable"}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-bold text-black">
                          {variant.inventoryQuantity || 0}
                        </td>
                      </tr>
                    ))}

                    {variants.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-10 text-center text-sm font-semibold text-neutral-400"
                        >
                          No variants found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-[22px] bg-[#faf9f8] p-4">
      {icon && (
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#fff1f5] text-[#800020]">
          {icon}
        </div>
      )}
      <p className="text-[11px] font-black uppercase tracking-wide text-neutral-400">
        {label}
      </p>
      <p className="mt-1 break-all text-lg font-black text-black">{value}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between gap-4 rounded-2xl bg-[#faf9f8] px-4 py-3">
      <span className="text-neutral-400">{label}</span>
      <span className="break-all text-right font-bold text-black">
        {value || "-"}
      </span>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex rounded-full bg-[#fff1f5] px-3 py-1.5 text-[11px] font-black uppercase text-[#800020]">
      {children || "-"}
    </span>
  );
}