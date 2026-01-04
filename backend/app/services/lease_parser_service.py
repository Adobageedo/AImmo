import json
import os
from typing import Optional, Dict, Any
from datetime import datetime
from openai import OpenAI
import logging
from sqlalchemy.orm import Session

logger = logging.getLogger("app")

from app.schemas.ocr import ParsedLease, ParsedParty
# from app.services.entity_matching_service import get_entity_matching_service


class LeaseParserService:
    def __init__(self):
        from app.services.llm_service import llm_service
        self.llm = llm_service
    
    def build_extraction_prompt(self, text: str) -> str:
        """Construit le prompt d'extraction structuré"""
        return f"""Tu es un assistant expert en extraction de données de contrats de bail immobilier.

Analyse le texte suivant et extrais les informations structurées au format JSON.

TEXTE DU BAIL:
{text}

INSTRUCTIONS:
1. Extrais toutes les informations disponibles
2. Si une information n'est pas trouvée, utilise null
3. Pour les montants, utilise uniquement le nombre (pas de symbole €)
4. Pour les dates, utilise le format YYYY-MM-DD
5. Renvoie UNIQUEMENT le JSON, sans texte additionnel

FORMAT JSON ATTENDU:
{{
    "parties": [
        {{
            "type": "landlord",
            "name": "Nom du propriétaire/bailleur (ou raison sociale)",
            "address": "Adresse du bailleur",
            "email": "email@example.com"
        }},
        {{
            "type": "tenant",
            "name": "Nom du locataire",
            "address": "Adresse du locataire",
            "email": "email@example.com"
        }}
    ],
    "property_address": "Adresse complète du bien loué (sans ville ni CP)",
    "property_zip": "75001",
    "property_city": "Paris",
    "property_type": "appartement/maison/studio/autre",
    "surface_area": 50.5,
    "construction_year": 1990,
    "last_renovation_year": 2020,
    "energy_class": "C",
    "ges_class": "B",
    "purchase_price": 250000.00,
    "purchase_date": "2020-01-15",
    "current_value": 280000.00,
    "property_tax": 1200.00,
    "start_date": "2024-01-01",
    "end_date": "2025-01-01",
    "monthly_rent": 1200.00,
    "charges": 150.00,
    "deposit": 2400.00,
    "indexation_rate": 3.5,
    "key_clauses": [
        "Clause importante 1",
        "Clause importante 2"
    ]
}}

JSON:"""
    
    async def parse_lease_with_llm(self, text: str) -> ParsedLease:
        """Parse le bail avec un LLM (via LLMService)"""
        # Limiter la taille du texte pour éviter de dépasser le contexte LLM.
        # 100k+ caractères (votre doc actuel) est trop lourd pour une extraction JSON fiable.
        # On garde le début et la fin (où se trouvent généralement les infos clés).
        max_chars = 100000 
        if len(text) > max_chars:
            logger.info(f"DEBUG: Truncating text from {len(text)} to {max_chars} chars")
            text = text[:max_chars // 2] + "\n\n[...] (TRONQUÉ POUR L'ANALYSE) [...]\n\n" + text[-max_chars // 2:]
            
        prompt = self.build_extraction_prompt(text)
        system_prompt = "Tu es un expert en extraction de données de contrats de bail. Tu renvoies uniquement du JSON valide."
        
        try:
            data = await self.llm.get_json_completion(
                prompt=prompt,
                system_prompt=system_prompt
            )
            
            # Nettoyage des données
            raw_parties = data.get("parties", [])
            for p in raw_parties:
                if not p.get("name"):
                    p["name"] = "Inconnu"
            
            # Validation et conversion
            parties = [ParsedParty(**party) for party in raw_parties]
            
            # Conversion des dates
            start_date = None
            if data.get("start_date"):
                try:
                    start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
                except Exception:
                    pass
            
            end_date = None
            if data.get("end_date"):
                try:
                    end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
                except Exception:
                    pass
            
            purchase_date = None
            if data.get("purchase_date"):
                try:
                    purchase_date = datetime.strptime(data["purchase_date"], "%Y-%m-%d").date()
                except Exception:
                    pass
            
            # Calcul de confiance basé sur le nombre de champs remplis
            total_fields = 10
            filled_fields = sum([
                1 if parties else 0,
                1 if data.get("property_address") else 0,
                1 if data.get("property_type") else 0,
                1 if data.get("surface_area") else 0,
                1 if start_date else 0,
                1 if end_date else 0,
                1 if data.get("monthly_rent") else 0,
                1 if data.get("charges") else 0,
                1 if data.get("deposit") else 0,
                1 if data.get("key_clauses") else 0,
            ])
            confidence = filled_fields / total_fields
            
            return ParsedLease(
                parties=parties,
                property_address=data.get("property_address") or "Adresse non trouvée",
                property_zip=data.get("property_zip"),
                property_city=data.get("property_city"),
                property_type=data.get("property_type"),
                surface_area=data.get("surface_area"),
                construction_year=data.get("construction_year"),
                last_renovation_year=data.get("last_renovation_year"),
                energy_class=data.get("energy_class"),
                ges_class=data.get("ges_class"),
                purchase_price=data.get("purchase_price"),
                purchase_date=purchase_date,
                current_value=data.get("current_value"),
                property_tax=data.get("property_tax"),
                start_date=start_date,
                end_date=end_date,
                monthly_rent=data.get("monthly_rent"),
                charges=data.get("charges"),
                deposit=data.get("deposit"),
                indexation_rate=data.get("indexation_rate"),
                key_clauses=data.get("key_clauses", []),
                confidence=confidence,
                raw_data=data
            )
            
        except Exception as e:
            raise ValueError(f"Erreur lors du parsing LLM: {str(e)}")
    
    
    # async def parse_lease_with_entity_matching method removed - use lease_enrichment_service instead

    async def parse_lease(self, text: str, use_llm: bool = True) -> ParsedLease:
        """Parse un bail avec LLM (requis)"""
        if not self.llm.is_configured:
            raise ValueError(
                "OPENAI_API_KEY n'est pas configuré. "
                "Le parsing de bail nécessite une clé API OpenAI valide. "
                "Veuillez configurer OPENAI_API_KEY dans votre fichier .env"
            )
        
        logger.info("DEBUG: Using LLM-based lease parser")
        return await self.parse_lease_with_llm(text)


lease_parser_service = LeaseParserService()
