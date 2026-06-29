"""
Modelo de Transacción.
=======================

Representa un movimiento de dinero: ingreso, gasto o transferencia.

Es el modelo central de la app. Cada vez que el usuario registra
que gastó o recibió dinero, se crea una transacción.

Lógica de negocio importante:
  - Cuando se CREA una transacción de tipo "expense":
      account.balance -= transaction.amount
  - Cuando se CREA una transacción de tipo "income":
      account.balance += transaction.amount
  - Cuando se ELIMINA una transacción, se revierte el efecto en el balance

  Esto se maneja en api/v1/transactions.py (no a nivel de base de datos).
"""

import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import String, Numeric, Date, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("accounts.id"),
        nullable=False,
    )
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id"),
        nullable=True,  # NULL = sin categorizar
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        # Siempre positivo. El signo lo determina el campo "type".
        # expense = -amount en el balance
        # income = +amount en el balance
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        # Descripción libre. Ej: "Cena con amigos", "Sueldo Junio 2026"
    )
    type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        # "income" → el usuario recibió dinero
        # "expense" → el usuario gastó dinero
        # "transfer" → movimiento entre cuentas del mismo usuario
    )
    transaction_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        # Fecha en que ocurrió la transacción (no la fecha de registro).
        # Permite registrar gastos de días anteriores.
    )
    is_recurring: Mapped[bool] = mapped_column(
        default=False,
        # True si es un gasto recurrente (suscripción, alquiler, etc.)
    )
    recurrence_frequency: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        # "daily", "weekly", "monthly", "yearly" — NULL si no es recurrente
    )
    recurrence_end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        # Fecha tope para la recurrencia. NULL = indefinido.
    )
    recurrence_last_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        # Última fecha en que se generó una ocurrencia automática.
        # NULL = no se ha generado ninguna aún (primera vez).
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # ── Relaciones ────────────────────────────────────────────
    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
