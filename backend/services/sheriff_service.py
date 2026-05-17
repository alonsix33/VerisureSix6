import json
import logging

from anthropic import AsyncAnthropic

from backend.settings import settings

logger = logging.getLogger(__name__)

SHERIFF_MODES = ["off", "monitor", "normal", "away", "travel"]


def _build_home_context() -> str:
    return (
        "Hogar de Alonso en Lima, Perú.\n"
        "Dispositivos: 2 sensores Verisure ES700IPDE, "
        "1 cámara Tapo C420 (balcón), 1 hub Tapo H200.\n"
        "Modo Sheriff configurado."
    )


class SheriffService:
    def __init__(self):
        api_key = settings.anthropic_api_key.get_secret_value()
        self.client = AsyncAnthropic(api_key=api_key) if api_key else None
        self.model = "claude-sonnet-4-20250514"

    def _is_available(self) -> bool:
        return self.client is not None

    async def evaluate_event(self, event: dict, context: dict | None = None) -> dict:
        default = {
            "is_anomalous": False,
            "alert_level": "none",
            "reasoning": "Sheriff IA no conectado — modo monitor",
            "message": None,
            "recommended_action": None,
        }
        if not self._is_available():
            logger.warning("Sheriff IA: ANTHROPIC_API_KEY no configurada")
            return default

        mode = (context or {}).get("mode", settings.sheriff_mode)
        if mode == "off":
            return {**default, "reasoning": "Sheriff desactivado"}

        prompt = (
            f"Eres el Sheriff de seguridad del hogar de Alonso en Lima, Perú.\n\n"
            f"EVENTO ACTUAL:\n"
            f"- Dispositivo: {event.get('device_name', event.get('device_id', 'desconocido'))}\n"
            f"- Zona: {event.get('zone', 'desconocida')}\n"
            f"- Tipo: {event.get('event_type', 'desconocido')}\n"
            f"- Timestamp: {event.get('timestamp', 'desconocido')}\n\n"
            f"CONTEXTO:\n"
            f"- Modo actual: {mode}\n"
            f"- Última actividad conocida: {context.get('last_activity', 'desconocida') if context else 'desconocida'}\n\n"
            f"DECISIÓN REQUERIDA:\n"
            f"Analiza si este evento es anómalo y merece alerta.\n"
            f"Responde SOLO en JSON:\n"
            f'{{"is_anomalous": bool, "alert_level": "none|low|medium|high|critical", '
            f'"reasoning": "explicación breve", '
            f'"message": "mensaje para Alonso (si aplica)", '
            f'"recommended_action": "descripción"}}'
        )

        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}],
            )
            text = response.content[0].text if response.content else "{}"
            cleaned = text.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[-1].rsplit("\n", 1)[0]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
            return json.loads(cleaned)
        except Exception as e:
            logger.error(f"Sheriff IA error: {e}")
            return {**default, "reasoning": f"Error al evaluar: {e}"}

    async def chat(self, message: str, conversation_history: list | None = None) -> str:
        if not self._is_available():
            return (
                "Sheriff IA no disponible. Configura ANTHROPIC_API_KEY en el .env "
                "y reinicia el servidor."
            )

        system_prompt = (
            f"Eres el Sheriff, el agente de seguridad del hogar de Alonso en Lima, Perú.\n"
            f"Responde de forma concisa y útil basándote en el contexto del hogar.\n"
            f"{_build_home_context()}"
        )

        messages = list(conversation_history or [])
        messages.append({"role": "user", "content": message})

        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                system=system_prompt,
                messages=messages,
            )
            return response.content[0].text if response.content else ""
        except Exception as e:
            logger.error(f"Sheriff chat error: {e}")
            return f"Error al procesar mensaje: {e}"


sheriff_service = SheriffService()
