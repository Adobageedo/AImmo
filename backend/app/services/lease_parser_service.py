import json
import os
from typing import Optional
from datetime import datetime
from openai import OpenAI

from app.schemas.ocr import ParsedLease, ParsedParty


class LeaseParserService:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.openai_api_key) if self.openai_api_key else None
    
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
            "name": "Nom du propriétaire/bailleur",
            "address": "Adresse du bailleur",
            "email": "email@example.com",
            "phone": "0123456789"
        }},
        {{
            "type": "tenant",
            "name": "Nom du locataire",
            "address": "Adresse du locataire",
            "email": "email@example.com",
            "phone": "0123456789"
        }}
    ],
    "property_address": "Adresse complète du bien loué",
    "property_type": "appartement/maison/studio/autre",
    "surface_area": 50.5,
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
        """Parse le bail avec un LLM (GPT-4)"""
        if not self.client:
            raise ValueError("OpenAI API key non configurée. Définir OPENAI_API_KEY dans .env")
        
        prompt = self.build_extraction_prompt(text)
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {
                        "role": "system",
                        "content": "Tu es un expert en extraction de données de contrats de bail. Tu renvoies uniquement du JSON valide."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            result_text = response.choices[0].message.content
            data = json.loads(result_text)
            
            # Validation et conversion
            parties = [ParsedParty(**party) for party in data.get("parties", [])]
            
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
                property_address=data.get("property_address", ""),
                property_type=data.get("property_type"),
                surface_area=data.get("surface_area"),
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
    
    def parse_lease_with_rules(self, text: str) -> ParsedLease:
        """
        Parsing basé sur des règles (fallback si pas d'API OpenAI)
        Version simple avec regex
        """
        import re
        
        # Extraction basique avec regex
        parties = []
        property_address = ""
        monthly_rent = None
        
        # Chercher "loyer" ou "rent"
        rent_match = re.search(r'loyer.*?(\d+(?:[.,]\d+)?)\s*€?', text, re.IGNORECASE)
        if rent_match:
            monthly_rent = float(rent_match.group(1).replace(',', '.'))
        
        # Chercher une adresse
        address_match = re.search(r'(\d+.*?(?:rue|avenue|boulevard|place).*?\d{5})', text, re.IGNORECASE)
        if address_match:
            property_address = address_match.group(1)
        
        return ParsedLease(
            parties=parties,
            property_address=property_address or "Adresse non trouvée",
            monthly_rent=monthly_rent,
            confidence=0.3,  # Faible confiance pour parsing par règles
            raw_data={"method": "regex", "text_length": len(text)}
        )
    
    async def parse_lease(self, text: str, use_llm: bool = True) -> ParsedLease:
        """Parse un bail avec LLM ou règles"""
        if use_llm and self.client:
            return await self.parse_lease_with_llm(text)
        else:
            return self.parse_lease_with_rules(text)


lease_parser_service = LeaseParserService()
