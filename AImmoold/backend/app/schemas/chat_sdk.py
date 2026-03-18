"""
Chat SDK Schemas - Architecture complète
Schémas pour le SDK Chat UI immobilier avec streaming, RAG, Canvas et exports
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from enum import Enum


# ============================================
# Enums
# ============================================

class MessageRole(str, Enum):
    """Rôle du message"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatMode(str, Enum):
    """Mode de chat"""
    NORMAL = "normal"
    RAG_ONLY = "rag_only"
    RAG_ENHANCED = "rag_enhanced"


class SourceType(str, Enum):
    """Types de sources RAG"""
    DOCUMENTS = "documents"
    LEASES = "leases"
    PROPERTIES = "properties"
    KPIS = "kpis"
    TENANTS = "tenants"
    OWNERS = "owners"


class ExportFormat(str, Enum):
    """Formats d'export"""
    EXCEL = "excel"
    PDF = "pdf"
    MARKDOWN = "markdown"
    JSON = "json"


class ArtifactType(str, Enum):
    """Types d'artefacts Canvas"""
    TABLE = "table"
    CHART = "chart"
    DOCUMENT = "document"
    CODE = "code"


class StreamEventType(str, Enum):
    """Types d'événements de streaming"""
    CHUNK = "chunk"
    CITATION = "citation"
    ARTIFACT = "artifact"
    DONE = "done"
    ERROR = "error"


# ============================================
# Citations
# ============================================

class Citation(BaseModel):
    """Citation d'une source"""
    id: str
    chunk_id: str
    document_id: str
    document_title: str
    content_preview: str
    page_number: Optional[int] = None
    source_type: SourceType
    url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


# ============================================
# Messages
# ============================================

class MessageBase(BaseModel):
    """Base d'un message"""
    role: MessageRole
    content: str
    metadata: Optional[Dict[str, Any]] = None


class MessageCreate(BaseModel):
    """Création d'un message"""
    conversation_id: str
    role: MessageRole
    content: str
    citations: Optional[List[Citation]] = None
    artifacts: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None


class Message(MessageBase):
    """Message complet"""
    id: str
    conversation_id: str
    citations: List[Citation] = []
    artifacts: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageDelete(BaseModel):
    """Suppression d'un message"""
    message_id: str


class MessageRetry(BaseModel):
    """Retry d'un message"""
    message_id: str


# ============================================
# Conversations
# ============================================

class ConversationBase(BaseModel):
    """Base d'une conversation"""
    title: str
    organization_id: str


class ConversationCreate(ConversationBase):
    """Création d'une conversation"""
    initial_message: Optional[str] = None


class ConversationUpdate(BaseModel):
    """Mise à jour d'une conversation"""
    title: Optional[str] = None


class Conversation(ConversationBase):
    """Conversation complète"""
    id: str
    user_id: str
    messages_count: int = 0
    last_message_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationWithMessages(Conversation):
    """Conversation avec messages"""
    messages: List[Message] = []


class ConversationList(BaseModel):
    """Liste paginée de conversations"""
    conversations: List[Conversation]
    total: int
    page: int
    page_size: int
    has_more: bool


# ============================================
# Chat Requests/Responses
# ============================================

class ChatRequest(BaseModel):
    """Requête de chat simplifiée - le backend gère la logique RAG"""
    conversation_id: str
    message: str
    mode: ChatMode = ChatMode.NORMAL
    
    # Sources RAG demandées (liste vide = aucune source)
    # Accepter les strings et les convertir en SourceType enum
    requested_sources: List[str] = []
    
    # Filtres spécifiques optionnels
    document_ids: Optional[List[str]] = None
    lease_ids: Optional[List[str]] = None
    property_ids: Optional[List[str]] = None
    
    # Options
    stream: bool = True
    
    def get_requested_sources(self) -> List[SourceType]:
        """Convertit les strings en SourceType enum, en ignorant les valeurs invalides"""
        valid_sources = []
        for source_str in self.requested_sources:
            try:
                # Corriger les variations courantes
                normalized_source = source_str.lower()
                if normalized_source == "kpi":
                    normalized_source = "kpis"
                    
                source_type = SourceType(normalized_source)
                valid_sources.append(source_type)
            except ValueError:
                # Ignorer les sources invalides silencieusement
                print(f"DEBUG: Ignoring invalid source: {source_str}")
                continue
        return valid_sources


