import { apiClient } from "./api-client";
import type { DashboardKPIs, DashboardFilters, RevenueChartData, GeographicDistribution, PropertyTypeDistribution } from "@/types/dashboard";
import type { ApiResponse } from "@/types/common";

export const dashboardService = {
  async getKPIs(
    organizationId: string,
    filters?: DashboardFilters
  ): Promise<ApiResponse<DashboardKPIs>> {
    const queryParams: Record<string, string> = {};
    
    if (filters?.start_date) queryParams.start_date = filters.start_date;
    if (filters?.end_date) queryParams.end_date = filters.end_date;
    if (filters?.city) queryParams.city = filters.city;
    if (filters?.property_type) queryParams.property_type = filters.property_type;

    return apiClient.get<DashboardKPIs>(
      `/organizations/${organizationId}/dashboard/kpis`,
      Object.keys(queryParams).length > 0 ? queryParams : undefined
    );
  },

  async getRevenueChart(
    organizationId: string,
    filters?: DashboardFilters
  ): Promise<ApiResponse<RevenueChartData[]>> {
    const queryParams: Record<string, string> = {};
    
    if (filters?.start_date) queryParams.start_date = filters.start_date;
    if (filters?.end_date) queryParams.end_date = filters.end_date;

    return apiClient.get<RevenueChartData[]>(
      `/organizations/${organizationId}/dashboard/revenue`,
      Object.keys(queryParams).length > 0 ? queryParams : undefined
    );
  },

  async getGeographicDistribution(
    organizationId: string
  ): Promise<ApiResponse<GeographicDistribution[]>> {
    return apiClient.get<GeographicDistribution[]>(
      `/organizations/${organizationId}/dashboard/geographic`
    );
  },

  async getPropertyTypeDistribution(
    organizationId: string
  ): Promise<ApiResponse<PropertyTypeDistribution[]>> {
    return apiClient.get<PropertyTypeDistribution[]>(
      `/organizations/${organizationId}/dashboard/property-types`
    );
  },
};
