"""
Properties Adapter - Fetch depuis Supabase avec fiches complètes
"""

from typing import List, Dict, Any, Optional
from .base_adapter import BaseSourceAdapter
from app.schemas.chat_sdk import SourceType


class PropertiesAdapter(BaseSourceAdapter):
    """Adapter for PROPERTIES source - Fetches from Supabase"""
    
    def __init__(self):
        super().__init__(SourceType.PROPERTIES)
    
    async def fetch_data(
        self,
        organization_id: str,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10,
        supabase = None,
    ) -> List[Dict[str, Any]]:
        """Fetch properties from Supabase with all related data"""
        if not supabase:
            return []
        
        try:
            # Construire la requête de base
            query_builder = supabase.table("properties").select("""
                *,
                leases (
                    id,
                    start_date,
                    end_date,
                    monthly_rent,
                    charges,
                    deposit,
                    indexation_rate,
                    tenant:tenants (
                        id,
                        name,
                        tenant_type,
                        email,
                        phone
                    )
                ),
                documents (
                    id,
                    title,
                    file_type,
                    tags,
                    created_at
                )
            """).eq("organization_id", organization_id)
            
            # Filtrer par property_ids si fourni
            if filters and filters.get("property_ids"):
                query_builder = query_builder.in_("id", filters["property_ids"])
            
            # Limiter les résultats
            response = query_builder.limit(limit).execute()
            
            if not response.data:
                return []
            
            return response.data
            
        except Exception as e:
            print(f"Error fetching properties: {e}")
            return []
    
    def format_for_llm(self, data: Dict[str, Any]) -> str:
        """Format property as comprehensive card for LLM"""
        
        # Informations de base
        formatted = f"""# 🏢 FICHE BIEN IMMOBILIER

## Identification
- **ID**: {data.get('id', 'N/A')}
- **Nom**: {data.get('name', 'N/A')}
- **Type**: {data.get('property_type', 'N/A')}

## Localisation
- **Adresse**: {data.get('address', 'N/A')}
- **Ville**: {data.get('city', 'N/A')}
- **Code postal**: {data.get('postal_code', 'N/A')}
- **Pays**: {data.get('country', 'N/A')}

## Caractéristiques
- **Surface**: {data.get('surface_area', 'N/A')} m²
- **Valeur estimée**: {data.get('estimated_value', 'N/A')}€
- **Nombre de pièces**: {data.get('rooms', 'N/A')}
- **Étage**: {data.get('floor', 'N/A')}
- **Ascenseur**: {'Oui' if data.get('has_elevator') else 'Non'}
- **Parking**: {'Oui' if data.get('has_parking') else 'Non'}
- **Balcon/Terrasse**: {'Oui' if data.get('has_balcony') else 'Non'}

## État et Équipements
- **État général**: {data.get('condition', 'N/A')}
- **Année de construction**: {data.get('construction_year', 'N/A')}
- **Dernière rénovation**: {data.get('last_renovation', 'N/A')}
- **Chauffage**: {data.get('heating_type', 'N/A')}
- **DPE**: {data.get('energy_class', 'N/A')}
- **GES**: {data.get('ges_class', 'N/A')}

"""
        
        # Baux actifs
        leases = data.get('leases', [])
        if leases:
            formatted += "## 📋 Baux Actifs\n\n"
            for i, lease in enumerate(leases, 1):
                tenant = lease.get('tenant', {})
                formatted += f"""### Bail {i}
- **Locataire**: {tenant.get('name', 'N/A')} ({tenant.get('tenant_type', 'N/A')})
- **Contact**: {tenant.get('email', 'N/A')} / {tenant.get('phone', 'N/A')}
- **Période**: Du {lease.get('start_date', 'N/A')} au {lease.get('end_date', 'En cours')}
- **Loyer mensuel**: {lease.get('monthly_rent', 0)}€
- **Charges**: {lease.get('charges', 0)}€
- **Dépôt de garantie**: {lease.get('deposit', 0)}€
- **Taux d'indexation**: {lease.get('indexation_rate', 0)}%

"""
        else:
            formatted += "## 📋 Baux\n**Aucun bail actif**\n\n"
        
        # Documents associés
        documents = data.get('documents', [])
        if documents:
            formatted += f"## 📄 Documents Associés ({len(documents)})\n\n"
            for doc in documents[:5]:  # Limiter à 5 documents
                tags = ", ".join(doc.get('tags', []))
                formatted += f"- **{doc.get('title', 'Sans titre')}** ({doc.get('file_type', 'N/A')})"
                if tags:
                    formatted += f" - Tags: {tags}"
                formatted += "\n"
            
            if len(documents) > 5:
                formatted += f"\n... et {len(documents) - 5} autres documents\n"
            formatted += "\n"
        
        # Informations financières calculées
        if leases:
            total_rent = sum(lease.get('monthly_rent', 0) for lease in leases)
            total_charges = sum(lease.get('charges', 0) for lease in leases)
            formatted += f"""## 💰 Synthèse Financière
- **Revenus locatifs mensuels**: {total_rent}€
- **Charges mensuelles**: {total_charges}€
- **Revenus nets mensuels**: {total_rent - total_charges}€
- **Revenus annuels estimés**: {(total_rent - total_charges) * 12}€
"""
            
            if data.get('estimated_value'):
                yield_rate = ((total_rent - total_charges) * 12 / data['estimated_value']) * 100
                formatted += f"- **Rendement brut estimé**: {yield_rate:.2f}%\n"
        
        formatted += f"""
## 📅 Dates
- **Créé le**: {data.get('created_at', 'N/A')}
- **Mis à jour le**: {data.get('updated_at', 'N/A')}
"""
        
        return self.truncate_to_token_limit(formatted)
