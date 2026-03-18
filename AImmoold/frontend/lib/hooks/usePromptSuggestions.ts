/**
 * usePromptSuggestions Hook
 * Gère les suggestions de prompts
 */

import { useState, useCallback, useMemo } from "react";
import { PromptSuggestion, PromptCategory } from "../types/chat";
import { DEFAULT_PROMPT_SUGGESTIONS } from "../constants/prompts";

export function usePromptSuggestions() {
  const [suggestions] = useState<PromptSuggestion[]>(DEFAULT_PROMPT_SUGGESTIONS);
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | "all">("all");

  const filteredSuggestions = useMemo(() => {
    if (selectedCategory === "all") {
      return suggestions;
    }
    return suggestions.filter((s) => s.category === selectedCategory);
  }, [suggestions, selectedCategory]);

  const getSuggestionsByCategory = useCallback(
    (category: PromptCategory): PromptSuggestion[] => {
      return suggestions.filter((s) => s.category === category);
    },
    [suggestions]
  );

  const getSuggestionById = useCallback(
    (id: string): PromptSuggestion | undefined => {
      return suggestions.find((s) => s.id === id);
    },
    [suggestions]
  );

  return {
    suggestions: filteredSuggestions,
    allSuggestions: suggestions,
    selectedCategory,
    setSelectedCategory,
    getSuggestionsByCategory,
    getSuggestionById,
  };
}
