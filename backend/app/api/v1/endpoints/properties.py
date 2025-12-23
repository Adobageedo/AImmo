from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from uuid import UUID

from app.schemas.property import Property, PropertyCreate, PropertyUpdate
from app.core.security import get_current_user_id
from app.core.supabase import get_supabase

router = APIRouter()


@router.get("/", response_model=List[Property])
async def get_properties(
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
    
    response = supabase.table("properties").select("*").eq(
        "organization_id", str(organization_id)
    ).execute()
    
    properties = response.data or []
    
    # Add lease info to each property
    for prop in properties:
        lease_response = supabase.table("leases").select(
            "id, tenant_id, monthly_rent"
        ).eq("property_id", prop["id"]).order("start_date", desc=True).limit(1).execute()
        
        if lease_response.data and len(lease_response.data) > 0:
            lease = lease_response.data[0]
            prop["current_lease_id"] = lease["id"]
            prop["current_tenant_id"] = lease.get("tenant_id")
            prop["monthly_rent"] = lease.get("monthly_rent")
            
            # Get tenant name
            if lease.get("tenant_id"):
                tenant_response = supabase.table("tenants").select("name").eq(
                    "id", lease["tenant_id"]
                ).execute()
                if tenant_response.data and len(tenant_response.data) > 0:
                    prop["current_tenant_name"] = tenant_response.data[0].get("name")
    
    return properties


@router.post("/", response_model=Property, status_code=status.HTTP_201_CREATED)
async def create_property(
    property_data: PropertyCreate,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    is_member = supabase.table("organization_users").select("id").eq(
        "organization_id", str(property_data.organization_id)
    ).eq("user_id", user_id).execute()
    
    if not is_member.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to this organization"
        )
    
    response = supabase.table("properties").insert(property_data.model_dump()).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create property"
        )
    
    return response.data[0]


@router.get("/{property_id}", response_model=Property)
async def get_property(
    property_id: UUID,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    response = supabase.table("properties").select("*").eq("id", str(property_id)).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    property_data = response.data[0]
    
    # Get current active lease
    lease_response = supabase.table("leases").select(
        "id, tenant_id, monthly_rent"
    ).eq("property_id", str(property_id)).order("start_date", desc=True).limit(1).execute()
    
    if lease_response.data and len(lease_response.data) > 0:
        lease = lease_response.data[0]
        property_data["current_lease_id"] = lease["id"]
        property_data["current_tenant_id"] = lease["tenant_id"]
        property_data["monthly_rent"] = lease["monthly_rent"]
    
    return property_data


@router.put("/{property_id}", response_model=Property)
async def update_property(
    property_id: UUID,
    property_data: PropertyUpdate,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    update_data = property_data.model_dump(exclude_unset=True)
    
    response = supabase.table("properties").update(update_data).eq("id", str(property_id)).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    return response.data[0]


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: UUID,
    user_id: str = Depends(get_current_user_id),
):
    supabase = get_supabase()
    
    response = supabase.table("properties").delete().eq("id", str(property_id)).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    return None
