import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class AccountCreate(BaseModel):
    name: str
    type: str
    currency: str = "USD"
    balance: Decimal = Decimal("0.00")


class AccountUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    currency: str | None = None
    balance: Decimal | None = None
    is_active: bool | None = None


class AccountResponse(BaseModel):
    id: uuid.UUID
    name: str
    type: str
    balance: Decimal
    currency: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
