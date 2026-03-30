"""
OpenAI service for lease document parsing
"""
import os
import json
import logging
from typing import Dict, Any, Optional
from openai import OpenAI

logger = logging.getLogger(__name__)

class OpenAIService:
    """Service for parsing lease documents using OpenAI"""
    
    def __init__(self, api_key: str):
        """Initialize OpenAI client"""
        try:
            self.client = OpenAI(api_key=api_key)
        except TypeError as e:
            # Fallback for older OpenAI versions that might have different parameters
            if 'proxies' in str(e):
                # Try without any additional parameters
                self.client = OpenAI(api_key=api_key)
            else:
                raise
    
    def parse_lease_document(self, text: str) -> Dict[str, Any]:
        """Parse lease document text using OpenAI GPT-4"""
        
        if not text or len(text.strip()) == 0:
            logger.warning("No text provided for parsing")
            return self._get_scanned_document_response()
        
        prompt = f"""
Analyse ce document de bail immobilier français et extrait TOUTES les informations suivantes au format JSON.
Si une information n'est pas trouvée, utilise null.

Format JSON attendu:
{{
  "landlord_name": "Nom complet du propriétaire/bailleur",
  "landlord_address": "Adresse complète du propriétaire",
  "landlord_email": "Email du propriétaire",
  "landlord_phone": "Téléphone du propriétaire",
  "tenant_name": "Nom complet du locataire/preneur",
  "tenant_company_name": "Nom de l'entreprise si locataire professionnel",
  "tenant_address": "Adresse actuelle du locataire",
  "tenant_email": "Email du locataire",
  "tenant_phone": "Téléphone du locataire",
  "property_address": "Adresse complète du bien loué",
  "property_city": "Ville du bien",
  "property_postal_code": "Code postal du bien",
  "property_type": "Type de bien (appartement, maison, local commercial, etc.)",
  "property_surface": 50.5,
  "lease_type": "residential|commercial|furnished|unfurnished|seasonal",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "duration_months": 12,
  "monthly_rent": 1200.00,
  "charges": 150.00,
  "deposit": 2400.00,
  "payment_day": 5,
  "indexation_clause": true,
  "special_clauses": ["clause 1", "clause 2"]
}}

Document à analyser:
---
{text[:8000]}
---

Réponds UNIQUEMENT avec le JSON, sans texte additionnel.
"""

        try:
            logger.info("Parsing document with OpenAI gpt-4o-mini")
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        'role': 'system',
                        'content': 'Tu es un expert en analyse de contrats de bail immobilier français. Tu extrais les informations de manière précise et structurée au format JSON. Réponds UNIQUEMENT avec le JSON valide, sans texte additionnel.'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                temperature=0.1,
                max_tokens=16384
            )

            content = response.choices[0].message.content
            if not content:
                raise ValueError("No response from OpenAI")

            # Parse JSON response
            try:
                result = json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse OpenAI JSON response: {e}")
                logger.error(f"Raw response: {content}")
                return self._get_scanned_document_response()
            
            # Validate required fields
            if not isinstance(result, dict):
                logger.error("OpenAI response is not a dictionary")
                return self._get_scanned_document_response()
            
            # Calculate confidence score
            confidence_score = self._calculate_confidence_score(result)
            result['confidence_score'] = confidence_score
            result['extraction_method'] = 'openai_gpt4o_mini'
            result['raw_text'] = text
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {e}")
            return self._get_scanned_document_response()
        except ValueError as e:
            logger.error(f"Value error in OpenAI parsing: {e}")
            return self._get_scanned_document_response()
        except Exception as e:
            logger.error(f"Unexpected error parsing document with OpenAI: {e}")
            # Return fallback response for scanned documents
            return self._get_scanned_document_response()
    
    def _calculate_confidence_score(self, result: Dict[str, Any]) -> float:
        """Calculate confidence score based on extracted fields"""
        
        critical_fields = ['landlord_name', 'tenant_name', 'property_address', 'start_date', 'monthly_rent']
        important_fields = ['end_date', 'deposit', 'property_city', 'property_postal_code']
        optional_fields = ['charges', 'landlord_email', 'tenant_email', 'property_surface']

        score = 0.0
        
        # Critical fields (50% weight)
        critical_present = sum(1 for field in critical_fields 
                             if result.get(field) and str(result.get(field)).strip())
        score += (critical_present / len(critical_fields)) * 0.5

        # Important fields (30% weight)
        important_present = sum(1 for field in important_fields 
                              if result.get(field) and str(result.get(field)).strip())
        score += (important_present / len(important_fields)) * 0.3

        # Optional fields (20% weight)
        optional_present = sum(1 for field in optional_fields 
                             if result.get(field) and str(result.get(field)).strip())
        score += (optional_present / len(optional_fields)) * 0.2

        return round(score, 2)
    
    def _get_scanned_document_response(self) -> Dict[str, Any]:
        """Return response for scanned/image-based documents"""
        return {
            "landlord_name": "Document scanné",
            "landlord_address": "Extraction automatique impossible",
            "landlord_email": None,
            "landlord_phone": None,
            "tenant_name": "Document scanné",
            "tenant_company_name": None,
            "tenant_address": "Extraction automatique impossible",
            "tenant_email": None,
            "tenant_phone": None,
            "property_address": "Document scanné",
            "property_city": None,
            "property_postal_code": None,
            "property_type": "inconnu",
            "property_surface": None,
            "lease_type": "inconnu",
            "start_date": None,
            "end_date": None,
            "duration_months": None,
            "monthly_rent": None,
            "charges": None,
            "deposit": None,
            "payment_day": None,
            "indexation_clause": None,
            "special_clauses": None,
            "confidence_score": 0.0,
            "extraction_method": "scanned_document",
            "raw_text": "Document scanné - extraction de texte impossible"
        }
