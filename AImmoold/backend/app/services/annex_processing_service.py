"""
Annex Processing Service
Service pour traiter et extraire les informations des annexes de baux
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import re

from app.services.llm_service import llm_service

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AnnexType:
    """Types d'annexes reconnus"""
    INVENTORY = "inventory"  # État des lieux
    TECHNICAL = "technical"  # Notice technique
    SCHEDULE = "schedule"  # Calendrier/échéancier
    INSURANCE = "insurance"  # Assurance
    GUARANTOR = "guarantor"  # Caution
    ENERGY = "energy"  # DPE/GES
    FINANCIAL = "financial"  # Documents financiers
    LEGAL = "legal"  # Documents légaux
    OTHER = "other"

class AnnexInfo:
    """Information extraite d'une annexe"""
    def __init__(self, annex_id: str, annex_type: str):
        self.annex_id = annex_id
        self.annex_type = annex_type
        self.extracted_data: Dict[str, Any] = {}
        self.linked_fields: List[str] = []
        self.confidence: float = 0.0
        self.summary: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "annex_id": self.annex_id,
            "annex_type": self.annex_type,
            "extracted_data": self.extracted_data,
            "linked_fields": self.linked_fields,
            "confidence": self.confidence,
            "summary": self.summary
        }

class AnnexProcessingService:
    """Service pour traiter les annexes de baux"""
    
    def __init__(self):
        self.llm = llm_service
    
    def detect_annex_type(self, text: str, filename: str = "") -> str:
        """
        Détecte le type d'annexe basé sur le contenu et le nom de fichier
        """
        logger.info(f"🔍 [ANNEX] Detecting annex type for file: {filename}")
        
        text_lower = text.lower()
        filename_lower = filename.lower()
        
        # Patterns pour chaque type
        patterns = {
            AnnexType.INVENTORY: [
                r"état des lieux",
                r"inventaire",
                r"constat d'entrée",
                r"constat de sortie",
                r"edl"
            ],
            AnnexType.TECHNICAL: [
                r"notice technique",
                r"manuel",
                r"mode d'emploi",
                r"instructions",
                r"équipements"
            ],
            AnnexType.ENERGY: [
                r"dpe",
                r"diagnostic.*performance.*énergétique",
                r"classe énergétique",
                r"ges",
                r"gaz.*effet.*serre"
            ],
            AnnexType.INSURANCE: [
                r"assurance",
                r"attestation.*assurance",
                r"police.*assurance",
                r"garantie.*risques.*locatifs"
            ],
            AnnexType.GUARANTOR: [
                r"caution",
                r"garant",
                r"acte de cautionnement",
                r"solidaire"
            ],
            AnnexType.SCHEDULE: [
                r"échéancier",
                r"calendrier",
                r"planning",
                r"dates.*paiement"
            ],
            AnnexType.FINANCIAL: [
                r"quittance",
                r"reçu",
                r"facture",
                r"relevé",
                r"avis.*imposition"
            ],
            AnnexType.LEGAL: [
                r"règlement.*copropriété",
                r"acte.*propriété",
                r"titre.*propriété",
                r"statuts"
            ]
        }
        
        # Vérifier les patterns
        scores = {}
        for annex_type, type_patterns in patterns.items():
            score = 0
            for pattern in type_patterns:
                if re.search(pattern, text_lower):
                    score += 2
                    logger.info(f"🔍 [ANNEX] Pattern '{pattern}' found in text for type {annex_type}")
                if re.search(pattern, filename_lower):
                    score += 1
                    logger.info(f"🔍 [ANNEX] Pattern '{pattern}' found in filename for type {annex_type}")
            if score > 0:
                scores[annex_type] = score
        
        if scores:
            detected_type = max(scores, key=scores.get)
            logger.info(f"✅ [ANNEX] Detected type: {detected_type} (score: {scores[detected_type]})")
            return detected_type
        
        logger.info(f"⚠️ [ANNEX] No specific type detected, using 'other'")
        return AnnexType.OTHER
    
    async def extract_inventory_data(self, text: str) -> Dict[str, Any]:
        """
        Extrait les données d'un état des lieux
        """
        logger.info(f"🔍 [ANNEX] Extracting inventory data")
        
        prompt = f"""Analyse cet état des lieux et extrais les informations structurées.

TEXTE:
{text[:5000]}

Extrais au format JSON:
{{
    "date": "YYYY-MM-DD",
    "type": "entry" ou "exit",
    "rooms": [
        {{
            "name": "nom de la pièce",
            "condition": "état général",
            "items": ["liste des éléments notés"]
        }}
    ],
    "meter_readings": {{
        "electricity": nombre,
        "water": nombre,
        "gas": nombre
    }},
    "keys_count": nombre,
    "observations": ["liste des observations importantes"]
}}

JSON:"""
        
        try:
            data = await self.llm.get_json_completion(
                prompt=prompt,
                system_prompt="Tu es un expert en analyse d'états des lieux. Renvoie uniquement du JSON valide."
            )
            logger.info(f"✅ [ANNEX] Inventory data extracted: {len(data.get('rooms', []))} rooms")
            return data
        except Exception as e:
            logger.error(f"❌ [ANNEX] Error extracting inventory data: {e}")
            return {}
    
    async def extract_energy_data(self, text: str) -> Dict[str, Any]:
        """
        Extrait les données d'un DPE
        """
        logger.info(f"🔍 [ANNEX] Extracting energy diagnostic data")
        
        prompt = f"""Analyse ce diagnostic de performance énergétique et extrais les informations.

TEXTE:
{text[:5000]}

Extrais au format JSON:
{{
    "energy_class": "A-G",
    "ges_class": "A-G",
    "energy_consumption": nombre en kWh/m²/an,
    "ges_emissions": nombre en kg CO2/m²/an,
    "diagnostic_date": "YYYY-MM-DD",
    "validity_date": "YYYY-MM-DD",
    "recommendations": ["liste des recommandations"]
}}

JSON:"""
        
        try:
            data = await self.llm.get_json_completion(
                prompt=prompt,
                system_prompt="Tu es un expert en diagnostics énergétiques. Renvoie uniquement du JSON valide."
            )
            logger.info(f"✅ [ANNEX] Energy data extracted: Class {data.get('energy_class')}")
            return data
        except Exception as e:
            logger.error(f"❌ [ANNEX] Error extracting energy data: {e}")
            return {}
    
    async def extract_financial_data(self, text: str) -> Dict[str, Any]:
        """
        Extrait les données financières
        """
        logger.info(f"🔍 [ANNEX] Extracting financial data")
        
        prompt = f"""Analyse ce document financier et extrais les informations.

TEXTE:
{text[:5000]}

Extrais au format JSON:
{{
    "document_type": "quittance/facture/reçu/autre",
    "date": "YYYY-MM-DD",
    "period": "période concernée",
    "rent_amount": montant du loyer,
    "charges_amount": montant des charges,
    "total_amount": montant total,
    "payment_method": "mode de paiement",
    "items": [
        {{
            "description": "description",
            "amount": montant
        }}
    ]
}}

JSON:"""
        
        try:
            data = await self.llm.get_json_completion(
                prompt=prompt,
                system_prompt="Tu es un expert en documents financiers. Renvoie uniquement du JSON valide."
            )
            logger.info(f"✅ [ANNEX] Financial data extracted: {data.get('document_type')}")
            return data
        except Exception as e:
            logger.error(f"❌ [ANNEX] Error extracting financial data: {e}")
            return {}
    
    async def extract_generic_data(self, text: str, annex_type: str) -> Dict[str, Any]:
        """
        Extraction générique pour les autres types d'annexes
        """
        logger.info(f"🔍 [ANNEX] Extracting generic data for type: {annex_type}")
        
        prompt = f"""Analyse ce document de type '{annex_type}' et extrais les informations pertinentes.

TEXTE:
{text[:5000]}

Extrais les informations importantes au format JSON avec des clés descriptives.

JSON:"""
        
        try:
            data = await self.llm.get_json_completion(
                prompt=prompt,
                system_prompt="Tu es un expert en analyse de documents. Renvoie uniquement du JSON valide."
            )
            logger.info(f"✅ [ANNEX] Generic data extracted: {len(data)} fields")
            return data
        except Exception as e:
            logger.error(f"❌ [ANNEX] Error extracting generic data: {e}")
            return {}
    
    async def process_annex(self, annex_id: str, text: str, filename: str = "") -> AnnexInfo:
        """
        Traite une annexe complète
        """
        logger.info(f"🚀 [ANNEX] Processing annex: {annex_id}")
        logger.info(f"🔍 [ANNEX] Text length: {len(text)}, Filename: {filename}")
        
        # Détecter le type
        annex_type = self.detect_annex_type(text, filename)
        
        # Créer l'objet résultat
        annex_info = AnnexInfo(annex_id, annex_type)
        
        # Extraire les données selon le type
        if annex_type == AnnexType.INVENTORY:
            extracted_data = await self.extract_inventory_data(text)
            annex_info.linked_fields = ["inventory", "meter_readings", "keys"]
        
        elif annex_type == AnnexType.ENERGY:
            extracted_data = await self.extract_energy_data(text)
            annex_info.linked_fields = ["energy_class", "ges_class", "energy_consumption"]
        
        elif annex_type == AnnexType.FINANCIAL:
            extracted_data = await self.extract_financial_data(text)
            annex_info.linked_fields = ["monthly_rent", "charges", "payment_history"]
        
        else:
            extracted_data = await self.extract_generic_data(text, annex_type)
            annex_info.linked_fields = list(extracted_data.keys())
        
        annex_info.extracted_data = extracted_data
        
        # Calculer la confiance basée sur le nombre de champs extraits
        if extracted_data:
            annex_info.confidence = min(1.0, len(extracted_data) / 5)
        
        # Générer un résumé
        annex_info.summary = f"Annexe de type {annex_type} avec {len(extracted_data)} champs extraits"
        
        logger.info(f"✅ [ANNEX] Annex processed: {annex_info.summary}")
        logger.info(f"✅ [ANNEX] Extracted data: {extracted_data}")
        
        return annex_info
    
    async def process_multiple_annexes(self, annexes: List[Dict[str, Any]]) -> List[AnnexInfo]:
        """
        Traite plusieurs annexes
        """
        logger.info(f"🚀 [ANNEX] Processing {len(annexes)} annexes")
        
        results = []
        for i, annex in enumerate(annexes):
            annex_id = annex.get("id", f"annex_{i}")
            text = annex.get("text", "")
            filename = annex.get("filename", "")
            
            if not text:
                logger.warning(f"⚠️ [ANNEX] Annex {annex_id} has no text, skipping")
                continue
            
            try:
                annex_info = await self.process_annex(annex_id, text, filename)
                results.append(annex_info)
            except Exception as e:
                logger.error(f"❌ [ANNEX] Error processing annex {annex_id}: {e}")
                continue
        
        logger.info(f"✅ [ANNEX] Processed {len(results)}/{len(annexes)} annexes successfully")
        return results

# Instance globale
annex_processing_service = AnnexProcessingService()
