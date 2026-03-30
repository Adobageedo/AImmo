"""
Pydantic schemas for newsletter functionality
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class NewsletterBase(BaseModel):
    slug: str
    title: str
    description: Optional[str] = None
    theme: str
    frequency: str
    is_active: bool = True


class NewsletterCreate(NewsletterBase):
    pass


class NewsletterUpdate(BaseModel):
    slug: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    theme: Optional[str] = None
    frequency: Optional[str] = None
    is_active: Optional[bool] = None


class Newsletter(NewsletterBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class NewsletterEditionBase(BaseModel):
    newsletter_id: UUID
    title: str
    content: str
    published_at: datetime
    created_at: Optional[datetime] = None


class NewsletterEditionCreate(NewsletterEditionBase):
    pass


class NewsletterEditionUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    published_at: Optional[datetime] = None


class NewsletterEdition(NewsletterEditionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    # Optional fields from database
    organization_id: Optional[UUID] = None
    sent_at: Optional[datetime] = None
    recipient_count: Optional[int] = None
    open_rate: Optional[float] = None
    click_rate: Optional[float] = None
    
    class Config:
        from_attributes = True


class NewsletterSubscriptionBase(BaseModel):
    user_id: UUID
    newsletter_id: UUID
    is_subscribed: bool = True


class NewsletterSubscriptionCreate(BaseModel):
    newsletter_id: UUID


class NewsletterSubscription(NewsletterSubscriptionBase):
    id: UUID
    subscribed_at: datetime
    unsubscribed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class NewsletterWithSubscription(Newsletter):
    is_user_subscribed: bool = False
    subscription_id: Optional[UUID] = None


class NewsletterGenerationRequest(BaseModel):
    lookback_days: Optional[int] = 30
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class NewsletterGenerationResponse(BaseModel):
    success: bool
    edition_id: Optional[str] = None
    message: str
    articles_processed: Optional[int] = None
    generation_time: Optional[float] = None
