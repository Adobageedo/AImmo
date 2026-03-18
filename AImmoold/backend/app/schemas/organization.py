from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class OrganizationBase(BaseModel):
    name: str
    description: Optional[str] = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class Organization(OrganizationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class OrganizationUserBase(BaseModel):
    organization_id: UUID
    user_id: UUID
    role_id: UUID


class OrganizationUserCreate(OrganizationUserBase):
    pass


class OrganizationUser(OrganizationUserBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: dict = {}


class RoleCreate(RoleBase):
    pass


class Role(RoleBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
