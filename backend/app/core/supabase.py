from supabase import create_client, Client
from app.core.config import settings


supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY
)


def get_supabase() -> Client:
    return supabase


def get_supabase_client() -> Client:
    """Alias for dependency injection in endpoints"""
    return supabase

