"""
Scheduler for automated tasks like weekly newsletter generation.
Uses APScheduler for reliable task scheduling.
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
from app.core.supabase import get_supabase
from app.services.newsletter.jurisprudence_newsletter_service import jurisprudence_newsletter_service
import logging

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = AsyncIOScheduler()


async def generate_weekly_jurisprudence_newsletter():
    """
    Scheduled task to generate weekly jurisprudence newsletter.
    Runs every Monday at 9:00 AM.
    """
    logger.info("=" * 70)
    logger.info(f"🤖 WEEKLY JURISPRUDENCE NEWSLETTER JOB - {datetime.now()}")
    logger.info("=" * 70)
    
    try:
        # Get newsletter ID
        supabase = get_supabase()
        result = supabase.table("newsletters").select("id").eq(
            "slug", "jurisprudence-immobiliere"
        ).execute()
        
        if not result.data:
            logger.error("❌ Newsletter not found. Skipping job.")
            return
        
        newsletter_id = result.data[0]["id"]
        
        # Generate newsletter (looks back 7 days)
        logger.info("Starting newsletter generation for last 7 days...")
        edition_id = jurisprudence_newsletter_service.run_weekly_job(
            newsletter_id=newsletter_id,
            lookback_days=7
        )
        
        if edition_id:
            logger.info(f"✅ Newsletter generated successfully: {edition_id}")
        else:
            logger.info("ℹ️  No new articles found this week")
            
    except Exception as e:
        logger.error(f"❌ Error in scheduled newsletter generation: {e}")
        import traceback
        traceback.print_exc()
    
    logger.info("=" * 70)
    logger.info(f"🏁 JOB COMPLETED - {datetime.now()}")
    logger.info("=" * 70 + "\n")


def start_scheduler():
    """
    Start the scheduler with all configured jobs.
    Call this when the application starts.
    """
    if scheduler.running:
        logger.warning("Scheduler already running")
        return
    
    # Add weekly jurisprudence newsletter job
    # Runs every Monday at 9:00 AM
    scheduler.add_job(
        generate_weekly_jurisprudence_newsletter,
        trigger=CronTrigger(day_of_week='mon', hour=9, minute=0),
        id='weekly_jurisprudence_newsletter',
        name='Generate Weekly Jurisprudence Newsletter',
        replace_existing=True,
        max_instances=1,
        misfire_grace_time=3600  # Allow 1 hour grace time
    )
    
    scheduler.start()
    logger.info("✅ Scheduler started successfully")
    logger.info("📅 Next newsletter generation: Every Monday at 9:00 AM")


def stop_scheduler():
    """Stop the scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")
