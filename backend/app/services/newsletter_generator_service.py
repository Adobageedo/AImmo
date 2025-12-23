"""
Newsletter generation service for jurisprudence with modern, mobile-optimized HTML templates.
"""

from typing import List, Dict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class NewsletterGeneratorService:
    """Service for generating modern, mobile-optimized HTML newsletters."""
    
    def generate_html_newsletter(
        self,
        grouped_articles: Dict[str, List[Dict[str, str]]],
        period_start: str,
        period_end: str
    ) -> str:
        """
        Generate a modern, mobile-optimized HTML newsletter.
        
        Args:
            grouped_articles: Dict mapping theme names to article lists
            period_start: Start date (YYYY-MM-DD)
            period_end: End date (YYYY-MM-DD)
            
        Returns:
            Complete HTML newsletter content
        """
        total_articles = sum(len(articles) for articles in grouped_articles.values())
        
        html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Newsletter Jurisprudence Immobilière</title>
    <style>
        /* Reset and base styles */
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a202c;
            background-color: #f7fafc;
            padding: 0;
            margin: 0;
        }}
        
        /* Container */
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }}
        
        /* Header */
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
        }}
        
        .header-icon {{
            font-size: 48px;
            margin-bottom: 16px;
        }}
        
        .header h1 {{
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            line-height: 1.2;
        }}
        
        .header-subtitle {{
            font-size: 16px;
            opacity: 0.95;
            margin-bottom: 12px;
        }}
        
        .header-date {{
            font-size: 14px;
            opacity: 0.85;
            background-color: rgba(255, 255, 255, 0.2);
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            margin-top: 8px;
        }}
        
        /* Theme navigation tags */
        .theme-nav {{
            background-color: #f7fafc;
            padding: 20px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
        }}
        
        .theme-nav-title {{
            font-size: 14px;
            color: #718096;
            margin-bottom: 12px;
            font-weight: 500;
        }}
        
        .theme-tags {{
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
        }}
        
        .theme-tag {{
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
        }}
        
        .theme-tag:hover {{
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }}
        
        /* Content */
        .content {{
            padding: 32px 20px;
        }}
        
        .intro {{
            background-color: #edf2f7;
            border-left: 4px solid #667eea;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 32px;
        }}
        
        .intro-text {{
            font-size: 16px;
            color: #2d3748;
            line-height: 1.7;
        }}
        
        .intro-highlight {{
            font-weight: 600;
            color: #667eea;
        }}
        
        /* Theme sections */
        .theme-section {{
            margin-bottom: 40px;
        }}
        
        .theme-header {{
            background: linear-gradient(to right, #f7fafc, #edf2f7);
            border-left: 5px solid #667eea;
            padding: 16px 20px;
            margin-bottom: 24px;
            border-radius: 8px;
        }}
        
        .theme-title {{
            font-size: 22px;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 4px;
        }}
        
        .theme-description {{
            font-size: 14px;
            color: #718096;
        }}
        
        /* Article cards */
        .article {{
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }}
        
        .article:hover {{
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
            border-color: #667eea;
        }}
        
        .article-number {{
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 14px;
            font-weight: 700;
            padding: 6px 12px;
            border-radius: 20px;
            margin-bottom: 12px;
        }}
        
        .article-title {{
            font-size: 20px;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 16px;
            line-height: 1.3;
        }}
        
        .article-meta {{
            font-size: 13px;
            color: #a0aec0;
            margin-bottom: 16px;
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
        }}
        
        .article-meta-item {{
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }}
        
        /* Impact section - always visible */
        .impact-section {{
            padding: 16px;
            margin-bottom: 16px;
        }}
        
        .impact-section h3 {{
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        
        .impact-section p {{
            font-size: 15px;
            line-height: 1.7;
            margin: 0;
        }}
        
        /* Collapsible details section */
        .details-toggle {{
            background-color: #edf2f7;
            border: 1px solid #cbd5e0;
            border-radius: 8px;
            padding: 12px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            transition: all 0.3s ease;
        }}
        
        .details-toggle:hover {{
            background-color: #e2e8f0;
        }}
        
        .details-toggle-text {{
            font-size: 14px;
            font-weight: 600;
            color: #4a5568;
        }}
        
        .details-toggle-icon {{
            font-size: 18px;
            color: #667eea;
            transition: transform 0.3s ease;
        }}
        
        .details-content {{
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }}
        
        .details-content.open {{
            max-height: 1000px;
        }}
        
        .details-section {{
            background-color: #f7fafc;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 12px;
        }}
        
        .details-section h4 {{
            font-size: 15px;
            font-weight: 600;
            color: #4a5568;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
        }}
        
        .details-section p {{
            font-size: 14px;
            color: #4a5568;
            line-height: 1.7;
            margin: 0;
        }}
        
        .read-more-btn {{
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            margin-top: 16px;
            transition: all 0.3s ease;
        }}
        
        .read-more-btn:hover {{
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }}
        
        /* Footer */
        .footer {{
            background-color: #f7fafc;
            padding: 32px 20px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }}
        
        .footer-text {{
            font-size: 13px;
            color: #718096;
            line-height: 1.6;
            margin-bottom: 16px;
        }}
        
        .footer-branding {{
            font-size: 14px;
            font-weight: 600;
            color: #667eea;
        }}
        
        /* Mobile responsive */
        @media only screen and (max-width: 600px) {{
            .header h1 {{
                font-size: 24px;
            }}
            
            .header-subtitle {{
                font-size: 14px;
            }}
            
            .content {{
                padding: 24px 16px;
            }}
            
            .article {{
                padding: 20px 16px;
            }}
            
            .article-title {{
                font-size: 16px;
            }}
            
            .theme-title {{
                font-size: 20px;
            }}
            
            .read-more-btn {{
                display: block;
                text-align: center;
            }}
            
            .theme-tags {{
                gap: 8px;
            }}
            
            .theme-tag {{
                font-size: 12px;
                padding: 6px 12px;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="header-icon">⚖️</div>
            <h1>Newsletter Jurisprudence Immobilière</h1>
            <p class="header-subtitle">Les décisions qui comptent pour votre patrimoine</p>
            <div class="header-date">
                📅 {datetime.now().strftime('%d %B %Y')}
            </div>
        </div>
        
        <!-- Theme Navigation -->
        <div class="theme-nav">
            <div class="theme-nav-title">📑 Accès rapide par thème</div>
            <div class="theme-tags">
"""
        
        # Generate theme navigation tags
        for theme_name in grouped_articles.keys():
            # Create anchor-friendly ID from theme name
            theme_id = theme_name.lower().replace(' ', '-').replace('📌', '').replace('📰', '').replace('🏠', '').replace('⚖️', '').replace('🔧', '').strip()
            html += f'                <a href="#theme-{theme_id}" class="theme-tag">{theme_name}</a>\n'
        
        html += """            </div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <!-- Intro -->
            <div class="intro">
                <p class="intro-text">
                    Bonjour,<br><br>
                    Cette semaine, nous avons identifié <span class="intro-highlight">{total_articles} nouvelles décisions</span> 
                    importantes en matière immobilière. Découvrez ci-dessous les dernières jurisprudences 
                    qui peuvent impacter vos investissements et votre gestion de patrimoine.
                </p>
            </div>
"""
        
        # Add themed sections
        article_counter = 1
        for theme_name, articles in grouped_articles.items():
            # Create anchor-friendly ID
            theme_id = theme_name.lower().replace(' ', '-').replace('📌', '').replace('📰', '').replace('🏠', '').replace('⚖️', '').replace('🔧', '').strip()
            
            html += f"""
            <!-- Theme: {theme_name} -->
            <div class="theme-section" id="theme-{theme_id}">
                <div class="theme-header">
                    <div class="theme-title">{theme_name}</div>
                    <div class="theme-description">{len(articles)} décision{'s' if len(articles) > 1 else ''}</div>
                </div>
"""
            
            for article in articles:
                legifrance_url = f"https://www.legifrance.gouv.fr/juri/id/{article['id']}"
                
                # Extract summary parts (now it's a dict)
                summary = article.get('summary', {})
                if isinstance(summary, dict):
                    catchy_title = summary.get('catchy_title', article['title'])
                    facts = summary.get('facts', '')
                    decision = summary.get('decision', '')
                    impact = summary.get('impact', '')
                else:
                    # Fallback for old format
                    catchy_title = article['title']
                    facts = ''
                    decision = ''
                    impact = str(summary)
                
                html += f"""
                <div class="article">
                    <span class="article-number">Décision #{article_counter}</span>
                    <h2 class="article-title">{catchy_title}</h2>
                    <div class="article-meta">
                        <span class="article-meta-item">
                            📅 {article.get('date_decision', 'N/A')}
                        </span>
                        <span class="article-meta-item">
                            🔗 Réf: {article['id'][:12]}...
                        </span>
                    </div>
                    
                    <!-- Impact pratique - always visible -->
                    <div class="impact-section">
                        <h3>💡 Impact pratique</h3>
                        <p>{impact}</p>
                    </div>
                    
                    <!-- Collapsible details -->
                    <div class="details-toggle" onclick="toggleDetails('details-{article_counter}')">
                        <span class="details-toggle-text">📖 Voir les détails (faits et décision)</span>
                        <span class="details-toggle-icon" id="icon-{article_counter}">▼</span>
                    </div>
                    
                    <div class="details-content" id="details-{article_counter}">
                        <div class="details-section">
                            <h4>📋 Les faits</h4>
                            <p>{facts}</p>
                        </div>
                        <div class="details-section">
                            <h4>⚖️ La décision</h4>
                            <p>{decision}</p>
                        </div>
                    </div>
                    
                    <a href="{legifrance_url}" class="read-more-btn">
                        📖 Consulter sur Légifrance →
                    </a>
                </div>
"""
                article_counter += 1
            
            html += """
            </div>
"""
        
        html += f"""
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p class="footer-text">
                Cette newsletter est générée automatiquement à partir des décisions de jurisprudence publiées sur Légifrance.<br>
                Les résumés sont créés par intelligence artificielle et doivent être vérifiés auprès des sources officielles.
            </p>
            <p class="footer-branding">
                AImmo - Gestion Intelligente de Patrimoine Immobilier
            </p>
        </div>
    </div>
    
    <script>
        function toggleDetails(id) {{
            const content = document.getElementById(id);
            const icon = document.getElementById('icon-' + id.replace('details-', ''));
            
            if (content.classList.contains('open')) {{
                content.classList.remove('open');
                icon.textContent = '▼';
            }} else {{
                content.classList.add('open');
                icon.textContent = '▲';
            }}
        }}
    </script>
</body>
</html>
"""
        
        return html


# Singleton instance
newsletter_generator_service = NewsletterGeneratorService()
