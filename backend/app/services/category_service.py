import uuid

from fastapi import HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate


async def list_categories(db: AsyncSession, user: User) -> list[Category]:
    result = await db.execute(
        select(Category).where(
            or_(
                Category.user_id == user.id,
                Category.user_id.is_(None),
            )
        )
    )
    return list(result.scalars().all())


async def create_category(db: AsyncSession, user: User, payload: CategoryCreate) -> Category:
    category = Category(user_id=user.id, **payload.model_dump())
    db.add(category)
    await db.flush()
    return category


async def delete_category(db: AsyncSession, user: User, category_id: uuid.UUID) -> None:
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == user.id)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
    await db.delete(category)
