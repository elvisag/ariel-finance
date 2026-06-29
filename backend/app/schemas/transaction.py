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


class TransactionResponse(BaseModel):
    id: uuid.UUID
    account_id: uuid.UUID
    category_id: uuid.UUID | None
    amount: Decimal
    description: str | None
    type: str
    transaction_date: date
    is_recurring: bool
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


class TransactionUpdate(BaseModel):
    account_id: uuid.UUID | None = None
    category_id: uuid.UUID | None = None
    amount: Decimal | None = None
    description: str | None = None
    type: str | None = None
    transaction_date: date | None = None
    is_recurring: bool | None = None
