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
