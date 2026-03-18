import type { BaseEntity } from "./common";

export interface Organization extends BaseEntity {
  name: string;
  description?: string;
  logo_url?: string;
  settings?: OrganizationSettings;
  role?: RoleType;
}

export interface OrganizationSettings {
  storage_quota_mb: number;
  max_users: number;
  features_enabled: string[];
}

export type RoleType = "admin" | "user" | "viewer";

export interface Role {
  id: string;
  name: RoleType;
  description: string;
  permissions: Permission[];
}

export type Permission =
  | "documents.read"
  | "documents.write"
  | "documents.delete"
  | "properties.read"
  | "properties.write"
  | "properties.delete"
  | "tenants.read"
  | "tenants.write"
  | "tenants.delete"
  | "leases.read"
  | "leases.write"
  | "leases.delete"
  | "dashboard.read"
  | "alerts.read"
  | "alerts.manage"
  | "organization.manage";

export interface OrganizationUser {
  id: string;
  user_id: string;
  organization_id: string;
  role: RoleType;
  joined_at: string;
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
  logo_url?: string;
  settings?: Partial<OrganizationSettings>;
}
