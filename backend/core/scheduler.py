"""
Scheduler for automated tasks like weekly newsletter generation.
Uses APScheduler for reliable task scheduling.
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging
import os
from dotenv import load_dotenv

# Import services
from services.jurisprudence.jurisprudence_newsletter_service import jurisprudence_newsletter_service

load_dotenv()

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
        # Generate newsletter (looks back last month - 30 days)
        logger.info("Starting newsletter generation for last month...")
        newsletter_id = os.getenv("JURISPRUDENCE_NEWSLETTER_ID")
        if not newsletter_id:
            logger.error("Newsletter ID not configured - set JURISPRUDENCE_NEWSLETTER_ID")
            return
        
        edition_id = jurisprudence_newsletter_service.run_weekly_job(
            newsletter_id=newsletter_id,
            lookback_days=30
        )
        
        if edition_id:
            logger.info(f"✅ Newsletter generated successfully: {edition_id}")
            # TODO: Send emails to subscribed users
            await send_newsletter_to_subscribers(edition_id)
        else:
            logger.info("ℹ️  No new articles found this month")
            
    except Exception as e:
        logger.error(f"❌ Error in scheduled newsletter generation: {e}")
        import traceback
        traceback.print_exc()
    
    logger.info("=" * 70)
    logger.info(f"🏁 JOB COMPLETED - {datetime.now()}")
    logger.info("=" * 70 + "\n")


async def send_newsletter_to_subscribers(edition_id: str):
    """
    Send newsletter to all subscribed users.
    This is a placeholder for email sending functionality.
    """
    logger.info(f"📧 Sending newsletter {edition_id} to subscribers...")
    
    # TODO: Implement email sending logic
    # 1. Fetch all subscribed users
    # 2. Generate personalized emails
    # 3. Send via email service (Resend, SendGrid, etc.)
    
    logger.info("📧 Email sending not yet implemented - placeholder")


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
    logger.info("📅 Next newsletter generation: Every Monday at 9:00 AM (covers last 30 days)")


def stop_scheduler():
    """Stop the scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")
