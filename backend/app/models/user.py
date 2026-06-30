"""
Modelo de Usuario.
==================

Representa a una persona que usa la aplicación.

Relaciones:
  - Un usuario tiene MUCHAS cuentas (1:N con Account)
  - Un usuario tiene MUCHOS presupuestos (1:N con Budget)

Consideraciones de seguridad:
  - NUNCA almacenamos la contraseña en texto plano, solo su hash
  - El email es único (índice en la BD) para evitar cuentas duplicadas
  - is_active permite desactivar cuentas sin borrar datos
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    """
    Tabla: users

    Campos:
      id              : UUID único (generado automáticamente)
      email           : Email del usuario (único, usado para login)
      name            : Nombre visible en la app
      password_hash   : Hash bcrypt de la contraseña (NUNCA texto plano).
                        NULL si el usuario solo usa Google OAuth.
      google_id       : ID único de Google (NULL si usa email/contraseña).
      is_active       : Si el usuario puede o no iniciar sesión
      created_at      : Fecha de registro
      updated_at      : Última modificación del perfil
    """

    __tablename__ = "users"

    # ── Columnas ──────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,  # Se genera automáticamente al crear
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,      # No pueden haber dos usuarios con el mismo email
        index=True,       # Índice para búsquedas rápidas por email
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        # 👆 Guardamos el hash, no la contraseña
        # NULL cuando el usuario se registró con Google
    )
    google_id: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
        # ID único de Google (sub del JWT).
        # NULL cuando el usuario se registró con email/contraseña.
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),  # Se actualiza automáticamente
    )

    # ── Relaciones ────────────────────────────────────────────
    # cascade="all, delete-orphan": si borramos un usuario,
    # se borran también sus cuentas y presupuestos automáticamente.
    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
