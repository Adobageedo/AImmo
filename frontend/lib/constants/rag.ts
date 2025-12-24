/**
 * RAG Constants
 */

import { SourceType } from "../types/document";

export const RAG_SOURCE_TYPES = {
  [SourceType.DOCUMENT]: {
    label: "Documents",
    description: "Vos documents uploadés",
    icon: "📄",
    color: "blue",
  },
  [SourceType.LEASE]: {
    label: "Baux",
    description: "Contrats de location",
    icon: "📋",
    color: "purple",
  },
  [SourceType.PROPERTY]: {
    label: "Propriétés",
    description: "Informations sur les biens",
    icon: "🏠",
    color: "green",
  },
  [SourceType.TENANT]: {
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
  [SourceType.CONVERSATION]: {
    label: "Conversations",
    description: "Historique des conversations",
    icon: "💬",
    color: "gray",
  },
};

export const DEFAULT_RAG_OPTIONS = {
  enabled: true,
  strict_mode: false,
  max_results: 10,
  sources: [
    SourceType.DOCUMENT,
    SourceType.LEASE,
    SourceType.PROPERTY,
  ],
};

export const RAG_STRICT_MODE_INFO = {
  label: "Mode strict",
  description: "Réponses uniquement basées sur vos documents (pas de connaissances générales)",
  icon: "🔒",
};
