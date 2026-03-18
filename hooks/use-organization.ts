"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Organization } from "@/types/organization";

export function useOrganization() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    try {
      const response = await fetch("/api/organizations");
      const data = await response.json();
      setOrganizations(data.organizations || []);
      
      if (data.organizations.length > 0) {
        const storedOrgId = localStorage.getItem("current_organization_id");
        const current = data.organizations.find((org: Organization) => org.id === storedOrgId) || data.organizations[0];
        setCurrentOrganization(current);
        setShouldRedirect(false);
      } else {
        setShouldRedirect(true);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      setShouldRedirect(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  useEffect(() => {
    if (!loading && shouldRedirect && pathname !== "/onboarding") {
      router.push("/onboarding");
    }
  }, [loading, shouldRedirect, pathname, router]);

  const switchOrganization = useCallback((organizationId: string) => {
    const org = organizations.find(o => o.id === organizationId);
    if (org) {
      setCurrentOrganization(org);
      localStorage.setItem("current_organization_id", organizationId);
    }
  }, [organizations]);

  return {
    currentOrganization,
    organizations,
    loading,
    switchOrganization,
    refetch: fetchOrganizations,
  };
}
