"""
Chat SDK Endpoints - Routes complètes pour le SDK Chat UI
Gestion du chat, streaming SSE, messages et conversations
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import StreamingResponse
from typing import List, Optional
import json
import re

from app.core.security import get_current_user_id
from app.core.supabase import get_supabase_client
from app.schemas.chat_sdk import (
    # Conversations
    Conversation,
    ConversationCreate,
    ConversationUpdate,
    ConversationWithMessages,
    ConversationList,
    # Messages
    Message,
    MessageCreate,
    MessageDelete,
    MessageRetry,
    # Chat
    ChatRequest,
    ChatResponse,
    StreamChunk,
)
from app.services.chat.chat_sdk_service import (
    process_chat_message,
    process_chat_stream,
    save_message,
    get_conversation_history,
    delete_message,
    retry_message,
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


# ============================================
# CONVERSATIONS - CRUD & PAGINATION
# ============================================

@router.post("/conversations", response_model=Conversation, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    request: ConversationCreate,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Crée une nouvelle conversation
    
    - Vérifie l'appartenance à l'organisation
    - Génère un titre basé sur le prompt si non fourni
    - Crée la conversation dans Supabase
    - Optionnellement envoie un premier message
    """
        
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
    
    # Générer un titre si non fourni
    title = request.title
    if request.initial_message:
        # Générer un titre avec OpenAI
        try:
            from app.services.chat.chat_sdk_service import generate_conversation_title
            title = await generate_conversation_title(request.initial_message)
        except Exception as e:
            # Fallback: titre simple basé sur le message
            title = request.initial_message[:50] + "..." if len(request.initial_message) > 50 else request.initial_message
    
    # Si toujours pas de titre, générer un titre par défaut
    if not title:
        title = "Nouvelle conversation"
    
    # Créer la conversation
    from datetime import datetime
    from uuid import uuid4
    
    conversation_data = {
        "id": str(uuid4()),
        "title": title,
        "organization_id": request.organization_id,
        "user_id": user_id,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    
    response = supabase.table("conversations").insert(conversation_data).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create conversation"
        )
    
    conversation = Conversation(**response.data[0], messages_count=0)
    
    return conversation


