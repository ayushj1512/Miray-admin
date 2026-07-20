"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Package,
  ShoppingBag,
  Users,
  Boxes,
  RefreshCw,
  Search,
  IndianRupee,
  CreditCard,
  Banknote,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import adminShopifyStore from "@/store/adminshopifystore";
import ImportShopifyOrdersButton from "@/components/shopify/ImportShopifyOrdersButton";
import ShopifyAnalyticsSummary from "@/components/shopify/ShopifyAnalyticsSummary";
import ShopifyCommandCenter from "@/components/shopify/ShopifyCommandCenter";

const accent = "#800020";
const tabs = ["Overview", "Products", "Orders", "Customers", "Inventory"];

export default function ShopifyDashboardPage() {
  const [activeTab, setActiveTab] = useState("Overview");

  const {
    loading,
    error,
    shop,
    products,
    orders,
    customers,

    productCount,
    orderCount,
    customerCount,
    inventoryCount,
    shopifyStats,

    productPageInfo,
    orderPageInfo,
    customerPageInfo,

    productFilters,
    orderFilters,
    customerFilters,

    setProductFilters,
    setOrderFilters,
    setCustomerFilters,

    fetchShopifyDashboard,
    fetchShopifyProducts,
    fetchShopifyOrders,
    fetchShopifyCustomers,

    fetchNextProducts,
    fetchNextOrders,
    fetchNextCustomers,

    clearError,
  } = adminShopifyStore();

  useEffect(() => {
    fetchShopifyDashboard(10);
  }, [fetchShopifyDashboard]);

  const inventoryRows = useMemo(() => {
    return products.flatMap((product) =>
      (product?.variants?.edges || []).map((edge) => ({
        productTitle: product.title,
        productStatus: product.status,
        image: product?.featuredMedia?.preview?.image?.url,
        variant: edge.node,
      }))
    );
  }, [products]);

  const fallbackInventory = inventoryRows.reduce(
    (sum, row) => sum + Number(row.variant?.inventoryQuantity || 0),
    0
  );

  const totalInventory = inventoryCount || fallbackInventory;

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

  const statMoney = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

  const handleTab = async (tab) => {
    setActiveTab(tab);

    if (tab === "Products") await fetchShopifyProducts({ after: "" });
    if (tab === "Orders") await fetchShopifyOrders({ after: "" });
    if (tab === "Customers") await fetchShopifyCustomers({ after: "" });
    if (tab === "Inventory") await fetchShopifyProducts({ after: "" });
  };

  return (
    <div className="min-h-screen bg-[#faf9f8] p-4 md:p-7">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[32px] bg-white px-5 py-6 shadow-[0_24px_70px_rgba(0,0,0,0.055)] md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p
                className="text-[11px] font-black uppercase tracking-[0.26em]"
                style={{ color: accent }}
              >
                Shopify Admin
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-black md:text-3xl">
                Miray Store Dashboard
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Live Shopify products, orders, customers and inventory.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
                onClick={() => fetchShopifyDashboard(10)}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl bg-[#fff3f6] px-4 py-3 text-sm font-semibold text-[#800020]">
            {typeof error === "string"
              ? error
              : error?.message
                ? error.message
                : error?.errors
                  ? Array.isArray(error.errors)
                    ? error.errors.join(", ")
                    : JSON.stringify(error.errors)
                  : JSON.stringify(error)}

            <button onClick={clearError} className="ml-3 underline">
              Dismiss
            </button>
          </div>
        )}

        {/* <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat icon={<Package size={18} />} title="Products" value={productCount} />
          <Stat icon={<ShoppingBag size={18} />} title="Orders" value={orderCount} />
          <Stat icon={<Users size={18} />} title="Customers" value={customerCount} />
          <Stat icon={<Boxes size={18} />} title="Inventory" value={totalInventory} />

          <Stat
            icon={<IndianRupee size={18} />}
            title="Total Revenue"
            value={statMoney(shopifyStats?.totalRevenue)}
          />

          <Stat
            icon={<TrendingUp size={18} />}
            title="AOV"
            value={statMoney(shopifyStats?.aov)}
          />

          <Stat
            icon={<CreditCard size={18} />}
            title="Paid Orders"
            value={shopifyStats?.paidOrders || 0}
          />

          <Stat
            icon={<Banknote size={18} />}
            title="COD Orders"
            value={shopifyStats?.codOrders || 0}
          />

          <Stat
            icon={<CalendarDays size={18} />}
            title="Today Orders"
            value={shopifyStats?.todayOrders || 0}
          />

          <Stat
            icon={<IndianRupee size={18} />}
            title="Month Revenue"
            value={statMoney(shopifyStats?.thisMonthRevenue)}
          />
        </div> */}
        <ShopifyCommandCenter stats={shopifyStats} />

        <div className="rounded-full bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTab(tab)}
                className="whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition"
                style={{
                  background: activeTab === tab ? accent : "transparent",
                  color: activeTab === tab ? "#fff" : "#525252",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="rounded-[28px] bg-white p-12 text-center text-sm font-semibold text-neutral-500 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
            Loading Shopify data...
          </div>
        )}

        {!loading && activeTab === "Overview" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <ShopCard shop={shop} />
            <RecentOrders orders={orders} money={money} formatDate={formatDate} />
            <RecentProducts products={products} money={money} />
            <RecentCustomers customers={customers} money={money} />
          </div>
        )}

        {!loading && activeTab === "Products" && (
          <>
            <ProductsFilters
              filters={productFilters}
              setFilters={setProductFilters}
              onSearch={() => fetchShopifyProducts({ after: "" })}
            />
            <ProductsTable products={products} money={money} />
            <Pagination
              pageInfo={productPageInfo}
              onNext={fetchNextProducts}
              count={productCount}
            />
          </>
        )}

        {!loading && activeTab === "Orders" && (
          <>
            <OrdersFilters
              filters={orderFilters}
              setFilters={setOrderFilters}
              onSearch={() => fetchShopifyOrders({ after: "" })}
            />
            <OrdersTable orders={orders} money={money} formatDate={formatDate} />
            <Pagination
              pageInfo={orderPageInfo}
              onNext={fetchNextOrders}
              count={orderCount}
            />
          </>
        )}

        {!loading && activeTab === "Customers" && (
          <>
            <CustomersFilters
              filters={customerFilters}
              setFilters={setCustomerFilters}
              onSearch={() => fetchShopifyCustomers({ after: "" })}
            />
            <CustomersTable
              customers={customers}
              money={money}
              formatDate={formatDate}
            />
            <Pagination
              pageInfo={customerPageInfo}
              onNext={fetchNextCustomers}
              count={customerCount}
            />
          </>
        )}

        {!loading && activeTab === "Inventory" && (
          <>
            <ProductsFilters
              filters={productFilters}
              setFilters={setProductFilters}
              onSearch={() => fetchShopifyProducts({ after: "" })}
            />
            <InventoryTable rows={inventoryRows} />
            <Pagination
              pageInfo={productPageInfo}
              onNext={fetchNextProducts}
              count={productCount}
            />
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, title, value }) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_45px_rgba(0,0,0,0.045)]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1f5] text-[#800020]">
        {icon}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
        {title}
      </p>
      <h2 className="mt-1 text-3xl font-black text-black">{value || 0}</h2>
    </div>
  );
}

