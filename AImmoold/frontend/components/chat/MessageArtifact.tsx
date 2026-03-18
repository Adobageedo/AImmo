"use client"

import React from "react"
import { FileText, Table, BarChart3, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Artifact } from "@/lib/types/chat"

interface MessageArtifactProps {
  artifact: Artifact
  onExport?: (id: string, format: 'excel' | 'pdf') => void
  onView?: (id: string) => void
}

export function MessageArtifact({ artifact, onExport, onView }: MessageArtifactProps) {
  const getIcon = () => {
    switch (artifact.type) {
      case 'table':
        return <Table className="h-5 w-5" />
      case 'chart':
        return <BarChart3 className="h-5 w-5" />
      case 'document':
        return <FileText className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getTypeLabel = () => {
    switch (artifact.type) {
      case 'table':
        return 'Tableau'
      case 'chart':
        return 'Graphique'
      case 'document':
        return 'Document'
      case 'export':
        return 'Export'
      default:
        return 'Artefact'
    }
  }

  return (
    <div className="mt-3 border rounded-lg p-4 bg-muted/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 rounded-md bg-primary/10 text-primary">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm">{artifact.title}</h4>
              <Badge variant="secondary" className="text-xs">
                {getTypeLabel()}
              </Badge>
            </div>
            {artifact.metadata?.description && (
              <p className="text-xs text-muted-foreground mb-2">
                {artifact.metadata.description}
              </p>
            )}
            {artifact.type === 'table' && artifact.content?.data && (
              <div className="text-xs text-muted-foreground">
                {artifact.content.data.length} lignes × {artifact.content.columns?.length || 0} colonnes
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(artifact.id)}
              className="h-8 text-xs"
            >
              Voir
            </Button>
          )}
          {onExport && artifact.type === 'table' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onExport(artifact.id, 'excel')}
                className="h-8 w-8"
                title="Exporter en Excel"
              >
                <Download className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {artifact.type === 'table' && artifact.content?.data && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b">
                {artifact.content.columns?.slice(0, 4).map((col: any, i: number) => (
                  <th key={i} className="text-left p-2 font-medium">
                    {col.label || col.key}
                  </th>
                ))}
                {artifact.content.columns?.length > 4 && (
                  <th className="text-left p-2 font-medium text-muted-foreground">
                    +{artifact.content.columns.length - 4} colonnes
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {artifact.content.data.slice(0, 3).map((row: any, i: number) => (
                <tr key={i} className="border-b">
                  {artifact.content.columns?.slice(0, 4).map((col: any, j: number) => (
                    <td key={j} className="p-2">
                      {row[col.key]}
                    </td>
                  ))}
                  {artifact.content.columns?.length > 4 && (
                    <td className="p-2 text-muted-foreground">...</td>
                  )}
                </tr>
              ))}
              {artifact.content.data.length > 3 && (
                <tr>
                  <td colSpan={Math.min(artifact.content.columns?.length || 0, 5)} className="p-2 text-center text-muted-foreground">
                    +{artifact.content.data.length - 3} lignes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
