from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Optional
from app.core.supabase import get_supabase


security = HTTPBearer()


async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    
    try:
        supabase = get_supabase()
        user = supabase.auth.get_user(token)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
        
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )


async def get_current_user(user=Security(verify_token)):
    return user


async def get_current_user_id(user=Depends(get_current_user)) -> str:
    return user.user.id


async def verify_user_in_organization(
    organization_id: str,
    user_id: str = Depends(get_current_user_id)
) -> bool:
    supabase = get_supabase()
    
    result = supabase.table("organization_users").select("id").eq(
        "organization_id", organization_id
    ).eq(
        "user_id", user_id
    ).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not belong to this organization"
        )
    
    return True


async def get_user_organizations(user_id: str = Depends(get_current_user_id)):
    supabase = get_supabase()
    
    result = supabase.table("organization_users").select(
        "organization_id, organizations(id, name, description), roles(id, name)"
    ).eq("user_id", user_id).execute()
    
    return result.data
