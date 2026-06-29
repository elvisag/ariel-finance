from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy import select, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction
from app.models.account import Account
from app.models.user import User


async def monthly_summary(
    db: AsyncSession,
    user: User,
    year: int | None = None,
    month: int | None = None,
) -> dict:
    if not year or not month:
        today = date.today()
        year = today.year
        month = today.month

    base = (
        select(Transaction)
        .join(Account)
        .where(
            Account.user_id == user.id,
            extract("year", Transaction.transaction_date) == year,
            extract("month", Transaction.transaction_date) == month,
        )
    )

    txs_result = await db.execute(base)
    txs = list(txs_result.scalars().all())

    total_income = sum(t.amount for t in txs if t.type == "income")
    total_expense = sum(t.amount for t in txs if t.type == "expense")

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


async def monthly_trend(
    db: AsyncSession,
    user: User,
    months: int = 6,
) -> dict:
    today = date.today()
    start_date = today.replace(day=1) - timedelta(days=30 * (months - 1))

    result = await db.execute(
        select(Transaction)
        .join(Account)
        .where(
            Account.user_id == user.id,
            Transaction.transaction_date >= start_date,
        )
        .order_by(Transaction.transaction_date)
    )
    txs = list(result.scalars().all())

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


async def spending_by_category(
    db: AsyncSession,
    user: User,
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict:
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date.replace(day=1) - timedelta(days=365)

    result = await db.execute(
        select(Transaction)
        .join(Account)
        .where(
            Account.user_id == user.id,
            Transaction.type == "expense",
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date,
        )
    )
    txs = list(result.scalars().all())

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
