"use client"

import React, { useState } from "react"
import { Citation } from "@/lib/types/chat"
import { SourceType } from "@/lib/types/document"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Home, Users, BarChart3, MessageSquare, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"

interface Source {
  id: string
  type: SourceType
  name: string
  url?: string
  excerpt: string
  metadata?: Record<string, any>
}

interface SourcesPanelProps {
  citations: Citation[]
  onSourceClick?: (citation: Citation) => void
  groupByType?: boolean
  className?: string
}

const sourceIcons: Record<SourceType, any> = {
  [SourceType.DOCUMENTS]: FileText,
  [SourceType.LEASES]: FileText,
  [SourceType.PROPERTIES]: Home,
  [SourceType.TENANTS]: Users,
  [SourceType.KPI]: BarChart3,
  [SourceType.OWNERS]: Users,
}

const sourceColors: Record<SourceType, string> = {
  [SourceType.DOCUMENTS]: "blue",
  [SourceType.LEASES]: "green",
  [SourceType.PROPERTIES]: "purple",
  [SourceType.TENANTS]: "orange",
  [SourceType.KPI]: "red",
  [SourceType.OWNERS]: "gray",
}

export function SourcesPanel({
  citations,
  onSourceClick,
  groupByType = false,
  className = ""
}: SourcesPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  if (citations.length === 0) {
    return (
      <div className={`p-4 text-center text-muted-foreground ${className}`}>
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Aucune source pour le moment</p>
      </div>
    )
  }

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const groupedCitations = groupByType
    ? citations.reduce((acc, citation) => {
        const type = citation.source_type
        if (!acc[type]) acc[type] = []
        acc[type].push(citation)
        return acc
      }, {} as Record<SourceType, Citation[]>)
    : { all: citations }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Sources ({citations.length})</h3>
      </div>

      {Object.entries(groupedCitations).map(([type, typeCitations]) => (
        <div key={type} className="space-y-2">
          {groupByType && type !== "all" && (
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              {React.createElement(sourceIcons[type as SourceType], { className: "h-3 w-3" })}
              <span>{type}</span>
            </div>
          )}

          {typeCitations.map((citation, idx) => {
            const Icon = sourceIcons[citation.source_type]
            const isExpanded = expandedIds.has(citation.id)

            return (
              <Card
                key={citation.id}
                className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSourceClick?.(citation)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full bg-${sourceColors[citation.source_type]}-100 flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 text-${sourceColors[citation.source_type]}-600`} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        [{idx + 1}]
                      </span>
                      <h4 className="text-sm font-medium truncate">
                        {citation.document_title}
                      </h4>
                    </div>

                    <p className={`text-xs text-muted-foreground ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {citation.content_preview}
                    </p>

                    {citation.page_number && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Page {citation.page_number}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpand(citation.id)
                        }}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Réduire
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Voir plus
                          </>
                        )}
                      </Button>

                      {citation.url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(citation.url, '_blank')
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ouvrir
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default SourcesPanel
