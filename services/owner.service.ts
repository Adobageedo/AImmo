import { apiClient } from "./api-client";
import type { Owner, CreateOwnerRequest, UpdateOwnerRequest } from "@/types/owner";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/common";

export const ownerService = {
  async getAll(
    organizationId: string,
    params?: PaginationParams & { includeRelationships?: boolean }
  ): Promise<ApiResponse<PaginatedResponse<Owner> | Owner[]>> {
    const queryParams: Record<string, string> = {};
    
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.includeRelationships !== undefined) {
      queryParams.include_relationships = params.includeRelationships.toString();
    }

    return apiClient.get<PaginatedResponse<Owner> | Owner[]>(
      `/organizations/${organizationId}/owners`,
      Object.keys(queryParams).length > 0 ? queryParams : undefined
    );
  },

  async getById(organizationId: string, id: string): Promise<ApiResponse<Owner>> {
    return apiClient.get<Owner>(`/organizations/${organizationId}/owners/${id}`);
  },

  async create(
    organizationId: string,
    data: CreateOwnerRequest
  ): Promise<ApiResponse<Owner>> {
    return apiClient.post<Owner>(
      `/organizations/${organizationId}/owners`,
      data
    );
  },

  async update(
    organizationId: string,
    id: string,
    data: UpdateOwnerRequest
  ): Promise<ApiResponse<Owner>> {
    return apiClient.put<Owner>(
      `/organizations/${organizationId}/owners/${id}`,
      data
    );
  },

  async delete(organizationId: string, id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/organizations/${organizationId}/owners/${id}`);
  },
};
