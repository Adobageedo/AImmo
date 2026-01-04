"""
Chat SDK Service - Service principal pour le SDK Chat UI
Gestion du chat, streaming, RAG et artefacts
"""

from typing import List, Dict, Any, AsyncGenerator, Optional
from uuid import uuid4
from datetime import datetime
import json
import asyncio
from openai import AsyncOpenAI

from app.schemas.chat_sdk import (
    ChatRequest,
    ChatResponse,
    StreamChunk,
    StreamEventType,
    Message,
    MessageRole,
    Citation,
    ChatMode,
    SourceType,
)
from app.services.rag.rag_sdk_service import search_rag_sources
from app.core.config import settings


# Client OpenAI
openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def process_chat_message(
    request: ChatRequest,
    organization_id: str,
    user_id: str,
    supabase,
) -> ChatResponse:
    """
    Traite un message de chat (mode non-streaming) avec logique RAG simplifiée
    """
    start_time = datetime.now()
    
    # 1. Sauvegarder le message utilisateur
    user_message = await save_message(
        conversation_id=request.conversation_id,
        role=MessageRole.USER,
        content=request.message,
        supabase=supabase,
    )
    
    # 2. Déterminer si RAG est nécessaire et quelles sources utiliser
    citations = []
    rag_context = ""
    
    # Convertir les strings en SourceType enum
    requested_sources = request.get_requested_sources()
    
    if request.mode == ChatMode.RAG_ONLY or request.mode == ChatMode.RAG_ENHANCED:
        # RAG est activé, utiliser uniquement les sources demandées
        if not requested_sources:
            # Aucune source sélectionnée, pas de recherche RAG
            rag_context = ""
            citations = []
        else:
            # Rechercher dans les sources demandées
            rag_context, citations = await search_rag_sources(
                query=request.message,
                organization_id=organization_id,
                source_types=requested_sources,  # Utiliser les sources converties
                document_ids=request.document_ids,
                lease_ids=request.lease_ids,
                property_ids=request.property_ids,
                supabase=supabase,  # ← Ajouter le client Supabase
            )

        
        # En mode RAG_ONLY, si pas de résultats, retourner un message d'erreur
        if request.mode == ChatMode.RAG_ONLY and not rag_context.strip():
            raise HTTPException(
                status_code=404,
                detail="Aucune information trouvée dans les documents pour répondre à votre question."
            )
    
    # 3. Générer la réponse avec le contexte approprié
    response_content = await generate_llm_response(
        message=request.message,
        rag_context=rag_context if rag_context.strip() else None,
        conversation_id=request.conversation_id,
        supabase=supabase,
    )
    
    # 4. Sauvegarder la réponse assistant
    assistant_message = await save_message(
        conversation_id=request.conversation_id,
        role=MessageRole.ASSISTANT,
        content=response_content,
        citations=citations,
        supabase=supabase,
    )
    
    # 5. Calculer le temps de traitement
    processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
    
    return ChatResponse(
        message=assistant_message,
        citations=citations,
        artifacts=[],
        processing_time_ms=processing_time,
    )


