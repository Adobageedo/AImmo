"""
Legifrance API client for fetching jurisprudence articles.
Adapted for AImmo backend with Supabase integration.
"""

import requests
import json
import time
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
from pathlib import Path
from datetime import datetime
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class LegifranceService:
    """Service for interacting with the Legifrance API."""
    
    def __init__(self):
        self.client_id = settings.LEGIFRANCE_CLIENT_ID
        self.client_secret = settings.LEGIFRANCE_CLIENT_SECRET
        self.oauth_url = "https://oauth.piste.gouv.fr/api/oauth/token"
        self.search_url = "https://api.piste.gouv.fr/dila/legifrance/lf-engine-app/search"
        self.consult_url = "https://api.piste.gouv.fr/dila/legifrance/lf-engine-app/consult/juri"
        self.token_cache_path = Path("data/legifrance_token_cache.json")
        self._access_token: Optional[str] = None
    
    def _clean_html(self, raw_html: str) -> str:
        """
        Clean HTML content and extract plain text.
        
        Args:
            raw_html: Raw HTML string
            
        Returns:
            Cleaned plain text
        """
        if not raw_html:
            return ""
        
        soup = BeautifulSoup(raw_html, "html.parser")
        text = soup.get_text(separator="\n")
        lines = [line.strip() for line in text.split("\n")]
        return "\n".join([l for l in lines if l])
    
    def _load_cached_token(self) -> Optional[str]:
        """Load access token from cache if valid."""
        if not self.token_cache_path.exists():
            return None
        
        try:
            with open(self.token_cache_path, "r") as f:
                cache = json.load(f)
            
            if time.time() < cache["expires_at"]:
                return cache["access_token"]
        except (json.JSONDecodeError, KeyError):
            pass
        
        return None
    
    def _save_token(self, token: str, expires_in: int):
        """Save access token to cache."""
        self.token_cache_path.parent.mkdir(parents=True, exist_ok=True)
        cache = {
            "access_token": token,
            "expires_at": time.time() + expires_in - 30
        }
        with open(self.token_cache_path, "w") as f:
            json.dump(cache, f)
    
    def _get_access_token(self) -> str:
        """
        Get OAuth access token (from cache or by requesting new one).
        
        Returns:
            Valid access token
            
        Raises:
            requests.HTTPError: If token request fails
        """
        # Try cached token first
        token = self._load_cached_token()
        if token:
            return token
        
        # Request new token
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "scope": "openid"
        }
        
        logger.info("Requesting new Legifrance access token...")
        response = requests.post(self.oauth_url, data=data, headers=headers)
        response.raise_for_status()
        
        token_info = response.json()
        access_token = token_info["access_token"]
        expires_in = token_info.get("expires_in", 3600)
        
        self._save_token(access_token, expires_in)
        logger.info("Legifrance access token obtained successfully")
        return access_token
    
    def _api_post(self, url: str, payload: Dict) -> Dict:
        """
        Make authenticated POST request to Legifrance API.
        
        Args:
            url: API endpoint URL
            payload: Request payload
            
        Returns:
            JSON response as dict
            
        Raises:
            requests.HTTPError: If request fails
        """
        token = self._get_access_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(url, headers=headers, json=payload)
        
        # Retry once if token expired
        if response.status_code in (401, 403):
            logger.warning("Legifrance token expired, refreshing...")
            token = self._get_access_token()
            headers["Authorization"] = f"Bearer {token}"
            response = requests.post(url, headers=headers, json=payload)
        
        response.raise_for_status()
        return response.json()
    
    def get_article_text(self, text_id: str) -> tuple[str, str]:
        """
        Fetch the full text of a jurisprudence article.
        
        Args:
            text_id: Legifrance article ID
            
        Returns:
            Tuple of (article_text, decision_date)
        """
        payload = {"searchedString": "", "textId": text_id}
        data = self._api_post(self.consult_url, payload)
        
        timestamp_ms = data["text"]["dateTexte"]
        date_decision = datetime.fromtimestamp(timestamp_ms / 1000)
        
        raw_html = data.get("text", {})
        clean_text = raw_html.get('texte', '') if isinstance(raw_html, dict) else ''
        
        return clean_text, date_decision.strftime('%Y-%m-%d')
    
    def search_by_date_range(
        self,
        start_date: str,
        end_date: str,
        max_results: int = 100
    ) -> List[Dict[str, str]]:
        """
        Search for jurisprudence decisions within a date range.
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            max_results: Maximum number of results to return
            
        Returns:
            List of articles with keys: id, title, clean_text, date_decision
            
        Raises:
            requests.HTTPError: If API request fails
        """
        payload = {
            "recherche": {
                "champs": [
                    {
                        "criteres": [
                            {
                                "valeur": "",
                                "operateur": "ET",
                                "typeRecherche": "UN_DES_MOTS"
                            }
                        ],
                        "operateur": "ET",
                        "typeChamp": "ALL"
                    }
                ],
                "filtres": [
                    {
                        "facette": "DATE_DECISION",
                        "dates": {
                            "start": start_date,
                            "end": end_date
                        }
                    }
                ],
                "pageSize": max_results,
                "sort": "DATE_DESC",
                "operateur": "ET",
                "typePagination": "DEFAUT"
            },
            "fond": "JURI"
        }
        
        logger.info(f"Searching Legifrance from {start_date} to {end_date}...")
        data = self._api_post(self.search_url, payload)
        results = data.get("results", [])
        
        logger.info(f"Found {len(results)} results")
        
        articles = []
        for doc in results:
            titles = doc.get("titles", [])
            if titles:
                text_id = titles[0].get("id")
                title = titles[0].get("titre") or titles[0].get("titreLong") or ""
                
                # Fetch full text if ID available
                if text_id:
                    try:
                        clean_text, date_decision = self.get_article_text(text_id)
                        articles.append({
                            "id": text_id,
                            "title": title,
                            "clean_text": clean_text,
                            "date_decision": date_decision
                        })
                        time.sleep(0.5)  # Rate limiting
                    except Exception as e:
                        logger.error(f"Error fetching article {text_id}: {e}")
                        continue
        
        logger.info(f"Successfully fetched {len(articles)} articles with full text")
        return articles


# Singleton instance
legifrance_service = LegifranceService()
