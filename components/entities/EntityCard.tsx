"use client"

import { useRouter } from "next/navigation"
import { Building, User, Users, FileText, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { EntityCardData, EntityType } from "@/types/entity-card"

interface EntityCardProps {
  data: EntityCardData
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const getEntityIcon = (type: EntityType) => {
  switch (type) {
    case 'property':
      return Home
    case 'owner':
      return User
    case 'tenant':
      return Users
    case 'lease':
      return FileText
    default:
      return Building
  }
}

const getEntityColor = (type: EntityType) => {
  switch (type) {
    case 'property':
      return 'text-blue-600 bg-blue-50 hover:bg-blue-100'
    case 'owner':
      return 'text-green-600 bg-green-50 hover:bg-green-100'
    case 'tenant':
      return 'text-purple-600 bg-purple-50 hover:bg-purple-100'
    case 'lease':
      return 'text-orange-600 bg-orange-50 hover:bg-orange-100'
    default:
      return 'text-gray-600 bg-gray-50 hover:bg-gray-100'
  }
}

const getEntityRoute = (type: EntityType, id: string) => {
  switch (type) {
    case 'property':
      return `/properties/${id}`
    case 'owner':
      return `/owners/${id}`
    case 'tenant':
      return `/tenants/${id}`
    case 'lease':
      return `/leases/${id}`
    default:
      return '#'
  }
}

const formatTooltipContent = (data: EntityCardData) => {
  const { type, name, essentialInfo } = data
  const lines: string[] = [name]

  if (essentialInfo) {
    switch (type) {
      case 'property':
        if (essentialInfo.address) lines.push(essentialInfo.address)
        if (essentialInfo.city) lines.push(essentialInfo.city)
        if (essentialInfo.type) lines.push(essentialInfo.type)
        break
      case 'owner':
      case 'tenant':
        if (essentialInfo.email) lines.push(essentialInfo.email)
        if (essentialInfo.phone) lines.push(essentialInfo.phone)
        if (essentialInfo.percentage) lines.push(`${essentialInfo.percentage}% de propriété`)
        if (essentialInfo.isMainOwner) lines.push('Propriétaire principal')
        if (essentialInfo.isMainTenant) lines.push('Locataire principal')
        break
      case 'lease':
        if (essentialInfo.monthlyRent) lines.push(`${essentialInfo.monthlyRent}€/mois`)
        if (essentialInfo.startDate) lines.push(`Début: ${essentialInfo.startDate}`)
        if (essentialInfo.status) lines.push(`Statut: ${essentialInfo.status}`)
        break
    }
  }

  return lines.join('\n')
}

export function EntityCard({ data, size = 'sm', className }: EntityCardProps) {
  const router = useRouter()
  const Icon = getEntityIcon(data.type)
  const colorClasses = getEntityColor(data.type)
  const route = getEntityRoute(data.type, data.id)

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-2 text-sm gap-2',
    lg: 'px-4 py-3 text-base gap-3'
  }

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  }

  const handleClick = () => {
    router.push(route)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className={cn(
              "inline-flex items-center rounded-md font-medium transition-colors",
              "cursor-pointer border border-transparent",
              colorClasses,
              sizeClasses[size],
              className
            )}
          >
            <Icon size={iconSizes[size]} />
            <span className="truncate max-w-[120px]">{data.name}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm whitespace-pre-line">
            {formatTooltipContent(data)}
            <div className="mt-2 text-xs text-muted-foreground">
              Cliquez pour voir les détails
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
