// ------------------------------
// SIDEBAR MENUS
// ------------------------------

export const sidebarMenus = {
  dashboard: [
    { label: "Welcome", href: "/dashboard" },
    { label: "Analytics Overview", href: "/dashboard/analytics" },
  ],

  designing: [
    { label: "Design Home", href: "/designing" },
    { label: "Banners Manager", href: "/designing/banners" },
    { label: "Homepage Layout", href: "/designing/homepage" },
    { label: "Themes & Colors", href: "/designing/themes" },
    { label: "Collections Editor", href: "/designing/collections" },
    { label: "Product Badges", href: "/designing/badges" },
  ],

  // ⭐ NEW — PRODUCTION / TAILORING MODULE
  production: [
    { label: "Production Dashboard", href: "/production" },
    { label: "Work Orders", href: "/production/work-orders" },
    { label: "Cutting", href: "/production/cutting" },
    { label: "Stitching", href: "/production/stitching" },
    { label: "Tailor Assignment", href: "/production/assignments" },
    { label: "QC & Finishing", href: "/production/qc" },
    { label: "Production Reports", href: "/production/reports" },
  ],

  accounts: [
    { label: "Accounts Dashboard", href: "/accounts" },
    { label: "Transactions", href: "/accounts/transactions" },
    { label: "Payouts", href: "/accounts/payouts" },
    { label: "Invoice Management", href: "/accounts/invoices" },
    { label: "GST Reports", href: "/accounts/gst" },
    { label: "Vendor Ledger", href: "/accounts/vendor-ledger" },
  ],

  inventory: [
    { label: "Inventory Dashboard", href: "/inventory" },
    { label: "All Inventory", href: "/inventory/list" },
    { label: "Stock Alerts", href: "/inventory/alerts" },
    { label: "Variants Manager", href: "/inventory/variants" },
    { label: "Categories Manager", href: "/inventory/categories" },
    { label: "Bulk Upload", href: "/inventory/bulk-upload" },
  ],

  operations: [
    { label: "Ops Dashboard", href: "/operations" },
    { label: "Order Processing", href: "/operations/order-processing" },
    { label: "Shipments", href: "/operations/shipments" },
    { label: "Returns & RTO", href: "/operations/returns" },
    { label: "Packing Manager", href: "/operations/packing" },
    { label: "Courier Partners", href: "/operations/couriers" },
  ],

  it_systems: [
    { label: "IT Dashboard", href: "/it" },
    { label: "Integrations", href: "/it/integrations" },
    { label: "API Keys", href: "/it/api-keys" },
    { label: "Backup & Restore", href: "/it/backups" },
    { label: "Error Logs", href: "/it/logs" },
    { label: "System Monitor", href: "/it/monitor" },
  ],

  marketing: [
    { label: "Marketing Dashboard", href: "/marketing" },
    { label: "Campaigns", href: "/marketing/campaigns" },
    { label: "Coupons & Discounts", href: "/marketing/coupons" },
    { label: "SEO Tools", href: "/marketing/seo" },
    { label: "Social Media", href: "/marketing/social" },
    { label: "Email Marketing", href: "/marketing/email" },
  ],

 customers: [
  { label: "Customer List", href: "/customers" },
  { label: "Customer Groups", href: "/customers/groups" },
  { label: "Abandoned Carts", href: "/customers/carts" },
  { label: "Reviews Manager", href: "/customers/reviews" },
  { label: "Tickets & Support", href: "/customers/support" },
  { label: "Newsletter Subscribers", href: "/customers/newsletter" }, // ⭐ NEW
],


  sales: [
    { label: "Sales Dashboard", href: "/sales" },
    { label: "Orders", href: "/sales/orders" },
    { label: "Revenue Reports", href: "/sales/reports" },
    { label: "Returns Summary", href: "/sales/returns" },
    { label: "COD vs Prepaid", href: "/sales/payment-type" },
  ],

  account_user: [
    { label: "Profile", href: "/account/profile" },
    { label: "Change Password", href: "/account/password" },
    { label: "Logout", href: "/logout" },
  ],
};

// ------------------------------
// ROUTE → SIDEBAR CATEGORY
// ------------------------------

export const routeSidebarMap = [
  { prefix: "/dashboard", key: "dashboard" },
  { prefix: "/designing", key: "designing" },

  // ⭐ NEW PRODUCTION ROUTE MAP
  { prefix: "/production", key: "production" },

  { prefix: "/accounts", key: "accounts" },
  { prefix: "/inventory", key: "inventory" },
  { prefix: "/operations", key: "operations" },
  { prefix: "/it", key: "it_systems" },
  { prefix: "/marketing", key: "marketing" },
  { prefix: "/customers", key: "customers" },
  { prefix: "/sales", key: "sales" },
  { prefix: "/account", key: "account_user" },
];
