"""
API endpoints for document vectorization management.
"""

from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from app.core.security import get_current_user_id, verify_user_in_organization
from app.core.supabase import get_supabase
from app.services.vectorization import vectorization_orchestrator
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class VectorizeDocumentRequest(BaseModel):
    """Request model for document vectorization."""
    document_id: str
    force: bool = False


class VectorizeDocumentsRequest(BaseModel):
    """Request model for batch vectorization."""
    document_ids: List[str]
    force: bool = False


class VectorizeDocumentResponse(BaseModel):
    """Response model for document vectorization."""
    success: bool
    message: str
    document_id: str
    num_chunks: Optional[int] = None
    collection_name: Optional[str] = None


@router.post("/vectorize", response_model=VectorizeDocumentResponse)
async def vectorize_document(
    request: VectorizeDocumentRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id)
):
    """
    Vectorize a single document.
    
    Process:
    1. Load and chunk the document
    2. Generate embeddings with OpenAI
    3. Store vectors in Qdrant collection (per organization and document type)
    4. Update document status in database
    
    The process runs in the background. Check document.vectorization_status for progress.
    """
    logger.info(f"Vectorization requested by user {user_id} for document {request.document_id}")
    
    # Verify document exists and user has access
    supabase = get_supabase()
    try:
        doc_result = supabase.table("documents").select(
            "id, organization_id, title"
        ).eq("id", request.document_id).execute()
        
        if not doc_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        document = doc_result.data[0]
        organization_id = document["organization_id"]
        
        # Verify user is in organization
        verify_user_in_organization(user_id, organization_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying document access: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify document access"
        )
    
    # Run vectorization in background
    def vectorize_in_background():
        try:
            result = vectorization_orchestrator.vectorize_document(
                request.document_id,
                force=request.force
            )
            if result["success"]:
                logger.info(f"Vectorization completed: {request.document_id}")
            else:
                logger.error(f"Vectorization failed: {result.get('error')}")
        except Exception as e:
            logger.error(f"Background vectorization error: {e}")
    
    background_tasks.add_task(vectorize_in_background)
    
    return VectorizeDocumentResponse(
        success=True,
        message="Vectorization started in background. Check document status for progress.",
        document_id=request.document_id
    )


