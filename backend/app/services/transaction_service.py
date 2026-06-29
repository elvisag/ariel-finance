import uuid
from datetime import date
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransferCreate


async def list_transactions(
    db: AsyncSession,
    user: User,
    account_id: uuid.UUID | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    type: str | None = None,
) -> list[Transaction]:
    query = select(Transaction).join(Account).where(Account.user_id == user.id)
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
    return list(result.scalars().all())


async def create_transaction(
    db: AsyncSession,
    user: User,
    payload: TransactionCreate,
) -> Transaction:
    acct_result = await db.execute(
        select(Account).where(Account.id == payload.account_id, Account.user_id == user.id)
    )
    account = acct_result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta no encontrada")

    transaction = Transaction(**payload.model_dump())
    db.add(transaction)

    if payload.type == "expense":
        account.balance -= payload.amount
    elif payload.type == "income":
        account.balance += payload.amount

    await db.flush()
    return transaction


async def transfer_money(
    db: AsyncSession,
    user: User,
    payload: TransferCreate,
) -> tuple[Transaction, Transaction]:
    if payload.from_account_id == payload.to_account_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las cuentas origen y destino deben ser distintas",
        )

    from_result = await db.execute(
        select(Account).where(Account.id == payload.from_account_id, Account.user_id == user.id)
    )
    from_account = from_result.scalar_one_or_none()
    if not from_account:
        raise HTTPException(status_code=404, detail="Cuenta origen no encontrada")

    to_result = await db.execute(
        select(Account).where(Account.id == payload.to_account_id, Account.user_id == user.id)
    )
    to_account = to_result.scalar_one_or_none()
    if not to_account:
        raise HTTPException(status_code=404, detail="Cuenta destino no encontrada")

    if from_account.balance < payload.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Saldo insuficiente en la cuenta origen",
        )

    from_tx = Transaction(
        account_id=payload.from_account_id,
        category_id=None,
        amount=payload.amount,
        description=payload.description,
        type="transfer",
        transaction_date=payload.transaction_date,
        is_recurring=False,
    )
    db.add(from_tx)

    to_tx = Transaction(
        account_id=payload.to_account_id,
        category_id=None,
        amount=payload.amount,
        description=payload.description,
        type="income",
        transaction_date=payload.transaction_date,
        is_recurring=False,
    )
    db.add(to_tx)

    from_account.balance -= payload.amount
    to_account.balance += payload.amount

    await db.flush()
    return from_tx, to_tx


async def update_transaction(
    db: AsyncSession,
    user: User,
    transaction_id: uuid.UUID,
    payload: TransactionUpdate,
) -> Transaction:
    query = (
        select(Transaction)
        .join(Account)
        .where(Transaction.id == transaction_id, Account.user_id == user.id)
    )
    result = await db.execute(query)
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transacción no encontrada")

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


async def delete_transaction(
    db: AsyncSession,
    user: User,
    transaction_id: uuid.UUID,
) -> None:
    query = (
        select(Transaction)
        .join(Account)
        .where(Transaction.id == transaction_id, Account.user_id == user.id)
    )
    result = await db.execute(query)
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transacción no encontrada")

    account = transaction.account
    if transaction.type == "expense":
        account.balance += transaction.amount
    elif transaction.type == "income":
        account.balance -= transaction.amount

    await db.delete(transaction)
