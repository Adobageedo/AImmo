"""
Complete jurisprudence newsletter service that orchestrates fetching, analysis, and saving to Supabase.
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
from app.services.legifrance_service import legifrance_service
from app.services.jurisprudence_ai_service import jurisprudence_ai_service
from app.services.newsletter_generator_service import newsletter_generator_service
from app.core.supabase import get_supabase
import logging

logger = logging.getLogger(__name__)


class JurisprudenceNewsletterService:
    """Service for generating and saving jurisprudence newsletters."""
    
    def __init__(self):
        self.legifrance = legifrance_service
        self.ai_service = jurisprudence_ai_service
        self.generator = newsletter_generator_service
    
    def _article_exists_in_db(self, article_id: str) -> bool:
        """Check if article has already been processed."""
        supabase = get_supabase()
        
        try:
            result = supabase.table("jurisprudence_articles").select("id").eq(
                "legifrance_id", article_id
            ).execute()
            
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error checking article existence: {e}")
            return False
    
    def _save_article(self, article: Dict, is_real_estate: bool, summary: Optional[str] = None):
        """Save processed article to database."""
        supabase = get_supabase()
        
        try:
            data = {
                "legifrance_id": article["id"],
                "title": article["title"],
                "decision_date": article["date_decision"],
                "is_real_estate": is_real_estate,
                "summary": summary,
                "created_at": datetime.now().isoformat()
            }
            
            supabase.table("jurisprudence_articles").upsert(data).execute()
            logger.info(f"Saved article {article['id']} (real_estate: {is_real_estate})")
            
        except Exception as e:
            logger.error(f"Error saving article {article['id']}: {e}")
    
    def process_articles(
        self,
        start_date: str,
        end_date: str,
        max_results: int = 50
    ) -> List[Dict[str, str]]:
        """
        Fetch and process articles from Legifrance.
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            max_results: Maximum number of articles to fetch
            
        Returns:
            List of processed real estate articles with summaries
        """
        logger.info(f"Processing articles from {start_date} to {end_date}")
        
        # Fetch articles from Legifrance
        articles = self.legifrance.search_by_date_range(start_date, end_date, max_results)
        logger.info(f"Fetched {len(articles)} articles from Legifrance")
        
        real_estate_articles = []
        
        for i, article in enumerate(articles, 1):
            article_id = article['id']
            title = article['title']
            text = article['clean_text']
            
            logger.info(f"[{i}/{len(articles)}] Processing: {title[:80]}...")
            
            # Skip if already processed
            if self._article_exists_in_db(article_id):
                logger.info(f"  Already processed, skipping")
                continue
            
            # Check if article is about real estate
            try:
                is_real_estate = self.ai_service.is_real_estate_article(title, text)
            except Exception as e:
                logger.error(f"  Error in AI detection: {e}")
                continue
            
            if not is_real_estate:
                logger.info(f"  Not about real estate")
                self._save_article(article, False, None)
                continue
            
            logger.info(f"  ✅ Real estate article detected!")
            
            # Generate summary (now returns a dict)
            try:
                summary_dict = self.ai_service.create_mobile_optimized_summary(title, text)
                logger.info(f"  Summary generated with catchy title: {summary_dict.get('catchy_title', 'N/A')}")
                
                # Convert dict to JSON string for database storage
                import json
                summary_json = json.dumps(summary_dict, ensure_ascii=False)
            except Exception as e:
                logger.error(f"  Error generating summary: {e}")
                summary_dict = {
                    "catchy_title": title,
                    "facts": "Erreur lors de la génération du résumé.",
                    "decision": "",
                    "impact": ""
                }
                summary_json = json.dumps(summary_dict, ensure_ascii=False)
            
            # Save to database (as JSON string)
            self._save_article(article, True, summary_json)
            
            # Add to results (as dict for template)
            real_estate_articles.append({
                "id": article_id,
                "title": title,
                "date_decision": article['date_decision'],
                "summary": summary_dict  # Pass dict to template
            })
        
        logger.info(f"Processed {len(real_estate_articles)} new real estate articles")
        return real_estate_articles
    
    def generate_newsletter(
        self,
        start_date: str,
        end_date: str,
        newsletter_id: str
    ) -> Optional[str]:
        """
        Generate complete newsletter and save to Supabase.
        
        Args:
            start_date: Period start date (YYYY-MM-DD)
            end_date: Period end date (YYYY-MM-DD)
            newsletter_id: UUID of the newsletter in Supabase
            
        Returns:
            UUID of created edition or None if failed
        """
        logger.info(f"Generating newsletter for period {start_date} to {end_date}")
        
        # Process articles
        articles = self.process_articles(start_date, end_date)
        
        if not articles:
            logger.warning("No new real estate articles found for this period")
            return None
        
        logger.info(f"Found {len(articles)} articles, creating dynamic themes...")
        
        # Group by dynamic themes using AI
        try:
            grouped_articles = self.ai_service.group_by_dynamic_themes(articles)
            logger.info(f"Created {len(grouped_articles)} themes")
        except Exception as e:
            logger.error(f"Error in theming: {e}, using single theme")
            grouped_articles = {"📰 Actualités immobilières": articles}
        
        # Generate HTML newsletter
        try:
            html_content = self.generator.generate_html_newsletter(
                grouped_articles,
                start_date,
                end_date
            )
            logger.info(f"Generated HTML newsletter ({len(html_content)} chars)")
        except Exception as e:
            logger.error(f"Error generating HTML: {e}")
            return None
        
        # Save edition to Supabase
        try:
            supabase = get_supabase()
            
            edition_data = {
                "newsletter_id": newsletter_id,
                "title": f"Jurisprudence immobilière - {datetime.now().strftime('%d/%m/%Y')}",
                "content": html_content,
                "published_at": datetime.now().isoformat(),
                "created_at": datetime.now().isoformat()
            }
            
            result = supabase.table("newsletter_editions").insert(edition_data).execute()
            
            if result.data:
                edition_id = result.data[0]['id']
                logger.info(f"Newsletter edition created successfully: {edition_id}")
                return edition_id
            else:
                logger.error("Failed to create newsletter edition")
                return None
                
        except Exception as e:
            logger.error(f"Error saving newsletter to Supabase: {e}")
            return None
    
    def run_weekly_job(self, newsletter_id: str, lookback_days: int = 7) -> Optional[str]:
        """
        Run the complete weekly newsletter generation job.
        
        Args:
            newsletter_id: UUID of the newsletter in Supabase
            lookback_days: Number of days to look back
            
        Returns:
            UUID of created edition or None if failed
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(days=lookback_days)
        
        start_str = start_date.strftime('%Y-%m-%d')
        end_str = end_date.strftime('%Y-%m-%d')
        
        logger.info(f"Running weekly newsletter job: {start_str} to {end_str}")
        
        return self.generate_newsletter(start_str, end_str, newsletter_id)


# Singleton instance
jurisprudence_newsletter_service = JurisprudenceNewsletterService()
