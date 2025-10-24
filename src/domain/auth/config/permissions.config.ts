export const PERMISSIONS = {
  // User management
  USERS_READ: "users:read",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",
  USERS_MANAGE_ROLES: "users:manage-roles",

  // Order management
  ORDERS_READ_ALL: "orders:read-all",
  ORDERS_READ_OWN: "orders:read-own",
  ORDERS_UPDATE: "orders:update",
  ORDERS_DELETE: "orders:delete",
  ORDERS_REFUND: "orders:refund",

  // Ticket management
  TICKETS_READ_ALL: "tickets:read-all",
  TICKETS_READ_OWN: "tickets:read-own",
  TICKETS_CREATE: "tickets:create",
  TICKETS_UPDATE: "tickets:update",
  TICKETS_DELETE: "tickets:delete",
  TICKETS_SCAN: "tickets:scan",
  TICKETS_VALIDATE: "tickets:validate",

  // Event management
  EVENTS_READ: "events:read",
  EVENTS_CREATE: "events:create",
  EVENTS_UPDATE: "events:update",
  EVENTS_DELETE: "events:delete",

  // Product management
  PRODUCTS_READ: "products:read",
  PRODUCTS_CREATE: "products:create",
  PRODUCTS_UPDATE: "products:update",
  PRODUCTS_DELETE: "products:delete",

  // CMS management
  CMS_READ: "cms:read",
  CMS_UPDATE: "cms:update",
  CMS_PUBLISH: "cms:publish",

  // Analytics & Reports
  ANALYTICS_VIEW: "analytics:view",
  REPORTS_GENERATE: "reports:generate",

  // System administration
  SYSTEM_SETTINGS: "system:settings",
  SYSTEM_LOGS: "system:logs",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_METADATA: Record<
  Permission,
  { name: string; description: string; resource: string; action: string }
> = {
  [PERMISSIONS.USERS_READ]: {
    name: "Read Users",
    description: "View user profiles and information",
    resource: "users",
    action: "read",
  },
  [PERMISSIONS.USERS_CREATE]: {
    name: "Create Users",
    description: "Create new user accounts",
    resource: "users",
    action: "create",
  },
  [PERMISSIONS.USERS_UPDATE]: {
    name: "Update Users",
    description: "Edit user profiles and information",
    resource: "users",
    action: "update",
  },
  [PERMISSIONS.USERS_DELETE]: {
    name: "Delete Users",
    description: "Delete user accounts",
    resource: "users",
    action: "delete",
  },
  [PERMISSIONS.USERS_MANAGE_ROLES]: {
    name: "Manage User Roles",
    description: "Assign and remove roles from users",
    resource: "users",
    action: "manage-roles",
  },
  [PERMISSIONS.ORDERS_READ_ALL]: {
    name: "Read All Orders",
    description: "View all orders in the system",
    resource: "orders",
    action: "read-all",
  },
  [PERMISSIONS.ORDERS_READ_OWN]: {
    name: "Read Own Orders",
    description: "View own orders only",
    resource: "orders",
    action: "read-own",
  },
  [PERMISSIONS.ORDERS_UPDATE]: {
    name: "Update Orders",
    description: "Edit order information",
    resource: "orders",
    action: "update",
  },
  [PERMISSIONS.ORDERS_DELETE]: {
    name: "Delete Orders",
    description: "Delete orders",
    resource: "orders",
    action: "delete",
  },
  [PERMISSIONS.ORDERS_REFUND]: {
    name: "Refund Orders",
    description: "Process order refunds",
    resource: "orders",
    action: "refund",
  },
  [PERMISSIONS.TICKETS_READ_ALL]: {
    name: "Read All Tickets",
    description: "View all tickets in the system",
    resource: "tickets",
    action: "read-all",
  },
  [PERMISSIONS.TICKETS_READ_OWN]: {
    name: "Read Own Tickets",
    description: "View own tickets only",
    resource: "tickets",
    action: "read-own",
  },
  [PERMISSIONS.TICKETS_CREATE]: {
    name: "Create Tickets",
    description: "Create new tickets",
    resource: "tickets",
    action: "create",
  },
  [PERMISSIONS.TICKETS_UPDATE]: {
    name: "Update Tickets",
    description: "Edit ticket information",
    resource: "tickets",
    action: "update",
  },
  [PERMISSIONS.TICKETS_DELETE]: {
    name: "Delete Tickets",
    description: "Delete tickets",
    resource: "tickets",
    action: "delete",
  },
  [PERMISSIONS.TICKETS_SCAN]: {
    name: "Scan Tickets",
    description: "Scan tickets at event entrance",
    resource: "tickets",
    action: "scan",
  },
  [PERMISSIONS.TICKETS_VALIDATE]: {
    name: "Validate Tickets",
    description: "Manually validate tickets",
    resource: "tickets",
    action: "validate",
  },
  [PERMISSIONS.EVENTS_READ]: {
    name: "Read Events",
    description: "View event information",
    resource: "events",
    action: "read",
  },
  [PERMISSIONS.EVENTS_CREATE]: {
    name: "Create Events",
    description: "Create new events",
    resource: "events",
    action: "create",
  },
  [PERMISSIONS.EVENTS_UPDATE]: {
    name: "Update Events",
    description: "Edit event information",
    resource: "events",
    action: "update",
  },
  [PERMISSIONS.EVENTS_DELETE]: {
    name: "Delete Events",
    description: "Delete events",
    resource: "events",
    action: "delete",
  },
  [PERMISSIONS.PRODUCTS_READ]: {
    name: "Read Products",
    description: "View product information",
    resource: "products",
    action: "read",
  },
  [PERMISSIONS.PRODUCTS_CREATE]: {
    name: "Create Products",
    description: "Create new products",
    resource: "products",
    action: "create",
  },
  [PERMISSIONS.PRODUCTS_UPDATE]: {
    name: "Update Products",
    description: "Edit product information",
    resource: "products",
    action: "update",
  },
  [PERMISSIONS.PRODUCTS_DELETE]: {
    name: "Delete Products",
    description: "Delete products",
    resource: "products",
    action: "delete",
  },
  [PERMISSIONS.CMS_READ]: {
    name: "Read CMS Content",
    description: "View CMS content",
    resource: "cms",
    action: "read",
  },
  [PERMISSIONS.CMS_UPDATE]: {
    name: "Update CMS Content",
    description: "Edit CMS content",
    resource: "cms",
    action: "update",
  },
  [PERMISSIONS.CMS_PUBLISH]: {
    name: "Publish CMS Content",
    description: "Publish CMS content",
    resource: "cms",
    action: "publish",
  },
  [PERMISSIONS.ANALYTICS_VIEW]: {
    name: "View Analytics",
    description: "Access analytics dashboard",
    resource: "analytics",
    action: "view",
  },
  [PERMISSIONS.REPORTS_GENERATE]: {
    name: "Generate Reports",
    description: "Generate and export reports",
    resource: "reports",
    action: "generate",
  },
  [PERMISSIONS.SYSTEM_SETTINGS]: {
    name: "System Settings",
    description: "Manage system settings",
    resource: "system",
    action: "settings",
  },
  [PERMISSIONS.SYSTEM_LOGS]: {
    name: "System Logs",
    description: "View system logs",
    resource: "system",
    action: "logs",
  },
};
