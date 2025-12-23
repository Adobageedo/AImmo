from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from uuid import UUID

from app.schemas.tenant import Tenant, TenantCreate, TenantUpdate
from app.core.security import get_current_user_id
from app.core.supabase import get_supabase

router = APIRouter()


@router.get("/", response_model=List[Tenant])
async def get_tenants(
    organization_id: UUID = Query(..., description="Organization ID (required)"),
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    # Check permissions
    is_member = supabase.table("organization_users").select("id").eq(
        "organization_id", str(organization_id)
    ).eq("user_id", user_id).execute()
    
    if not is_member.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to this organization"
        )
    
    response = supabase.table("tenants").select("*").eq(
        "organization_id", str(organization_id)
    ).execute()
    
    return response.data


@router.post("/", response_model=Tenant, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_data: TenantCreate,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    # Check permissions
    is_member = supabase.table("organization_users").select("id").eq(
        "organization_id", str(tenant_data.organization_id)
    ).eq("user_id", user_id).execute()
    
    if not is_member.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to this organization"
        )
    
    response = supabase.table("tenants").insert(tenant_data.model_dump()).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create tenant"
        )
    
    return response.data[0]


@router.get("/{tenant_id}", response_model=Tenant)
async def get_tenant(
    tenant_id: UUID,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    # We could check organization membership here too, but RLS might handle it if enabled.
    # To be safe and consistent with other endpoints, we should query and check organization.
    # But for now, let's just fetch it and if RLS policies are set correctly, it should be fine.
    # However, to match the pattern, we'll fetch first.
    
    response = supabase.table("tenants").select("*").eq("id", str(tenant_id)).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
        
    tenant = response.data[0]
    
    # Verify organization membership
    is_member = supabase.table("organization_users").select("id").eq(
        "organization_id", tenant["organization_id"]
    ).eq("user_id", user_id).execute()
    
    if not is_member.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not access to this tenant"
        )
    
    return tenant


@router.put("/{tenant_id}", response_model=Tenant)
async def update_tenant(
    tenant_id: UUID,
    tenant_data: TenantUpdate,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    # Fetch existing to check auth
    existing = supabase.table("tenants").select("organization_id").eq("id", str(tenant_id)).execute()
    
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
        
    # Check permissions
    is_member = supabase.table("organization_users").select("id").eq(
        "organization_id", existing.data[0]["organization_id"]
    ).eq("user_id", user_id).execute()
    
    if not is_member.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to this organization"
        )
    
    update_data = tenant_data.model_dump(exclude_unset=True)
    
    if not update_data:
        return existing.data[0] # Nothing to update
    
    response = supabase.table("tenants").update(update_data).eq("id", str(tenant_id)).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update tenant"
        )
    
    return response.data[0]


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(
    tenant_id: UUID,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    # Fetch existing to check auth
    existing = supabase.table("tenants").select("organization_id").eq("id", str(tenant_id)).execute()
    
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
        
    # Check permissions
    is_member = supabase.table("organization_users").select("id").eq(
        "organization_id", existing.data[0]["organization_id"]
    ).eq("user_id", user_id).execute()
    
    if not is_member.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to this organization"
        )
    
    response = supabase.table("tenants").delete().eq("id", str(tenant_id)).execute()
    
    if not response.data:
         # Note: Supabase delete returns the deleted rows. If nothing returned, it might have failed or not found.
         # But we already checked it exists. 
         pass
    
    return None
