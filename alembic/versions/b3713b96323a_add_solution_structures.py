"""add_solution_structures

Revision ID: b3713b96323a
Revises: 4ec22bd48818
Create Date: 2026-02-22 19:20:11.913777

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3713b96323a'
down_revision: Union[str, Sequence[str], None] = '4ec22bd48818'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ===== ТРИГГЕР: валидация перед вставкой/обновлением =====
    op.execute("""
    CREATE OR REPLACE FUNCTION validate_solution_insert_update()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM task WHERE task_id = NEW.sol_task) THEN
            RAISE EXCEPTION 'Задача с ID % не существует', NEW.sol_task;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM "user" WHERE user_id = NEW.sol_user) THEN
            RAISE EXCEPTION 'Пользователь с ID % не существует', NEW.sol_user;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM prog_language WHERE proglang_id = NEW.sol_prog_lang) THEN
            RAISE EXCEPTION 'Язык программирования с ID % не существует', NEW.sol_prog_lang;
        END IF;
               
        IF NOT EXISTS (SELECT 1 FROM solution_state WHERE solution_state_id = NEW.sol_state) THEN
            RAISE EXCEPTION 'Состояние решения с ID % не существует', NEW.sol_state;
        END IF;

        IF TG_OP = 'UPDATE' THEN
            IF OLD.sol_task <> NEW.sol_task THEN
                RAISE EXCEPTION 'Изменение задачи решения запрещено';
            END IF;
            IF OLD.sol_user <> NEW.sol_user THEN
                RAISE EXCEPTION 'Изменение автора решения запрещено';
            END IF;
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    CREATE TRIGGER trg_validate_solution_insert_update
    BEFORE INSERT OR UPDATE ON solution
    FOR EACH ROW
    EXECUTE FUNCTION validate_solution_insert_update();
    """)

    # ===== ПРОЦЕДУРА: отправка решения =====
    op.execute("""
    CREATE OR REPLACE PROCEDURE submit_solution(
        p_task_id INTEGER,
        p_user_id INTEGER,
        p_prog_lang_id INTEGER,
        p_initial_state_id INTEGER DEFAULT 1  
    )
    LANGUAGE plpgsql
    AS $$
    DECLARE
        new_sol_id INT;
    BEGIN
        INSERT INTO solution (
            sol_task, sol_user, sol_prog_lang, sol_created_at, sol_state
        ) VALUES (
            p_task_id, p_user_id, p_prog_lang_id, NOW(), p_initial_state_id
        ) RETURNING solution_id INTO new_sol_id;

        RAISE NOTICE 'Решение #% отправлено пользователем % для задачи %', 
            new_sol_id, p_user_id, p_task_id;
    END;
    $$;
    """)

    # ===== ПРОЦЕДУРА: обновление состояния решения =====
    op.execute("""
    CREATE OR REPLACE PROCEDURE update_solution_state(
        p_solution_id INTEGER,
        p_new_state_id INTEGER
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM solution WHERE solution_id = p_solution_id) THEN
            RAISE EXCEPTION 'Решение с ID % не существует', p_solution_id;
        END IF;

        UPDATE solution
        SET sol_state = p_new_state_id
        WHERE solution_id = p_solution_id;

        RAISE NOTICE 'Состояние решения #% обновлено до %', p_solution_id, p_new_state_id;
    END;
    $$;
    """)

    op.execute("""
    CREATE OR REPLACE VIEW contest_solutions AS
    SELECT
        s.solution_id,
        c.contest_id,
        c.contest_name,
        t.task_id,
        t.task_name,
        u.nickname AS author,
        pl.prog_lang_name AS language,
        ss.state_name AS status,
        s.sol_created_at
    FROM solution s
    JOIN task t ON s.sol_task = t.task_id
    JOIN contest_task ct ON t.task_id = ct.task_ct
    JOIN contest c ON ct.contest_ct = c.contest_id
    JOIN "user" u ON s.sol_user = u.user_id
    JOIN prog_language pl ON s.sol_prog_lang = pl.proglang_id
    JOIN solution_state ss ON s.sol_state = ss.solution_state_id
    ORDER BY s.sol_created_at DESC;
    """)




def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS contest_solutions;")
    op.execute("DROP PROCEDURE IF EXISTS update_solution_state(INTEGER, INTEGER);")
    op.execute("DROP PROCEDURE IF EXISTS submit_solution(INTEGER, INTEGER, INTEGER, INTEGER);")

    op.execute("DROP TRIGGER IF EXISTS trg_validate_solution_insert_update ON solution;")
    op.execute("DROP FUNCTION IF EXISTS validate_solution_insert_update();")
