"use client";

import type { Toolkit } from "@assistant-ui/react";

/**
 * Lease Management Tools
 * Tools for searching and managing leases
 */
export const leaseTools: Toolkit = {
  search_leases: {
    description: "Recherche des baux selon des critères spécifiques. Permet de filtrer par statut et limiter le nombre de résultats.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Critères de recherche pour les baux"
        },
        status: {
          type: "string",
          enum: ["active", "expired", "pending", "all"],
          description: "Statut des baux"
        },
        limit: {
          type: "number",
          minimum: 1,
          maximum: 50,
          description: "Nombre maximum de résultats",
          default: 10
        }
      },
      required: ["query"],
      additionalProperties: false
    },
    execute: async ({ query, status, limit }) => {
      console.log(`🔧 DEBUG: search_leases tool called with:`, { query, status, limit });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Mock data for now - replace with actual API call
      const mockLeases = [
        {
          id: "1",
          property: "Appartement Paris 15ème",
          tenant: "Jean Dupont",
          status: "active",
          monthlyRent: 1200,
          startDate: "2024-01-01",
          endDate: "2025-12-31"
        },
        {
          id: "2",
          property: "Studio Lyon 3ème",
          tenant: "Marie Martin",
          status: "active",
          monthlyRent: 650,
          startDate: "2024-03-01",
          endDate: "2025-02-28"
        },
        {
          id: "3",
          property: "Maison Bordeaux",
          tenant: "Pierre Durand",
          status: "expired",
          monthlyRent: 1800,
          startDate: "2023-01-01",
          endDate: "2024-12-31"
        }
      ];

      // Filter by status if provided
      let filteredLeases = mockLeases;
      if (status && status !== 'all') {
        filteredLeases = mockLeases.filter(lease => lease.status === status);
      }

      // Apply limit
      const results = filteredLeases.slice(0, limit || 10);

      const toolResult = {
        results,
        total: filteredLeases.length,
        query,
        status: status || 'all'
      };
      
      console.log(`✅ DEBUG: search_leases tool returning:`, toolResult);
      return toolResult;
    },
  },
};
