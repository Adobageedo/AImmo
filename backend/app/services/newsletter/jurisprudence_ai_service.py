"""
AI service for jurisprudence analysis with dynamic thematic grouping.
Enhanced version with LLM-powered theme detection and mobile-optimized summaries.
"""

from typing import List, Dict, Optional
from openai import OpenAI
from app.core.config import settings
import logging
import json

logger = logging.getLogger(__name__)


class JurisprudenceAIService:
    """Enhanced AI service for jurisprudence analysis with dynamic theming."""
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.detection_model = "gpt-4o-mini"
        self.synthesis_model = "gpt-4o"
        self.theming_model = "gpt-4o"
    
    def is_real_estate_article(self, title: str, text: str) -> bool:
        """
        Determine if a jurisprudence article is about real estate.
        
        Args:
            title: Article title
            text: Article content (will be truncated)
            
        Returns:
            True if article is about real estate
        """
        prompt = f"""Tu es un expert juridique analysant des articles de jurisprudence française.

Article: {title}

Texte: {text[:3000]}

Question: Cet article de jurisprudence concerne-t-il le secteur immobilier ?
Cela inclut: droit immobilier, location, construction, transactions immobilières, 
copropriété, expulsions, litiges immobiliers, droit du logement, urbanisme, etc.

Réponds uniquement par "OUI" ou "NON"."""

        try:
            response = self.client.chat.completions.create(
                model=self.detection_model,
                messages=[
                    {
                        "role": "system",
                        "content": "Tu es un expert juridique spécialisé en droit français. Réponds uniquement par OUI ou NON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=10
            )
            
            answer = response.choices[0].message.content.strip().upper()
            return "OUI" in answer
        
        except Exception as e:
            logger.error(f"Error in real estate detection: {e}")
            raise
    
    def create_mobile_optimized_summary(self, title: str, text: str) -> Dict[str, str]:
        """
        Generate a mobile-optimized, marketing-friendly summary with catchy title.
        
        Args:
            title: Article title
            text: Article content
            
        Returns:
            Dict with keys: catchy_title, facts, decision, impact
        """
        prompt = f"""Tu es un journaliste juridique spécialisé en immobilier. Crée un résumé attractif et facile à lire sur mobile.

Article: {title}

Texte: {text[:5000]}

Crée un résumé structuré en JSON avec cette structure EXACTE:

{{
    "catchy_title": "[Titre accrocheur de 5-8 mots qui capte l'attention - style journalistique]",
    "facts": "[2-3 phrases courtes expliquant la situation avec des mots simples]",
    "decision": "[2-3 phrases expliquant pourquoi le tribunal a décidé ainsi]",
    "impact": "[2-3 phrases sur ce que ça change pour les propriétaires/locataires]"
}}

RÈGLES IMPORTANTES:
- Titre catchy: court, percutant, style journal (ex: "Locataire expulsé : la clause abusive invalidée")
- Utilise un français simple et accessible
- Phrases courtes (max 15-20 mots)
- Évite le jargon juridique
- Utilise "vous" pour parler au lecteur
- Reste factuel et professionnel
- Total: 150-200 mots

Génère UNIQUEMENT le JSON, rien d'autre:"""

        try:
            response = self.client.chat.completions.create(
                model=self.synthesis_model,
                messages=[
                    {
                        "role": "system",
                        "content": "Tu es un journaliste juridique créant du contenu accessible et engageant. Réponds uniquement en JSON valide."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=800,
                response_format={"type": "json_object"}
            )
            
            import json
            summary_dict = json.loads(response.choices[0].message.content.strip())
            return summary_dict
            
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            raise
    
    def group_by_dynamic_themes(self, articles: List[Dict[str, str]]) -> Dict[str, List[Dict[str, str]]]:
        """
        Use LLM to dynamically group articles by themes.
        
        Args:
            articles: List of article dicts with keys: id, title, summary
            
        Returns:
            Dict mapping theme names to lists of articles
        """
        if not articles:
            return {}
        
        # Prepare article summaries for analysis
        articles_text = "\n\n".join([
            f"[{i+1}] {article['title']}"
            for i, article in enumerate(articles)
        ])
        
        prompt = f"""Tu es un expert en classification de jurisprudence immobilière.

Voici {len(articles)} décisions de jurisprudence:

{articles_text}

Analyse ces décisions et identifie 2 à 4 THÈMES PRINCIPAUX qui les regroupent naturellement.

RÈGLES:
- Crée des thèmes COURTS et ACCROCHEURS (3-5 mots max)
- Utilise un langage marketing et accessible
- Évite les termes juridiques complexes
- Chaque thème doit couvrir au moins 1 décision
- Maximum 4 thèmes au total

Exemples de bons thèmes:
- "Location et bail"
- "Copropriété et voisinage"
- "Vente et acquisition"
- "Travaux et construction"
- "Fiscalité immobilière"

Réponds UNIQUEMENT avec un JSON structuré comme ceci:
{{
    "themes": [
        {{
            "name": "Nom du thème",
            "emoji": "📌",
            "description": "Courte description du thème (max 10 mots)",
            "article_indices": [0, 2, 5]
        }}
    ]
}}

IMPORTANT: Les indices d'articles commencent à 0. Renvoie UNIQUEMENT le JSON, rien d'autre."""

        try:
            response = self.client.chat.completions.create(
                model=self.theming_model,
                messages=[
                    {
                        "role": "system",
                        "content": "Tu es un expert en organisation de contenu juridique. Réponds uniquement en JSON valide."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.8,
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            
            import json
            result = json.loads(response.choices[0].message.content)
            
            # Convert to expected format
            grouped = {}
            for theme in result.get("themes", []):
                theme_name = f"{theme.get('emoji', '📌')} {theme['name']}"
                theme_articles = []
                
                for idx in theme.get("article_indices", []):
                    if 0 <= idx < len(articles):
                        article = articles[idx].copy()
                        article["theme_description"] = theme.get("description", "")
                        theme_articles.append(article)
                
                if theme_articles:
                    grouped[theme_name] = theme_articles
            
            # Fallback: if no themes or articles missing, group all under "Actualités"
            if not grouped:
                grouped["📰 Actualités immobilières"] = articles
            else:
                # Add ungrouped articles to a default theme
                all_grouped_ids = set()
                for theme_articles in grouped.values():
                    all_grouped_ids.update(a['id'] for a in theme_articles)
                
                ungrouped = [a for a in articles if a['id'] not in all_grouped_ids]
                if ungrouped:
                    grouped["📰 Autres décisions"] = ungrouped
            
            logger.info(f"Created {len(grouped)} dynamic themes")
            return grouped
            
        except Exception as e:
            logger.error(f"Error in dynamic theming: {e}, using fallback")
            # Fallback: single theme
            return {"📰 Actualités immobilières": articles}


# Singleton instance
jurisprudence_ai_service = JurisprudenceAIService()