async def process_chat_stream(
    request: ChatRequest,
    organization_id: str,
    user_id: str,
    supabase,
) -> AsyncGenerator[StreamChunk, None]:
    """
    Traite un message de chat en mode streaming SSE avec logique RAG simplifiée
    """
    try:
        # 1. Sauvegarder le message utilisateur
        user_message = await save_message(
            conversation_id=request.conversation_id,
            role=MessageRole.USER,
            content=request.message,
            supabase=supabase,
        )
        
        # 2. Déterminer si RAG est nécessaire et quelles sources utiliser
        all_rag_results = []
        all_citations = []
        rag_context = ""
        
        requested_sources = request.get_requested_sources()
        if request.mode == ChatMode.RAG_ONLY or request.mode == ChatMode.RAG_ENHANCED:
            if requested_sources:
                # Rechercher dans les sources demandées
                all_rag_results = await search_rag_sources(
                    query=request.message,
                    organization_id=organization_id,
                    source_types=requested_sources,
                    document_ids=request.document_ids,
                    lease_ids=request.lease_ids,
                    property_ids=request.property_ids,
                    supabase=supabase,
                )
            
                # Préparer toutes les citations disponibles (ne pas les envoyer encore)
                for result in all_rag_results:
                    citation = Citation(
                        id=str(uuid4()),
                        chunk_id=result.chunk_id,
                        document_id=result.document_id,
                        document_title=result.document_title,
                        content_preview=result.content[:200],
                        source_type=result.source_type,
                        metadata=result.metadata,
                    )
                    all_citations.append(citation)
                
                # Construire le contexte avec les chunk_ids
                rag_context = "\n\n".join([
                    f"[{r.chunk_id}] Source: {r.document_title}\n{r.content}"
                    for r in all_rag_results
                ])
        
        # 3. Générer et streamer la réponse
        full_content = ""
        
        if request.mode == ChatMode.RAG_ONLY:
            # Mode RAG uniquement
            content = format_rag_only_response(all_rag_results)
            yield StreamChunk(
                event=StreamEventType.CHUNK,
                content=content,
            )
            full_content = content
            used_citations = all_citations  # Toutes les sources sont utilisées en mode RAG_ONLY
        else:
            # Streaming LLM avec parsing des citations
            async for chunk_content in stream_llm_response(
                message=request.message,
                rag_context=rag_context if request.mode == ChatMode.RAG_ENHANCED else None,
                conversation_id=request.conversation_id,
                supabase=supabase,
            ):
                full_content += chunk_content
                yield StreamChunk(
                    event=StreamEventType.CHUNK,
                    content=chunk_content,
                )
            
            # Parser le contenu pour extraire les citations utilisées
            cleaned_content, cited_chunk_ids = parse_citations_from_content(full_content)
            full_content = cleaned_content  # Utiliser le contenu nettoyé
            
            # Filtrer pour ne garder que les citations utilisées
            used_citations = filter_citations_by_usage(all_citations, cited_chunk_ids)
        
        # 4. Envoyer les citations utilisées
        for citation in used_citations:
            yield StreamChunk(
                event=StreamEventType.CITATION,
                citation=citation,
            )
        # 5. Sauvegarder la réponse complète avec les citations utilisées
        assistant_message = await save_message(
            conversation_id=request.conversation_id,
            role=MessageRole.ASSISTANT,
            content=full_content,
            citations=used_citations,
            supabase=supabase,
        )
        
        # 6. Signal de fin
        yield StreamChunk(
            event=StreamEventType.DONE,
            done=True,
        )
        
    except Exception as e:
        yield StreamChunk(
            event=StreamEventType.ERROR,
            error=str(e),
        )


async def generate_llm_response(
    message: str,
    rag_context: Optional[str],
    conversation_id: str,
    supabase,
) -> str:
    """
    Génère une réponse avec OpenAI (mode non-streaming)
    """
    history = await get_conversation_history(conversation_id, supabase)
    messages = []
    
    # System prompt avec instructions de citation
    system_prompt = """Tu es un assistant IA spécialisé dans la gestion immobilière.

IMPORTANT : Formate ta réponse en utilisant le Markdown pour une meilleure lisibilité. Utilise :
- **gras** pour mettre en valeur
- *italique* pour une emphase subtile
- Des titres (# ## ###) pour structurer
- Des listes à puces (-) ou numérotées (1. 2. 3.) pour les listes
- > pour les citations
- `code` pour le code en ligne
- ``` pour les blocs de code
- Des tableaux pour les données structurées
- Des sauts de ligne entre les paragraphes

IMPORTANT - Instructions de citation:
- Lorsque tu utilises des informations du contexte documentaire, tu DOIS citer tes sources
- Format de citation: [SOURCE:chunk_id] immédiatement après l'information utilisée
- Exemple: "Le loyer est de 1,500€ [SOURCE:chunk-documents-doc-001]"
- Ne cite QUE les sources que tu utilises réellement dans ta réponse
- Si tu n'utilises pas d'information du contexte, ne cite rien"""

    if rag_context:
        system_prompt += f"\n\nContexte documentaire:\n{rag_context}"
    
    messages.append({"role": "system", "content": system_prompt})
    
    for msg in history:
        messages.append({"role": msg.role.value, "content": msg.content})
    
    messages.append({"role": "user", "content": message})
    
    response = await openai_client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=messages,
        temperature=0.7,
        max_tokens=2000,
    )
    
    return response.choices[0].message.content