class ChatResponse(BaseModel):
    """Réponse de chat (non-streaming)"""
    message: Message
    citations: List[Citation] = []
    artifacts: List[Dict[str, Any]] = []
    processing_time_ms: int


class StreamChunk(BaseModel):
    """Chunk de streaming SSE"""
    event: StreamEventType
    content: Optional[str] = None
    citation: Optional[Citation] = None
    artifact: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    done: bool = False


# ============================================
# RAG
# ============================================

class RAGSearchRequest(BaseModel):
    """Requête de recherche RAG"""
    query: str
    organization_id: str
    source_types: Optional[List[SourceType]] = None
    document_ids: Optional[List[str]] = None
    limit: int = Field(default=10, ge=1, le=50)
    min_score: float = Field(default=0.7, ge=0.0, le=1.0)


class RAGSearchResult(BaseModel):
    """Résultat de recherche RAG"""
    chunk_id: str
    document_id: str
    document_title: str
    content: str
    source_type: SourceType
    metadata: Optional[Dict[str, Any]] = None


class RAGSearchResponse(BaseModel):
    """Réponse de recherche RAG"""
    results: List[RAGSearchResult]
    total: int
    query: str
    processing_time_ms: int


# ============================================
# Artifacts & Canvas
# ============================================

class ArtifactCreate(BaseModel):
    """Création d'un artefact"""
    conversation_id: str
    message_id: Optional[str] = None
    type: ArtifactType
    title: str
    content: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None


class Artifact(BaseModel):
    """Artefact complet"""
    id: str
    conversation_id: str
    message_id: Optional[str] = None
    type: ArtifactType
    title: str
    content: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ArtifactUpdate(BaseModel):
    """Mise à jour d'un artefact"""
    title: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class CanvasSyncRequest(BaseModel):
    """Synchronisation Canvas"""
    conversation_id: str
    artifacts: List[Dict[str, Any]]


# ============================================
# Exports
# ============================================

class ExportRequest(BaseModel):
    """Requête d'export"""
    conversation_id: Optional[str] = None
    artifact_ids: Optional[List[str]] = None
    content: Optional[str] = None
    format: ExportFormat
    include_citations: bool = True
    include_metadata: bool = False


class ExportResponse(BaseModel):
    """Réponse d'export"""
    file_url: str
    file_name: str
    format: ExportFormat
    size_bytes: int
    expires_at: datetime


# ============================================
# Suggestions
# ============================================

class PromptCategory(str, Enum):
    """Catégories de suggestions"""
    LEASE_ANALYSIS = "lease_analysis"
    PROPERTY_COMPARISON = "property_comparison"
    FINANCIAL_REPORT = "financial_report"
    TENANT_MANAGEMENT = "tenant_management"
    GENERAL = "general"


class PromptSuggestion(BaseModel):
    """Suggestion de prompt"""
    id: str
    category: PromptCategory
    title: str
    prompt: str
    icon: str
    description: Optional[str] = None


class SuggestionsRequest(BaseModel):
    """Requête de suggestions contextuelles"""
    conversation_id: Optional[str] = None
    organization_id: str
    count: int = Field(default=5, ge=1, le=10)
    conversation_context: Optional[List[Dict[str, str]]] = None
    last_assistant_message: Optional[str] = None
    user_prompt: Optional[str] = None  # Ajout du champ manquant


class SuggestionsResponse(BaseModel):
    """Réponse de suggestions"""
    suggestions: List[PromptSuggestion]
    context_based: bool = False
