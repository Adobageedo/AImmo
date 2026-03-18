from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from uuid import UUID

from app.core.security import get_current_user_id
from app.core.supabase import get_supabase

router = APIRouter()


@router.get("/by-entity")
async def get_documents_by_entity(
    entity_type: str = Query(..., description="Entity type (property, tenant, owner, lease)"),
    entity_id: UUID = Query(..., description="Entity ID"),
    user_id: str = Depends(get_current_user_id),
):
    """Get all documents associated with a specific entity"""
    supabase = get_supabase()
    
    # Get document associations
    associations_result = supabase.table("document_associations").select(
        "document_id, association_type, notes, created_at"
    ).eq("entity_type", entity_type).eq("entity_id", str(entity_id)).execute()
    
    if not associations_result.data:
        return []
    
    # Get document details
    document_ids = [assoc["document_id"] for assoc in associations_result.data]
    documents_result = supabase.table("documents").select("*").in_("id", document_ids).execute()
    
    # Merge association info with document info
    documents_map = {doc["id"]: doc for doc in documents_result.data or []}
    result = []
    
    for assoc in associations_result.data:
        doc_id = assoc["document_id"]
        if doc_id in documents_map:
            doc = documents_map[doc_id].copy()
            doc["association_type"] = assoc.get("association_type")
            doc["association_notes"] = assoc.get("notes")
            doc["association_created_at"] = assoc.get("created_at")
            result.append(doc)
    
    return result


@router.post("/")
async def create_document_association(
    document_id: UUID,
    entity_type: str,
    entity_id: UUID,
    association_type: str = "general",
    notes: str = None,
    user_id: str = Depends(get_current_user_id),
):
    """Create a new document association"""
    supabase = get_supabase()
    
    association_data = {
        "document_id": str(document_id),
        "entity_type": entity_type,
        "entity_id": str(entity_id),
        "association_type": association_type,
        "notes": notes,
        "created_by": user_id,
    }
    
    response = supabase.table("document_associations").insert(association_data).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create document association"
        )
    
    return response.data[0]


@router.delete("/{document_id}/{entity_type}/{entity_id}")
async def delete_document_association(
    document_id: UUID,
    entity_type: str,
    entity_id: UUID,
    user_id: str = Depends(get_current_user_id),
):
    """Delete a document association"""
    supabase = get_supabase()
    
    response = supabase.table("document_associations").delete().eq(
        "document_id", str(document_id)
    ).eq("entity_type", entity_type).eq("entity_id", str(entity_id)).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document association not found"
        )
    
    return {"message": "Document association deleted successfully"}
