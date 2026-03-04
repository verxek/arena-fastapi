"""add_contest_structures

Revision ID: d9bc72401ac6
Revises: 14cc2b6241d1
Create Date: 2026-02-10 23:46:01.944351

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd9bc72401ac6'
down_revision: Union[str, Sequence[str], None] = '14cc2b6241d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

  
    op.execute("DROP TRIGGER IF EXISTS trg_before_contest_insert ON contest;")
    op.execute("DROP TRIGGER IF EXISTS trg_before_contest_update ON contest;")

    op.execute("DROP FUNCTION IF EXISTS before_contest_insert();")
    op.execute("DROP FUNCTION IF EXISTS before_contest_update();")
  
    op.execute("DROP PROCEDURE IF EXISTS create_contest(VARCHAR, TIMESTAMP, INTERVAL, INTEGER);")
    op.execute("DROP PROCEDURE IF EXISTS update_contest(INTEGER, VARCHAR, TIMESTAMP, INTERVAL);")
    op.execute("DROP PROCEDURE IF EXISTS change_contest_status(INTEGER, INTEGER);")

    op.execute("DROP VIEW IF EXISTS upcoming_and_active_contests;")
    op.execute("DROP VIEW IF EXISTS contest_statistics;")
    op.execute("DROP VIEW IF EXISTS contest_participants;")

    op.execute("""
    CREATE OR REPLACE FUNCTION before_contest_insert()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.contest_created_at = NOW() AT TIME ZONE 'UTC';
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)
    
    op.execute("""
    CREATE TRIGGER trg_before_contest_insert
    BEFORE INSERT ON contest
    FOR EACH ROW
    EXECUTE FUNCTION before_contest_insert();
    """)

    # валидация статуса контеста
    op.execute("""
    CREATE OR REPLACE FUNCTION before_contest_update()
    RETURNS TRIGGER AS $$
    DECLARE
        v_status_name TEXT;
    BEGIN
        -- Проверка существования статуса
        IF NOT EXISTS (SELECT 1 FROM contest_status WHERE contest_status_id = NEW.contest_status) THEN
            RAISE EXCEPTION 'Статус контеста с ID % не существует', NEW.contest_status;
        END IF;
        
        -- запрет изменения завершённых/отменённых контестов
        IF OLD.contest_status IN (4, 5) AND NEW.contest_status != OLD.contest_status THEN
            SELECT status_name INTO v_status_name 
            FROM contest_status 
            WHERE contest_status_id = OLD.contest_status;
            RAISE EXCEPTION 'Контест со статусом "%" нельзя изменить', v_status_name;
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)
    
    op.execute("""
    CREATE TRIGGER trg_before_contest_update
    BEFORE INSERT OR UPDATE OF contest_status ON contest
    FOR EACH ROW
    EXECUTE FUNCTION before_contest_update();
    """)

    # ===== ХРАНИМЫЕ ПРОЦЕДУРЫ ДЛЯ contest =====

    # создание контеста
    op.execute("""
    CREATE OR REPLACE PROCEDURE create_contest(
        p_contest_name VARCHAR(200),
        p_start_time TIMESTAMP WITHOUT TIME ZONE,
        p_duration INTERVAL,
        p_contest_status INT DEFAULT 1
    )
    LANGUAGE plpgsql
    AS $$
    DECLARE
        v_contest_id INTEGER;
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM contest_status WHERE contest_status_id = p_contest_status) THEN
            RAISE EXCEPTION 'Статус контеста с ID % не существует', p_contest_status;
        END IF;

        INSERT INTO contest (
            contest_name, start_time, duration, contest_status
        )
        VALUES (
            p_contest_name, p_start_time, p_duration, p_contest_status
        )
        RETURNING contest_id INTO v_contest_id;
        
        RAISE NOTICE 'Контест "%" (ID=%) создан', p_contest_name, v_contest_id;
    END;
    $$;
    """)

    # обновление параметров контеста
    op.execute("""
    CREATE OR REPLACE PROCEDURE update_contest(
        p_contest_id INTEGER,
        p_contest_name VARCHAR(200) DEFAULT NULL,
        p_start_time TIMESTAMP WITHOUT TIME ZONE DEFAULT NULL,
        p_duration INTERVAL DEFAULT NULL
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM contest WHERE contest_id = p_contest_id) THEN
            RAISE EXCEPTION 'Контест с ID % не существует', p_contest_id;
        END IF;
        
        -- обновление (статус не меняется)
        UPDATE contest
        SET 
            contest_name = COALESCE(p_contest_name, contest_name),
            start_time = COALESCE(p_start_time, start_time),
            duration = COALESCE(p_duration, duration)
        WHERE contest_id = p_contest_id;
        
        RAISE NOTICE 'Контест % обновлён', p_contest_id;
    END;
    $$;
    """)

    # безопасное изменение статуса
    op.execute("""
    CREATE OR REPLACE PROCEDURE change_contest_status(
        p_contest_id INTEGER,
        p_new_status INT
    )
    LANGUAGE plpgsql
    AS $$
    DECLARE
        v_current_status INT;
        v_new_status_name TEXT;
    BEGIN
        SELECT contest_status INTO v_current_status 
        FROM contest 
        WHERE contest_id = p_contest_id;
        
        IF v_current_status IS NULL THEN
            RAISE EXCEPTION 'Контест с ID % не существует', p_contest_id;
        END IF;
        
        CASE v_current_status
            WHEN 1 THEN  -- Draft → Upcoming, Cancelled
                IF p_new_status NOT IN (2, 5) THEN
                    RAISE EXCEPTION 'Из статуса "Draft" можно перейти только в "Upcoming" или "Cancelled"';
                END IF;
            WHEN 2 THEN  -- Upcoming → Active, Cancelled
                IF p_new_status NOT IN (3, 5) THEN
                    RAISE EXCEPTION 'Из статуса "Upcoming" можно перейти только в "Active" или "Cancelled"';
                END IF;
            WHEN 3 THEN  -- Active → Finished, Cancelled
                IF p_new_status NOT IN (4, 5) THEN
                    RAISE EXCEPTION 'Из статуса "Active" можно перейти только в "Finished" или "Cancelled"';
                END IF;
            WHEN 4 THEN  -- Finished → только сам в себя
                IF p_new_status != 4 THEN
                    RAISE EXCEPTION 'Контест уже завершён, статус нельзя изменить';
                END IF;
            WHEN 5 THEN  -- Cancelled → только сам в себя
                IF p_new_status != 5 THEN
                    RAISE EXCEPTION 'Контест отменён, статус нельзя изменить';
                END IF;
        END CASE;
        
        UPDATE contest 
        SET contest_status = p_new_status 
        WHERE contest_id = p_contest_id;
        
        SELECT status_name INTO v_new_status_name 
        FROM contest_status 
        WHERE contest_status_id = p_new_status;
        
        RAISE NOTICE 'Статус контеста % изменён на "%"', p_contest_id, v_new_status_name;
    END;
    $$;
    """)

    # ===== ПРЕДСТАВЛЕНИЯ ДЛЯ contest =====

    # активные и предстоящие контесты
    op.execute("""
    CREATE OR REPLACE VIEW upcoming_and_active_contests AS
    SELECT 
        c.contest_id,
        c.contest_name,
        c.start_time,
        c.duration,
        cs.status_name AS contest_status,
        c.contest_created_at,
        CASE 
            WHEN c.start_time > NOW() AT TIME ZONE 'UTC' THEN 'upcoming'
            WHEN c.start_time <= NOW() AT TIME ZONE 'UTC' 
                 AND c.start_time + c.duration > NOW() AT TIME ZONE 'UTC' THEN 'active'
            ELSE 'finished'
        END AS current_phase
    FROM contest c
    JOIN contest_status cs ON c.contest_status = cs.contest_status_id
    WHERE c.contest_status IN (2, 3)  -- Upcoming и Active
    ORDER BY c.start_time;
    """)

    # статистика по контестам
    op.execute("""
    CREATE OR REPLACE VIEW contest_statistics AS
    SELECT 
        c.contest_id,
        c.contest_name,
        c.start_time,
        c.duration,
        cs.status_name AS contest_status,
        COUNT(DISTINCT cu.cu_user) AS participants_count,
        COUNT(DISTINCT ct.task_ct) AS tasks_count,
        COUNT(s.solution_id) AS total_submissions,
        SUM(CASE WHEN ss.state_name = 'Accepted' THEN 1 ELSE 0 END) AS accepted_solutions,
        ROUND(
            (SUM(CASE WHEN ss.state_name = 'Accepted' THEN 1 ELSE 0 END)::NUMERIC / 
            NULLIF(COUNT(s.solution_id), 0)) * 100, 
            2
        ) AS success_rate
    FROM contest c
    JOIN contest_status cs ON c.contest_status = cs.contest_status_id
    LEFT JOIN contest_user cu ON c.contest_id = cu.cu_contest
    LEFT JOIN contest_task ct ON c.contest_id = ct.contest_ct
    LEFT JOIN solution s ON ct.task_ct = s.sol_task
    LEFT JOIN solution_state ss ON s.sol_state = ss.solution_state_id
    GROUP BY c.contest_id, c.contest_name, c.start_time, c.duration, cs.status_name
    ORDER BY c.start_time DESC;
    """)

    # участники контестов с ролями
    op.execute("""
    CREATE OR REPLACE VIEW contest_participants AS
    SELECT 
        c.contest_id,
        c.contest_name,
        u.user_id,
        u.nickname,
        u.email,
        cr.role_name AS role
    FROM contest c
    JOIN contest_user cu ON c.contest_id = cu.cu_contest
    JOIN "user" u ON cu.cu_user = u.user_id
    JOIN contest_role cr ON cu.role = cr.role_id
    ORDER BY c.contest_id, u.nickname;
    """)



def downgrade() -> None:
    # Представления
    op.execute("DROP VIEW IF EXISTS contest_participants;")
    op.execute("DROP VIEW IF EXISTS contest_statistics;")
    op.execute("DROP VIEW IF EXISTS upcoming_and_active_contests;")

    # Процедуры
    op.execute("DROP PROCEDURE IF EXISTS change_contest_status(INTEGER, INTEGER);")
    op.execute("DROP PROCEDURE IF EXISTS update_contest(INTEGER, VARCHAR, TIMESTAMP, INTERVAL);")
    op.execute("DROP PROCEDURE IF EXISTS create_contest(VARCHAR, TIMESTAMP, INTERVAL, INTEGER);")

    # Триггеры и функции
    op.execute("DROP TRIGGER IF EXISTS trg_before_contest_update ON contest;")
    op.execute("DROP TRIGGER IF EXISTS trg_before_contest_insert ON contest;")
    op.execute("DROP FUNCTION IF EXISTS before_contest_update();")
    op.execute("DROP FUNCTION IF EXISTS before_contest_insert();")
