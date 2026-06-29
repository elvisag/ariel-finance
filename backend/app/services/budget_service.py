import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.budget import Budget
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate


async def list_budgets(db: AsyncSession, user: User) -> list[Budget]:
    result = await db.execute(select(Budget).where(Budget.user_id == user.id))
    return list(result.scalars().all())


async def create_budget(db: AsyncSession, user: User, payload: BudgetCreate) -> Budget:
    budget = Budget(user_id=user.id, **payload.model_dump())
    db.add(budget)
    await db.flush()
    return budget


async def delete_budget(db: AsyncSession, user: User, budget_id: uuid.UUID) -> None:
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == user.id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presupuesto no encontrado")
    await db.delete(budget)


async def update_budget(db: AsyncSession, user: User, budget_id: uuid.UUID, payload: BudgetUpdate) -> Budget:
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == user.id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Presupuesto no encontrado")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(budget, field, value)

    await db.flush()
    return budget
