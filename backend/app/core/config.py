"""
Configuración central de la aplicación.
=======================================

Lee variables de entorno desde un archivo .env usando Pydantic Settings.
Todas las configuraciones sensibles (DB, JWT, etc.) viven aquí y se
importan como `settings` en cualquier parte del proyecto.

¿Por qué Pydantic Settings?
- Validación automática de tipos (si pones DATABASE_URL como str, falla si falta)
- Soporte para .env, variables de entorno del sistema, valores por defecto
- Integración nativa con el ecosistema FastAPI/Pydantic
"""

from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    """
    Configuración principal de la app.

    Cada atributo puede sobreescribirse con una variable de entorno
    del mismo nombre. Ejemplo: APP_NAME=MiApp python main.py
    """

    # ── Generales ──────────────────────────────────────────────
    APP_NAME: str = "Ariel Finance"
    DEBUG: bool = True  # Activa logs detallados de SQLAlchemy

    # ── Base de datos ──────────────────────────────────────────
    # En desarrollo usamos SQLite (no requiere Docker).
    # En producción cambia a: postgresql+asyncpg://user:pass@host/db
    DATABASE_URL: str = "sqlite+aiosqlite:///./ariel_finance.db"

    # ── Google OAuth ───────────────────────────────────────────
    GOOGLE_CLIENT_ID: str = ""

    # ── Redis (caching / sesiones) ─────────────────────────────
    REDIS_URL: str = ""

    # ── JWT ────────────────────────────────────────────────────
    # ¡Cambiar en producción! Usar: openssl rand -hex 32
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 horas

    class Config:
        env_file = ".env"  # Lee variables desde backend/.env


# Instancia global de configuración.
# Se importa así: from app.core.config import settings
settings = Settings()

# Ruta absoluta a la raíz del proyecto backend
# Útil para construir rutas a archivos (ej: base de datos SQLite)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
