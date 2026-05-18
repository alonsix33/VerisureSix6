import json
import logging
import re

from anthropic import AsyncAnthropic
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from backend.settings import settings
from backend.services.rag_service import rag_service

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "Eres el Sheriff de seguridad del hogar de Alonso en Lima, Perú.\n"
    "Tu trabajo es analizar eventos de seguridad y decidir si son anómalos.\n"
    "Responde SOLO en JSON con esta estructura:\n"
    '{"is_anomalous": bool, "alert_level": "none|low|medium|high|critical", '
    '"reasoning": "explicación breve", '
    '"message": "mensaje para Alonso (si aplica)", '
    '"recommended_action": "descripción"}'
)


class SheriffService:
    def __init__(self):
        anthropic_key = settings.anthropic_api_key.get_secret_value()
        openai_api = settings.openai_api_key.get_secret_value()

        self.claude = AsyncAnthropic(api_key=anthropic_key) if anthropic_key else None
        self.gpt_mini = AsyncOpenAI(api_key=openai_api) if openai_api else None
        self.claude_model = "claude-sonnet-4-20250514"
        self.gpt_model = "gpt-4o-mini"

    def _claude_available(self) -> bool:
        return self.claude is not None

    def _gpt_available(self) -> bool:
        return self.gpt_mini is not None

    async def evaluate_event(
        self, event: dict, db: AsyncSession | None = None, snapshots: list[str] | None = None
    ) -> dict:
        default = {
            "is_anomalous": False,
            "alert_level": "none",
            "reasoning": "Sheriff IA no conectado — modo monitor",
            "message": None,
            "recommended_action": None,
        }

        mode = event.get("sheriff_mode", settings.sheriff_mode)
        if mode == "off":
            return {**default, "reasoning": "Sheriff desactivado"}

        # Paso 1: Triage con GPT-4.5 mini si hay snapshots
        if snapshots and self._gpt_available():
            triage = await self._triage_with_gpt(event, snapshots)
            if not triage.get("needs_review", True):
                default["reasoning"] = triage.get("reasoning", "Descartado por triage visual")
                logger.info(f"Triage GPT: evento {event.get('id','')} descartado")
                return default

        # Paso 2: RAG context
        context_str = ""
        if db is not None:
            try:
                context_str = await rag_service.build_context(event, db)
            except Exception as e:
                logger.warning(f"RAGService error: {e}")
                context_str = "{}"

        # Paso 3: Evaluación con Claude
        if self._claude_available():
            return await self._evaluate_with_claude(event, context_str)

        logger.warning("Sheriff IA: ANTHROPIC_API_KEY no configurada")
        return default

        return default

    async def _triage_with_gpt(self, event: dict, snapshots: list[str]) -> dict:
        try:
            content = [{"type": "text", "text": (
                "Eres un asistente de seguridad. Analiza esta imagen de una cámara de vigilancia.\n"
                "Responde SOLO en JSON:\n"
                '{"needs_review": bool, "reasoning": "explicación breve", '
                '"confidence": 0.0-1.0}'
            )}]
            for snap in snapshots[:3]:
                content.append({"type": "image_url", "image_url": {"url": snap}})

            response = await self.gpt_mini.chat.completions.create(
                model=self.gpt_model,
                max_tokens=150,
                temperature=0.1,
                messages=[{"role": "user", "content": content}],
            )
            text = response.choices[0].message.content or "{}"
            return self._parse_json_response(text)
        except Exception as e:
            logger.error(f"GPT triage error: {e}")
            return {"needs_review": True, "reasoning": f"Error en triage: {e}", "confidence": 0.0}

    @staticmethod
    def _parse_json_response(text: str) -> dict:
        cleaned = text.strip()
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
        if match:
            cleaned = match.group(1).strip()
        return json.loads(cleaned)

    async def _evaluate_with_claude(self, event: dict, context_str: str) -> dict:
        default = {
            "is_anomalous": False,
            "alert_level": "none",
            "reasoning": "Error en evaluación",
            "message": None,
            "recommended_action": None,
        }

        user_message = (
            f"EVENTO ACTUAL:\n"
            f"- Dispositivo: {event.get('device_name', event.get('device_id', 'desconocido'))}\n"
            f"- Zona: {event.get('zone', 'desconocida')}\n"
            f"- Tipo: {event.get('event_type', 'desconocido')}\n"
            f"- Timestamp: {event.get('timestamp', 'desconocido')}\n\n"
            f"CONTEXTO DEL SISTEMA:\n{context_str}\n\n"
            f"Analiza este evento con el contexto proporcionado. "
            f"Decide si es anómalo y qué nivel de alerta merece."
        )

        try:
            response = await self.claude.messages.create(
                model=self.claude_model,
                max_tokens=500,
                system=[
                    {
                        "type": "text",
                        "text": SYSTEM_PROMPT,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
                messages=[{"role": "user", "content": user_message}],
            )
            text = response.content[0].text if response.content else "{}"
            return self._parse_json_response(text)
        except json.JSONDecodeError as e:
            logger.error(f"Claude response parse error: {e}, raw: {text[:200]}")
            return {**default, "reasoning": f"Error parseando respuesta: {e}"}
        except Exception as e:
            logger.error(f"Claude evaluation error: {e}")
            return {**default, "reasoning": f"Error al evaluar: {e}"}

    async def chat(self, message: str, conversation_history: list | None = None) -> str:
        if not self._claude_available():
            return (
                "Sheriff IA no disponible. Configura ANTHROPIC_API_KEY en el .env "
                "y reinicia el servidor."
            )

        messages = list(conversation_history or [])
        messages.append({"role": "user", "content": message})

        try:
            response = await self.claude.messages.create(
                model=self.claude_model,
                max_tokens=1000,
                system=[{"type": "text", "text": SYSTEM_PROMPT}],
                messages=messages,
            )
            return response.content[0].text if response.content else ""
        except Exception as e:
            logger.error(f"Sheriff chat error: {e}")
            return f"Error al procesar mensaje: {e}"


sheriff_service = SheriffService()
