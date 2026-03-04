"""change_contest_duration_to_interval

Revision ID: 14cc2b6241d1
Revises: a0cae5a93efd
Create Date: 2026-02-10 23:26:01.074321

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '14cc2b6241d1'
down_revision: Union[str, Sequence[str], None] = '9cfa7421329f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DROP VIEW IF EXISTS upcoming_and_active_contests")
    op.execute("DROP VIEW IF EXISTS contest_statistics")
    op.execute("DROP VIEW IF EXISTS contest_participants")
    # Изменяем тип колонки duration на INTERVAL
    op.alter_column('contest', 'duration',
                    existing_type=sa.TIME(),
                    type_=sa.Interval(),
                    postgresql_using='duration::interval')


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS upcoming_and_active_contests")
    op.execute("DROP VIEW IF EXISTS contest_statistics") 
    op.execute("DROP VIEW IF EXISTS contest_participants")
    op.alter_column('contest', 'duration',
                    existing_type=sa.Interval(),
                    type_=sa.TIME(),
                    postgresql_using='duration::time')
