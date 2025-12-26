-- Создание таблиц для игры Мафия

-- Пользователи (с авторизацией через Telegram)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    photo_url TEXT,
    reputation INT DEFAULT 0,
    level INT DEFAULT 1,
    total_games INT DEFAULT 0,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Кланы
CREATE TABLE clans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    tag VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    avatar_url TEXT,
    reputation INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT REFERENCES users(id)
);

-- Участники кланов
CREATE TABLE clan_members (
    id SERIAL PRIMARY KEY,
    clan_id INT REFERENCES clans(id),
    user_id INT REFERENCES users(id),
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(clan_id, user_id)
);

-- Мотоциклы
CREATE TABLE motorcycles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    image_url TEXT,
    required_reputation INT DEFAULT 0,
    rarity VARCHAR(20) DEFAULT 'common'
);

-- Мотоциклы пользователей
CREATE TABLE user_motorcycles (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    motorcycle_id INT REFERENCES motorcycles(id),
    is_active BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, motorcycle_id)
);

-- Комнаты для игры
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(100),
    max_players INT DEFAULT 10,
    current_players INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'waiting',
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Игровые сессии
CREATE TABLE game_sessions (
    id SERIAL PRIMARY KEY,
    room_id INT REFERENCES rooms(id),
    status VARCHAR(20) DEFAULT 'active',
    phase VARCHAR(20) DEFAULT 'night',
    day_number INT DEFAULT 1,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- Игроки в сессии
CREATE TABLE session_players (
    id SERIAL PRIMARY KEY,
    session_id INT REFERENCES game_sessions(id),
    user_id INT REFERENCES users(id),
    role VARCHAR(20) NOT NULL,
    is_alive BOOLEAN DEFAULT TRUE,
    voted_for INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Голосования
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    session_id INT REFERENCES game_sessions(id),
    voter_id INT REFERENCES users(id),
    target_id INT REFERENCES users(id),
    phase VARCHAR(20),
    day_number INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Достижения
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon TEXT,
    required_condition JSONB,
    reputation_reward INT DEFAULT 0
);

-- Достижения пользователей
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    achievement_id INT REFERENCES achievements(id),
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Индексы для оптимизации
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_session_players_session ON session_players(session_id);
CREATE INDEX idx_clan_members_clan ON clan_members(clan_id);
CREATE INDEX idx_clan_members_user ON clan_members(user_id);