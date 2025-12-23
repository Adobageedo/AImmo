from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, List
from uuid import UUID
from decimal import Decimal


class DashboardKPIs(BaseModel):
    """KPI aggregations for the portfolio dashboard"""
    # Properties KPIs
    total_properties: int = 0
    properties_by_type: Dict[str, int] = {}
    total_surface_area: Decimal = Decimal("0")
    total_estimated_value: Decimal = Decimal("0")

    # Occupancy KPIs
    occupancy_rate: Decimal = Decimal("0")
    vacancy_rate: Decimal = Decimal("0")
    occupied_units: int = 0
    vacant_units: int = 0

    # Financial KPIs
    total_monthly_rent: Decimal = Decimal("0")
    total_annual_rent: Decimal = Decimal("0")
    total_charges: Decimal = Decimal("0")
    total_deposits: Decimal = Decimal("0")
    average_rent_per_sqm: Decimal = Decimal("0")
    gross_yield: Decimal = Decimal("0")

    # Tenants KPIs
    total_tenants: int = 0
    tenants_by_type: Dict[str, int] = {}

    # Leases KPIs
    total_leases: int = 0
    active_leases: int = 0
    expiring_soon_leases: int = 0  # Expiring within 90 days
    expired_leases: int = 0

    # Documents KPIs
    total_documents: int = 0
    documents_by_type: Dict[str, int] = {}

    # Metadata
    last_updated: datetime = datetime.utcnow()

    class Config:
        from_attributes = True


class PropertyLocation(BaseModel):
    """Property with location data for geographic display"""
    id: UUID
    name: str
    address: str
    city: str
    postal_code: str
    country: str
    property_type: str
    surface_area: Optional[Decimal] = None
    estimated_value: Optional[Decimal] = None
    occupancy_status: str  # "occupied", "vacant", "partial"
    monthly_rent: Optional[Decimal] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None


class DashboardSummary(BaseModel):
    """Quick summary metrics for dashboard header"""
    portfolio_value: Decimal = Decimal("0")
    annual_revenue: Decimal = Decimal("0")
    average_occupancy: Decimal = Decimal("0")
    performance_score: Decimal = Decimal("0")  # 0-100


class GeoRegion(BaseModel):
    """Geographic region aggregation"""
    name: str
    property_count: int
    total_value: Decimal
    occupancy_rate: Decimal


class DashboardResponse(BaseModel):
    """Complete dashboard response"""
    kpis: DashboardKPIs
    properties: List[PropertyLocation]
    summary: DashboardSummary
    regions: List[GeoRegion]


class DashboardFilters(BaseModel):
    """Filters for dashboard data"""
    organization_id: UUID
    property_type: Optional[str] = None
    city: Optional[str] = None
    date_start: Optional[datetime] = None
    date_end: Optional[datetime] = None
    occupancy_status: Optional[str] = None  # "occupied", "vacant", "all"
