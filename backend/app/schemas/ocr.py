from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from uuid import UUID
from app.core.constants import DocumentLanguage, ProcessingStatus, OCRProvider


class OCRResult(BaseModel):
    text: str
    confidence: float
    language: Optional[DocumentLanguage] = None
    provider: Optional[OCRProvider] = None
    page_count: int = 1
    is_scanned: bool = False
    metadata: Dict[str, Any] = {}


class ParsedParty(BaseModel):
    type: str  # "landlord" ou "tenant"
    name: Optional[str] = "Inconnu"
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    siret: Optional[str] = None


class ParsedLease(BaseModel):
    parties: List[ParsedParty] = []
    property_address: Optional[str] = "Adresse non trouvée"
    property_type: Optional[str] = None
    surface_area: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    monthly_rent: Optional[float] = None
    charges: Optional[float] = None
    deposit: Optional[float] = None
    indexation_rate: Optional[float] = None
    key_clauses: List[str] = []
    confidence: float
    raw_data: Dict[str, Any] = {}


class DocumentProcessing(BaseModel):
    id: UUID
    document_id: UUID
    status: ProcessingStatus
    ocr_result: Optional[OCRResult] = None
    parsed_lease: Optional[ParsedLease] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    validated_at: Optional[datetime] = None
    validated_by: Optional[UUID] = None
    
    class Config:
        from_attributes = True


class ProcessingRequest(BaseModel):
    document_id: UUID
    organization_id: UUID
    ocr_provider: OCRProvider = OCRProvider.HYBRID
    force_reprocess: bool = False


class ValidationRequest(BaseModel):
    processing_id: UUID
    organization_id: UUID
    validated_data: ParsedLease
    create_entities: bool = True


class EntityCreationResult(BaseModel):
    property_id: Optional[UUID] = None
    tenant_id: Optional[UUID] = None
    lease_id: Optional[UUID] = None
    errors: List[str] = []
