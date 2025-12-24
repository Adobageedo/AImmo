from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    organizations,
    properties,
    owners,
    conversations,
    documents,
    document_associations,
    processing,
    rag,
    chat,
    dashboard,
    tenants,
    leases,
    alerts,
    newsletters,
    jurisprudence,
    vectorization,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(properties.router, prefix="/properties", tags=["properties"])
api_router.include_router(owners.router, prefix="/owners", tags=["owners"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(leases.router, prefix="/leases", tags=["leases"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(document_associations.router, prefix="/document-associations", tags=["document-associations"])
api_router.include_router(processing.router, prefix="/processing", tags=["processing"])
api_router.include_router(rag.router, prefix="/rag", tags=["rag"])
api_router.include_router(chat.public_router, prefix="/chat", tags=["chat-public"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(newsletters.router, prefix="/newsletters", tags=["newsletters"])
# api_router.include_router(jurisprudence.router, prefix="/jurisprudence", tags=["jurisprudence"])
# api_router.include_router(vectorization.router, prefix="/vectorization", tags=["vectorization"])

