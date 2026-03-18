"use client";

import { useState, useCallback } from "react";
import { alertService } from "@/services/alert.service";
import type { Alert } from "@/types/alert";
import type { PaginationParams } from "@/types/common";

export function useAlerts(organizationId: string) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadAlerts, setUnreadAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchAlerts = useCallback(async (params?: PaginationParams) => {
    if (!organizationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await alertService.getAll(organizationId, params);
      if (response.success && response.data) {
        setAlerts(response.data.data);
        setTotal(response.data.total);
      } else {
        setError(response.error || "Erreur lors du chargement des alertes");
      }
    } catch (err) {
      setError("Erreur lors du chargement des alertes");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const fetchUnreadAlerts = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      const response = await alertService.getUnread(organizationId);
      if (response.success && response.data) {
        setUnreadAlerts(response.data);
      }
    } catch (err) {
      console.error("Error fetching unread alerts:", err);
    }
  }, [organizationId]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await alertService.markAsRead(id);
      if (response.success) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "read" } : a));
        setUnreadAlerts(prev => prev.filter(a => a.id !== id));
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err) {
      return { success: false, error: "Erreur lors de la mise à jour" };
    }
  }, []);

  const markAsResolved = useCallback(async (id: string) => {
    try {
      const response = await alertService.markAsResolved(id);
      if (response.success) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "resolved" } : a));
        setUnreadAlerts(prev => prev.filter(a => a.id !== id));
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err) {
      return { success: false, error: "Erreur lors de la mise à jour" };
    }
  }, []);

  return {
    alerts,
    unreadAlerts,
    loading,
    error,
    total,
    fetchAlerts,
    fetchUnreadAlerts,
    markAsRead,
    markAsResolved,
  };
}
