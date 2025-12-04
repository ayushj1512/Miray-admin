// ------------------------------
// SIDEBAR MENUS
// ------------------------------

export const sidebarMenus = {
  dashboard: [{ label: "Welcome", href: "/dashboard" }, { label: "Analytics Overview", href: "/dashboard/analytics" }, { label: "Sales Snapshot", href: "/dashboard/sales" }, { label: "Quick Actions", href: "/dashboard/actions" }],

  designing: [{ label: "Design Home", href: "/designing" }, { label: "Banners Manager", href: "/designing/banners" }, { label: "Homepage Layout", href: "/designing/homepage" }, { label: "Themes & Colors", href: "/designing/themes" }, { label: "Collections Editor", href: "/designing/collections" }, { label: "Product Badges", href: "/designing/badges" }, { label: "Topbar / Announcements", href: "/designing/topbar" }, { label: "Footer Links", href: "/designing/footer" }],

  production: [{ label: "Production Dashboard", href: "/production" }, { label: "Work Orders", href: "/production/work-orders" }, { label: "Cutting", href: "/production/cutting" }, { label: "Stitching", href: "/production/stitching" }, { label: "Tailor Assignment", href: "/production/assignments" }, { label: "QC & Finishing", href: "/production/qc" }, { label: "Production Reports", href: "/production/reports" }, { label: "Materials / Fabrics", href: "/production/materials" }],

  accounts: [{ label: "Accounts Dashboard", href: "/accounts" }, { label: "Transactions", href: "/accounts/transactions" }, { label: "Payouts", href: "/accounts/payouts" }, { label: "Invoice Management", href: "/accounts/invoices" }, { label: "GST Reports", href: "/accounts/gst" }, { label: "Vendor Ledger", href: "/accounts/vendor-ledger" }, { label: "COD Reconciliation", href: "/accounts/cod" }, { label: "Refunds Ledger", href: "/accounts/refunds" }],

  // ✅ UPDATED: inventory (Barcodes added)
  inventory: [
    { label: "Inventory Dashboard", href: "/inventory" },
    { label: "All Inventory", href: "/inventory/list" },
    { label: "Stock Alerts", href: "/inventory/alerts" },
    { label: "Variants Manager", href: "/inventory/variants" },
    { label: "Categories Manager", href: "/inventory/categories" },
    { label: "Bulk Upload", href: "/inventory/bulk-upload" },
    { label: "Purchase Invoices", href: "/inventory/purchase" },
    { label: "Stock Movement", href: "/inventory/movements" },

    // ✅ NEW: Barcode menus under Inventory
    { label: "Barcodes Dashboard", href: "/inventory/barcodes" },
    { label: "Generate Barcode", href: "/inventory/barcodes/generate" },
    { label: "Barcode Items (Saved)", href: "/inventory/barcodes/items" },
    { label: "Scan / Lookup", href: "/inventory/barcodes/scan" },
    { label: "Print Labels", href: "/inventory/barcodes/print" } // optional but recommended
  ],

  media: [{ label: "Media Library", href: "/media" }, { label: "Upload Media", href: "/media/upload" }, { label: "Folders", href: "/media/folders" }],

  blogs: [{ label: "Blogs Dashboard", href: "/blogs" }, { label: "All Blogs", href: "/blogs/all" }, { label: "Create Blog", href: "/blogs/create" }, { label: "Categories", href: "/blogs/categories" }, { label: "Drafts", href: "/blogs/drafts" }, { label: "SEO (Blogs)", href: "/blogs/seo" }, { label: "Comments / Moderation", href: "/blogs/comments" }],

  products: [{ label: "Product Dashboard", href: "/products" }, { label: "Add New Product", href: "/products/add" }, { label: "Manage Products", href: "/products/manage" }, { label: "Categories", href: "/products/category" }, { label: "Subcategories", href: "/products/subcategories" }, { label: "Attributes", href: "/products/attributes" }, { label: "Variants", href: "/products/variants" }, { label: "Tags", href: "/products/tags" }, { label: "Brands", href: "/products/brands" }, { label: "Collections", href: "/products/collections" }, { label: "Bulk Import", href: "/products/bulk-import" }, { label: "Bulk Export", href: "/products/bulk-export" }, { label: "Media Library", href: "/media" }, { label: "Offers & Discounts", href: "/products/offers" }, { label: "SEO Manager", href: "/products/seo" }, { label: "Reviews & Ratings", href: "/products/reviews" }, { label: "Inventory Sync", href: "/products/inventory-sync" }, { label: "Price Updates", href: "/products/pricing" }],

  orders: [{ label: "Orders Dashboard", href: "/orders" }, { label: "All Orders", href: "/orders/all" }, { label: "Pending Orders", href: "/orders/pending" }, { label: "Processing", href: "/orders/processing" }, { label: "Shipped", href: "/orders/shipped" }, { label: "Delivered", href: "/orders/delivered" }, { label: "Returned / Cancelled", href: "/orders/returns" }, { label: "RTO / NDR", href: "/orders/rto" }, { label: "Order Tags", href: "/orders/tags" }],

  coupons: [{ label: "Coupons Dashboard", href: "/coupons" }, { label: "Create Coupon", href: "/coupons/create" }, { label: "Manage Coupons", href: "/coupons/manage" }, { label: "Coupon Usage Reports", href: "/coupons/reports" }, { label: "Auto Discounts", href: "/coupons/auto" }],

  operations: [{ label: "Ops Dashboard", href: "/operations" }, { label: "Order Processing", href: "/operations/order-processing" }, { label: "Shipments", href: "/operations/shipments" }, { label: "Returns & RTO", href: "/operations/returns" }, { label: "Packing Manager", href: "/operations/packing" }, { label: "Courier Partners", href: "/operations/couriers" }, { label: "Manifest / Dispatch", href: "/operations/manifest" }, { label: "NDR Follow-ups", href: "/operations/ndr" }],

  it_systems: [{ label: "IT Dashboard", href: "/it" }, { label: "Integrations", href: "/it/integrations" }, { label: "API Keys", href: "/it/api-keys" }, { label: "Backup & Restore", href: "/it/backups" }, { label: "Error Logs", href: "/it/logs" }, { label: "System Monitor", href: "/it/monitor" }, { label: "Webhooks", href: "/it/webhooks" }],

  marketing: [{ label: "Marketing Dashboard", href: "/marketing" }, { label: "Campaigns", href: "/marketing/campaigns" }, { label: "Coupons & Discounts", href: "/marketing/coupons" }, { label: "SEO Tools", href: "/marketing/seo" }, { label: "Social Media", href: "/marketing/social" }, { label: "Email Marketing", href: "/marketing/email" }, { label: "WhatsApp Broadcasts", href: "/marketing/whatsapp" }, { label: "Influencer / Collabs", href: "/marketing/collabs" }],

  customers: [{ label: "Customer List", href: "/customers" }, { label: "Customer Groups", href: "/customers/groups" }, { label: "Abandoned Carts", href: "/customers/carts" }, { label: "Reviews Manager", href: "/customers/reviews" }, { label: "Tickets & Support", href: "/customers/support" }, { label: "Newsletter Subscribers", href: "/customers/newsletter" }, { label: "Customer Segments", href: "/customers/segments" }, { label: "Refund Requests", href: "/customers/refunds" }],

  support_tickets: [{ label: "Support Dashboard", href: "/support-tickets" }, { label: "All Tickets", href: "/support-tickets/all" }, { label: "Open Tickets", href: "/support-tickets/open" }, { label: "In Progress", href: "/support-tickets/in-progress" }, { label: "Resolved", href: "/support-tickets/resolved" }, { label: "Closed", href: "/support-tickets/closed" }, { label: "Search by Email", href: "/support-tickets/search" }, { label: "SLA / Reports", href: "/support-tickets/reports" }],

  sales: [{ label: "Sales Dashboard", href: "/sales" }, { label: "Orders", href: "/sales/orders" }, { label: "Revenue Reports", href: "/sales/reports" }, { label: "Returns Summary", href: "/sales/returns" }, { label: "COD vs Prepaid", href: "/sales/payment-type" }, { label: "Top Products", href: "/sales/top-products" }, { label: "Top Categories", href: "/sales/top-categories" }],

  account_user: [{ label: "Profile", href: "/account/profile" }, { label: "Change Password", href: "/account/password" }, { label: "Logout", href: "/logout" }]
};

// ------------------------------
// ROUTE → SIDEBAR CATEGORY MAP
// ------------------------------

export const routeSidebarMap = [
  { prefix: "/dashboard", key: "dashboard" },
  { prefix: "/designing", key: "designing" },
  { prefix: "/production", key: "production" },
  { prefix: "/accounts", key: "accounts" },
  { prefix: "/inventory", key: "inventory" }, // ✅ works for /inventory/barcodes/* too
  { prefix: "/media", key: "media" },
  { prefix: "/blogs", key: "blogs" },
  { prefix: "/products", key: "products" },
  { prefix: "/orders", key: "orders" },
  { prefix: "/coupons", key: "coupons" },
  { prefix: "/operations", key: "operations" },
  { prefix: "/it", key: "it_systems" },
  { prefix: "/marketing", key: "marketing" },
  { prefix: "/customers", key: "customers" },
  { prefix: "/support-tickets", key: "support_tickets" },
  { prefix: "/sales", key: "sales" },
  { prefix: "/account", key: "account_user" }
];
