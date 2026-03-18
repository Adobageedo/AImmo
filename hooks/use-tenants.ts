"use client";

import { useState, useCallback } from "react";
import { tenantService } from "@/services/tenant.service";
import type { Tenant, CreateTenantRequest, UpdateTenantRequest } from "@/types/tenant";
import type { PaginationParams } from "@/types/common";

export function useTenants(organizationId: string) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchTenants = useCallback(async (params?: PaginationParams & { includeRelationships?: boolean }) => {
    if (!organizationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Par défaut, inclure les relationships pour optimiser les performances
      const includeRelationships = params?.includeRelationships !== false;
      const serviceParams: PaginationParams & { includeRelationships?: boolean } = {
        page: params?.page || 1,
        limit: params?.limit || 20,
        includeRelationships
      };
      
      const response = await tenantService.getAll(organizationId, serviceParams);
      if (response.success && response.data) {
        // Handle both paginated response and direct array response
        if (Array.isArray(response.data)) {
          setTenants(response.data);
        } else {
          setTenants(response.data.data);
          setTotal(response.data.total);
        }
      } else {
        setError(response.error || "Erreur lors du chargement des locataires");
      }
    } catch (err) {
      setError("Erreur lors du chargement des locataires");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const createTenant = useCallback(async (data: CreateTenantRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tenantService.create(organizationId, data);
      if (response.success && response.data) {
        setTenants(prev => [...prev, response.data!]);
        return { success: true, data: response.data };
      } else {
        setError(response.error || "Erreur lors de la création");
        return { success: false, error: response.error };
      }
    } catch (err) {
      setError("Erreur lors de la création");
      return { success: false, error: "Erreur lors de la création" };
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const updateTenant = useCallback(async (id: string, data: UpdateTenantRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tenantService.update(id, data);
      if (response.success && response.data) {
        setTenants(prev => prev.map(t => t.id === id ? response.data! : t));
        return { success: true, data: response.data };
      } else {
        setError(response.error || "Erreur lors de la mise à jour");
        return { success: false, error: response.error };
      }
    } catch (err) {
      setError("Erreur lors de la mise à jour");
      return { success: false, error: "Erreur lors de la mise à jour" };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTenant = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tenantService.delete(id);
      if (response.success) {
        setTenants(prev => prev.filter(t => t.id !== id));
        return { success: true };
      } else {
        setError(response.error || "Erreur lors de la suppression");
        return { success: false, error: response.error };
      }
    } catch (err) {
      setError("Erreur lors de la suppression");
      return { success: false, error: "Erreur lors de la suppression" };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tenants,
    loading,
    error,
    total,
    fetchTenants,
    createTenant,
    updateTenant,
    deleteTenant,
  };
}
