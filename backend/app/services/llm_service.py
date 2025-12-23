import json
from typing import Any, Dict, Optional, List, Union
from openai import AsyncOpenAI
from app.core.config import settings
import logging
logger = logging.getLogger("app")

class LLMService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self._client = None

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    @property
    def client(self) -> AsyncOpenAI:
        if not self._client:
            if not self.api_key:
                raise ValueError("OPENAI_API_KEY is not configured")
            self._client = AsyncOpenAI(api_key=self.api_key)
        return self._client

    async def get_completion(
        self,
        prompt: str,
        system_prompt: str = "You are a helpful assistant.",
        model: str = settings.DEFAULT_LLM_MODEL,
        temperature: float = settings.DEFAULT_LLM_TEMPERATURE,
        max_tokens: int = settings.DEFAULT_LLM_MAX_TOKENS,
        response_format: Optional[Dict[str, str]] = None,
    ) -> str:
        """
        Get a completion from the LLM.
        """
        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
            
            kwargs = {
                "model": model,
                "messages": messages,
            }
            
            # Certains modèles (o1, GPT-5?) utilisent max_completion_tokens au lieu de max_tokens
            # et ne supportent pas le paramètre temperature
            is_reasoning_model = "gpt-5" in model.lower() or model.lower().startswith("o1")
            
            if is_reasoning_model:
                kwargs["max_completion_tokens"] = max_tokens
            else:
                kwargs["max_tokens"] = max_tokens
                kwargs["temperature"] = temperature
            
            if response_format:
                kwargs["response_format"] = response_format

            response = await self.client.chat.completions.create(**kwargs)
            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Error calling LLM: {str(e)}")

    async def get_json_completion(
        self,
        prompt: str,
        system_prompt: str = "You are a helpful assistant that only outputs JSON.",
        model: str = settings.DEFAULT_LLM_MODEL,
        temperature: float = settings.DEFAULT_LLM_TEMPERATURE,
        max_tokens: int = settings.DEFAULT_LLM_MAX_TOKENS,
    ) -> Dict[str, Any]:
        """
        Get a JSON completion from the LLM.
        """
        logger.info(f"DEBUG: Running JSON completion with model {model} and temperature {temperature} and max_tokens {max_tokens}...")
        content = await self.get_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"}
        )
        if not content or not content.strip():
            raise Exception("LLM returned an empty response")
            
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            # Log de l'erreur pour débugger
            print(f"DEBUG: Failed to parse JSON. Content starts with: {content[:100]}...", flush=True)
            raise Exception(f"Failed to parse LLM response as JSON: {str(e)}")

llm_service = LLMService()
