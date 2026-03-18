"use client";

import { useEffect, useState } from "react";
import { useOrganizationContext } from "@/context/OrganizationContext";
import { useTenants } from "@/hooks/use-tenants";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingPage } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TenantForm } from "@/components/forms/tenants/tenant-form";
import { Plus, Users, Edit, Trash2 } from "lucide-react";
import type { Tenant } from "@/types/tenant";
import { EntityColumn } from "@/components/entities";

export default function TenantsPage() {
  const { currentOrganization } = useOrganizationContext();
  const { tenants, loading, fetchTenants, deleteTenant } = useTenants(currentOrganization?.id || "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | undefined>();

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchTenants({ page: 1, limit: 20 });
    }
  }, [currentOrganization?.id, fetchTenants]);

  const getPaymentStatusBadge = (status: Tenant["payment_status"]) => {
    const variants = {
      ok: "success",
      late: "warning",
      unpaid: "destructive",
    } as const;

    const labels = {
      ok: "À jour",
      late: "Retard",
      unpaid: "Impayé",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getTypeBadge = (type: Tenant["type"]) => {
    const labels = {
      individual: "Particulier",
      company: "Entreprise",
    };

    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  const getTenantName = (tenant: Tenant) => {
    if (tenant.type === "company") {
      return tenant.company_name || "Sans nom";
    }
    return `${tenant.first_name || ""} ${tenant.last_name || ""}`.trim() || "Sans nom";
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce locataire ?")) {
      await deleteTenant(id);
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedTenant(undefined);
    setIsDialogOpen(true);
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setSelectedTenant(undefined);
    fetchTenants({ page: 1, limit: 20 });
  };

  if (loading && (!tenants || tenants.length === 0)) {
    return <LoadingPage />;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Locataires</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau locataire
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-none max-w-none w-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTenant ? "Modifier le locataire" : "Nouveau locataire"}
              </DialogTitle>
            </DialogHeader>
            <TenantForm
              initialData={selectedTenant}
              onSuccess={handleSuccess}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {(!tenants || tenants.length === 0) ? (
        <EmptyState
          title="Aucun locataire"
          description="Ajoutez vos locataires pour gérer vos baux et suivre les paiements."
          actionLabel="Ajouter un locataire"
          icon={<Users className="h-12 w-12" />}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Statut paiement</TableHead>
                <TableHead>Propriétés</TableHead>
                <TableHead>Baux</TableHead>
                <TableHead>Propriétaires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{getTenantName(tenant)}</TableCell>
                  <TableCell>{getTypeBadge(tenant.type)}</TableCell>
                  <TableCell>{tenant.email}</TableCell>
                  <TableCell>{tenant.phone || "-"}</TableCell>
                  <TableCell>{tenant.city || "-"}</TableCell>
                  <TableCell>{getPaymentStatusBadge(tenant.payment_status)}</TableCell>
                  <TableCell>
                    <EntityColumn
                      entityType="tenant"
                      entityId={tenant.id}
                      relatedType="property"
                      organizationId={currentOrganization?.id || ""}
                      preloadedRelationships={(tenant as any).relationships}
                    />
                  </TableCell>
                  <TableCell>
                    <EntityColumn
                      entityType="tenant"
                      entityId={tenant.id}
                      relatedType="lease"
                      organizationId={currentOrganization?.id || ""}
                      preloadedRelationships={(tenant as any).relationships}
                    />
                  </TableCell>
                  <TableCell>
                    <EntityColumn
                      entityType="tenant"
                      entityId={tenant.id}
                      relatedType="owner"
                      organizationId={currentOrganization?.id || ""}
                      preloadedRelationships={(tenant as any).relationships}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(tenant)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tenant.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
