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
    owner_name: Optional[str] = None
    owner_id: Optional[UUID] = None


class Property(PropertyBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
