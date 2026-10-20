from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    FRONTEND_URL: str = "http://localhost:5173"
    DATA_DIR: str = ""  # kosong = folder backend/data
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
