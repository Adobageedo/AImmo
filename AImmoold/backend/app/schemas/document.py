from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from app.core.constants import DocumentType, FileType


class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    document_type: DocumentType = DocumentType.AUTRE
    folder_path: str = "/"
    property_id: Optional[UUID] = None
    lease_id: Optional[UUID] = None
    tags: List[str] = []


class DocumentCreate(DocumentBase):
    organization_id: UUID


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    document_type: Optional[DocumentType] = None
    folder_path: Optional[str] = None
    tags: Optional[List[str]] = None
    property_id: Optional[UUID] = None
    lease_id: Optional[UUID] = None


class Document(DocumentBase):
    id: UUID
    file_path: str
    file_type: FileType
    file_size: int
    organization_id: UUID
    uploaded_by: UUID
    created_at: datetime
    updated_at: datetime
    
    # Vectorization fields
    vectorization_status: Optional[str] = "not_planned"
    vectorization_started_at: Optional[datetime] = None
    vectorization_completed_at: Optional[datetime] = None
    vectorization_error: Optional[str] = None
    qdrant_collection_name: Optional[str] = None
    num_chunks: Optional[int] = 0
    content_hash: Optional[str] = None
    
    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    document: Document
    storage_path: str
    public_url: Optional[str] = None


class OrganizationQuota(BaseModel):
    organization_id: UUID
    used_bytes: int
    quota_bytes: int
    used_mb: float
    quota_mb: float
    usage_percentage: float
    
    @property
    def remaining_bytes(self) -> int:
        return max(0, self.quota_bytes - self.used_bytes)
    
    @property
    def is_quota_exceeded(self) -> bool:
        return self.used_bytes >= self.quota_bytes