async def generate_conversation_title(first_message: str) -> str:
    """
    Génère un titre de conversation avec OpenAI basé sur le premier message
    """
    messages = [
        {
            "role": "system",
            "content": "Tu es un assistant IA spécialisé dans la gestion immobilière. Génère un titre court et concis (max 50 caractères) pour une conversation basée sur le premier message de l'utilisateur. Le titre doit être en français et refléter le sujet principal de la conversation. Ne réponds que par le titre, sans autre texte."
        },
        {
            "role": "user",
            "content": f"Génère un titre pour cette conversation: {first_message}"
        }
    ]
    
    # Appel OpenAI avec peu de tokens pour un titre court
    response = await openai_client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=messages,
        temperature=0.3,  # Plus bas pour plus de cohérence
        max_tokens=50,     # Très peu pour un titre court
    )
    
    title = response.choices[0].message.content.strip()
    
    # Nettoyer le titre (enlever les guillemets si présents)
    title = title.strip('"\'')
    
    # Limiter la longueur si nécessaire
    if len(title) > 50:
        title = title[:47] + "..."
    
    return title


async def stream_llm_response(
    message: str,
    rag_context: Optional[str],
    conversation_id: str,
    supabase,
) -> AsyncGenerator[str, None]:
    """
    Génère une réponse avec OpenAI en streaming
    """
    history = await get_conversation_history(conversation_id, supabase)
    messages = []
    
    # System prompt avec instructions de citation
    system_prompt = """Tu es un assistant IA spécialisé dans la gestion immobilière.

IMPORTANT : Formate ta réponse en utilisant le Markdown pour une meilleure lisibilité. Utilise :
- **gras** pour mettre en valeur
- *italique* pour une emphase subtile
- Des titres (# ## ###) pour structurer
- Des listes à puces (-) ou numérotées (1. 2. 3.) pour les listes
- > pour les citations
- `code` pour le code en ligne
- ``` pour les blocs de code
- Des tableaux pour les données structurées
- Des sauts de ligne entre les paragraphes

IMPORTANT - Instructions de citation:
- Lorsque tu utilises des informations du contexte documentaire, tu DOIS citer tes sources
- Format de citation: [SOURCE:chunk_id] immédiatement après l'information utilisée
- Exemple: "Le loyer est de 1,500€ [SOURCE:chunk-documents-doc-001]"
- Ne cite QUE les sources que tu utilises réellement dans ta réponse
- Si tu n'utilises pas d'information du contexte, ne cite rien"""
    if rag_context:
        system_prompt += f"\n\nContexte documentaire:\n{rag_context}"
    
    messages.append({"role": "system", "content": system_prompt})
    
    for msg in history:
        messages.append({"role": msg.role.value, "content": msg.content})
    
    messages.append({"role": "user", "content": message})
    
    stream = await openai_client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=messages,
        temperature=0.7,
        max_tokens=2000,
        stream=True,
    )
    
    async for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


def parse_citations_from_content(content: str) -> tuple[str, list[str]]:
    """
    Parse le contenu pour extraire les citations et retourner le contenu nettoyé
    
    Args:
        content: Contenu avec citations au format [SOURCE:chunk_id]
        
    Returns:
        tuple: (contenu_nettoyé, liste_des_chunk_ids_cités)
    """
    import re
    
    # Pattern pour trouver les citations [SOURCE:chunk_id]
    citation_pattern = r'\[SOURCE:([^\]]+)\]'
    
    # Extraire tous les chunk_ids
    cited_chunk_ids = re.findall(citation_pattern, content)
    
    # Nettoyer le contenu en supprimant les citations
    cleaned_content = re.sub(citation_pattern, '', content)
    
    # Nettoyer les espaces multiples mais préserver les sauts de ligne pour le markdown
    cleaned_content = re.sub(r'[ \t]+', ' ', cleaned_content).strip()  # Nettoyer seulement espaces et tabulations
    cleaned_content = re.sub(r'\n{3,}', '\n\n', cleaned_content)  # Limiter les sauts de ligne à 2 max
    
    return cleaned_content, cited_chunk_ids


