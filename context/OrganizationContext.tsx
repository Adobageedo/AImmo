"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useOrganization } from "@/hooks/use-organization";
import type { Organization } from "@/types/organization";

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  loading: boolean;
  switchOrganization: (organizationId: string) => void;
  refetch: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const organization = useOrganization();

  return (
    <OrganizationContext.Provider value={organization}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganizationContext must be used within an OrganizationProvider");
  }
  return context;
}
