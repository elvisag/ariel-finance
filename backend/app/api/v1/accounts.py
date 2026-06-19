"""
Endpoints de Cuentas.
======================

CRUD básico de cuentas bancarias/efectivo del usuario.

Consideraciones de seguridad:
  - Cada endpoint verifica que la cuenta pertenezca al usuario autenticado
  - Un usuario NO puede ver/modificar cuentas de otros usuarios
  - Esto se logra filtrando siempre por current_user.id
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.account import Account
from app.models.user import User
from app.schemas.account import AccountCreate, AccountResponse

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("/", response_model=list[AccountResponse])
async def list_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Devuelve todas las cuentas del usuario autenticado.

    Filtra por user_id para que cada usuario vea solo sus cuentas.
    """
    result = await db.execute(
        select(Account).where(Account.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    payload: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Crea una nueva cuenta para el usuario autenticado.

    Ejemplo de body:
      { "name": "Mi billetera", "type": "cash", "currency": "ARS", "balance": 1500.00 }

    El user_id se asigna automáticamente del token JWT.
    """
    account = Account(user_id=current_user.id, **payload.model_dump())
    db.add(account)
    await db.flush()
    return account


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Devuelve una cuenta específica por su ID.

    Solo accesible si la cuenta pertenece al usuario autenticado.

    Posibles errores:
      404 Not Found → la cuenta no existe o no pertenece al usuario
    """
    result = await db.execute(
        select(Account).where(
            Account.id == account_id,
            Account.user_id == current_user.id,  # ← Filtro de seguridad
        )
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuenta no encontrada",
        )
    return account
