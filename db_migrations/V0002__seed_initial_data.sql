-- Добавление начальных мотоциклов
INSERT INTO motorcycles (name, brand, model, required_reputation, rarity) VALUES 
('Harley Chopper', 'Harley-Davidson', 'Custom', 0, 'common'),
('Sportster Iron', 'Harley-Davidson', 'Sportster', 100, 'uncommon'),
('Road King', 'Harley-Davidson', 'Road King', 500, 'rare'),
('Fat Boy', 'Harley-Davidson', 'Fat Boy', 1000, 'epic'),
('Street Glide', 'Harley-Davidson', 'Street Glide', 2000, 'legendary');

-- Добавление начальных достижений
INSERT INTO achievements (name, description, icon, required_condition, reputation_reward) VALUES 
('Первая Игра', 'Сыграй первую игру в Мафию', '🏍️', '{"games": 1}'::jsonb, 10),
('Победитель', 'Одержи первую победу', '🏆', '{"wins": 1}'::jsonb, 25),
('Мафиози', 'Победи 10 раз за мафию', '💀', '{"mafia_wins": 10}'::jsonb, 100),
('Мирный житель', 'Победи 10 раз за мирных', '👤', '{"civilian_wins": 10}'::jsonb, 100),
('Комиссар', 'Найди 20 мафиози', '🔍', '{"found_mafia": 20}'::jsonb, 150),
('Легенда', 'Набери 1000 репутации', '⭐', '{"reputation": 1000}'::jsonb, 200);