"""
Owners Adapter - Fetch depuis Supabase avec fiches complètes
"""

from typing import List, Dict, Any, Optional
from .base_adapter import BaseSourceAdapter
from app.schemas.chat_sdk import SourceType


class OwnersAdapter(BaseSourceAdapter):
    """Adapter for OWNERS source - Fetches from Supabase"""
    
    def __init__(self):
        super().__init__(SourceType.OWNERS)
    
    async def fetch_data(
        self,
        organization_id: str,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10,
        supabase = None,
    ) -> List[Dict[str, Any]]:
        """Fetch owners from Supabase with all related data"""
        if not supabase:
            return []
        
        try:
            # Construire la requête de base
            query_builder = supabase.table("owners").select("""
                *,
                properties (
                    id,
                    name,
                    address,
                    city,
                    postal_code,
                    property_type,
                    surface_area,
                    estimated_value,
                    leases (
                        id,
                        start_date,
                        end_date,
                        monthly_rent,
                        charges,
                        tenant:tenants (
                            name,
                            tenant_type
                        )
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
            
            # Filtrer par owner_ids si fourni
            if filters and filters.get("owner_ids"):
                query_builder = query_builder.in_("id", filters["owner_ids"])
            
            # Limiter les résultats
            response = query_builder.limit(limit).execute()
            
            if not response.data:
                return []
            
            return response.data
            
        except Exception as e:
            print(f"Error fetching owners: {e}")
            return []
    
    def format_for_llm(self, data: Dict[str, Any]) -> str:
        """Format owner as comprehensive card for LLM"""
        
        # Informations de base
        formatted = f"""# 🏛️ FICHE PROPRIÉTAIRE

## Identification
- **ID**: {data.get('id', 'N/A')}
- **Nom**: {data.get('name', 'N/A')}
- **Type**: {data.get('owner_type', 'N/A')} ({'Particulier' if data.get('owner_type') == 'individual' else 'Société'})

## Contact
- **Email**: {data.get('email', 'N/A')}
- **Téléphone**: {data.get('phone', 'N/A')}
- **Adresse**: {data.get('address', 'N/A')}
- **Ville**: {data.get('city', 'N/A')} {data.get('postal_code', '')}
- **Pays**: {data.get('country', 'N/A')}

## Informations Juridiques
- **SIRET**: {data.get('siret', 'N/A')}
- **Forme juridique**: {data.get('legal_form', 'N/A')}
- **Représentant légal**: {data.get('legal_representative', 'N/A')}

## Informations Bancaires
- **IBAN**: {data.get('iban', 'N/A')}
- **BIC**: {data.get('bic', 'N/A')}
- **Banque**: {data.get('bank_name', 'N/A')}

"""
        
        # Portefeuille de biens
        properties = data.get('properties', [])
        if properties:
            formatted += f"## 🏢 Portefeuille Immobilier ({len(properties)} biens)\n\n"
            
            total_value = 0
            total_monthly_rent = 0
            occupied_count = 0
            
            for i, prop in enumerate(properties, 1):
                prop_value = prop.get('estimated_value', 0) or 0
                total_value += prop_value
                
                leases = prop.get('leases', [])
                is_occupied = len(leases) > 0
                if is_occupied:
                    occupied_count += 1
                
                monthly_rent = sum(lease.get('monthly_rent', 0) for lease in leases)
                total_monthly_rent += monthly_rent
                
                formatted += f"""### Bien {i}: {prop.get('name', 'N/A')}
- **Type**: {prop.get('property_type', 'N/A')}
- **Adresse**: {prop.get('address', 'N/A')}, {prop.get('postal_code', '')} {prop.get('city', '')}
- **Surface**: {prop.get('surface_area', 'N/A')} m²
- **Valeur estimée**: {prop_value:,.0f}€
- **Statut**: {'Occupé' if is_occupied else 'Vacant'}
"""
                
                if leases:
                    formatted += f"- **Revenus locatifs**: {monthly_rent}€/mois\n"
                    for lease in leases:
                        tenant = lease.get('tenant', {})
                        formatted += f"  - Locataire: {tenant.get('name', 'N/A')} (Bail: {lease.get('start_date', 'N/A')} → {lease.get('end_date', 'En cours')})\n"
                
                formatted += "\n"
            
            # Synthèse du portefeuille
            occupancy_rate = (occupied_count / len(properties) * 100) if properties else 0
            annual_rent = total_monthly_rent * 12
            yield_rate = (annual_rent / total_value * 100) if total_value > 0 else 0
            
            formatted += f"""### 📊 Synthèse du Portefeuille
- **Nombre de biens**: {len(properties)}
- **Valeur totale estimée**: {total_value:,.0f}€
- **Taux d'occupation**: {occupancy_rate:.1f}%
- **Revenus locatifs mensuels**: {total_monthly_rent:,.0f}€
- **Revenus annuels estimés**: {annual_rent:,.0f}€
- **Rendement brut moyen**: {yield_rate:.2f}%

"""
        else:
            formatted += "## 🏢 Portefeuille\n**Aucun bien enregistré**\n\n"
        
        # Documents associés
        documents = data.get('documents', [])
        if documents:
            formatted += f"## 📄 Documents du Propriétaire ({len(documents)})\n\n"
            for doc in documents[:5]:  # Limiter à 5 documents
                tags = ", ".join(doc.get('tags', []))
                formatted += f"- **{doc.get('title', 'Sans titre')}** ({doc.get('file_type', 'N/A')})"
                if tags:
                    formatted += f" - Tags: {tags}"
                formatted += "\n"
            
            if len(documents) > 5:
                formatted += f"\n... et {len(documents) - 5} autres documents\n"
            formatted += "\n"
        
        # Préférences et modalités
        formatted += f"""## ⚙️ Préférences de Gestion
- **Mode de gestion**: {data.get('management_mode', 'N/A')}
- **Fréquence de reporting**: {data.get('reporting_frequency', 'N/A')}
- **Mode de paiement préféré**: {data.get('preferred_payment_method', 'N/A')}
- **Date de versement**: {data.get('payment_day', 'N/A')} du mois

## 📋 Mandats et Contrats
- **Type de mandat**: {data.get('mandate_type', 'N/A')}
- **Date de début**: {data.get('mandate_start_date', 'N/A')}
- **Date de fin**: {data.get('mandate_end_date', 'N/A')}
- **Commission**: {data.get('commission_rate', 'N/A')}%
- **Renouvellement automatique**: {'Oui' if data.get('auto_renewal') else 'Non'}

"""
        
        # Notes et observations
        if data.get('notes'):
            formatted += f"""## 📝 Notes
{data.get('notes')}

"""
        
        # Historique et statistiques
        formatted += f"""## 📈 Statistiques
- **Ancienneté**: {data.get('years_as_client', 'N/A')} ans
- **Satisfaction**: {data.get('satisfaction_score', 'N/A')}/10
- **Nombre de réclamations**: {data.get('complaints_count', 0)}
- **Dernier contact**: {data.get('last_contact_date', 'N/A')}

"""
        
        formatted += f"""## 📅 Dates
- **Client depuis**: {data.get('created_at', 'N/A')}
- **Dernière mise à jour**: {data.get('updated_at', 'N/A')}
"""
        
        return self.truncate_to_token_limit(formatted)
