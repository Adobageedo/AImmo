"""
Text extraction service for lease documents
"""
import os
import tempfile
import logging
from typing import Tuple
import PyPDF2
from docx import Document
try:
    import pytesseract
    from PIL import Image
    import pdf2image
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logger.warning("Tesseract OCR not available - install with: pip install pytesseract pillow pdf2image")

logger = logging.getLogger(__name__)

class TextExtractionService:
    """Service for extracting text from various document types"""
    
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> Tuple[str, str]:
        """Extract text from PDF file with OCR fallback"""
        text = ""
        method = "pdf2json"
        
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page_num, page in enumerate(pdf_reader.pages):
                    try:
                        page_text = page.extract_text()
                        text += page_text + "\n"
                        logger.debug(f"Extracted {len(page_text)} characters from page {page_num + 1}")
                    except Exception as page_error:
                        logger.warning(f"Could not extract text from page {page_num + 1}: {page_error}")
                        continue
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            return "", method
        
        # If text extraction is insufficient, try OCR
        if len(text.strip()) < 100 and TESSERACT_AVAILABLE:
            logger.info(f"Text extraction insufficient ({len(text)} chars), trying OCR")
            ocr_text, ocr_method = TextExtractionService.extract_text_with_ocr(file_path)
            if len(ocr_text.strip()) > len(text.strip()):
                text = ocr_text
                method = ocr_method
                logger.info(f"OCR extracted {len(text)} characters")
            else:
                logger.info(f"OCR did not improve extraction, keeping original text")
        
        return text, method
    
    @staticmethod
    def extract_text_with_ocr(file_path: str) -> Tuple[str, str]:
        """Extract text from PDF using OCR"""
        if not TESSERACT_AVAILABLE:
            logger.warning("Tesseract not available, skipping OCR")
            return "", "ocr_unavailable"
        
        try:
            # Convert PDF to images
            logger.info(f"Converting PDF to images for OCR: {file_path}")
            images = pdf2image.convert_from_path(file_path, dpi=300, fmt='jpeg')
            
            ocr_text = ""
            for page_num, image in enumerate(images):
                try:
                    # Preprocess image for better OCR
                    # Convert to grayscale
                    gray_image = image.convert('L')
                    
                    # Apply threshold for better text recognition
                    from PIL import ImageFilter
                    enhanced_image = gray_image.filter(ImageFilter.SHARPEN)
                    
                    # Extract text using Tesseract
                    page_text = pytesseract.image_to_string(
                        enhanced_image, 
                        lang='fra+eng',  # French + English
                        config='--psm 6 --oem 3'  # Page segmentation mode + OCR engine mode
                    )
                    
                    ocr_text += page_text + "\n"
                    logger.debug(f"OCR extracted {len(page_text)} characters from page {page_num + 1}")
                    
                except Exception as page_error:
                    logger.warning(f"OCR failed on page {page_num + 1}: {page_error}")
                    continue
            
            logger.info(f"OCR completed: {len(ocr_text)} characters extracted")
            return ocr_text.strip(), "tesseract_ocr"
            
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            return "", "ocr_error"

    @staticmethod
    def extract_text_from_docx(file_path: str) -> Tuple[str, str]:
        """Extract text from DOCX file"""
        text = ""
        method = "docx"
        
        try:
            doc = Document(file_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        except Exception as e:
            logger.error(f"Error extracting text from DOCX: {e}")
            return "", method
        
        return text, method

    @staticmethod
    def extract_text_from_file(file_path: str, file_extension: str) -> Tuple[str, str]:
        """Extract text from file based on its extension"""
        file_extension = file_extension.lower()
        
        if file_extension == '.pdf':
            return TextExtractionService.extract_text_from_pdf(file_path)
        elif file_extension in ['.docx', '.doc']:
            return TextExtractionService.extract_text_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")
