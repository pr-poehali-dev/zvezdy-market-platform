-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id VARCHAR(255) UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    balance BIGINT DEFAULT 0,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица заданий
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reward INTEGER NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    icon VARCHAR(50),
    telegram_channel_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица выполненных заданий
CREATE TABLE IF NOT EXISTS user_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    task_id INTEGER REFERENCES tasks(id),
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT false,
    UNIQUE(user_id, task_id)
);

-- Таблица подарков
CREATE TABLE IF NOT EXISTS gifts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    emoji VARCHAR(50),
    base_price INTEGER NOT NULL,
    rarity VARCHAR(50) DEFAULT 'common',
    is_limited BOOLEAN DEFAULT false,
    total_supply INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица владения подарками
CREATE TABLE IF NOT EXISTS user_gifts (
    id SERIAL PRIMARY KEY,
    gift_id INTEGER REFERENCES gifts(id),
    owner_id INTEGER REFERENCES users(id),
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    purchase_price INTEGER,
    is_on_sale BOOLEAN DEFAULT false,
    sale_price INTEGER
);

-- История торговли подарками
CREATE TABLE IF NOT EXISTS gift_history (
    id SERIAL PRIMARY KEY,
    gift_instance_id INTEGER REFERENCES user_gifts(id),
    from_user_id INTEGER REFERENCES users(id),
    to_user_id INTEGER REFERENCES users(id),
    price INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица компаний на бирже
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ticker VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    current_price DECIMAL(10, 2) DEFAULT 100.00,
    price_factor VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица акций пользователей
CREATE TABLE IF NOT EXISTS user_stocks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    company_id INTEGER REFERENCES companies(id),
    shares INTEGER DEFAULT 0,
    avg_purchase_price DECIMAL(10, 2),
    UNIQUE(user_id, company_id)
);

-- История цен акций
CREATE TABLE IF NOT EXISTS stock_price_history (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    price DECIMAL(10, 2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Биржевые события
CREATE TABLE IF NOT EXISTS market_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL,
    impact_percentage DECIMAL(5, 2),
    affected_companies TEXT,
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Транзакции
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount BIGINT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Заявки на вывод средств
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount BIGINT NOT NULL,
    telegram_username VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Рулетка история
CREATE TABLE IF NOT EXISTS roulette_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    bet_amount INTEGER NOT NULL,
    win_amount INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gifts_owner_id ON user_gifts(owner_id);
CREATE INDEX IF NOT EXISTS idx_gift_history_gift_id ON gift_history(gift_instance_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);