"""
API endpoints for jurisprudence newsletter generation.
"""

from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from app.core.security import get_current_user_id
from app.core.supabase import get_supabase
from app.services.jurisprudence_newsletter_service import jurisprudence_newsletter_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class GenerateNewsletterRequest(BaseModel):
    """Request model for newsletter generation."""
    lookback_days: Optional[int] = 7
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class GenerateNewsletterResponse(BaseModel):
    """Response model for newsletter generation."""
    success: bool
    message: str
    edition_id: Optional[str] = None


def _get_jurisprudence_newsletter_id() -> str:
    """Get the Jurisprudence newsletter ID from Supabase."""
    supabase = get_supabase()
    
    try:
        result = supabase.table("newsletters").select("id").eq(
            "slug", "jurisprudence-immobiliere"
        ).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Jurisprudence newsletter not found in database. Please run initialization script."
            )
        
        return result.data[0]["id"]
    except Exception as e:
        logger.error(f"Error fetching newsletter ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch newsletter configuration"
        )


@router.post("/generate", response_model=GenerateNewsletterResponse)
async def generate_jurisprudence_newsletter(
    request: GenerateNewsletterRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
):
    """
    Generate a new jurisprudence newsletter edition.
    
    This endpoint triggers the complete workflow:
    1. Fetch articles from Legifrance API
    2. Analyze with AI to detect real estate cases
    3. Generate summaries for each article
    4. Group by dynamic themes using LLM
    5. Create HTML newsletter
    6. Save to Supabase newsletter_editions table
    
    The process runs in the background and may take several minutes.
    """
    logger.info(f"Newsletter generation requested by user {user_id}")
    
    # Get newsletter ID
    newsletter_id = _get_jurisprudence_newsletter_id()
    
    # Calculate date range
    if request.start_date and request.end_date:
        start_date = request.start_date
        end_date = request.end_date
    else:
        end = datetime.now()
        start = end - timedelta(days=request.lookback_days)
        start_date = start.strftime('%Y-%m-%d')
        end_date = end.strftime('%Y-%m-%d')
    
    # Run generation in background
    def generate_in_background():
        try:
            edition_id = jurisprudence_newsletter_service.generate_newsletter(
                start_date,
                end_date,
                newsletter_id
            )
            
            if edition_id:
                logger.info(f"Newsletter generation completed: {edition_id}")
            else:
                logger.warning("Newsletter generation completed but no edition created (no articles found)")
        except Exception as e:
            logger.error(f"Error in background newsletter generation: {e}")
    
    background_tasks.add_task(generate_in_background)
    
    return GenerateNewsletterResponse(
        success=True,
        message=f"Newsletter generation started for period {start_date} to {end_date}. This may take several minutes.",
        edition_id=None
    )


@router.post("/generate/sync", response_model=GenerateNewsletterResponse)
async def generate_jurisprudence_newsletter_sync(
    request: GenerateNewsletterRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Generate a new jurisprudence newsletter edition (synchronous).
    
    Same as /generate but runs synchronously. Use this for testing or when you need
    to wait for the result. May take several minutes to complete.
    """
    logger.info(f"Synchronous newsletter generation requested by user {user_id}")
    
    # Get newsletter ID
    newsletter_id = _get_jurisprudence_newsletter_id()
    
    # Calculate date range
    if request.start_date and request.end_date:
        start_date = request.start_date
        end_date = request.end_date
    else:
        end = datetime.now()
        start = end - timedelta(days=request.lookback_days)
        start_date = start.strftime('%Y-%m-%d')
        end_date = end.strftime('%Y-%m-%d')
    
    try:
        edition_id = jurisprudence_newsletter_service.generate_newsletter(
            start_date,
            end_date,
            newsletter_id
        )
        
        if edition_id:
            return GenerateNewsletterResponse(
                success=True,
                message=f"Newsletter generated successfully for period {start_date} to {end_date}",
                edition_id=edition_id
            )
        else:
            return GenerateNewsletterResponse(
                success=False,
                message="No new articles found for this period",
                edition_id=None
            )
    except Exception as e:
        logger.error(f"Error generating newsletter: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate newsletter: {str(e)}"
        )


@router.get("/stats")
async def get_jurisprudence_stats(
    user_id: str = Depends(get_current_user_id),
):
    """Get statistics about processed jurisprudence articles."""
    supabase = get_supabase()
    
    try:
        # Total articles
        total_result = supabase.table("jurisprudence_articles").select("id", count="exact").execute()
        total = total_result.count or 0
        
        # Real estate articles
        real_estate_result = supabase.table("jurisprudence_articles").select("id", count="exact").eq(
            "is_real_estate", True
        ).execute()
        real_estate = real_estate_result.count or 0
        
        # Get newsletter ID
        newsletter_id = _get_jurisprudence_newsletter_id()
        
        # Editions count
        editions_result = supabase.table("newsletter_editions").select("id", count="exact").eq(
            "newsletter_id", newsletter_id
        ).execute()
        editions = editions_result.count or 0
        
        return {
            "total_articles_processed": total,
            "real_estate_articles": real_estate,
            "other_articles": total - real_estate,
            "newsletter_editions_created": editions,
            "success_rate": f"{(real_estate / total * 100):.1f}%" if total > 0 else "0%"
        }
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch statistics"
        )
