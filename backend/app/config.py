from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All config comes from environment variables / .env. Never hardcode secrets."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./lockin.db"
    openai_api_key: str = ""
    stt_model: str = "gpt-4o-transcribe"
    stt_language: str = "no"
    # Hackathon: no auth, one fixed demo user.
    demo_user_id: str = "demo"


settings = Settings()
