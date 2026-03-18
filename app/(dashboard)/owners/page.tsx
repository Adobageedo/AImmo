"use client"

import { useEffect, useState } from "react"
import { useOrganizationContext } from "@/context/OrganizationContext"
import { useOwners } from "@/hooks/use-owners"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LoadingPage } from "@/components/common/loading-spinner"
import { EmptyState } from "@/components/common/empty-state"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { OwnerForm } from "@/components/forms/owners/owner-form"
import { Plus, Users, Edit, Trash2, Mail, Phone } from "lucide-react"
import type { Owner } from "@/types/owner"
import { EntityColumn } from "@/components/entities"

export default function OwnersPage() {
  const { currentOrganization } = useOrganizationContext()
  const { owners, loading, fetchOwners, deleteOwner } = useOwners(currentOrganization?.id || "")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedOwner, setSelectedOwner] = useState<Owner | undefined>()

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchOwners({ page: 1, limit: 20 })
    }
  }, [currentOrganization?.id, fetchOwners])

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce propriétaire ?")) {
      await deleteOwner(id)
    }
  }

  const handleEdit = (owner: Owner) => {
    setSelectedOwner(owner)
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedOwner(undefined)
    setIsDialogOpen(true)
  }

  const handleSuccess = () => {
    setIsDialogOpen(false)
    setSelectedOwner(undefined)
    fetchOwners({ page: 1, limit: 20 })
  }

  if (loading && owners.length === 0) {
    return <LoadingPage />
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Propriétaires</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
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
              onSuccess={handleSuccess}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {(!owners || owners.length === 0) ? (
        <EmptyState
          title="Aucun propriétaire"
          description="Commencez par ajouter votre premier propriétaire pour gérer vos biens immobiliers."
          actionLabel="Ajouter un propriétaire"
          onAction={handleAdd}
          icon={<Users className="h-12 w-12" />}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Contact préféré</TableHead>
                <TableHead>Propriétés</TableHead>
                <TableHead>Baux</TableHead>
                <TableHead>Locataires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {owners.map((owner) => (
                <TableRow key={owner.id}>
                  <TableCell className="font-medium">
                    {owner.first_name} {owner.last_name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {owner.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {owner.phone}
                    </div>
                  </TableCell>
                  <TableCell>{owner.city}</TableCell>
                  <TableCell>
                    {owner.preferred_contact_method && (
                      <Badge variant="outline">
                        {owner.preferred_contact_method === 'email' && 'Email'}
                        {owner.preferred_contact_method === 'phone' && 'Téléphone'}
                        {owner.preferred_contact_method === 'sms' && 'SMS'}
                        {owner.preferred_contact_method === 'mail' && 'Courrier'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <EntityColumn
                      entityType="owner"
                      entityId={owner.id}
                      relatedType="property"
                      organizationId={currentOrganization?.id || ""}
                      preloadedRelationships={(owner as any).relationships}
                    />
                  </TableCell>
                  <TableCell>
                    <EntityColumn
                      entityType="owner"
                      entityId={owner.id}
                      relatedType="lease"
                      organizationId={currentOrganization?.id || ""}
                      preloadedRelationships={(owner as any).relationships}
                    />
                  </TableCell>
                  <TableCell>
                    <EntityColumn
                      entityType="owner"
                      entityId={owner.id}
                      relatedType="tenant"
                      organizationId={currentOrganization?.id || ""}
                      preloadedRelationships={(owner as any).relationships}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(owner)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(owner.id)}
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
  )
}
