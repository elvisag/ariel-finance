"""
Punto de entrada de la aplicación FastAPI.
===========================================

Aquí se configura:
  - El lifespan (inicio y cierre graceful de recursos)
  - Los middlewares (CORS para que el frontend pueda llamar al API)
  - Los routers (cada archivo en api/v1/ se registra aquí)
  - Endpoints de salud (/health)

Flujo de inicio:
  1. FastAPI llama a lifespan() antes de aceptar peticiones
  2. lifespan() crea las tablas de la BD con Base.metadata.create_all()
  3. La app queda lista para recibir requests
  4. Al cerrar, lifespan() libera la conexión a la BD

Flujo de una petición típica:
  Request → CORS middleware → Router → Dependencias (auth, DB) → Endpoint → Response
"""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, users, accounts, categories, transactions, budgets, analytics
from app.core.config import settings
from app.core.database import engine, Base
from app.core.scheduler import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Maneja el ciclo de vida de la aplicación.

    startup:
      - Crea todas las tablas definidas en models/ si no existen.
      - Inicia el scheduler de transacciones recurrentes.

    shutdown:
      - Cancela el scheduler.
      - Cierra el engine de SQLAlchemy.
    """
    # ── Startup ──
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    scheduler_task = start_scheduler()
    yield
    # ── Shutdown ──
    scheduler_task.cancel()
    try:
        await scheduler_task
    except asyncio.CancelledError:
        pass
    await engine.dispose()


# ── Creación de la app ─────────────────────────────────────────
app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

# ── CORS ───────────────────────────────────────────────────────
# Permite que el frontend (Expo en cualquier puerto/origen)
# haga peticiones al backend sin errores de Cross-Origin.
# En producción, restringir allow_origins a dominios específicos.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────
# Cada router agrupa endpoints de un recurso.
# El prefijo /api/v1 es estándar para versionar la API.
# Los tags agrupan los endpoints en la documentación de Swagger.
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(accounts.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(transactions.router, prefix="/api/v1")
app.include_router(budgets.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")


# ── Health Check ───────────────────────────────────────────────
@app.get("/health")
async def health():
    """Endpoint de verificación. Útil para monitoreo (load balancers, k8s)."""
    return {"status": "ok"}
