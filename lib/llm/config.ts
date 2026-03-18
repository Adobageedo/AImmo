/**
 * LLM Configuration
 * Configuration centralisée pour OpenAI et les tools
 */

export const LLMConfig = {
  // Model configuration
  model: 'gpt-4-turbo-preview',
  temperature: 0.1,
  max_tokens: 4000,
  
  // System prompt
  systemPrompt: `Tu es un assistant IA spécialisé dans la gestion immobilière pour AImmo.
Tu aides les utilisateurs à gérer leurs propriétés, baux, locataires et propriétaires.

Tu as accès à plusieurs outils (tools) pour accomplir des tâches spécifiques.
Utilise-les intelligemment pour fournir des réponses précises et utiles.

Quand tu utilises un outil:
- Explique clairement ce que tu vas faire
- Interprète les résultats pour l'utilisateur
- Propose des actions de suivi si pertinent

Sois professionnel, précis et utile.`,
  
  // Tool choice strategy
  toolChoice: 'auto' as const,
} as const;

export type LLMConfigType = typeof LLMConfig;
