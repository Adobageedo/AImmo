"""
RAG Schemas - Phase 4 Foundation
Chunking, vectorisation, indexation et recherche
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from enum import Enum


class SourceType(str, Enum):
    """Types de sources pour l'indexation RAG"""
    DOCUMENT = "document"
    LEASE = "lease"
    PROPERTY = "property"
    TENANT = "tenant"
    KPI = "kpi"
    CONVERSATION = "conversation"


class ChunkStatus(str, Enum):
    """Statut d'un chunk"""
    PENDING = "pending"
    PROCESSING = "processing"
    INDEXED = "indexed"
    FAILED = "failed"
    EXCLUDED = "excluded"


class ChunkingMethod(str, Enum):
    """Méthodes de chunking"""
    FIXED_SIZE = "fixed_size"
    PARAGRAPH = "paragraph"
    SEMANTIC = "semantic"
    SENTENCE = "sentence"
    RECURSIVE = "recursive"


class EmbeddingModel(str, Enum):
    """Modèles d'embedding disponibles"""
    OPENAI_ADA = "text-embedding-ada-002"
    OPENAI_3_SMALL = "text-embedding-3-small"
    OPENAI_3_LARGE = "text-embedding-3-large"


class IndexStatus(str, Enum):
    """Statut d'indexation d'un document"""
    NOT_INDEXED = "not_indexed"
    INDEXING = "indexing"
    INDEXED = "indexed"
    PARTIAL = "partial"
    FAILED = "failed"
    EXCLUDED = "excluded"


# ============================================
# Chunk Models
# ============================================

class ChunkMetadata(BaseModel):
    """Métadonnées d'un chunk"""
    source_title: str = ""
    document_type: Optional[str] = None
    page_number: Optional[int] = None
    section_heading: Optional[str] = None
    language: str = "fr"
    quality_score: Optional[float] = None
    context: Optional[Dict[str, Any]] = None


class ChunkBase(BaseModel):
    """Base d'un chunk"""
    document_id: UUID
    organization_id: UUID
    content: str
    chunk_index: int
    total_chunks: int
    start_offset: int
    end_offset: int
    source_type: SourceType
    source_id: UUID
    semantic_tags: List[str] = []
    metadata: ChunkMetadata


class ChunkCreate(ChunkBase):
    """Création d'un chunk"""
    content_hash: str
    embedding: Optional[List[float]] = None
    embedding_model: Optional[str] = None


class Chunk(ChunkBase):
    """Chunk complet"""
    id: UUID
    content_hash: str
    embedding: Optional[List[float]] = None
    embedding_model: Optional[str] = None
    status: ChunkStatus = ChunkStatus.PENDING
    is_excluded: bool = False
    lease_id: Optional[UUID] = None
    property_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================
# Chunking Configuration
# ============================================

class ChunkingConfig(BaseModel):
    """Configuration de chunking par type de source"""
    source_type: SourceType
    chunk_size: int = 512
    chunk_overlap: int = 50
    chunking_method: ChunkingMethod = ChunkingMethod.RECURSIVE
    separators: Optional[List[str]] = None


# ============================================
# Indexation Requests
# ============================================

class IndexDocumentRequest(BaseModel):
    """Requête d'indexation d'un document"""
    document_id: UUID
    content: str
    source_type: SourceType = SourceType.DOCUMENT
    metadata: Optional[ChunkMetadata] = None
    chunking_config: Optional[ChunkingConfig] = None


class IndexDocumentResponse(BaseModel):
    """Réponse d'indexation d'un document"""
    document_id: UUID
    status: IndexStatus
    chunks_count: int
    chunks_indexed: int
    last_indexed_at: Optional[datetime] = None
    error_message: Optional[str] = None


class BulkIndexRequest(BaseModel):
    """Requête d'indexation en masse"""
    document_ids: List[UUID]
    force_reindex: bool = False


class BulkIndexResponse(BaseModel):
    """Réponse d'indexation en masse"""
    total_documents: int
    indexed: int
    failed: int
    results: List[IndexDocumentResponse]


# ============================================
# Search Requests
# ============================================

class RAGSearchRequest(BaseModel):
    """Requête de recherche RAG"""
    organization_id: UUID
    query: str
    source_types: Optional[List[SourceType]] = None
    document_ids: Optional[List[UUID]] = None
    lease_ids: Optional[List[UUID]] = None
    property_ids: Optional[List[UUID]] = None
    tags: Optional[List[str]] = None
    limit: int = Field(default=10, ge=1, le=50)
    min_score: float = Field(default=0.5, ge=0, le=1)


class RAGSearchResult(BaseModel):
    """Résultat de recherche RAG"""
    chunk_id: UUID
    document_id: UUID
    content: str
    score: float
    source_type: SourceType
    metadata: ChunkMetadata
    semantic_tags: List[str]
    highlights: Optional[List[str]] = None


class RAGSearchResponse(BaseModel):
    """Réponse de recherche RAG"""
    results: List[RAGSearchResult]
    total_chunks_searched: int
    processing_time_ms: int
    sources_included: List[SourceType]


# ============================================
# RAG Configuration
# ============================================

class RAGConfigUpdate(BaseModel):
    """Mise à jour de la config RAG"""
    source_visibility: Optional[Dict[SourceType, bool]] = None
    excluded_document_ids: Optional[List[UUID]] = None
    tag_filters: Optional[List[str]] = None
    embedding_model: Optional[EmbeddingModel] = None


class RAGConfig(BaseModel):
    """Configuration RAG complète"""
    organization_id: UUID
    embedding_model: EmbeddingModel = EmbeddingModel.OPENAI_3_SMALL
    chunking_configs: Dict[SourceType, ChunkingConfig] = {}
    source_visibility: Dict[SourceType, bool] = {}
    excluded_document_ids: List[UUID] = []
    tag_filters: List[str] = []


# ============================================
# RAG Stats
# ============================================

class RAGStats(BaseModel):
    """Statistiques RAG"""
    organization_id: UUID
    total_chunks: int
    chunks_by_source: Dict[SourceType, int]
    documents_indexed: int
    documents_excluded: int
    last_index_update: Optional[datetime] = None
    storage_used_bytes: int = 0


# ============================================
# Document Exclusion
# ============================================

class DocumentExclusionRequest(BaseModel):
    """Requête d'exclusion/inclusion d'un document"""
    document_id: UUID
    excluded: bool


class DocumentExclusionResponse(BaseModel):
    """Réponse d'exclusion/inclusion"""
    document_id: UUID
    is_excluded: bool
    chunks_affected: int
