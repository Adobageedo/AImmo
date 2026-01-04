/**
 * useRagOptions Hook
 * Gère les options RAG (frontend only, pas de logique RAG)
 * Persiste les paramètres dans localStorage
 */

import { useState, useCallback, useEffect } from "react";
import { SourceType } from "../types/document";
import { DEFAULT_RAG_OPTIONS } from "../constants/rag";

const RAG_STORAGE_KEY = 'aimmo_rag_options';

// Charger les options depuis localStorage
function loadRagOptions() {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(RAG_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    console.error('Failed to load RAG options:', err);
    return null;
  }
}

// Sauvegarder les options dans localStorage
function saveRagOptions(options: any) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(RAG_STORAGE_KEY, JSON.stringify(options));
  } catch (err) {
    console.error('Failed to save RAG options:', err);
  }
}

export function useRagOptions() {
  // Initialiser avec les valeurs sauvegardées ou les valeurs par défaut
  const savedOptions = loadRagOptions();
  
  const [enabled, setEnabled] = useState(savedOptions?.enabled ?? DEFAULT_RAG_OPTIONS.enabled);
  const [strictMode, setStrictMode] = useState(savedOptions?.strictMode ?? DEFAULT_RAG_OPTIONS.strict_mode);
  const [selectedSources, setSelectedSources] = useState<SourceType[]>(
    savedOptions?.selectedSources ?? DEFAULT_RAG_OPTIONS.sources
  );
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>(savedOptions?.selectedDocuments ?? []);
  const [selectedLeases, setSelectedLeases] = useState<string[]>(savedOptions?.selectedLeases ?? []);
  const [selectedProperties, setSelectedProperties] = useState<string[]>(savedOptions?.selectedProperties ?? []);

  // Sauvegarder automatiquement les changements
  useEffect(() => {
    saveRagOptions({
      enabled,
      strictMode,
      selectedSources,
      selectedDocuments,
      selectedLeases,
      selectedProperties,
    });
  }, [enabled, strictMode, selectedSources, selectedDocuments, selectedLeases, selectedProperties]);

  const toggleSource = useCallback((source: SourceType) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  }, []);

  const toggleStrictMode = useCallback(() => {
    setStrictMode((prev: boolean) => !prev);
  }, []);

  const toggleRAG = useCallback(() => {
    setEnabled((prev: boolean) => !prev);
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
