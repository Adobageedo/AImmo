export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type SortOrder = "asc" | "desc";

export interface SortParams {
  field: string;
  order: SortOrder;
}

export interface FilterParams {
  [key: string]: string | number | boolean | string[] | number[] | null | undefined;
}
