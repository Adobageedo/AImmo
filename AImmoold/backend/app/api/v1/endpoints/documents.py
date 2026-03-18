from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from typing import List, Optional
from uuid import UUID

from app.schemas.document import (
    Document,
    DocumentUpdate,
    DocumentUploadResponse,
    OrganizationQuota,
)
from app.core.security import get_current_user_id
from app.core.constants import DocumentType
from app.services.document_service import document_service

router = APIRouter()


@router.get("/quota", response_model=OrganizationQuota)
async def get_quota(
    organization_id: UUID = Query(..., description="Organization ID"),
    user_id: str = Depends(get_current_user_id),
):
    return document_service.get_organization_quota(organization_id)


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    organization_id: UUID = Form(...),
    title: str = Form(...),
    document_type: DocumentType = Form(DocumentType.AUTRE),
    folder_path: str = Form("/"),
    description: Optional[str] = Form(None),
    property_id: Optional[UUID] = Form(None),
    lease_id: Optional[UUID] = Form(None),
    tags: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user_id),
):
    file_type = document_service.validate_file(file, organization_id)
    
    storage_path = document_service.generate_storage_path(
        organization_id,
        folder_path,
        file.filename
    )
    
    await document_service.upload_to_storage(file, storage_path)
    
    tags_list = tags.split(",") if tags else []
    tags_list = [tag.strip() for tag in tags_list if tag.strip()]
    
    file_size = file.size or 0
    
    document_meta = document_service.create_document_metadata(
        title=title,
        file_path=storage_path,
        file_type=file_type,
        file_size=file_size,
        organization_id=organization_id,
        user_id=UUID(user_id),
        document_type=document_type.value,
        folder_path=folder_path,
        description=description,
        property_id=property_id,
        lease_id=lease_id,
        tags=tags_list,
    )
    
    public_url = document_service.get_public_url(storage_path)
    
    return DocumentUploadResponse(
        document=Document(**document_meta),
        storage_path=storage_path,
        public_url=public_url
    )


@router.get("/", response_model=List[Document])
async def list_documents(
    organization_id: UUID = Query(..., description="Organization ID"),
    folder_path: Optional[str] = Query(None),
    document_type: Optional[DocumentType] = Query(None),
    property_id: Optional[UUID] = Query(None),
    lease_id: Optional[UUID] = Query(None),
    user_id: str = Depends(get_current_user_id),
):
    documents = document_service.list_documents(
        organization_id=organization_id,
        folder_path=folder_path,
        document_type=document_type.value if document_type else None,
        property_id=property_id,
        lease_id=lease_id,
    )
    
    return [Document(**doc) for doc in documents]


@router.get("/{document_id}", response_model=Document)
async def get_document(
    document_id: UUID,
    organization_id: UUID = Query(..., description="Organization ID"),
    user_id: str = Depends(get_current_user_id),
):
    document = document_service.get_document(document_id, organization_id)
    return Document(**document)


@router.put("/{document_id}", response_model=Document)
async def update_document(
    document_id: UUID,
    organization_id: UUID = Query(..., description="Organization ID"),
    update_data: DocumentUpdate = None,
    user_id: str = Depends(get_current_user_id),
):
    update_dict = update_data.model_dump(exclude_unset=True)
    
    if "document_type" in update_dict and update_dict["document_type"]:
        update_dict["document_type"] = update_dict["document_type"].value
    
    document = document_service.update_document(
        document_id,
        organization_id,
        update_dict
    )
    
    return Document(**document)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    organization_id: UUID = Query(..., description="Organization ID"),
    user_id: str = Depends(get_current_user_id),
):
    document_service.delete_document(document_id, organization_id)
    return None


@router.get("/{document_id}/download-url")
async def get_download_url(
    document_id: UUID,
    organization_id: UUID = Query(..., description="Organization ID"),
    user_id: str = Depends(get_current_user_id),
):
    document = document_service.get_document(document_id, organization_id)
    url = document_service.get_public_url(document["file_path"])
    
    return {
        "document_id": document_id,
        "filename": document["title"],
        "download_url": url
    }
