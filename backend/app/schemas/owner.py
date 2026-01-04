from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID

class OwnerBase(BaseModel):
    organization_id: UUID
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    company_name: Optional[str] = None
    siret: Optional[str] = None

class OwnerCreate(OwnerBase):
    pass

class OwnerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    company_name: Optional[str] = None
    siret: Optional[str] = None

class Owner(OwnerBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
