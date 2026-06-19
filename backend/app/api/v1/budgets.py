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
    result = await db.execute(select(Budget).where(Budget.user_id == current_user.id))
    return result.scalars().all()


@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    payload: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    await db.delete(budget)
