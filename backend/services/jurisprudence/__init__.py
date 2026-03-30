"""
Jurisprudence newsletter services package
"""
from .legifrance_service import LegifranceService
from .jurisprudence_ai_service import JurisprudenceAIService
from .newsletter_generator_service import NewsletterGeneratorService

__all__ = ['LegifranceService', 'JurisprudenceAIService', 'NewsletterGeneratorService']
