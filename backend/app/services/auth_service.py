from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, GoogleAuthRequest


async def register(db: AsyncSession, payload: RegisterRequest) -> tuple[User, str]:
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este email ya está registrado",
        )

    user = User(
        email=payload.email,
        name=payload.name,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    await db.flush()

    token = create_access_token({"sub": str(user.id)})
    return user, token


async def login(db: AsyncSession, payload: LoginRequest) -> tuple[User, str]:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )

    token = create_access_token({"sub": str(user.id)})
    return user, token


async def google_auth(db: AsyncSession, payload: GoogleAuthRequest) -> tuple[User, str]:
    from google.oauth2 import id_token
    from google.auth.transport import requests

    try:
        info = id_token.verify_oauth2_token(
            payload.id_token,
            requests.Request(),
            audience=settings.GOOGLE_CLIENT_ID or None,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token de Google inválido: {e}",
        )

    google_id = info.get("sub")
    email = info.get("email", "")
    name = info.get("name", email.split("@")[0])

    if not google_id or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El token de Google no contiene información suficiente",
        )

    result = await db.execute(
        select(User).where((User.google_id == google_id) | (User.email == email))
    )
    user = result.scalar_one_or_none()

    if user:
        if not user.google_id:
            user.google_id = google_id
        if user.name != name:
            user.name = name
    else:
        user = User(
            email=email,
            name=name,
            google_id=google_id,
            password_hash=None,
        )
        db.add(user)

    await db.flush()

    token = create_access_token({"sub": str(user.id)})
    return user, token
