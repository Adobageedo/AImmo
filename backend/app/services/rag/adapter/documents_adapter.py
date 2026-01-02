"""
Documents Adapter - RAG depuis Qdrant (MOCK pour l'instant)
"""

from typing import List, Dict, Any, Optional
from .base_adapter import BaseSourceAdapter
from app.schemas.chat_sdk import SourceType


class DocumentsAdapter(BaseSourceAdapter):
    """Adapter for DOCUMENTS source - Uses Qdrant RAG (MOCK for now)"""
    
    def __init__(self):
        super().__init__(SourceType.DOCUMENTS)
    
    async def fetch_data(
        self,
        organization_id: str,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10,
        supabase = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch documents from Qdrant (MOCK)
        TODO: Implement real Qdrant search when ready
        """
        
        # MOCK DATA - Simule des résultats Qdrant
        mock_documents = [
            {
                "id": "doc-001",
                "title": "Contrat de bail - Appartement Paris 15ème",
                "content": "Le bail de l'appartement situé 15 rue de la Paix, Paris 15ème, prévoit un loyer mensuel de 1,500€. La durée du bail est de 3 ans avec une clause de révision annuelle selon l'indice IRL. Le dépôt de garantie est fixé à 1 mois de loyer.",
                "metadata": {
                    "page_number": 1,
                    "document_type": "lease_contract",
                    "upload_date": "2024-01-15"
                }
            },
            {
                "id": "doc-002",
                "title": "État des lieux - Immeuble Lyon Centre",
                "content": "L'état des lieux d'entrée a été réalisé le 15 janvier 2024. Les murs sont en bon état, le parquet présente quelques rayures légères. La cuisine est équipée et fonctionnelle. Les radiateurs électriques sont en bon état de fonctionnement.",
                "metadata": {
                    "page_number": 2,
                    "document_type": "inventory",
                    "upload_date": "2024-01-16"
                }
            }
        ]
        
        # Filtrer par query (simulation simple)
        query_lower = query.lower()
        results = []
        
        for doc in mock_documents:
            if any(keyword in query_lower for keyword in ["bail", "loyer", "location", "contrat"]):
                if "bail" in doc["title"].lower() or "loyer" in doc["content"].lower():
                    results.append(doc)
            elif any(keyword in query_lower for keyword in ["état", "lieux", "inventaire"]):
                if "état" in doc["title"].lower():
                    results.append(doc)
            else:
                results.append(doc)
        
        return results[:limit]
    
    def format_for_llm(self, data: Dict[str, Any]) -> str:
        """Format document for LLM"""
        formatted = f"""# Document: {data['title']}

**Type**: {data['metadata'].get('document_type', 'N/A')}
**Page**: {data['metadata'].get('page_number', 'N/A')}

## Contenu
{data['content']}
"""
        return self.truncate_to_token_limit(formatted)
