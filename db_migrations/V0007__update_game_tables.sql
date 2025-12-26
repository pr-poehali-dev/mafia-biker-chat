-- Обновление структуры игровых таблиц

-- Добавить поле для отслеживания активной сессии
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS active_session_id INT;

-- Обновить индексы
CREATE INDEX IF NOT EXISTS idx_rooms_active_session ON rooms(active_session_id);
CREATE INDEX IF NOT EXISTS idx_session_players_user ON session_players(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_session ON votes(session_id, day_number);
