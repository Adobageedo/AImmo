"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Folder, FileCode, ArrowLeft } from "lucide-react"

interface Folder {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  badge?: string
  isSpecial?: boolean
}

interface FolderGridProps {
  folders: Folder[]
  onSelectFolder: (folderId: string) => void
}

export function FolderGrid({ folders, onSelectFolder }: FolderGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {folders.map((folder) => (
        <Card
          key={folder.id}
          className={`cursor-pointer hover:border-indigo-500 transition-all hover:shadow-md group ${
            folder.isSpecial ? 'border-indigo-100 bg-indigo-50/10' : ''
          }`}
          onClick={() => onSelectFolder(folder.id)}
        >
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              {folder.icon}
              {folder.badge && (
                <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                  {folder.badge}
                </span>
              )}
            </div>
            <CardTitle>{folder.name}</CardTitle>
            <CardDescription>{folder.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>{folder.isSpecial ? 'Intelligent Parsing' : 'Dossier général'}</span>
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
