from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All config comes from environment variables / .env. Never hardcode secrets."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./lockin.db"

    # Speech-to-text, primary: ElevenLabs Scribe
    elevenlabs_api_key: str = ""
    elevenlabs_stt_model: str = "scribe_v2"
    elevenlabs_language: str = "nor"  # ISO 639-3, as listed in the ElevenLabs docs

    # Speech-to-text, fallback: Groq Whisper (free tier, OpenAI-compatible API)
    groq_api_key: str = ""
    groq_stt_model: str = "whisper-large-v3"
    groq_language: str = "no"  # ISO 639-1

    # AI (interpretation and reports): Claude via the Anthropic API
    anthropic_api_key: str = ""
    ai_model: str = "claude-haiku-5-5"

    # Hackathon: no auth, one fixed demo user.
    demo_user_id: str = "demo"


settings = Settings()
