"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, Download } from "lucide-react";
import * as XLSX from "xlsx";
import adminShopifyStore from "@/store/adminshopifystore";

export default function ShopifyCustomersPage() {
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });

  const {
    loading,
    error,
    customers,
    customerCount,
    customerPageInfo,
    customerFilters,
    setCustomerFilters,
    fetchShopifyCustomers,
    fetchNextCustomers,
    clearError,
  } = adminShopifyStore();

  useEffect(() => {
    fetchShopifyCustomers({ limit: 20, after: "" });
  }, [fetchShopifyCustomers]);

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

  const money = (amount, currency = "INR") =>
    amount || amount === 0
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(Number(amount))
      : "-";

  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => {
      const av =
        sort.key === "name"
          ? `${a.firstName || ""} ${a.lastName || ""}`
          : sort.key === "spent"
          ? Number(a?.amountSpent?.amount || 0)
          : sort.key === "orders"
          ? Number(a.numberOfOrders || 0)
          : a[sort.key];

      const bv =
        sort.key === "name"
          ? `${b.firstName || ""} ${b.lastName || ""}`
          : sort.key === "spent"
          ? Number(b?.amountSpent?.amount || 0)
          : sort.key === "orders"
          ? Number(b.numberOfOrders || 0)
          : b[sort.key];

      if (sort.dir === "asc") return av > bv ? 1 : -1;
      return av < bv ? 1 : -1;
    });
  }, [customers, sort]);

  const toggleSort = (key) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const exportExcel = () => {
    const rows = sortedCustomers.map((c) => ({
      Name:
        c.firstName || c.lastName
          ? `${c.firstName || ""} ${c.lastName || ""}`.trim()
          : "No Name",
      Email: c.email || "",
      Phone: c.phone || c?.defaultAddress?.phone || "",
      Orders: c.numberOfOrders || 0,
      Spent: Number(c?.amountSpent?.amount || 0),
      Currency: c?.amountSpent?.currencyCode || "INR",
      City: c?.defaultAddress?.city || "",
      State: c?.defaultAddress?.province || "",
      Pincode: c?.defaultAddress?.zip || "",
      Country: c?.defaultAddress?.country || "",
      CreatedAt: c.createdAt || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Shopify Customers");
    XLSX.writeFile(wb, "shopify-customers.xlsx");
  };

  return (
    <div className="min-h-screen bg-[#faf9f8] p-4 md:p-7">
      <div className="mx-auto max-w-7xl space-y-5">
        <Header
          title="Customers"
          subtitle="Shopify customer list with filters, sorting and Excel export."
          loading={loading}
          onRefresh={() => fetchShopifyCustomers({ after: "" })}
          onExport={exportExcel}
        />

        {error && <ErrorBox error={error} clearError={clearError} />}

        <div className="grid gap-3 rounded-[28px] bg-white p-4 shadow-[0_18px_55px_rgba(0,0,0,0.045)] md:grid-cols-5">
          <Input
            icon
            placeholder="Search customer..."
            value={customerFilters.search}
            onChange={(e) =>
              setCustomerFilters({ search: e.target.value, after: "" })
            }
          />

          <Input
            type="date"
            value={customerFilters.createdAfter}
            onChange={(e) =>
              setCustomerFilters({ createdAfter: e.target.value, after: "" })
            }
          />

          <Input
            type="date"
            value={customerFilters.createdBefore}
            onChange={(e) =>
              setCustomerFilters({ createdBefore: e.target.value, after: "" })
            }
          />

          <Select
            value={customerFilters.limit}
            onChange={(e) =>
              setCustomerFilters({ limit: e.target.value, after: "" })
            }
          >
            <option value="10">10 Rows</option>
            <option value="20">20 Rows</option>
            <option value="50">50 Rows</option>
            <option value="100">100 Rows</option>
          </Select>

          <button
            onClick={() => fetchShopifyCustomers({ after: "" })}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#800020] px-5 text-sm font-black text-white"
          >
            <Search size={15} />
            Search
          </button>
        </div>

        <TableCard title="Shopify Customers" count={customerCount}>
          <thead>
            <tr className="bg-[#faf9f8] text-[11px] uppercase tracking-wide text-neutral-400">
              <Th onClick={() => toggleSort("name")}>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th onClick={() => toggleSort("orders")}>Orders</Th>
              <Th onClick={() => toggleSort("spent")}>Spent</Th>
              <Th>Location</Th>
              <Th onClick={() => toggleSort("createdAt")}>Joined</Th>
            </tr>
          </thead>

          <tbody>
            {sortedCustomers.map((customer) => (
              <tr key={customer.id} className="transition hover:bg-[#fff9fb]">
                <Td bold>
                  {customer.firstName || customer.lastName
                    ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim()
                    : "No Name"}
                </Td>
                <Td>{customer.email || "-"}</Td>
                <Td>{customer.phone || customer?.defaultAddress?.phone || "-"}</Td>
                <Td>{customer.numberOfOrders || 0}</Td>
                <Td>
                  {money(
                    customer?.amountSpent?.amount,
                    customer?.amountSpent?.currencyCode
                  )}
                </Td>
                <Td>
                  {[customer?.defaultAddress?.city, customer?.defaultAddress?.province]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </Td>
                <Td>{formatDate(customer.createdAt)}</Td>
              </tr>
            ))}

            {!loading && sortedCustomers.length === 0 && (
              <EmptyRow colSpan={7} text="No Shopify customers found." />
            )}
          </tbody>
        </TableCard>

        <Pagination
          showing={customers.length}
          total={customerCount}
          loading={loading}
          hasNext={customerPageInfo?.hasNextPage}
          onNext={fetchNextCustomers}
        />
      </div>
    </div>
  );
}

/* shared mini components */

function Header({ title, subtitle, loading, onRefresh, onExport }) {
  return (
    <div className="rounded-[30px] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.055)] md:p-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#800020]">
            Shopify
          </p>
          <h1 className="mt-2 text-2xl font-black text-black">{title}</h1>
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 rounded-full bg-[#800020] px-5 py-3 text-sm font-bold text-white"
          >
            <Download size={16} />
            Excel
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>
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

function TableCard({ title, count, children }) {
  return (
    <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.045)]">
      <div className="flex items-center justify-between px-5 py-5">
        <h2 className="text-lg font-black text-black">{title}</h2>
        <p className="text-sm font-bold text-neutral-400">Total: {count || 0}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">{children}</table>
      </div>
    </div>
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
        Showing {showing} of {total || 0}
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
