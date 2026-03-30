"""
API endpoints for jurisprudence newsletter functionality
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from typing import Optional
import logging
import time
import os
from datetime import datetime, timedelta

from schemas.newsletter import (
    NewsletterGenerationRequest,
    NewsletterGenerationResponse
)
from services.jurisprudence.jurisprudence_newsletter_service import jurisprudence_newsletter_service
from core.scheduler import generate_weekly_jurisprudence_newsletter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/jurisprudence", tags=["jurisprudence"])


@router.post("/generate", response_model=NewsletterGenerationResponse)
async def generate_newsletter_async(
    request: NewsletterGenerationRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate newsletter asynchronously (recommended for production).
    Returns immediately and processes in background.
    """
    try:
        # Add background task
        background_tasks.add_task(
            _generate_newsletter_task,
            request.lookback_days or 7,
            request.start_date,
            request.end_date
        )
        
        return NewsletterGenerationResponse(
            success=True,
            message="Newsletter generation started in background",
            edition_id=None
        )
        
    except Exception as e:
        logger.error(f"Error starting newsletter generation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start newsletter generation: {str(e)}"
        )


@router.post("/generate/sync", response_model=NewsletterGenerationResponse)
async def generate_newsletter_sync(request: NewsletterGenerationRequest):
    """
    Generate newsletter synchronously (for testing/debugging).
    Waits for completion and returns results.
    """
    start_time = time.time()
    
    try:
        # Use the service method that handles auto-detection
        lookback_days = request.lookback_days or 30
        
        logger.info(f"Starting sync newsletter generation for last {lookback_days} days")
        
        # Get newsletter ID from environment
        newsletter_id = os.getenv("JURISPRUDENCE_NEWSLETTER_ID")
        if not newsletter_id:
            raise HTTPException(
                status_code=500,
                detail="Newsletter ID not configured - set JURISPRUDENCE_NEWSLETTER_ID"
            )
        
        # Generate newsletter using the service method
        edition_id = jurisprudence_newsletter_service.run_weekly_job(
            newsletter_id=newsletter_id,
            lookback_days=lookback_days
        )
        
        generation_time = time.time() - start_time
        
        if edition_id:
            return NewsletterGenerationResponse(
                success=True,
                edition_id=edition_id,
                message="Newsletter generated successfully",
                generation_time=generation_time
            )
        else:
            return NewsletterGenerationResponse(
                success=True,
                message="No new articles found for this period",
                edition_id=None,
                generation_time=generation_time
            )
            
    except Exception as e:
        logger.error(f"Error in sync newsletter generation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate newsletter: {str(e)}"
        )


@router.post("/generate/weekly")
async def generate_weekly_newsletter():
    """
    Manually trigger the weekly newsletter generation job.
    Uses the same logic as the scheduled task.
    """
    try:
        await generate_weekly_jurisprudence_newsletter()
        
        return {
            "success": True,
            "message": "Weekly newsletter generation completed"
        }
        
    except Exception as e:
        logger.error(f"Error in weekly newsletter generation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate weekly newsletter: {str(e)}"
        )


@router.get("/stats")
async def get_jurisprudence_stats():
    """
    Get statistics about jurisprudence processing.
    """
    try:
        # TODO: Implement stats collection
        # For now, return placeholder stats
        
        return {
            "total_articles_processed": 0,
            "real_estate_articles": 0,
            "newsletters_generated": 0,
            "last_generation_date": None,
            "success_rate": 0.0,
            "average_processing_time": 0.0,
            "status": "Service active"
        }
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get statistics: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """
    Health check for jurisprudence service.
    """
    try:
        # Check if services are properly configured
        import os
        
        legifrance_configured = bool(
            os.getenv("LEGIFRANCE_CLIENT_ID") and 
            os.getenv("LEGIFRANCE_CLIENT_SECRET")
        )
        
        openai_configured = bool(os.getenv("OPENAI_API_KEY"))
        supabase_configured = bool(
            os.getenv("SUPABASE_URL") and 
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        newsletter_configured = bool(os.getenv("JURISPRUDENCE_NEWSLETTER_ID"))
        
        return {
            "status": "healthy",
            "services": {
                "legifrance": "configured" if legifrance_configured else "not_configured",
                "openai": "configured" if openai_configured else "not_configured",
                "supabase": "configured" if supabase_configured else "not_configured",
                "newsletter": "configured" if newsletter_configured else "not_configured"
            },
            "scheduler": "running" if scheduler.running else "stopped"
        }
        
    except Exception as e:
        logger.error(f"Error in health check: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Health check failed: {str(e)}"
        )


async def _generate_newsletter_task(
    lookback_days: int,
    start_date: Optional[str],
    end_date: Optional[str]
):
    """
    Background task for newsletter generation.
    """
    try:
        newsletter_id = os.getenv("JURISPRUDENCE_NEWSLETTER_ID")
        
        if not newsletter_id:
            logger.error("Newsletter ID not configured for background task")
            return
        
        if start_date and end_date:
            edition_id = jurisprudence_newsletter_service.generate_newsletter(
                start_date=start_date,
                end_date=end_date,
                newsletter_id=newsletter_id
            )
        else:
            edition_id = jurisprudence_newsletter_service.run_weekly_job(
                newsletter_id=newsletter_id,
                lookback_days=lookback_days
            )
        
        if edition_id:
            logger.info(f"Background newsletter generation completed: {edition_id}")
        else:
            logger.info("Background newsletter generation: No new articles found")
            
    except Exception as e:
        logger.error(f"Error in background newsletter generation: {e}")


# Import scheduler for health check
from core.scheduler import scheduler
