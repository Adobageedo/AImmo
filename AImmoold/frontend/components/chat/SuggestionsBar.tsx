"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

interface Suggestion {
  id: string
  category: string
  title: string
  prompt: string
  icon: string
}

interface SuggestionsBarProps {
  suggestions: Suggestion[]
  onSelect: (prompt: string) => void
  maxVisible?: number
  variant?: "chips" | "buttons" | "list"
  className?: string
}

export function SuggestionsBar({
  suggestions,
  onSelect,
  maxVisible = 5,
  variant = "chips",
  className = ""
}: SuggestionsBarProps) {
  const visibleSuggestions = suggestions.slice(0, maxVisible)

  if (visibleSuggestions.length === 0) {
    return null
  }

  if (variant === "chips") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {visibleSuggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSelect(suggestion.prompt)}
            className="px-3 py-1.5 text-xs bg-secondary hover:bg-secondary/80 rounded-full transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <span>{suggestion.icon}</span>
            <span>{suggestion.title}</span>
          </button>
        ))}
      </div>
    )
  }

  if (variant === "buttons") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {visibleSuggestions.map((suggestion) => (
          <Button
            key={suggestion.id}
            variant="outline"
            size="sm"
            onClick={() => onSelect(suggestion.prompt)}
            className="flex items-center gap-2"
          >
            <span>{suggestion.icon}</span>
            <span>{suggestion.title}</span>
          </Button>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        <span>Suggestions</span>
      </div>
      <div className="space-y-2">
        {visibleSuggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSelect(suggestion.prompt)}
            className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{suggestion.icon}</span>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium mb-1">{suggestion.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {suggestion.prompt}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default SuggestionsBar
