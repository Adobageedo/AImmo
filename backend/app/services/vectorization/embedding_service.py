"""
Embedding service for AImmo using OpenAI embeddings.
"""

from typing import List
from langchain_openai import OpenAIEmbeddings
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating embeddings using OpenAI."""
    
    def __init__(self, model: str = "text-embedding-3-small"):
        """
        Initialize embedding service.
        
        Args:
            model: OpenAI embedding model to use
        """
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not configured")
        
        self.model = model
        self.embedder = OpenAIEmbeddings(
            model=model,
            openai_api_key=settings.OPENAI_API_KEY
        )
        
        logger.info(f"Embedding service initialized with model: {model}")
    
    def get_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text.
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector
        """
        if not text or text.strip() == "":
            text = " "  # OpenAI doesn't like empty strings
        
        try:
            embedding = self.embedder.embed_query(text)
            return embedding
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise
    
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        # Replace empty strings
        texts = [t if t and t.strip() else " " for t in texts]
        
        try:
            embeddings = self.embedder.embed_documents(texts)
            logger.debug(f"Generated {len(embeddings)} embeddings")
            return embeddings
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            raise
    
    @property
    def dimension(self) -> int:
        """Get embedding dimension."""
        if "3-small" in self.model:
            return 1536
        elif "3-large" in self.model:
            return 3072
        else:
            return 1536  # Default


# Singleton instance
embedding_service = EmbeddingService()
