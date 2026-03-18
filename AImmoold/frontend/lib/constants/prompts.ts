/**
 * Prompt Suggestions Constants
 */

import { PromptCategory, PromptSuggestion } from "../types/chat";

export const DEFAULT_PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  {
    id: "lease-summary",
    category: PromptCategory.LEASE_ANALYSIS,
    title: "Résumer un bail",
    prompt: "Peux-tu résumer le bail en mettant en évidence les dates clés, le loyer, et les clauses importantes ?",
    icon: "📄",
  },
  {
    id: "lease-termination",
    category: PromptCategory.LEASE_ANALYSIS,
    title: "Conditions de résiliation",
    prompt: "Quelles sont les conditions de résiliation anticipée dans mes baux ?",
    icon: "✖️",
  },
  {
    id: "property-comparison",
    category: PromptCategory.PROPERTY_COMPARISON,
    title: "Comparer des biens",
    prompt: "Compare mes propriétés en termes de rendement, surface et localisation",
    icon: "🏠",
  },
  {
    id: "best-performer",
    category: PromptCategory.PROPERTY_COMPARISON,
    title: "Meilleur rendement",
    prompt: "Quel bien a le meilleur rendement locatif actuellement ?",
    icon: "📈",
  },
  {
    id: "financial-overview",
    category: PromptCategory.FINANCIAL_REPORT,
    title: "Vue financière globale",
    prompt: "Donne-moi une vue d'ensemble de ma situation financière avec revenus, charges et rendement",
    icon: "💰",
  },
  {
    id: "monthly-income",
    category: PromptCategory.FINANCIAL_REPORT,
    title: "Revenus mensuels",
    prompt: "Calcule mes revenus locatifs mensuels totaux",
    icon: "💵",
  },
  {
    id: "upcoming-deadlines",
    category: PromptCategory.GENERAL,
    title: "Échéances à venir",
    prompt: "Quelles sont les prochaines échéances importantes (fins de bail, paiements) ?",
    icon: "📅",
  },
  {
    id: "vacant-properties",
    category: PromptCategory.GENERAL,
    title: "Biens vacants",
    prompt: "Liste-moi les biens actuellement vacants avec leur durée de vacance",
    icon: "🏚️",
  },
];

export const SYSTEM_PROMPTS = {
  default: `Tu es un assistant IA spécialisé dans la gestion immobilière. 
Tu as accès aux documents, baux, propriétés et données financières de l'utilisateur.
Réponds de manière claire, concise et professionnelle.
Si tu utilises des données spécifiques, cite toujours tes sources.`,
  
  rag_only: `Tu es un assistant IA qui répond UNIQUEMENT en te basant sur les documents fournis.
Ne fais AUCUNE hypothèse et n'utilise AUCUNE connaissance générale.
Si l'information n'est pas dans les documents, dis-le clairement.
Cite toujours tes sources avec précision.`,
};
