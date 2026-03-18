"""
Adapter Factory - Factory pour créer les adaptateurs selon le type de source
"""

from typing import Dict
from app.schemas.chat_sdk import SourceType
from .base_adapter import BaseSourceAdapter
from .documents_adapter import DocumentsAdapter
from .leases_adapter import LeasesAdapter
from .properties_adapter import PropertiesAdapter
from .kpis_adapter import KPIsAdapter
from .tenants_adapter import TenantsAdapter
from .owners_adapter import OwnersAdapter


class AdapterFactory:
    """Factory pour créer les adaptateurs de sources"""
    
    _adapters: Dict[SourceType, BaseSourceAdapter] = {}
    
    @classmethod
    def get_adapter(cls, source_type: SourceType) -> BaseSourceAdapter:
        """
        Obtenir l'adaptateur pour un type de source
        
        Args:
            source_type: Type de source (DOCUMENTS, LEASES, PROPERTIES, etc.)
            
        Returns:
            Instance de l'adaptateur approprié
        """
        # Créer l'adaptateur s'il n'existe pas encore (singleton par type)
        if source_type not in cls._adapters:
            if source_type == SourceType.DOCUMENTS:
                cls._adapters[source_type] = DocumentsAdapter()
            elif source_type == SourceType.LEASES:
                cls._adapters[source_type] = LeasesAdapter()
            elif source_type == SourceType.PROPERTIES:
                cls._adapters[source_type] = PropertiesAdapter()
            elif source_type == SourceType.KPIS:
                cls._adapters[source_type] = KPIsAdapter()
            elif source_type == SourceType.TENANTS:
                cls._adapters[source_type] = TenantsAdapter()
            elif source_type == SourceType.OWNERS:
                cls._adapters[source_type] = OwnersAdapter()
            else:
                raise ValueError(f"Unknown source type: {source_type}")
        
        return cls._adapters[source_type]
    
    @classmethod
    def get_all_adapters(cls) -> Dict[SourceType, BaseSourceAdapter]:
        """Obtenir tous les adaptateurs disponibles"""
        # S'assurer que tous les adaptateurs sont créés
        for source_type in SourceType:
            cls.get_adapter(source_type)
        
        return cls._adapters.copy()


# Instance globale de la factory
adapter_factory = AdapterFactory()
