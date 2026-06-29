"""
Endpoints de Analytics / Reportes.
====================================

Proporciona datos agregados para gráficos y reportes.
"""

import uuid
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.transaction import Transaction
from app.models.account import Account
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/monthly-summary")
async def monthly_summary(
    year: int = Query(default=None),
    month: int = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Resumen del mes: ingresos, gastos y desglose por categoría."""
    if not year or not month:
        today = date.today()
        year = today.year
        month = today.month

    base = (
        select(Transaction)
        .join(Account)
        .where(
            Account.user_id == current_user.id,
            extract("year", Transaction.transaction_date) == year,
            extract("month", Transaction.transaction_date) == month,
        )
    )

    txs_result = await db.execute(base)
    txs = txs_result.scalars().all()

    total_income = sum(t.amount for t in txs if t.type == "income")
    total_expense = sum(t.amount for t in txs if t.type == "expense")

    from collections import defaultdict
    by_category: dict[str, dict] = defaultdict(lambda: {"total": 0, "count": 0})
    for t in txs:
        if t.type == "expense":
            cat_name = t.category.name if t.category else "Sin categoría"
            by_category[cat_name]["total"] += t.amount
            by_category[cat_name]["count"] += 1

    categories = [
        {"name": name, "total": float(data["total"]), "count": data["count"]}
        for name, data in sorted(by_category.items(), key=lambda x: -x[1]["total"])
    ]

    return {
        "year": year,
        "month": month,
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "balance": float(total_income - total_expense),
        "transaction_count": len(txs),
        "categories": categories,
    }


@router.get("/monthly-trend")
async def monthly_trend(
    months: int = Query(default=6, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Tendencia mensual de ingresos y gastos."""
    today = date.today()
    start_date = today.replace(day=1) - timedelta(days=30 * (months - 1))

    result = await db.execute(
        select(Transaction)
        .join(Account)
        .where(
            Account.user_id == current_user.id,
            Transaction.transaction_date >= start_date,
        )
        .order_by(Transaction.transaction_date)
    )
    txs = result.scalars().all()

    from collections import defaultdict
    monthly: dict[str, dict] = defaultdict(lambda: {"income": 0, "expense": 0})

    for t in txs:
        key = t.transaction_date.strftime("%Y-%m")
        if t.type == "income":
            monthly[key]["income"] += t.amount
        elif t.type == "expense":
            monthly[key]["expense"] += t.amount

    trend = [
        {
            "month": key,
            "income": float(data["income"]),
            "expense": float(data["expense"]),
        }
        for key, data in sorted(monthly.items())
    ]

    return {"months": trend}


@router.get("/spending-by-category")
async def spending_by_category(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Gastos agrupados por categoría en un período."""
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date.replace(day=1) - timedelta(days=365)

    result = await db.execute(
        select(Transaction)
        .join(Account)
        .where(
            Account.user_id == current_user.id,
            Transaction.type == "expense",
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date,
        )
    )
    txs = result.scalars().all()

    from collections import defaultdict
    by_cat: dict[str, dict] = defaultdict(lambda: {"total": 0, "count": 0})
    for t in txs:
        name = t.category.name if t.category else "Sin categoría"
        by_cat[name]["total"] += t.amount
        by_cat[name]["count"] += 1

    categories = [
        {"name": name, "total": float(data["total"]), "count": data["count"]}
        for name, data in sorted(by_cat.items(), key=lambda x: -x[1]["total"])
    ]

    total = sum(c["total"] for c in categories)
    for c in categories:
        c["percentage"] = round((c["total"] / total * 100), 1) if total > 0 else 0

    return {"total": total, "categories": categories, "start_date": start_date, "end_date": end_date}
