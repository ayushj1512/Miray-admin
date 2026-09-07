// src/config/loginConfig.js

/* =========================================================
   DOMAIN → PERMISSION
========================================================= */

export const DOMAIN_PERMISSIONS = {
  shopify: "manageShopify",
  cutting_batch: "manageCuttingBatch",

  designing: "manageDesigning",
  design_lab: "manageDesignLab",

  production: "manageProduction",
  tailors: "manageTailors",
  tailor_production_jobs: "manageTailorProductionJobs",

  accounts: "manageAccounts",

  products: "manageProducts",
  footwear: "manageFootwear",

  orders: "manageOrders",
  refunds: "manageRefunds",

  fast2sms: "manageFast2SMS",

  // Shipping
  shiprocket: "manageOrders",
  bluedart: "manageOrders",

  reviews: "manageReviews",
  rma: "manageRMA",

  // ✅ RTO warehouse receiving
  rto: "manageRTO",

  media: "manageMedia",
  reels: "manageReels",
  blogs: "manageBlogs",

  inventory: "manageInventory",
  fabrics: "manageFabrics",

  operations: "manageOperations",

  // Warehouse dashboard shares production access
  warehouse: "manageProduction",

  it: "manageIT",
  marketing: "manageMarketing",

  customers: "manageCustomers",
  support: "manageSupport",

  sales: "manageSales",

  analytics: "viewAnalytics",
  reports: "viewReports",

  tickets: "manageTickets",
  coupons: "manageCoupons",

  wordpress: "manageWordpressOrders",

  collaboration: "manageInfluencerProgram",
};


/* =========================================================
   ALL PERMISSIONS
   Auto-generated from domains
========================================================= */

export const ALL_PERMISSIONS = [
  ...new Set(Object.values(DOMAIN_PERMISSIONS)),
];


/* =========================================================
   ROLE DEFAULT PERMISSIONS
========================================================= */

export const ROLE_DEFAULT_PERMS = {
  // Full access
  superadmin: ["*"],

  // All registered permissions
  admin: [...ALL_PERMISSIONS],

  // Customer support
  customer_care: [
    "manageSupport",
    "manageCustomers",
    "manageOrders",
    "manageReviews",
    "manageRefunds",
    "manageFast2SMS",
    "manageRMA",
    "manageRTO",
  ],

  // General staff
  staff: [
    "manageOrders",
    "manageProducts",
    "manageInventory",
    "manageFabrics",
    "manageReviews",
    "manageRTO",
  ],

  // Read only
  viewer: [
    "viewReports",
    "viewAnalytics",
  ],

  // Content / influencer team
  influencer: [
    "manageMedia",
    "manageReels",
    "manageInfluencerProgram",
  ],

  // Warehouse team
  warehouse: [
    "manageProduction",
    "manageTailors",
    "manageOrders",
    "manageInventory",
    "manageCuttingBatch",
    "manageRTO",
  ],

  // Production manager
  production_manager: [
    "manageProduction",
    "manageTailors",
    "manageProducts",
    "manageInventory",
    "manageFabrics",
    "manageCuttingBatch",
    "manageOrders",
    "manageRTO",
  ],
};


/* =========================================================
   ROLE OPTIONS
========================================================= */

export const ROLE_OPTIONS = [
  { value: "superadmin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "production_manager", label: "Production Manager" },
  { value: "customer_care", label: "Customer Care" },
  { value: "warehouse", label: "Warehouse" },
  { value: "staff", label: "Staff" },
  { value: "influencer", label: "Influencer" },
  { value: "viewer", label: "Viewer" },
];


/* =========================================================
   PERMISSION LABELS
========================================================= */

export const PERMISSION_LABELS = {
  manageShopify: "Manage Shopify",
  manageCuttingBatch: "Manage Cutting Batches",

  manageDesigning: "Manage Designing",
  manageDesignLab: "Manage Design Lab",

  manageProduction: "Manage Production",
  manageTailors: "Manage Tailors",
  manageTailorProductionJobs: "Manage Tailor Production Jobs",

  manageAccounts: "Manage Accounts",

  manageProducts: "Manage Products",
  manageFootwear: "Manage Footwear",

  manageOrders: "Manage Orders",
  manageRefunds: "Manage Refunds",

  manageFast2SMS: "Manage Fast2SMS",

  manageReviews: "Manage Reviews",
  manageRMA: "Manage RMA Requests",

  // ✅ RTO
  manageRTO: "Manage RTO Received",

  manageMedia: "Manage Media",
  manageReels: "Manage Reels",
  manageBlogs: "Manage Blogs",

  manageInventory: "Manage Inventory",
  manageFabrics: "Manage Fabrics",

  manageOperations: "Manage Operations",
  manageIT: "Manage IT & Systems",
  manageMarketing: "Manage Marketing",

  manageCustomers: "Manage Customers",
  manageSupport: "Manage Customer Support",

  manageSales: "Manage Sales",

  viewAnalytics: "View Analytics",
  viewReports: "View Reports",

  manageTickets: "Manage Tickets",
  manageCoupons: "Manage Coupons",

  manageWordpressOrders: "Manage WordPress Orders",
  manageInfluencerProgram: "Manage Influencer Program",
};


/* =========================================================
   PERMISSION HELPERS
========================================================= */

export const hasPermission = (
  permissions = [],
  permission,
) => {
  if (!permission || !Array.isArray(permissions)) return false;
  if (permissions.includes("*")) return true;

  return permissions.includes(permission);
};


export const hasAnyPermission = (
  permissions = [],
  required = [],
) => {
  if (!Array.isArray(permissions)) return false;
  if (permissions.includes("*")) return true;
  if (!Array.isArray(required) || !required.length) return false;

  return required.some((permission) =>
    permissions.includes(permission)
  );
};


export const hasAllPermissions = (
  permissions = [],
  required = [],
) => {
  if (!Array.isArray(permissions)) return false;
  if (permissions.includes("*")) return true;
  if (!Array.isArray(required) || !required.length) return true;

  return required.every((permission) =>
    permissions.includes(permission)
  );
};


/* =========================================================
   RESOLVE USER PERMISSIONS
========================================================= */

export const getResolvedPermissions = (user = {}) => {
  if (Array.isArray(user?.permissions) && user.permissions.length) {
    return user.permissions;
  }

  return (
    ROLE_DEFAULT_PERMS[user?.role || "viewer"] ||
    ROLE_DEFAULT_PERMS.viewer
  );
};


/* =========================================================
   DOMAIN ACCESS
========================================================= */

export const canAccessDomain = (
  permissions = [],
  domainId,
) => {
  const permission = DOMAIN_PERMISSIONS[domainId];

  if (!permission) return false;

  return hasPermission(permissions, permission);
};


export const getAccessibleDomainIds = (
  permissions = [],
) =>
  Object.keys(DOMAIN_PERMISSIONS).filter((domainId) =>
    canAccessDomain(permissions, domainId)
  );