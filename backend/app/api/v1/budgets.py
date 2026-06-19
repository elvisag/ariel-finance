"""
Endpoints de Presupuestos.
===========================

Los presupuestos permiten al usuario definir límites de gasto
por categoría y período (semanal, mensual, anual).

El frontend usa estos presupuestos para:
  - Mostrar barras de progreso (gastado vs. presupuestado)
  - Enviar notificaciones cuando se acerca al límite

NOTA: El cálculo de "cuánto se ha gastado" se hace en el frontend
calculando la suma de transacciones de esa categoría en el período.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.budget import Budget
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetResponse

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("/", response_model=list[BudgetResponse])
async def list_budgets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Devuelve todos los presupuestos del usuario autenticado.
    """
    result = await db.execute(select(Budget).where(Budget.user_id == current_user.id))
    return result.scalars().all()


@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    payload: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Crea un nuevo presupuesto para una categoría.

    Ejemplo:
      { "category_id": "uuid", "amount": 500.00, "period": "monthly",
        "start_date": "2026-06-01" }

    Esto significa: "No quiero gastar más de $500 en esta categoría
    durante junio 2026".
    """
    budget = Budget(user_id=current_user.id, **payload.model_dump())
    db.add(budget)
    await db.flush()
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Elimina un presupuesto.
    """
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Presupuesto no encontrado",
        )
    await db.delete(budget)
