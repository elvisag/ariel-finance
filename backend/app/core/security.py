"""
Seguridad: hasheo de contraseñas y creación/verificación de tokens JWT.
=======================================================================

¿Cómo funciona la autenticación?
  1. El usuario se registra → guardamos password_hash (NUNCA la contraseña en texto plano)
  2. El usuario inicia sesión → verificamos password contra el hash
  3. Si es correcto → generamos un JWT firmado con SECRET_KEY
  4. El frontend guarda el JWT en SecureStore (almacenamiento seguro del dispositivo)
  5. En cada petición, el frontend envía el JWT en el header Authorization: Bearer <token>
  6. El backend verifica la firma y extrae el user_id del token

¿Por qué bcrypt?
- Es el estándar de la industria para hashear contraseñas
- Incluye salt automático (cada contraseña tiene un salt único)
- Es lento a propósito (dificulta ataques de fuerza bruta)

¿Por qué JWT?
- Stateless: el servidor no necesita almacenar sesiones
- Contiene la info del usuario firmada criptográficamente
- Expira automáticamente (ACCESS_TOKEN_EXPIRE_MINUTES)
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# ── Password Hashing ──────────────────────────────────────────
# CryptContext maneja múltiples esquemas de hasheo.
# "deprecated=auto" permite actualizar el algoritmo en el futuro
# sin romper contraseñas existentes.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Convierte una contraseña en texto plano a su hash bcrypt.
    Ejemplo: "miPassword123" → "$2b$12$LJ3m... (60 caracteres)"
    """
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """
    Compara una contraseña en texto plano contra su hash.
    bcrypt extrae el salt del propio hash, no necesitamos almacenarlo aparte.
    """
    return pwd_context.verify(plain, hashed)


# ── JWT ────────────────────────────────────────────────────────
# El token contiene un "payload" con datos del usuario.
# Estructura típica: {"sub": "user-uuid", "exp": 1234567890}
#   - sub (subject): ID del usuario (estándar JWT)
#   - exp (expiration): timestamp de expiración


def create_access_token(data: dict) -> str:
    """
    Genera un JWT firmado.

    Args:
        data: Diccionario con los claims del token.
              Ej: {"sub": "550e8400-e29b-41d4-a716-446655440000"}

    Returns:
        String del token JWT (ej: "eyJhbGciOiJIUzI1NiIs...")
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """
    Verifica y decodifica un JWT.

    Args:
        token: El token JWT a verificar

    Returns:
        El payload del token si es válido, None si expiró o la firma es inválida
    """
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
