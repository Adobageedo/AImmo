/**
 * Chat Constants
 */

import { ChatMode, PromptCategory } from "../types/chat";

export const CHAT_MODES = {
  [ChatMode.NORMAL]: {
    label: "Normal",
    description: "Chat avec connaissances générales et RAG",
    icon: "💬",
  },
  [ChatMode.RAG_ONLY]: {
    label: "RAG Only",
    description: "Réponses uniquement basées sur vos documents",
    icon: "📚",
  },
  [ChatMode.RAG_ENHANCED]: {
    label: "RAG Enhanced",
    description: "RAG + connaissances générales",
    icon: "🚀",
  },
};

export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_CITATIONS_DEFAULT = 5;
export const STREAMING_ENABLED_DEFAULT = true;

export const PROMPT_CATEGORIES = {
  [PromptCategory.LEASE_ANALYSIS]: {
    label: "Analyse de bail",
    icon: "📄",
    color: "blue",
  },
  [PromptCategory.PROPERTY_COMPARISON]: {
    label: "Comparaison de biens",
    icon: "🏠",
    color: "green",
  },
  [PromptCategory.FINANCIAL_REPORT]: {
    label: "Rapport financier",
    icon: "💰",
    color: "yellow",
  },
  [PromptCategory.GENERAL]: {
    label: "Général",
    icon: "💡",
    color: "gray",
  },
};

export const EXPORT_FORMATS = {
  excel: { label: "Excel", icon: "📊", extension: ".xlsx" },
  pdf: { label: "PDF", icon: "📄", extension: ".pdf" },
  markdown: { label: "Markdown", icon: "📝", extension: ".md" },
  json: { label: "JSON", icon: "🔧", extension: ".json" },
};
