"""
RAG Endpoints - Phase 4 Foundation
Indexation et recherche RAG
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app.core.supabase import get_supabase_client
from app.api.v1.endpoints.auth import get_current_user
from app.schemas.rag import (
    IndexDocumentRequest,
    IndexDocumentResponse,
    BulkIndexRequest,
    BulkIndexResponse,
    RAGSearchRequest,
    RAGSearchResponse,
    RAGStats,
    DocumentExclusionRequest,
    DocumentExclusionResponse,
    RAGConfig,
    RAGConfigUpdate,
)
from app.services.rag_service import (
    index_document,
    search_chunks,
    set_document_exclusion,
    get_rag_stats,
)


router = APIRouter()


# ============================================
# Indexation
# ============================================

@router.post("/index", response_model=IndexDocumentResponse)
async def index_single_document(
    request: IndexDocumentRequest,
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase_client),
):
    """
    Indexe un document dans le RAG.
    
    - Découpe le contenu en chunks
    - Vectorise avec OpenAI
    - Stocke dans Qdrant
    """
    # Vérifier que l'utilisateur a accès au document
    doc_response = supabase.table("documents").select("organization_id").eq(
        "id", str(request.document_id)
    ).single().execute()
    
    if not doc_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Vérifier l'appartenance à l'organisation
    org_id = doc_response.data["organization_id"]
    member_check = supabase.table("organization_members").select("id").eq(
        "organization_id", org_id
    ).eq("user_id", current_user["id"]).execute()
    
    if not member_check.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization"
        )
    
    result = await index_document(request, supabase)
    return result


@router.post("/index/bulk", response_model=BulkIndexResponse)
async def index_multiple_documents(
    request: BulkIndexRequest,
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase_client),
):
    """
    Indexe plusieurs documents en batch.
    """
    results = []
    indexed = 0
    failed = 0
    
    for doc_id in request.document_ids:
        # Récupérer le contenu du document
        doc_response = supabase.table("documents").select("*").eq(
            "id", str(doc_id)
        ).single().execute()
        
        if not doc_response.data:
            results.append(IndexDocumentResponse(
                document_id=doc_id,
                status="failed",
                chunks_count=0,
                chunks_indexed=0,
                error_message="Document not found",
            ))
            failed += 1
            continue
        
        # TODO: Récupérer le contenu réel du document (OCR, etc.)
        content = doc_response.data.get("extracted_text", "")
        
        if not content:
            results.append(IndexDocumentResponse(
                document_id=doc_id,
                status="failed",
                chunks_count=0,
                chunks_indexed=0,
                error_message="No content to index",
            ))
            failed += 1
            continue
        
        index_request = IndexDocumentRequest(
            document_id=doc_id,
            content=content,
            metadata={"source_title": doc_response.data.get("title", "")},
        )
        
        result = await index_document(index_request, supabase)
        results.append(result)
        
        if result.status == "indexed":
            indexed += 1
        else:
            failed += 1
    
    return BulkIndexResponse(
        total_documents=len(request.document_ids),
        indexed=indexed,
        failed=failed,
        results=results,
    )


# ============================================
# Recherche
# ============================================

@router.post("/search", response_model=RAGSearchResponse)
async def search_rag(
    request: RAGSearchRequest,
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase_client),
):
    """
    Recherche dans le RAG.
    
    - Vectorise la requête
    - Recherche les chunks similaires dans Qdrant
    - Retourne les résultats avec scores
    """
    # Vérifier l'appartenance à l'organisation
    member_check = supabase.table("organization_members").select("id").eq(
        "organization_id", str(request.organization_id)
    ).eq("user_id", current_user["id"]).execute()
    
    if not member_check.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization"
        )
    
    result = await search_chunks(request)
    return result


# ============================================
# Exclusion de Documents
# ============================================

@router.post("/exclude", response_model=DocumentExclusionResponse)
async def exclude_document(
    request: DocumentExclusionRequest,
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase_client),
):
    """
    Exclut ou inclut un document du RAG.
    """
    # Vérifier l'accès au document
    doc_response = supabase.table("documents").select("organization_id").eq(
        "id", str(request.document_id)
    ).single().execute()
    
    if not doc_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    chunks_affected = await set_document_exclusion(
        request.document_id,
        request.excluded,
    )
    
    return DocumentExclusionResponse(
        document_id=request.document_id,
        is_excluded=request.excluded,
        chunks_affected=chunks_affected,
    )


# ============================================
# Statistiques
# ============================================

@router.get("/stats/{organization_id}", response_model=RAGStats)
async def get_organization_rag_stats(
    organization_id: UUID,
    current_user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase_client),
):
    """
    Récupère les statistiques RAG d'une organisation.
    """
    # Vérifier l'appartenance à l'organisation
    member_check = supabase.table("organization_members").select("id").eq(
        "organization_id", str(organization_id)
    ).eq("user_id", current_user["id"]).execute()
    
    if not member_check.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization"
        )
    
    stats = await get_rag_stats(organization_id)
    return stats
