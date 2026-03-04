"""add_sandbox_structures

Revision ID: 4ec22bd48818
Revises: 76c8aeeeae60
Create Date: 2026-02-22 19:01:41.109707

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4ec22bd48818'
down_revision: Union[str, Sequence[str], None] = '76c8aeeeae60'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ===== ТРИГГЕР: валидация перед вставкой =====
    op.execute("""
    CREATE OR REPLACE FUNCTION validate_sandbox_insert()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM solution WHERE solution_id = NEW.sandbox_sol) THEN
            RAISE EXCEPTION 'Решение с ID % не существует', NEW.sandbox_sol;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM sandbox_verdict WHERE verdict_id = NEW.sandbox_ver) THEN
            RAISE EXCEPTION 'Вердикт с ID % не существует', NEW.sandbox_ver;
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    CREATE TRIGGER trg_validate_sandbox_insert
    BEFORE INSERT ON sandbox
    FOR EACH ROW
    EXECUTE FUNCTION validate_sandbox_insert();
    """)


# ===== ХРАНИМАЯ ПРОЦЕДУРА: запись результата песочницы =====
    op.execute("""
    CREATE OR REPLACE PROCEDURE record_sandbox_result(
        p_solution_id INTEGER,
        p_verdict_id INTEGER,
        p_output TEXT DEFAULT NULL,
        p_execution_time TIME DEFAULT NULL,
        p_memory_used FLOAT DEFAULT NULL
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
        INSERT INTO sandbox (
            sandbox_sol,
            sandbox_ver,
            output,
            execution_time,
            memory_used
        )
        VALUES (
            p_solution_id,
            p_verdict_id,
            p_output,
            p_execution_time,
            p_memory_used
        );

        RAISE NOTICE 'Записан результат песочницы: решение=%, вердикт=%', 
            p_solution_id, p_verdict_id;
    END;
    $$;
    """)

    # ===== ПРЕДСТАВЛЕНИЕ: результаты с деталями (включая output и verdict_name) =====
    op.execute("""
    CREATE OR REPLACE VIEW sandbox_results_with_details AS
    SELECT 
        s.sandbox_id,
        s.sandbox_sol AS solution_id,
        sv.verdict_name,
        s.output,
        s.execution_time,
        s.memory_used,
        sol.sol_task AS task_id
    FROM sandbox s
    JOIN sandbox_verdict sv ON s.sandbox_ver = sv.verdict_id
    JOIN solution sol ON s.sandbox_sol = sol.solution_id
    ORDER BY s.sandbox_id;
    """)




def downgrade() -> None:
    op.drop_view("sandbox_results_with_details")

    op.execute("DROP PROCEDURE IF EXISTS record_sandbox_result(INTEGER, INTEGER, TEXT, TIME, FLOAT);")

    op.execute("DROP TRIGGER IF EXISTS trg_validate_sandbox_insert ON sandbox;")
    op.execute("DROP FUNCTION IF EXISTS validate_sandbox_insert();")
