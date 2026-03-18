from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter()

# Mock types for response
class AlertType:
    LEASE_ENDING = "lease_ending"
    PAYMENT_LATE = "payment_late"
    INDEXATION_DUE = "indexation_due"

class AlertStatus:
    PENDING = "pending"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"
    SNOOZED = "snoozed"

class AlertPriority:
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

# Mock data store (in-memory for now or empty)
MOCK_ALERTS = []

@router.get("/")
async def list_alerts(
    organization_id: str,
    types: Optional[List[str]] = Query(None),
    statuses: Optional[List[str]] = Query(None)
):
    return MOCK_ALERTS

@router.get("/stats")
async def get_alert_stats(organization_id: str):
    return {
        "total": 0,
        "pending": 0,
        "high_priority": 0,
        "by_type": {}
    }

@router.get("/pending-count")
async def get_pending_count(organization_id: str):
    return {"count": 0}

@router.get("/preferences")
async def get_preferences(organization_id: str):
    return {
        "email_frequency": "daily",
        "email_enabled": True,
        "push_enabled": False,
        "alert_types": {
            "lease_ending": True,
            "payment_late": True,
            "indexation_due": True
        }
    }

@router.put("/preferences")
async def update_preferences(organization_id: str, preferences: dict):
    return preferences

@router.post("/")
async def create_alert(alert: dict):
    new_alert = alert.copy()
    new_alert["id"] = str(uuid.uuid4())
    new_alert["created_at"] = datetime.now().isoformat()
    new_alert["status"] = AlertStatus.PENDING
    MOCK_ALERTS.append(new_alert)
    return new_alert

@router.get("/{alert_id}")
async def get_alert(alert_id: str, organization_id: str):
    for alert in MOCK_ALERTS:
        if alert["id"] == alert_id:
            return alert
    raise HTTPException(status_code=404, detail="Alert not found")

@router.patch("/{alert_id}")
async def update_alert(alert_id: str, organization_id: str, update: dict):
    for alert in MOCK_ALERTS:
        if alert["id"] == alert_id:
            alert.update(update)
            return alert
    raise HTTPException(status_code=404, detail="Alert not found")

@router.delete("/{alert_id}")
async def delete_alert(alert_id: str, organization_id: str):
    global MOCK_ALERTS
    MOCK_ALERTS = [a for a in MOCK_ALERTS if a["id"] != alert_id]
    return {"status": "success"}

@router.patch("/bulk")
async def bulk_update_alerts(update: dict):
    return {"updated": 0, "failed": 0}
