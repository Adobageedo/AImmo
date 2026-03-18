import type { BaseEntity } from "./common";

export type AlertType = 
  | "payment_overdue"
  | "lease_renewal"
  | "lease_ending"
  | "indexation_due"
  | "diagnostic_expiring"
  | "maintenance_required";

export type AlertPriority = "low" | "medium" | "high" | "urgent";
export type AlertStatus = "unread" | "read" | "dismissed" | "resolved";

export interface Alert extends BaseEntity {
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  title: string;
  message: string;
  related_entity_type?: "property" | "lease" | "tenant";
  related_entity_id?: string;
  action_url?: string;
  due_date?: string;
  resolved_at?: string;
}

export interface CreateAlertRequest {
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  related_entity_type?: "property" | "lease" | "tenant";
  related_entity_id?: string;
  action_url?: string;
  due_date?: string;
}

export interface UpdateAlertRequest {
  status?: AlertStatus;
  resolved_at?: string;
}
