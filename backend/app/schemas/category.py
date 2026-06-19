import uuid
from datetime import datetime

from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    icon: str = "tag"
    color: str = "#6B7280"
    type: str


class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    icon: str
    color: str
    type: str
    created_at: datetime

    model_config = {"from_attributes": True}
