"use client";

import { useEffect, useState } from "react";
import { useOrganizationContext } from "@/context/OrganizationContext";
import { useProperties } from "@/hooks/use-properties";
import { useOwners } from "@/hooks/use-owners";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingPage } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OwnerForm } from "@/components/forms/owners/owner-form";
import { PropertyForm } from "@/components/forms/properties/property-form";
import { Plus, Building2, Edit, Trash2, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils/calculations";
import type { Property } from "@/types/property";
import type { Owner } from "@/types/owner";
import { EntityColumn } from "@/components/entities";

export default function PropertiesPage() {
  const { currentOrganization } = useOrganizationContext();
  const { properties, loading, fetchProperties, deleteProperty } = useProperties(currentOrganization?.id || "");
  const { fetchOwners } = useOwners(currentOrganization?.id || "");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isOwnerDialogOpen, setIsOwnerDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<Owner | undefined>();
  const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false);

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchProperties({ page: 1, limit: 20 });
    }
  }, [currentOrganization?.id, fetchProperties]);

  const getStatusBadge = (status: Property["status"]) => {
    const variants = {
      available: "secondary",
      rented: "success",
      maintenance: "warning",
      sold: "default",
    } as const;

    const labels = {
      available: "Disponible",
      rented: "Loué",
      maintenance: "Maintenance",
      sold: "Vendu",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getTypeBadge = (type: Property["type"]) => {
    const labels = {
      residential: "Résidentiel",
      commercial: "Commercial",
      industrial: "Industriel",
      mixed: "Mixte",
    };

    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  const handleOwnerSuccess = () => {
    setIsOwnerDialogOpen(false);
    setSelectedOwner(undefined);
    fetchOwners({ page: 1, limit: 20 });
  };

  const handleAddProperty = () => {
    setSelectedProperty(null);
    setIsPropertyDialogOpen(true);
  };

  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setIsPropertyDialogOpen(true);
  };

  const handlePropertySuccess = () => {
    setIsPropertyDialogOpen(false);
    setSelectedProperty(null);
    fetchProperties({ page: 1, limit: 20 });
  };

  if (loading && properties.length === 0) {
    return <LoadingPage />;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Propriétés</h2>
        <div className="flex gap-2">
          <Dialog open={isOwnerDialogOpen} onOpenChange={setIsOwnerDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setIsOwnerDialogOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                Nouveau propriétaire
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-none max-w-none w-auto max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedOwner ? "Modifier le propriétaire" : "Nouveau propriétaire"}
                </DialogTitle>
              </DialogHeader>
              <OwnerForm
                initialData={selectedOwner}
                onSuccess={handleOwnerSuccess}
                onCancel={() => setIsOwnerDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={isPropertyDialogOpen} onOpenChange={setIsPropertyDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddProperty}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle propriété
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-none max-w-none w-auto max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedProperty ? "Modifier la propriété" : "Nouvelle propriété"}
                </DialogTitle>
              </DialogHeader>
              <PropertyForm
                initialData={selectedProperty || undefined}
                onSuccess={handlePropertySuccess}
                onCancel={() => setIsPropertyDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(!properties || properties.length === 0) ? (
        <EmptyState
          title="Aucune propriété"
          description="Commencez par ajouter votre première propriété pour gérer votre portefeuille immobilier."
          actionLabel="Ajouter une propriété"
          icon={<Building2 className="h-12 w-12" />}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Surface</TableHead>
                <TableHead>Valeur estimée</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Baux</TableHead>
                <TableHead>Propriétaires</TableHead>
                <TableHead>Locataires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">{property.name}</TableCell>
                  <TableCell>{getTypeBadge(property.type)}</TableCell>
                  <TableCell>{property.city}, {property.country}</TableCell>
                  <TableCell>{property.surface} m²</TableCell>
                  <TableCell>{formatCurrency(property.estimated_value)}</TableCell>
                  <TableCell>{getStatusBadge(property.status)}</TableCell>
                  <TableCell>
                    <EntityColumn
                      entityType="property"
                      entityId={property.id}
                      relatedType="lease"
                      organizationId={currentOrganization?.id || ""}
                      preloadedRelationships={(property as any).relationships}
                    />
                  </TableCell>
                  <TableCell>
                    <EntityColumn
                      entityType="property"
                      entityId={property.id}
                      relatedType="owner"
                      organizationId={currentOrganization?.id || ""}
                      preloadedRelationships={(property as any).relationships}
                    />
                  </TableCell>
                  <TableCell>
                    <EntityColumn
                      entityType="property"
                      entityId={property.id}
                      relatedType="tenant"
                      organizationId={currentOrganization?.id || ""}
                      preloadedRelationships={(property as any).relationships}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditProperty(property)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteProperty(property.id)}
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
