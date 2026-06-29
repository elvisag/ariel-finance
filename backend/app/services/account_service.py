import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.user import User
from app.schemas.account import AccountCreate, AccountUpdate


async def list_accounts(db: AsyncSession, user: User) -> list[Account]:
    result = await db.execute(select(Account).where(Account.user_id == user.id))
    return list(result.scalars().all())


async def create_account(db: AsyncSession, user: User, payload: AccountCreate) -> Account:
    account = Account(user_id=user.id, **payload.model_dump())
    db.add(account)
    await db.flush()
    return account


async def get_account(db: AsyncSession, user: User, account_id: uuid.UUID) -> Account:
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.user_id == user.id)
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cuenta no encontrada")
    return account


async def update_account(db: AsyncSession, user: User, account_id: uuid.UUID, payload: AccountUpdate) -> Account:
    account = await get_account(db, user, account_id)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(account, field, value)
    await db.flush()
    return account


async def delete_account(db: AsyncSession, user: User, account_id: uuid.UUID) -> None:
    account = await get_account(db, user, account_id)
    await db.delete(account)
