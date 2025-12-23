"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { OrganizationQuota } from "@/lib/types/document"
import { documentService } from "@/lib/services/document-service"
import { useAuthStore } from "@/lib/store/auth-store"
import { formatFileSize } from "@/lib/constants/document"

export function QuotaDisplay() {
  const [quota, setQuota] = useState<OrganizationQuota | null>(null)
  const { currentOrganizationId } = useAuthStore()

  useEffect(() => {
    const loadQuota = async () => {
      if (!currentOrganizationId) return

      try {
        const data = await documentService.getQuota(currentOrganizationId)
        setQuota(data)
      } catch (error) {
        console.error("Failed to load quota:", error)
      }
    }

    loadQuota()
  }, [currentOrganizationId])

  if (!quota) return null

  return (
    <div className="p-4 border rounded-lg space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Quota de stockage</span>
        <span className="font-medium">
          {formatFileSize(quota.used_bytes)} / {formatFileSize(quota.quota_bytes)}
        </span>
      </div>
      <Progress value={quota.usage_percentage} />
      <p className="text-xs text-muted-foreground">
        {quota.usage_percentage.toFixed(1)}% utilisé
      </p>
    </div>
  )
}