@router.get("/conversations", response_model=ConversationList)
async def list_conversations(
    organization_id: str = Query(..., description="Organization ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Liste les conversations avec pagination
    
    - Filtre par organisation et utilisateur
    - Pagination configurable
    - Inclut le nombre de messages par conversation
    """
    
    # Valider que organization_id est un UUID valide
    validate_uuid(organization_id, "organization_id")
    
        
    # Calculer offset
    offset = (page - 1) * page_size
    
    # Récupérer les conversations
    response = supabase.table("conversations").select("*", count="exact").eq(
        "organization_id", organization_id
    ).eq("user_id", user_id).order(
        "updated_at", desc=True
    ).range(offset, offset + page_size - 1).execute()
    
    conversations = []
    for conv in response.data or []:
        # Compter les messages
        msg_count = supabase.table("messages").select("id", count="exact").eq(
            "conversation_id", conv["id"]
        ).execute()
        
        conversations.append(Conversation(
            **conv,
            messages_count=msg_count.count if msg_count.count else 0,
        ))
    
    total = response.count or 0
    has_more = (offset + page_size) < total
    
    return ConversationList(
        conversations=conversations,
        total=total,
        page=page,
        page_size=page_size,
        has_more=has_more,
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
    conversation_id: str,
    include_messages: bool = Query(True, description="Include messages in response"),
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Récupère une conversation avec ses messages
    
    - Vérifie les permissions utilisateur
    - Retourne la conversation et l'historique complet
    """
        
    # Récupérer la conversation
    conv_response = supabase.table("conversations").select("*").eq(
        "id", conversation_id
    ).single().execute()
    
    if not conv_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Vérifier l'appartenance
    if conv_response.data["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your conversation"
        )
    
    # Récupérer les messages si demandé
    messages = []
    if include_messages:
        messages = await get_conversation_history(conversation_id, supabase)
    
    return ConversationWithMessages(
        **conv_response.data,
        messages_count=len(messages),
        messages=messages,
    )


@router.patch("/conversations/{conversation_id}", response_model=Conversation)
async def update_conversation(
    conversation_id: str,
    request: ConversationUpdate,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Met à jour une conversation (rename)
    
    - Vérifie les permissions
    - Met à jour le titre
    """
        
    # Vérifier l'appartenance
    conv_response = supabase.table("conversations").select("user_id").eq(
        "id", conversation_id
    ).single().execute()
    
    if not conv_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    if conv_response.data["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your conversation"
        )
    
    # Mettre à jour
    from datetime import datetime
    
    update_data = {"updated_at": datetime.utcnow().isoformat()}
    if request.title:
        update_data["title"] = request.title
    
    response = supabase.table("conversations").update(update_data).eq(
        "id", conversation_id
    ).execute()
    
    # Compter les messages
    msg_count = supabase.table("messages").select("id", count="exact").eq(
        "conversation_id", conversation_id
    ).execute()
    
    return Conversation(**response.data[0], messages_count=msg_count.count or 0)


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Supprime une conversation et ses messages
    
    - Vérifie les permissions
    - Supprime en cascade messages, artefacts, etc.
    """
        
    # Vérifier l'appartenance
    conv_response = supabase.table("conversations").select("user_id").eq(
        "id", conversation_id
    ).single().execute()
    
    if not conv_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    if conv_response.data["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your conversation"
        )
    
    # Supprimer les artefacts
    supabase.table("artifacts").delete().eq("conversation_id", conversation_id).execute()
    
    # Supprimer les messages
    supabase.table("messages").delete().eq("conversation_id", conversation_id).execute()
    
    # Supprimer la conversation
    supabase.table("conversations").delete().eq("id", conversation_id).execute()
    
    return None


# ============================================
# MESSAGES - GESTION & HISTORIQUE
# ============================================

@router.get("/conversations/{conversation_id}/messages", response_model=List[Message])
async def get_messages(
    conversation_id: str,
    limit: int = Query(100, ge=1, le=500, description="Max messages to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Récupère les messages d'une conversation
    
    - Pagination supportée
    - Ordre chronologique
    """
        
    # Vérifier l'appartenance
    conv_response = supabase.table("conversations").select("user_id").eq(
        "id", conversation_id
    ).single().execute()
    
    if not conv_response.data or conv_response.data["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your conversation"
        )
    
    # Récupérer les messages
    response = supabase.table("messages").select("*").eq(
        "conversation_id", conversation_id
    ).order("created_at").range(offset, offset + limit - 1).execute()
    
    return [Message(**msg) for msg in response.data or []]


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message_endpoint(
    message_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Supprime un message
    
    - Vérifie les permissions
    - Supprime le message et ses artefacts associés
    """
        
    success = await delete_message(message_id, user_id, supabase)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found or not authorized"
        )
    
    return None


@router.post("/messages/{message_id}/retry")
async def retry_message_endpoint(
    message_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Retry un message (supprime la réponse assistant et permet de régénérer)
    
    - Vérifie les permissions
    - Supprime la réponse assistant suivante
    - Le frontend doit relancer la requête chat
    """
        
    await retry_message(message_id, user_id, supabase)
    
    return {"message": "Ready to retry. Please resend the chat request."}


# ============================================
# CHAT - STREAMING & NON-STREAMING
# ============================================

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Envoie un message et reçoit une réponse (mode non-streaming)
    
    - Modes: NORMAL, RAG_ONLY, RAG_ENHANCED
    - Support multi-sources RAG
    - Retourne message + citations + artefacts
    """
        
    # Vérifier l'appartenance à la conversation
    conv_response = supabase.table("conversations").select("organization_id, user_id").eq(
        "id", request.conversation_id
    ).single().execute()
    
    if not conv_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    if conv_response.data["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your conversation"
        )
    
    organization_id = conv_response.data["organization_id"]
    
    # Traiter le message
    result = await process_chat_message(request, organization_id, user_id, supabase)
    
    return result


@router.post("/chat/stream")
async def chat_stream(
    request: Request,  # Recevoir la requête brute
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Envoie un message et reçoit une réponse en streaming SSE
    
    - Stream token-by-token
    - Envoie citations en temps réel
    - Envoie artefacts pendant le stream
    - Format: Server-Sent Events (SSE)
    
    Events:
    - chunk: Contenu token-by-token
    - citation: Citation/source trouvée
    - artifact: Artefact généré (table, chart, etc.)
    - done: Fin du stream
    - error: Erreur survenue
    """
    
    # Debug: Intercepter la requête JSON brute
    try:
        body = await request.json()
    except Exception as e:
        print(f"DEBUG: Failed to parse JSON body: {e}")
    
    # Recréer l'objet ChatRequest manuellement
    from app.schemas.chat_sdk import ChatRequest
    import json
    
    # Relire le body car il a été consommé
    body = await request.body()
    body_str = body.decode('utf-8')
    body_dict = json.loads(body_str)
    
    chat_request = ChatRequest(**body_dict)
    
    # Vérifier l'appartenance à la conversation
    conv_response = supabase.table("conversations").select("organization_id, user_id").eq(
        "id", chat_request.conversation_id
    ).single().execute()
    
    if not conv_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    if conv_response.data["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your conversation"
        )
    
    organization_id = conv_response.data["organization_id"]
    
    # Générateur de stream
    async def generate():
        total=""
        try:
            async for chunk in process_chat_stream(chat_request, organization_id, user_id, supabase):
                # Format SSE
                yield f"data: {json.dumps(chunk.model_dump())}\n\n"
        except Exception as e:
            # Envoyer l'erreur
            error_chunk = StreamChunk(
                event="error",
                error=str(e),
            )
            yield f"data: {json.dumps(error_chunk.model_dump())}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Désactiver le buffering nginx
        },
    )