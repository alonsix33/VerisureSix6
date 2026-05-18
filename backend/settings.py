from pydantic_settings import BaseSettings
from pydantic import SecretStr


class Settings(BaseSettings):
    anthropic_api_key: SecretStr = SecretStr("")
    openai_api_key: SecretStr = SecretStr("")
    tapo_email: str = ""
    tapo_password: str = ""
    sheriff_mode: str = "monitor"
    database_url: str = "sqlite+aiosqlite:///./verisure.db"
    telegram_bot_token: SecretStr = SecretStr("")
    telegram_chat_id: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