function ShopCard({ shop }) {
  return (
    <Card title="Store Details">
      <Info label="Store Name" value={shop?.name} />
      <Info label="Domain" value={shop?.myshopifyDomain} />
      <Info label="Email" value={shop?.email} />
      <Info label="Primary URL" value={shop?.primaryDomain?.url} />
    </Card>
  );
}

function ProductsFilters({ filters, setFilters, onSearch }) {
  return (
    <FilterCard>
      <Input
        icon
        placeholder="Search product..."
        value={filters.search}
        onChange={(e) => setFilters({ search: e.target.value, after: "" })}
      />

      <Select
        value={filters.status}
        onChange={(e) => setFilters({ status: e.target.value, after: "" })}
      >
        <option value="">All Status</option>
        <option value="ACTIVE">Active</option>
        <option value="DRAFT">Draft</option>
        <option value="ARCHIVED">Archived</option>
      </Select>

      <Input
        placeholder="Vendor"
        value={filters.vendor}
        onChange={(e) => setFilters({ vendor: e.target.value, after: "" })}
      />

      <Input
        placeholder="Product type"
        value={filters.productType}
        onChange={(e) => setFilters({ productType: e.target.value, after: "" })}
      />

      <Select
        value={filters.limit}
        onChange={(e) => setFilters({ limit: e.target.value, after: "" })}
      >
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="50">50</option>
      </Select>

      <SearchButton onClick={onSearch} />
    </FilterCard>
  );
}

