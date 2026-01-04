"use client"

import { useState, useCallback } from "react"
import { Artifact } from "@/lib/types/chat"
import { exportService } from "@/lib/services/export-service"

export type CanvasMode = "table" | "document" | "chart" | "mixed"

interface UseCanvasOptions {
  mode?: CanvasMode
  conversationId?: string
  autoSave?: boolean
}

interface UseCanvasReturn {
  mode: CanvasMode
  artifacts: Artifact[]
  activeArtifactId: string | null
  
  createArtifact: (type: Artifact["type"], content: any, title?: string) => Promise<Artifact>
  updateArtifact: (id: string, updates: Partial<Artifact>) => Promise<void>
  deleteArtifact: (id: string) => Promise<void>
  
  exportToExcel: (id: string) => Promise<void>
  exportToPDF: (id: string) => Promise<void>
  
  selectArtifact: (id: string) => void
  setMode: (mode: CanvasMode) => void
}

export function useCanvas(options: UseCanvasOptions = {}): UseCanvasReturn {
  const [mode, setMode] = useState<CanvasMode>(options.mode || "table")
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null)

  const createArtifact = useCallback(
    async (
      type: Artifact["type"],
      content: any,
      title?: string
    ): Promise<Artifact> => {
      const artifact: Artifact = {
        id: `artifact-${Date.now()}`,
        type,
        title: title || `${type} ${artifacts.length + 1}`,
        content,
        metadata: {
          createdAt: new Date().toISOString(),
          conversationId: options.conversationId,
        },
      }

      setArtifacts(prev => [...prev, artifact])
      setActiveArtifactId(artifact.id)

      if (options.autoSave && options.conversationId) {
        try {
          await fetch('/api/canvas/artifacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationId: options.conversationId,
              artifact,
            }),
          })
        } catch (error) {
          console.error('Failed to save artifact:', error)
        }
      }

      return artifact
    },
    [artifacts.length, options.conversationId, options.autoSave]
  )

  const updateArtifact = useCallback(
    async (id: string, updates: Partial<Artifact>) => {
      setArtifacts(prev =>
        prev.map(a => (a.id === id ? { ...a, ...updates } : a))
      )

      if (options.autoSave && options.conversationId) {
        try {
          await fetch(`/api/canvas/artifacts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          })
        } catch (error) {
          console.error('Failed to update artifact:', error)
        }
      }
    },
    [options.conversationId, options.autoSave]
  )

  const deleteArtifact = useCallback(
    async (id: string) => {
      setArtifacts(prev => prev.filter(a => a.id !== id))
      
      if (activeArtifactId === id) {
        setActiveArtifactId(
          artifacts.length > 1 ? artifacts[0].id : null
        )
      }

      if (options.autoSave && options.conversationId) {
        try {
          await fetch(`/api/canvas/artifacts/${id}`, {
            method: 'DELETE',
          })
        } catch (error) {
          console.error('Failed to delete artifact:', error)
        }
      }
    },
    [activeArtifactId, artifacts, options.conversationId, options.autoSave]
  )

  const exportToExcel = useCallback(
    async (id: string) => {
      try {
        await exportService.exportArtifact(id, 'excel')
      } catch (error) {
        console.error('Failed to export to Excel:', error)
        throw error
      }
    },
    []
  )

  const exportToPDF = useCallback(
    async (id: string) => {
      try {
        await exportService.exportArtifact(id, 'pdf')
      } catch (error) {
        console.error('Failed to export to PDF:', error)
        throw error
      }
    },
    []
  )

  const selectArtifact = useCallback((id: string) => {
    setActiveArtifactId(id)
  }, [])

  return {
    mode,
    artifacts,
    activeArtifactId,
    createArtifact,
    updateArtifact,
    deleteArtifact,
    exportToExcel,
    exportToPDF,
    selectArtifact,
    setMode,
  }
}

export default useCanvas
