from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from uuid import UUID


class ConversationBase(BaseModel):
    title: str
    organization_id: UUID


class ConversationCreate(ConversationBase):
    pass


class ConversationUpdate(BaseModel):
    title: Optional[str] = None


class Conversation(ConversationBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MessageBase(BaseModel):
    conversation_id: UUID
    role: str
    content: str
    metadata: Optional[dict] = None


class MessageCreate(MessageBase):
    pass


class Message(MessageBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
