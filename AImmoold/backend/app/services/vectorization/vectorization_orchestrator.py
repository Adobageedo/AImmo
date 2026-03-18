"""
Orchestrator service for document vectorization.
Manages the complete workflow: chunking -> embedding -> storage in Qdrant.
Tracks status in database.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from app.core.supabase import get_supabase
from app.services.vectorization.qdrant_service import qdrant_service
from app.services.vectorization.chunking_service import chunking_service
from app.services.vectorization.embedding_service import embedding_service
import logging
import traceback

logger = logging.getLogger(__name__)


class VectorizationOrchestrator:
    """Orchestrates the complete document vectorization workflow."""
    
    def __init__(self):
        self.qdrant = qdrant_service
        self.chunker = chunking_service
        self.embedder = embedding_service
    
    def _update_document_status(
        self,
        document_id: str,
        status: str,
        error: Optional[str] = None,
        num_chunks: Optional[int] = None,
        collection_name: Optional[str] = None,
        content_hash: Optional[str] = None
    ):
        """Update document vectorization status in database."""
        supabase = get_supabase()
        
        update_data = {
            "vectorization_status": status,
            "updated_at": datetime.now().isoformat()
        }
        
        if status == "in_progress":
            update_data["vectorization_started_at"] = datetime.now().isoformat()
        elif status in ["vectorized", "error"]:
            update_data["vectorization_completed_at"] = datetime.now().isoformat()
        
        if error:
            update_data["vectorization_error"] = error
        if num_chunks is not None:
            update_data["num_chunks"] = num_chunks
        if collection_name:
            update_data["qdrant_collection_name"] = collection_name
        if content_hash:
            update_data["content_hash"] = content_hash
        
        try:
            supabase.table("documents").update(update_data).eq("id", document_id).execute()
            logger.debug(f"Updated document {document_id} status to {status}")
        except Exception as e:
            logger.error(f"Failed to update document status: {e}")
    
    def _create_vectorization_job(
        self,
        document_id: str,
        organization_id: str,
        status: str = "pending"
    ) -> Optional[str]:
        """Create a vectorization job record."""
        supabase = get_supabase()
        
        job_data = {
            "document_id": document_id,
            "organization_id": organization_id,
            "status": status,
            "created_at": datetime.now().isoformat()
        }
        
        if status == "processing":
            job_data["started_at"] = datetime.now().isoformat()
        
        try:
            result = supabase.table("vectorization_jobs").insert(job_data).execute()
            if result.data:
                return result.data[0]["id"]
        except Exception as e:
            logger.error(f"Failed to create vectorization job: {e}")
        
        return None
    
    def _update_vectorization_job(
        self,
        job_id: str,
        status: str,
        error: Optional[str] = None,
        num_chunks_processed: Optional[int] = None
    ):
        """Update vectorization job status."""
        supabase = get_supabase()
        
        update_data = {
            "status": status,
            "updated_at": datetime.now().isoformat()
        }
        
        if status == "completed":
            update_data["completed_at"] = datetime.now().isoformat()
        elif status == "failed":
            update_data["completed_at"] = datetime.now().isoformat()
            if error:
                update_data["error_message"] = error
        
        if num_chunks_processed is not None:
            update_data["num_chunks_processed"] = num_chunks_processed
        
        try:
            supabase.table("vectorization_jobs").update(update_data).eq("id", job_id).execute()
        except Exception as e:
            logger.error(f"Failed to update job status: {e}")
    
    def get_document_file_path(self, document_id: str) -> Optional[Dict[str, Any]]:
        """
        Get document file path and metadata from database.
        
        Returns:
            Dict with file_path, organization_id, document_type, title
        """
        supabase = get_supabase()
        
        try:
            result = supabase.table("documents").select(
                "id, file_path, organization_id, document_type, title, file_type"
            ).eq("id", document_id).execute()
            
            if result.data:
                return result.data[0]
            else:
                logger.error(f"Document {document_id} not found")
                return None
        except Exception as e:
            logger.error(f"Failed to fetch document: {e}")
            return None
    
    def vectorize_document(
        self,
        document_id: str,
        force: bool = False
    ) -> Dict[str, Any]:
        """
        Vectorize a single document.
        
        Args:
            document_id: UUID of document to vectorize
            force: If True, re-vectorize even if already vectorized
            
        Returns:
            Dict with status, num_chunks, collection_name, error
        """
        logger.info(f"Starting vectorization for document {document_id}")
        
        # Get document info
        doc_info = self.get_document_file_path(document_id)
        if not doc_info:
            return {
                "success": False,
                "error": "Document not found",
                "document_id": document_id
            }
        
        organization_id = doc_info["organization_id"]
        file_path = doc_info["file_path"]
        document_type = doc_info.get("document_type", "general")
        title = doc_info.get("title", "Untitled")
        
        # Update status to in_progress
        self._update_document_status(document_id, "in_progress")
        
        # Create vectorization job
        job_id = self._create_vectorization_job(document_id, organization_id, "processing")
        
        try:
            # Compute file hash
            content_hash = chunking_service.compute_file_hash(file_path)
            
            # Get collection name
            collection_name = self.qdrant.get_collection_name(organization_id, document_type)
            
            # Check if already vectorized with same hash
            if not force:
                supabase = get_supabase()
                existing = supabase.table("documents").select(
                    "content_hash, vectorization_status"
                ).eq("id", document_id).execute()
                
                if existing.data and existing.data[0].get("content_hash") == content_hash:
                    if existing.data[0].get("vectorization_status") == "vectorized":
                        logger.info(f"Document {document_id} already vectorized with same content")
                        return {
                            "success": True,
                            "skipped": True,
                            "message": "Document already vectorized",
                            "document_id": document_id
                        }
            
            # Delete existing vectors if re-vectorizing
            if force:
                logger.info(f"Force mode: deleting existing vectors for document {document_id}")
                try:
                    self.qdrant.delete_by_document_id(collection_name, document_id)
                except Exception as e:
                    logger.warning(f"Failed to delete existing vectors: {e}")
            
            # Chunk document
            logger.info(f"Chunking document: {title}")
            metadata = {
                "doc_id": document_id,
                "organization_id": organization_id,
                "document_type": document_type,
                "title": title,
                "file_path": file_path
            }
            
            chunks = self.chunker.chunk_document(file_path, metadata)
            
            if not chunks:
                raise ValueError("No chunks generated from document")
            
            logger.info(f"Generated {len(chunks)} chunks")
            
            # Add to Qdrant
            logger.info(f"Adding chunks to Qdrant collection: {collection_name}")
            stats = self.qdrant.add_documents(
                collection_name=collection_name,
                documents=chunks,
                embedder=self.embedder.embedder,
                batch_size=10
            )
            
            logger.info(f"Vectorization stats: {stats}")
            
            # Update document status
            self._update_document_status(
                document_id=document_id,
                status="vectorized",
                num_chunks=len(chunks),
                collection_name=collection_name,
                content_hash=content_hash
            )
            
            # Update job status
            if job_id:
                self._update_vectorization_job(
                    job_id,
                    "completed",
                    num_chunks_processed=stats["processed"]
                )
            
            logger.info(f"✓ Document {document_id} vectorized successfully")
            
            return {
                "success": True,
                "document_id": document_id,
                "num_chunks": len(chunks),
                "collection_name": collection_name,
                "stats": stats
            }
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"✗ Vectorization failed for document {document_id}: {error_msg}")
            logger.error(traceback.format_exc())
            
            # Update status to error
            self._update_document_status(
                document_id=document_id,
                status="error",
                error=error_msg
            )
            
            # Update job status
            if job_id:
                self._update_vectorization_job(job_id, "failed", error=error_msg)
            
            return {
                "success": False,
                "document_id": document_id,
                "error": error_msg
            }
    
    def vectorize_documents_batch(
        self,
        document_ids: List[str],
        force: bool = False
    ) -> Dict[str, Any]:
        """
        Vectorize multiple documents.
        
        Args:
            document_ids: List of document UUIDs
            force: Force re-vectorization
            
        Returns:
            Dict with summary stats
        """
        logger.info(f"Batch vectorization: {len(document_ids)} documents")
        
        results = {
            "total": len(document_ids),
            "success": 0,
            "failed": 0,
            "skipped": 0,
            "documents": []
        }
        
        for doc_id in document_ids:
            result = self.vectorize_document(doc_id, force=force)
            results["documents"].append(result)
            
            if result["success"]:
                if result.get("skipped"):
                    results["skipped"] += 1
                else:
                    results["success"] += 1
            else:
                results["failed"] += 1
        
        logger.info(
            f"Batch complete: {results['success']} success, "
            f"{results['failed']} failed, {results['skipped']} skipped"
        )
        
        return results
    
    def delete_document_vectors(self, document_id: str) -> bool:
        """
        Delete all vectors for a document.
        
        Args:
            document_id: Document UUID
            
        Returns:
            True if successful
        """
        logger.info(f"Deleting vectors for document {document_id}")
        
        # Get document info to find collection
        doc_info = self.get_document_file_path(document_id)
        if not doc_info:
            logger.error(f"Document {document_id} not found")
            return False
        
        organization_id = doc_info["organization_id"]
        document_type = doc_info.get("document_type", "general")
        collection_name = self.qdrant.get_collection_name(organization_id, document_type)
        
        try:
            deleted_count = self.qdrant.delete_by_document_id(collection_name, document_id)
            
            # Update document status
            self._update_document_status(
                document_id=document_id,
                status="not_planned",
                num_chunks=0
            )
            
            logger.info(f"✓ Deleted {deleted_count} vectors for document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete vectors: {e}")
            return False
    
    def get_vectorization_stats(self, organization_id: str) -> Dict[str, Any]:
        """
        Get vectorization statistics for an organization.
        
        Args:
            organization_id: Organization UUID
            
        Returns:
            Dict with statistics
        """
        supabase = get_supabase()
        
        try:
            # Count documents by status
            result = supabase.table("documents").select(
                "vectorization_status", count="exact"
            ).eq("organization_id", organization_id).execute()
            
            # Group by status
            status_counts = {}
            for status in ["not_planned", "planned", "in_progress", "vectorized", "error", "waiting"]:
                count_result = supabase.table("documents").select(
                    "id", count="exact"
                ).eq("organization_id", organization_id).eq("vectorization_status", status).execute()
                status_counts[status] = count_result.count or 0
            
            # Get Qdrant stats
            qdrant_stats = self.qdrant.get_organization_stats(organization_id)
            
            return {
                "organization_id": organization_id,
                "document_counts": status_counts,
                "qdrant": qdrant_stats
            }
            
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {
                "organization_id": organization_id,
                "error": str(e)
            }


# Singleton instance
vectorization_orchestrator = VectorizationOrchestrator()
