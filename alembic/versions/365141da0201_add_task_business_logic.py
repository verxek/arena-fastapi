"""add_task_business_logic

Revision ID: 365141da0201
Revises: eeaa26a3abcc
Create Date: 2026-02-05 22:05:04.729997

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '365141da0201'
down_revision: Union[str, Sequence[str], None] = 'eeaa26a3abcc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ===== ТРИГГЕРЫ ДЛЯ ТАБЛИЦЫ task =====
    
    # автоматическая установка времени создания
    op.execute("""
    CREATE OR REPLACE FUNCTION before_task_insert()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.created_at = NOW() AT TIME ZONE 'UTC';
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)
    
    op.execute("""
    CREATE TRIGGER trg_before_task_insert
    BEFORE INSERT ON task
    FOR EACH ROW
    EXECUTE FUNCTION before_task_insert();
    """)


    # ===== ХРАНИМЫЕ ПРОЦЕДУРЫ ДЛЯ task =====
    
    # безопасное создание задачи
    op.execute("""
    CREATE OR REPLACE PROCEDURE create_task(
    p_task_name VARCHAR(50),
    p_author INTEGER,
    p_statement TEXT,
    p_difficulty INTEGER,
    p_category INTEGER,
    p_time_limit INTEGER DEFAULT NULL,
    p_memory_limit INTEGER DEFAULT NULL,
    p_make_visible_after_contest BOOLEAN DEFAULT FALSE,
    p_visibility BOOLEAN DEFAULT TRUE  
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
    INSERT INTO task (
        task_name, author, statement, created_at,
        difficulty, category, time_limit, memory_limit,
        make_visible_after_contest, visibility 
    )
    VALUES (
        p_task_name, p_author, p_statement, NOW() AT TIME ZONE 'UTC',
        p_difficulty, p_category, p_time_limit, p_memory_limit,
        p_make_visible_after_contest, p_visibility
    );
    
    RAISE NOTICE 'Задача создана';
    END;
    $$;
    """)

    op.execute("""
    CREATE OR REPLACE PROCEDURE update_task(
        p_task_id INTEGER,
        p_task_name VARCHAR(50) DEFAULT NULL,
        p_statement TEXT DEFAULT NULL,
        p_difficulty INTEGER DEFAULT NULL,
        p_category INTEGER DEFAULT NULL,
        p_time_limit INTEGER DEFAULT NULL,
        p_memory_limit INTEGER DEFAULT NULL,
        p_make_visible_after_contest BOOLEAN DEFAULT NULL,
        p_visibility BOOLEAN DEFAULT NULL
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM task WHERE task_id = p_task_id) THEN
            RAISE EXCEPTION 'Задача с ID % не существует', p_task_id;
        END IF;
        
        -- автор не изменяется, created_at не изменяется
        UPDATE task
        SET 
            task_name = COALESCE(p_task_name, task_name),
            statement = COALESCE(p_statement, statement),
            difficulty = COALESCE(p_difficulty, difficulty),
            category = COALESCE(p_category, category),
            time_limit = COALESCE(p_time_limit, time_limit),
            memory_limit = COALESCE(p_memory_limit, memory_limit),
            make_visible_after_contest = COALESCE(p_make_visible_after_contest, make_visible_after_contest),
            visibility = COALESCE(p_visibility, visibility)
        WHERE task_id = p_task_id;
        
        RAISE NOTICE 'Задача % успешно обновлена', p_task_id;
    END;
    $$;
    """)
    # ===== ПРЕДСТАВЛЕНИЯ ДЛЯ task =====
    
    op.execute("""
    CREATE OR REPLACE VIEW visible_tasks AS
    SELECT 
        t.task_id,
        t.task_name,
        t.author,
        u.nickname AS author_nickname,
        t.statement,
        t.difficulty,
        dl.diff_name AS difficulty_name,
        t.category,
        tc.category_name AS category_name,
        t.created_at,
        t.time_limit,
        t.memory_limit,
        t.make_visible_after_contest,
        t.visibility
    FROM task t
    JOIN "user" u ON t.author = u.user_id
    JOIN difficulty_level dl ON t.difficulty = dl.difficulty_id
    JOIN task_category tc ON t.category = tc.category_id
    WHERE t.visibility = TRUE;
    """)

    # cтатистика по задачам
    op.execute("""
    CREATE OR REPLACE VIEW task_statistics AS
    SELECT 
        t.task_id,
        t.task_name,
        t.author,
        u.nickname AS author_nickname,
        t.difficulty,
        dl.diff_name AS difficulty_name,
        t.category,
        tc.category_name AS category_name,
        t.created_at,
        t.make_visible_after_contest,
        t.visibility,
    
        COUNT(s.solution_id) AS total_submissions,
        SUM(CASE WHEN ss.state_name = 'Accepted' THEN 1 ELSE 0 END) AS accepted_count,
        ROUND(
            (SUM(CASE WHEN ss.state_name = 'Accepted' THEN 1 ELSE 0 END)::NUMERIC / 
            NULLIF(COUNT(s.solution_id), 0)) * 100, 
            2
        ) AS success_rate,
    
        COUNT(DISTINCT ct.contest_ct) AS contests_used,
    
        COUNT(DISTINCT s.sol_prog_lang) AS languages_used
    
    FROM task t
    JOIN "user" u ON t.author = u.user_id
    JOIN difficulty_level dl ON t.difficulty = dl.difficulty_id
    JOIN task_category tc ON t.category = tc.category_id
    LEFT JOIN solution s ON t.task_id = s.sol_task
    LEFT JOIN solution_state ss ON s.sol_state = ss.solution_state_id
    LEFT JOIN contest_task ct ON t.task_id = ct.task_ct
    GROUP BY t.task_id, t.task_name, t.author, u.nickname, t.difficulty, dl.diff_name,
         t.category, tc.category_name, t.created_at, t.make_visible_after_contest, t.visibility;
    """)

    # задачи по категориям 
    op.execute("""
    CREATE OR REPLACE VIEW tasks_by_category AS
    SELECT 
        tc.category_id,
        tc.category_name,
        COUNT(t.task_id) AS total_tasks,
        COUNT(CASE WHEN t.visibility THEN 1 END) AS visible_tasks,
        COUNT(CASE WHEN t.make_visible_after_contest THEN 1 END) AS visible_after_contest,
        AVG(dl.difficulty_id) AS avg_difficulty
    FROM task_category tc
    LEFT JOIN task t ON tc.category_id = t.category
    LEFT JOIN difficulty_level dl ON t.difficulty = dl.difficulty_id
    GROUP BY tc.category_id, tc.category_name
    ORDER BY total_tasks DESC;
    """)

    # задачи по сложности 
    op.execute("""
    CREATE OR REPLACE VIEW tasks_by_difficulty AS
    SELECT 
        dl.difficulty_id,
        dl.diff_name,
        COUNT(t.task_id) AS total_tasks,
        COUNT(CASE WHEN t.visibility THEN 1 END) AS visible_tasks,
        COUNT(CASE WHEN t.make_visible_after_contest THEN 1 END) AS visible_after_contest,
        COUNT(CASE WHEN t.time_limit IS NOT NULL THEN 1 END) AS has_time_limit,
        COUNT(CASE WHEN t.memory_limit IS NOT NULL THEN 1 END) AS has_memory_limit
    FROM difficulty_level dl
    LEFT JOIN task t ON dl.difficulty_id = t.difficulty
    GROUP BY dl.difficulty_id, dl.diff_name
    ORDER BY dl.difficulty_id;
    """)


def downgrade() -> None:

    op.execute("DROP VIEW IF EXISTS tasks_by_difficulty;")
    op.execute("DROP VIEW IF EXISTS tasks_by_category;")
    op.execute("DROP VIEW IF EXISTS task_statistics;")
    op.execute("DROP VIEW IF EXISTS visible_tasks")
    
    op.execute("DROP PROCEDURE IF EXISTS create_task(VARCHAR, INTEGER, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, BOOLEAN);")
    op.execute("DROP PROCEDURE IF EXISTS update_task(INTEGER, VARCHAR, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, BOOLEAN, BOOLEAN);")
    
    op.execute("DROP TRIGGER IF EXISTS trg_before_task_insert ON task;")
    op.execute("DROP FUNCTION IF EXISTS before_task_insert();")
  
