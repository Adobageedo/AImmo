"use client"

import { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit, Trash2, Building2, Users, User, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { EntityType } from "@/types/entity-card"

interface EntityDetailLayoutProps {
  entityType: EntityType
  entityId: string
  title: string
  subtitle?: string
  status?: string
  backUrl: string
  onEdit: () => void
  onDelete: () => void
  children: ReactNode
  relationsSection?: ReactNode
}

const getEntityIcon = (type: EntityType) => {
  switch (type) {
    case 'property':
      return Building2
    case 'owner':
      return User
    case 'tenant':
      return Users
    case 'lease':
      return FileText
    default:
      return Building2
  }
}

const getEntityLabel = (type: EntityType) => {
  switch (type) {
    case 'property':
      return 'Propriété'
    case 'owner':
      return 'Propriétaire'
    case 'tenant':
      return 'Locataire'
    case 'lease':
      return 'Bail'
    default:
      return 'Entité'
  }
}

export function EntityDetailLayout({
  entityType,
  entityId,
  title,
  subtitle,
  status,
  backUrl,
  onEdit,
  onDelete,
  children,
  relationsSection
}: EntityDetailLayoutProps) {
  const router = useRouter()
  const Icon = getEntityIcon(entityType)
  const label = getEntityLabel(entityType)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(backUrl)}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                {status && (
                  <Badge variant="outline" className="ml-2">
                    {status}
                  </Badge>
                )}
              </div>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onEdit}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Modifier
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <Separator />

      {/* Contenu principal */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Détails */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Détails</CardTitle>
            <CardDescription>
              Informations détaillées de {label.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {children}
          </CardContent>
        </Card>

        {/* Relations */}
        {relationsSection && (
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Relations</CardTitle>
              <CardDescription>
                Entités liées à {label.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {relationsSection}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
