"""
Configuración de la base de datos con SQLAlchemy asíncrono.
=============================================================

¿Por qué async?
- FastAPI es async por naturaleza. Usar SQLAlchemy async evita bloquear
  el event loop mientras esperamos respuestas de la DB.
- Escala mejor bajo concurrencia.

Flujo de una petición:
  1. El endpoint recibe una sesión de DB vía `Depends(get_db)`
  2. Hace queries con `await db.execute(...)`
  3. Al salir del `yield`, la sesión hace commit (o rollback si hay error)
  4. La sesión se cierra automáticamente en el `finally`

SQLite:
  - En desarrollo usamos SQLite con WAL mode (mejor concurrencia)
  - Los PRAGMA se configuran automáticamente al conectar
"""

from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# ── Engine ─────────────────────────────────────────────────────
# El engine es el "pool de conexiones". Se crea una vez y se reusa.
engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG)

# ── SQLite: configuraciones especiales ─────────────────────────
# WAL mode = mejor rendimiento en lecturas concurrentes.
# foreign_keys = ON asegura integridad referencial (SQLite no lo activa por defecto).
if "sqlite" in settings.DATABASE_URL:
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# ── Session Factory ────────────────────────────────────────────
# Crea sesiones nuevas cuando se las pedimos.
# expire_on_commit=False: después de un commit, los objetos siguen
# siendo accesibles (útil para devolverlos como respuesta JSON).
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# ── Base declarativa ───────────────────────────────────────────
# Todos los modelos SQLAlchemy heredan de esta clase.
# Base.metadata.create_all() crea las tablas automáticamente.
class Base(DeclarativeBase):
    pass


# ── Dependencia para FastAPI ───────────────────────────────────
# Uso en endpoints:
#   async def mi_endpoint(db: AsyncSession = Depends(get_db)):
async def get_db() -> AsyncSession:
    """
    Generador asíncrono que:
    1. Abre una sesión de base de datos
    2. La entrega al endpoint (yield)
    3. Hace commit si todo sale bien
    4. Hace rollback si hay excepción
    5. Cierra la sesión siempre
    """
    async with async_session_factory() as session:
        try:
            yield session  # → el endpoint usa la sesión aquí
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
