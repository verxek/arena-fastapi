"""add_contest_user_structures

Revision ID: 51f2c9ee33bb
Revises: d9bc72401ac6
Create Date: 2026-02-17 15:23:05.520694

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from backend.app.database import engine


# revision identifiers, used by Alembic.
revision: str = '51f2c9ee33bb'
down_revision: Union[str, Sequence[str], None] = 'd9bc72401ac6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
     # Триггеры
     # валидация перед вставкой/обновлением
    op.execute("""
    CREATE OR REPLACE FUNCTION validate_contest_user()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM "user" WHERE user_id = NEW.cu_user) THEN
            RAISE EXCEPTION 'Пользователь с ID % не существует', NEW.cu_user;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM contest WHERE contest_id = NEW.cu_contest) THEN
            RAISE EXCEPTION 'Контест с ID % не существует', NEW.cu_contest;
        END IF;
               
        IF NOT EXISTS (SELECT 1 FROM contest_role WHERE role_id = NEW.role) THEN
            RAISE EXCEPTION 'Роль с ID % не существует', NEW.role;
        END IF;

        IF TG_OP = 'INSERT' AND EXISTS (
            SELECT 1 FROM contest_user 
            WHERE cu_user = NEW.cu_user AND cu_contest = NEW.cu_contest
        ) THEN
            RAISE EXCEPTION 'Пользователь уже зарегистрирован в этом контесте';
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

    op.execute("""
    CREATE TRIGGER trg_validate_contest_user
    BEFORE INSERT OR UPDATE ON contest_user
    FOR EACH ROW
    EXECUTE FUNCTION validate_contest_user();
    """)

    # ===== ХРАНИМЫЕ ПРОЦЕДУРЫ =====

    # добавление участника в контест
    op.execute("""
    CREATE OR REPLACE PROCEDURE add_user_to_contest(
        p_user_id INTEGER,
        p_contest_id INTEGER,
        p_role_id INTEGER DEFAULT 1  
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
        INSERT INTO contest_user (cu_user, cu_contest, role)
        VALUES (p_user_id, p_contest_id, p_role_id);
        
        RAISE NOTICE 'Пользователь % добавлен в контест % с ролью %',
            p_user_id, p_contest_id, p_role_id;
    END;
    $$;
    """)

    # удаление участника из контеста
    op.execute("""
    CREATE OR REPLACE PROCEDURE remove_user_from_contest(
        p_user_id INTEGER,
        p_contest_id INTEGER
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
        DELETE FROM contest_user
        WHERE cu_user = p_user_id AND cu_contest = p_contest_id;

        IF NOT FOUND THEN
            RAISE NOTICE 'Пользователь % не найден в контесте %', p_user_id, p_contest_id;
        ELSE
            RAISE NOTICE 'Пользователь % удалён из контеста %', p_user_id, p_contest_id;
        END IF;
    END;
    $$;
    """)

    # ===== ПРЕДСТАВЛЕНИЯ =====

    # участники контестов с деталями (роль, никнейм, email)
    op.execute("""
    CREATE OR REPLACE VIEW contest_participants_with_details AS
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

    # статистика по участникам (количество участников по контестам)
    op.execute("""
    CREATE OR REPLACE VIEW contest_participant_stats AS
    SELECT 
        c.contest_id,
        c.contest_name,
        COUNT(*) AS total_participants,
        COUNT(CASE WHEN cr.role_name = 'Организатор' THEN 1 END) AS organizers,
        COUNT(CASE WHEN cr.role_name = 'Участник' THEN 1 END) AS participants
    FROM contest c
    LEFT JOIN contest_user cu ON c.contest_id = cu.cu_contest
    LEFT JOIN contest_role cr ON cu.role = cr.role_id
    GROUP BY c.contest_id, c.contest_name
    ORDER BY c.start_time DESC;
    """)


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS contest_participant_stats;")
    op.execute("DROP VIEW IF EXISTS contest_participants_with_details;")

    op.execute("DROP PROCEDURE IF EXISTS remove_user_from_contest(INTEGER, INTEGER);")
    op.execute("DROP PROCEDURE IF EXISTS add_user_to_contest(INTEGER, INTEGER, INTEGER);")

    op.execute("DROP TRIGGER IF EXISTS trg_validate_contest_user ON contest_user;")
    op.execute("DROP FUNCTION IF EXISTS validate_contest_user();")
