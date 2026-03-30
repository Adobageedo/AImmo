from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import tempfile
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import services
from services import TextExtractionService, OpenAIService, JurisprudenceNewsletterService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Lease Document Parser API", version="2.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI service
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_service = None
if OPENAI_API_KEY:
    try:
        openai_service = OpenAIService(api_key=OPENAI_API_KEY)
        logger.info("OpenAI service initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI service: {e}")
else:
    logger.warning("OPENAI_API_KEY not found - AI parsing will be disabled")

# Initialize newsletter service
jurisprudence_service = None
try:
    jurisprudence_service = JurisprudenceNewsletterService()
    logger.info("Jurisprudence newsletter service initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize newsletter service: {e}")

# Import and include newsletter API
from api.jurisprudence import router as jurisprudence_router
app.include_router(jurisprudence_router)

# Initialize scheduler
from core.scheduler import start_scheduler, scheduler

# Pydantic models
class ExtractedLeaseData(BaseModel):
    landlord_name: Optional[str] = None
    landlord_address: Optional[str] = None
    landlord_email: Optional[str] = None
    landlord_phone: Optional[str] = None
    tenant_name: Optional[str] = None
    tenant_company_name: Optional[str] = None
    tenant_address: Optional[str] = None
    tenant_email: Optional[str] = None
    tenant_phone: Optional[str] = None
    property_address: Optional[str] = None
    property_city: Optional[str] = None
    property_postal_code: Optional[str] = None
    property_type: Optional[str] = None
    property_surface: Optional[float] = None
    lease_type: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    duration_months: Optional[int] = None
    monthly_rent: Optional[float] = None
    charges: Optional[float] = None
    deposit: Optional[float] = None
    payment_day: Optional[int] = None
    indexation_clause: Optional[bool] = None
    special_clauses: Optional[List[str]] = None
    confidence_score: Optional[float] = None
    extraction_method: Optional[str] = None
    raw_text: Optional[str] = None

class ParseResponse(BaseModel):
    success: bool
    data: Optional[ExtractedLeaseData] = None
    error: Optional[str] = None

@app.post("/parse", response_model=ParseResponse)
async def parse_document(file: UploadFile = File(...)):
    """Parse lease document using text extraction and OpenAI services"""
    
    # Validate input
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file extension
    file_extension = os.path.splitext(file.filename)[1].lower()
    supported_extensions = ['.pdf', '.docx', '.doc']
    
    if file_extension not in supported_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Supported types: {', '.join(supported_extensions)}"
        )
    
    # Create temporary file
    temp_file_path = None
    try:
        content = await file.read()
        logger.info(f"Processing {file.filename} ({len(content)} bytes)")
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Step 1: Extract text using TextExtractionService
        logger.info(f"Extracting text from {file.filename}")
        try:
            text, extraction_method = TextExtractionService.extract_text_from_file(temp_file_path, file_extension)
            logger.info(f"Extracted {len(text)} characters using {extraction_method}")
        except Exception as e:
            logger.error(f"Text extraction failed: {e}")
            text = ""
            extraction_method = "extraction_error"
        
        # Step 2: Parse with OpenAI if available and text extracted
        extracted_data = None
        
        if openai_service and len(text.strip()) > 0:
            logger.info("Parsing extracted text with OpenAI")
            try:
                extracted_data_dict = openai_service.parse_lease_document(text)
                extracted_data = ExtractedLeaseData(**extracted_data_dict)
                logger.info(f"Successfully parsed with OpenAI (confidence: {extracted_data.confidence_score})")
            except Exception as e:
                logger.error(f"OpenAI parsing failed: {e}")
                extracted_data = None
        
        # Step 3: Create fallback data if needed
        if extracted_data is None:
            if not openai_service:
                logger.warning("OpenAI service not available - using fallback")
            elif len(text.strip()) == 0:
                logger.warning("No text extracted - likely scanned document")
            else:
                logger.warning("OpenAI parsing failed - using fallback")
            
            extracted_data = _create_fallback_data(text, extraction_method)
        
        logger.info(f"Successfully processed {file.filename}")
        return ParseResponse(success=True, data=extracted_data)
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing document: {e}", exc_info=True)
        
        # Return fallback data even on unexpected errors
        fallback_data = ExtractedLeaseData(
            landlord_name="Erreur de traitement",
            landlord_address="Extraction automatique",
            tenant_name="Erreur de traitement",
            tenant_address="Extraction automatique",
            property_address="Erreur de traitement",
            confidence_score=0.0,
            extraction_method="error",
            raw_text="Erreur lors du traitement"
        )
        
        return ParseResponse(success=True, data=fallback_data)
        
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                logger.debug(f"Cleaned up temporary file: {temp_file_path}")
            except Exception as e:
                logger.warning(f"Failed to clean up temporary file: {e}")

