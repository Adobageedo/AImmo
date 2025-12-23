from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from uuid import UUID
from datetime import datetime
from app.core.security import get_current_user_id
from app.core.supabase import get_supabase
from app.schemas.newsletter import (
    Newsletter,
    NewsletterWithSubscription,
    NewsletterEdition,
    NewsletterSubscription,
    NewsletterSubscriptionCreate,
)

router = APIRouter()


@router.get("/", response_model=List[NewsletterWithSubscription])
async def get_newsletters(
    user_id: str = Depends(get_current_user_id),
):
    """Get all active newsletters with user subscription status"""
    supabase = get_supabase()
    
    # Get active newsletters
    newsletters_response = supabase.table("newsletters").select("*").eq(
        "is_active", True
    ).order("created_at", desc=False).execute()
    
    if not newsletters_response.data:
        return []
    
    newsletters = newsletters_response.data
    
    # Get user subscriptions
    subscriptions_response = supabase.table("newsletter_subscriptions").select("*").eq(
        "user_id", user_id
    ).execute()
    
    subscriptions_map = {
        sub["newsletter_id"]: sub 
        for sub in (subscriptions_response.data or [])
    }
    
    # Merge data
    result = []
    for newsletter in newsletters:
        sub = subscriptions_map.get(newsletter["id"])
        result.append({
            **newsletter,
            "is_user_subscribed": sub["is_subscribed"] if sub else False,
            "subscription_id": sub["id"] if sub else None,
        })
    
    return result


@router.get("/{newsletter_id}", response_model=NewsletterWithSubscription)
async def get_newsletter(
    newsletter_id: UUID,
    user_id: str = Depends(get_current_user_id),
):
    """Get a specific newsletter with user subscription status"""
    supabase = get_supabase()
    
    # Get newsletter
    newsletter_response = supabase.table("newsletters").select("*").eq(
        "id", str(newsletter_id)
    ).eq("is_active", True).execute()
    
    if not newsletter_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Newsletter not found"
        )
    
    newsletter = newsletter_response.data[0]
    
    # Get user subscription
    subscription_response = supabase.table("newsletter_subscriptions").select("*").eq(
        "user_id", user_id
    ).eq("newsletter_id", str(newsletter_id)).execute()
    
    sub = subscription_response.data[0] if subscription_response.data else None
    
    return {
        **newsletter,
        "is_user_subscribed": sub["is_subscribed"] if sub else False,
        "subscription_id": sub["id"] if sub else None,
    }


@router.get("/{newsletter_id}/last-edition", response_model=NewsletterEdition)
async def get_last_edition(
    newsletter_id: UUID,
    user_id: str = Depends(get_current_user_id),
):
    """Get the last published edition of a newsletter"""
    supabase = get_supabase()
    
    # Verify newsletter exists and is active
    newsletter_response = supabase.table("newsletters").select("id").eq(
        "id", str(newsletter_id)
    ).eq("is_active", True).execute()
    
    if not newsletter_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Newsletter not found"
        )
    
    # Get last edition
    edition_response = supabase.table("newsletter_editions").select("*").eq(
        "newsletter_id", str(newsletter_id)
    ).order("published_at", desc=True).limit(1).execute()
    
    if not edition_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No edition found for this newsletter"
        )
    
    return edition_response.data[0]


@router.get("/{newsletter_id}/editions", response_model=List[NewsletterEdition])
async def get_editions(
    newsletter_id: UUID,
    user_id: str = Depends(get_current_user_id),
    limit: int = 10,
):
    """Get all editions of a newsletter"""
    supabase = get_supabase()
    
    # Verify newsletter exists and is active
    newsletter_response = supabase.table("newsletters").select("id").eq(
        "id", str(newsletter_id)
    ).eq("is_active", True).execute()
    
    if not newsletter_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Newsletter not found"
        )
    
    # Get editions
    editions_response = supabase.table("newsletter_editions").select("*").eq(
        "newsletter_id", str(newsletter_id)
    ).order("published_at", desc=True).limit(limit).execute()
    
    return editions_response.data or []


@router.post("/{newsletter_id}/subscribe", response_model=NewsletterSubscription)
async def subscribe_to_newsletter(
    newsletter_id: UUID,
    user_id: str = Depends(get_current_user_id),
):
    """Subscribe to a newsletter"""
    supabase = get_supabase()
    
    # Verify newsletter exists and is active
    newsletter_response = supabase.table("newsletters").select("id").eq(
        "id", str(newsletter_id)
    ).eq("is_active", True).execute()
    
    if not newsletter_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Newsletter not found"
        )
    
    # Check if subscription exists
    existing_sub = supabase.table("newsletter_subscriptions").select("*").eq(
        "user_id", user_id
    ).eq("newsletter_id", str(newsletter_id)).execute()
    
    if existing_sub.data:
        # Update existing subscription
        update_response = supabase.table("newsletter_subscriptions").update({
            "is_subscribed": True,
            "subscribed_at": datetime.now().isoformat(),
            "unsubscribed_at": None,
        }).eq("id", existing_sub.data[0]["id"]).execute()
        
        return update_response.data[0]
    else:
        # Create new subscription
        insert_response = supabase.table("newsletter_subscriptions").insert({
            "user_id": user_id,
            "newsletter_id": str(newsletter_id),
            "is_subscribed": True,
        }).execute()
        
        return insert_response.data[0]


@router.post("/{newsletter_id}/unsubscribe", response_model=NewsletterSubscription)
async def unsubscribe_from_newsletter(
    newsletter_id: UUID,
    user_id: str = Depends(get_current_user_id),
):
    """Unsubscribe from a newsletter"""
    supabase = get_supabase()
    
    # Get subscription
    subscription_response = supabase.table("newsletter_subscriptions").select("*").eq(
        "user_id", user_id
    ).eq("newsletter_id", str(newsletter_id)).execute()
    
    if not subscription_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    # Update subscription
    update_response = supabase.table("newsletter_subscriptions").update({
        "is_subscribed": False,
        "unsubscribed_at": datetime.now().isoformat(),
    }).eq("id", subscription_response.data[0]["id"]).execute()
    
    return update_response.data[0]
