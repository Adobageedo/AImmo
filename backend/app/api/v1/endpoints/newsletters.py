from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter()

# Mock data
MOCK_NEWSLETTERS = [
    {
        "id": "1",
        "title": "Bienvenue sur AImmo",
        "content": "Découvrez les nouvelles fonctionnalités de votre tableau de bord.",
        "published_at": datetime.now().isoformat(),
        "author": "L'équipe AImmo",
        "read": False
    }
]

@router.get("/")
async def list_newsletters(organization_id: Optional[str] = None):
    return MOCK_NEWSLETTERS

@router.get("/latest")
async def get_latest_newsletter(organization_id: Optional[str] = None):
    if MOCK_NEWSLETTERS:
        return MOCK_NEWSLETTERS[0]
    raise HTTPException(status_code=404, detail="No newsletters found")

@router.post("/subscribe")
async def subscribe_newsletter(email: str):
    return {"status": "subscribed", "email": email}

@router.post("/unsubscribe")
async def unsubscribe_newsletter(email: str):
    return {"status": "unsubscribed", "email": email}
