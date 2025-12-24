/**
 * useRagOptions Hook
 * Gère les options RAG (frontend only, pas de logique RAG)
 */

import { useState, useCallback } from "react";
import { SourceType } from "../types/document";
import { DEFAULT_RAG_OPTIONS } from "../constants/rag";

export function useRagOptions() {
  const [enabled, setEnabled] = useState(DEFAULT_RAG_OPTIONS.enabled);
  const [strictMode, setStrictMode] = useState(DEFAULT_RAG_OPTIONS.strict_mode);
  const [selectedSources, setSelectedSources] = useState<SourceType[]>(
    DEFAULT_RAG_OPTIONS.sources
  );
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedLeases, setSelectedLeases] = useState<string[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

  const toggleSource = useCallback((source: SourceType) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  }, []);

  const toggleStrictMode = useCallback(() => {
    setStrictMode((prev) => !prev);
  }, []);

  const toggleRAG = useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  const resetOptions = useCallback(() => {
    setEnabled(DEFAULT_RAG_OPTIONS.enabled);
    setStrictMode(DEFAULT_RAG_OPTIONS.strict_mode);
    setSelectedSources(DEFAULT_RAG_OPTIONS.sources);
    setSelectedDocuments([]);
    setSelectedLeases([]);
    setSelectedProperties([]);
  }, []);

  const getRagPayload = useCallback(() => {
    return {
      enabled,
      sources: selectedSources,
      document_ids: selectedDocuments.length > 0 ? selectedDocuments : undefined,
      lease_ids: selectedLeases.length > 0 ? selectedLeases : undefined,
      property_ids: selectedProperties.length > 0 ? selectedProperties : undefined,
      strict_mode: strictMode,
      max_results: DEFAULT_RAG_OPTIONS.max_results,
    };
  }, [enabled, selectedSources, selectedDocuments, selectedLeases, selectedProperties, strictMode]);

  return {
    // State
    enabled,
    strictMode,
    selectedSources,
    selectedDocuments,
    selectedLeases,
    selectedProperties,
    // Actions
    toggleSource,
    toggleStrictMode,
    toggleRAG,
    setSelectedDocuments,
    setSelectedLeases,
    setSelectedProperties,
    resetOptions,
    getRagPayload,
  };
}
