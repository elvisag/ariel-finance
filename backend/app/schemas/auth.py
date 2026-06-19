"""
Schemas de autenticación.
=========================

Los schemas de Pydantic tienen dos propósitos:
  1. Validar los datos que llegan del cliente (requests)
  2. Serializar los datos que devolvemos (responses)

  Por eso separamos los schemas de entrada (Request) de los de salida (Response).
"""

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    """
    Schema para el registro de un nuevo usuario.

    Validaciones automáticas de Pydantic:
      - email: debe tener formato válido de email (user@domain.com)
      - password: cualquier string (la validación de seguridad se hace en el frontend)
    """
    email: EmailStr
    name: str
    password: str


class LoginRequest(BaseModel):
    """Schema para iniciar sesión (email + contraseña)."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """
    Schema para la respuesta exitosa de autenticación.

    El frontend guarda access_token en SecureStore y lo envía
    en el header Authorization: Bearer <token> para peticiones autenticadas.
    """
    access_token: str
    token_type: str = "bearer"  # Siempre "bearer" para nuestro JWT
