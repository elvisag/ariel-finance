import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionResponse

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
    query = select(Transaction).join(Account).where(Account.user_id == current_user.id)

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
    acct_result = await db.execute(
        select(Account).where(Account.id == payload.account_id, Account.user_id == current_user.id)
    )
    account = acct_result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    transaction = Transaction(**payload.model_dump())
    db.add(transaction)

    if payload.type == "expense":
        account.balance -= payload.amount
    elif payload.type == "income":
        account.balance += payload.amount

    await db.flush()
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Transaction)
        .join(Account)
        .where(Transaction.id == transaction_id, Account.user_id == current_user.id)
    )
    result = await db.execute(query)
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    account = transaction.account
    if transaction.type == "expense":
        account.balance += transaction.amount
    elif transaction.type == "income":
        account.balance -= transaction.amount

    await db.delete(transaction)
