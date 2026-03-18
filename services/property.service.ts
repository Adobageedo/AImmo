import { apiClient } from "./api-client";
import type { Property, CreatePropertyRequest, UpdatePropertyRequest, PropertyYield } from "@/types/property";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/types/common";

export const propertyService = {
  async getAll(
    organizationId: string,
    params?: PaginationParams & { includeRelationships?: boolean }
  ): Promise<ApiResponse<PaginatedResponse<Property> | Property[]>> {
    const queryParams: Record<string, string> = {};
    
    if (params) {
      if (params.page) queryParams.page = params.page.toString();
      if (params.limit) queryParams.limit = params.limit.toString();
      if (params.includeRelationships !== undefined) {
        queryParams.include_relationships = params.includeRelationships.toString();
      }
    }

    return apiClient.get<PaginatedResponse<Property> | Property[]>(
      `/organizations/${organizationId}/properties`,
      Object.keys(queryParams).length > 0 ? queryParams : undefined
    );
  },

  async getById(id: string): Promise<ApiResponse<Property>> {
    return apiClient.get<Property>(`/properties/${id}`);
  },

  async create(
    organizationId: string,
    data: CreatePropertyRequest
  ): Promise<ApiResponse<Property>> {
    return apiClient.post<Property>(`/organizations/${organizationId}/properties`, data);
  },

  async update(id: string, data: UpdatePropertyRequest): Promise<ApiResponse<Property>> {
    return apiClient.put<Property>(`/properties/${id}`, data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/properties/${id}`);
  },

  async getYield(id: string): Promise<ApiResponse<PropertyYield>> {
    return apiClient.get<PropertyYield>(`/properties/${id}/yield`);
  },
};
