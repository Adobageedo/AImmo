from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr


class User(UserBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserOrganization(BaseModel):
    organization_id: str
    organization_name: str
    role_name: str
    permissions: dict


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: User
    organizations: List[UserOrganization]
