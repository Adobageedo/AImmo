import { apiClient } from "./api-client";
import type { Lease, CreateLeaseRequest, UpdateLeaseRequest } from "@/types/lease";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/common";

export const leaseService = {
  async getAll(
    organizationId: string,
    params?: PaginationParams & { includeRelationships?: boolean }
  ): Promise<ApiResponse<PaginatedResponse<Lease>>> {
    const queryParams: Record<string, string> = {};
    
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.includeRelationships !== undefined) {
      queryParams.include_relationships = params.includeRelationships.toString();
    }

    return apiClient.get<PaginatedResponse<Lease>>(
      `/organizations/${organizationId}/leases`,
      Object.keys(queryParams).length > 0 ? queryParams : undefined
    );
  },

  async getById(id: string): Promise<ApiResponse<Lease>> {
    return apiClient.get<Lease>(`/leases/${id}`);
  },

  async getByProperty(propertyId: string): Promise<ApiResponse<Lease[]>> {
    return apiClient.get<Lease[]>(`/properties/${propertyId}/leases`);
  },

  async getByTenant(tenantId: string): Promise<ApiResponse<Lease[]>> {
    return apiClient.get<Lease[]>(`/tenants/${tenantId}/leases`);
  },

  async create(
    organizationId: string,
    data: CreateLeaseRequest
  ): Promise<ApiResponse<Lease>> {
    return apiClient.post<Lease>(`/organizations/${organizationId}/leases`, data);
  },

  async update(id: string, data: UpdateLeaseRequest): Promise<ApiResponse<Lease>> {
    return apiClient.put<Lease>(`/leases/${id}`, data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/leases/${id}`);
  },
};
