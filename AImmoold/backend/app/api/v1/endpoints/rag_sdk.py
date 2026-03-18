"""
RAG SDK Endpoints - Routes de recherche documentaire multi-sources
Support RAG avec RLS (Row-Level Security) et filtres avancés
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional

from app.core.security import get_current_user_id
from app.core.supabase import get_supabase_client
from app.schemas.chat_sdk import (
    RAGSearchRequest,
    RAGSearchResponse,
    SourceType,
)
from app.services.rag.rag_sdk_service import (
    search_rag_sources,
    index_document_chunks,
    delete_document_chunks,
    set_document_exclusion,
    get_rag_stats,
)


router = APIRouter()


# ============================================
# RECHERCHE RAG MULTI-SOURCES
# ============================================

@router.post("/search", response_model=RAGSearchResponse)
async def search_rag(
    request: RAGSearchRequest,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Recherche multi-sources avec RAG
    
    - Vectorise la requête avec OpenAI embeddings
    - Recherche dans Qdrant avec filtres
    - Applique RLS (Row-Level Security) via Supabase
    - Retourne chunks pertinents avec scores
    
    Sources supportées:
    - documents: Documents uploadés
    - leases: Baux et contrats
    - properties: Propriétés et biens
    - kpis: KPIs et métriques
    - tenants: Informations locataires
    - owners: Informations propriétaires
    """
        
    # Vérifier l'appartenance à l'organisation
    member_check = supabase.table("organization_users").select("id").eq(
        "organization_id", request.organization_id
    ).eq("user_id", user_id).execute()
    
    if not member_check.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization"
        )
    
    # Recherche RAG
    from datetime import datetime
    start_time = datetime.now()
    
    results = await search_rag_sources(
        query=request.query,
        organization_id=request.organization_id,
        source_types=request.source_types,
        document_ids=request.document_ids,
        limit=request.limit,
        min_score=request.min_score,
        supabase=supabase,
    )
    
    processing_time = (datetime.now() - start_time).total_seconds() * 1000
    
    return RAGSearchResponse(
        results=results,
        total=len(results),
        query=request.query,
        processing_time_ms=int(processing_time),
    )


# ============================================
# INDEXATION DOCUMENTS
# ============================================

@router.post("/index/document/{document_id}")
async def index_document(
    document_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Indexe un document dans le RAG
    
    - Récupère le document depuis Supabase
    - Découpe en chunks avec overlap
    - Vectorise avec OpenAI
    - Stocke dans Qdrant
    """
        
    # Récupérer le document
    doc_response = supabase.table("documents").select("*").eq(
        "id", document_id
    ).single().execute()
    
    if not doc_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    document = doc_response.data
    
    # Vérifier l'appartenance à l'organisation
    member_check = supabase.table("organization_users").select("id").eq(
        "organization_id", document["organization_id"]
    ).eq("user_id", user_id).execute()
    
    if not member_check.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization"
        )
    
    # Récupérer le contenu (extracted_text ou content)
    content = document.get("extracted_text") or document.get("content") or ""
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document has no content to index"
        )
    
    # Indexer
    chunks_count = await index_document_chunks(
        document_id=document_id,
        organization_id=document["organization_id"],
        source_type=SourceType.DOCUMENTS,
        source_id=document_id,
        document_title=document.get("title", "Untitled"),
        content=content,
        metadata={
            "file_name": document.get("file_name"),
            "file_type": document.get("file_type"),
            "uploaded_at": document.get("created_at"),
        },
    )
    
    # Mettre à jour le statut du document
    supabase.table("documents").update({
        "is_indexed": True,
        "indexed_at": datetime.utcnow().isoformat(),
        "chunks_count": chunks_count,
    }).eq("id", document_id).execute()
    
    return {
        "document_id": document_id,
        "chunks_indexed": chunks_count,
        "status": "indexed",
    }


@router.post("/index/lease/{lease_id}")
async def index_lease(
    lease_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Indexe un bail dans le RAG
    
    - Récupère les informations du bail
    - Construit un texte structuré
    - Indexe dans Qdrant
    """
        
    # Récupérer le bail
    lease_response = supabase.table("leases").select("*").eq(
        "id", lease_id
    ).single().execute()
    
    if not lease_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lease not found"
        )
    
    lease = lease_response.data
    
    # Vérifier l'appartenance
    member_check = supabase.table("organization_users").select("id").eq(
        "organization_id", lease["organization_id"]
    ).eq("user_id", user_id).execute()
    
    if not member_check.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization"
        )
    
    # Construire le contenu textuel
    content = f"""
    Bail: {lease.get('reference', 'Sans référence')}
    
    Propriété: {lease.get('property_id', 'Non spécifié')}
    Locataire: {lease.get('tenant_id', 'Non spécifié')}
    
    Dates:
    - Début: {lease.get('start_date', 'Non spécifié')}
    - Fin: {lease.get('end_date', 'Non spécifié')}
    
    Loyer:
    - Montant: {lease.get('rent_amount', 0)} {lease.get('currency', 'EUR')}
    - Charges: {lease.get('charges_amount', 0)} {lease.get('currency', 'EUR')}
    - Dépôt de garantie: {lease.get('deposit_amount', 0)} {lease.get('currency', 'EUR')}
    
    Statut: {lease.get('status', 'Non spécifié')}
    
    Notes: {lease.get('notes', 'Aucune note')}
    """
    
    # Indexer
    chunks_count = await index_document_chunks(
        document_id=lease_id,
        organization_id=lease["organization_id"],
        source_type=SourceType.LEASES,
        source_id=lease_id,
        document_title=f"Bail {lease.get('reference', lease_id[:8])}",
        content=content,
        metadata={
            "property_id": lease.get("property_id"),
            "tenant_id": lease.get("tenant_id"),
            "start_date": lease.get("start_date"),
            "end_date": lease.get("end_date"),
            "status": lease.get("status"),
        },
    )
    
    return {
        "lease_id": lease_id,
        "chunks_indexed": chunks_count,
        "status": "indexed",
    }