@router.post("/vectorize/sync", response_model=VectorizeDocumentResponse)
async def vectorize_document_sync(
    request: VectorizeDocumentRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Vectorize a document synchronously (wait for completion).
    
    Use this for testing or when immediate result is needed.
    May take several minutes for large documents.
    """
    logger.info(f"Sync vectorization requested for document {request.document_id}")
    
    # Verify document access
    supabase = get_supabase()
    try:
        doc_result = supabase.table("documents").select(
            "id, organization_id"
        ).eq("id", request.document_id).execute()
        
        if not doc_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        organization_id = doc_result.data[0]["organization_id"]
        verify_user_in_organization(user_id, organization_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying document access: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify document access"
        )
    
    # Run vectorization synchronously
    try:
        result = vectorization_orchestrator.vectorize_document(
            request.document_id,
            force=request.force
        )
        
        if result["success"]:
            return VectorizeDocumentResponse(
                success=True,
                message="Document vectorized successfully",
                document_id=request.document_id,
                num_chunks=result.get("num_chunks"),
                collection_name=result.get("collection_name")
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Vectorization failed")
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Vectorization error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vectorization failed: {str(e)}"
        )


@router.post("/vectorize/batch")
async def vectorize_documents_batch(
    request: VectorizeDocumentsRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id)
):
    """
    Vectorize multiple documents in batch.
    
    Runs in background. Check individual document statuses for progress.
    """
    logger.info(f"Batch vectorization requested: {len(request.document_ids)} documents")
    
    # Verify all documents exist and user has access
    supabase = get_supabase()
    try:
        docs_result = supabase.table("documents").select(
            "id, organization_id"
        ).in_("id", request.document_ids).execute()
        
        if not docs_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No documents found"
            )
        
        # Verify access to all organizations
        organizations = set(doc["organization_id"] for doc in docs_result.data)
        for org_id in organizations:
            verify_user_in_organization(user_id, org_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying documents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify document access"
        )
    
    # Run batch vectorization in background
    def vectorize_batch_in_background():
        try:
            result = vectorization_orchestrator.vectorize_documents_batch(
                request.document_ids,
                force=request.force
            )
            logger.info(f"Batch vectorization complete: {result}")
        except Exception as e:
            logger.error(f"Batch vectorization error: {e}")
    
    background_tasks.add_task(vectorize_batch_in_background)
    
    return {
        "success": True,
        "message": f"Batch vectorization started for {len(request.document_ids)} documents",
        "document_ids": request.document_ids
    }


@router.delete("/document/{document_id}/vectors")
async def delete_document_vectors(
    document_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Delete all vectors for a document from Qdrant.
    
    This does not delete the document itself, only its vector embeddings.
    """
    logger.info(f"Vector deletion requested for document {document_id}")
    
    # Verify document access
    supabase = get_supabase()
    try:
        doc_result = supabase.table("documents").select(
            "id, organization_id, title"
        ).eq("id", document_id).execute()
        
        if not doc_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        organization_id = doc_result.data[0]["organization_id"]
        verify_user_in_organization(user_id, organization_id)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify document access"
        )
    
    # Delete vectors
    try:
        success = vectorization_orchestrator.delete_document_vectors(document_id)
        
        if success:
            return {
                "success": True,
                "message": f"Vectors deleted for document {document_id}"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete vectors"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Vector deletion error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete vectors: {str(e)}"
        )


@router.get("/stats/{organization_id}")
async def get_vectorization_stats(
    organization_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get vectorization statistics for an organization.
    
    Returns:
    - Document counts by vectorization status
    - Qdrant collection stats (vector counts per collection)
    """
    # Verify user is in organization
    verify_user_in_organization(user_id, organization_id)
    
    try:
        stats = vectorization_orchestrator.get_vectorization_stats(organization_id)
        return stats
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        )


@router.post("/organization/{organization_id}/vectorize-all")
async def vectorize_all_documents(
    organization_id: str,
    background_tasks: BackgroundTasks,
    force: bool = False,
    user_id: str = Depends(get_current_user_id)
):
    """
    Vectorize all documents in an organization that aren't already vectorized.
    
    Runs in background. Use /stats endpoint to monitor progress.
    """
    # Verify user is in organization
    verify_user_in_organization(user_id, organization_id)
    
    # Get all non-vectorized documents
    supabase = get_supabase()
    try:
        if force:
            # Vectorize all documents
            docs_result = supabase.table("documents").select(
                "id"
            ).eq("organization_id", organization_id).execute()
        else:
            # Only vectorize documents that are not vectorized
            docs_result = supabase.table("documents").select(
                "id"
            ).eq("organization_id", organization_id).neq(
                "vectorization_status", "vectorized"
            ).execute()
        
        if not docs_result.data:
            return {
                "success": True,
                "message": "No documents to vectorize",
                "count": 0
            }
        
        document_ids = [doc["id"] for doc in docs_result.data]
        
    except Exception as e:
        logger.error(f"Error fetching documents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch documents"
        )
    
    # Run batch vectorization in background
    def vectorize_all_in_background():
        try:
            result = vectorization_orchestrator.vectorize_documents_batch(
                document_ids,
                force=force
            )
            logger.info(f"Organization vectorization complete: {result}")
        except Exception as e:
            logger.error(f"Organization vectorization error: {e}")
    
    background_tasks.add_task(vectorize_all_in_background)
    
    return {
        "success": True,
        "message": f"Started vectorization of {len(document_ids)} documents",
        "count": len(document_ids)
    }
