"""
Endpoints de Transacciones.
============================

Maneja el registro, consulta y eliminación de movimientos.

Lógica de negocio importante:
  - CREAR transacción tipo "expense" → resta del balance de la cuenta
  - CREAR transacción tipo "income" → suma al balance de la cuenta
  - ELIMINAR transacción → revierte el efecto en el balance

Filtros disponibles en GET /transactions/:
  - account_id: ver solo movimientos de una cuenta específica
  - start_date/end_date: filtrar por rango de fechas
  - type: filtrar por tipo (income/expense)

Seguridad: Siempre se verifica que la cuenta pertenezca al usuario.
"""

import uuid
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/", response_model=list[TransactionResponse])
async def list_transactions(
    account_id: uuid.UUID | None = Query(None),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    type: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lista las transacciones del usuario, con filtros opcionales.

    La query une Transaction con Account para filtrar solo
    las cuentas del usuario autenticado.

    Filtros (todos opcionales):
      - account_id: UUID de la cuenta
      - start_date: YYYY-MM-DD (transacciones desde esta fecha)
      - end_date: YYYY-MM-DD (transacciones hasta esta fecha)
      - type: "income", "expense" o "transfer"

    Los resultados se ordenan por fecha descendente (más recientes primero).
    """
    # Construimos la query base haciendo JOIN con Account
    # para asegurarnos que solo vemos transacciones de cuentas propias
    query = select(Transaction).join(Account).where(Account.user_id == current_user.id)

    # Aplicamos filtros dinámicamente (solo si están presentes)
    if account_id:
        query = query.where(Transaction.account_id == account_id)
    if start_date:
        query = query.where(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.where(Transaction.transaction_date <= end_date)
    if type:
        query = query.where(Transaction.type == type)

    query = query.order_by(Transaction.transaction_date.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    payload: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Crea una nueva transacción y actualiza el balance de la cuenta.

    Pasos:
      1. Verificar que la cuenta pertenece al usuario
      2. Crear la transacción
      3. Actualizar el balance:
           expense → balance -= amount
           income  → balance += amount

    Ejemplo body (gasto):
      { "account_id": "uuid", "amount": 50.00, "type": "expense",
        "description": "Cena", "transaction_date": "2026-06-19" }
    """
    # ── Verificar que la cuenta es del usuario ────────────────
    acct_result = await db.execute(
        select(Account).where(Account.id == payload.account_id, Account.user_id == current_user.id)
    )
    account = acct_result.scalar_one_or_none()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuenta no encontrada",
        )

    # ── Crear transacción ─────────────────────────────────────
    transaction = Transaction(**payload.model_dump())
    db.add(transaction)

    # ── Actualizar balance de la cuenta ───────────────────────
    if payload.type == "expense":
        account.balance -= payload.amount
    elif payload.type == "income":
        account.balance += payload.amount
    # type == "transfer": no afecta el balance global, se maneja aparte

    await db.flush()
    return transaction


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: uuid.UUID,
    payload: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Actualiza una transacción y ajusta el balance si cambió el monto o tipo.

    Cuando se modifica amount o type, se recalcula el efecto en el balance:
      efecto_anterior - efecto_nuevo = ajuste en el balance
    """
    query = (
        select(Transaction)
        .join(Account)
        .where(Transaction.id == transaction_id, Account.user_id == current_user.id)
    )
    result = await db.execute(query)
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transacción no encontrada",
        )

    old_amount = transaction.amount
    old_type = transaction.type

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(transaction, key, value)

    new_amount = update_data.get("amount", old_amount)
    new_type = update_data.get("type", old_type)

    def balance_effect(amt: Decimal, t: str) -> Decimal:
        if t == "expense":
            return -amt
        elif t == "income":
            return amt
        return Decimal("0.00")

    if "amount" in update_data or "type" in update_data:
        old_effect = balance_effect(old_amount, old_type)
        new_effect = balance_effect(new_amount, new_type)
        account = transaction.account
        account.balance += new_effect - old_effect

    await db.flush()
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Elimina una transacción y REVIERTE su efecto en el balance.

    Si la transacción era un gasto (expense):
      → devolvemos el dinero al balance (balance += amount)

    Si la transacción era un ingreso (income):
      → quitamos el dinero del balance (balance -= amount)

    Esto mantiene la consistencia: eliminar una transacción
    es como si nunca hubiera ocurrido.
    """
    # Buscar la transacción asegurándonos que pertenece al usuario
    query = (
        select(Transaction)
        .join(Account)
        .where(Transaction.id == transaction_id, Account.user_id == current_user.id)
    )
    result = await db.execute(query)
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transacción no encontrada",
        )

    # Revertir el efecto en el balance
    account = transaction.account
    if transaction.type == "expense":
        account.balance += transaction.amount  # Devolver el dinero
    elif transaction.type == "income":
        account.balance -= transaction.amount  # Quitar el dinero

    await db.delete(transaction)