function OrdersFilters({ filters, setFilters, onSearch }) {
  return (
    <FilterCard>
      <Input
        icon
        placeholder="Search order #1001..."
        value={filters.search}
        onChange={(e) => setFilters({ search: e.target.value, after: "" })}
      />

      <Select
        value={filters.financialStatus}
        onChange={(e) =>
          setFilters({ financialStatus: e.target.value, after: "" })
        }
      >
        <option value="">Payment Status</option>
        <option value="paid">Paid</option>
        <option value="pending">Pending</option>
        <option value="refunded">Refunded</option>
        <option value="partially_refunded">Partially Refunded</option>
      </Select>

      <Select
        value={filters.fulfillmentStatus}
        onChange={(e) =>
          setFilters({ fulfillmentStatus: e.target.value, after: "" })
        }
      >
        <option value="">Fulfillment</option>
        <option value="fulfilled">Fulfilled</option>
        <option value="unfulfilled">Unfulfilled</option>
        <option value="partial">Partial</option>
      </Select>

      <Input
        type="date"
        value={filters.createdAfter}
        onChange={(e) => setFilters({ createdAfter: e.target.value, after: "" })}
      />

      <Input
        type="date"
        value={filters.createdBefore}
        onChange={(e) =>
          setFilters({ createdBefore: e.target.value, after: "" })
        }
      />

      <SearchButton onClick={onSearch} />
    </FilterCard>
  );
}

function CustomersFilters({ filters, setFilters, onSearch }) {
  return (
    <FilterCard>
      <Input
        icon
        placeholder="Search customer..."
        value={filters.search}
        onChange={(e) => setFilters({ search: e.target.value, after: "" })}
      />

      <Input
        type="date"
        value={filters.createdAfter}
        onChange={(e) => setFilters({ createdAfter: e.target.value, after: "" })}
      />

      <Input
        type="date"
        value={filters.createdBefore}
        onChange={(e) =>
          setFilters({ createdBefore: e.target.value, after: "" })
        }
      />

      <Select
        value={filters.limit}
        onChange={(e) => setFilters({ limit: e.target.value, after: "" })}
      >
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="50">50</option>
      </Select>

      <SearchButton onClick={onSearch} />
    </FilterCard>
  );
}

