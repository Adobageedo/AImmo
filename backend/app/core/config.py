from pydantic_settings import BaseSettings
from typing import List
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "AImmo API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "local"
    
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""
    
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    # LLM Settings
    OPENAI_API_KEY: str = ""
    DEFAULT_LLM_MODEL: str = "gpt-4.1-nano"
    DEFAULT_LLM_TEMPERATURE: float = 0.1
    DEFAULT_LLM_MAX_TOKENS: int = 4000
    
    # Legifrance API Settings
    LEGIFRANCE_CLIENT_ID: str = ""
    LEGIFRANCE_CLIENT_SECRET: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
