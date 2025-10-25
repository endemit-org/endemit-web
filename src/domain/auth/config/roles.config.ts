import { type Permission, PERMISSIONS } from "./permissions.config";

export const ROLE_SLUGS = {
  ADMIN: "admin",
  MODERATOR: "moderator",
  SCANNER: "scanner",
  USER: "user",
} as const;

export type RoleSlug = (typeof ROLE_SLUGS)[keyof typeof ROLE_SLUGS];

export interface RoleDefinition {
  slug: RoleSlug;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
}

export const ROLE_DEFINITIONS: Record<RoleSlug, RoleDefinition> = {
  [ROLE_SLUGS.ADMIN]: {
    slug: ROLE_SLUGS.ADMIN,
    name: "Administrator",
    description: "Full system access with all permissions",
    isSystem: true,
    permissions: [
      // Users
      PERMISSIONS.USERS_READ,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_UPDATE,
      PERMISSIONS.USERS_DELETE,
      PERMISSIONS.USERS_MANAGE_ROLES,
      // Orders
      PERMISSIONS.ORDERS_READ_ALL,
      PERMISSIONS.ORDERS_UPDATE,
      PERMISSIONS.ORDERS_DELETE,
      PERMISSIONS.ORDERS_REFUND,
      // Tickets
      PERMISSIONS.TICKETS_READ_ALL,
      PERMISSIONS.TICKETS_CREATE,
      PERMISSIONS.TICKETS_UPDATE,
      PERMISSIONS.TICKETS_DELETE,
      PERMISSIONS.TICKETS_SCAN,
      PERMISSIONS.TICKETS_VALIDATE,
      // Events
      PERMISSIONS.EVENTS_READ,
      PERMISSIONS.EVENTS_CREATE,
      PERMISSIONS.EVENTS_UPDATE,
      PERMISSIONS.EVENTS_DELETE,
      // Products
      PERMISSIONS.PRODUCTS_READ,
      PERMISSIONS.PRODUCTS_CREATE,
      PERMISSIONS.PRODUCTS_UPDATE,
      PERMISSIONS.PRODUCTS_DELETE,
      // CMS
      PERMISSIONS.CMS_READ,
      PERMISSIONS.CMS_UPDATE,
      PERMISSIONS.CMS_PUBLISH,
      // Analytics
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.REPORTS_GENERATE,
      // System
      PERMISSIONS.SYSTEM_SETTINGS,
      PERMISSIONS.SYSTEM_LOGS,
    ],
  },
  [ROLE_SLUGS.MODERATOR]: {
    slug: ROLE_SLUGS.MODERATOR,
    name: "Moderator",
    description: "Content and event management access",
    isSystem: true,
    permissions: [
      // Users (read only)
      PERMISSIONS.USERS_READ,
      // Orders
      PERMISSIONS.ORDERS_READ_ALL,
      PERMISSIONS.ORDERS_UPDATE,
      // Tickets
      PERMISSIONS.TICKETS_READ_ALL,
      PERMISSIONS.TICKETS_UPDATE,
      PERMISSIONS.TICKETS_SCAN,
      PERMISSIONS.TICKETS_VALIDATE,
      // Events
      PERMISSIONS.EVENTS_READ,
      PERMISSIONS.EVENTS_CREATE,
      PERMISSIONS.EVENTS_UPDATE,
      // Products
      PERMISSIONS.PRODUCTS_READ,
      PERMISSIONS.PRODUCTS_CREATE,
      PERMISSIONS.PRODUCTS_UPDATE,
      // CMS
      PERMISSIONS.CMS_READ,
      PERMISSIONS.CMS_UPDATE,
      // Analytics
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.REPORTS_GENERATE,
    ],
  },
  [ROLE_SLUGS.SCANNER]: {
    slug: ROLE_SLUGS.SCANNER,
    name: "Scanner",
    description: "Ticket scanning access for event staff",
    isSystem: true,
    permissions: [
      // Tickets (limited to scanning and validation)
      PERMISSIONS.TICKETS_READ_ALL,
      PERMISSIONS.TICKETS_SCAN,
      PERMISSIONS.TICKETS_VALIDATE,
      // Events (read only)
      PERMISSIONS.EVENTS_READ,
    ],
  },
  [ROLE_SLUGS.USER]: {
    slug: ROLE_SLUGS.USER,
    name: "User",
    description: "Basic user access to own content",
    isSystem: true,
    permissions: [
      // Orders (own only)
      PERMISSIONS.ORDERS_READ_OWN,
      // Tickets (own only)
      PERMISSIONS.TICKETS_READ_OWN,
      // Events (public access)
      PERMISSIONS.EVENTS_READ,
      // Products (public access)
      PERMISSIONS.PRODUCTS_READ,
      // CMS (public access)
      PERMISSIONS.CMS_READ,
    ],
  },
};
