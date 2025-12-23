from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from uuid import UUID

from app.schemas.owner import Owner, OwnerCreate, OwnerUpdate
from app.core.security import get_current_user_id
from app.core.supabase import get_supabase

router = APIRouter()


@router.get("/", response_model=List[Owner])
async def get_owners(
    organization_id: UUID = Query(..., description="Organization ID (required)"),
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
    
    response = supabase.table("owners").select("*").eq(
        "organization_id", str(organization_id)
    ).execute()
    
    return response.data


@router.post("/", response_model=Owner, status_code=status.HTTP_201_CREATED)
async def create_owner(
    owner_data: OwnerCreate,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    is_member = supabase.table("organization_users").select("id").eq(
        "organization_id", str(owner_data.organization_id)
    ).eq("user_id", user_id).execute()
    
    if not is_member.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to this organization"
        )
    
    response = supabase.table("owners").insert(owner_data.model_dump()).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create owner"
        )
    
    return response.data[0]


@router.get("/{owner_id}", response_model=Owner)
async def get_owner(
    owner_id: UUID,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    response = supabase.table("owners").select("*").eq("id", str(owner_id)).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Owner not found"
        )
    
    return response.data[0]


@router.put("/{owner_id}", response_model=Owner)
async def update_owner(
    owner_id: UUID,
    owner_data: OwnerUpdate,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    update_data = owner_data.model_dump(exclude_unset=True)
    
    response = supabase.table("owners").update(update_data).eq("id", str(owner_id)).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Owner not found"
        )
    
    return response.data[0]


@router.delete("/{owner_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_owner(
    owner_id: UUID,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    response = supabase.table("owners").delete().eq("id", str(owner_id)).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Owner not found"
        )
    
    return None


@router.get("/{owner_id}/properties", response_model=List[dict])
async def get_owner_properties(
    owner_id: UUID,
    user_id: str = Depends(get_current_user_id),
):
    """Get all properties owned by this owner with their current lease info"""
    supabase = get_supabase()
    
    # Get properties with their current lease information
    response = supabase.table("properties").select(
        "*, leases!inner(monthly_rent, tenant_id, start_date, end_date)"
    ).eq("owner_id", str(owner_id)).execute()
    
    properties = response.data or []
    
    # Flatten lease data into property for easier frontend access
    for prop in properties:
        if prop.get("leases") and len(prop["leases"]) > 0:
            # Get the most recent active lease
            active_lease = None
            for lease in prop["leases"]:
                if not lease.get("end_date") or lease["end_date"] >= "2025-12-23":
                    active_lease = lease
                    break
            
            if active_lease:
                prop["monthly_rent"] = active_lease.get("monthly_rent", 0)
                prop["current_tenant_id"] = active_lease.get("tenant_id")
            else:
                prop["monthly_rent"] = 0
        else:
            prop["monthly_rent"] = 0
        
        # Remove the nested leases array
        prop.pop("leases", None)
    
    return properties
