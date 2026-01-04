"use client"

import React, { useState } from "react"
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import { Citation } from "@/lib/types/chat"
import { Badge } from "@/components/ui/badge"
import { RAG_SOURCE_TYPES } from "@/lib/constants/rag"

interface MessageSourcesProps {
  citations: Citation[]
  onCitationClick?: (citation: Citation) => void
}

export function MessageSources({ citations, onCitationClick }: MessageSourcesProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!citations || citations.length === 0) {
    return null
  }

  return (
    <div className="mt-3 border-t pt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <span className="font-medium">
          {citations.length} source{citations.length > 1 ? 's' : ''}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {citations.map((citation, index) => {
            const sourceConfig = RAG_SOURCE_TYPES[citation.source_type]
            
            return (
              <div
                key={citation.id}
                className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onCitationClick?.(citation)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-lg flex-shrink-0">{sourceConfig?.icon || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {citation.document_title}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {citation.content_preview}
                      </p>
                      {citation.page_number && (
                        <span className="text-xs text-muted-foreground mt-1 inline-block">
                          Page {citation.page_number}
                        </span>
                      )}
                    </div>
                  </div>
                  {citation.url && (
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
