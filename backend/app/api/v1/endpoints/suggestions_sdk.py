"""
Suggestions SDK Endpoints - Génération de suggestions contextuelles
Support suggestions basées sur le contexte de conversation et l'organisation
"""

from fastapi import APIRouter, HTTPException, Query, Depends, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from typing import List
import random
import re
import json
from openai import AsyncOpenAI
import logging
logger = logging.getLogger("app")

from app.core.security import get_current_user_id
from app.core.supabase import get_supabase_client
from app.core.config import settings
from app.schemas.chat_sdk import (
    PromptSuggestion,
    PromptCategory,
    SuggestionsRequest,
    SuggestionsResponse,
)


def validate_uuid(uuid_string: str, field_name: str = "ID") -> str:
    """
    Valide qu'une chaîne est un UUID valide
    """
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    if not uuid_pattern.match(uuid_string):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name} format. Expected UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx), got: {uuid_string}"
        )
    return uuid_string


router = APIRouter()

# Client OpenAI pour les suggestions
openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


# Suggestions prédéfinies par catégorie
PREDEFINED_SUGGESTIONS = {
    PromptCategory.LEASE_ANALYSIS: [
        PromptSuggestion(
            id="lease_summary_1",
            category=PromptCategory.LEASE_ANALYSIS,
            title="Résumé des baux",
            prompt="Peux-tu me donner un résumé de tous mes baux actifs avec leurs dates d'échéance ?",
            icon="📄",
            description="Obtenir une vue d'ensemble des baux en cours"
        ),
        PromptSuggestion(
            id="lease_expiring_1",
            category=PromptCategory.LEASE_ANALYSIS,
            title="Baux arrivant à échéance",
            prompt="Quels sont les baux qui arrivent à échéance dans les 3 prochains mois ?",
            icon="⏰",
            description="Identifier les baux à renouveler prochainement"
        ),
        PromptSuggestion(
            id="lease_rent_1",
            category=PromptCategory.LEASE_ANALYSIS,
            title="Analyse des loyers",
            prompt="Analyse les loyers de mes biens et compare-les aux prix du marché",
            icon="💰",
            description="Comparer les loyers avec le marché"
        ),
        PromptSuggestion(
            id="lease_clauses_1",
            category=PromptCategory.LEASE_ANALYSIS,
            title="Clauses importantes",
            prompt="Quelles sont les clauses importantes dans mes baux en cours ?",
            icon="📋",
            description="Identifier les clauses clés des contrats"
        ),
    ],
    PromptCategory.PROPERTY_COMPARISON: [
        PromptSuggestion(
            id="prop_compare_1",
            category=PromptCategory.PROPERTY_COMPARISON,
            title="Comparer mes propriétés",
            prompt="Compare la rentabilité de toutes mes propriétés",
            icon="🏠",
            description="Analyse comparative de rentabilité"
        ),
        PromptSuggestion(
            id="prop_performance_1",
            category=PromptCategory.PROPERTY_COMPARISON,
            title="Performance par ville",
            prompt="Quelle ville génère le meilleur rendement locatif ?",
            icon="📊",
            description="Analyse géographique de performance"
        ),
        PromptSuggestion(
            id="prop_vacancy_1",
            category=PromptCategory.PROPERTY_COMPARISON,
            title="Taux de vacance",
            prompt="Quel est le taux de vacance moyen de mes propriétés ?",
            icon="🔍",
            description="Calculer le taux d'occupation"
        ),
    ],
    PromptCategory.FINANCIAL_REPORT: [
        PromptSuggestion(
            id="finance_monthly_1",
            category=PromptCategory.FINANCIAL_REPORT,
            title="Rapport mensuel",
            prompt="Génère un rapport financier pour le mois en cours",
            icon="📈",
            description="Rapport des revenus et dépenses du mois"
        ),
        PromptSuggestion(
            id="finance_cashflow_1",
            category=PromptCategory.FINANCIAL_REPORT,
            title="Cash-flow",
            prompt="Quel est mon cash-flow total actuel ?",
            icon="💵",
            description="Calculer le cash-flow net"
        ),
        PromptSuggestion(
            id="finance_charges_1",
            category=PromptCategory.FINANCIAL_REPORT,
            title="Charges et dépenses",
            prompt="Quelles sont mes principales dépenses ce trimestre ?",
            icon="💸",
            description="Analyser les charges"
        ),
        PromptSuggestion(
            id="finance_roi_1",
            category=PromptCategory.FINANCIAL_REPORT,
            title="ROI par propriété",
            prompt="Calcule le ROI de chaque propriété sur les 12 derniers mois",
            icon="📊",
            description="Retour sur investissement détaillé"
        ),
    ],
    PromptCategory.TENANT_MANAGEMENT: [
        PromptSuggestion(
            id="tenant_list_1",
            category=PromptCategory.TENANT_MANAGEMENT,
            title="Liste des locataires",
            prompt="Donne-moi la liste de tous mes locataires actifs",
            icon="👥",
            description="Vue d'ensemble des locataires"
        ),
        PromptSuggestion(
            id="tenant_payments_1",
            category=PromptCategory.TENANT_MANAGEMENT,
            title="Retards de paiement",
            prompt="Y a-t-il des retards de paiement en cours ?",
            icon="⚠️",
            description="Identifier les impayés"
        ),
        PromptSuggestion(
            id="tenant_profile_1",
            category=PromptCategory.TENANT_MANAGEMENT,
            title="Profil locataire",
            prompt="Donne-moi le profil complet de mes locataires",
            icon="📝",
            description="Informations détaillées sur les locataires"
        ),
    ],
    PromptCategory.GENERAL: [
        PromptSuggestion(
            id="general_overview_1",
            category=PromptCategory.GENERAL,
            title="Vue d'ensemble",
            prompt="Donne-moi une vue d'ensemble complète de mon portefeuille immobilier",
            icon="🌟",
            description="Synthèse globale du portefeuille"
        ),
        PromptSuggestion(
            id="general_stats_1",
            category=PromptCategory.GENERAL,
            title="Statistiques clés",
            prompt="Quelles sont mes statistiques clés ce mois-ci ?",
            icon="📊",
            description="KPIs principaux"
        ),
        PromptSuggestion(
            id="general_alerts_1",
            category=PromptCategory.GENERAL,
            title="Alertes importantes",
            prompt="Y a-t-il des alertes ou actions urgentes à traiter ?",
            icon="🔔",
            description="Points d'attention prioritaires"
        ),
    ],
}


