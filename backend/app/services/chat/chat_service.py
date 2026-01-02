"""
Chat Service - Phase 5 Chat MVP
Chat avec RAG, streaming et génération LLM
"""

import json
import time
from datetime import datetime
from typing import List, Dict, Any, Optional, AsyncGenerator
from uuid import UUID, uuid4

from openai import OpenAI

from app.core.config import settings
from app.schemas.chat import (
    MessageRole,
    ChatMode,
    ChatRequest,
    ChatResponse,
    Message,
    MessageCreate,
    Citation,
    Conversation,
    ConversationCreate,
    ConversationWithMessages,
    StreamChunk,
    LeasesSummaryRequest,
    LeasesSummaryResponse,
    PropertyComparisonRequest,
    PropertyComparisonResponse,
    TableGenerationRequest,
    TableGenerationResponse,
    ExportFormat,
    ExportRequest,
    ExportResponse,
    PromptSuggestion,
    PromptCategory,
)
from app.schemas.rag import SourceType, RAGSearchRequest, RAGSearchResult
from app.services.rag.rag_service import search_chunks


# ============================================
# Client OpenAI
# ============================================

def get_openai_client() -> OpenAI:
    """Obtenir le client OpenAI"""
    return OpenAI(api_key=settings.OPENAI_API_KEY)


# ============================================
# Prompts Système
# ============================================

SYSTEM_PROMPT = """Tu es AImmo, un assistant IA spécialisé dans la gestion immobilière.

Tu aides les gestionnaires immobiliers et propriétaires à :
- Analyser et résumer des baux et contrats
- Comparer des biens immobiliers
- Générer des rapports et tableaux
- Répondre à des questions sur leurs données

Instructions :
1. Réponds toujours en français
2. Sois précis et concis
3. Cite tes sources quand tu utilises des informations des documents
4. Si tu ne connais pas la réponse, dis-le clairement
5. Formate tes réponses avec du Markdown quand approprié

{context}
"""

RAG_CONTEXT_TEMPLATE = """
Voici des informations pertinentes tirées des documents de l'utilisateur :

{chunks}

Utilise ces informations pour répondre à la question. Cite les sources en utilisant [Source: titre du document].
"""


# ============================================
# Génération de Citations
# ============================================

def create_citations_from_results(
    results: List[RAGSearchResult],
    max_citations: int = 5
) -> List[Citation]:
    """Crée des citations à partir des résultats RAG"""
    citations = []
    
    for i, result in enumerate(results[:max_citations]):
        citation = Citation(
            id=uuid4(),
            chunk_id=result.chunk_id,
            document_id=result.document_id,
            document_title=result.metadata.source_title or f"Document {i+1}",
            content_preview=result.content[:200] + "..." if len(result.content) > 200 else result.content,
            page_number=result.metadata.page_number,
            source_type=result.source_type,
            relevance_score=result.score,
            url=f"/dashboard/documents/{result.document_id}",
        )
        citations.append(citation)
    
    return citations


# ============================================
# Construction du Contexte RAG
# ============================================

def build_rag_context(results: List[RAGSearchResult]) -> str:
    """Construit le contexte RAG pour le prompt"""
    if not results:
        return ""
    
    chunks_text = []
    for i, result in enumerate(results):
        source_info = f"[Source {i+1}: {result.metadata.source_title or 'Document'}]"
        if result.metadata.page_number:
            source_info += f" (Page {result.metadata.page_number})"
        
        chunks_text.append(f"{source_info}\n{result.content}\n")
    
    context = RAG_CONTEXT_TEMPLATE.format(chunks="\n".join(chunks_text))
    return context


# ============================================
# Chat Principal
# ============================================

