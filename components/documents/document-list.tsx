"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"
import type { Document } from "@/types/document"

interface DocumentListProps {
  documents: Document[]
  onDownload?: (documentId: string) => void
}

export function DocumentList({ documents, onDownload }: DocumentListProps) {
  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      lease: "Bail",
      invoice: "Facture",
      payment_notice: "Avis de paiement",
      diagnostic: "Diagnostic",
      financial_report: "Rapport financier",
      other: "Autre"
    }
    return labels[type] || type
  }

  return (
    <div className="divide-y">
      {documents.map((doc) => (
        <div key={doc.id} className="p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-indigo-500" />
              <div>
                <h3 className="font-medium">{doc.name}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{getDocumentTypeLabel(doc.type)}</Badge>
              {doc.status && (
                <Badge 
                  variant={
                    doc.status === 'processed' ? 'default' :
                    doc.status === 'processing' ? 'secondary' :
                    doc.status === 'failed' ? 'destructive' : 'outline'
                  }
                >
                  {doc.status === 'processed' ? 'Traité' :
                   doc.status === 'processing' ? 'En cours' :
                   doc.status === 'failed' ? 'Échec' : 'En attente'}
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDownload?.(doc.id)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
