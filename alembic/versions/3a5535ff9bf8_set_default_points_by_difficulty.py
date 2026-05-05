"""set_default_points_by_difficulty

Revision ID: 3a5535ff9bf8
Revises: 809f83b210bb
Create Date: 2026-05-05 23:05:13.952517

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from sqlalchemy.sql import table, column, select, update
from sqlalchemy import Integer, String


# revision identifiers, used by Alembic.
revision: str = '3a5535ff9bf8'
down_revision: Union[str, Sequence[str], None] = '809f83b210bb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Проставить баллы задачам на основе их сложности"""
    
    DIFFICULTY_POINTS_MAP = {
        1: 500,    # Лёгкая
        2: 1000,   # Средняя
        3: 1500,   # выше среднего
        4: 2000,   # Сложная
        5: 2500,   # Сложная+
        6: 3000,   # Очень сложная
    }
    DEFAULT_POINTS = 500 
    

    task_table = table('task',
        column('task_id', Integer),
        column('difficulty', Integer),
        column('points', Integer),
    )
 
    connection = op.get_bind()
    
    
    stmt = select(task_table.c.task_id, task_table.c.difficulty).where(
        task_table.c.points.is_(None)
    )
    tasks = connection.execute(stmt).fetchall()
    
    updated_count = 0
    
    for task_id, difficulty in tasks:

        points = DIFFICULTY_POINTS_MAP.get(difficulty, DEFAULT_POINTS)
        

        update_stmt = update(task_table).where(
            task_table.c.task_id == task_id
        ).values(points=points)
        
        connection.execute(update_stmt)
        updated_count += 1
    
    print(f" Updated {updated_count} tasks with default points by difficulty")


def downgrade() -> None:
   
    
    task_table = table('task',
        column('task_id', Integer),
        column('points', Integer),
    )
    
    connection = op.get_bind()
    
    # Сбрасываем все points в NULL (или можно удалить эту функцию, если откат не нужен)
    stmt = update(task_table).values(points=None)
    connection.execute(stmt)
    
    print("⬇Downgrade: reset points to NULL")