@router.post("/index/property/{property_id}")
async def index_property(
    property_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Indexe une propriété dans le RAG
    """
        
    # Récupérer la propriété
    prop_response = supabase.table("properties").select("*").eq(
        "id", property_id
    ).single().execute()
    
    if not prop_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    prop = prop_response.data
    
    # Vérifier l'appartenance
    member_check = supabase.table("organization_users").select("id").eq(
        "organization_id", prop["organization_id"]
    ).eq("user_id", user_id).execute()
    
    if not member_check.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization"
        )
    
    # Construire le contenu
    content = f"""
    Propriété: {prop.get('name', 'Sans nom')}
    
    Adresse:
    {prop.get('address', '')}
    {prop.get('city', '')}, {prop.get('postal_code', '')}
    {prop.get('country', '')}
    
    Type: {prop.get('property_type', 'Non spécifié')}
    Surface: {prop.get('surface', 0)} m²
    Pièces: {prop.get('rooms', 0)}
    
    Valeur: {prop.get('purchase_price', 0)} {prop.get('currency', 'EUR')}
    
    Description: {prop.get('description', 'Aucune description')}
    """
    
    # Indexer
    chunks_count = await index_document_chunks(
        document_id=property_id,
        organization_id=prop["organization_id"],
        source_type=SourceType.PROPERTIES,
        source_id=property_id,
        document_title=prop.get('name', f"Propriété {property_id[:8]}"),
        content=content,
        metadata={
            "property_type": prop.get("property_type"),
            "city": prop.get("city"),
            "surface": prop.get("surface"),
            "rooms": prop.get("rooms"),
        },
    )
    
    return {
        "property_id": property_id,
        "chunks_indexed": chunks_count,
        "status": "indexed",
    }


# ============================================
# GESTION DES CHUNKS
# ============================================

@router.delete("/index/document/{document_id}")
async def delete_document_index(
    document_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Supprime l'indexation d'un document
    """
        
    # Vérifier l'appartenance
    doc_response = supabase.table("documents").select("organization_id").eq(
        "id", document_id
    ).single().execute()
    
    if doc_response.data:
        member_check = supabase.table("organization_users").select("id").eq(
            "organization_id", doc_response.data["organization_id"]
        ).eq("user_id", user_id).execute()
        
        if not member_check.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
    
    # Supprimer les chunks
    chunks_deleted = await delete_document_chunks(document_id)
    
    # Mettre à jour le document
    if doc_response.data:
        supabase.table("documents").update({
            "is_indexed": False,
            "indexed_at": None,
            "chunks_count": 0,
        }).eq("id", document_id).execute()
    
    return {
        "document_id": document_id,
        "chunks_deleted": chunks_deleted,
        "status": "deleted",
    }


@router.post("/exclude/{document_id}")
async def exclude_document(
    document_id: str,
    excluded: bool = Query(True, description="Exclude (true) or include (false)"),
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Exclut ou inclut un document du RAG (sans supprimer les chunks)
    """
        
    # Vérifier l'appartenance
    doc_response = supabase.table("documents").select("organization_id").eq(
        "id", document_id
    ).single().execute()
    
    if not doc_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    member_check = supabase.table("organization_users").select("id").eq(
        "organization_id", doc_response.data["organization_id"]
    ).eq("user_id", user_id).execute()
    
    if not member_check.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Mettre à jour l'exclusion
    chunks_affected = await set_document_exclusion(document_id, excluded)
    
    return {
        "document_id": document_id,
        "is_excluded": excluded,
        "chunks_affected": chunks_affected,
    }


# ============================================
# STATISTIQUES
# ============================================

@router.get("/stats/{organization_id}")
async def get_organization_stats(
    organization_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase = Depends(get_supabase_client),
):
    """
    Récupère les statistiques RAG d'une organisation
    
    - Nombre total de chunks indexés
    - Répartition par type de source
    - Chunks exclus
    """
        
    # Vérifier l'appartenance
    member_check = supabase.table("organization_users").select("id").eq(
        "organization_id", organization_id
    ).eq("user_id", user_id).execute()
    
    if not member_check.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this organization"
        )
    
    # Récupérer les stats
    stats = await get_rag_stats(organization_id)
    
    return stats
