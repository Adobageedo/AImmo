import io
import os
from typing import Optional, Tuple
from PIL import Image
import pytesseract
from pdf2image import convert_from_bytes
from pypdf import PdfReader
from langdetect import detect
import tempfile
import docx

from app.core.constants import OCRProvider, DocumentLanguage, SUPPORTED_OCR_EXTENSIONS
from app.schemas.ocr import OCRResult


class OCRService:
    def __init__(self):
        pass
    
    def is_pdf_scanned(self, pdf_bytes: bytes) -> bool:
        """Détecte si un PDF est scanné (image) ou natif (texte)"""
        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            
            total_text_length = 0
            for page in reader.pages[:3]:  # Check first 3 pages
                text = page.extract_text()
                total_text_length += len(text.strip())
            
            # Si moins de 50 caractères dans les 3 premières pages, c'est probablement scanné
            return total_text_length < 50
        except Exception:
            return True  # En cas d'erreur, on assume que c'est scanné
    
    def detect_language(self, text: str) -> DocumentLanguage:
        """Détecte la langue du texte"""
        try:
            lang_code = detect(text)
            lang_map = {
                "fr": DocumentLanguage.FR,
                "en": DocumentLanguage.EN,
                "es": DocumentLanguage.ES,
                "it": DocumentLanguage.IT,
                "de": DocumentLanguage.DE,
            }
            return lang_map.get(lang_code, DocumentLanguage.FR)
        except Exception:
            return DocumentLanguage.FR  # Par défaut français
    
    def extract_text_from_pdf_native(self, pdf_bytes: bytes) -> Tuple[str, int]:
        """Extrait le texte d'un PDF natif"""
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text_parts = []
        
        for page in reader.pages:
            text_parts.append(page.extract_text())
        
        return "\n\n".join(text_parts), len(reader.pages)
    
    def extract_text_from_docx(self, docx_bytes: bytes) -> str:
        """Extrait le texte d'un fichier .docx"""
        try:
            doc = docx.Document(io.BytesIO(docx_bytes))
            text_parts = [paragraph.text for paragraph in doc.paragraphs]
            return "\n".join(text_parts)
        except Exception as e:
            print(f"Error extracting docx: {str(e)}")
            return ""
    
    def _check_tesseract(self):
        """Vérifie si Tesseract est disponible"""
        try:
            pytesseract.get_tesseract_version()
            return True
        except Exception:
            return False

    def extract_text_with_tesseract(self, file_bytes: bytes, file_ext: str) -> Tuple[str, int]:
        """Extrait le texte via Tesseract OCR"""
        if not self._check_tesseract():
             raise RuntimeError(
                "Tesseract OCR n'est pas installé ou n'est pas dans le PATH du système. "
                "Veuillez l'installer (https://github.com/UB-Mannheim/tesseract/wiki) "
                "ou configurer l'API OpenAI pour utiliser GPT-4o Vision."
            )

        if file_ext.lower() == ".pdf":
            # Convertir PDF en images
            try:
                images = convert_from_bytes(file_bytes)
            except Exception as e:
                raise RuntimeError(f"Erreur lors de la conversion PDF en images (vérifiez si 'poppler' est installé): {str(e)}")
            
            text_parts = []
            
            for image in images:
                text = pytesseract.image_to_string(image, lang="fra+eng")
                text_parts.append(text)
            
            return "\n\n".join(text_parts), len(images)
        else:
            # Image directement
            image = Image.open(io.BytesIO(file_bytes))
            text = pytesseract.image_to_string(image, lang="fra+eng")
            return text, 1
    
    async def extract_text_with_gpt_vision(self, file_bytes: bytes, file_ext: str) -> Tuple[str, int]:
        """Extrait le texte via GPT-4o Vision"""
        from app.services.llm_service import llm_service
        import base64

        base64_image = base64.b64encode(file_bytes).decode('utf-8')
        mime_type = "image/jpeg" if file_ext.lower() in [".jpg", ".jpeg"] else "image/png"
        
        if file_ext.lower() == ".pdf":
            # For PDF, we'd need to convert to images first. 
            # For now, let's use the first page if we can or tell user we're using Tesseract for PDF -> Image conversion anyway
            try:
                images = convert_from_bytes(file_bytes, last_page=1) # Just first page for vision to be safe/cheap
                img_byte_arr = io.BytesIO()
                images[0].save(img_byte_arr, format='JPEG')
                base64_image = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
                mime_type = "image/jpeg"
            except Exception as e:
                 return self.extract_text_with_tesseract(file_bytes, file_ext)

        prompt = "Extract all text from this document image. Preserve the layout as much as possible."
        
        try:
            # GPT-4o Vision call
            response = await llm_service.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=4096
            )
            return response.choices[0].message.content, 1
        except Exception as e:
            # Fallback to Tesseract if GPT Vision fails (e.g. no key)
            print(f"GPT Vision failed: {str(e)}")
            return self.extract_text_with_tesseract(file_bytes, file_ext)
    
    async def process_document(
        self,
        file_bytes: bytes,
        filename: str,
        provider: OCRProvider = OCRProvider.HYBRID
    ) -> OCRResult:
        """
        Traite un document et extrait le texte
        HYBRID = détecte si PDF scanné, puis choisit la meilleure méthode
        """
        file_ext = os.path.splitext(filename)[1].lower()
        
        if file_ext not in SUPPORTED_OCR_EXTENSIONS:
            raise ValueError(f"Extension non supportée pour OCR: {file_ext}")
        
        is_scanned = False
        text = ""
        page_count = 1
        actual_provider = provider
        
        if file_ext == ".pdf":
            is_scanned = self.is_pdf_scanned(file_bytes)
            
            if provider == OCRProvider.HYBRID:
                if is_scanned:
                    # Si scanné, on tente Tesseract d'abord, sinon GPT Vision
                    if self._check_tesseract():
                        actual_provider = OCRProvider.TESSERACT
                        text, page_count = self.extract_text_with_tesseract(file_bytes, file_ext)
                    else:
                        actual_provider = OCRProvider.GPT_VISION
                        text, page_count = await self.extract_text_with_gpt_vision(file_bytes, file_ext)
                else:
                    # PDF natif - on garde Tesseract comme nom de provider par convention ici 
                    # mais on utilise l'extraction native
                    actual_provider = OCRProvider.TESSERACT
                    text, page_count = self.extract_text_from_pdf_native(file_bytes)
            elif provider == OCRProvider.TESSERACT:
                if is_scanned:
                    text, page_count = self.extract_text_with_tesseract(file_bytes, file_ext)
                else:
                    text, page_count = self.extract_text_from_pdf_native(file_bytes)
            elif provider == OCRProvider.GPT_VISION:
                text, page_count = await self.extract_text_with_gpt_vision(file_bytes, file_ext)
        elif file_ext == ".docx":
            actual_provider = OCRProvider.HYBRID # Convention
            text = self.extract_text_from_docx(file_bytes)
            page_count = 1 # Approximation simple
            is_scanned = False
        else:
            # Image
            is_scanned = True
            if provider == OCRProvider.GPT_VISION:
                text, page_count = await self.extract_text_with_gpt_vision(file_bytes, file_ext)
            elif provider == OCRProvider.HYBRID:
                if self._check_tesseract():
                    actual_provider = OCRProvider.TESSERACT
                    text, page_count = self.extract_text_with_tesseract(file_bytes, file_ext)
                else:
                    actual_provider = OCRProvider.GPT_VISION
                    text, page_count = await self.extract_text_with_gpt_vision(file_bytes, file_ext)
            else:
                text, page_count = self.extract_text_with_tesseract(file_bytes, file_ext)
        
        # Détection de langue
        language = self.detect_language(text)
        
        # Calcul de confiance (basique)
        confidence = min(1.0, len(text.strip()) / 1000.0)  # Simple heuristique
        
        return OCRResult(
            text=text,
            confidence=confidence,
            language=language,
            provider=actual_provider,
            page_count=page_count,
            is_scanned=is_scanned,
            metadata={
                "filename": filename,
                "file_extension": file_ext,
                "text_length": len(text),
            }
        )


ocr_service = OCRService()
