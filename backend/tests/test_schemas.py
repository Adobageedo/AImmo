from datetime import datetime, date
from uuid import uuid4
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    OrganizationQuota,
)
from app.schemas.ocr import (
    OCRResult,
    ParsedParty,
    ParsedLease,
    ProcessingRequest,
)
from app.core.constants import DocumentType, OCRProvider, DocumentLanguage


def test_document_create_schema():
    """Test du schéma DocumentCreate"""
    doc = DocumentCreate(
        title="Test Document",
        document_type=DocumentType.BAIL,
        folder_path="/test",
        organization_id=uuid4(),
    )
    assert doc.title == "Test Document"
    assert doc.document_type == DocumentType.BAIL
    assert doc.folder_path == "/test"


def test_document_update_schema():
    """Test du schéma DocumentUpdate"""
    update = DocumentUpdate(
        title="Updated Title",
        tags=["tag1", "tag2"],
    )
    assert update.title == "Updated Title"
    assert len(update.tags) == 2


def test_organization_quota_schema():
    """Test du schéma OrganizationQuota"""
    quota = OrganizationQuota(
        organization_id=uuid4(),
        used_bytes=500_000_000,  # 500 MB
        quota_bytes=1_000_000_000,  # 1 GB
        used_mb=476.84,
        quota_mb=953.67,
        usage_percentage=50.0,
    )
    assert quota.usage_percentage == 50.0
    assert quota.remaining_bytes == 500_000_000
    assert not quota.is_quota_exceeded


def test_ocr_result_schema():
    """Test du schéma OCRResult"""
    ocr = OCRResult(
        text="Sample text",
        confidence=0.95,
        language=DocumentLanguage.FR,
        provider=OCRProvider.TESSERACT,
        page_count=2,
        is_scanned=True,
        metadata={"test": "value"},
    )
    assert ocr.confidence == 0.95
    assert ocr.language == DocumentLanguage.FR
    assert ocr.is_scanned


def test_parsed_party_schema():
    """Test du schéma ParsedParty"""
    party = ParsedParty(
        type="tenant",
        name="John Doe",
        email="john@example.com",
        phone="0123456789",
    )
    assert party.type == "tenant"
    assert party.name == "John Doe"


def test_parsed_lease_schema():
    """Test du schéma ParsedLease"""
    lease = ParsedLease(
        parties=[
            ParsedParty(type="landlord", name="Owner"),
            ParsedParty(type="tenant", name="Tenant"),
        ],
        property_address="123 Main St",
        monthly_rent=1200.0,
        start_date=date(2024, 1, 1),
        confidence=0.8,
        key_clauses=["Clause 1", "Clause 2"],
        raw_data={},
    )
    assert len(lease.parties) == 2
    assert lease.monthly_rent == 1200.0
    assert lease.confidence == 0.8


def test_processing_request_schema():
    """Test du schéma ProcessingRequest"""
    request = ProcessingRequest(
        document_id=uuid4(),
        organization_id=uuid4(),
        ocr_provider=OCRProvider.HYBRID,
        force_reprocess=False,
    )
    assert request.ocr_provider == OCRProvider.HYBRID
    assert not request.force_reprocess
