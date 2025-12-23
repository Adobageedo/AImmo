from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID


class TenantBase(BaseModel):
    name: str
    tenant_type: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    organization_id: UUID


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    tenant_type: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class Tenant(TenantBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
