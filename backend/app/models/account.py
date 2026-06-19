"""
Modelo de Cuenta (bancaria o de efectivo).
============================================

Representa un lugar donde el usuario guarda dinero:
  - Cuenta corriente (checking)
  - Caja de ahorro (savings)
  - Tarjeta de crédito (credit)
  - Inversiones (investment)
  - Efectivo (cash)

Relaciones:
  - MUCHAS cuentas pertenecen a UN usuario (N:1 con User)
  - Una cuenta tiene MUCHAS transacciones (1:N con Transaction)

Lógica de negocio importante:
  - El balance se actualiza automáticamente cuando se crea/elimina una transacción
  - Cada transacción modifica el balance de su cuenta correspondiente
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import String, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Account(Base):
    """
    Tabla: accounts

    Campos:
      id          : UUID único
      user_id     : ID del dueño de la cuenta (FK → users.id)
      name        : Nombre descriptivo (ej: "Mi billetera", "Banco Nación")
      type        : Tipo de cuenta (checking, savings, credit, investment, cash)
      balance     : Saldo actual (Decimal de alta precisión: 14 dígitos, 2 decimales)
      currency    : Moneda (USD, ARS, EUR, etc.)
      is_active   : Si la cuenta está visible o archivada
      created_at  : Fecha de creación
      updated_at  : Última modificación
    """

    __tablename__ = "accounts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),  # Clave foránea → tabla users
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        # Valores esperados: "checking", "savings", "credit", "investment", "cash"
    )
    balance: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),     # 14 dígitos totales, 2 decimales → hasta $999,999,999,999.99
        default=Decimal("0.00"),
    )
    currency: Mapped[str] = mapped_column(String(3), default="USD")  # Código ISO 4217
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Relaciones ────────────────────────────────────────────
    user = relationship("User", back_populates="accounts")
    # cascade="all, delete-orphan": si se borra la cuenta, se borran sus transacciones
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")
