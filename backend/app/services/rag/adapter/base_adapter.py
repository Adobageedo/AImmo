"""
Base adapter for RAG sources
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.schemas.chat_sdk import SourceType


class BaseSourceAdapter(ABC):
    """Base class for all source adapters"""
    
    def __init__(self, source_type: SourceType):
        self.source_type = source_type
    
    @abstractmethod
    async def fetch_data(
        self,
        organization_id: str,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10,
        supabase = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch data from the source
        
        Args:
            organization_id: Organization ID
            query: Search query
            filters: Additional filters (e.g., specific IDs)
            limit: Maximum number of results
            supabase: Supabase client
            
        Returns:
            List of formatted data items
        """
        pass
    
    @abstractmethod
    def format_for_llm(self, data: Dict[str, Any]) -> str:
        """
        Format a single data item for LLM consumption
        
        Args:
            data: Raw data from database
            
        Returns:
            Formatted string for LLM (max 10000 tokens ≈ 7500 words)
        """
        pass
    
    def truncate_to_token_limit(self, text: str, max_tokens: int = 10000) -> str:
        """
        Truncate text to approximate token limit
        Rough estimation: 1 token ≈ 0.75 words ≈ 4 characters
        """
        max_chars = max_tokens * 4
        if len(text) <= max_chars:
            return text
        
        return text[:max_chars] + "\n\n[...Contenu tronqué pour respecter la limite de tokens...]"
