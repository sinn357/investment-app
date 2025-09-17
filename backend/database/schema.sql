-- Investment App Database Schema
-- SQLite database for storing economic indicators data

-- 지표 메타데이터 테이블
CREATE TABLE IF NOT EXISTS indicators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    indicator_id TEXT UNIQUE NOT NULL,  -- 'ism-manufacturing', 'retail-sales' etc
    name TEXT NOT NULL,                 -- 'ISM Manufacturing PMI', 'Retail Sales MoM'
    url TEXT NOT NULL,                  -- investing.com URL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 최신 릴리즈 데이터 테이블 (Raw Data 카드용)
CREATE TABLE IF NOT EXISTS latest_releases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    indicator_id TEXT NOT NULL,
    release_date TEXT NOT NULL,
    time TEXT,
    actual TEXT,                        -- 문자열로 저장 (% 데이터 포함)
    forecast TEXT,
    previous TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (indicator_id) REFERENCES indicators(indicator_id)
);

-- 다음 릴리즈 예정 데이터 테이블
CREATE TABLE IF NOT EXISTS next_releases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    indicator_id TEXT NOT NULL,
    release_date TEXT NOT NULL,
    time TEXT,
    forecast TEXT,
    previous TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (indicator_id) REFERENCES indicators(indicator_id)
);

-- 히스토리 데이터 테이블 (Data Section 테이블용)
CREATE TABLE IF NOT EXISTS history_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    indicator_id TEXT NOT NULL,
    release_date TEXT NOT NULL,
    time TEXT,
    actual TEXT,
    forecast TEXT,
    previous TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (indicator_id) REFERENCES indicators(indicator_id)
);

-- 크롤링 메타데이터 테이블
CREATE TABLE IF NOT EXISTS crawl_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    indicator_id TEXT NOT NULL,
    last_crawl_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'success',      -- 'success', 'error'
    error_message TEXT,
    data_count INTEGER DEFAULT 0,      -- 크롤링된 데이터 개수
    FOREIGN KEY (indicator_id) REFERENCES indicators(indicator_id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_latest_releases_indicator ON latest_releases(indicator_id);
CREATE INDEX IF NOT EXISTS idx_next_releases_indicator ON next_releases(indicator_id);
CREATE INDEX IF NOT EXISTS idx_history_data_indicator ON history_data(indicator_id);
CREATE INDEX IF NOT EXISTS idx_history_data_date ON history_data(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_crawl_info_indicator ON crawl_info(indicator_id);

-- 기본 지표 데이터 삽입
INSERT OR IGNORE INTO indicators (indicator_id, name, url) VALUES
('ism-manufacturing', 'ISM Manufacturing PMI', 'https://www.investing.com/economic-calendar/ism-manufacturing-pmi-173'),
('ism-non-manufacturing', 'ISM Non-Manufacturing PMI', 'https://www.investing.com/economic-calendar/ism-non-manufacturing-pmi-176'),
('sp-global-composite', 'S&P Global Composite PMI', 'https://www.investing.com/economic-calendar/s-p-global-composite-pmi-1492'),
('industrial-production', 'Industrial Production', 'https://www.investing.com/economic-calendar/industrial-production-161'),
('industrial-production-1755', 'Industrial Production YoY', 'https://www.investing.com/economic-calendar/industrial-production-1755'),
('retail-sales', 'Retail Sales MoM', 'https://www.investing.com/economic-calendar/retail-sales-256'),
('retail-sales-yoy', 'Retail Sales YoY', 'https://www.investing.com/economic-calendar/retail-sales-1878');