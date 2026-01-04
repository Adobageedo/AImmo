"use client"

import React, { useState } from "react"
import { Settings, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { SourceType } from "@/lib/types/document"
import { RAG_SOURCE_TYPES } from "@/lib/constants/rag"

interface RagSettingsPopoverProps {
  enabled: boolean
  strictMode: boolean
  selectedSources: SourceType[]
  onToggleRAG: () => void
  onToggleStrictMode: () => void
  onToggleSource: (source: SourceType) => void
}

export function RagSettingsPopover({
  enabled,
  strictMode,
  selectedSources,
  onToggleRAG,
  onToggleStrictMode,
  onToggleSource,
}: RagSettingsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 w-9"
        title="Paramètres RAG"
      >
        <Settings className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-12 left-0 z-50 w-80 rounded-lg border bg-popover p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Paramètres RAG</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="rag-enabled" className="text-sm">
                  RAG activé
                </Label>
                <Switch
                  id="rag-enabled"
                  checked={enabled}
                  onCheckedChange={onToggleRAG}
                />
              </div>

              {enabled && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="strict-mode" className="text-sm">
                        Mode strict
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        Réponses uniquement basées sur vos documents
                      </span>
                    </div>
                    <Switch
                      id="strict-mode"
                      checked={strictMode}
                      onCheckedChange={onToggleStrictMode}
                    />
                  </div>

                  <div className="border-t pt-3">
                    <Label className="text-sm mb-2 block">
                      Sources de données
                    </Label>
                    <div className="space-y-2">
                      {Object.entries(RAG_SOURCE_TYPES).map(([key, config]) => {
                        const sourceType = key as SourceType
                        const isSelected = selectedSources.includes(sourceType)
                        
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer"
                            onClick={() => onToggleSource(sourceType)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{config.icon}</span>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {config.label}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {config.description}
                                </span>
                              </div>
                            </div>
                            <Switch
                              checked={isSelected}
                              onCheckedChange={() => onToggleSource(sourceType)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Sources sélectionnées</span>
                      <Badge variant="secondary" className="text-xs">
                        {selectedSources.length} / {Object.keys(RAG_SOURCE_TYPES).length}
                      </Badge>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