def _create_fallback_data(text: str, extraction_method: str) -> ExtractedLeaseData:
    """Create fallback data for scanned documents or when OpenAI is unavailable"""
    
    if len(text.strip()) == 0:
        # Scanned document
        return ExtractedLeaseData(
            landlord_name="Document scanné",
            landlord_address="Extraction automatique impossible",
            landlord_email=None,
            landlord_phone=None,
            tenant_name="Document scanné",
            tenant_company_name=None,
            tenant_address="Extraction automatique impossible",
            tenant_email=None,
            tenant_phone=None,
            property_address="Document scanné",
            property_city=None,
            property_postal_code=None,
            property_type="inconnu",
            property_surface=None,
            lease_type="inconnu",
            start_date=None,
            end_date=None,
            duration_months=None,
            monthly_rent=None,
            charges=None,
            deposit=None,
            payment_day=None,
            indexation_clause=None,
            special_clauses=None,
            confidence_score=0.0,
            extraction_method="scanned_document",
            raw_text=""
        )
    else:
        # Text extracted but OpenAI unavailable
        return ExtractedLeaseData(
            landlord_name="Extraction manuelle requise",
            landlord_address="Veuillez compléter manuellement",
            landlord_email=None,
            landlord_phone=None,
            tenant_name="Extraction manuelle requise",
            tenant_company_name=None,
            tenant_address="Veuillez compléter manuellement",
            tenant_email=None,
            tenant_phone=None,
            property_address="Extraction manuelle requise",
            property_city=None,
            property_postal_code=None,
            property_type="inconnu",
            property_surface=None,
            lease_type="inconnu",
            start_date=None,
            end_date=None,
            duration_months=None,
            monthly_rent=None,
            charges=None,
            deposit=None,
            payment_day=None,
            indexation_clause=None,
            special_clauses=None,
            confidence_score=0.3,
            extraction_method=f"extracted_{extraction_method}",
            raw_text=text
        )

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Lease Document Parser API (Simple)", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "openai_configured": openai_service is not None,
        "parser": "enhanced",
        "version": "2.0.0",
        "services": {
            "text_extraction": "available",
            "openai": "available" if openai_service else "unavailable"
        }
    }

@app.get("/services/status")
async def services_status():
    """Detailed services status endpoint"""
    # Check OCR availability
    ocr_available = False
    try:
        import pytesseract
        import pdf2image
        from PIL import Image
        ocr_available = True
    except ImportError:
        pass
    
    return {
        "text_extraction_service": {
            "status": "available",
            "supported_formats": [".pdf", ".docx", ".doc"],
            "pdf_library": "PyPDF2",
            "docx_library": "python-docx",
            "ocr_available": ocr_available,
            "ocr_engine": "tesseract" if ocr_available else "unavailable",
            "ocr_languages": ["fra", "eng"] if ocr_available else [],
            "ocr_fallback_threshold": 100  # characters
        },
        "openai_service": {
            "status": "available" if openai_service else "unavailable",
            "model": "gpt-4o-mini",
            "api_key_configured": bool(OPENAI_API_KEY),
            "confidence_scoring": True
        }
    }

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("🚀 Starting application...")
    
    # Start scheduler
    try:
        start_scheduler()
        logger.info("✅ Scheduler started successfully")
    except Exception as e:
        logger.error(f"❌ Failed to start scheduler: {e}")
    
    logger.info("✅ Application startup completed")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("🛑 Shutting down application...")
    
    # Stop scheduler
    if scheduler.running:
        from core.scheduler import stop_scheduler
        stop_scheduler()
        logger.info("✅ Scheduler stopped")
    
    logger.info("✅ Application shutdown completed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
