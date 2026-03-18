"use client";

import { useState, useCallback } from "react";
import { leaseService } from "@/services/lease.service";
import type { Lease, CreateLeaseRequest, UpdateLeaseRequest } from "@/types/lease";
import type { PaginationParams } from "@/types/common";

export function useLeases(organizationId: string) {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchLeases = useCallback(async (params?: PaginationParams & { includeRelationships?: boolean }) => {
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
      
      const response = await leaseService.getAll(organizationId, serviceParams);
      if (response.success && response.data) {
        setLeases(response.data.data);
        setTotal(response.data.total);
      } else {
        setError(response.error || "Erreur lors du chargement des baux");
      }
    } catch (err) {
      setError("Erreur lors du chargement des baux");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const createLease = useCallback(async (data: CreateLeaseRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await leaseService.create(organizationId, data);
      if (response.success && response.data) {
        setLeases(prev => [...prev, response.data!]);
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

  const updateLease = useCallback(async (id: string, data: UpdateLeaseRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await leaseService.update(id, data);
      if (response.success && response.data) {
        setLeases(prev => prev.map(l => l.id === id ? response.data! : l));
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

  const deleteLease = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await leaseService.delete(id);
      if (response.success) {
        setLeases(prev => prev.filter(l => l.id !== id));
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
    leases,
    loading,
    error,
    total,
    fetchLeases,
    createLease,
    updateLease,
    deleteLease,
  };
}
