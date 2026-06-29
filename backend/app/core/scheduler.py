"""
Scheduler de transacciones recurrentes.
=========================================

Ejecuta una tarea de fondo que revisa periódicamente las transacciones
marcadas como recurrentes y genera nuevas ocurrencias cuando corresponde.

Lógica:
  1. Busca transacciones con is_recurring=True y recurrence_frequency NOT NULL
  2. Calcula la próxima fecha según la frecuencia
  3. Si la próxima fecha <= hoy, crea una nueva transacción
  4. Actualiza recurrence_last_date

Frecuencias soportadas:
  - daily: cada 1 día
  - weekly: cada 7 días
  - monthly: cada 1 mes
  - yearly: cada 1 año
"""

import asyncio
import logging
from datetime import date, timedelta
from calendar import monthrange

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory
from app.models.transaction import Transaction

logger = logging.getLogger(__name__)

CHECK_INTERVAL_SECONDS = 3600  # cada hora


def _next_date(last: date, frequency: str) -> date | None:
    if frequency == "daily":
        return last + timedelta(days=1)
    elif frequency == "weekly":
        return last + timedelta(weeks=1)
    elif frequency == "monthly":
        month = last.month + 1
        year = last.year + (month - 1) // 12
        month = (month - 1) % 12 + 1
        day = min(last.day, monthrange(year, month)[1])
        return date(year, month, day)
    elif frequency == "yearly":
        year = last.year + 1
        day = min(last.day, monthrange(year, last.month)[1])
        return date(year, last.month, day)
    return None


async def process_recurring_transactions():
    """
    Busca transacciones recurrentes vencidas y crea nuevas ocurrencias.
    """
    async with async_session_factory() as db:
        result = await db.execute(
            select(Transaction).where(
                Transaction.is_recurring == True,
                Transaction.recurrence_frequency.isnot(None),
            )
        )
        txs = result.scalars().all()
        today = date.today()

        for tx in txs:
            last = tx.recurrence_last_date or tx.transaction_date
            freq = tx.recurrence_frequency
            if not freq:
                continue

            next_due = _next_date(last, freq)
            if next_due is None:
                continue

            if next_due > today:
                continue

            if tx.recurrence_end_date and next_due > tx.recurrence_end_date:
                continue

            new_tx = Transaction(
                account_id=tx.account_id,
                category_id=tx.category_id,
                amount=tx.amount,
                description=tx.description,
                type=tx.type,
                transaction_date=next_due,
                is_recurring=tx.is_recurring,
                recurrence_frequency=tx.recurrence_frequency,
                recurrence_end_date=tx.recurrence_end_date,
                recurrence_last_date=next_due,
            )
            db.add(new_tx)

            tx.recurrence_last_date = next_due

        await db.commit()

        if txs:
            logger.info("Recurring scheduler: processed %d transactions", len(txs))


async def run_scheduler():
    """
    Bucle infinito que ejecuta el procesamiento periódicamente.
    """
    while True:
        try:
            await process_recurring_transactions()
        except Exception as e:
            logger.exception("Recurring scheduler error: %s", e)
        await asyncio.sleep(CHECK_INTERVAL_SECONDS)


def start_scheduler():
    """
    Inicia el scheduler como tarea de fondo.
    Llámame desde el lifespan de la app.
    """
    task = asyncio.create_task(run_scheduler())
    return task
