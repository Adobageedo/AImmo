from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from uuid import UUID

from app.schemas.conversation import (
    Conversation,
    ConversationCreate,
    ConversationUpdate,
    Message,
    MessageCreate,
)
from app.core.security import get_current_user_id
from app.core.supabase import get_supabase

router = APIRouter()


@router.get("/", response_model=List[Conversation])
async def get_conversations(
    organization_id: UUID = Query(..., description="Organization ID (required)"),
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    is_member = supabase.table("organization_users").select("id").eq(
        "organization_id", str(organization_id)
    ).eq("user_id", user_id).execute()
    
    if not is_member.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to this organization"
        )
    
    response = supabase.table("conversations").select("*").eq(
        "user_id", user_id
    ).eq(
        "organization_id", str(organization_id)
    ).order("updated_at", desc=True).execute()
    
    return response.data


@router.post("/", response_model=Conversation, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation: ConversationCreate,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    is_member = supabase.table("organization_users").select("id").eq(
        "organization_id", str(conversation.organization_id)
    ).eq("user_id", user_id).execute()
    
    if not is_member.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to this organization"
        )
    
    data = conversation.model_dump()
    data["user_id"] = user_id
    
    response = supabase.table("conversations").insert(data).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create conversation"
        )
    
    return response.data[0]


@router.get("/{conversation_id}", response_model=Conversation)
async def get_conversation(
    conversation_id: UUID,
    user_id: str =Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    response = supabase.table("conversations").select("*").eq("id", str(conversation_id)).eq("user_id", current_user.user.id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return response.data[0]


@router.put("/{conversation_id}", response_model=Conversation)
async def update_conversation(
    conversation_id: UUID,
    conversation: ConversationUpdate,
    user_id: str =Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    update_data = conversation.model_dump(exclude_unset=True)
    
    response = supabase.table("conversations").update(update_data).eq("id", str(conversation_id)).eq("user_id", current_user.user.id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return response.data[0]


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: UUID,
    user_id: str =Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    response = supabase.table("conversations").delete().eq("id", str(conversation_id)).eq("user_id", current_user.user.id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return None


@router.get("/{conversation_id}/messages", response_model=List[Message])
async def get_messages(
    conversation_id: UUID,
    user_id: str =Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    response = supabase.table("messages").select("*").eq("conversation_id", str(conversation_id)).order("created_at").execute()
    
    return response.data


@router.post("/{conversation_id}/messages", response_model=Message, status_code=status.HTTP_201_CREATED)
async def create_message(
    conversation_id: UUID,
    message: MessageCreate,
    user_id: str =Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    response = supabase.table("messages").insert(message.model_dump()).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create message"
        )
    
    return response.data[0]
