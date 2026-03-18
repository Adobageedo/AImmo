"use client"

import { ReactNode } from "react"
import { Separator } from "@/components/ui/separator"

interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <Separator />
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}
