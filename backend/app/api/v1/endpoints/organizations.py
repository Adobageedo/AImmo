from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app.schemas.organization import (
    Organization,
    OrganizationCreate,
    OrganizationUpdate,
)
from app.core.security import get_current_user, get_current_user_id, get_user_organizations
from app.core.supabase import get_supabase

router = APIRouter()


@router.get("/", response_model=List[dict])
async def get_organizations(
    user_orgs=Depends(get_user_organizations),
):
    return user_orgs


@router.post("/", response_model=Organization, status_code=status.HTTP_201_CREATED)
async def create_organization(
    organization: OrganizationCreate,
    user_id: str =Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    response = supabase.table("organizations").insert(organization.model_dump()).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create organization"
        )
    
    return response.data[0]


@router.get("/{organization_id}", response_model=Organization)
async def get_organization(
    organization_id: UUID,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    is_member = supabase.table("organization_users").select("id").eq(
        "organization_id", str(organization_id)
    ).eq("user_id", user_id).execute()
    
    if not is_member.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to this organization"
        )
    
    response = supabase.table("organizations").select("*").eq("id", str(organization_id)).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    return response.data[0]


@router.put("/{organization_id}", response_model=Organization)
async def update_organization(
    organization_id: UUID,
    organization: OrganizationUpdate,
    user_id: str =Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    update_data = organization.model_dump(exclude_unset=True)
    
    response = supabase.table("organizations").update(update_data).eq("id", str(organization_id)).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    return response.data[0]


@router.delete("/{organization_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    organization_id: UUID,
    user_id: str =Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    response = supabase.table("organizations").delete().eq("id", str(organization_id)).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    return None
