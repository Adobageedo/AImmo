from app.core.constants import (
    DocumentType,
    FileType,
    OCRProvider,
    ProcessingStatus,
    ALLOWED_FILE_EXTENSIONS,
    MAX_FILE_SIZE_MB,
)


def test_document_types():
    """Test des types de documents"""
    assert DocumentType.BAIL == "bail"
    assert DocumentType.FACTURE == "facture"
    assert DocumentType.DIAGNOSTIC == "diagnostic"


def test_file_types():
    """Test des types de fichiers"""
    assert FileType.PDF == "pdf"
    assert FileType.DOCX == "docx"
    assert ".pdf" in ALLOWED_FILE_EXTENSIONS
    assert ALLOWED_FILE_EXTENSIONS[".pdf"] == FileType.PDF


def test_ocr_providers():
    """Test des providers OCR"""
    assert OCRProvider.TESSERACT == "tesseract"
    assert OCRProvider.GPT_VISION == "gpt_vision"
    assert OCRProvider.HYBRID == "hybrid"


def test_processing_status():
    """Test des statuts de traitement"""
    assert ProcessingStatus.PENDING == "pending"
    assert ProcessingStatus.PROCESSING == "processing"
    assert ProcessingStatus.COMPLETED == "completed"
    assert ProcessingStatus.FAILED == "failed"


def test_file_size_limits():
    """Test des limites de taille"""
    assert MAX_FILE_SIZE_MB == 50
    assert MAX_FILE_SIZE_MB * 1024 * 1024 > 0
