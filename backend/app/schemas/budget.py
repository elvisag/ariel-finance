import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class BudgetCreate(BaseModel):
    category_id: uuid.UUID
    amount: Decimal
    period: str
    start_date: date
    end_date: date | None = None


class BudgetUpdate(BaseModel):
    amount: Decimal | None = None
    period: str | None = None
    end_date: date | None = None


class BudgetResponse(BaseModel):
    id: uuid.UUID
    category_id: uuid.UUID
    amount: Decimal
    period: str
    start_date: date
    end_date: date | None
    created_at: datetime

    model_config = {"from_attributes": True}
