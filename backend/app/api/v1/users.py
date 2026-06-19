"""
Endpoints de Usuario.
======================

Por ahora solo tiene GET /users/me para obtener el perfil
del usuario autenticado.

El frontend usa este endpoint para:
  1. Obtener el nombre y email del usuario
  2. Verificar que el token sigue siendo válido
"""

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Devuelve la información del usuario autenticado.

    El usuario se obtiene del token JWT gracias a la dependencia
    get_current_user (ver api/deps.py).

    NOTA: Nunca devolvemos password_hash por seguridad.
    """
    return current_user
