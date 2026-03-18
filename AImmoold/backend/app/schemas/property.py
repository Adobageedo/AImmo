from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID
from decimal import Decimal


class PropertyBase(BaseModel):
    name: str
    address: str
    city: str
    postal_code: str
    country: str
    property_type: str
    surface_area: Optional[Decimal] = None
    estimated_value: Optional[Decimal] = None
    construction_year: Optional[int] = None
    last_renovation_year: Optional[int] = None
    energy_class: Optional[str] = None
    ges_class: Optional[str] = None
    purchase_price: Optional[Decimal] = None
    purchase_date: Optional[str] = None
    current_value: Optional[Decimal] = None
    monthly_charges: Optional[Decimal] = None
    property_tax: Optional[Decimal] = None
    source_document_id: Optional[UUID] = None
    organization_id: UUID
    owner_name: Optional[str] = None
    owner_id: Optional[UUID] = None


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    property_type: Optional[str] = None
    surface_area: Optional[Decimal] = None
    estimated_value: Optional[Decimal] = None
    construction_year: Optional[int] = None
    last_renovation_year: Optional[int] = None
    energy_class: Optional[str] = None
    ges_class: Optional[str] = None
    purchase_price: Optional[Decimal] = None
    purchase_date: Optional[str] = None
    current_value: Optional[Decimal] = None
    monthly_charges: Optional[Decimal] = None
    property_tax: Optional[Decimal] = None
    source_document_id: Optional[UUID] = None
    owner_name: Optional[str] = None
    owner_id: Optional[UUID] = None


class Property(PropertyBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    # Computed fields from joins/relations
    monthly_rent: Optional[Decimal] = None
    current_lease_id: Optional[UUID] = None
    current_tenant_id: Optional[UUID] = None
    current_tenant_name: Optional[str] = None
    
    class Config:
        from_attributes = True
