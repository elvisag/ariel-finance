"""add updated_at columns to users and accounts

Revision ID: 2a3b4c5d6e7f
Revises: 9e525368605a
Create Date: 2026-06-30 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '2a3b4c5d6e7f'
down_revision: Union[str, None] = '9e525368605a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('accounts', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('accounts', 'updated_at')
    op.drop_column('users', 'updated_at')
