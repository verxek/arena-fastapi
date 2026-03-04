"""populate_reference_data

Revision ID: 9cfa7421329f
Revises: 365141da0201
Create Date: 2026-02-06 14:47:09.713801

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9cfa7421329f'
down_revision: Union[str, Sequence[str], None] = '365141da0201'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# заполняем справочные таблицы 
def upgrade() -> None:
    # === Категории задач ===
    categories = [
        "Арифметика",
        "Геометрия", 
        "Строки",
        "Массивы",
        "Поиск",
        "Теория чисел",
        "Комбинаторика",
        "Матрицы",
        "Вероятность",
        "Жадные алгоритмы",
        "Сортировка",
        "Графы",
        "Рекурсия",
        "Регулярные выражения",
        "Прочее"
    ]
    
    for category in categories:
        op.execute(
            f"INSERT INTO task_category (category_name) VALUES ('{category}') "
            "ON CONFLICT DO NOTHING"
        )

    # === Уровни сложности ===
    difficulties = [
        ("Легкий", 1),
        ("Средний", 2), 
        ("Выше среднего", 3),
        ("Сложный", 4),
        ("Очень сложный", 5),
        ("Без уровня сложности", 6)
    ]
    
    for name, id_val in difficulties:
        op.execute(
            f"INSERT INTO difficulty_level (difficulty_id, diff_name) VALUES ({id_val}, '{name}') "
            "ON CONFLICT DO NOTHING"
        )

    # === Роли в контесте ===
    roles = [
        ("Участник", 1),
        ("Организатор", 2)
    ]
    
    for name, id_val in roles:
        op.execute(
            f"INSERT INTO contest_role (role_id, role_name) VALUES ({id_val}, '{name}') "
            "ON CONFLICT DO NOTHING"
        )

    # === Языки программирования ===
    languages = [
        ("Python", 1),
        ("C++", 2)
    ]
    
    for name, id_val in languages:
        op.execute(
            f"INSERT INTO prog_language (proglang_id, prog_lang_name) VALUES ({id_val}, '{name}') "
            "ON CONFLICT DO NOTHING"
        )

    # === Статус контеста ===
    contest_statuses = [
        ("Draft", 1),       
        ("Upcoming", 2),     
        ("Active", 3),      
        ("Finished", 4),    
        ("Cancelled", 5)     
    ]

    for name, id_val in contest_statuses:
        op.execute(
            f"INSERT INTO contest_status (contest_status_id, status_name) VALUES ({id_val}, '{name}') "
            "ON CONFLICT DO NOTHING"
        )

    # === Состояния решений ===
    solution_states = [
        "Pending",
        "In Queue",     
        "Processing",   
        "Accepted",     
        "Wrong Answer", 
        "Time Limit Exceeded", 
        "Memory Limit Exceeded", 
        "Runtime Error", 
        "Compilation Error"
    ]
    
    for state in solution_states:
        op.execute(
            f"INSERT INTO solution_state (state_name) VALUES ('{state}') "
            "ON CONFLICT DO NOTHING"
        )

    # === Вердикты песочницы ===
    sandbox_verdicts = [
        "OK",   # accepted        
        "WA",   # wrong answer
        "TLE",  # time limit exceeded       
        "MLE",  # memory limit exceeded       
        "RE",   # runtime error        
        "CE",   # compilation error               
        "SV",   # security violation        
        "IE"    # internal error        
    ]
    
    for verdict in sandbox_verdicts:
        op.execute(
            f"INSERT INTO sandbox_verdict (verdict_name) VALUES ('{verdict}') "
            "ON CONFLICT DO NOTHING"
        )


def downgrade() -> None:
    op.execute("DELETE FROM sandbox_verdict;")
    op.execute("DELETE FROM solution_state;")
    op.execute("DELETE FROM contest_status;")
    op.execute("DELETE FROM prog_language;")
    op.execute("DELETE FROM contest_role;")
    op.execute("DELETE FROM difficulty_level;")
    op.execute("DELETE FROM task_category;")
