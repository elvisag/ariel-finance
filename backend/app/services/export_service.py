import uuid
from datetime import date
from decimal import Decimal
from io import BytesIO

from fpdf import FPDF
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.account import Account
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.user import User


class FinancePDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(192, 192, 248)
        self.cell(0, 10, "Ariel Finance", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(192, 192, 248)
        self.line(10, 18, 200, 18)
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Pagina {self.page_no()}/{{nb}}", align="C")


def _type_label(t: str) -> str:
    return {"income": "Ingreso", "expense": "Gasto", "transfer": "Transferencia"}.get(t, t)


async def generate_transactions_pdf(
    db: AsyncSession,
    user: User,
    account_id: uuid.UUID | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    type: str | None = None,
) -> BytesIO:
    query = (
        select(Transaction)
        .options(selectinload(Transaction.account), selectinload(Transaction.category))
        .join(Account)
        .where(Account.user_id == user.id)
    )
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
    transactions: list[Transaction] = list(result.scalars().all())

    total_income = sum(t.amount for t in transactions if t.type == "income")
    total_expense = sum(t.amount for t in transactions if t.type == "expense")
    net = total_income - total_expense

    pdf = FinancePDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 10, "Reporte de Movimientos", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(200, 200, 200)
    pdf.cell(0, 6, f"Generado el: {date.today().isoformat()}", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, f"Usuario: {user.name} ({user.email})", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    pdf.set_fill_color(40, 40, 40)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(50, 8, f"Ingresos: ${total_income:,.2f}", border=1, fill=True)
    pdf.cell(50, 8, f"Gastos: ${total_expense:,.2f}", border=1, fill=True)
    pdf.cell(50, 8, f"Neto: ${net:,.2f}", border=1, fill=True)
    pdf.ln(12)

    if not transactions:
        pdf.set_text_color(200, 200, 200)
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 10, "No hay movimientos en el periodo seleccionado.", new_x="LMARGIN", new_y="NEXT")
        buf = BytesIO()
        pdf.output(buf)
        buf.seek(0)
        return buf

    col_widths = [14, 55, 30, 25, 30, 26]
    headers = ["#", "Descripcion", "Categoria", "Cuenta", "Tipo", "Monto"]

    pdf.set_fill_color(30, 30, 30)
    pdf.set_text_color(192, 192, 248)
    pdf.set_font("Helvetica", "B", 8)
    for i, h in enumerate(headers):
        pdf.cell(col_widths[i], 7, h, border=1, fill=True, align="C")
    pdf.ln()

    pdf.set_font("Helvetica", "", 8)
    for idx, tx in enumerate(transactions, 1):
        if pdf.get_y() > 265:
            pdf.add_page()
            pdf.set_fill_color(30, 30, 30)
            pdf.set_text_color(192, 192, 248)
            pdf.set_font("Helvetica", "B", 8)
            for i, h in enumerate(headers):
                pdf.cell(col_widths[i], 7, h, border=1, fill=True, align="C")
            pdf.ln()
            pdf.set_font("Helvetica", "", 8)

        is_expense = tx.type == "expense"
        text_color = (255, 107, 107) if is_expense else (107, 255, 107) if tx.type == "income" else (200, 200, 255)
        fill = is_expense and idx % 2 == 0

        pdf.set_fill_color(35, 35, 35) if fill else pdf.set_fill_color(40, 40, 40)
        pdf.set_text_color(*text_color)
        amount_str = f"-${tx.amount:,.2f}" if is_expense else f"${tx.amount:,.2f}"

        pdf.cell(col_widths[0], 6, str(idx), border=1, fill=True, align="C")
        pdf.cell(col_widths[1], 6, (tx.description or "")[:40], border=1, fill=True)
        pdf.cell(col_widths[2], 6, (tx.category.name if tx.category else "-")[:20], border=1, fill=True, align="C")
        pdf.cell(col_widths[3], 6, tx.account.name[:20], border=1, fill=True, align="C")
        pdf.cell(col_widths[4], 6, _type_label(tx.type), border=1, fill=True, align="C")
        pdf.cell(col_widths[5], 6, amount_str, border=1, fill=True, align="R")
        pdf.ln()

    buf = BytesIO()
    pdf.output(buf)
    buf.seek(0)
    return buf
