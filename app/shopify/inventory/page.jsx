"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, Download } from "lucide-react";
import * as XLSX from "xlsx";
import adminShopifyStore from "@/store/adminshopifystore";

export default function ShopifyInventoryPage() {
  const [localSearch, setLocalSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [sort, setSort] = useState({ key: "inventory", dir: "desc" });

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
    fetchShopifyProducts({ limit: 50, after: "" });
  }, [fetchShopifyProducts]);

  const rows = useMemo(() => {
    return products.flatMap((product) =>
      (product?.variants?.edges || []).map((edge) => {
        const variant = edge.node;

        return {
          id: variant.id,
          productTitle: product.title,
          handle: product.handle,
          status: product.status,
          vendor: product.vendor,
          productType: product.productType,
          image: product?.featuredMedia?.preview?.image?.url,
          variantTitle: variant.title,
          sku: variant.sku || "",
          price: Number(variant.price || 0),
          compareAtPrice: Number(variant.compareAtPrice || 0),
          inventory: Number(variant.inventoryQuantity || 0),
          availableForSale: variant.availableForSale,
        };
      })
    );
  }, [products]);

  const filteredRows = useMemo(() => {
    let data = [...rows];

    if (localSearch) {
      const q = localSearch.toLowerCase();
      data = data.filter(
        (row) =>
          row.productTitle.toLowerCase().includes(q) ||
          row.variantTitle.toLowerCase().includes(q) ||
          row.sku.toLowerCase().includes(q) ||
          row.vendor?.toLowerCase().includes(q)
      );
    }

    if (stockFilter === "in_stock") {
      data = data.filter((row) => row.inventory > 0);
    }

    if (stockFilter === "zero") {
      data = data.filter((row) => row.inventory <= 0);
    }

    if (stockFilter === "available") {
      data = data.filter((row) => row.availableForSale);
    }

    if (stockFilter === "unavailable") {
      data = data.filter((row) => !row.availableForSale);
    }

    data.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];

      if (sort.dir === "asc") return av > bv ? 1 : -1;
      return av < bv ? 1 : -1;
    });

    return data;
  }, [rows, localSearch, stockFilter, sort]);

  const totalInventory = filteredRows.reduce(
    (sum, row) => sum + Number(row.inventory || 0),
    0
  );

  const toggleSort = (key) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const money = (amount) =>
    amount || amount === 0
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(Number(amount))
      : "-";

  const exportExcel = () => {
    const exportRows = filteredRows.map((row) => ({
      Product: row.productTitle,
      Handle: row.handle,
      Variant: row.variantTitle,
      SKU: row.sku,
      Status: row.status,
      Vendor: row.vendor,
      ProductType: row.productType,
      Price: row.price,
      CompareAtPrice: row.compareAtPrice,
      Inventory: row.inventory,
      AvailableForSale: row.availableForSale ? "Yes" : "No",
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Shopify Inventory");
    XLSX.writeFile(wb, "shopify-inventory.xlsx");
  };

  return (
    <div className="min-h-screen bg-[#faf9f8] p-4 md:p-7">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-[30px] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.055)] md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#800020]">
                Shopify Inventory
              </p>
              <h1 className="mt-2 text-2xl font-black text-black">Inventory</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Variant-wise inventory with filters, sorting and Excel export.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportExcel}
                className="inline-flex items-center gap-2 rounded-full bg-[#800020] px-5 py-3 text-sm font-bold text-white"
              >
                <Download size={16} />
                Excel
              </button>

              <button
                onClick={() => fetchShopifyProducts({ after: "" })}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {error && <ErrorBox error={error} clearError={clearError} />}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat title="Products Loaded" value={products.length} />
          <Stat title="Variants" value={rows.length} />
          <Stat title="Filtered Stock" value={totalInventory} />
          <Stat title="Total Products" value={productCount} />
        </div>

        <div className="grid gap-3 rounded-[28px] bg-white p-4 shadow-[0_18px_55px_rgba(0,0,0,0.045)] md:grid-cols-6">
          <Input
            icon
            placeholder="Local search SKU/product..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />

          <Select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
            <option value="">All Stock</option>
            <option value="in_stock">In Stock</option>
            <option value="zero">Zero Stock</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </Select>

          <Input
            placeholder="Shopify product search"
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

          <Select
            value={productFilters.limit}
            onChange={(e) =>
              setProductFilters({ limit: e.target.value, after: "" })
            }
          >
            <option value="20">20 Rows</option>
            <option value="50">50 Rows</option>
            <option value="100">100 Rows</option>
          </Select>

          <button
            onClick={() => fetchShopifyProducts({ after: "" })}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#800020] px-5 text-sm font-black text-white"
          >
            <Search size={15} />
            Search
          </button>
        </div>

        <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.045)]">
          <div className="flex items-center justify-between px-5 py-5">
            <h2 className="text-lg font-black text-black">Inventory</h2>
            <p className="text-sm font-bold text-neutral-400">
              Showing: {filteredRows.length}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#faf9f8] text-[11px] uppercase tracking-wide text-neutral-400">
                  <Th onClick={() => toggleSort("productTitle")}>Product</Th>
                  <Th onClick={() => toggleSort("variantTitle")}>Variant</Th>
                  <Th onClick={() => toggleSort("sku")}>SKU</Th>
                  <Th>Status</Th>
                  <Th onClick={() => toggleSort("price")}>Price</Th>
                  <Th onClick={() => toggleSort("inventory")}>Inventory</Th>
                  <Th>Available</Th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-[#fff9fb]">
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={row.image || "/placeholder.png"}
                          alt={row.productTitle}
                          className="h-11 w-11 rounded-xl bg-neutral-100 object-cover"
                        />
                        <div>
                          <p className="font-black text-black">{row.productTitle}</p>
                          <p className="text-xs text-neutral-400">{row.vendor || "-"}</p>
                        </div>
                      </div>
                    </td>

                    <Td>{row.variantTitle}</Td>
                    <Td>{row.sku || "-"}</Td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <Badge>{row.status}</Badge>
                    </td>
                    <Td bold>{money(row.price)}</Td>
                    <Td bold>{row.inventory}</Td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <Badge>{row.availableForSale ? "Yes" : "No"}</Badge>
                    </td>
                  </tr>
                ))}

                {!loading && filteredRows.length === 0 && (
                  <EmptyRow colSpan={7} text="No inventory rows found." />
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination
          showing={products.length}
          total={productCount}
          hasNext={productPageInfo?.hasNextPage}
          loading={loading}
          onNext={fetchNextProducts}
        />
      </div>
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_45px_rgba(0,0,0,0.045)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
        {title}
      </p>
      <h2 className="mt-1 text-3xl font-black text-black">{value || 0}</h2>
    </div>
  );
}

