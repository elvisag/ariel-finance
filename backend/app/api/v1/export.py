from datetime import date

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.services import export_service

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/transactions/pdf")
async def export_transactions_pdf(
    account_id: str | None = Query(default=None),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    type: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    buf = await export_service.generate_transactions_pdf(
        db, current_user, account_id, start_date, end_date, type
    )
    return Response(
        content=buf.read(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=movimientos.pdf"},
    )