function RecentOrders({ orders, money, formatDate }) {
  return (
    <Card title="Recent Orders">
      <div className="space-y-2">
        {orders.slice(0, 5).map((order) => (
          <Row key={order.id}>
            <div>
              <p className="font-black text-black">{order.name}</p>
              <p className="text-xs text-neutral-400">{formatDate(order.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-black">
                {money(
                  order?.totalPriceSet?.shopMoney?.amount,
                  order?.totalPriceSet?.shopMoney?.currencyCode
                )}
              </p>
              <Badge>{order.displayFinancialStatus}</Badge>
            </div>
          </Row>
        ))}
      </div>
    </Card>
  );
}

function RecentProducts({ products, money }) {
  return (
    <Card title="Recent Products">
      <div className="space-y-2">
        {products.slice(0, 5).map((product) => {
          const firstVariant = product?.variants?.edges?.[0]?.node;

          return (
            <Row key={product.id}>
              <div className="flex min-w-0 items-center gap-3">
                <Img src={product?.featuredMedia?.preview?.image?.url} />
                <div className="min-w-0">
                  <p className="truncate font-black text-black">{product.title}</p>
                  <p className="text-xs text-neutral-400">{product.status}</p>
                </div>
              </div>
              <p className="font-black text-black">{money(firstVariant?.price)}</p>
            </Row>
          );
        })}
      </div>
    </Card>
  );
}

function RecentCustomers({ customers, money }) {
  return (
    <Card title="Recent Customers">
      <div className="space-y-2">
        {customers.slice(0, 5).map((customer) => (
          <Row key={customer.id}>
            <div>
              <p className="font-black text-black">
                {customer.firstName || customer.lastName
                  ? `${customer.firstName || ""} ${customer.lastName || ""}`
                  : "No Name"}
              </p>
              <p className="text-xs text-neutral-400">{customer.email || "-"}</p>
            </div>
            <div className="text-right">
              <p className="font-black text-black">{customer.numberOfOrders || 0}</p>
              <p className="text-xs text-neutral-400">
                {money(customer?.amountSpent?.amount)}
              </p>
            </div>
          </Row>
        ))}
      </div>
    </Card>
  );
}

function ProductsTable({ products, money }) {
  return (
    <Table title="Products">
      <thead>
        <TrHead>
          <Th>Product</Th>
          <Th>Status</Th>
          <Th>Vendor</Th>
          <Th>Type</Th>
          <Th>Price</Th>
          <Th>Inventory</Th>
        </TrHead>
      </thead>
      <tbody>
        {products.map((product) => {
          const firstVariant = product?.variants?.edges?.[0]?.node;
          const inventory = product?.variants?.edges?.reduce(
            (sum, edge) => sum + Number(edge.node.inventoryQuantity || 0),
            0
          );

          return (
            <Tr key={product.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <Img src={product?.featuredMedia?.preview?.image?.url} />
                  <b className="text-black">{product.title}</b>
                </div>
              </Td>
              <Td>
                <Badge>{product.status}</Badge>
              </Td>
              <Td>{product.vendor || "-"}</Td>
              <Td>{product.productType || "-"}</Td>
              <Td>{money(firstVariant?.price)}</Td>
              <Td>{inventory}</Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}

function OrdersTable({ orders, money, formatDate }) {
  return (
    <Table title="Orders">
      <thead>
        <TrHead>
          <Th>Order</Th>
          <Th>Customer</Th>
          <Th>Date</Th>
          <Th>Payment</Th>
          <Th>Fulfillment</Th>
          <Th>Total</Th>
        </TrHead>
      </thead>
      <tbody>
        {orders.map((order) => (
          <Tr key={order.id}>
            <Td>
              <b className="text-black">{order.name}</b>
            </Td>
            <Td>
              {order.customer
                ? `${order.customer.firstName || ""} ${order.customer.lastName || ""
                }`
                : "-"}
            </Td>
            <Td>{formatDate(order.createdAt)}</Td>
            <Td>
              <Badge>{order.displayFinancialStatus}</Badge>
            </Td>
            <Td>{order.displayFulfillmentStatus || "-"}</Td>
            <Td>
              {money(
                order?.totalPriceSet?.shopMoney?.amount,
                order?.totalPriceSet?.shopMoney?.currencyCode
              )}
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

function CustomersTable({ customers, money, formatDate }) {
  return (
    <Table title="Customers">
      <thead>
        <TrHead>
          <Th>Name</Th>
          <Th>Email</Th>
          <Th>Phone</Th>
          <Th>Orders</Th>
          <Th>Spent</Th>
          <Th>Joined</Th>
        </TrHead>
      </thead>
      <tbody>
        {customers.map((customer) => (
          <Tr key={customer.id}>
            <Td>
              <b className="text-black">
                {customer.firstName || customer.lastName
                  ? `${customer.firstName || ""} ${customer.lastName || ""}`
                  : "No Name"}
              </b>
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
            <Td>{formatDate(customer.createdAt)}</Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

function InventoryTable({ rows }) {
  return (
    <Table title="Inventory">
      <thead>
        <TrHead>
          <Th>Product</Th>
          <Th>Variant</Th>
          <Th>SKU</Th>
          <Th>Status</Th>
          <Th>Available</Th>
          <Th>Qty</Th>
        </TrHead>
      </thead>
      <tbody>
        {rows.map((row) => (
          <Tr key={row.variant.id}>
            <Td>
              <div className="flex items-center gap-3">
                <Img src={row.image} />
                <b className="text-black">{row.productTitle}</b>
              </div>
            </Td>
            <Td>{row.variant.title}</Td>
            <Td>{row.variant.sku || "-"}</Td>
            <Td>
              <Badge>{row.productStatus}</Badge>
            </Td>
            <Td>{row.variant.availableForSale ? "Yes" : "No"}</Td>
            <Td>{row.variant.inventoryQuantity || 0}</Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,0.045)]">
      <h3 className="mb-4 text-base font-black text-black">{title}</h3>
      {children}
    </div>
  );
}

function Table({ title, children }) {
  return (
    <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.045)]">
      <div className="px-5 py-5">
        <h3 className="text-lg font-black text-black">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">{children}</table>
      </div>
    </div>
  );
}

function FilterCard({ children }) {
  return (
    <div className="grid gap-3 rounded-[28px] bg-white p-4 shadow-[0_18px_55px_rgba(0,0,0,0.045)] md:grid-cols-6">
      {children}
    </div>
  );
}

function Pagination({ pageInfo, onNext, count }) {
  return (
    <div className="flex items-center justify-between rounded-[24px] bg-white px-5 py-4 text-sm shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
      <p className="font-bold text-neutral-500">Total: {count || 0}</p>

      <button
        onClick={onNext}
        disabled={!pageInfo?.hasNextPage}
        className="rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

function Row({ children }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#faf9f8] px-4 py-3">
      {children}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-neutral-400">{label}</span>
      <span className="text-right font-bold text-black">{value || "-"}</span>
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
        className={`h-11 w-full rounded-full bg-[#faf9f8] px-4 text-sm font-semibold text-black outline-none placeholder:text-neutral-400 ${icon ? "pl-9" : ""
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

function SearchButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#800020] px-5 text-sm font-black text-white"
    >
      <Search size={15} />
      Search
    </button>
  );
}

function Img({ src }) {
  return (
    <img
      src={src || "/placeholder.png"}
      alt="Shopify"
      className="h-11 w-11 rounded-xl bg-neutral-100 object-cover"
    />
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex rounded-full bg-[#fff1f5] px-2.5 py-1 text-[11px] font-black uppercase text-[#800020]">
      {children || "-"}
    </span>
  );
}

function TrHead({ children }) {
  return (
    <tr className="bg-[#faf9f8] text-[11px] uppercase tracking-wide text-neutral-400">
      {children}
    </tr>
  );
}

function Tr({ children }) {
  return <tr className="transition hover:bg-[#fff9fb]">{children}</tr>;
}

function Th({ children }) {
  return <th className="whitespace-nowrap px-5 py-3 font-black">{children}</th>;
}

function Td({ children }) {
  return <td className="whitespace-nowrap px-5 py-4 text-neutral-600">{children}</td>;
}
