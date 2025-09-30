-- Вставка начальных заданий
INSERT INTO tasks (title, description, reward, task_type, icon, telegram_channel_id, is_active) VALUES
('Подписаться на главный канал', 'Подпишитесь на наш официальный Telegram канал', 500, 'telegram_subscribe', 'Send', '@zvezdy_market', true),
('Лайкнуть пост', 'Поставьте реакцию на последний пост', 100, 'telegram_like', 'Heart', '@zvezdy_market', true),
('Пригласить друга', 'Пригласите друга по реферальной ссылке', 300, 'referral', 'UserPlus', NULL, true),
('Ежедневный вход', 'Заходите каждый день для получения награды', 200, 'daily_login', 'Calendar', NULL, true),
('Написать отзыв', 'Оставьте отзыв о платформе', 250, 'review', 'MessageSquare', NULL, true);

-- Вставка подарков (как в Telegram маркете)
INSERT INTO gifts (name, description, emoji, base_price, rarity, is_limited, total_supply) VALUES
('Золотая звезда', 'Классическая золотая звезда', '⭐', 5000, 'common', false, NULL),
('Голубая звезда', 'Редкая голубая звезда', '💙', 8000, 'rare', false, NULL),
('Подарочная коробка', 'Таинственный подарок', '🎁', 3500, 'common', false, NULL),
('Торт', 'Праздничный торт', '🎂', 4000, 'common', false, NULL),
('Трофей победителя', 'Награда чемпиона', '🏆', 10000, 'epic', false, NULL),
('Бриллиант', 'Драгоценный бриллиант', '💎', 15000, 'legendary', false, NULL),
('Корона', 'Королевская корона', '👑', 20000, 'legendary', true, 100),
('Ракета', 'Космическая ракета', '🚀', 12000, 'epic', false, NULL),
('Огненное сердце', 'Пылающее сердце', '❤️‍🔥', 9000, 'rare', false, NULL),
('Единорог', 'Магический единорог', '🦄', 18000, 'legendary', true, 50),
('Радуга', 'Яркая радуга', '🌈', 6000, 'rare', false, NULL),
('Фейерверк', 'Праздничный салют', '🎆', 7000, 'rare', false, NULL),
('Золотой ключ', 'Ключ от сокровищ', '🔑', 11000, 'epic', true, 200),
('Цветущая сакура', 'Японская сакура', '🌸', 5500, 'common', false, NULL),
('Гроздь винограда', 'Сочный виноград', '🍇', 3000, 'common', false, NULL);

-- Вставка компаний на биржу
INSERT INTO companies (name, ticker, description, current_price, price_factor) VALUES
('UserGrow Inc', 'USGR', 'Стоимость растет с числом пользователей', 100.00, 'user_count'),
('TradeFlow Corp', 'TRFL', 'Зависит от количества транзакций', 100.00, 'transaction_count'),
('TaskMaster Ltd', 'TSKM', 'Растет с выполнением заданий', 100.00, 'task_completion'),
('SpinWin Games', 'SPWN', 'Зависит от активности в рулетке', 100.00, 'roulette_activity'),
('P2P Markets', 'P2PM', 'Растет с P2P сделками', 100.00, 'p2p_trades'),
('StarIndex Fund', 'STIX', 'Комбинированный индекс всех факторов', 100.00, 'combined');