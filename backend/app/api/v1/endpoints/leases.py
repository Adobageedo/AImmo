from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from uuid import UUID

from app.schemas.lease import Lease, LeaseCreate, LeaseUpdate
from app.core.security import get_current_user_id
from app.core.supabase import get_supabase

router = APIRouter()


@router.get("/", response_model=List[Lease])
async def get_leases(
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
    
    response = supabase.table("leases").select("*").eq(
        "organization_id", str(organization_id)
    ).execute()
    
    return response.data


@router.post("/", response_model=Lease, status_code=status.HTTP_201_CREATED)
async def create_lease(
    lease_data: LeaseCreate,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    # Check permissions
    is_member = supabase.table("organization_users").select("id").eq(
        "organization_id", str(lease_data.organization_id)
    ).eq("user_id", user_id).execute()
    
    if not is_member.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to this organization"
        )
    
    # Convert dates to string for Supabase
    data = lease_data.model_dump()
    data["start_date"] = data["start_date"].isoformat()
    if data.get("end_date"):
        data["end_date"] = data["end_date"].isoformat()
    
    response = supabase.table("leases").insert(data).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create lease"
        )
    
    # Supabase returns ISO strings for dates, Pydantic will parse them
    return response.data[0]


@router.get("/{lease_id}", response_model=Lease)
async def get_lease(
    lease_id: UUID,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    response = supabase.table("leases").select("*").eq("id", str(lease_id)).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lease not found"
        )
    
    lease = response.data[0]
    
    # Verify organization membership
    is_member = supabase.table("organization_users").select("id").eq(
        "organization_id", lease["organization_id"]
    ).eq("user_id", user_id).execute()
    
    if not is_member.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not access to this lease"
        )
    
    return lease


@router.put("/{lease_id}", response_model=Lease)
async def update_lease(
    lease_id: UUID,
    lease_data: LeaseUpdate,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    # Fetch existing to check auth
    existing = supabase.table("leases").select("organization_id").eq("id", str(lease_id)).execute()
    
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lease not found"
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
    
    update_data = lease_data.model_dump(exclude_unset=True)
    
    # Handle dates
    if "start_date" in update_data:
        update_data["start_date"] = update_data["start_date"].isoformat()
    if "end_date" in update_data and update_data["end_date"]:
        update_data["end_date"] = update_data["end_date"].isoformat()
    
    if not update_data:
        return existing.data[0]
        
    response = supabase.table("leases").update(update_data).eq("id", str(lease_id)).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update lease"
        )
    
    return response.data[0]


@router.delete("/{lease_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lease(
    lease_id: UUID,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    # Fetch existing to check auth
    existing = supabase.table("leases").select("organization_id").eq("id", str(lease_id)).execute()
    
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lease not found"
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
    
    response = supabase.table("leases").delete().eq("id", str(lease_id)).execute()
    
    return None

# Placeholder for payments endpoint
@router.get("/{lease_id}/payments", response_model=List[dict])
async def get_lease_payments(
    lease_id: UUID,
    user_id: str = Depends(get_current_user_id),
):
    # Currently no payments table, return empty list
    return []

@router.post("/{lease_id}/payments", status_code=status.HTTP_201_CREATED)
async def create_lease_payment(
    lease_id: UUID,
    payment: dict,
    user_id: str = Depends(get_current_user_id),
):
    # Currently no payments table, mock success
    return {"id": "mock-id", "status": "paid", **payment}