async def process_chat(
    request: ChatRequest,
    organization_id: UUID,
    supabase_client: Any,
) -> ChatResponse:
    """Traite une requête de chat"""
    start_time = time.time()
    
    # 1. Recherche RAG si nécessaire
    rag_results: List[RAGSearchResult] = []
    citations: List[Citation] = []
    
    if request.mode in [ChatMode.RAG_ONLY, ChatMode.RAG_ENHANCED]:
        rag_request = RAGSearchRequest(
            organization_id=organization_id,
            query=request.message,
            source_types=request.source_types,
            document_ids=request.document_ids,
            lease_ids=request.lease_ids,
            property_ids=request.property_ids,
            limit=10,
            min_score=0.5,
        )
        
        rag_response = await search_chunks(rag_request)
        rag_results = rag_response.results
        
        # Toujours créer les citations si des résultats existent
        citations = create_citations_from_results(rag_results, 5) if rag_results else []
    
    # 2. Mode RAG Only - retourner juste les résultats
    if request.mode == ChatMode.RAG_ONLY:
        content = _format_rag_only_response(rag_results)
        
        message = Message(
            id=uuid4(),
            conversation_id=request.conversation_id,
            role=MessageRole.ASSISTANT,
            content=content,
            citations=citations,
            created_at=datetime.utcnow(),
        )
        
        return ChatResponse(
            message=message,
            citations=citations,
            rag_results=rag_results,
            processing_time_ms=int((time.time() - start_time) * 1000),
        )
    
    # 3. Génération LLM avec contexte RAG
    context = build_rag_context(rag_results) if rag_results else ""
    system_prompt = SYSTEM_PROMPT.format(context=context)
    
    # Récupérer l'historique de la conversation
    history = await _get_conversation_history(request.conversation_id, supabase_client)
    
    # Construire les messages
    messages = [{"role": "system", "content": system_prompt}]
    
    for msg in history[-10:]:  # Limiter à 10 derniers messages
        messages.append({
            "role": msg["role"],
            "content": msg["content"],
        })
    
    messages.append({"role": "user", "content": request.message})
    
    # Appeler OpenAI
    client = get_openai_client()
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.7,
        max_tokens=2000,
    )
    
    assistant_content = response.choices[0].message.content
    
    # Créer le message de réponse
    message = Message(
        id=uuid4(),
        conversation_id=request.conversation_id,
        role=MessageRole.ASSISTANT,
        content=assistant_content,
        citations=citations,
        metadata={"model": "gpt-4o-mini", "tokens": response.usage.total_tokens},
        created_at=datetime.utcnow(),
    )
    
    # Sauvegarder les messages dans Supabase
    await _save_messages(
        request.conversation_id,
        request.message,
        assistant_content,
        citations,
        supabase_client,
    )
    
    return ChatResponse(
        message=message,
        citations=citations,
        rag_results=rag_results if rag_results else None,
        processing_time_ms=int((time.time() - start_time) * 1000),
    )


async def process_chat_stream(
    request: ChatRequest,
    organization_id: UUID,
    supabase_client: Any,
) -> AsyncGenerator[StreamChunk, None]:
    """Traite une requête de chat en streaming"""
    
    # 1. Recherche RAG
    rag_results: List[RAGSearchResult] = []
    citations: List[Citation] = []
    
    if request.mode in [ChatMode.RAG_ONLY, ChatMode.RAG_ENHANCED]:
        rag_request = RAGSearchRequest(
            organization_id=organization_id,
            query=request.message,
            source_types=request.source_types,
            document_ids=request.document_ids,
            limit=10,
            min_score=0.5,
        )
        
        rag_response = await search_chunks(rag_request)
        rag_results = rag_response.results
        
        # Toujours créer les citations si des résultats existent
        citations = create_citations_from_results(rag_results, 5) if rag_results else []
        
        # Envoyer les citations d'abord
        for citation in citations:
            yield StreamChunk(type="citation", citation=citation)
    
    # 2. Mode RAG Only
    if request.mode == ChatMode.RAG_ONLY:
        content = _format_rag_only_response(rag_results)
        yield StreamChunk(type="content", content=content)
        yield StreamChunk(type="done")
        return
    
    # 3. Streaming LLM
    context = build_rag_context(rag_results) if rag_results else ""
    system_prompt = SYSTEM_PROMPT.format(context=context)
    
    history = await _get_conversation_history(request.conversation_id, supabase_client)
    
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history[-10:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": request.message})
    
    client = get_openai_client()
    
    try:
        stream = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            max_tokens=2000,
            stream=True,
        )
        
        full_content = ""
        for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_content += content
                yield StreamChunk(type="content", content=content)
        
        # Sauvegarder les messages
        await _save_messages(
            request.conversation_id,
            request.message,
            full_content,
            citations,
            supabase_client,
        )
        
        yield StreamChunk(type="done")
        
    except Exception as e:
        yield StreamChunk(type="error", error=str(e))


