"use client"

import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/store/auth-store"

export function OrganizationSwitcher() {
  const { organization } = useAuthStore()

  if (!organization) return null

  return (
    <Button
      variant="outline"
      className="w-[250px] justify-start bg-gray-50/50 cursor-default hover:bg-gray-50/50"
    >
      <div className="flex items-center gap-2">
        <div className="bg-indigo-100 p-1 rounded-md">
          <Building2 className="h-4 w-4 text-indigo-600" />
        </div>
        <div className="flex flex-col items-start truncate text-left">
          <span className="truncate font-medium text-sm leading-none">
            {organization.name}
          </span>
          <span className="text-xs text-muted-foreground leading-none mt-1">
            {organization.role || "Asset Manager"}
          </span>
        </div>
      </div>
    </Button>
  )
}
