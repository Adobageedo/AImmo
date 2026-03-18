import { apiClient } from "./api-client";
import type { Alert, CreateAlertRequest, UpdateAlertRequest } from "@/types/alert";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/common";

export const alertService = {
  async getAll(
    organizationId: string,
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Alert>>> {
    const queryParams = params ? {
      page: params.page.toString(),
      limit: params.limit.toString(),
    } : undefined;

    return apiClient.get<PaginatedResponse<Alert>>(
      `/organizations/${organizationId}/alerts`,
      queryParams
    );
  },

  async getUnread(organizationId: string): Promise<ApiResponse<Alert[]>> {
    return apiClient.get<Alert[]>(`/organizations/${organizationId}/alerts/unread`);
  },

  async getById(id: string): Promise<ApiResponse<Alert>> {
    return apiClient.get<Alert>(`/alerts/${id}`);
  },

  async create(
    organizationId: string,
    data: CreateAlertRequest
  ): Promise<ApiResponse<Alert>> {
    return apiClient.post<Alert>(`/organizations/${organizationId}/alerts`, data);
  },

  async update(id: string, data: UpdateAlertRequest): Promise<ApiResponse<Alert>> {
    return apiClient.put<Alert>(`/alerts/${id}`, data);
  },

  async markAsRead(id: string): Promise<ApiResponse<Alert>> {
    return apiClient.put<Alert>(`/alerts/${id}`, { status: "read" });
  },

  async markAsResolved(id: string): Promise<ApiResponse<Alert>> {
    return apiClient.put<Alert>(`/alerts/${id}`, { 
      status: "resolved",
      resolved_at: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/alerts/${id}`);
  },
};
