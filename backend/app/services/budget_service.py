import uuid
from datetime import date, datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select, extract
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.budget import Budget
from app.models.transaction import Transaction
from app.models.account import Account
from app.models.user import User
from app.schemas.budget import BudgetAlert, BudgetCreate, BudgetUpdate


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


async def get_budget_alerts(db: AsyncSession, user: User) -> list[BudgetAlert]:
    today = date.today()

    budgets = await db.execute(
        select(Budget)
        .options(selectinload(Budget.category))
        .where(Budget.user_id == user.id)
    )
    budgets = list(budgets.scalars().all())

    if not budgets:
        return []

    alerts: list[BudgetAlert] = []

    for b in budgets:
        if b.end_date and b.end_date < today:
            continue

        if b.period == "weekly":
            period_start = today - __import__("datetime").timedelta(days=7)
        elif b.period == "yearly":
            period_start = date(today.year, 1, 1)
        else:
            period_start = date(today.year, today.month, 1)

        result = await db.execute(
            select(Transaction)
            .join(Account)
            .where(
                Account.user_id == user.id,
                Transaction.type == "expense",
                Transaction.category_id == b.category_id,
                Transaction.transaction_date >= period_start,
                Transaction.transaction_date <= today,
            )
        )
        txs = list(result.scalars().all())
        spent = sum(t.amount for t in txs)

        pct = float(spent) / float(b.amount) * 100 if b.amount > 0 else 0
        remaining = b.amount - spent

        if pct >= 100:
            status_val = "danger"
        elif pct >= 80:
            status_val = "warning"
        else:
            status_val = "ok"

        cat = b.category
        alerts.append(BudgetAlert(
            budget_id=b.id,
            category_id=b.category_id,
            category_name=cat.name if cat else "Sin categoría",
            category_icon=cat.icon if cat else "pricetag-outline",
            category_color=cat.color if cat else "#c0c0f8",
            budgeted=b.amount,
            spent=spent,
            percentage=round(pct, 1),
            remaining=remaining,
            period=b.period,
            status=status_val,
        ))

    alerts.sort(key=lambda a: a.percentage, reverse=True)
    return alerts
