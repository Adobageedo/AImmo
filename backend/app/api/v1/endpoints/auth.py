from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from app.core.supabase import get_supabase
from app.core.security import get_current_user, get_current_user_id

router = APIRouter()


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    organization_name: str = "Mon Organisation"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr


class UpdatePasswordRequest(BaseModel):
    new_password: str


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(data: SignUpRequest):
    supabase = get_supabase()
    
    try:
        auth_response = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password,
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user"
            )
        
        user_id = auth_response.user.id
        
        org_response = supabase.table("organizations").insert({
            "name": data.organization_name,
            "description": f"Organisation de {data.email}"
        }).execute()
        
        if not org_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create organization"
            )
        
        org_id = org_response.data[0]["id"]
        
        admin_role = supabase.table("roles").select("id").eq("name", "admin").execute()
        
        if not admin_role.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Admin role not found"
            )
        
        role_id = admin_role.data[0]["id"]
        
        supabase.table("organization_users").insert({
            "organization_id": org_id,
            "user_id": user_id,
            "role_id": role_id
        }).execute()
        
        return {
            "message": "User created successfully. Please verify your email.",
            "user_id": user_id,
            "organization_id": org_id,
            "email": data.email
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login")
async def login(data: LoginRequest):
    supabase = get_supabase()
    
    try:
        response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password,
        })
        
        if not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        user_orgs = supabase.table("organization_users").select(
            "organization_id, organizations(id, name), roles(name)"
        ).eq("user_id", response.user.id).execute()
        
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email,
            },
            "organizations": user_orgs.data
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    supabase = get_supabase()
    
    try:
        supabase.auth.reset_password_email(data.email)
        
        return {
            "message": "Password reset email sent"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/update-password")
async def update_password(
    data: UpdatePasswordRequest,
    user_id: str =Depends(get_current_user_id)
):
    supabase = get_supabase()
    
    try:
        supabase.auth.update_user({
            "password": data.new_password
        })
        
        return {
            "message": "Password updated successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/me")
async def get_current_user_info(current_user = Depends(get_current_user)):
    # Explicitly verify user object structure
    if not hasattr(current_user, 'user') or not current_user.user:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user session structure"
        )

    supabase = get_supabase()
    user_id = current_user.user.id
    
    user_orgs = supabase.table("organization_users").select(
        "organization_id, organizations(id, name, description), roles(id, name, permissions)"
    ).eq("user_id", user_id).execute()
    
    return {
        "user": {
            "id": user_id,
            "email": current_user.user.email,
            "created_at": current_user.user.created_at,
        },
        "organizations": user_orgs.data
    }



@router.post("/test-setup")
async def create_test_user():
    supabase = get_supabase()
    
    # Generate random credentials
    import random, string
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    email = f"test_auto_{suffix}@example.com"
    password = "TestPassword123!"
    
    try:
        # Create user with auto-confirm using Admin API
        user_data = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True
        })
        
        user_id = user_data.user.id
        
        # Create org
        org_response = supabase.table("organizations").insert({
            "name": f"Test Org {suffix}",
            "description": "Auto-created test org"
        }).execute()
        
        org_id = org_response.data[0]["id"]
        
        # Assign role (Admin)
        admin_role = supabase.table("roles").select("id").eq("name", "admin").execute()
        if not admin_role.data:
             # Create admin role if not exists (fallback)
             role_response = supabase.table("roles").insert({"name": "admin", "description": "Administrator"}).execute()
             role_id = role_response.data[0]["id"]
        else:
             role_id = admin_role.data[0]["id"]
        
        supabase.table("organization_users").insert({
            "organization_id": org_id,
            "user_id": user_id,
            "role_id": role_id
        }).execute()
        
        return {
            "email": email,
            "password": password,
            "organization_id": org_id,
            "user_id": user_id
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/debug/check-admin")
async def check_admin_access():
    supabase = get_supabase()
    try:
        users = supabase.auth.admin.list_users()
        return {"status": "ok", "user_count": len(users)}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

@router.post("/resend-verification")
async def resend_verification(data: ResetPasswordRequest):
    supabase = get_supabase()
    
    try:
        supabase.auth.resend({
            "type": "signup",
            "email": data.email
        })
        
        return {
            "message": "Verification email sent"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
