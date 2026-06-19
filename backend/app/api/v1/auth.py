"""
Endpoints de autenticación: registro e inicio de sesión.
=========================================================

Flujo de registro:
  1. POST /auth/register → crea usuario + devuelve JWT
  2. El frontend guarda el token en SecureStore
  3. El usuario ya está autenticado

Flujo de login:
  1. POST /auth/login → verifica credenciales + devuelve JWT
  2. El frontend guarda el token en SecureStore
  3. El usuario ya está autenticado

NOTA: Ambos endpoints devuelven el mismo formato (TokenResponse),
así que el frontend puede manejar ambos casos de forma idéntica.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Crea un nuevo usuario y devuelve un token JWT.

    Pasos:
      1. Verificar que el email no esté registrado (409 si ya existe)
      2. Hashear la contraseña con bcrypt
      3. Guardar el usuario en la BD
      4. Generar un JWT con el ID del usuario
      5. Devolver el token

    Posibles errores:
      409 Conflict → el email ya está registrado
    """
    # ── Verificar unicidad del email ──────────────────────────
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este email ya está registrado",
        )

    # ── Crear usuario ─────────────────────────────────────────
    user = User(
        email=payload.email,
        name=payload.name,
        password_hash=hash_password(payload.password),  # NUNCA guardar texto plano
    )
    db.add(user)
    await db.flush()  # Ejecuta el INSERT pero sin commit final (lo hace get_db)

    # ── Generar token ─────────────────────────────────────────
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Inicia sesión con email y contraseña.

    Pasos:
      1. Buscar el usuario por email
      2. Verificar la contraseña contra el hash almacenado
      3. Si son válidas → generar JWT
      4. Si no → 401 Unauthorized

    Posibles errores:
      401 Unauthorized → email no encontrado o contraseña incorrecta
    """
    # ── Buscar usuario ────────────────────────────────────────
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    # ── Verificar credenciales ─────────────────────────────────
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )

    # ── Generar token ─────────────────────────────────────────
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)