def filter_citations_by_usage(
    all_citations: list,
    cited_chunk_ids: list[str]
) -> list:
    """
    Filtre les citations pour ne garder que celles réellement utilisées par l'IA
    
    Args:
        all_citations: Toutes les citations disponibles
        cited_chunk_ids: Liste des chunk_ids cités par l'IA
        
    Returns:
        Liste des citations utilisées
    """
    used_citations = []
    
    for citation in all_citations:
        if citation.chunk_id in cited_chunk_ids:
            used_citations.append(citation)
    
    return used_citations


async def save_message(
    conversation_id: str,
    role: MessageRole,
    content: str,
    citations: List[Citation] = None,
    artifacts: List[Dict[str, Any]] = None,
    supabase = None,
) -> Message:
    """
    Sauvegarde un message dans la base de données
    """
    message_id = str(uuid4())
    now = datetime.utcnow()
    
    message_data = {
        "id": message_id,
        "conversation_id": conversation_id,
        "role": role.value,
        "content": content,
        "citations": [c.model_dump() for c in (citations or [])],
        "artifacts": artifacts or [],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    try:
        response = supabase.table("messages").insert(message_data).execute()
    except Exception as e:
        print("Error saving message:", e)
    # Mettre à jour la conversation
    conv_update_data = {
        "last_message_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    conv_response = supabase.table("conversations").update(conv_update_data).eq("id", conversation_id).execute()
    
    return Message(**message_data)


async def get_conversation_history(
    conversation_id: str,
    supabase,
    limit: int = 50,
) -> List[Message]:
    """
    Récupère l'historique de conversation
    """
    response = supabase.table("messages").select("*").eq(
        "conversation_id", conversation_id
    ).order("created_at").limit(limit).execute()
    
    return [Message(**msg) for msg in response.data or []]


def format_rag_only_response(rag_results: List[Any]) -> str:
    """
    Formate une réponse RAG-only (sans génération LLM)
    """
    if not rag_results:
        return "Aucun document pertinent trouvé pour répondre à votre question."
    
    response = "Voici les informations trouvées dans vos documents:\n\n"
    
    for i, result in enumerate(rag_results, 1):
        response += f"{i}. **{result.document_title}** (Score: {result.score:.0%})\n"
        response += f"{result.content}\n\n"
    
    return response


async def delete_message(
    message_id: str,
    user_id: str,
    supabase,
) -> bool:
    """
    Supprime un message
    """
    # Vérifier l'appartenance
    msg_response = supabase.table("messages").select(
        "conversation_id, conversations(user_id)"
    ).eq("id", message_id).single().execute()
    
    if not msg_response.data:
        return False
    
    if msg_response.data["conversations"]["user_id"] != user_id:
        return False
    
    # Supprimer
    supabase.table("messages").delete().eq("id", message_id).execute()
    return True


async def retry_message(
    message_id: str,
    user_id: str,
    supabase,
) -> Optional[Message]:
    """
    Retry un message (régénère la réponse assistant)
    """
    # Récupérer le message
    msg_response = supabase.table("messages").select(
        "*, conversations(user_id, id)"
    ).eq("id", message_id).single().execute()
    
    if not msg_response.data:
        return None
    
    if msg_response.data["conversations"]["user_id"] != user_id:
        return None
    
    # Supprimer la réponse assistant suivante
    conversation_id = msg_response.data["conversation_id"]
    messages = await get_conversation_history(conversation_id, supabase)
    
    # Trouver l'index du message
    msg_index = next((i for i, m in enumerate(messages) if m.id == message_id), None)
    if msg_index is not None and msg_index + 1 < len(messages):
        # Supprimer la réponse assistant
        next_message = messages[msg_index + 1]
        if next_message.role == MessageRole.ASSISTANT:
            await delete_message(next_message.id, user_id, supabase)
    
    return None  # Le frontend devra relancer la requête
