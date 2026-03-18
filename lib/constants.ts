export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  PROPERTIES: "/properties",
  TENANTS: "/tenants",
  LEASES: "/leases",
  DOCUMENTS: "/documents",
  ALERTS: "/alerts",
  SETTINGS: "/settings",
  PROFILE: "/profile",
} as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    SIGNUP: "/api/auth/signup",
    LOGOUT: "/api/auth/logout",
    RESET_PASSWORD: "/api/auth/reset-password",
  },
  ORGANIZATIONS: "/api/organizations",
  PROPERTIES: "/api/properties",
  TENANTS: "/api/tenants",
  LEASES: "/api/leases",
  DOCUMENTS: "/api/documents",
  ALERTS: "/api/alerts",
  DASHBOARD: "/api/dashboard",
  NEWSLETTER: "/api/newsletter",
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const STORAGE = {
  DEFAULT_QUOTA_MB: 1000,
  MAX_FILE_SIZE_MB: 50,
  ALLOWED_MIME_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
    "image/gif",
    "text/plain",
    "text/csv",
  ],
} as const;

export const DATE_FORMATS = {
  DISPLAY: "dd/MM/yyyy",
  API: "yyyy-MM-dd",
  DATETIME: "dd/MM/yyyy HH:mm",
} as const;
