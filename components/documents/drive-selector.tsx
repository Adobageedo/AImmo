"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HardDrive, Cloud } from "lucide-react"

interface DriveSelectorProps {
  onSelectDrive: (drive: "personal" | "google" | "onedrive") => void
}

export function DriveSelector({ onSelectDrive }: DriveSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Personal Storage */}
      <Card
        className="cursor-pointer hover:border-indigo-500 transition-all hover:shadow-md group"
        onClick={() => onSelectDrive("personal")}
      >
        <CardHeader>
          <HardDrive className="h-10 w-10 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
          <CardTitle>Stockage Personnel</CardTitle>
          <CardDescription>Vos documents stockés localement sur AImmo</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full">Accéder</Button>
        </CardContent>
      </Card>

      {/* Google Drive */}
      <Card className="opacity-75 relative overflow-hidden border-dashed">
        <CardHeader>
          <div className="flex justify-between items-start">
            <Cloud className="h-10 w-10 text-blue-500 mb-2" />
            <Badge variant="secondary">Bientôt</Badge>
          </div>
          <CardTitle>Google Drive</CardTitle>
          <CardDescription>Connectez votre compte Google Workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" disabled>Connexion</Button>
        </CardContent>
      </Card>

      {/* OneDrive */}
      <Card className="opacity-75 relative overflow-hidden border-dashed">
        <CardHeader>
          <div className="flex justify-between items-start">
            <Cloud className="h-10 w-10 text-sky-600 mb-2" />
            <Badge variant="secondary">Bientôt</Badge>
          </div>
          <CardTitle>Microsoft OneDrive</CardTitle>
          <CardDescription>Synchronisez avec votre compte Microsoft</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" disabled>Connexion</Button>
        </CardContent>
      </Card>
    </div>
  )
}
