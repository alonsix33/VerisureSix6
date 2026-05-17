import logging

logger = logging.getLogger(__name__)

ALERT_LEVELS = {
    "low": "🟡",
    "medium": "🟠",
    "high": "🔴",
    "critical": "🚨",
}


class AlertService:
    def __init__(self, bot_token: str = "", chat_id: str = ""):
        self.bot_token = bot_token
        self.chat_id = chat_id
        self.bot = None

    async def _init_bot(self):
        if self.bot or not self.bot_token:
            return
        try:
            from telegram import Bot

            self.bot = Bot(token=self.bot_token)
        except Exception as e:
            logger.error(f"Error iniciando bot Telegram: {e}")

    async def send_alert(self, message: str, level: str = "info"):
        emoji = ALERT_LEVELS.get(level, "ℹ️")
        formatted = f"{emoji} *VerisureSix6* — {level.upper()}\n\n{message}"
        logger.info(f"[{level.upper()}] {message}")
        await self._init_bot()
        if self.bot and self.chat_id:
            try:
                await self.bot.send_message(
                    chat_id=self.chat_id,
                    text=formatted,
                    parse_mode="Markdown",
                )
            except Exception as e:
                logger.error(f"Error enviando Telegram: {e}")

    async def send_silent_notification(self, title: str, body: str):
        logger.info(f"[NOTIFICATION] {title}: {body}")
        await self._init_bot()
        if self.bot and self.chat_id:
            try:
                await self.bot.send_message(
                    chat_id=self.chat_id,
                    text=f"*{title}*\n\n{body}",
                    parse_mode="Markdown",
                    disable_notification=True,
                )
            except Exception as e:
                logger.error(f"Error enviando notificación Telegram: {e}")


alert_service = AlertService()
