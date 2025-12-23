"""
Chat Schemas - Phase 5 Chat MVP
Interface Chat avec RAG et streaming
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from enum import Enum

from .rag import SourceType, RAGSearchResult


class MessageRole(str, Enum):
    """Rôle du message"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatMode(str, Enum):
    """Mode de chat"""
    NORMAL = "normal"  # Chat normal avec LLM
    RAG_ONLY = "rag_only"  # Recherche RAG uniquement, pas de génération
    RAG_ENHANCED = "rag_enhanced"  # LLM + RAG context


class ExportFormat(str, Enum):
    """Format d'export"""
    EXCEL = "excel"
    PDF = "pdf"
    MARKDOWN = "markdown"
    JSON = "json"


# ============================================
# Citation (Source Reference)
# ============================================

class Citation(BaseModel):
    """Citation/référence à un chunk source"""
    id: UUID
    chunk_id: UUID
    document_id: UUID
    document_title: str
    content_preview: str
    page_number: Optional[int] = None
    source_type: SourceType
    relevance_score: float
    url: Optional[str] = None  # URL cliquable vers le document


# ============================================
# Message Models
# ============================================

class MessageBase(BaseModel):
    """Base d'un message"""
    role: MessageRole
    content: str


class MessageCreate(MessageBase):
    """Création d'un message"""
    conversation_id: UUID
    citations: Optional[List[Citation]] = None
    metadata: Optional[Dict[str, Any]] = None


class Message(MessageBase):
    """Message complet"""
    id: UUID
    conversation_id: UUID
    citations: List[Citation] = []
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# Conversation Models
# ============================================

class ConversationBase(BaseModel):
    """Base d'une conversation"""
    title: str
    organization_id: UUID


class ConversationCreate(ConversationBase):
    """Création d'une conversation"""
    initial_message: Optional[str] = None


class ConversationUpdate(BaseModel):
    """Mise à jour d'une conversation"""
    title: Optional[str] = None


class Conversation(ConversationBase):
    """Conversation complète"""
    id: UUID
    user_id: UUID
    messages_count: int = 0
    last_message_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationWithMessages(Conversation):
    """Conversation avec ses messages"""
    messages: List[Message] = []


# ============================================
# Chat Request/Response
# ============================================

class ChatRequest(BaseModel):
    """Requête de chat"""
    conversation_id: UUID
    message: str
    mode: ChatMode = ChatMode.RAG_ENHANCED
    
    # Filtres RAG
    source_types: Optional[List[SourceType]] = None
    document_ids: Optional[List[UUID]] = None
    lease_ids: Optional[List[UUID]] = None
    property_ids: Optional[List[UUID]] = None
    
    # Options
    include_citations: bool = True
    max_citations: int = Field(default=5, ge=1, le=20)
    stream: bool = False


class ChatResponse(BaseModel):
    """Réponse de chat (non-streaming)"""
    message: Message
    citations: List[Citation] = []
    rag_results: Optional[List[RAGSearchResult]] = None
    processing_time_ms: int


class StreamChunk(BaseModel):
    """Chunk de streaming"""
    type: str  # "content", "citation", "done", "error"
    content: Optional[str] = None
    citation: Optional[Citation] = None
    error: Optional[str] = None


# ============================================
# Prompt Suggestions
# ============================================

class PromptCategory(str, Enum):
    """Catégorie de suggestion de prompt"""
    LEASE_ANALYSIS = "lease_analysis"
    PROPERTY_COMPARISON = "property_comparison"
    FINANCIAL_REPORT = "financial_report"
    GENERAL = "general"


class PromptSuggestion(BaseModel):
    """Suggestion de prompt"""
    id: str
    category: PromptCategory
    title: str
    prompt: str
    icon: str


# ============================================
# Chat Capabilities
# ============================================

class LeasesSummaryRequest(BaseModel):
    """Requête de résumé de bail"""
    lease_id: UUID
    include_key_dates: bool = True
    include_financials: bool = True
    include_clauses: bool = True


class LeasesSummaryResponse(BaseModel):
    """Réponse de résumé de bail"""
    lease_id: UUID
    summary: str
    key_dates: Optional[Dict[str, Any]] = None
    financials: Optional[Dict[str, Any]] = None
    important_clauses: Optional[List[str]] = None


class PropertyComparisonRequest(BaseModel):
    """Requête de comparaison de biens"""
    property_ids: List[UUID] = Field(..., min_length=2, max_length=5)
    criteria: Optional[List[str]] = None


class PropertyComparisonResponse(BaseModel):
    """Réponse de comparaison de biens"""
    properties: List[Dict[str, Any]]
    comparison_table: Dict[str, List[Any]]
    analysis: str


class TableGenerationRequest(BaseModel):
    """Requête de génération de tableau"""
    query: str
    columns: Optional[List[str]] = None
    source_types: Optional[List[SourceType]] = None


class TableGenerationResponse(BaseModel):
    """Réponse de génération de tableau"""
    headers: List[str]
    rows: List[List[Any]]
    summary: Optional[str] = None


# ============================================
# Export
# ============================================

class ExportRequest(BaseModel):
    """Requête d'export"""
    conversation_id: Optional[UUID] = None
    content: Optional[str] = None  # Markdown content
    format: ExportFormat
    include_citations: bool = True


class ExportResponse(BaseModel):
    """Réponse d'export"""
    file_url: str
    file_name: str
    format: ExportFormat
    expires_at: datetime


# ============================================
# Canvas (Markdown + Tables)
# ============================================

class CanvasContent(BaseModel):
    """Contenu Canvas"""
    markdown: str
    tables: List[Dict[str, Any]] = []
    metadata: Optional[Dict[str, Any]] = None


class CanvasSaveRequest(BaseModel):
    """Requête de sauvegarde Canvas"""
    conversation_id: UUID
    content: CanvasContent
    title: Optional[str] = None


class CanvasResponse(BaseModel):
    """Réponse Canvas"""
    id: UUID
    conversation_id: UUID
    content: CanvasContent
    title: str
    created_at: datetime
    updated_at: datetime
