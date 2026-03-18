from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from uuid import UUID

from app.schemas.ocr import (
    DocumentProcessing,
    ProcessingRequest,
    ValidationRequest,
    EntityCreationResult,
)
from app.core.security import get_current_user_id
from app.core.constants import OCRProvider
from app.services.processing_service import processing_service

router = APIRouter()


import logging
logger = logging.getLogger("app")

@router.post("/process", response_model=DocumentProcessing, status_code=status.HTTP_201_CREATED)
async def process_document(
    request: ProcessingRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Lance le traitement OCR + Parsing d'un document"""
    logger.info(f"API: Received process request for doc {request.document_id} by user {user_id}")
    result = await processing_service.process_document(
        document_id=request.document_id,
        organization_id=request.organization_id,
        user_id=UUID(user_id),
        ocr_provider=request.ocr_provider,
        force_reprocess=request.force_reprocess,
    )
    return result


@router.get("/{processing_id}", response_model=DocumentProcessing)
async def get_processing(
    processing_id: UUID,
    user_id: str = Depends(get_current_user_id),
):
    """Récupère les résultats d'un traitement"""
    processing = processing_service.get_processing(processing_id)
    
    if not processing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Traitement non trouvé"
        )
    
    return processing


@router.get("/document/{document_id}", response_model=DocumentProcessing)
async def get_processing_by_document(
    document_id: UUID,
    user_id: str = Depends(get_current_user_id),
):
    """Récupère le traitement d'un document"""
    processing = processing_service.get_processing_by_document(document_id)
    
    if not processing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun traitement trouvé pour ce document"
        )
    
    return processing


@router.post("/validate", response_model=EntityCreationResult)
async def validate_and_create(
    request: ValidationRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Valide les données extraites et crée les entités (propriété, locataire, bail)"""
    result = await processing_service.validate_and_create_entities(
        processing_id=request.processing_id,
        organization_id=request.organization_id,
        user_id=UUID(user_id),
        validated_data=request.validated_data,
        create_entities=request.create_entities,
    )
    return result
