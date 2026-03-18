"use client";

import { useState, useCallback } from "react";
import { dashboardService } from "@/services/dashboard.service";
import type { DashboardKPIs, DashboardFilters, RevenueChartData, GeographicDistribution, PropertyTypeDistribution } from "@/types/dashboard";

export function useDashboard(organizationId: string) {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueChartData[]>([]);
  const [geoData, setGeoData] = useState<GeographicDistribution[]>([]);
  const [typeData, setTypeData] = useState<PropertyTypeDistribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKPIs = useCallback(async (filters?: DashboardFilters) => {
    if (!organizationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await dashboardService.getKPIs(organizationId, filters);
      if (response.success && response.data) {
        setKpis(response.data);
      } else {
        setError(response.error || "Erreur lors du chargement des KPIs");
      }
    } catch (err) {
      setError("Erreur lors du chargement des KPIs");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const fetchRevenueChart = useCallback(async (filters?: DashboardFilters) => {
    if (!organizationId) return;
    
    try {
      const response = await dashboardService.getRevenueChart(organizationId, filters);
      if (response.success && response.data) {
        setRevenueData(response.data);
      }
    } catch (err) {
      console.error("Error fetching revenue chart:", err);
    }
  }, [organizationId]);

  const fetchGeographicDistribution = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      const response = await dashboardService.getGeographicDistribution(organizationId);
      if (response.success && response.data) {
        setGeoData(response.data);
      }
    } catch (err) {
      console.error("Error fetching geographic data:", err);
    }
  }, [organizationId]);

  const fetchPropertyTypeDistribution = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      const response = await dashboardService.getPropertyTypeDistribution(organizationId);
      if (response.success && response.data) {
        setTypeData(response.data);
      }
    } catch (err) {
      console.error("Error fetching property type data:", err);
    }
  }, [organizationId]);

  const fetchAllDashboardData = useCallback(async (filters?: DashboardFilters) => {
    await Promise.all([
      fetchKPIs(filters),
      fetchRevenueChart(filters),
      fetchGeographicDistribution(),
      fetchPropertyTypeDistribution(),
    ]);
  }, [fetchKPIs, fetchRevenueChart, fetchGeographicDistribution, fetchPropertyTypeDistribution]);

  return {
    kpis,
    revenueData,
    geoData,
    typeData,
    loading,
    error,
    fetchKPIs,
    fetchRevenueChart,
    fetchGeographicDistribution,
    fetchPropertyTypeDistribution,
    fetchAllDashboardData,
  };
}
