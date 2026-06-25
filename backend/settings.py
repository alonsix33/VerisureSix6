from pydantic_settings import BaseSettings
from pydantic import SecretStr


class Settings(BaseSettings):
    # AI APIs
    anthropic_api_key: SecretStr = SecretStr("")
    openai_api_key: SecretStr = SecretStr("")

    # Hardware
    tapo_email: str = ""
    tapo_password: SecretStr = SecretStr("")
    tapo_hub_ip: str = "192.168.68.62"

    # Sheriff
    sheriff_mode: str = "casa"
    mock_sensors: bool = True

    # Database
    database_url: str = "sqlite+aiosqlite:///./verisure.db"

    # Telegram (alert fallback)
    telegram_bot_token: SecretStr = SecretStr("")
    telegram_chat_id: str = ""

    # Web Push VAPID
    vapid_public_key: str = ""
    vapid_private_key: SecretStr = SecretStr("")
    vapid_email: str = ""

    # App
    secret_key: SecretStr = SecretStr("change-me-in-production")
    frontend_url: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
