import { apiClient } from "./api-client";
import type { Tenant, CreateTenantRequest, UpdateTenantRequest } from "@/types/tenant";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/common";

export const tenantService = {
  async getAll(
    organizationId: string,
    params?: PaginationParams & { includeRelationships?: boolean }
  ): Promise<ApiResponse<PaginatedResponse<Tenant> | Tenant[]>> {
    const queryParams: Record<string, string> = {};
    
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.includeRelationships !== undefined) {
      queryParams.include_relationships = params.includeRelationships.toString();
    }

    return apiClient.get<PaginatedResponse<Tenant> | Tenant[]>(
      `/organizations/${organizationId}/tenants`,
      Object.keys(queryParams).length > 0 ? queryParams : undefined
    );
  },

  async getById(id: string): Promise<ApiResponse<Tenant>> {
    return apiClient.get<Tenant>(`/tenants/${id}`);
  },

  async create(
    organizationId: string,
    data: CreateTenantRequest
  ): Promise<ApiResponse<Tenant>> {
    return apiClient.post<Tenant>(`/organizations/${organizationId}/tenants`, data);
  },

  async update(id: string, data: UpdateTenantRequest): Promise<ApiResponse<Tenant>> {
    return apiClient.put<Tenant>(`/tenants/${id}`, data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/tenants/${id}`);
  },
};
