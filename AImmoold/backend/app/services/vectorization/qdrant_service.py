"""
Qdrant service for managing vector collections per user and document type.
Collections are organized as: {organization_id}_{document_type}
"""

from typing import List, Dict, Any, Optional, Set
from qdrant_client import QdrantClient
from qdrant_client.http import models as rest
from qdrant_client.models import Distance, VectorParams, PointStruct
from langchain_qdrant import Qdrant
from langchain_core.documents import Document
from app.core.config import settings
from app.core.constants import DocumentType
import logging
import traceback

logger = logging.getLogger(__name__)


class QdrantService:
    """Service for managing Qdrant vector collections per organization and document type."""
    
    def __init__(self):
        """Initialize Qdrant client."""
        if settings.QDRANT_API_KEY:
            self.client = QdrantClient(
                url=settings.QDRANT_URL,
                api_key=settings.QDRANT_API_KEY,
                timeout=300  # 5 minutes for large operations
            )
        else:
            self.client = QdrantClient(
                url=settings.QDRANT_URL,
                timeout=300
            )
        
        logger.info(f"Qdrant service initialized with URL: {settings.QDRANT_URL}")
    
    def get_collection_name(self, organization_id: str, document_type: str = "general") -> str:
        """
        Generate collection name based on organization and document type.
        
        Format: org_{organization_id}_{document_type}
        
        Args:
            organization_id: Organization UUID
            document_type: Type of document (lease, property, owner, tenant, general)
            
        Returns:
            Collection name string
        """
        # Sanitize document type (lowercase, replace spaces with underscores)
        doc_type_clean = document_type.lower().replace(" ", "_").replace("-", "_")
        return f"org_{organization_id}_{doc_type_clean}"
    
    def ensure_collection_exists(
        self,
        collection_name: str,
        vector_size: int = 1536,  # OpenAI text-embedding-3-small default
        distance: Distance = Distance.COSINE
    ) -> bool:
        """
        Create collection if it doesn't exist.
        
        Args:
            collection_name: Name of the collection
            vector_size: Dimension of embedding vectors
            distance: Distance metric (COSINE, EUCLID, DOT)
            
        Returns:
            True if collection exists or was created
        """
        try:
            self.client.get_collection(collection_name)
            logger.debug(f"Collection '{collection_name}' already exists")
            return True
        except Exception as e:
            if "doesn't exist" in str(e).lower() or "not found" in str(e).lower():
                try:
                    self.client.create_collection(
                        collection_name=collection_name,
                        vectors_config=VectorParams(size=vector_size, distance=distance)
                    )
                    logger.info(f"Created collection '{collection_name}' with vector_size={vector_size}")
                    return True
                except Exception as create_error:
                    logger.error(f"Failed to create collection '{collection_name}': {create_error}")
                    raise
            else:
                logger.error(f"Error checking collection '{collection_name}': {e}")
                raise
    
    def add_documents(
        self,
        collection_name: str,
        documents: List[Document],
        embedder,
        batch_size: int = 10
    ) -> Dict[str, Any]:
        """
        Add documents to a Qdrant collection in batches.
        
        Args:
            collection_name: Target collection name
            documents: List of Langchain Document objects
            embedder: Embedding service instance
            batch_size: Number of documents per batch
            
        Returns:
            Dict with processing statistics
        """
        self.ensure_collection_exists(collection_name)
        
        total_docs = len(documents)
        if total_docs == 0:
            return {"total": 0, "processed": 0, "errors": 0, "batches": 0}
        
        vectorstore = Qdrant(
            client=self.client,
            collection_name=collection_name,
            embedding=embedder
        )
        
        stats = {
            "total": total_docs,
            "processed": 0,
            "errors": 0,
            "batches": 0
        }
        
        num_batches = (total_docs + batch_size - 1) // batch_size
        logger.info(f"Processing {total_docs} documents in {num_batches} batches (size={batch_size})")
        
        for i in range(0, total_docs, batch_size):
            batch = documents[i:i+batch_size]
            batch_num = (i // batch_size) + 1
            stats["batches"] += 1
            
            try:
                # Calculate batch stats
                total_chars = sum(len(doc.page_content) for doc in batch if hasattr(doc, "page_content"))
                avg_chars = total_chars / len(batch) if batch else 0
                
                logger.info(
                    f"Batch {batch_num}/{num_batches}: {len(batch)} docs, "
                    f"{total_chars:,} chars (avg {avg_chars:.0f} chars/doc)"
                )
                
                vectorstore.add_documents(batch)
                stats["processed"] += len(batch)
                
            except Exception as e:
                stats["errors"] += 1
                logger.error(f"Error processing batch {batch_num}/{num_batches}: {str(e)}")
                logger.debug(traceback.format_exc())
        
        success_rate = (stats["processed"] / stats["total"]) * 100 if stats["total"] > 0 else 0
        logger.info(
            f"Document processing complete: {stats['processed']}/{stats['total']} "
            f"documents processed ({success_rate:.1f}%)"
        )
        
        return stats
    
    def delete_by_document_id(self, collection_name: str, document_id: str) -> int:
        """
        Delete all vectors associated with a document ID.
        
        Args:
            collection_name: Collection name
            document_id: Document UUID to delete
            
        Returns:
            Number of points deleted
        """
        logger.info(f"Deleting vectors for document_id={document_id} from collection={collection_name}")
        
        try:
            self.ensure_collection_exists(collection_name)
        except:
            logger.warning(f"Collection '{collection_name}' doesn't exist, nothing to delete")
            return 0
        
        points_to_delete = set()
        offset = None
        
        # Scroll through collection to find matching points
        while True:
            try:
                points, next_offset = self.client.scroll(
                    collection_name=collection_name,
                    offset=offset,
                    limit=100,
                    with_payload=True
                )
                
                for point in points:
                    payload = point.payload or {}
                    root_id = payload.get("doc_id")
                    meta_id = payload.get("metadata", {}).get("doc_id") if isinstance(payload.get("metadata"), dict) else None
                    
                    if root_id == document_id or meta_id == document_id:
                        points_to_delete.add(point.id)
                
                if next_offset is None:
                    break
                offset = next_offset
                
            except Exception as e:
                logger.error(f"Error scrolling collection: {str(e)}")
                raise
        
        deleted_count = len(points_to_delete)
        logger.info(f"Found {deleted_count} points to delete for document_id={document_id}")
        
        if points_to_delete:
            try:
                # Delete by root doc_id
                self.client.delete(
                    collection_name=collection_name,
                    points_selector=rest.Filter(
                        must=[{"key": "doc_id", "match": {"value": document_id}}]
                    )
                )
                
                # Delete by metadata.doc_id
                self.client.delete(
                    collection_name=collection_name,
                    points_selector=rest.Filter(
                        must=[{"key": "metadata.doc_id", "match": {"value": document_id}}]
                    )
                )
                
                logger.info(f"Successfully deleted {deleted_count} points")
            except Exception as e:
                logger.error(f"Failed to delete points: {str(e)}")
                raise
        else:
            logger.warning(f"No points found to delete for document_id={document_id}")
        
        return deleted_count
    
    def count_documents(self, collection_name: str) -> int:
        """
        Count total vectors in a collection.
        
        Args:
            collection_name: Collection name
            
        Returns:
            Number of points in collection
        """
        try:
            self.ensure_collection_exists(collection_name)
            info = self.client.get_collection(collection_name)
            return info.points_count
        except:
            return 0
    
    def list_collections_for_organization(self, organization_id: str) -> List[str]:
        """
        List all collections for an organization.
        
        Args:
            organization_id: Organization UUID
            
        Returns:
            List of collection names
        """
        try:
            all_collections = self.client.get_collections().collections
            org_prefix = f"org_{organization_id}_"
            return [
                col.name for col in all_collections 
                if col.name.startswith(org_prefix)
            ]
        except Exception as e:
            logger.error(f"Error listing collections: {str(e)}")
            return []
    
    def get_organization_stats(self, organization_id: str) -> Dict[str, Any]:
        """
        Get vectorization statistics for an organization.
        
        Args:
            organization_id: Organization UUID
            
        Returns:
            Dict with collection names and vector counts
        """
        collections = self.list_collections_for_organization(organization_id)
        stats = {
            "total_collections": len(collections),
            "collections": {}
        }
        
        total_vectors = 0
        for collection_name in collections:
            count = self.count_documents(collection_name)
            stats["collections"][collection_name] = count
            total_vectors += count
        
        stats["total_vectors"] = total_vectors
        return stats
    
    def purge_collection(self, collection_name: str) -> bool:
        """
        Delete all vectors in a collection.
        
        Args:
            collection_name: Collection to purge
            
        Returns:
            True if successful
        """
        try:
            self.client.delete_collection(collection_name)
            logger.info(f"Purged collection '{collection_name}'")
            return True
        except Exception as e:
            logger.error(f"Failed to purge collection '{collection_name}': {e}")
            return False


# Singleton instance
qdrant_service = QdrantService()
