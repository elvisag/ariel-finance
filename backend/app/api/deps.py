"""
Dependencias compartidas para los endpoints de la API.
========================================================

FastAPI tiene un sistema de "Dependency Injection" (DI) muy potente.
En lugar de repetir código en cada endpoint, definimos dependencias
reutilizables como funciones que se inyectan con `Depends()`.

La dependencia más importante es `get_current_user()`:
  - Extrae el token JWT del header Authorization
  - Verifica que sea válido
  - Busca el usuario en la BD
  - Retorna el objeto User (o lanza 401)

Así cada endpoint puede hacer simplemente:
  async def mi_endpoint(current_user: User = Depends(get_current_user)):
"""

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

# ── Esquema de autenticación ───────────────────────────────────
# HTTPBearer le dice a FastAPI que espere un header así:
#   Authorization: Bearer <token>
# FastAPI automáticamente extrae el token y lo valida.
bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependencia que autentica al usuario actual.

    Flujo:
      1. Toma el token del header Authorization: Bearer xxx
      2. Lo decodifica y verifica la firma (si falla → 401)
      3. Extrae el user_id del payload (campo "sub")
      4. Busca el usuario en la BD por UUID
      5. Si no existe o está inactivo → 401
      6. Retorna el objeto User

    Uso en endpoints:
      @router.get("/me")
      async def get_me(user: User = Depends(get_current_user)):
          return user
    """
    # Paso 1: Decodificar el JWT
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )

    # Paso 2: Extraer el ID del usuario
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: falta user_id"
        )

    # Paso 3: Buscar en base de datos
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo"
        )

    return user