function Input({ icon, ...props }) {
  return (
    <div className="relative">
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

function Th({ children, onClick }) {
  return (
    <th
      onClick={onClick}
      className={`whitespace-nowrap px-5 py-3 font-black ${
        onClick ? "cursor-pointer hover:text-[#800020]" : ""
      }`}
    >
      {children}
    </th>
  );
}

function Td({ children, bold }) {
  return (
    <td
      className={`whitespace-nowrap px-5 py-4 text-neutral-600 ${
        bold ? "font-black text-black" : ""
      }`}
    >
      {children}
    </td>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex rounded-full bg-[#fff1f5] px-2.5 py-1 text-[11px] font-black uppercase text-[#800020]">
      {children || "-"}
    </span>
  );
}

function EmptyRow({ colSpan, text }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-5 py-10 text-center text-sm font-semibold text-neutral-400"
      >
        {text}
      </td>
    </tr>
  );
}

function Pagination({ showing, total, hasNext, loading, onNext }) {
  return (
    <div className="flex items-center justify-between rounded-[24px] bg-white px-5 py-4 text-sm shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
      <p className="font-bold text-neutral-500">
        Showing {showing} products of {total || 0}
      </p>

      <button
        onClick={onNext}
        disabled={!hasNext || loading}
        className="rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        Load Next
      </button>
    </div>
  );
}

function ErrorBox({ error, clearError }) {
  return (
    <div className="rounded-2xl bg-[#fff3f6] px-4 py-3 text-sm font-semibold text-[#800020]">
      {error}
      <button onClick={clearError} className="ml-3 underline">
        Dismiss
      </button>
    </div>
  );
}
