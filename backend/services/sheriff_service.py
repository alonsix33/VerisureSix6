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
    "El hogar tiene sensores PIR Verisure y cámara Tapo C420 en el balcón.\n"
    "Modos del sistema: casa (alguien en casa), fuera (casa vacía), "
    "noche (todos durmiendo), viaje (nadie por días).\n"
    "Cuando evalúes un evento, responde SOLO en JSON con esta estructura:\n"
    '{"is_anomalous": bool, "alert_level": "none|low|medium|high|critical", '
    '"reasoning": "explicación breve en español", '
    '"message": "mensaje para Alonso si aplica, null si no hay alerta", '
    '"recommended_action": "acción recomendada o null"}\n'
    "Para el chat, responde en lenguaje natural en español. Sé conciso y útil."
)

COMPLEX_KEYWORDS = [
    "reporte", "resumen", "semana", "mes", "patrón", "tendencia", "análisis",
    "estadísticas", "gráfico", "comparar", "historial completo", "cuántos en total",
    "report", "summary", "pattern", "trend", "analysis", "statistics",
]


class SheriffService:
    def __init__(self):
        anthropic_key = settings.anthropic_api_key.get_secret_value()
        openai_key = settings.openai_api_key.get_secret_value()

        self.claude = AsyncAnthropic(api_key=anthropic_key) if anthropic_key else None
        self.gpt = AsyncOpenAI(api_key=openai_key) if openai_key else None

        self.haiku_model = "claude-haiku-4-5-20251001"
        self.sonnet_model = "claude-sonnet-4-6"
        self.gpt_model = "gpt-4o-mini"

    def _claude_available(self) -> bool:
        return self.claude is not None

    def _gpt_available(self) -> bool:
        return self.gpt is not None

    def _is_complex(self, message: str) -> bool:
        lower = message.lower()
        return any(kw in lower for kw in COMPLEX_KEYWORDS) or len(message) > 300

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

        # Paso 1: Triage visual con GPT si hay snapshots
        if snapshots and self._gpt_available():
            triage = await self._triage_with_gpt(event, snapshots)
            if not triage.get("needs_review", True):
                return {**default, "reasoning": triage.get("reasoning", "Descartado por triage visual")}

        # Paso 2: RAG context
        context_str = "{}"
        if db is not None:
            try:
                context_str = await rag_service.build_context(event, db)
            except Exception as e:
                logger.warning(f"RAGService error: {e}")

        # Paso 3: Evaluación con Claude Haiku
        if self._claude_available():
            return await self._evaluate_with_claude(event, context_str, self.haiku_model)

        logger.warning("Sheriff IA: ANTHROPIC_API_KEY no configurada")
        return default

    async def chat_with_meta(
        self, message: str, conversation_history: list | None = None
    ) -> tuple[str, str | None, int | None]:
        """Returns (response_text, model_used, tokens_used)."""
        if not self._claude_available():
            return (
                "Sheriff IA no disponible. Configura ANTHROPIC_API_KEY en el .env y reinicia el servidor.",
                None,
                None,
            )

        model = self.sonnet_model if self._is_complex(message) else self.haiku_model
        messages = list(conversation_history or [])
        messages.append({"role": "user", "content": message})

        try:
            response = await self.claude.messages.create(
                model=model,
                max_tokens=1500,
                system=[{
                    "type": "text",
                    "text": SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }],
                messages=messages,
            )
            text = response.content[0].text if response.content else ""
            tokens = response.usage.input_tokens + response.usage.output_tokens if response.usage else None
            return text, model, tokens
        except Exception as e:
            logger.error(f"Sheriff chat error: {e}")
            return f"Error al procesar mensaje: {e}", model, None

    async def chat(self, message: str, conversation_history: list | None = None) -> str:
        text, _, _ = await self.chat_with_meta(message, conversation_history)
        return text

    async def generate_weekly_report(self, context_str: str = "") -> str:
        if not self._claude_available():
            return "Sheriff IA no disponible para generar reporte."

        prompt = (
            f"Genera un reporte semanal de seguridad del hogar basado en estos datos:\n\n"
            f"{context_str}\n\n"
            "El reporte debe incluir: resumen ejecutivo, eventos destacados, patrones detectados, "
            "recomendaciones para la próxima semana. Formato markdown, en español."
        )

        try:
            response = await self.claude.messages.create(
                model=self.sonnet_model,
                max_tokens=2000,
                system=[{
                    "type": "text",
                    "text": SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }],
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text if response.content else ""
        except Exception as e:
            logger.error(f"Weekly report error: {e}")
            return f"Error generando reporte: {e}"

    async def _triage_with_gpt(self, event: dict, snapshots: list[str]) -> dict:
        try:
            content = [{"type": "text", "text": (
                "Eres un asistente de seguridad. Analiza esta imagen de una cámara de vigilancia.\n"
                "Responde SOLO en JSON: "
                '{"needs_review": bool, "reasoning": "explicación breve", "confidence": 0.0}'
            )}]
            for snap in snapshots[:3]:
                content.append({"type": "image_url", "image_url": {"url": snap}})

            response = await self.gpt.chat.completions.create(
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

    async def _evaluate_with_claude(self, event: dict, context_str: str, model: str) -> dict:
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
            "Analiza este evento. Decide si es anómalo y qué nivel de alerta merece."
        )

        try:
            response = await self.claude.messages.create(
                model=model,
                max_tokens=500,
                system=[{
                    "type": "text",
                    "text": SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }],
                messages=[{"role": "user", "content": user_message}],
            )
            text = response.content[0].text if response.content else "{}"
            return self._parse_json_response(text)
        except json.JSONDecodeError as e:
            logger.error(f"Claude parse error: {e}")
            return {**default, "reasoning": f"Error parseando respuesta: {e}"}
        except Exception as e:
            logger.error(f"Claude evaluation error: {e}")
            return {**default, "reasoning": f"Error al evaluar: {e}"}


sheriff_service = SheriffService()
