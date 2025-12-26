-- Добавление полей для бонусов к пользователям
ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_documents INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_shield INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_privilege INT DEFAULT 0;

-- Таблица для отслеживания активированных бонусов в играх
CREATE TABLE IF NOT EXISTS game_active_bonuses (
    id SERIAL PRIMARY KEY,
    session_id INT REFERENCES game_sessions(id),
    user_id INT REFERENCES users(id),
    bonus_type VARCHAR(20) NOT NULL,
    activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, user_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_game_active_bonuses_session ON game_active_bonuses(session_id);
CREATE INDEX IF NOT EXISTS idx_game_active_bonuses_user ON game_active_bonuses(user_id);
