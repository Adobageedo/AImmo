"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileCode } from "lucide-react"

interface SidebarInfoProps {
  documentCount: number
  totalSize: number
  isLeaseFolder?: boolean
}

export function SidebarInfo({ documentCount, totalSize, isLeaseFolder }: SidebarInfoProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Info Dossier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fichiers</span>
              <span className="font-medium">{documentCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taille totale</span>
              <span className="font-medium">
                {(totalSize / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLeaseFolder && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-indigo-900 flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              Parsing Intelligent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-indigo-700">
              Uploadez vos baux ici. Notre IA extraira automatiquement :
            </p>
            <ul className="mt-2 space-y-1 text-sm text-indigo-600 list-disc list-inside">
              <li>Les parties (Bailleur / Locataire)</li>
              <li>Les dates et durées</li>
              <li>Les montants (Loyer, charges)</li>
              <li>Les clauses spécifiques</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
