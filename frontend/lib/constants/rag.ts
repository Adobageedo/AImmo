/**
 * RAG Constants
 */

import { SourceType } from "../types/document";

export const RAG_SOURCE_TYPES = {
  [SourceType.DOCUMENTS]: {
    label: "Documents",
    description: "Vos documents uploadés",
    icon: "📄",
    color: "blue",
  },
  [SourceType.LEASES]: {
    label: "Baux",
    description: "Contrats de location",
    icon: "📋",
    color: "purple",
  },
  [SourceType.PROPERTIES]: {
    label: "Propriétés",
    description: "Informations sur les biens",
    icon: "🏠",
    color: "green",
  },
  [SourceType.TENANTS]: {
    label: "Locataires",
    description: "Informations sur les locataires",
    icon: "👤",
    color: "orange",
  },
  [SourceType.KPI]: {
    label: "KPIs",
    description: "Indicateurs de performance",
    icon: "📊",
    color: "yellow",
  },
  [SourceType.OWNERS]: {
    label: "Propriétaires",
    description: "Informations sur les propriétaires",
    icon: "👥",
    color: "indigo",
  },
};

export const DEFAULT_RAG_OPTIONS = {
  enabled: false,  // RAG désactivé par défaut
  strict_mode: false,
  max_results: 10,
  sources: [],  // Aucune source sélectionnée par défaut
};

export const RAG_STRICT_MODE_INFO = {
  label: "Mode strict",
  description: "Réponses uniquement basées sur vos documents (pas de connaissances générales)",
  icon: "🔒",
};