# ============================================
# SUGGESTIONS
# ============================================

@router.get("/", response_model=List[PromptSuggestion])
async def get_general_suggestions(
    count: int = 5,
):
    """
    Récupère des suggestions générales (endpoint public)
    
    - Suggestions prédéfinies variées
    - Mélange de toutes les catégories
    - Pas d'authentification requise
    """
    # Collecter toutes les suggestions
    all_suggestions = []
    for category_suggestions in PREDEFINED_SUGGESTIONS.values():
        all_suggestions.extend(category_suggestions)
    
    # Mélanger et prendre les N premières
    random.shuffle(all_suggestions)
    
    return all_suggestions[:count]


@router.post("/contextual", response_model=SuggestionsResponse)
async def get_contextual_suggestions(
    request: SuggestionsRequest,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Génère des suggestions de prompts futurs basées sur le dernier message utilisateur
    
    - Reçoit directement le prompt utilisateur depuis le frontend (user_prompt)
    - Génère 3-5 suggestions de ce que l'utilisateur pourrait demander ensuite
    - Utilise le service LLM pour générer des suggestions pertinentes
    - Retourne vide en cas d'erreur
    """
    from app.services.llm_service import LLMService
    logger.info(f"DEBUG: Received contextual suggestions request - user_prompt: {request}")
    # Valider que organization_id est un UUID valide
    validate_uuid(request.organization_id, "organization_id")
    
    # Vérifier l'appartenance à l'organisation
    member_check = supabase.table("organization_users").select("id").eq(
        "organization_id", request.organization_id
    ).eq("user_id", user_id).execute()
    
    if not member_check.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization"
        )
    
    # Récupérer le prompt utilisateur depuis différentes sources
    user_prompt = None
    
    # Priorité 1: Directement depuis le champ user_prompt
    if hasattr(request, 'user_prompt') and request.user_prompt:
        user_prompt = request.user_prompt
    
    # Priorité 2: Depuis conversation_context (format combiné envoyé par le frontend)
    if not user_prompt and request.conversation_context:
        # Le frontend envoie un format combiné: "Message de l'utilisateur: X et Message de l'assistant: Y"
        for msg in reversed(request.conversation_context):
            if isinstance(msg, dict) and msg.get("role") == "user":
                user_prompt = msg.get("content", "")
                break
    
    # Priorité 3: Depuis last_assistant_message (pour trouver le message utilisateur précédent)
    if not user_prompt and request.last_assistant_message:
        if request.conversation_id:
            messages = supabase.table("messages").select("content, role, created_at").eq(
                "conversation_id", request.conversation_id
            ).order("created_at", desc=True).limit(10).execute()
            
            if messages.data:
                # Trouver le dernier message utilisateur avant la réponse de l'assistant
                found_assistant = False
                for msg in messages.data:
                    if msg["role"] == "assistant":
                        found_assistant = True
                    elif found_assistant and msg["role"] == "user":
                        user_prompt = msg["content"]
                        break
    
    # Priorité 4: Chercher directement le dernier message utilisateur
    if not user_prompt and request.conversation_id:
        messages = supabase.table("messages").select("content, role, created_at").eq(
            "conversation_id", request.conversation_id
        ).order("created_at", desc=True).limit(5).execute()
        
        if messages.data:
            user_messages = [msg["content"] for msg in messages.data if msg["role"] == "user"]
            if user_messages:
                user_prompt = user_messages[0]
    
    # Si pas de prompt, retourner vide
    if not user_prompt or not user_prompt.strip():
        return SuggestionsResponse(
            suggestions=[],
            context_based=False,
        )
    
    # Générer des suggestions avec le service LLM
    try:
        llm_service = LLMService()
        
        suggestions = await generate_ai_suggestions_with_llm(llm_service, user_prompt, request.count)
        
        return SuggestionsResponse(
            suggestions=suggestions[:request.count],
            context_based=True,
        )
    except Exception as e:
        logger.error(f"Failed to generate suggestions: {str(e)}")
        logger.error(f"DEBUG: Exception type: {type(e).__name__}")
        logger.error(f"DEBUG: Exception args: {e.args}")
        import traceback
        logger.error(f"DEBUG: Traceback: {traceback.format_exc()}")
        return SuggestionsResponse(
            suggestions=[],
            context_based=False,
        )


async def generate_ai_suggestions_with_llm(llm_service, user_prompt: str, count: int) -> List[PromptSuggestion]:
    """
    Génère des suggestions en utilisant le service LLM
    Retourne une liste vide en cas d'erreur
    """
    try:
        logger.info(f"DEBUG: Starting AI suggestions generation for: '{user_prompt}'")
        
        system_prompt = "Tu es un expert en gestion immobilière qui génère des suggestions de conversation pertinentes. Réponds uniquement avec du JSON valide."
        
        prompt = f"""
Analyse ce message utilisateur et génère {count} suggestions de questions que l'utilisateur pourrait vouloir poser ensuite.

Message utilisateur : "{user_prompt}"

Génère exactement {count} suggestions au format JSON :
{{
    "suggestions": [
        {{
            "title": "Titre court",
            "prompt": "Question complète"
        }}
    ]
}}

Les suggestions doivent être contextuellement pertinentes et aider à approfondir le sujet.
"""
        
        result = await llm_service.get_json_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.8,
            max_tokens=800,
        )
        
        content = json.dumps(result)
        
        suggestions_data = result
        suggestions = []
        
        suggestions_list = suggestions_data.get("suggestions", [])
        
        for i, sugg in enumerate(suggestions_list):
            suggestions.append(PromptSuggestion(
                id=f"ai_suggestion_{i}_{hash(user_prompt) % 10000}",
                category=PromptCategory.GENERAL,  # Catégorie par défaut
                title=sugg["title"],
                prompt=sugg["prompt"],
                icon="🌟",  # Icône par défaut
                description=""
            ))
        
        return suggestions[:count]
        
    except Exception as e:
        logger.error(f"Failed to generate suggestions: {str(e)}")
        logger.error(f"DEBUG: Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"DEBUG: Traceback: {traceback.format_exc()}")
        return []


async def get_conversation_based_suggestions(
    conversation_id: str,
    organization_id: str,
    count: int,
    supabase,
) -> List[PromptSuggestion]:
    """
    Génère des suggestions basées sur l'historique de conversation en utilisant l'IA
    """
    # Récupérer les derniers messages
    messages = supabase.table("messages").select("content, role, created_at").eq(
        "conversation_id", conversation_id
    ).order("created_at", desc=True).limit(10).execute()
    
    if not messages.data or len(messages.data) < 2:
        return []
    
    try:
        # Préparer le contexte pour l'IA
        conversation_context = []
        for msg in reversed(messages.data[-5:]):  # Prendre les 5 derniers messages dans l'ordre
            conversation_context.append(f"{msg['role']}: {msg['content']}")
        
        conversation_text = "\n".join(conversation_context)
        
        # Prompt pour l'IA
        prompt = f"""
En tant qu'assistant expert en gestion immobilière, analyse la conversation suivante et génère {count} suggestions de questions pertinentes que l'utilisateur pourrait vouloir poser ensuite.

Conversation récente :
{conversation_text}

Génère exactement {count} suggestions sous forme de JSON avec ce format :
{{
    "suggestions": [
        {{
            "title": "Titre court et clair",
            "prompt": "Question complète et naturelle",
            "category": "LEASE_ANALYSIS" | "PROPERTY_COMPARISON" | "FINANCIAL_REPORT" | "TENANT_MANAGEMENT" | "GENERAL",
            "icon": "📄" | "🏠" | "📈" | "👥" | "🌟"
        }}
    ]
}}

Les suggestions doivent :
1. Être contextuellement pertinentes par rapport à la conversation
2. Être formulées comme des questions naturelles
3. Aider l'utilisateur à approfondir le sujet
4. Varier dans les thèmes abordés
"""

        # Appel à l'API OpenAI
        response = await openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "Tu es un expert en gestion immobilière qui génère des suggestions de conversation pertinentes et contextuelles. Réponds uniquement avec du JSON valide."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            temperature=0.8,
            max_tokens=800,
        )
        
        # Parser la réponse
        content = response.choices[0].message.content.strip()
        
        # Nettoyer le JSON si nécessaire
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "").strip()
        
        suggestions_data = json.loads(content)
        suggestions = []
        
        for i, sugg in enumerate(suggestions_data.get("suggestions", [])):
            suggestions.append(PromptSuggestion(
                id=f"ai_suggestion_{conversation_id}_{i}",
                category=PromptCategory(sugg["category"]),
                title=sugg["title"],
                prompt=sugg["prompt"],
                icon=sugg["icon"],
                description=""
            ))
        
        return suggestions[:count]
        
    except Exception as e:
        # En cas d'erreur, revenir aux suggestions prédéfinies basées sur les mots-clés
        return get_fallback_suggestions(messages.data, count)


def get_fallback_suggestions(messages_data: List[dict], count: int) -> List[PromptSuggestion]:
    """
    Fonction de secours pour générer des suggestions basées sur des mots-clés
    """
    suggestions = []
    content_text = " ".join([msg["content"].lower() for msg in messages_data])
    
    # Bail/Lease
    if any(word in content_text for word in ["bail", "lease", "contrat", "loyer"]):
        suggestions.extend(PREDEFINED_SUGGESTIONS[PromptCategory.LEASE_ANALYSIS][:2])
    
    # Propriétés
    if any(word in content_text for word in ["propriété", "property", "bien", "immeuble"]):
        suggestions.extend(PREDEFINED_SUGGESTIONS[PromptCategory.PROPERTY_COMPARISON][:2])
    
    # Finances
    if any(word in content_text for word in ["finance", "revenu", "dépense", "roi", "cash"]):
        suggestions.extend(PREDEFINED_SUGGESTIONS[PromptCategory.FINANCIAL_REPORT][:2])
    
    # Locataires
    if any(word in content_text for word in ["locataire", "tenant", "paiement"]):
        suggestions.extend(PREDEFINED_SUGGESTIONS[PromptCategory.TENANT_MANAGEMENT][:2])
    
    return suggestions[:count]


async def get_organization_based_suggestions(
    organization_id: str,
    count: int,
    supabase,
) -> List[PromptSuggestion]:
    """
    Génère des suggestions basées sur les données de l'organisation
    """
    suggestions = []
    
    # Vérifier quelles données existent
    has_leases = await check_has_data(supabase, "leases", organization_id)
    has_properties = await check_has_data(supabase, "properties", organization_id)
    has_tenants = await check_has_data(supabase, "tenants", organization_id)
    
    # Suggérer en fonction des données disponibles
    if has_leases:
        suggestions.extend(PREDEFINED_SUGGESTIONS[PromptCategory.LEASE_ANALYSIS][:2])
    
    if has_properties:
        suggestions.extend(PREDEFINED_SUGGESTIONS[PromptCategory.PROPERTY_COMPARISON][:1])
    
    if has_tenants:
        suggestions.extend(PREDEFINED_SUGGESTIONS[PromptCategory.TENANT_MANAGEMENT][:1])
    
    # Toujours ajouter une suggestion financière
    suggestions.extend(PREDEFINED_SUGGESTIONS[PromptCategory.FINANCIAL_REPORT][:1])
    
    return suggestions[:count]


async def check_has_data(supabase, table_name: str, organization_id: str) -> bool:
    """
    Vérifie si une table contient des données pour l'organisation
    """
    try:
        result = supabase.table(table_name).select("id", count="exact").eq(
            "organization_id", organization_id
        ).limit(1).execute()
        
        return (result.count or 0) > 0
    except:
        return False
