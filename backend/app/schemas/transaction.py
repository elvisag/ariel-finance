import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class TransactionCreate(BaseModel):
    account_id: uuid.UUID
    category_id: uuid.UUID | None = None
    amount: Decimal
    description: str | None = None
    type: str
    transaction_date: date
    is_recurring: bool = False
    recurrence_frequency: str | None = None
    recurrence_end_date: date | None = None


class TransactionResponse(BaseModel):
    id: uuid.UUID
    account_id: uuid.UUID
    category_id: uuid.UUID | None
    amount: Decimal
    description: str | None
    type: str
    transaction_date: date
    is_recurring: bool
    recurrence_frequency: str | None
    recurrence_end_date: date | None
    recurrence_last_date: date | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TransferCreate(BaseModel):
    from_account_id: uuid.UUID
    to_account_id: uuid.UUID
    amount: Decimal
    description: str | None = None
    transaction_date: date


class TransferResponse(BaseModel):
    from_transaction: TransactionResponse
    to_transaction: TransactionResponse


class PaginatedTransactions(BaseModel):
    items: list[TransactionResponse]
    total: int
    skip: int
    limit: int


class TransactionUpdate(BaseModel):
    account_id: uuid.UUID | None = None
    category_id: uuid.UUID | None = None
    amount: Decimal | None = None
    description: str | None = None
    type: str | None = None
    transaction_date: date | None = None
    is_recurring: bool | None = None
    recurrence_frequency: str | None = None
    recurrence_end_date: date | None = None
