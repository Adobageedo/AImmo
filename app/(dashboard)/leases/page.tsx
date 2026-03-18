"use client";

import { useEffect, useState } from "react";
import { useOrganizationContext } from "@/context/OrganizationContext";
import { useLeases } from "@/hooks/use-leases";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingPage } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LeaseForm } from "@/components/forms/leases/lease-form";
import { Plus, FileText, Edit, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/calculations";
import { formatDate } from "@/lib/utils/date";
import type { Lease } from "@/types/lease";
import { EntityColumn } from "@/components/entities";

export default function LeasesPage() {
  const { currentOrganization } = useOrganizationContext();
  const { leases, loading, fetchLeases, deleteLease } = useLeases(currentOrganization?.id || "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<Lease | undefined>();

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchLeases({ page: 1, limit: 20 });
    }
  }, [currentOrganization?.id, fetchLeases]);

  const getStatusBadge = (status: Lease["status"]) => {
    const variants = {
      draft: "secondary",
      pending_signature: "warning",
      active: "success",
      expiring_soon: "warning",
      expired: "destructive",
      terminated: "secondary",
      disputed: "destructive",
    } as const;

    const labels = {
      draft: "Brouillon",
      pending_signature: "En attente signature",
      active: "Actif",
      expiring_soon: "Expire bientôt",
      expired: "Expiré",
      terminated: "Terminé",
      disputed: "Litige",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const handleAddLease = () => {
    setSelectedLease(undefined);
    setIsDialogOpen(true);
  };

  const handleEditLease = (lease: Lease) => {
    setSelectedLease(lease);
    setIsDialogOpen(true);
  };

  const handleLeaseSuccess = () => {
    setIsDialogOpen(false);
    setSelectedLease(undefined);
    fetchLeases({ page: 1, limit: 20 });
  };

  if (loading && leases.length === 0) {
    return <LoadingPage />;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Baux</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddLease}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau bail
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-none max-w-none w-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedLease ? "Modifier le bail" : "Nouveau bail"}
              </DialogTitle>
            </DialogHeader>
            <LeaseForm
              initialData={selectedLease}
              onSuccess={handleLeaseSuccess}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {(!leases || leases.length === 0) ? (
        <EmptyState
          title="Aucun bail"
          description="Créez des baux pour lier vos propriétés à vos locataires."
          actionLabel="Ajouter un bail"
          icon={<FileText className="h-12 w-12" />}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date début</TableHead>
                <TableHead>Date fin</TableHead>
                <TableHead>Loyer mensuel</TableHead>
                <TableHead>Charges</TableHead>
                <TableHead>Dépôt</TableHead>
                <TableHead>Indexation</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Propriété</TableHead>
                <TableHead>Propriétaires</TableHead>
                <TableHead>Locataires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leases.map((lease) => {
                return (
                  <TableRow key={lease.id}>
                    <TableCell>{formatDate(lease.start_date)}</TableCell>
                    <TableCell>{formatDate(lease.end_date)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(lease.monthly_rent)}</TableCell>
                    <TableCell>{formatCurrency(lease.charges)}</TableCell>
                    <TableCell>{formatCurrency(lease.deposit)}</TableCell>
                    <TableCell>
                      {lease.indexation_clause ? (
                        <Badge variant="outline">Oui ({lease.indexation_rate}%)</Badge>
                      ) : (
                        <span className="text-muted-foreground">Non</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(lease.status)}</TableCell>
                    <TableCell>
                      <EntityColumn
                        entityType="lease"
                        entityId={lease.id}
                        relatedType="property"
                        organizationId={currentOrganization?.id || ""}
                        preloadedRelationships={(lease as any).relationships}
                      />
                    </TableCell>
                    <TableCell>
                      <EntityColumn
                        entityType="lease"
                        entityId={lease.id}
                        relatedType="owner"
                        organizationId={currentOrganization?.id || ""}
                        preloadedRelationships={(lease as any).relationships}
                      />
                    </TableCell>
                    <TableCell>
                      <EntityColumn
                        entityType="lease"
                        entityId={lease.id}
                        relatedType="tenant"
                        organizationId={currentOrganization?.id || ""}
                        preloadedRelationships={(lease as any).relationships}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditLease(lease)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteLease(lease.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
