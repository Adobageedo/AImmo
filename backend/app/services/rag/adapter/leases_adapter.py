"""
Leases Adapter - RAG depuis Qdrant (MOCK pour l'instant)
"""

from typing import List, Dict, Any, Optional
from .base_adapter import BaseSourceAdapter
from app.schemas.chat_sdk import SourceType


class LeasesAdapter(BaseSourceAdapter):
    """Adapter for LEASES source - Uses Qdrant RAG (MOCK for now)"""
    
    def __init__(self):
        super().__init__(SourceType.LEASES)
    
    async def fetch_data(
        self,
        organization_id: str,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10,
        supabase = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch leases from Qdrant (MOCK)
        TODO: Implement real Qdrant search when ready
        """
        
        # MOCK DATA - Simule des résultats Qdrant pour les baux
        mock_leases = [
            {
                "id": "lease-001",
                "title": "Bail commercial - Boutique Marseille",
                "content": "Bail commercial signé le 1er mars 2023 pour une durée de 9 ans. Loyer mensuel: 2,800€. Charges provisionnelles: 450€. Surface: 85m². Activité: vente de vêtements. Clause résolutoire en cas de non-paiement des loyers.",
                "metadata": {
                    "lease_id": "lease-001",
                    "property_id": "prop-001",
                    "tenant_name": "Boutique Mode SAS",
                    "start_date": "2023-03-01",
                    "end_date": "2032-03-01",
                    "monthly_rent": 2800,
                    "lease_type": "commercial"
                }
            },
            {
                "id": "lease-002",
                "title": "Bail d'habitation - Studio Bordeaux",
                "content": "Bail d'habitation de type 6 mois meublé. Loyer: 650€ par mois. Charges: 80€. Surface: 28m². Date d'entrée: 1er septembre 2023. Diagnostics: DPE classe E, électricité conforme.",
                "metadata": {
                    "lease_id": "lease-002",
                    "property_id": "prop-002",
                    "tenant_name": "Martin Dubois",
                    "start_date": "2023-09-01",
                    "end_date": "2024-03-01",
                    "monthly_rent": 650,
                    "lease_type": "residential"
                }
            }
        ]
        
        # Filtrer par query
        query_lower = query.lower()
        results = []
        
        for lease in mock_leases:
            if any(keyword in query_lower for keyword in ["bail", "loyer", "location", "commercial", "habitation"]):
                results.append(lease)
        
        # Filtrer par lease_ids si fourni
        if filters and filters.get("lease_ids"):
            results = [r for r in results if r["id"] in filters["lease_ids"]]
        
        return results[:limit]
    
    def format_for_llm(self, data: Dict[str, Any]) -> str:
        """Format lease for LLM"""
        metadata = data['metadata']
        formatted = f"""# Bail: {data['title']}

**Type de bail**: {metadata.get('lease_type', 'N/A')}
**Locataire**: {metadata.get('tenant_name', 'N/A')}
**Loyer mensuel**: {metadata.get('monthly_rent', 0)}€
**Dates**: Du {metadata.get('start_date', 'N/A')} au {metadata.get('end_date', 'N/A')}
**Score de pertinence**: {data['score']:.0%}

## Détails du bail
{data['content']}
"""
        return self.truncate_to_token_limit(formatted)
