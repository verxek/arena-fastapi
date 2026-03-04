"""add_user_triggers_procedures_views

Revision ID: eeaa26a3abcc
Revises: 
Create Date: 2026-02-02 22:01:26.748896

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eeaa26a3abcc'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ===== ТРИГГЕРЫ ДЛЯ ТАБЛИЦЫ user =====
    
    # Триггер: автоматическая установка времени создания
    op.execute("""
    CREATE OR REPLACE FUNCTION before_user_insert()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.registration_date = NOW() AT TIME ZONE 'UTC';
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)
    
    op.execute("""
    CREATE TRIGGER trg_before_user_insert
    BEFORE INSERT ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION before_user_insert();
    """)

     # Триггер: Запрет изменения email (безопасность)
    op.execute("""
    CREATE OR REPLACE FUNCTION prevent_email_change()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Разрешаем изменение только если установлен флаг
        IF CURRENT_SETTING('app.allow_email_change', TRUE) != 'true' THEN
            IF OLD.email != NEW.email THEN
                RAISE EXCEPTION 'Изменение email запрещено. Используйте безопасную процедуру обновления.';
            END IF;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)
    
    op.execute("""
    CREATE TRIGGER trg_before_user_update
    BEFORE UPDATE OF email ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_email_change();
    """)


    # Триггер: Автоматическая очистка связанных данных при удалении
    op.execute("""
    CREATE OR REPLACE FUNCTION cleanup_user_data()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Удаляем сессии
        DELETE FROM session WHERE user_id = OLD.user_id;
        
        -- Удаляем токены сброса пароля
        DELETE FROM password_reset WHERE user_id = OLD.user_id;
        
        -- Обнуляем автора в задачах (сохраняем задачи)
        UPDATE task SET author = NULL WHERE author = OLD.user_id;
        
        RETURN OLD;
    END;
    $$ LANGUAGE plpgsql;
    """)
    
    op.execute("""
    CREATE TRIGGER trg_cleanup_user_data
    AFTER DELETE ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_user_data();
    """)
    # ===== ХРАНИМЫЕ ПРОЦЕДУРЫ ДЛЯ user =====
    
    # Процедура: Безопасная регистрация пользователя
    op.execute("""
    CREATE OR REPLACE PROCEDURE register_user(
        p_nickname VARCHAR(50),
        p_password_hash VARCHAR(255),
        p_email VARCHAR(100)
    )
    LANGUAGE plpgsql
    AS $$
    DECLARE
        v_user_id INTEGER;  
    BEGIN
        -- Проверка длины никнейма
        IF LENGTH(p_nickname) < 3 THEN
            RAISE EXCEPTION 'Никнейм должен содержать минимум 3 символа';
        END IF;
        
        -- Проверка уникальности email
        IF EXISTS (SELECT 1 FROM "user" WHERE email = p_email) THEN
            RAISE EXCEPTION 'Email уже зарегистрирован';
        END IF;
        
        -- Проверка уникальности никнейма
        IF EXISTS (SELECT 1 FROM "user" WHERE nickname = p_nickname) THEN
            RAISE EXCEPTION 'Никнейм уже занят';
        END IF;
        
        INSERT INTO "user" (nickname, password_hash, email, registration_date)
        VALUES (p_nickname, p_password_hash, p_email, NOW() AT TIME ZONE 'UTC')
        RETURNING user_id INTO v_user_id;  -- ← Используем локальную переменную
    
        RAISE NOTICE 'Создан пользователь с ID: %', v_user_id;
    END;
    $$;
    """)

    # Процедура: Безопасное обновление профиля
    op.execute("""
    CREATE OR REPLACE PROCEDURE update_user_profile_safe(
        p_user_id INTEGER,
        p_nickname VARCHAR(50) DEFAULT NULL,
        p_email VARCHAR(100) DEFAULT NULL
    )
    LANGUAGE plpgsql
    AS $$
    DECLARE
        current_email VARCHAR(100);
        current_nickname VARCHAR(50);
    BEGIN
        -- Получаем текущие значения
        SELECT email, nickname INTO current_email, current_nickname
        FROM "user" WHERE user_id = p_user_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Пользователь не найден';
        END IF;
        
        -- Обновление никнейма
        IF p_nickname IS NOT NULL AND p_nickname != current_nickname THEN
            IF LENGTH(p_nickname) < 3 THEN
                RAISE EXCEPTION 'Никнейм должен содержать минимум 3 символа';
            END IF;
            
            IF EXISTS (SELECT 1 FROM "user" WHERE nickname = p_nickname) THEN
                RAISE EXCEPTION 'Никнейм уже занят';
            END IF;
            
            UPDATE "user" SET nickname = p_nickname WHERE user_id = p_user_id;
        END IF;
        
        -- Обновление email (с временным разрешением)
        IF p_email IS NOT NULL AND p_email != current_email THEN
            IF p_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
                RAISE EXCEPTION 'Неверный формат email';
            END IF;
            
            IF EXISTS (SELECT 1 FROM "user" WHERE email = p_email) THEN
                RAISE EXCEPTION 'Email уже зарегистрирован';
            END IF;
            
            -- Временно разрешаем изменение email
            PERFORM set_config('app.allow_email_change', 'true', true);
            UPDATE "user" SET email = p_email WHERE user_id = p_user_id;
            PERFORM set_config('app.allow_email_change', 'false', true);
        END IF;
    END;
    $$;
    """)
    # ===== ПРЕДСТАВЛЕНИЯ ДЛЯ user =====
    
    # Представление: Полная статистика пользователя
    op.execute("""
    CREATE OR REPLACE VIEW user_full_statistics AS
    SELECT 
        u.user_id,
        u.nickname,
        u.email,
        u.registration_date,
        
        -- Статистика по решениям
        COUNT(s.solution_id) AS total_submissions,
        SUM(CASE WHEN ss.state_name = 'Accepted' THEN 1 ELSE 0 END) AS accepted_count,
        ROUND(
            (SUM(CASE WHEN ss.state_name = 'Accepted' THEN 1 ELSE 0 END)::NUMERIC / 
            NULLIF(COUNT(s.solution_id), 0)) * 100, 
            2
        ) AS success_rate,
        
        -- Статистика по контестам
        COUNT(DISTINCT cu.cu_contest) AS contests_participated,
        COUNT(DISTINCT CASE WHEN cr.role_name = 'Organizer' THEN cu.cu_contest END) AS contests_organized,
        
        -- Статистика по задачам
        COUNT(DISTINCT t.task_id) AS tasks_authored,
        
        -- Активность
        MAX(s.sol_created_at) AS last_submission
        
        
    FROM "user" u
    LEFT JOIN solution s ON u.user_id = s.sol_user
    LEFT JOIN solution_state ss ON s.sol_state = ss.solution_state_id
    LEFT JOIN contest_user cu ON u.user_id = cu.cu_user
    LEFT JOIN contest_role cr ON cu.role = cr.role_id
    LEFT JOIN task t ON u.user_id = t.author
    GROUP BY u.user_id, u.nickname, u.email, u.registration_date;
    """)

    # Представление: Рейтинг пользователей
    op.execute("""
    CREATE OR REPLACE VIEW user_rating AS
    SELECT 
        u.user_id,
        u.nickname,
        us.accepted_count,
        us.total_submissions,
        us.success_rate,
        us.contests_participated,
        
        -- Сложность решённых задач (сумма уровней сложности)
        COALESCE(SUM(dl.difficulty_id), 0) AS total_difficulty_points,
        
        -- Рейтинг = принятые решения + сложность задач
        (us.accepted_count + COALESCE(SUM(dl.difficulty_id), 0)) AS rating_score
        
    FROM "user" u
    JOIN user_full_statistics us ON u.user_id = us.user_id
    LEFT JOIN solution s ON u.user_id = s.sol_user
    LEFT JOIN solution_state ss ON s.sol_state = ss.solution_state_id
    LEFT JOIN task t ON s.sol_task = t.task_id
    LEFT JOIN difficulty_level dl ON t.difficulty = dl.difficulty_id
    WHERE ss.state_name = 'Accepted' OR ss.state_name IS NULL
    GROUP BY u.user_id, u.nickname, us.accepted_count, us.total_submissions, 
             us.success_rate, us.contests_participated
    ORDER BY rating_score DESC;
    """)

    # Представление: активные сессии пользователей
    op.execute("""
    CREATE OR REPLACE VIEW active_sessions AS
    SELECT 
        s.session_id,
        s.user_id,
        u.nickname,
        s.created_at,
        s.expires_at,
        s.ip_address,
        s.user_agent
    FROM session s
    JOIN "user" u ON s.user_id = u.user_id
    WHERE s.expires_at > NOW() AT TIME ZONE 'UTC';
    """)


def downgrade():
    # Удаление в обратном порядке
    
    # Представления
    op.execute("DROP VIEW IF EXISTS active_sessions;")
    op.execute("DROP VIEW IF EXISTS user_rating;")
    op.execute("DROP VIEW IF EXISTS user_full_statistics;")
    
    # Процедуры
    op.execute("DROP PROCEDURE IF EXISTS update_user_profile_safe(INTEGER, VARCHAR, VARCHAR);")
    op.execute("DROP PROCEDURE IF EXISTS register_user(VARCHAR, VARCHAR, VARCHAR, OUT INTEGER);")
    
    # Триггеры и функции
    op.execute("DROP TRIGGER IF EXISTS trg_cleanup_user_data ON \"user\";")
    op.execute("DROP TRIGGER IF EXISTS trg_before_user_update ON \"user\";")
    op.execute("DROP TRIGGER IF EXISTS trg_before_user_insert ON \"user\";")
    op.execute("DROP FUNCTION IF EXISTS cleanup_user_data();")
    op.execute("DROP FUNCTION IF EXISTS prevent_email_change();")
    op.execute("DROP FUNCTION IF EXISTS before_user_insert();")
