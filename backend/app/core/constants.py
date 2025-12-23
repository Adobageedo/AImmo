from enum import Enum


class DocumentType(str, Enum):
    BAIL = "bail"
    FACTURE = "facture"
    AVIS_ECHEANCE = "avis_echeance"
    DIAGNOSTIC = "diagnostic"
    RAPPORT_FINANCIER = "rapport_financier"
    AUTRE = "autre"


class FileType(str, Enum):
    PDF = "pdf"
    DOCX = "docx"
    XLSX = "xlsx"
    PPTX = "pptx"
    TXT = "txt"
    CSV = "csv"
    JPG = "jpg"
    JPEG = "jpeg"
    PNG = "png"
    GIF = "gif"


ALLOWED_FILE_EXTENSIONS = {
    ".pdf": FileType.PDF,
    ".docx": FileType.DOCX,
    ".xlsx": FileType.XLSX,
    ".pptx": FileType.PPTX,
    ".txt": FileType.TXT,
    ".csv": FileType.CSV,
    ".jpg": FileType.JPG,
    ".jpeg": FileType.JPEG,
    ".png": FileType.PNG,
    ".gif": FileType.GIF,
}

MAX_FILE_SIZE_MB = 50
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

DEFAULT_ORG_QUOTA_MB = 1000
DEFAULT_ORG_QUOTA_BYTES = DEFAULT_ORG_QUOTA_MB * 1024 * 1024

SUPABASE_STORAGE_BUCKET = "documents"


class OCRProvider(str, Enum):
    TESSERACT = "tesseract"
    GPT_VISION = "gpt_vision"
    HYBRID = "hybrid"


class DocumentLanguage(str, Enum):
    FR = "fr"
    EN = "en"
    ES = "es"
    IT = "it"
    DE = "de"


class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    VALIDATED = "validated"


SUPPORTED_OCR_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"]
MIN_TEXT_CONFIDENCE = 0.6
