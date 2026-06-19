from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    APP_NAME: str = "Ariel Finance"
    DEBUG: bool = True

    DATABASE_URL: str = "sqlite+aiosqlite:///./ariel_finance.db"
    REDIS_URL: str = ""

    SECRET_KEY: str = "super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    class Config:
        env_file = ".env"


settings = Settings()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
