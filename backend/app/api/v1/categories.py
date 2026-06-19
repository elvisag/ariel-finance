"""
Endpoints de Categorías.
=========================

Las categorías clasifican las transacciones (Comida, Transporte, etc.).

Tipos de categorías:
  - Categorías globales (user_id = NULL): vienen por defecto en el sistema
  - Categorías del usuario (user_id = usuario): las crea cada usuario

El endpoint GET /categories/ devuelve AMBAS (globales + propias).
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=list[CategoryResponse])
async def list_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Devuelve las categorías disponibles para el usuario.

    Incluye:
      - Categorías globales (user_id IS NULL)
      - Categorías personalizadas del usuario

    Esto permite tener una base de categorías comunes que
    todos los usuarios pueden usar, más las que cada uno crea.
    """
    result = await db.execute(
        select(Category).where(
            or_(
                Category.user_id == current_user.id,
                Category.user_id.is_(None),  # Categorías globales
            )
        )
    )
    return result.scalars().all()


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Crea una categoría personalizada para el usuario.

    Ejemplo:
      { "name": "Supermercado", "icon": "cart", "color": "#10b981", "type": "expense" }
    """
    category = Category(user_id=current_user.id, **payload.model_dump())
    db.add(category)
    await db.flush()
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Elimina una categoría personalizada.

    NOTA: Solo se pueden eliminar categorías propias (no las globales).
    Las transacciones que usaban esta categoría quedan con category_id = NULL.
    """
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == current_user.id)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada",
        )
    await db.delete(category)
