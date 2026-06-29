"""
Endpoints de autenticación: registro, login y Google OAuth.
============================================================

Flujo de Google OAuth:
  1. Frontend abre el navegador para que el usuario elija su cuenta Google
  2. Google devuelve un id_token (JWT firmado por Google)
  3. Frontend envía el id_token a POST /auth/google
  4. Backend verifica el id_token con Google (vía google-auth)
  5. Busca usuario por google_id o email
  6. Si no existe → lo crea con google_id y sin password
  7. Devuelve nuestro JWT (igual que en login normal)

  A partir de ahí, el frontend usa nuestro JWT como siempre.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, GoogleAuthRequest, TokenResponse
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Crea un nuevo usuario con email/contraseña y devuelve un token JWT.

    Pasos:
      1. Verificar que el email no esté registrado (409 si ya existe)
      2. Hashear la contraseña con bcrypt
      3. Guardar el usuario en la BD
      4. Generar un JWT con el ID del usuario
      5. Devolver el token
    """
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
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Inicia sesión con email y contraseña.

    Verifica que el usuario tenga contraseña (no sea solo Google)
    y que coincida con el hash almacenado.
    """
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
    return TokenResponse(access_token=token)


@router.post("/google", response_model=TokenResponse)
async def google_auth(payload: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    """
    Autenticación con Google OAuth.

    Recibe un id_token de Google, lo verifica, y:
      - Si el usuario ya existe (por google_id o email) → inicia sesión
      - Si no existe → crea un usuario nuevo sin contraseña
      - Devuelve nuestro JWT

    El frontend debe obtener el id_token usando expo-auth-session
    o @react-native-google-signin.
    """
    from google.oauth2 import id_token
    from google.auth.transport import requests

    # ── Verificar el token con Google ──────────────────────────
    # Google usa RS256 y sus claves públicas cambian periódicamente.
    # La librería google-auth maneja todo automáticamente.
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

    # ── Buscar o crear usuario ────────────────────────────────
    # Buscamos primero por google_id, luego por email
    result = await db.execute(
        select(User).where((User.google_id == google_id) | (User.email == email))
    )
    user = result.scalar_one_or_none()

    if user:
        # Actualizar google_id si el usuario existía sin él
        if not user.google_id:
            user.google_id = google_id
        # Actualizar nombre si ha cambiado en Google
        if user.name != name:
            user.name = name
    else:
        # Crear nuevo usuario (sin password_hash, solo con google_id)
        user = User(
            email=email,
            name=name,
            google_id=google_id,
            password_hash=None,  # No tiene contraseña → solo login con Google
        )
        db.add(user)

    await db.flush()

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)
