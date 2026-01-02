"""
RAG Source Adapters - Adaptateurs pour chaque type de source
"""

from .base_adapter import BaseSourceAdapter
from .documents_adapter import DocumentsAdapter
from .leases_adapter import LeasesAdapter
from .properties_adapter import PropertiesAdapter
from .kpis_adapter import KPIsAdapter
from .tenants_adapter import TenantsAdapter
from .owners_adapter import OwnersAdapter
from .adapter_factory import AdapterFactory, adapter_factory

__all__ = [
    "BaseSourceAdapter",
    "DocumentsAdapter",
    "LeasesAdapter",
    "PropertiesAdapter",
    "KPIsAdapter",
    "TenantsAdapter",
    "OwnersAdapter",
    "AdapterFactory",
    "adapter_factory",
]
