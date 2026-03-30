"""
Configuration settings for the application.
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # OpenAI
    OPENAI_API_KEY: str
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    
    # Legifrance
    LEGIFRANCE_CLIENT_ID: str
    LEGIFRANCE_CLIENT_SECRET: str
    
    # Newsletter
    JURISPRUDENCE_NEWSLETTER_ID: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
