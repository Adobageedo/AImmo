"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, AlertCircle, Edit, Building, User, Users, Loader2 } from 'lucide-react'
import type { LeaseDocumentExtraction, EntityMatch, ValidateAndCreateLeaseRequest } from '@/types/lease-document'
import { LeaseDocumentService } from '@/lib/services/lease-document-service'

interface LeaseExtractionValidatorProps {
  extraction: LeaseDocumentExtraction
  onComplete: (leaseId: string) => void
  onCancel: () => void
}

export function LeaseExtractionValidator({ extraction, onComplete, onCancel }: LeaseExtractionValidatorProps) {
  const [editedData, setEditedData] = useState(extraction.extracted_data)
  const [propertyAction, setPropertyAction] = useState<'link' | 'create'>(
    extraction.entity_matches.property?.suggested_action === 'review' 
      ? 'create' 
      : (extraction.entity_matches.property?.suggested_action || 'create')
  )
  const [ownerAction, setOwnerAction] = useState<'link' | 'create'>(
    extraction.entity_matches.owner?.suggested_action === 'review' 
      ? 'create' 
      : (extraction.entity_matches.owner?.suggested_action || 'create')
  )
  const [tenantAction, setTenantAction] = useState<'link' | 'create'>(
    extraction.entity_matches.tenant?.suggested_action === 'review' 
      ? 'create' 
      : (extraction.entity_matches.tenant?.suggested_action || 'create')
  )
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>(
    extraction.entity_matches.property?.existing_id
  )
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | undefined>(
    extraction.entity_matches.owner?.existing_id
  )
  const [selectedTenantId, setSelectedTenantId] = useState<string | undefined>(
    extraction.entity_matches.tenant?.existing_id
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null
    if (confidence >= 0.8) return <Badge variant="default" className="bg-green-500">Haute confiance</Badge>
    if (confidence >= 0.5) return <Badge variant="secondary">Confiance moyenne</Badge>
    return <Badge variant="destructive">Faible confiance</Badge>
  }

  const getMatchStatusBadge = (match?: EntityMatch) => {
    if (!match) return <Badge variant="outline">Non détecté</Badge>
    
    switch (match.status) {
      case 'exact':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Correspondance exacte</Badge>
      case 'fuzzy':
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Correspondance partielle</Badge>
      case 'new':
        return <Badge variant="outline">Nouveau</Badge>
      default:
        return <Badge variant="outline">À vérifier</Badge>
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    try {
      const request: ValidateAndCreateLeaseRequest = {
        extraction_id: extraction.id,
        validated_data: {
          lease_data: editedData,
          property_action: propertyAction,
          property_id: propertyAction === 'link' ? selectedPropertyId : undefined,
          owner_action: ownerAction,
          owner_id: ownerAction === 'link' ? selectedOwnerId : undefined,
          tenant_action: tenantAction,
          tenant_id: tenantAction === 'link' ? selectedTenantId : undefined,
        }
      }

      const response = await LeaseDocumentService.validateAndCreateLease(request)
      onComplete(response.lease_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Validation des données extraites</CardTitle>
              <CardDescription>
                Vérifiez et corrigez les informations avant de créer le bail
              </CardDescription>
            </div>
            {getConfidenceBadge(extraction.extracted_data.confidence_score)}
          </div>
        </CardHeader>
      </Card>

      {/* Property Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              <CardTitle className="text-lg">Propriété</CardTitle>
            </div>
            {getMatchStatusBadge(extraction.entity_matches.property)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={editedData.property_address || ''}
                onChange={(e) => setEditedData({ ...editedData, property_address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input
                value={editedData.property_city || ''}
                onChange={(e) => setEditedData({ ...editedData, property_city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Code postal</Label>
              <Input
                value={editedData.property_postal_code || ''}
                onChange={(e) => setEditedData({ ...editedData, property_postal_code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Surface (m²)</Label>
              <Input
                type="number"
                value={editedData.property_surface || ''}
                onChange={(e) => setEditedData({ ...editedData, property_surface: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Action</Label>
            <Select value={propertyAction} onValueChange={(v) => setPropertyAction(v as 'link' | 'create')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="create">Créer une nouvelle propriété</SelectItem>
                {extraction.entity_matches.property?.existing_id && (
                  <SelectItem value="link">
                    Lier à : {extraction.entity_matches.property.existing_name}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Owner Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle className="text-lg">Propriétaire</CardTitle>
            </div>
            {getMatchStatusBadge(extraction.entity_matches.owner)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={editedData.landlord_name || ''}
                onChange={(e) => setEditedData({ ...editedData, landlord_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editedData.landlord_email || ''}
                onChange={(e) => setEditedData({ ...editedData, landlord_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={editedData.landlord_phone || ''}
                onChange={(e) => setEditedData({ ...editedData, landlord_phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={editedData.landlord_address || ''}
                onChange={(e) => setEditedData({ ...editedData, landlord_address: e.target.value })}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Action</Label>
            <Select value={ownerAction} onValueChange={(v) => setOwnerAction(v as 'link' | 'create')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="create">Créer un nouveau propriétaire</SelectItem>
                {extraction.entity_matches.owner?.existing_id && (
                  <SelectItem value="link">
                    Lier à : {extraction.entity_matches.owner.existing_name}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle className="text-lg">Locataire</CardTitle>
            </div>
            {getMatchStatusBadge(extraction.entity_matches.tenant)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={editedData.tenant_name || ''}
                onChange={(e) => setEditedData({ ...editedData, tenant_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editedData.tenant_email || ''}
                onChange={(e) => setEditedData({ ...editedData, tenant_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={editedData.tenant_phone || ''}
                onChange={(e) => setEditedData({ ...editedData, tenant_phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={editedData.tenant_address || ''}
                onChange={(e) => setEditedData({ ...editedData, tenant_address: e.target.value })}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Action</Label>
            <Select value={tenantAction} onValueChange={(v) => setTenantAction(v as 'link' | 'create')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="create">Créer un nouveau locataire</SelectItem>
                {extraction.entity_matches.tenant?.existing_id && (
                  <SelectItem value="link">
                    Lier à : {extraction.entity_matches.tenant.existing_name}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lease Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Détails du bail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Input
                type="date"
                value={editedData.start_date || ''}
                onChange={(e) => setEditedData({ ...editedData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={editedData.end_date || ''}
                onChange={(e) => setEditedData({ ...editedData, end_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Durée (mois)</Label>
              <Input
                type="number"
                value={editedData.duration_months || ''}
                onChange={(e) => setEditedData({ ...editedData, duration_months: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Loyer mensuel (€)</Label>
              <Input
                type="number"
                value={editedData.monthly_rent || ''}
                onChange={(e) => setEditedData({ ...editedData, monthly_rent: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Charges (€)</Label>
              <Input
                type="number"
                value={editedData.charges || ''}
                onChange={(e) => setEditedData({ ...editedData, charges: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Dépôt de garantie (€)</Label>
              <Input
                type="number"
                value={editedData.deposit || ''}
                onChange={(e) => setEditedData({ ...editedData, deposit: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Annuler
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Créer le bail
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
