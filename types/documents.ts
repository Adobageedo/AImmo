export interface DriveFolder {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  badge?: string
  isSpecial?: boolean
}

export interface FolderConfig {
  id: string
  name: string
  path: string
  description: string
  icon: React.ReactNode
  isSpecial?: boolean
  badge?: string
}

export const FOLDER_CONFIGS: Record<string, FolderConfig> = {
  Documents: {
    id: "Documents",
    name: "Documents",
    path: "/Documents",
    description: "Stockage classique pour tous vos fichiers",
    icon: null, // Will be set in component
    isSpecial: false
  },
  Leases: {
    id: "Leases",
    name: "Baux & Contrats",
    path: "/Leases",
    description: "Analyse automatique et extraction de données",
    icon: null, // Will be set in component
    isSpecial: true,
    badge: "Intelligent Parsing"
  },
  Rapport: {
    id: "Rapport",
    name: "Rapport",
    path: "/Rapport",
    description: "Rapports et analyses générés",
    icon: null, // Will be set in component
    isSpecial: false
  },
  Chat: {
    id: "Chat",
    name: "Chat Files",
    path: "/Chat",
    description: "Fichiers partagés dans le chat",
    icon: null, // Will be set in component
    isSpecial: false
  }
}

export const DRIVE_TYPES = {
  personal: "Stockage Personnel",
  google: "Google Drive",
  onedrive: "Microsoft OneDrive"
} as const

export type DriveType = keyof typeof DRIVE_TYPES
