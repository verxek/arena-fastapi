"""add user role enum

Revision ID: 2666a1d2893d
Revises: b3713b96323a
Create Date: 2026-03-04 20:35:37.560480

"""
from typing import Sequence, Union
from sqlalchemy.dialects import postgresql
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2666a1d2893d'
down_revision: Union[str, Sequence[str], None] = 'b3713b96323a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from sqlalchemy.dialects import postgresql
from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    op.drop_index(op.f('ix_contest_duration'), table_name='contest')

    user_role_enum = postgresql.ENUM(
        'participant',
        'organizer',
        'admin',
        name='user_role'
    )

    user_role_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        'user',
        sa.Column(
            'role',
            user_role_enum,
            server_default='participant',
            nullable=False
        )
    )


def downgrade() -> None:
    op.drop_column('user', 'role')
    op.create_index(op.f('ix_contest_duration'), 'contest', ['duration'], unique=False)

    user_role_enum = postgresql.ENUM(
        'participant',
        'organizer',
        'admin',
        name='user_role'
    )

    user_role_enum.drop(op.get_bind(), checkfirst=True)
