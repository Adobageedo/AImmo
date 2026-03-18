"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ParsedLease, ParsedParty } from "@/lib/types/processing"
import { Building2, User, FileText, Check, X } from "lucide-react"

interface LeaseValidationFormProps {
  parsedLease: ParsedLease
  onValidate: (validatedData: ParsedLease) => void
  onCancel: () => void
  loading?: boolean
}

export function LeaseValidationForm({
  parsedLease,
  onValidate,
  onCancel,
  loading = false,
}: LeaseValidationFormProps) {
  const [data, setData] = useState<ParsedLease>(parsedLease)

  const updateField = (field: keyof ParsedLease, value: any) => {
    setData({ ...data, [field]: value })
  }

  const updateParty = (index: number, field: keyof ParsedParty, value: string) => {
    const newParties = [...data.parties]
    newParties[index] = { ...newParties[index], [field]: value }
    setData({ ...data, parties: newParties })
  }

  const landlord = data.parties.find((p) => p.type === "landlord")
  const tenant = data.parties.find((p) => p.type === "tenant")
  const landlordIndex = data.parties.findIndex((p) => p.type === "landlord")
  const tenantIndex = data.parties.findIndex((p) => p.type === "tenant")

  return (
    <div className="space-y-6">
      {/* Confidence */}
      <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
        <div>
          <p className="text-sm font-medium">Confiance de l'extraction</p>
          <p className="text-xs text-muted-foreground">
            {(data.confidence * 100).toFixed(0)}% des champs ont été extraits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-48 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{ width: `${data.confidence * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Propriété */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Propriété
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Adresse *</label>
            <Input
              value={data.property_address}
              onChange={(e) => updateField("property_address", e.target.value)}
              placeholder="123 rue de la République, 75001 Paris"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Input
                value={data.property_type || ""}
                onChange={(e) => updateField("property_type", e.target.value)}
                placeholder="Appartement, maison..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Surface (m²)</label>
              <Input
                type="number"
                value={data.surface_area || ""}
                onChange={(e) =>
                  updateField("surface_area", parseFloat(e.target.value))
                }
                placeholder="50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bailleur */}
      {landlordIndex >= 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Bailleur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom *</label>
              <Input
                value={landlord?.name || ""}
                onChange={(e) => updateParty(landlordIndex, "name", e.target.value)}
                placeholder="Nom du propriétaire"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={landlord?.email || ""}
                onChange={(e) => updateParty(landlordIndex, "email", e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locataire */}
      {tenantIndex >= 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Locataire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom *</label>
              <Input
                value={tenant?.name || ""}
                onChange={(e) => updateParty(tenantIndex, "name", e.target.value)}
                placeholder="Nom du locataire"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={tenant?.email || ""}
                onChange={(e) => updateParty(tenantIndex, "email", e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations du bail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informations du bail
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date de début</label>
              <Input
                type="date"
                value={data.start_date || ""}
                onChange={(e) => updateField("start_date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date de fin</label>
              <Input
                type="date"
                value={data.end_date || ""}
                onChange={(e) => updateField("end_date", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Loyer mensuel (€)</label>
              <Input
                type="number"
                value={data.monthly_rent || ""}
                onChange={(e) =>
                  updateField("monthly_rent", parseFloat(e.target.value))
                }
                placeholder="1200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Charges (€)</label>
              <Input
                type="number"
                value={data.charges || ""}
                onChange={(e) => updateField("charges", parseFloat(e.target.value))}
                placeholder="150"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dépôt de garantie (€)</label>
              <Input
                type="number"
                value={data.deposit || ""}
                onChange={(e) => updateField("deposit", parseFloat(e.target.value))}
                placeholder="2400"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          <X className="mr-2 h-4 w-4" />
          Annuler
        </Button>
        <Button onClick={() => onValidate(data)} disabled={loading}>
          <Check className="mr-2 h-4 w-4" />
          {loading ? "Validation en cours..." : "Valider et créer les entités"}
        </Button>
      </div>
    </div>
  )
}
