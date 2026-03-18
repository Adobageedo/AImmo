"use client";

import { useState, useCallback } from "react";
import { propertyService } from "@/services/property.service";
import type { Property, CreatePropertyRequest, UpdatePropertyRequest } from "@/types/property";
import type { PaginationParams } from "@/types/common";

export function useProperties(organizationId: string) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchProperties = useCallback(async (params?: PaginationParams & { includeRelationships?: boolean }) => {
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
      
      const response = await propertyService.getAll(organizationId, serviceParams);
      
      if (response.success && response.data) {
        // Handle both paginated response and direct array response
        if (Array.isArray(response.data)) {
          setProperties(response.data);
        } else {
          setProperties(response.data.data);
          setTotal(response.data.total);
        }
      } else {
        setError(response.error || "Erreur lors du chargement des propriétés");
      }
    } catch (err) {
      setError("Erreur lors du chargement des propriétés");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const createProperty = useCallback(async (data: CreatePropertyRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await propertyService.create(organizationId, data);
      if (response.success && response.data) {
        setProperties(prev => [...prev, response.data!]);
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

  const updateProperty = useCallback(async (id: string, data: UpdatePropertyRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await propertyService.update(id, data);
      if (response.success && response.data) {
        setProperties(prev => prev.map(p => p.id === id ? response.data! : p));
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

  const deleteProperty = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await propertyService.delete(id);
      if (response.success) {
        setProperties(prev => prev.filter(p => p.id !== id));
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
    properties,
    loading,
    error,
    total,
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
  };
}
