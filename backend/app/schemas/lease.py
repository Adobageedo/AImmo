from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional
from uuid import UUID
from decimal import Decimal


class LeaseBase(BaseModel):
    property_id: UUID
    tenant_id: UUID
    organization_id: UUID
    start_date: date
    end_date: Optional[date] = None
    monthly_rent: Decimal
    charges: Optional[Decimal] = None
    deposit: Optional[Decimal] = None
    indexation_rate: Optional[Decimal] = None


class LeaseCreate(LeaseBase):
    pass


class LeaseUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    monthly_rent: Optional[Decimal] = None
    charges: Optional[Decimal] = None
    deposit: Optional[Decimal] = None
    indexation_rate: Optional[Decimal] = None


class Lease(LeaseBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