def _format_rag_only_response(results: List[RAGSearchResult]) -> str:
    """Formate la réponse en mode RAG only"""
    if not results:
        return "Aucun résultat trouvé dans vos documents."
    
    response_parts = [f"**{len(results)} résultats trouvés :**\n"]
    
    for i, result in enumerate(results):
        title = result.metadata.source_title or "Document"
        score_pct = int(result.score * 100)
        
        response_parts.append(f"\n### {i+1}. {title} ({score_pct}% pertinent)\n")
        response_parts.append(f"{result.content[:500]}{'...' if len(result.content) > 500 else ''}\n")
        
        if result.semantic_tags:
            tags = ", ".join(result.semantic_tags[:5])
            response_parts.append(f"*Tags: {tags}*\n")
    
    return "".join(response_parts)


async def _get_conversation_history(
    conversation_id: UUID,
    supabase_client: Any,
) -> List[Dict[str, Any]]:
    """Récupère l'historique d'une conversation"""
    try:
        response = supabase_client.table("messages").select("*").eq(
            "conversation_id", str(conversation_id)
        ).order("created_at").execute()
        
        return response.data if response.data else []
    except Exception:
        return []


async def _save_messages(
    conversation_id: UUID,
    user_message: str,
    assistant_message: str,
    citations: List[Citation],
    supabase_client: Any,
):
    """Sauvegarde les messages dans Supabase"""
    try:
        # Message utilisateur
        supabase_client.table("messages").insert({
            "id": str(uuid4()),
            "conversation_id": str(conversation_id),
            "role": "user",
            "content": user_message,
            "created_at": datetime.utcnow().isoformat(),
        }).execute()
        
        # Message assistant
        citations_data = [c.model_dump(mode="json") for c in citations]
        supabase_client.table("messages").insert({
            "id": str(uuid4()),
            "conversation_id": str(conversation_id),
            "role": "assistant",
            "content": assistant_message,
            "metadata": {"citations": citations_data},
            "created_at": datetime.utcnow().isoformat(),
        }).execute()
        
        # Mettre à jour la conversation
        supabase_client.table("conversations").update({
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", str(conversation_id)).execute()
        
    except Exception as e:
        print(f"Error saving messages: {e}")


# ============================================
# Capacités Spéciales
# ============================================

async def summarize_lease(
    request: LeasesSummaryRequest,
    organization_id: UUID,
    supabase_client: Any,
) -> LeasesSummaryResponse:
    """Génère un résumé de bail"""
    
    # Rechercher les chunks du bail
    rag_request = RAGSearchRequest(
        organization_id=organization_id,
        query="bail contrat location loyer charges dates conditions",
        lease_ids=[request.lease_id],
        source_types=[SourceType.LEASES, SourceType.DOCUMENTS],
        limit=20,
        min_score=0.3,
    )
    
    rag_response = await search_chunks(rag_request)
    context = build_rag_context(rag_response.results)
    
    prompt = f"""Analyse ce bail et génère un résumé structuré.

{context}

Génère un résumé JSON avec les sections suivantes:
- summary: résumé général (2-3 phrases)
- key_dates: dates importantes (début, fin, renouvellement, préavis)
- financials: informations financières (loyer, charges, dépôt)
- important_clauses: clauses importantes à noter

Réponds UNIQUEMENT avec du JSON valide."""

    client = get_openai_client()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    
    result = json.loads(response.choices[0].message.content)
    
    return LeasesSummaryResponse(
        lease_id=request.lease_id,
        summary=result.get("summary", ""),
        key_dates=result.get("key_dates") if request.include_key_dates else None,
        financials=result.get("financials") if request.include_financials else None,
        important_clauses=result.get("important_clauses") if request.include_clauses else None,
    )


async def compare_properties(
    request: PropertyComparisonRequest,
    organization_id: UUID,
    supabase_client: Any,
) -> PropertyComparisonResponse:
    """Compare plusieurs biens immobiliers"""
    
    properties_data = []
    
    for property_id in request.property_ids:
        # Rechercher les infos du bien
        rag_request = RAGSearchRequest(
            organization_id=organization_id,
            query="surface prix loyer adresse caractéristiques état",
            property_ids=[property_id],
            limit=10,
            min_score=0.3,
        )
        
        rag_response = await search_chunks(rag_request)
        
        property_info = {
            "id": str(property_id),
            "chunks": [r.content for r in rag_response.results],
        }
        properties_data.append(property_info)
    
    # Générer la comparaison
    prompt = f"""Compare ces biens immobiliers:

{json.dumps(properties_data, indent=2, ensure_ascii=False)}

Critères de comparaison: {', '.join(request.criteria or ['surface', 'prix', 'localisation', 'état'])}

Génère un JSON avec:
- properties: liste des biens avec leurs caractéristiques extraites
- comparison_table: tableau comparatif avec une clé par critère et une liste de valeurs par bien
- analysis: analyse comparative (avantages/inconvénients de chaque bien)

Réponds UNIQUEMENT avec du JSON valide."""

    client = get_openai_client()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    
    result = json.loads(response.choices[0].message.content)
    
    return PropertyComparisonResponse(
        properties=result.get("properties", []),
        comparison_table=result.get("comparison_table", {}),
        analysis=result.get("analysis", ""),
    )


async def generate_table(
    request: TableGenerationRequest,
    organization_id: UUID,
    supabase_client: Any,
) -> TableGenerationResponse:
    """Génère un tableau à partir des données"""
    
    # Rechercher les données pertinentes
    rag_request = RAGSearchRequest(
        organization_id=organization_id,
        query=request.query,
        source_types=request.source_types,
        limit=20,
        min_score=0.4,
    )
    
    rag_response = await search_chunks(rag_request)
    context = build_rag_context(rag_response.results)
    
    columns_hint = f"Colonnes souhaitées: {', '.join(request.columns)}" if request.columns else ""
    
    prompt = f"""À partir de ces données, génère un tableau.

{context}

Requête: {request.query}
{columns_hint}

Génère un JSON avec:
- headers: liste des en-têtes de colonnes
- rows: liste de lignes (chaque ligne est une liste de valeurs)
- summary: résumé optionnel des données

Réponds UNIQUEMENT avec du JSON valide."""

    client = get_openai_client()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    
    result = json.loads(response.choices[0].message.content)
    
    return TableGenerationResponse(
        headers=result.get("headers", []),
        rows=result.get("rows", []),
        summary=result.get("summary"),
    )


# ============================================
# Suggestions de Prompts
# ============================================

def get_prompt_suggestions() -> List[PromptSuggestion]:
    """Retourne les suggestions de prompts"""
    return [
        PromptSuggestion(
            id="lease_summary",
            category=PromptCategory.LEASE_ANALYSIS,
            title="Résumer un bail",
            prompt="Résume le bail de [locataire] avec les dates clés et les conditions de paiement",
            icon="📋",
        ),
        PromptSuggestion(
            id="lease_expiry",
            category=PromptCategory.LEASE_ANALYSIS,
            title="Baux expirants",
            prompt="Quels baux expirent dans les 3 prochains mois ?",
            icon="⏰",
        ),
        PromptSuggestion(
            id="compare_properties",
            category=PromptCategory.PROPERTY_COMPARISON,
            title="Comparer des biens",
            prompt="Compare les biens [A] et [B] en termes de surface, prix et localisation",
            icon="⚖️",
        ),
        PromptSuggestion(
            id="vacancy_rate",
            category=PromptCategory.FINANCIAL_REPORT,
            title="Taux de vacance",
            prompt="Quel est le taux de vacance actuel de mon portefeuille ?",
            icon="📊",
        ),
        PromptSuggestion(
            id="rent_table",
            category=PromptCategory.FINANCIAL_REPORT,
            title="Tableau des loyers",
            prompt="Génère un tableau récapitulatif de tous les loyers par bien",
            icon="📈",
        ),
        PromptSuggestion(
            id="unpaid_rent",
            category=PromptCategory.FINANCIAL_REPORT,
            title="Impayés",
            prompt="Liste les loyers impayés de ce mois",
            icon="💰",
        ),
        PromptSuggestion(
            id="search_docs",
            category=PromptCategory.GENERAL,
            title="Rechercher dans les documents",
            prompt="Trouve les documents mentionnant [terme]",
            icon="🔍",
        ),
        PromptSuggestion(
            id="index_analysis",
            category=PromptCategory.LEASE_ANALYSIS,
            title="Révision des loyers",
            prompt="Quels baux sont éligibles à une révision de loyer ?",
            icon="📅",
        ),
    ]
