// src/config/loginConfig.js

/* =========================================================
   DOMAIN → PERMISSION MAPPING

   Every dashboard domain should have one permission key.
   Multiple domains may intentionally share the same
   permission where they belong to the same workflow.
========================================================= */

export const DOMAIN_PERMISSIONS = {
  shopify: "manageShopify",

  cutting_batch: "manageCuttingBatch",

  designing: "manageDesigning",
  design_lab: "manageDesignLab",

  production: "manageProduction",
  tailors: "manageTailors",
  tailor_production_jobs:
    "manageTailorProductionJobs",

  accounts: "manageAccounts",

  products: "manageProducts",
  footwear: "manageFootwear",

  orders: "manageOrders",
  refunds: "manageRefunds",

  fast2sms: "manageFast2SMS",

  shiprocket: "manageOrders",
  bluedart: "manageOrders",

  reviews: "manageReviews",
  rma: "manageRMA",

  media: "manageMedia",
  reels: "manageReels",
  blogs: "manageBlogs",

  inventory: "manageInventory",
  fabrics: "manageFabrics",

  operations: "manageOperations",
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
   ALL AVAILABLE PERMISSIONS

   Automatically generated from DOMAIN_PERMISSIONS.
========================================================= */

export const ALL_PERMISSIONS = Array.from(
  new Set(Object.values(DOMAIN_PERMISSIONS)),
);

/* =========================================================
   ROLE DEFAULT PERMISSIONS
========================================================= */

export const ROLE_DEFAULT_PERMS = {
  /*
   * Full unrestricted access.
   */
  superadmin: ["*"],

  /*
   * Access to all registered modules.
   */
  admin: [...ALL_PERMISSIONS],

  /*
   * Customer support and order resolution team.
   */
  customer_care: [
    "manageSupport",
    "manageCustomers",
    "manageOrders",
    "manageReviews",
    "manageRefunds",
    "manageFast2SMS",
    "manageRMA",
  ],

  /*
   * General operations staff.
   */
  staff: [
    "manageOrders",
    "manageProducts",
    "manageInventory",
    "manageFabrics",
    "manageReviews",
  ],

  /*
   * Read-only reporting role.
   */
  viewer: [
    "viewReports",
    "viewAnalytics",
  ],

  /*
   * Influencer and content team.
   */
  influencer: [
    "manageMedia",
    "manageReels",
    "manageInfluencerProgram",
  ],

  /*
   * Warehouse and fulfilment team.
   */
  warehouse: [
    "manageProduction",
    "manageTailors",
    "manageOrders",
    "manageInventory",
    "manageCuttingBatch",
  ],

  /*
   * Production manager role.
   */
  production_manager: [
    "manageProduction",
    "manageTailors",
    "manageProducts",
    "manageInventory",
    "manageFabrics",
    "manageCuttingBatch",
    "manageOrders",
  ],
};

/* =========================================================
   ROLE OPTIONS

   Useful for admin create/edit dropdowns.
========================================================= */

export const ROLE_OPTIONS = [
  {
    value: "superadmin",
    label: "Super Admin",
  },
  {
    value: "admin",
    label: "Admin",
  },
  {
    value: "production_manager",
    label: "Production Manager",
  },
  {
    value: "customer_care",
    label: "Customer Care",
  },
  {
    value: "warehouse",
    label: "Warehouse",
  },
  {
    value: "staff",
    label: "Staff",
  },
  {
    value: "influencer",
    label: "Influencer",
  },
  {
    value: "viewer",
    label: "Viewer",
  },
];

/* =========================================================
   PERMISSION LABELS

   Useful for admin permission management UI.
========================================================= */

export const PERMISSION_LABELS = {
  manageShopify: "Manage Shopify",

  manageCuttingBatch: "Manage Cutting Batches",

  manageDesigning: "Manage Designing",
  manageDesignLab: "Manage Design Lab",

  manageProduction: "Manage Production",
  manageTailors: "Manage Tailors",

  manageAccounts: "Manage Accounts",

  manageProducts: "Manage Products",
  manageFootwear: "Manage Footwear",

  manageOrders: "Manage Orders",
  manageRefunds: "Manage Refunds",

  manageFast2SMS: "Manage Fast2SMS",

  manageReviews: "Manage Reviews",
  manageRMA: "Manage RMA Requests",

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

  manageWordpressOrders:
    "Manage WordPress Orders",

  manageInfluencerProgram:
    "Manage Influencer Program",
};

/* =========================================================
   PERMISSION CHECK
========================================================= */

export const hasPermission = (
  permissions = [],
  permission,
) => {
  if (!permission) return false;

  if (!Array.isArray(permissions)) {
    return false;
  }

  if (permissions.includes("*")) {
    return true;
  }

  return permissions.includes(permission);
};

/* =========================================================
   MULTIPLE PERMISSION HELPERS
========================================================= */

export const hasAnyPermission = (
  permissions = [],
  requiredPermissions = [],
) => {
  if (!Array.isArray(permissions)) {
    return false;
  }

  if (permissions.includes("*")) {
    return true;
  }

  if (
    !Array.isArray(requiredPermissions) ||
    requiredPermissions.length === 0
  ) {
    return false;
  }

  return requiredPermissions.some(
    (permission) =>
      permissions.includes(permission),
  );
};

export const hasAllPermissions = (
  permissions = [],
  requiredPermissions = [],
) => {
  if (!Array.isArray(permissions)) {
    return false;
  }

  if (permissions.includes("*")) {
    return true;
  }

  if (
    !Array.isArray(requiredPermissions) ||
    requiredPermissions.length === 0
  ) {
    return true;
  }

  return requiredPermissions.every(
    (permission) =>
      permissions.includes(permission),
  );
};

/* =========================================================
   RESOLVE USER PERMISSIONS

   Custom user permissions take priority.
   Otherwise role defaults are used.
========================================================= */

export const getResolvedPermissions = (
  user = {},
) => {
  if (
    Array.isArray(user?.permissions) &&
    user.permissions.length > 0
  ) {
    return user.permissions;
  }

  const role =
    user?.role || "viewer";

  return (
    ROLE_DEFAULT_PERMS[role] ||
    ROLE_DEFAULT_PERMS.viewer
  );
};

/* =========================================================
   DOMAIN ACCESS CHECK
========================================================= */

export const canAccessDomain = (
  permissions = [],
  domainId,
) => {
  const requiredPermission =
    DOMAIN_PERMISSIONS[domainId];

  if (!requiredPermission) {
    return false;
  }

  return hasPermission(
    permissions,
    requiredPermission,
  );
};

/* =========================================================
   GET ACCESSIBLE DOMAINS
========================================================= */

export const getAccessibleDomainIds = (
  permissions = [],
) => {
  return Object.keys(
    DOMAIN_PERMISSIONS,
  ).filter((domainId) =>
    canAccessDomain(
      permissions,
      domainId,
    ),
  );
};