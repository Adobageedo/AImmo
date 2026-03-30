"""
Supabase client configuration.
"""
from functools import lru_cache
from core.config import settings
import logging

logger = logging.getLogger(__name__)


@lru_cache()
def get_supabase():
    """Get Supabase client (cached)."""
    try:
        from supabase import create_client
        return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    except ImportError:
        logger.error("Supabase client not available - install supabase-py")
        return None
    except Exception as e:
        logger.error(f"Error creating Supabase client: {e}")
        return None
