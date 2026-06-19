from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth, users, accounts, categories, transactions, budgets
from app.core.config import settings
from app.core.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(accounts.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(transactions.router, prefix="/api/v1")
app.include_router(budgets.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}
