"""
KPIs Adapter - Fetch depuis Supabase avec fiches complètes
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from .base_adapter import BaseSourceAdapter
from app.schemas.chat_sdk import SourceType


class KPIsAdapter(BaseSourceAdapter):
    """Adapter for KPIS source - Fetches and calculates KPIs from Supabase"""
    
    def __init__(self):
        super().__init__(SourceType.KPIS)
    
    async def fetch_data(
        self,
        organization_id: str,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10,
        supabase = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch and calculate KPIs from Supabase
        Returns a single comprehensive KPI report
        """
        if not supabase:
            return []
        
        try:
            # 1. Properties
            properties_response = supabase.table("properties").select("""
                id,
                name,
                property_type,
                surface_area,
                estimated_value,
                leases (
                    id,
                    start_date,
                    end_date,
                    monthly_rent,
                    charges
                )
            """).eq("organization_id", organization_id).execute()
            
            properties = properties_response.data or []
            
            # 2. Leases
            leases_response = supabase.table("leases").select("""
                id,
                start_date,
                end_date,
                monthly_rent,
                charges,
                deposit,
                property_id
            """).eq("organization_id", organization_id).execute()
            
            leases = leases_response.data or []
            
            # 3. Tenants
            tenants_response = supabase.table("tenants").select(
                "id, name, tenant_type"
            ).eq("organization_id", organization_id).execute()
            
            tenants = tenants_response.data or []
            
            # Calculer les KPIs
            kpis = self._calculate_kpis(properties, leases, tenants)
            
            return [kpis]
            
        except Exception as e:
            print(f"Error fetching KPIs: {e}")
            return []
    
    def _calculate_kpis(
        self,
        properties: List[Dict],
        leases: List[Dict],
        tenants: List[Dict]
    ) -> Dict[str, Any]:
        """Calculate all KPIs from raw data"""
        
        now = datetime.now()
        
        # KPIs de base
        total_properties = len(properties)
        total_tenants = len(tenants)
        
        # Baux actifs
        active_leases = [
            lease for lease in leases
            if lease.get('end_date') is None or 
            datetime.fromisoformat(lease['end_date'].replace('Z', '+00:00')) > now
        ]
        
        # Occupation
        occupied_properties = len(set(lease['property_id'] for lease in active_leases))
        occupancy_rate = (occupied_properties / total_properties * 100) if total_properties > 0 else 0
        vacant_properties = total_properties - occupied_properties
        
        # Revenus
        total_monthly_rent = sum(lease.get('monthly_rent', 0) for lease in active_leases)
        total_monthly_charges = sum(lease.get('charges', 0) for lease in active_leases)
        total_monthly_revenue = total_monthly_rent + total_monthly_charges
        annual_revenue = total_monthly_revenue * 12
        
        # Valeur du portefeuille
        total_portfolio_value = sum(prop.get('estimated_value', 0) or 0 for prop in properties)
        
        # Rendement
        gross_yield = (annual_revenue / total_portfolio_value * 100) if total_portfolio_value > 0 else 0
        
        # Baux expirant bientôt (3 mois)
        three_months = now + timedelta(days=90)
        expiring_leases = [
            lease for lease in active_leases
            if lease.get('end_date') and 
            datetime.fromisoformat(lease['end_date'].replace('Z', '+00:00')) <= three_months
        ]
        
        # Répartition par type de bien
        property_types = {}
        for prop in properties:
            prop_type = prop.get('property_type', 'Autre')
            property_types[prop_type] = property_types.get(prop_type, 0) + 1
        
        # Loyer moyen
        avg_rent = total_monthly_rent / len(active_leases) if active_leases else 0
        
        # Surface totale
        total_surface = sum(prop.get('surface_area', 0) or 0 for prop in properties)
        
        # Prix au m² moyen
        avg_price_per_sqm = (total_portfolio_value / total_surface) if total_surface > 0 else 0
        
        return {
            "id": "kpis-report",
            "generated_at": now.isoformat(),
            "period": "current",
            "portfolio": {
                "total_properties": total_properties,
                "occupied_properties": occupied_properties,
                "vacant_properties": vacant_properties,
                "occupancy_rate": occupancy_rate,
                "total_surface": total_surface,
                "total_value": total_portfolio_value,
                "avg_price_per_sqm": avg_price_per_sqm,
                "property_types": property_types
            },
            "financial": {
                "monthly_rent": total_monthly_rent,
                "monthly_charges": total_monthly_charges,
                "monthly_revenue": total_monthly_revenue,
                "annual_revenue": annual_revenue,
                "gross_yield": gross_yield,
                "avg_rent": avg_rent
            },
            "leases": {
                "total_active": len(active_leases),
                "expiring_soon": len(expiring_leases),
                "expiring_leases_details": [
                    {
                        "lease_id": lease['id'],
                        "end_date": lease['end_date'],
                        "monthly_rent": lease['monthly_rent']
                    }
                    for lease in expiring_leases
                ]
            },
            "tenants": {
                "total": total_tenants,
                "individuals": len([t for t in tenants if t.get('tenant_type') == 'individual']),
                "companies": len([t for t in tenants if t.get('tenant_type') == 'company'])
            }
        }
    
    def format_for_llm(self, data: Dict[str, Any]) -> str:
        """Format KPIs as comprehensive report for LLM"""
        
        portfolio = data.get('portfolio', {})
        financial = data.get('financial', {})
        leases_data = data.get('leases', {})
        tenants_data = data.get('tenants', {})
        
        formatted = f"""# 📊 RAPPORT KPIs - INDICATEURS DE PERFORMANCE

**Généré le**: {data.get('generated_at', 'N/A')}
**Période**: {data.get('period', 'Actuelle')}

---

## 🏢 PORTEFEUILLE IMMOBILIER

### Vue d'ensemble
- **Nombre total de biens**: {portfolio.get('total_properties', 0)}
- **Biens occupés**: {portfolio.get('occupied_properties', 0)}
- **Biens vacants**: {portfolio.get('vacant_properties', 0)}
- **Taux d'occupation**: {portfolio.get('occupancy_rate', 0):.1f}%

### Caractéristiques
- **Surface totale**: {portfolio.get('total_surface', 0):,.0f} m²
- **Valeur totale du portefeuille**: {portfolio.get('total_value', 0):,.0f}€
- **Prix moyen au m²**: {portfolio.get('avg_price_per_sqm', 0):,.0f}€/m²

### Répartition par type de bien
"""
        
        property_types = portfolio.get('property_types', {})
        for prop_type, count in property_types.items():
            percentage = (count / portfolio.get('total_properties', 1)) * 100
            formatted += f"- **{prop_type}**: {count} ({percentage:.1f}%)\n"
        
        formatted += f"""
---

## 💰 PERFORMANCE FINANCIÈRE

### Revenus Locatifs
- **Loyers mensuels**: {financial.get('monthly_rent', 0):,.0f}€
- **Charges mensuelles**: {financial.get('monthly_charges', 0):,.0f}€
- **Revenus mensuels totaux**: {financial.get('monthly_revenue', 0):,.0f}€
- **Revenus annuels estimés**: {financial.get('annual_revenue', 0):,.0f}€

### Rentabilité
- **Rendement brut**: {financial.get('gross_yield', 0):.2f}%
- **Loyer moyen par bien**: {financial.get('avg_rent', 0):,.0f}€/mois

---

## 📋 BAUX ET LOCATIONS

### Statistiques
- **Baux actifs**: {leases_data.get('total_active', 0)}
- **Baux expirant dans 3 mois**: {leases_data.get('expiring_soon', 0)}

"""
        
        expiring_leases = leases_data.get('expiring_leases_details', [])
        if expiring_leases:
            formatted += "### ⚠️ Baux à renouveler prochainement\n"
            for lease in expiring_leases:
                formatted += f"- Bail {lease['lease_id']}: Expire le {lease['end_date']} (Loyer: {lease['monthly_rent']}€)\n"
            formatted += "\n"
        
        formatted += f"""---

## 👥 LOCATAIRES

### Répartition
- **Total locataires**: {tenants_data.get('total', 0)}
- **Particuliers**: {tenants_data.get('individuals', 0)}
- **Entreprises**: {tenants_data.get('companies', 0)}

---

## 📈 INDICATEURS CLÉS DE PERFORMANCE

### Taux d'Occupation
"""
        
        occupancy_rate = portfolio.get('occupancy_rate', 0)
        if occupancy_rate >= 95:
            formatted += f"✅ **Excellent** ({occupancy_rate:.1f}%) - Portefeuille très bien occupé\n"
        elif occupancy_rate >= 85:
            formatted += f"🟢 **Bon** ({occupancy_rate:.1f}%) - Taux d'occupation satisfaisant\n"
        elif occupancy_rate >= 70:
            formatted += f"🟡 **Moyen** ({occupancy_rate:.1f}%) - Marge d'amélioration\n"
        else:
            formatted += f"🔴 **Faible** ({occupancy_rate:.1f}%) - Attention requise\n"
        
        formatted += "\n### Rendement\n"
        gross_yield = financial.get('gross_yield', 0)
        if gross_yield >= 6:
            formatted += f"✅ **Excellent** ({gross_yield:.2f}%) - Rendement très attractif\n"
        elif gross_yield >= 4:
            formatted += f"🟢 **Bon** ({gross_yield:.2f}%) - Rendement satisfaisant\n"
        elif gross_yield >= 2:
            formatted += f"🟡 **Moyen** ({gross_yield:.2f}%) - Rendement modéré\n"
        else:
            formatted += f"🔴 **Faible** ({gross_yield:.2f}%) - Rendement à améliorer\n"
        
        formatted += f"""
---

## 🎯 RECOMMANDATIONS

"""
        
        # Générer des recommandations basées sur les KPIs
        recommendations = []
        
        if portfolio.get('vacant_properties', 0) > 0:
            recommendations.append(f"- **Vacance**: {portfolio['vacant_properties']} bien(s) vacant(s) - Prioriser la recherche de locataires")
        
        if leases_data.get('expiring_soon', 0) > 0:
            recommendations.append(f"- **Renouvellements**: {leases_data['expiring_soon']} bail/baux à renouveler dans les 3 mois - Anticiper les négociations")
        
        if occupancy_rate < 85:
            recommendations.append(f"- **Occupation**: Taux d'occupation de {occupancy_rate:.1f}% - Envisager des actions marketing")
        
        if gross_yield < 4:
            recommendations.append(f"- **Rentabilité**: Rendement de {gross_yield:.2f}% - Analyser les possibilités d'optimisation des loyers")
        
        if not recommendations:
            recommendations.append("- ✅ **Portefeuille sain** - Continuer la gestion actuelle")
        
        for rec in recommendations:
            formatted += f"{rec}\n"
        
        formatted += """
---

*Ce rapport est généré automatiquement à partir des données actuelles de votre portefeuille immobilier.*
"""
        
        return self.truncate_to_token_limit(formatted)
