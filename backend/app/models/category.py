"""
Modelo de Categoría.
=====================

Clasifica las transacciones para poder analizar en qué se gasta el dinero.

Ejemplos de categorías:
  - Ingresos: "Sueldo", "Freelance", "Inversiones"
  - Gastos: "Comida", "Transporte", "Alquiler", "Entretenimiento"

Particularidades:
  - user_id puede ser NULL → son categorías "globales" del sistema
  - user_id con valor → categorías personalizadas del usuario
  - icon: nombre del ícono de @expo/vector-icons (ej: "fast-food", "car", "home")
  - color: color hexadecimal para mostrar en la UI (ej: "#10b981")
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,  # NULL = categoría global del sistema
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[str] = mapped_column(String(50), default="tag")
    color: Mapped[str] = mapped_column(String(7), default="#6B7280")  # #RRGGBB
    type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        # "income" → esta categoría es para ingresos
        # "expense" → esta categoría es para gastos
        # "transfer" → esta categoría es para transferencias entre cuentas
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    transactions = relationship("Transaction", back_populates="category")
