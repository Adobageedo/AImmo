"""
Tenants Adapter - Fetch depuis Supabase avec fiches complètes
"""

from typing import List, Dict, Any, Optional
from .base_adapter import BaseSourceAdapter
from app.schemas.chat_sdk import SourceType


class TenantsAdapter(BaseSourceAdapter):
    """Adapter for TENANTS source - Fetches from Supabase"""
    
    def __init__(self):
        super().__init__(SourceType.TENANTS)
    
    async def fetch_data(
        self,
        organization_id: str,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10,
        supabase = None,
    ) -> List[Dict[str, Any]]:
        """Fetch tenants from Supabase with all related data"""
        if not supabase:
            return []
        
        try:
            # Construire la requête de base
            query_builder = supabase.table("tenants").select("""
                *,
                leases (
                    id,
                    start_date,
                    end_date,
                    monthly_rent,
                    charges,
                    deposit,
                    indexation_rate,
                    property:properties (
                        id,
                        name,
                        address,
                        city,
                        postal_code,
                        property_type,
                        surface_area
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
            
            # Filtrer par tenant_ids si fourni
            if filters and filters.get("tenant_ids"):
                query_builder = query_builder.in_("id", filters["tenant_ids"])
            
            # Limiter les résultats
            response = query_builder.limit(limit).execute()
            
            if not response.data:
                return []
            
            return response.data
            
        except Exception as e:
            print(f"Error fetching tenants: {e}")
            return []
    
    def format_for_llm(self, data: Dict[str, Any]) -> str:
        """Format tenant as comprehensive card for LLM"""
        
        # Informations de base
        formatted = f"""# 👤 FICHE LOCATAIRE

## Identification
- **ID**: {data.get('id', 'N/A')}
- **Nom**: {data.get('name', 'N/A')}
- **Type**: {data.get('tenant_type', 'N/A')} ({'Particulier' if data.get('tenant_type') == 'individual' else 'Entreprise'})

## Contact
- **Email**: {data.get('email', 'N/A')}
- **Téléphone**: {data.get('phone', 'N/A')}

## Informations Complémentaires
- **Date de naissance**: {data.get('birth_date', 'N/A')}
- **Profession**: {data.get('profession', 'N/A')}
- **Revenus mensuels**: {data.get('monthly_income', 'N/A')}€
- **Situation familiale**: {data.get('family_status', 'N/A')}
- **Nombre de personnes**: {data.get('household_size', 'N/A')}

## Garant
- **Nom du garant**: {data.get('guarantor_name', 'N/A')}
- **Contact garant**: {data.get('guarantor_contact', 'N/A')}
- **Type de garantie**: {data.get('guarantee_type', 'N/A')}

"""
        
        # Baux actifs
        leases = data.get('leases', [])
        if leases:
            formatted += f"## 🏠 Locations Actuelles ({len(leases)})\n\n"
            
            total_rent = 0
            for i, lease in enumerate(leases, 1):
                property_data = lease.get('property', {})
                monthly_rent = lease.get('monthly_rent', 0)
                charges = lease.get('charges', 0)
                total_rent += monthly_rent + charges
                
                formatted += f"""### Location {i}
**Bien**: {property_data.get('name', 'N/A')}
- **Adresse**: {property_data.get('address', 'N/A')}, {property_data.get('postal_code', '')} {property_data.get('city', '')}
- **Type**: {property_data.get('property_type', 'N/A')}
- **Surface**: {property_data.get('surface_area', 'N/A')} m²

**Bail**:
- **Période**: Du {lease.get('start_date', 'N/A')} au {lease.get('end_date', 'En cours')}
- **Loyer mensuel**: {monthly_rent}€
- **Charges**: {charges}€
- **Total mensuel**: {monthly_rent + charges}€
- **Dépôt de garantie**: {lease.get('deposit', 0)}€
- **Taux d'indexation**: {lease.get('indexation_rate', 0)}%

"""
            
            formatted += f"""### 💰 Total des Charges Mensuelles
- **Total loyers + charges**: {total_rent}€
"""
        else:
            formatted += "## 🏠 Locations\n**Aucune location active**\n\n"
        
        # Historique de paiement (si disponible)
        if data.get('payment_history'):
            formatted += f"""## 💳 Historique de Paiement
- **Taux de paiement à temps**: {data.get('on_time_payment_rate', 'N/A')}%
- **Retards de paiement**: {data.get('late_payments_count', 0)}
- **Impayés actuels**: {data.get('current_unpaid', 0)}€
- **Dernier paiement**: {data.get('last_payment_date', 'N/A')}

"""
        
        # Documents associés
        documents = data.get('documents', [])
        if documents:
            formatted += f"## 📄 Documents du Dossier ({len(documents)})\n\n"
            for doc in documents[:5]:  # Limiter à 5 documents
                tags = ", ".join(doc.get('tags', []))
                formatted += f"- **{doc.get('title', 'Sans titre')}** ({doc.get('file_type', 'N/A')})"
                if tags:
                    formatted += f" - Tags: {tags}"
                formatted += "\n"
            
            if len(documents) > 5:
                formatted += f"\n... et {len(documents) - 5} autres documents\n"
            formatted += "\n"
        
        # Notes et observations
        if data.get('notes'):
            formatted += f"""## 📝 Notes
{data.get('notes')}

"""
        
        # Statut et alertes
        formatted += f"""## ⚠️ Statut
- **Statut du locataire**: {data.get('status', 'Actif')}
- **Score de fiabilité**: {data.get('reliability_score', 'N/A')}/10
- **Alertes actives**: {data.get('active_alerts', 0)}
"""
        
        formatted += f"""
## 📅 Dates
- **Entrée dans le parc**: {data.get('created_at', 'N/A')}
- **Dernière mise à jour**: {data.get('updated_at', 'N/A')}
"""
        
        return self.truncate_to_token_limit(formatted)
