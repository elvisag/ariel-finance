"""
Modelo de Presupuesto.
=======================

Permite al usuario definir límites de gasto por categoría y período.

Ejemplo: "No quiero gastar más de $500 en Comida este mes".

Relaciones:
  - Cada presupuesto pertenece a UN usuario
  - Cada presupuesto está asociado a UNA categoría

  La suma de transacciones en esa categoría durante el período
  se compara contra el monto del presupuesto para mostrar el progreso.
"""

import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import String, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id"),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        # Ej: $500.00 para presupuesto mensual de comida
    )
    period: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        # "weekly" → se reinicia cada semana
        # "monthly" → se reinicia cada mes
        # "yearly" → se reinicia cada año
    )
    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        # Ej: 2026-01-01 (primer día del período)
    )
    end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        # NULL = el presupuesto no tiene fecha de fin (indefinido)
        # Con fecha = presupuesto con vigencia limitada
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # ── Relaciones ────────────────────────────────────────────
    user = relationship("User", back_populates="budgets")
    category = relationship("Category")
