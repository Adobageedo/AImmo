"""
Chat Endpoints - Phase 5 Chat MVP
Chat avec RAG et streaming
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import List
from uuid import UUID, uuid4
from datetime import datetime
import json

from app.core.supabase import get_supabase_client
from app.core.security import get_current_user
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    Conversation,
    ConversationCreate,
    ConversationUpdate,
    ConversationWithMessages,
    Message,
    LeasesSummaryRequest,
    LeasesSummaryResponse,
    PropertyComparisonRequest,
    PropertyComparisonResponse,
    TableGenerationRequest,
    TableGenerationResponse,
    ExportRequest,
    ExportResponse,
    PromptSuggestion,
)
from app.services.chat.chat_service import (
    process_chat,
    process_chat_stream,
    summarize_lease,
    compare_properties,
    generate_table,
    get_prompt_suggestions,
)


router = APIRouter()

# Router public pour les endpoints sans auth
public_router = APIRouter()


# ============================================
# Suggestions (Public)
# ============================================

@public_router.get("/suggestions", response_model=List[PromptSuggestion])
async def get_suggestions_public():
    """
    Récupère les suggestions de prompts (endpoint public, pas d'auth requise).
    """
    return get_prompt_suggestions()


# ============================================
# Conversations
# ============================================

@router.post("/", response_model=Conversation)
async def create_conversation(
    request: ConversationCreate,
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase_client),
):
    """
    Crée une nouvelle conversation.
    """
    # Extraire l'ID utilisateur
    user_id = current_user.user.id if hasattr(current_user, 'user') else current_user.get("id")
    
    # Vérifier l'appartenance à l'organisation
    member_check = supabase.table("organization_users").select("id").eq(
        "organization_id", str(request.organization_id)
    ).eq("user_id", user_id).execute()
    
    if not member_check.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization"
        )
    
    conversation_data = {
        "id": str(uuid4()),
        "title": request.title,
        "organization_id": str(request.organization_id),
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
    
    return Conversation(**response.data[0], messages_count=0)


@router.get("/", response_model=List[Conversation])
async def list_conversations(
    organization_id: UUID,
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase_client),
):
    """
    Liste les conversations d'une organisation.
    """
    user_id = current_user.user.id if hasattr(current_user, 'user') else current_user.get("id")
    
    response = supabase.table("conversations").select("*").eq(
        "organization_id", str(organization_id)
    ).eq("user_id", user_id).order(
        "updated_at", desc=True
    ).range(offset, offset + limit - 1).execute()
    
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
    
    return conversations


@router.get("/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
    conversation_id: UUID,
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase_client),
):
    """
    Récupère une conversation avec ses messages.
    """
    conv_response = supabase.table("conversations").select("*").eq(
        "id", str(conversation_id)
    ).single().execute()
    
    if not conv_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    user_id = current_user.user.id if hasattr(current_user, 'user') else current_user.get("id")
    
    if conv_response.data["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your conversation"
        )
    
    # Récupérer les messages
    msg_response = supabase.table("messages").select("*").eq(
        "conversation_id", str(conversation_id)
    ).order("created_at").execute()
    
    messages = [Message(**m) for m in msg_response.data or []]
    
    return ConversationWithMessages(
        **conv_response.data,
        messages_count=len(messages),
        messages=messages,
    )


@router.patch("/{conversation_id}", response_model=Conversation)
async def update_conversation(
    conversation_id: UUID,
    request: ConversationUpdate,
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase_client),
):
    """
    Met à jour une conversation (rename).
    """
    # Vérifier l'appartenance
    conv_response = supabase.table("conversations").select("user_id").eq(
        "id", str(conversation_id)
    ).single().execute()
    
    if not conv_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    user_id = current_user.user.id if hasattr(current_user, 'user') else current_user.get("id")
    
    if conv_response.data["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your conversation"
        )
    
    update_data = {"updated_at": datetime.utcnow().isoformat()}
    if request.title:
        update_data["title"] = request.title
    
    response = supabase.table("conversations").update(update_data).eq(
        "id", str(conversation_id)
    ).execute()
    
    return Conversation(**response.data[0], messages_count=0)


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID,
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase_client),
):
    """
    Supprime une conversation et ses messages.
    """
    # Vérifier l'appartenance
    conv_response = supabase.table("conversations").select("user_id").eq(
        "id", str(conversation_id)
    ).single().execute()
    
    if not conv_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    user_id = current_user.user.id if hasattr(current_user, 'user') else current_user.get("id")
    
    if conv_response.data["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your conversation"
        )
    
    # Supprimer les messages d'abord
    supabase.table("messages").delete().eq(
        "conversation_id", str(conversation_id)
    ).execute()
    
    # Supprimer la conversation
    supabase.table("conversations").delete().eq(
        "id", str(conversation_id)
    ).execute()
    
    return {"message": "Conversation deleted"}


# ============================================
# Chat
# ============================================

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase_client),
):
    """
    Envoie un message et reçoit une réponse.
    
    Modes disponibles:
    - normal: Chat LLM simple
    - rag_only: Recherche RAG uniquement
    - rag_enhanced: LLM + contexte RAG
    """
    # Vérifier l'appartenance à la conversation
    conv_response = supabase.table("conversations").select("organization_id, user_id").eq(
        "id", str(request.conversation_id)
    ).single().execute()
    
    if not conv_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    user_id = current_user.user.id if hasattr(current_user, 'user') else current_user.get("id")
    
    if conv_response.data["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your conversation"
        )
    
    organization_id = UUID(conv_response.data["organization_id"])
    
    result = await process_chat(request, organization_id, supabase)
    return result


@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase_client),
):
    """
    Envoie un message et reçoit une réponse en streaming.
    """
    # Vérifier l'appartenance à la conversation
    conv_response = supabase.table("conversations").select("organization_id, user_id").eq(
        "id", str(request.conversation_id)
    ).single().execute()
    
    if not conv_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    user_id = current_user.user.id if hasattr(current_user, 'user') else current_user.get("id")
    
    if conv_response.data["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not your conversation"
        )
    
    organization_id = UUID(conv_response.data["organization_id"])
    
    async def generate():
        async for chunk in process_chat_stream(request, organization_id, supabase):
            yield f"data: {json.dumps(chunk.model_dump())}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


# ============================================
# Capacités Spéciales
# ============================================

@router.post("/summarize-lease", response_model=LeasesSummaryResponse)
async def api_summarize_lease(
    request: LeasesSummaryRequest,
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase_client),
):
    """
    Génère un résumé structuré d'un bail.
    """
    # Récupérer l'organization_id du bail
    lease_response = supabase.table("leases").select("organization_id").eq(
        "id", str(request.lease_id)
    ).single().execute()
    
    if not lease_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lease not found"
        )
    
    organization_id = UUID(lease_response.data["organization_id"])
    
    result = await summarize_lease(request, organization_id, supabase)
    return result


@router.post("/compare-properties", response_model=PropertyComparisonResponse)
async def api_compare_properties(
    request: PropertyComparisonRequest,
    organization_id: UUID,
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase_client),
):
    """
    Compare plusieurs biens immobiliers.
    """
    # Vérifier l'appartenance à l'organisation
    user_id = current_user.user.id if hasattr(current_user, 'user') else current_user.get("id")
    
    member_check = supabase.table("organization_users").select("id").eq(
        "organization_id", str(organization_id)
    ).eq("user_id", user_id).execute()
    
    if not member_check.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization"
        )
    
    result = await compare_properties(request, organization_id, supabase)
    return result


@router.post("/generate-table", response_model=TableGenerationResponse)
async def api_generate_table(
    request: TableGenerationRequest,
    organization_id: UUID,
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase_client),
):
    """
    Génère un tableau à partir des données.
    """
    # Vérifier l'appartenance à l'organisation
    user_id = current_user.user.id if hasattr(current_user, 'user') else current_user.get("id")
    
    member_check = supabase.table("organization_users").select("id").eq(
        "organization_id", str(organization_id)
    ).eq("user_id", user_id).execute()
    
    if not member_check.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization"
        )
    
    result = await generate_table(request, organization_id, supabase)
    return result


