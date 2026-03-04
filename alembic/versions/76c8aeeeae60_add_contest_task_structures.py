"""add_contest_task_structures

Revision ID: 76c8aeeeae60
Revises: 51f2c9ee33bb
Create Date: 2026-02-17 16:11:58.811648

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '76c8aeeeae60'
down_revision: Union[str, Sequence[str], None] = '51f2c9ee33bb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    
    # ===== ТРИГГЕР: валидация перед вставкой =====
    op.execute("""
    CREATE OR REPLACE FUNCTION validate_contest_task_insert()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM contest WHERE contest_id = NEW.contest_ct) THEN
            RAISE EXCEPTION 'Контест с ID % не существует', NEW.contest_ct;
        END IF;
               
        IF NOT EXISTS (SELECT 1 FROM task WHERE task_id = NEW.task_ct) THEN
            RAISE EXCEPTION 'Задача с ID % не существует', NEW.task_ct;
        END IF;

        IF EXISTS (
            SELECT 1 FROM contest_task 
            WHERE contest_ct = NEW.contest_ct AND task_ct = NEW.task_ct
        ) THEN
            RAISE EXCEPTION 'Задача % уже добавлена в контест %', NEW.task_ct, NEW.contest_ct;
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    CREATE TRIGGER trg_validate_contest_task_insert
    BEFORE INSERT ON contest_task
    FOR EACH ROW
    EXECUTE FUNCTION validate_contest_task_insert();
    """)

    # ===== ХРАНИМАЯ ПРОЦЕДУРА: добавление задачи в контест =====
    op.execute("""
    CREATE OR REPLACE PROCEDURE add_task_to_contest(
        p_contest_id INTEGER,
        p_task_id INTEGER
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
        INSERT INTO contest_task (contest_ct, task_ct)
        VALUES (p_contest_id, p_task_id);
        
        RAISE NOTICE 'Задача % добавлена в контест %', p_task_id, p_contest_id;
    END;
    $$;
    """)

    # ===== ХРАНИМАЯ ПРОЦЕДУРА: удаление задачи из контеста =====
    op.execute("""
    CREATE OR REPLACE PROCEDURE remove_task_from_contest(
        p_contest_id INTEGER,
        p_task_id INTEGER
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
        DELETE FROM contest_task
        WHERE contest_ct = p_contest_id AND task_ct = p_task_id;

        IF NOT FOUND THEN
            RAISE NOTICE 'Задача % не найдена в контесте %', p_task_id, p_contest_id;
        ELSE
            RAISE NOTICE 'Задача % удалена из контеста %', p_task_id, p_contest_id;
        END IF;
    END;
    $$;
    """)

    # ===== ПРЕДСТАВЛЕНИЕ: задачи контеста с деталями =====
    op.execute("""
    CREATE OR REPLACE VIEW contest_tasks_with_details AS
    SELECT
        c.contest_id,
        c.contest_name,
        t.task_id AS task_id,
        t.task_name,
        u.nickname AS author_nickname,
        dl.diff_name AS difficulty,
        COALESCE(tc.category_name, 'Без категории') AS category,
        t.time_limit,
        t.memory_limit,
        t.created_at
    FROM contest c
    JOIN contest_task ct ON c.contest_id = ct.contest_ct
    JOIN task t ON ct.task_ct = t.task_id
    JOIN "user" u ON t.author = u.user_id
    JOIN difficulty_level dl ON t.difficulty = dl.difficulty_id
    LEFT JOIN task_category tc ON t.category = tc.category_id
    ORDER BY 
        c.contest_id,
        dl.difficulty_id,
        t.task_id;
    """)

    # ===== ПРЕДСТАВЛЕНИЕ: статистика по задачам в контестах =====
    op.execute("""
    CREATE OR REPLACE VIEW contest_task_statistics AS
    SELECT 
        t.task_id,
        t.task_name,
        c.contest_id,
        c.contest_name,
        COUNT(s.solution_id) AS total_submissions,
        COUNT(CASE WHEN ss.state_name = 'Accepted' THEN 1 END) AS accepted_solutions,
        ROUND(
            (COUNT(CASE WHEN ss.state_name = 'Accepted' THEN 1 END)::NUMERIC / 
            NULLIF(COUNT(s.solution_id), 0)) * 100, 
            2
        ) AS success_rate
    FROM contest_task ct
    JOIN contest c ON ct.contest_ct = c.contest_id
    JOIN task t ON ct.task_ct = t.task_id
    LEFT JOIN solution s ON t.task_id = s.sol_task
    LEFT JOIN solution_state ss ON s.sol_state = ss.solution_state_id
    GROUP BY t.task_id, t.task_name, c.contest_id, c.contest_name
    ORDER BY c.contest_id, t.task_id;
    """)



def downgrade() -> None:
    op.drop_view("contest_task_statistics")
    op.drop_view("contest_tasks_with_details")

    op.execute("DROP PROCEDURE IF EXISTS remove_task_from_contest(INTEGER, INTEGER);")
    op.execute("DROP PROCEDURE IF EXISTS add_task_to_contest(INTEGER, INTEGER);")

    op.execute("DROP TRIGGER IF EXISTS trg_validate_contest_task_insert ON contest_task;")
    op.execute("DROP FUNCTION IF EXISTS validate_contest_task_insert();")

