import psycopg2
import psycopg2.extras
from psycopg2.extras import RealDictCursor
import json
import os
import hashlib
import secrets
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from urllib.parse import urlparse

class PostgresDatabaseService:
    """PostgreSQL 데이터베이스 서비스 클래스"""

    def __init__(self, database_url: str = None):
        self.database_url = database_url or os.getenv('DATABASE_URL')
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is required")

        # JWT 시크릿 키 설정
        self.jwt_secret = os.getenv('JWT_SECRET', 'investment-app-secret-key-2025')

        # 로그인 시도 제한을 위한 딕셔너리
        self.login_attempts = {}

        # URL 파싱
        self.parsed_url = urlparse(self.database_url)
        self.init_database()

    def init_database(self):
        """데이터베이스 초기화 및 스키마 생성"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # 테이블 생성
                    schema_sql = """
                    CREATE TABLE IF NOT EXISTS indicators (
                        id SERIAL PRIMARY KEY,
                        indicator_id TEXT UNIQUE NOT NULL,
                        name TEXT NOT NULL,
                        url TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS latest_releases (
                        id SERIAL PRIMARY KEY,
                        indicator_id TEXT NOT NULL,
                        release_date TEXT NOT NULL,
                        time TEXT,
                        actual TEXT,
                        forecast TEXT,
                        previous TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS next_releases (
                        id SERIAL PRIMARY KEY,
                        indicator_id TEXT NOT NULL,
                        release_date TEXT NOT NULL,
                        time TEXT,
                        forecast TEXT,
                        previous TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS history_data (
                        id SERIAL PRIMARY KEY,
                        indicator_id TEXT NOT NULL,
                        release_date TEXT NOT NULL,
                        time TEXT,
                        actual TEXT,
                        forecast TEXT,
                        previous TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS crawl_info (
                        id SERIAL PRIMARY KEY,
                        indicator_id TEXT NOT NULL,
                        last_crawl_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        status TEXT DEFAULT 'success',
                        error_message TEXT,
                        data_count INTEGER DEFAULT 0
                    );

                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        username VARCHAR(50) UNIQUE NOT NULL,
                        password_hash VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS assets (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        asset_type VARCHAR(50),
                        sub_category VARCHAR(50),
                        name VARCHAR(100),
                        amount NUMERIC,
                        quantity NUMERIC,
                        avg_price NUMERIC,
                        eval_amount NUMERIC,
                        principal NUMERIC,
                        profit_loss NUMERIC DEFAULT 0,
                        profit_rate NUMERIC DEFAULT 0,
                        date DATE,
                        note TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                        -- 부동산 전용 필드
                        area_pyeong NUMERIC, -- 면적(평수)
                        acquisition_tax NUMERIC, -- 취득세
                        rent_type VARCHAR(20) DEFAULT 'monthly', -- 임대유형 ('monthly', 'jeonse')
                        rental_income NUMERIC, -- 임대수익(월세)
                        jeonse_deposit NUMERIC, -- 전세보증금

                        -- 예금/적금 전용 필드
                        maturity_date DATE, -- 만기일
                        interest_rate NUMERIC, -- 연이율(%)
                        early_withdrawal_fee NUMERIC, -- 중도해지수수료

                        -- MMF/CMA 전용 필드
                        current_yield NUMERIC, -- 현재수익률(%)
                        annual_yield NUMERIC, -- 연환산수익률(%)
                        minimum_balance NUMERIC, -- 최소유지잔고
                        withdrawal_fee NUMERIC, -- 출금수수료

                        -- 주식/ETF 전용 필드
                        dividend_rate NUMERIC, -- 배당율(%)

                        -- 펀드 전용 필드
                        nav NUMERIC, -- 기준가격
                        management_fee NUMERIC -- 운용보수(%)
                    );

                    CREATE TABLE IF NOT EXISTS goal_settings (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        total_goal NUMERIC NOT NULL DEFAULT 50000000,
                        target_date DATE NOT NULL DEFAULT '2024-12-31',
                        category_goals JSONB DEFAULT '{}',
                        sub_category_goals JSONB DEFAULT '{}',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id)
                    );

                    CREATE TABLE IF NOT EXISTS portfolio_history (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        total_assets NUMERIC DEFAULT 0,
                        total_principal NUMERIC DEFAULT 0,
                        total_eval_amount NUMERIC DEFAULT 0,
                        change_type VARCHAR(20), -- 'add', 'update', 'delete'
                        change_amount NUMERIC DEFAULT 0,
                        asset_id INTEGER,
                        asset_name VARCHAR(100),
                        notes TEXT,
                        is_daily_summary BOOLEAN DEFAULT FALSE
                    );

                    -- 기존 테이블에 새 컬럼 추가 (테이블이 이미 존재하는 경우)
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS user_id INTEGER;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS sub_category VARCHAR(50);
                    ALTER TABLE goal_settings ADD COLUMN IF NOT EXISTS sub_category_goals JSONB DEFAULT '{}';
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS principal NUMERIC;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS profit_loss NUMERIC DEFAULT 0;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS profit_rate NUMERIC DEFAULT 0;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

                    -- 소분류별 전용 필드 추가
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS area_pyeong NUMERIC;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS acquisition_tax NUMERIC;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS rental_income NUMERIC;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS lawyer_fee NUMERIC;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS brokerage_fee NUMERIC;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS maturity_date DATE;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS interest_rate NUMERIC;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS early_withdrawal_fee NUMERIC;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS current_yield NUMERIC;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS annual_yield NUMERIC;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS minimum_balance NUMERIC;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS withdrawal_fee NUMERIC;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS dividend_rate NUMERIC;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS nav NUMERIC;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS management_fee NUMERIC;

                    -- 기존 assets 데이터에 기본 user_id 설정 (NULL인 경우에만)
                    UPDATE assets SET user_id = 1 WHERE user_id IS NULL;

                    -- 가계부/지출관리 테이블 생성
                    CREATE TABLE IF NOT EXISTS expenses (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('수입', '지출')),
                        amount NUMERIC NOT NULL CHECK (amount > 0),
                        category VARCHAR(50) NOT NULL,
                        subcategory VARCHAR(50) NOT NULL,
                        description TEXT,
                        payment_method VARCHAR(30) DEFAULT '현금',
                        transaction_date DATE NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS budgets (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        category VARCHAR(50) NOT NULL,
                        subcategory VARCHAR(50),
                        monthly_budget NUMERIC NOT NULL CHECK (monthly_budget >= 0),
                        year INTEGER NOT NULL,
                        month INTEGER NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, category, subcategory, year, month)
                    );

                    -- 경제지표 사용자 해석 테이블
                    CREATE TABLE IF NOT EXISTS indicator_interpretations (
                        id SERIAL PRIMARY KEY,
                        indicator_id TEXT UNIQUE NOT NULL,
                        user_interpretation TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    -- 인덱스 생성
                    CREATE INDEX IF NOT EXISTS idx_latest_releases_indicator_id ON latest_releases(indicator_id);
                    CREATE INDEX IF NOT EXISTS idx_next_releases_indicator_id ON next_releases(indicator_id);
                    CREATE INDEX IF NOT EXISTS idx_history_data_indicator_id ON history_data(indicator_id);
                    CREATE INDEX IF NOT EXISTS idx_crawl_info_indicator_id ON crawl_info(indicator_id);
                    CREATE INDEX IF NOT EXISTS idx_indicator_interpretations_id ON indicator_interpretations(indicator_id);

                    -- 가계부 테이블 인덱스 (성능 최적화)
                    CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, transaction_date DESC);
                    CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category, subcategory);
                    CREATE INDEX IF NOT EXISTS idx_expenses_date_type ON expenses(transaction_date, transaction_type);
                    CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON budgets(user_id, year, month);

                    -- 투자 철학 테이블 (MASTER_PLAN Page 1)
                    CREATE TABLE IF NOT EXISTS investment_philosophy (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,

                        -- 투자 목표 (Section 1)
                        goal JSONB DEFAULT '{
                            "targetReturn": 10,
                            "riskTolerance": {"volatility": 15, "maxDrawdown": 20, "maxLeverage": 1},
                            "timeHorizon": {"start": "2025-01-01", "target": "2030-12-31", "years": 5}
                        }',

                        -- 금지 자산 (Section 2)
                        forbidden_assets JSONB DEFAULT '[]',

                        -- 운용 범위 (Section 3)
                        allocation_range JSONB DEFAULT '[]',

                        -- 투자 원칙 (Section 4)
                        principles JSONB DEFAULT '[]',

                        -- 투자 방법 (Section 5)
                        methods JSONB DEFAULT '[]',

                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE INDEX IF NOT EXISTS idx_investment_philosophy_user_id ON investment_philosophy(user_id);

                    -- 거시경제 담론 테이블 (MASTER_PLAN Page 2)
                    CREATE TABLE IF NOT EXISTS economic_narrative (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        date DATE NOT NULL,

                        -- 뉴스 & 담론
                        articles JSONB DEFAULT '[]',  -- [{ title, url, summary, keyword }]
                        my_narrative TEXT,            -- 내 담론

                        -- 리스크 레이더
                        risks JSONB DEFAULT '[]',     -- [{ category, level, description }]

                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, date)
                    );

                    CREATE INDEX IF NOT EXISTS idx_economic_narrative_user_date ON economic_narrative(user_id, date DESC);

                    -- 자산 개별분석 테이블 (5개 탭 구조)
                    CREATE TABLE IF NOT EXISTS asset_analysis (
                        id SERIAL PRIMARY KEY,
                        asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

                        -- ① 투자 가설 (Investment Thesis)
                        thesis JSONB DEFAULT '{}',

                        -- ② 검증: 펀더멘털 (Validation: Fundamentals)
                        validation JSONB DEFAULT '{}',

                        -- ③ 가격과 기대치 (Price & Expectation)
                        pricing JSONB DEFAULT '{}',

                        -- ④ 타이밍 & 리스크 (Timing & Risk)
                        timing JSONB DEFAULT '{}',

                        -- ⑤ 결정 & 관리 (Decision & Management)
                        decision JSONB DEFAULT '{}',

                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(asset_id, user_id)
                    );

                    CREATE INDEX IF NOT EXISTS idx_asset_analysis_asset_id ON asset_analysis(asset_id);
                    CREATE INDEX IF NOT EXISTS idx_asset_analysis_user_id ON asset_analysis(user_id);

                    -- 섹터 성과 테이블 (Page 3: Industries)
                    CREATE TABLE IF NOT EXISTS sector_performance (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        date DATE NOT NULL,
                        sector VARCHAR(100) NOT NULL,  -- 섹터명 (예: Technology, Healthcare)
                        performance NUMERIC,            -- 성과 (%)
                        relative_strength NUMERIC,      -- 상대강도 지수
                        notes TEXT,                     -- 메모
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, date, sector)
                    );

                    CREATE INDEX IF NOT EXISTS idx_sector_performance_user_date ON sector_performance(user_id, date DESC);

                    -- 관심 종목 테이블 (Page 3: Industries)
                    CREATE TABLE IF NOT EXISTS watchlist (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        symbol VARCHAR(20) NOT NULL,    -- 티커 심볼 (예: AAPL, TSLA)
                        name VARCHAR(200) NOT NULL,     -- 종목명
                        sector VARCHAR(100),            -- 섹터
                        current_price NUMERIC,          -- 현재가
                        target_price NUMERIC,           -- 목표가
                        notes TEXT,                     -- 투자 근거/메모
                        alert_enabled BOOLEAN DEFAULT false,  -- 알림 활성화
                        alert_price NUMERIC,            -- 알림 가격
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, symbol)
                    );

                    CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
                    CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON watchlist(symbol);

                    -- 산업군 분석 테이블 (Page 3: Industries - 새로운 산업군 분석 시스템)
                    CREATE TABLE IF NOT EXISTS industry_analysis (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        major_category VARCHAR(50) NOT NULL,     -- 6대 산업군
                        sub_industry VARCHAR(100) NOT NULL,      -- 하위 산업명
                        analysis_data JSONB NOT NULL DEFAULT '{
                            "core_technology": {"definition": "", "stage": "상용화", "innovation_path": ""},
                            "macro_impact": {"interest_rate": "", "exchange_rate": "", "commodities": "", "policy": ""},
                            "growth_drivers": {"internal": "", "external": "", "kpi": ""},
                            "value_chain": {"flow": "", "profit_pool": "", "bottleneck": ""},
                            "supply_demand": {
                                "demand": {"end_user": "", "long_term": "", "sensitivity": ""},
                                "supply": {"players": "", "capacity": "", "barriers": ""},
                                "catalysts": ""
                            },
                            "market_map": {"structure": "", "competition": "", "moat": "", "lifecycle": ""}
                        }'::jsonb,
                        leading_stocks TEXT[] DEFAULT '{}',      -- 대표 대형주
                        emerging_stocks TEXT[] DEFAULT '{}',     -- 중소형 유망주
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id, major_category, sub_industry)
                    );

                    CREATE INDEX IF NOT EXISTS idx_industry_analysis_user ON industry_analysis(user_id);
                    CREATE INDEX IF NOT EXISTS idx_industry_analysis_major ON industry_analysis(major_category);
                    """

                    print("Executing PostgreSQL schema initialization...")
                    cur.execute(schema_sql)
                    conn.commit()
                    print("PostgreSQL database initialized successfully")

                    # user_id 컬럼 존재 여부 확인
                    cur.execute("""
                        SELECT column_name
                        FROM information_schema.columns
                        WHERE table_name = 'assets' AND column_name = 'user_id'
                    """)
                    user_id_column = cur.fetchone()
                    print(f"user_id column exists in assets table: {user_id_column is not None}")

                    # 부동산 월세/전세 컬럼 존재 여부 확인 및 추가
                    cur.execute("""
                        SELECT column_name
                        FROM information_schema.columns
                        WHERE table_name = 'assets' AND column_name = 'rent_type'
                    """)
                    rent_type_column = cur.fetchone()

                    if rent_type_column is None:
                        print("Adding rent_type and jeonse_deposit columns to assets table...")
                        cur.execute("""
                            ALTER TABLE assets
                            ADD COLUMN rent_type VARCHAR(20) DEFAULT 'monthly',
                            ADD COLUMN jeonse_deposit NUMERIC
                        """)
                        conn.commit()
                        print("Successfully added rent_type and jeonse_deposit columns")
                    else:
                        print("rent_type column already exists")
        except Exception as e:
            print(f"Database initialization failed: {e}")
            raise e

    def get_connection(self):
        """데이터베이스 연결 반환"""
        try:
            print(f"Attempting PostgreSQL connection to: {self.database_url[:50]}...")
            conn = psycopg2.connect(
                self.database_url,
                cursor_factory=psycopg2.extras.RealDictCursor,
                connect_timeout=10
            )
            print("PostgreSQL connection successful")
            return conn
        except Exception as e:
            print(f"Database connection failed: {e}")
            raise e

    def save_indicator_data(self, indicator_id: str, crawled_data: Dict[str, Any]):
        """크롤링된 데이터를 데이터베이스에 저장"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # 기존 데이터 삭제 (최신 데이터로 교체)
                    cur.execute("DELETE FROM latest_releases WHERE indicator_id = %s", (indicator_id,))
                    cur.execute("DELETE FROM next_releases WHERE indicator_id = %s", (indicator_id,))
                    cur.execute("DELETE FROM history_data WHERE indicator_id = %s", (indicator_id,))

                    # 최신 릴리즈 데이터 저장
                    if 'latest_release' in crawled_data:
                        latest = crawled_data['latest_release']
                        cur.execute("""
                            INSERT INTO latest_releases
                            (indicator_id, release_date, time, actual, forecast, previous)
                            VALUES (%s, %s, %s, %s, %s, %s)
                        """, (
                            indicator_id,
                            latest.get('release_date'),
                            latest.get('time'),
                            str(latest.get('actual')) if latest.get('actual') is not None else None,
                            str(latest.get('forecast')) if latest.get('forecast') is not None else None,
                            str(latest.get('previous')) if latest.get('previous') is not None else None
                        ))

                    # 다음 릴리즈 데이터 저장
                    if 'next_release' in crawled_data and crawled_data['next_release'] is not None:
                        next_rel = crawled_data['next_release']
                        cur.execute("""
                            INSERT INTO next_releases
                            (indicator_id, release_date, time, forecast, previous)
                            VALUES (%s, %s, %s, %s, %s)
                        """, (
                            indicator_id,
                            next_rel.get('release_date'),
                            next_rel.get('time'),
                            str(next_rel.get('forecast')) if next_rel.get('forecast') is not None else None,
                            str(next_rel.get('previous')) if next_rel.get('previous') is not None else None
                        ))

                    # 히스토리 데이터 저장
                    if 'history_table' in crawled_data:
                        for row in crawled_data['history_table']:
                            cur.execute("""
                                INSERT INTO history_data
                                (indicator_id, release_date, time, actual, forecast, previous)
                                VALUES (%s, %s, %s, %s, %s, %s)
                            """, (
                                indicator_id,
                                row.get('release_date'),
                                row.get('time'),
                                str(row.get('actual')) if row.get('actual') is not None else None,
                                str(row.get('forecast')) if row.get('forecast') is not None else None,
                                str(row.get('previous')) if row.get('previous') is not None else None
                            ))

                    # 크롤링 정보 업데이트
                    self.update_crawl_info(indicator_id, 'success', len(crawled_data.get('history_table', [])))

                    conn.commit()
                    return True

        except Exception as e:
            if 'conn' in locals():
                conn.rollback()
            self.update_crawl_info(indicator_id, 'error', 0, str(e))
            raise e

    def get_indicator_data(self, indicator_id: str) -> Dict[str, Any]:
        """지표 데이터 조회 (API 응답 형태로 반환)"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # 최신 릴리즈 데이터 조회
                    cur.execute("""
                        SELECT * FROM latest_releases WHERE indicator_id = %s
                        ORDER BY created_at DESC LIMIT 1
                    """, (indicator_id,))
                    latest_row = cur.fetchone()

                    # 다음 릴리즈 데이터 조회
                    cur.execute("""
                        SELECT * FROM next_releases WHERE indicator_id = %s
                        ORDER BY created_at DESC LIMIT 1
                    """, (indicator_id,))
                    next_row = cur.fetchone()

                    # 마지막 크롤링 시간 조회
                    cur.execute("""
                        SELECT last_crawl_time FROM crawl_info WHERE indicator_id = %s
                        ORDER BY last_crawl_time DESC LIMIT 1
                    """, (indicator_id,))
                    crawl_row = cur.fetchone()

                    if not latest_row:
                        return {"error": "No data found for indicator"}

                # 히스토리 데이터 조회 (최근 12개)
                history_table = self.get_history_data(indicator_id, limit=12)

                # API 응답 형태로 변환
                result = {
                    "latest_release": {
                        "release_date": latest_row['release_date'],
                        "time": latest_row['time'],
                        "actual": self._parse_value(latest_row['actual']),
                        "forecast": self._parse_value(latest_row['forecast']),
                        "previous": self._parse_value(latest_row['previous'])
                    },
                    "next_release": {
                        "release_date": next_row['release_date'] if next_row else "미정",
                        "time": next_row['time'] if next_row else "미정",
                        "forecast": self._parse_value(next_row['forecast']) if next_row else None,
                        "previous": self._parse_value(next_row['previous']) if next_row else None
                    },
                    "history_table": history_table,
                    "last_updated": crawl_row['last_crawl_time'].isoformat() if crawl_row else None,
                    "timestamp": datetime.now().isoformat()
                }

                return result

        except Exception as e:
            print(f"Error getting indicator data for {indicator_id}: {e}")
            return {"error": f"Database error: {str(e)}"}

    def get_history_data(self, indicator_id: str, limit: int = None) -> List[Dict[str, Any]]:
        """히스토리 데이터 조회

        Args:
            indicator_id: 지표 ID
            limit: 가져올 최대 행 수 (None이면 전체)
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    query = """
                        SELECT release_date, time, actual, forecast, previous
                        FROM history_data
                        WHERE indicator_id = %s
                        ORDER BY release_date DESC
                    """
                    params = [indicator_id]

                    if limit and limit > 0:
                        query += " LIMIT %s"
                        params.append(limit)

                    cur.execute(query, tuple(params))
                    rows = cur.fetchall()

                    return [
                        {
                            "release_date": row['release_date'],
                            "time": row['time'],
                            "actual": self._parse_value(row['actual']),
                            "forecast": self._parse_value(row['forecast']),
                            "previous": self._parse_value(row['previous'])
                        }
                        for row in rows
                    ]
        except Exception as e:
            print(f"Error getting history data for {indicator_id}: {e}")
            return []

    def get_multiple_indicators_data(self, indicator_ids: List[str]) -> Dict[str, Any]:
        """
        여러 지표 데이터를 한 번에 조회 (배치 쿼리)
        Phase 2 성능 최적화: 47회 쿼리 → 3회 쿼리로 감소

        Args:
            indicator_ids: 조회할 지표 ID 리스트

        Returns:
            {
                indicator_id: {
                    "latest_release": {...},
                    "next_release": {...},
                    "last_updated": "..."
                }
            }
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # 1. 최신 릴리즈 데이터 배치 조회 (IN 절 사용)
                    cur.execute("""
                        SELECT DISTINCT ON (indicator_id)
                            indicator_id, release_date, time, actual, forecast, previous, created_at
                        FROM latest_releases
                        WHERE indicator_id = ANY(%s)
                        ORDER BY indicator_id, created_at DESC
                    """, (indicator_ids,))
                    latest_rows = cur.fetchall()

                    # 2. 다음 릴리즈 데이터 배치 조회
                    cur.execute("""
                        SELECT DISTINCT ON (indicator_id)
                            indicator_id, release_date, time, forecast, previous, created_at
                        FROM next_releases
                        WHERE indicator_id = ANY(%s)
                        ORDER BY indicator_id, created_at DESC
                    """, (indicator_ids,))
                    next_rows = cur.fetchall()

                    # 3. 크롤링 시간 배치 조회
                    cur.execute("""
                        SELECT DISTINCT ON (indicator_id)
                            indicator_id, last_crawl_time
                        FROM crawl_info
                        WHERE indicator_id = ANY(%s)
                        ORDER BY indicator_id, last_crawl_time DESC
                    """, (indicator_ids,))
                    crawl_rows = cur.fetchall()

                    # 딕셔너리로 변환 (빠른 접근)
                    latest_dict = {row['indicator_id']: row for row in latest_rows}
                    next_dict = {row['indicator_id']: row for row in next_rows}
                    crawl_dict = {row['indicator_id']: row for row in crawl_rows}

                    # 결과 구성
                    result = {}
                    for indicator_id in indicator_ids:
                        latest_row = latest_dict.get(indicator_id)
                        if not latest_row:
                            result[indicator_id] = {"error": "No data found"}
                            continue

                        next_row = next_dict.get(indicator_id)
                        crawl_row = crawl_dict.get(indicator_id)

                        result[indicator_id] = {
                            "latest_release": {
                                "release_date": latest_row['release_date'],
                                "time": latest_row['time'],
                                "actual": self._parse_value(latest_row['actual']),
                                "forecast": self._parse_value(latest_row['forecast']),
                                "previous": self._parse_value(latest_row['previous'])
                            },
                            "next_release": {
                                "release_date": next_row['release_date'] if next_row else "미정",
                                "time": next_row['time'] if next_row else "미정",
                                "forecast": self._parse_value(next_row['forecast']) if next_row else None,
                                "previous": self._parse_value(next_row['previous']) if next_row else None
                            },
                            "last_updated": crawl_row['last_crawl_time'].isoformat() if crawl_row else None,
                            "timestamp": datetime.now().isoformat()
                        }

                    return result

        except Exception as e:
            print(f"Error getting multiple indicators data: {e}")
            return {indicator_id: {"error": str(e)} for indicator_id in indicator_ids}

    def get_multiple_history_data(self, indicator_ids: List[str], limit: int = 12) -> Dict[str, List[Dict[str, Any]]]:
        """
        여러 지표의 히스토리 데이터를 한 번에 조회 (배치 쿼리)
        Phase 2 성능 최적화: 47회 쿼리 → 1회 쿼리로 감소

        Args:
            indicator_ids: 조회할 지표 ID 리스트
            limit: 각 지표당 가져올 최대 행 수

        Returns:
            {
                indicator_id: [
                    {"release_date": "...", "time": "...", "actual": ...},
                    ...
                ]
            }
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # 서브쿼리로 각 지표별 최신 N개만 조회
                    query = """
                        SELECT * FROM (
                            SELECT
                                indicator_id, release_date, time, actual, forecast, previous,
                                ROW_NUMBER() OVER (PARTITION BY indicator_id ORDER BY release_date DESC) as rn
                            FROM history_data
                            WHERE indicator_id = ANY(%s)
                        ) subq
                        WHERE rn <= %s
                        ORDER BY indicator_id, release_date DESC
                    """
                    cur.execute(query, (indicator_ids, limit))
                    rows = cur.fetchall()

                    # 지표별로 그룹화
                    result = {indicator_id: [] for indicator_id in indicator_ids}
                    for row in rows:
                        indicator_id = row['indicator_id']
                        result[indicator_id].append({
                            "release_date": row['release_date'],
                            "time": row['time'],
                            "actual": self._parse_value(row['actual']),
                            "forecast": self._parse_value(row['forecast']),
                            "previous": self._parse_value(row['previous'])
                        })

                    return result

        except Exception as e:
            print(f"Error getting multiple history data: {e}")
            return {indicator_id: [] for indicator_id in indicator_ids}

    def get_all_indicators(self) -> List[str]:
        """모든 지표 ID 목록 조회"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT indicator_id FROM indicators")
                    rows = cur.fetchall()
                    if not rows:
                        # 데이터베이스가 비어있으면 기본 지표들 반환
                        return [
                            'ism-manufacturing',
                            'ism-non-manufacturing',
                            'sp-global-composite',
                            'industrial-production',
                            'industrial-production-1755',
                            'retail-sales',
                            'retail-sales-yoy'
                        ]
                    return [row['indicator_id'] for row in rows]
        except Exception as e:
            print(f"Error getting all indicators: {e}")
            # 오류 시 기본 지표들 반환
            return [
                'ism-manufacturing',
                'ism-non-manufacturing',
                'sp-global-composite',
                'industrial-production',
                'industrial-production-1755',
                'retail-sales',
                'retail-sales-yoy'
            ]

    def get_crawl_info(self, indicator_id: str) -> Optional[Dict[str, Any]]:
        """크롤링 정보 조회"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT * FROM crawl_info
                        WHERE indicator_id = %s
                        ORDER BY last_crawl_time DESC LIMIT 1
                    """, (indicator_id,))
                    row = cur.fetchone()

                    if row:
                        return {
                            "indicator_id": row['indicator_id'],
                            "last_crawl_time": row['last_crawl_time'],
                            "status": row['status'],
                            "error_message": row['error_message'],
                            "data_count": row['data_count']
                        }
                    return None
        except Exception as e:
            print(f"Error getting crawl info for {indicator_id}: {e}")
            return None

    def update_crawl_info(self, indicator_id: str, status: str, data_count: int = 0, error_message: str = None):
        """크롤링 정보 업데이트"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # 기존 레코드 삭제 후 새로 삽입 (최신 상태만 유지)
                    cur.execute("DELETE FROM crawl_info WHERE indicator_id = %s", (indicator_id,))
                    cur.execute("""
                        INSERT INTO crawl_info
                        (indicator_id, status, data_count, error_message)
                        VALUES (%s, %s, %s, %s)
                    """, (indicator_id, status, data_count, error_message))
                    conn.commit()
        except Exception as e:
            print(f"Error updating crawl info for {indicator_id}: {e}")

    def _parse_value(self, value: str) -> Any:
        """문자열 값을 적절한 타입으로 변환"""
        if value is None or value == 'None':
            return None

        # % 문자열은 그대로 반환
        if isinstance(value, str) and '%' in value:
            return value

        # 숫자 변환 시도
        try:
            # 정수인지 확인
            if '.' not in str(value):
                return int(value)
            else:
                return float(value)
        except (ValueError, TypeError):
            return value  # 변환 실패 시 원본 반환

    def save_asset(self, asset_data: Dict[str, Any]) -> Dict[str, Any]:
        """자산 데이터를 데이터베이스에 저장"""
        try:
            print(f"PostgreSQL save_asset called with: {asset_data}")
            with self.get_connection() as conn:
                print("PostgreSQL connection established")
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO assets (
                            user_id, asset_type, sub_category, name, amount, quantity, avg_price,
                            eval_amount, principal, profit_loss, profit_rate, date, note,
                            area_pyeong, acquisition_tax, lawyer_fee, brokerage_fee, rent_type, rental_income, jeonse_deposit,
                            maturity_date, interest_rate, early_withdrawal_fee, current_yield,
                            annual_yield, minimum_balance, withdrawal_fee, dividend_rate, nav, management_fee
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """, (
                        asset_data.get('user_id'),
                        asset_data.get('asset_type'),
                        asset_data.get('sub_category'),
                        asset_data.get('name'),
                        asset_data.get('amount'),
                        asset_data.get('quantity'),
                        asset_data.get('avg_price'),
                        asset_data.get('eval_amount'),
                        asset_data.get('principal'),
                        asset_data.get('profit_loss', 0),
                        asset_data.get('profit_rate', 0),
                        asset_data.get('date'),
                        asset_data.get('note'),
                        # 부동산 필드
                        asset_data.get('area_pyeong'),
                        asset_data.get('acquisition_tax'),
                        asset_data.get('lawyer_fee'),
                        asset_data.get('brokerage_fee'),
                        asset_data.get('rent_type', 'monthly'),
                        asset_data.get('rental_income'),
                        asset_data.get('jeonse_deposit'),
                        # 예금/적금 필드
                        asset_data.get('maturity_date'),
                        asset_data.get('interest_rate'),
                        asset_data.get('early_withdrawal_fee'),
                        # MMF/CMA 필드
                        asset_data.get('current_yield'),
                        asset_data.get('annual_yield'),
                        asset_data.get('minimum_balance'),
                        asset_data.get('withdrawal_fee'),
                        # 주식/ETF 필드
                        asset_data.get('dividend_rate'),
                        # 펀드 필드
                        asset_data.get('nav'),
                        asset_data.get('management_fee')
                    ))

                    result = cur.fetchone()
                    print(f"Insert result: {result}")
                    asset_id = result['id'] if result else None
                    conn.commit()
                    print(f"Asset saved successfully with ID: {asset_id}")

                    return {
                        "status": "success",
                        "message": "자산 저장 완료",
                        "asset_id": asset_id
                    }

        except Exception as e:
            print(f"Error saving asset: {e}")
            return {
                "status": "error",
                "message": f"자산 저장 실패: {str(e)}"
            }

    def get_all_assets(self, user_id: int = None) -> Dict[str, Any]:
        """사용자별 자산 데이터 조회 (포트폴리오 대시보드용)"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    if user_id:
                        cur.execute("""
                            SELECT id, asset_type, sub_category, name, amount, quantity, avg_price, eval_amount, principal, profit_loss, profit_rate, date, note, created_at,
                                   area_pyeong, acquisition_tax, rent_type, rental_income, jeonse_deposit, lawyer_fee, brokerage_fee, maturity_date, interest_rate, early_withdrawal_fee,
                                   current_yield, annual_yield, minimum_balance, withdrawal_fee, dividend_rate, nav, management_fee
                            FROM assets
                            WHERE user_id = %s
                            ORDER BY created_at DESC
                        """, (user_id,))
                    else:
                        # 하위 호환성을 위해 user_id가 없으면 모든 자산 조회 (기존 동작)
                        cur.execute("""
                            SELECT id, asset_type, sub_category, name, amount, quantity, avg_price, eval_amount, principal, profit_loss, profit_rate, date, note, created_at,
                                   area_pyeong, acquisition_tax, rent_type, rental_income, jeonse_deposit, lawyer_fee, brokerage_fee, maturity_date, interest_rate, early_withdrawal_fee,
                                   current_yield, annual_yield, minimum_balance, withdrawal_fee, dividend_rate, nav, management_fee
                            FROM assets
                            ORDER BY created_at DESC
                        """)

                    rows = cur.fetchall()

                    if not rows:
                        return {
                            "status": "success",
                            "data": [],
                            "summary": {
                                "total_assets": 0,
                                "total_eval_amount": 0,
                                "total_principal": 0,
                                "total_profit_loss": 0,
                                "profit_rate": 0
                            },
                            "by_category": {}
                        }

                    # 데이터 변환 및 계산
                    assets = []
                    total_amount = 0
                    total_eval_amount = 0
                    total_principal = 0
                    total_profit_loss = 0
                    category_summary = {}

                    for row in rows:
                        # 원금과 평가금액 결정
                        principal = float(row['principal']) if row['principal'] else float(row['amount']) if row['amount'] else 0
                        eval_amount = float(row['eval_amount']) if row['eval_amount'] else float(row['amount']) if row['amount'] else 0

                        # 손익과 수익률 계산
                        profit_loss = eval_amount - principal
                        profit_rate = (profit_loss / principal * 100) if principal > 0 else 0

                        asset = {
                            "id": row['id'],
                            "asset_type": row['asset_type'],
                            "sub_category": row['sub_category'],
                            "name": row['name'],
                            "amount": float(row['amount']) if row['amount'] else 0,
                            "quantity": float(row['quantity']) if row['quantity'] else None,
                            "avg_price": float(row['avg_price']) if row['avg_price'] else None,
                            "eval_amount": eval_amount,
                            "principal": principal,
                            "profit_loss": profit_loss,
                            "profit_rate": profit_rate,
                            "date": row['date'],
                            "note": row['note'],
                            "created_at": row['created_at'].isoformat() if row['created_at'] else None,
                            # 소분류별 전용 필드들 추가
                            "area_pyeong": float(row['area_pyeong']) if row['area_pyeong'] else None,
                            "acquisition_tax": float(row['acquisition_tax']) if row['acquisition_tax'] else None,
                            "rent_type": row['rent_type'],
                            "rental_income": float(row['rental_income']) if row['rental_income'] else None,
                            "jeonse_deposit": float(row['jeonse_deposit']) if row['jeonse_deposit'] else None,
                            "lawyer_fee": float(row['lawyer_fee']) if row['lawyer_fee'] else None,
                            "brokerage_fee": float(row['brokerage_fee']) if row['brokerage_fee'] else None,
                            "maturity_date": row['maturity_date'],
                            "interest_rate": float(row['interest_rate']) if row['interest_rate'] else None,
                            "early_withdrawal_fee": float(row['early_withdrawal_fee']) if row['early_withdrawal_fee'] else None,
                            "current_yield": float(row['current_yield']) if row['current_yield'] else None,
                            "annual_yield": float(row['annual_yield']) if row['annual_yield'] else None,
                            "minimum_balance": float(row['minimum_balance']) if row['minimum_balance'] else None,
                            "withdrawal_fee": float(row['withdrawal_fee']) if row['withdrawal_fee'] else None,
                            "dividend_rate": float(row['dividend_rate']) if row['dividend_rate'] else None,
                            "nav": float(row['nav']) if row['nav'] else None,
                            "management_fee": float(row['management_fee']) if row['management_fee'] else None
                        }

                        assets.append(asset)
                        total_amount += asset["amount"]
                        total_eval_amount += asset["eval_amount"]

                        # 원금과 손익 합계 계산
                        total_principal += asset["principal"]
                        total_profit_loss += asset["profit_loss"]

                        # 자산군별 합계
                        category = asset["asset_type"]
                        if category not in category_summary:
                            category_summary[category] = {
                                "total_amount": 0,
                                "total_principal": 0,
                                "total_eval_amount": 0,
                                "count": 0,
                                "percentage": 0,
                                "principal_percentage": 0,
                                "eval_percentage": 0
                            }
                        category_summary[category]["total_amount"] += asset["amount"]
                        category_summary[category]["total_principal"] += asset["principal"]
                        category_summary[category]["total_eval_amount"] += asset["eval_amount"]
                        category_summary[category]["count"] += 1

                    # 자산군별 비중 계산
                    for category in category_summary:
                        if total_amount > 0:
                            category_summary[category]["percentage"] = round(
                                (category_summary[category]["total_amount"] / total_amount) * 100, 2
                            )
                        if total_principal > 0:
                            category_summary[category]["principal_percentage"] = round(
                                (category_summary[category]["total_principal"] / total_principal) * 100, 2
                            )
                        if total_eval_amount > 0:
                            category_summary[category]["eval_percentage"] = round(
                                (category_summary[category]["total_eval_amount"] / total_eval_amount) * 100, 2
                            )

                    # 총 수익률 계산
                    total_profit_rate = 0
                    if total_principal > 0:
                        total_profit_rate = (total_profit_loss / total_principal) * 100

                    return {
                        "status": "success",
                        "data": assets,
                        "summary": {
                            "total_assets": total_amount,
                            "total_eval_amount": total_eval_amount,
                            "total_principal": total_principal,
                            "total_profit_loss": total_profit_loss,
                            "profit_rate": total_profit_rate
                        },
                        "by_category": category_summary
                    }

        except Exception as e:
            print(f"Error getting all assets: {e}")
            return {
                "status": "error",
                "message": f"자산 조회 실패: {str(e)}"
            }

    def update_asset(self, asset_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """자산 데이터를 데이터베이스에서 수정 (user_id 검증 포함)"""
        try:
            print(f"PostgreSQL update_asset called with ID: {asset_id}")
            print(f"Update data: {data}")

            user_id = data.get('user_id')
            print(f"User ID for update: {user_id}")

            with self.get_connection() as conn:
                print("PostgreSQL connection established for update")
                with conn.cursor() as cur:
                    # 사용자별 자산 존재 여부 확인
                    if user_id:
                        cur.execute("SELECT id, name FROM assets WHERE id = %s AND user_id = %s", (asset_id, user_id))
                    else:
                        # 하위 호환성: user_id가 없으면 기존 동작
                        cur.execute("SELECT id, name FROM assets WHERE id = %s", (asset_id,))

                    asset = cur.fetchone()

                    if not asset:
                        message = f"ID {asset_id}인 자산을 찾을 수 없거나 접근 권한이 없습니다." if user_id else f"ID {asset_id}인 자산을 찾을 수 없습니다."
                        return {
                            "status": "error",
                            "message": message
                        }

                    # 업데이트할 필드들 구성
                    update_fields = []
                    values = []

                    # 기본 필드들
                    if 'asset_type' in data:
                        update_fields.append("asset_type = %s")
                        values.append(data['asset_type'])

                    if 'sub_category' in data:
                        update_fields.append("sub_category = %s")
                        values.append(data['sub_category'])

                    if 'name' in data:
                        update_fields.append("name = %s")
                        values.append(data['name'])

                    if 'date' in data:
                        update_fields.append("date = %s")
                        values.append(data['date'])

                    if 'note' in data:
                        update_fields.append("note = %s")
                        values.append(data['note'])

                    # 수량과 평균가
                    if 'quantity' in data:
                        update_fields.append("quantity = %s")
                        values.append(data['quantity'] if data['quantity'] else None)

                    if 'avg_price' in data:
                        update_fields.append("avg_price = %s")
                        values.append(data['avg_price'] if data['avg_price'] else None)

                    # 원금과 평가액
                    if 'principal' in data:
                        update_fields.append("principal = %s")
                        values.append(data['principal'] if data['principal'] else None)

                    if 'eval_amount' in data:
                        update_fields.append("eval_amount = %s")
                        values.append(data['eval_amount'] if data['eval_amount'] else None)

                    # 소분류별 전용 필드들
                    # 부동산 필드
                    if 'area_pyeong' in data:
                        update_fields.append("area_pyeong = %s")
                        values.append(data['area_pyeong'] if data['area_pyeong'] else None)
                    if 'acquisition_tax' in data:
                        update_fields.append("acquisition_tax = %s")
                        values.append(data['acquisition_tax'] if data['acquisition_tax'] else None)
                    if 'lawyer_fee' in data:
                        update_fields.append("lawyer_fee = %s")
                        values.append(data['lawyer_fee'] if data['lawyer_fee'] else None)
                    if 'brokerage_fee' in data:
                        update_fields.append("brokerage_fee = %s")
                        values.append(data['brokerage_fee'] if data['brokerage_fee'] else None)
                    if 'rent_type' in data:
                        update_fields.append("rent_type = %s")
                        values.append(data['rent_type'] if data['rent_type'] else 'monthly')
                    if 'rental_income' in data:
                        update_fields.append("rental_income = %s")
                        values.append(data['rental_income'] if data['rental_income'] else None)
                    if 'jeonse_deposit' in data:
                        update_fields.append("jeonse_deposit = %s")
                        values.append(data['jeonse_deposit'] if data['jeonse_deposit'] else None)

                    # 예금/적금 필드
                    if 'maturity_date' in data:
                        update_fields.append("maturity_date = %s")
                        values.append(data['maturity_date'] if data['maturity_date'] else None)
                    if 'interest_rate' in data:
                        update_fields.append("interest_rate = %s")
                        values.append(data['interest_rate'] if data['interest_rate'] else None)
                    if 'early_withdrawal_fee' in data:
                        update_fields.append("early_withdrawal_fee = %s")
                        values.append(data['early_withdrawal_fee'] if data['early_withdrawal_fee'] else None)

                    # MMF/CMA 필드
                    if 'current_yield' in data:
                        update_fields.append("current_yield = %s")
                        values.append(data['current_yield'] if data['current_yield'] else None)
                    if 'annual_yield' in data:
                        update_fields.append("annual_yield = %s")
                        values.append(data['annual_yield'] if data['annual_yield'] else None)
                    if 'minimum_balance' in data:
                        update_fields.append("minimum_balance = %s")
                        values.append(data['minimum_balance'] if data['minimum_balance'] else None)
                    if 'withdrawal_fee' in data:
                        update_fields.append("withdrawal_fee = %s")
                        values.append(data['withdrawal_fee'] if data['withdrawal_fee'] else None)

                    # 주식/ETF 필드
                    if 'dividend_rate' in data:
                        update_fields.append("dividend_rate = %s")
                        values.append(data['dividend_rate'] if data['dividend_rate'] else None)

                    # 펀드 필드
                    if 'nav' in data:
                        update_fields.append("nav = %s")
                        values.append(data['nav'] if data['nav'] else None)
                    if 'management_fee' in data:
                        update_fields.append("management_fee = %s")
                        values.append(data['management_fee'] if data['management_fee'] else None)

                    # amount 계산 (수량 * 평균가 또는 eval_amount)
                    if 'quantity' in data and 'avg_price' in data and data['quantity'] and data['avg_price']:
                        amount = float(data['quantity']) * float(data['avg_price'])
                        update_fields.append("amount = %s")
                        values.append(amount)
                    elif 'eval_amount' in data and data['eval_amount']:
                        update_fields.append("amount = %s")
                        values.append(data['eval_amount'])

                    # updated_at 필드 추가
                    update_fields.append("updated_at = CURRENT_TIMESTAMP")

                    # asset_id를 values 마지막에 추가
                    values.append(asset_id)

                    # 디버깅: update_fields 확인
                    print(f"DEBUG: update_fields before SQL: {update_fields}")

                    # SQL 쿼리 실행 (user_id 조건 추가)
                    if user_id:
                        sql = f"UPDATE assets SET {', '.join(update_fields)} WHERE id = %s AND user_id = %s"
                        values.append(user_id)
                    else:
                        sql = f"UPDATE assets SET {', '.join(update_fields)} WHERE id = %s"

                    print(f"Executing SQL: {sql}")
                    print(f"Values: {values}")

                    cur.execute(sql, values)

                    if cur.rowcount > 0:
                        conn.commit()
                        print(f"Asset {asset_id} updated successfully")
                        return {
                            "status": "success",
                            "message": f"'{asset['name']}' 자산이 성공적으로 수정되었습니다.",
                            "updated_asset_id": asset_id
                        }
                    else:
                        return {
                            "status": "error",
                            "message": "자산 수정에 실패했습니다."
                        }

        except Exception as e:
            print(f"PostgreSQL update_asset error: {e}")
            return {
                "status": "error",
                "message": f"데이터베이스 오류: {str(e)}"
            }

    def get_goal_settings(self, user_id: str = 'default') -> Dict[str, Any]:
        """목표 설정을 데이터베이스에서 조회"""
        try:
            print(f"PostgreSQL get_goal_settings called for user: {user_id}")
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                    cur.execute("SELECT * FROM goal_settings WHERE user_id = %s", (user_id,))
                    result = cur.fetchone()

                    if result:
                        return {
                            "status": "success",
                            "data": {
                                "total_goal": float(result['total_goal']),
                                "target_date": result['target_date'].isoformat(),
                                "category_goals": result['category_goals'] or {},
                                "sub_category_goals": result.get('sub_category_goals', {}) or {}
                            }
                        }
                    else:
                        # 기본값 반환
                        return {
                            "status": "success",
                            "data": {
                                "total_goal": 50000000,
                                "target_date": "2024-12-31",
                                "category_goals": {},
                                "sub_category_goals": {}
                            }
                        }

        except Exception as e:
            print(f"PostgreSQL get_goal_settings error: {e}")
            return {
                "status": "error",
                "message": f"목표 설정 조회 실패: {str(e)}"
            }

    def save_goal_settings(self, user_id: str, total_goal: float, target_date: str, category_goals: Dict, sub_category_goals: Dict = None) -> Dict[str, Any]:
        """목표 설정을 데이터베이스에 저장"""
        try:
            print(f"PostgreSQL save_goal_settings called for user: {user_id}")
            print(f"Data: total_goal={total_goal}, target_date={target_date}, category_goals={category_goals}, sub_category_goals={sub_category_goals}")

            if sub_category_goals is None:
                sub_category_goals = {}

            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # UPSERT (INSERT ... ON CONFLICT UPDATE)
                    sql = """
                    INSERT INTO goal_settings (user_id, total_goal, target_date, category_goals, sub_category_goals, updated_at)
                    VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (user_id)
                    DO UPDATE SET
                        total_goal = EXCLUDED.total_goal,
                        target_date = EXCLUDED.target_date,
                        category_goals = EXCLUDED.category_goals,
                        sub_category_goals = EXCLUDED.sub_category_goals,
                        updated_at = CURRENT_TIMESTAMP
                    """

                    cur.execute(sql, (user_id, total_goal, target_date, json.dumps(category_goals), json.dumps(sub_category_goals)))
                    conn.commit()

                    print(f"Goal settings saved successfully for user: {user_id}")
                    return {
                        "status": "success",
                        "message": "목표 설정이 저장되었습니다."
                    }

        except Exception as e:
            print(f"PostgreSQL save_goal_settings error: {e}")
            return {
                "status": "error",
                "message": f"목표 설정 저장 실패: {str(e)}"
            }

    def delete_asset(self, asset_id: int, user_id: str = None) -> Dict[str, Any]:
        """자산 데이터를 데이터베이스에서 삭제 (user_id 검증 포함)"""
        try:
            print(f"PostgreSQL delete_asset called with ID: {asset_id}, user_id: {user_id}")
            with self.get_connection() as conn:
                print("PostgreSQL connection established for deletion")
                with conn.cursor() as cur:
                    # 사용자별 자산 존재 여부 확인
                    if user_id:
                        cur.execute("SELECT id, name FROM assets WHERE id = %s AND user_id = %s", (asset_id, user_id))
                    else:
                        # 하위 호환성: user_id가 없으면 기존 동작
                        cur.execute("SELECT id, name FROM assets WHERE id = %s", (asset_id,))

                    asset = cur.fetchone()

                    if not asset:
                        message = f"ID {asset_id}인 자산을 찾을 수 없거나 접근 권한이 없습니다." if user_id else f"ID {asset_id}인 자산을 찾을 수 없습니다."
                        return {
                            "status": "error",
                            "message": message
                        }

                    asset_name = asset['name']

                    # 사용자별 자산 삭제
                    if user_id:
                        cur.execute("DELETE FROM assets WHERE id = %s AND user_id = %s", (asset_id, user_id))
                    else:
                        cur.execute("DELETE FROM assets WHERE id = %s", (asset_id,))

                    deleted_count = cur.rowcount
                    conn.commit()

                    if deleted_count > 0:
                        print(f"Asset '{asset_name}' (ID: {asset_id}) deleted successfully for user: {user_id}")
                        return {
                            "status": "success",
                            "message": f"자산 '{asset_name}'이(가) 성공적으로 삭제되었습니다.",
                            "deleted_asset": {
                                "id": asset_id,
                                "name": asset_name
                            }
                        }
                    else:
                        return {
                            "status": "error",
                            "message": f"자산 삭제에 실패했습니다."
                        }

        except Exception as e:
            print(f"Error deleting asset: {e}")
            return {
                "status": "error",
                "message": f"자산 삭제 실패: {str(e)}"
            }

    # === 사용자 인증 관련 메서드 ===

    def _hash_password(self, password: str) -> str:
        """bcrypt를 사용한 강력한 비밀번호 해시화"""
        # bcrypt로 12라운드 솔트 해싱 (my-site와 동일한 보안 수준)
        salt = bcrypt.gensalt(rounds=12)
        password_hash = bcrypt.hashpw(password.encode('utf-8'), salt)
        return password_hash.decode('utf-8')

    def _verify_password(self, password: str, password_hash: str) -> bool:
        """하이브리드 비밀번호 검증 (bcrypt + 기존 PBKDF2 호환)"""
        try:
            # 1. bcrypt 해시 확인 (새로운 사용자)
            if password_hash.startswith('$2'):  # bcrypt 시그니처
                return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

            # 2. 기존 PBKDF2 해시 확인 (기존 사용자)
            if ':' in password_hash:  # 기존 salt:hash 형식
                try:
                    salt, stored_hash = password_hash.split(':')
                    password_hash_check = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
                    return stored_hash == password_hash_check.hex()
                except Exception as e:
                    print(f"PBKDF2 verification error: {e}")
                    return False

            # 3. 알 수 없는 형식
            print(f"Unknown password hash format: {password_hash[:20]}...")
            return False

        except Exception as e:
            print(f"Password verification error: {e}")
            return False

    def _upgrade_password_to_bcrypt(self, user_id: int, plain_password: str) -> bool:
        """PBKDF2에서 bcrypt로 비밀번호 업그레이드"""
        try:
            new_hash = self._hash_password(plain_password)

            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE users SET password_hash = %s WHERE id = %s",
                        (new_hash, user_id)
                    )
                    conn.commit()
                    print(f"User {user_id} password upgraded to bcrypt")
                    return True

        except Exception as e:
            print(f"Error upgrading password: {e}")
            return False

    def generate_jwt_token(self, user_id: int, username: str) -> str:
        """JWT 토큰 생성"""
        payload = {
            'user_id': user_id,
            'username': username,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(hours=24)
        }
        return jwt.encode(payload, self.jwt_secret, algorithm='HS256')

    def verify_jwt_token(self, token: str) -> Dict[str, Any]:
        """JWT 토큰 검증"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])
            return {
                'status': 'success',
                'user_id': payload['user_id'],
                'username': payload['username']
            }
        except jwt.ExpiredSignatureError:
            return {'status': 'error', 'message': '토큰이 만료되었습니다.'}
        except jwt.InvalidTokenError:
            return {'status': 'error', 'message': '유효하지 않은 토큰입니다.'}

    def check_rate_limit(self, username: str) -> bool:
        """브루트포스 방지: 로그인 시도 제한 체크"""
        current_time = datetime.now()
        if username in self.login_attempts:
            attempts, last_attempt = self.login_attempts[username]
            # 5분이 지나면 초기화
            if (current_time - last_attempt).seconds > 300:
                del self.login_attempts[username]
                return True
            # 5회 이상 실패 시 차단
            if attempts >= 5:
                return False
        return True

    def record_failed_attempt(self, username: str):
        """실패한 로그인 시도 기록"""
        current_time = datetime.now()
        if username in self.login_attempts:
            attempts, _ = self.login_attempts[username]
            self.login_attempts[username] = (attempts + 1, current_time)
        else:
            self.login_attempts[username] = (1, current_time)

    def create_user(self, username: str, password: str) -> Dict[str, Any]:
        """새 사용자 생성"""
        try:
            # 사용자명 중복 체크
            if self.get_user_by_username(username):
                return {
                    "status": "error",
                    "message": "이미 존재하는 사용자명입니다."
                }

            password_hash = self._hash_password(password)

            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "INSERT INTO users (username, password_hash) VALUES (%s, %s) RETURNING id",
                        (username, password_hash)
                    )
                    user_id = cur.fetchone()['id']
                    conn.commit()

                    return {
                        "status": "success",
                        "message": "사용자가 성공적으로 생성되었습니다.",
                        "user_id": user_id,
                        "username": username
                    }

        except Exception as e:
            print(f"Error creating user: {e}")
            return {
                "status": "error",
                "message": f"사용자 생성 실패: {str(e)}"
            }

    def authenticate_user(self, username: str, password: str) -> Dict[str, Any]:
        """강화된 사용자 인증 (JWT + 브루트포스 방지)"""
        try:
            # 브루트포스 방지 체크
            if not self.check_rate_limit(username):
                return {
                    "status": "error",
                    "message": "너무 많은 로그인 시도입니다. 5분 후 다시 시도해주세요."
                }

            # 입력 검증
            if not username or len(username.strip()) == 0:
                return {"status": "error", "message": "사용자명을 입력해주세요."}
            if not password or len(password) < 4:
                return {"status": "error", "message": "비밀번호는 4자 이상이어야 합니다."}

            user = self.get_user_by_username(username.strip())
            if not user:
                self.record_failed_attempt(username)
                return {
                    "status": "error",
                    "message": "존재하지 않는 사용자명입니다."
                }

            if self._verify_password(password, user['password_hash']):
                # 기존 PBKDF2 사용자의 경우 bcrypt로 자동 업그레이드
                if ':' in user['password_hash']:  # PBKDF2 형식 감지
                    print(f"Upgrading user {user['id']} from PBKDF2 to bcrypt")
                    self._upgrade_password_to_bcrypt(user['id'], password)

                # 로그인 성공 시 JWT 토큰 생성
                token = self.generate_jwt_token(user['id'], user['username'])

                # 성공 시 실패 기록 초기화
                if username in self.login_attempts:
                    del self.login_attempts[username]

                return {
                    "status": "success",
                    "message": "로그인 성공",
                    "user_id": user['id'],
                    "username": user['username'],
                    "token": token
                }
            else:
                # 실패 기록
                self.record_failed_attempt(username)
                return {
                    "status": "error",
                    "message": "비밀번호가 일치하지 않습니다."
                }

        except Exception as e:
            print(f"Error authenticating user: {e}")
            return {
                "status": "error",
                "message": f"로그인 실패: {str(e)}"
            }

    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """사용자명으로 사용자 조회"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT id, username, password_hash, created_at FROM users WHERE username = %s",
                        (username,)
                    )
                    user = cur.fetchone()
                    return dict(user) if user else None

        except Exception as e:
            print(f"Error getting user by username: {e}")
            return None

    def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """사용자 ID로 사용자 조회"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT id, username, password_hash, created_at FROM users WHERE id = %s",
                        (user_id,)
                    )
                    user = cur.fetchone()
                    return dict(user) if user else None

        except Exception as e:
            print(f"Error getting user by ID: {e}")
            return None

    def delete_user(self, username: str) -> Dict[str, Any]:
        """사용자 계정 삭제 (CASCADE로 모든 관련 데이터도 삭제)"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # 먼저 사용자 존재 확인
                    cur.execute("SELECT id, username FROM users WHERE username = %s", (username,))
                    user = cur.fetchone()

                    if not user:
                        return {
                            "status": "error",
                            "message": "존재하지 않는 사용자입니다."
                        }

                    # 사용자 삭제 (CASCADE로 assets, goal_settings도 자동 삭제)
                    cur.execute("DELETE FROM users WHERE username = %s", (username,))
                    conn.commit()

                    return {
                        "status": "success",
                        "message": f"사용자 '{username}' 및 모든 관련 데이터가 삭제되었습니다.",
                        "deleted_user_id": user['id']
                    }

        except Exception as e:
            print(f"Error deleting user: {e}")
            return {
                "status": "error",
                "message": f"사용자 삭제 실패: {str(e)}"
            }

    def generate_reset_token(self, user_id: int) -> str:
        """비밀번호 재설정 토큰 생성 (짧은 만료 시간)"""
        payload = {
            'user_id': user_id,
            'purpose': 'password_reset',
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(minutes=30)  # 30분 만료
        }
        return jwt.encode(payload, self.jwt_secret, algorithm='HS256')

    def verify_reset_token(self, token: str) -> Dict[str, Any]:
        """비밀번호 재설정 토큰 검증"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])

            if payload.get('purpose') != 'password_reset':
                return {'status': 'error', 'message': '유효하지 않은 토큰 목적입니다.'}

            return {
                'status': 'success',
                'user_id': payload['user_id']
            }
        except jwt.ExpiredSignatureError:
            return {'status': 'error', 'message': '재설정 토큰이 만료되었습니다. 다시 요청해주세요.'}
        except jwt.InvalidTokenError:
            return {'status': 'error', 'message': '유효하지 않은 재설정 토큰입니다.'}

    def update_user_password(self, user_id: int, new_password: str) -> Dict[str, Any]:
        """사용자 비밀번호 업데이트"""
        try:
            if len(new_password) < 4:
                return {
                    "status": "error",
                    "message": "비밀번호는 4자 이상이어야 합니다."
                }

            # 새 비밀번호 해시화
            new_hash = self._hash_password(new_password)

            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE users SET password_hash = %s WHERE id = %s",
                        (new_hash, user_id)
                    )

                    if cur.rowcount == 0:
                        return {
                            "status": "error",
                            "message": "사용자를 찾을 수 없습니다."
                        }

                    conn.commit()

                    return {
                        "status": "success",
                        "message": "비밀번호가 성공적으로 변경되었습니다."
                    }

        except Exception as e:
            print(f"Error updating password: {e}")
            return {
                "status": "error",
                "message": f"비밀번호 변경 실패: {str(e)}"
            }

    def create_password_reset_request(self, username: str) -> Dict[str, Any]:
        """비밀번호 재설정 요청 생성"""
        try:
            user = self.get_user_by_username(username)
            if not user:
                # 보안상 사용자가 존재하지 않아도 성공 메시지 반환
                return {
                    "status": "success",
                    "message": "해당 사용자명으로 재설정 링크가 발송되었습니다. (존재하는 경우)"
                }

            # 재설정 토큰 생성
            reset_token = self.generate_reset_token(user['id'])

            return {
                "status": "success",
                "message": "비밀번호 재설정 토큰이 생성되었습니다.",
                "reset_token": reset_token,
                "user_id": user['id'],
                "expires_in": "30분"
            }

        except Exception as e:
            print(f"Error creating password reset request: {e}")
            return {
                "status": "error",
                "message": "비밀번호 재설정 요청 처리 실패"
            }

    def save_portfolio_history(self, user_id: str, change_type: str, total_assets: float = 0, total_principal: float = 0, total_eval_amount: float = 0, asset_id: int = None, asset_name: str = None, change_amount: float = 0, notes: str = None) -> Dict[str, Any]:
        """포트폴리오 변경사항을 이력에 저장"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO portfolio_history
                        (user_id, change_type, total_assets, total_principal, total_eval_amount, asset_id, asset_name, change_amount, notes)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (user_id, change_type, total_assets, total_principal, total_eval_amount, asset_id, asset_name, change_amount, notes))

                    conn.commit()
                    return {"status": "success", "message": "Portfolio history saved"}

        except Exception as e:
            print(f"Error saving portfolio history: {e}")
            return {"status": "error", "message": f"Failed to save history: {str(e)}"}

    def get_portfolio_history(self, user_id: str, time_range: str = 'daily', start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        """포트폴리오 이력을 조회 (시간 범위별)"""
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # 시간 범위에 따른 쿼리 조건 설정
                    if time_range == 'annual':
                        # 연간: 월별 마지막 일의 데이터
                        query = """
                            SELECT DISTINCT ON (DATE_TRUNC('month', timestamp))
                                timestamp, total_assets, total_principal, total_eval_amount,
                                change_type, change_amount, asset_name
                            FROM portfolio_history
                            WHERE user_id = %s
                        """
                        if start_date:
                            query += " AND timestamp >= %s"
                        if end_date:
                            query += " AND timestamp <= %s"
                        query += " ORDER BY DATE_TRUNC('month', timestamp), timestamp DESC"

                    elif time_range == 'monthly':
                        # 월간: 일별 마지막 데이터
                        query = """
                            SELECT DISTINCT ON (DATE(timestamp))
                                timestamp, total_assets, total_principal, total_eval_amount,
                                change_type, change_amount, asset_name
                            FROM portfolio_history
                            WHERE user_id = %s
                        """
                        if start_date:
                            query += " AND timestamp >= %s"
                        if end_date:
                            query += " AND timestamp <= %s"
                        query += " ORDER BY DATE(timestamp), timestamp DESC"

                    else:  # daily
                        # 일간: 모든 변경사항
                        query = """
                            SELECT timestamp, total_assets, total_principal, total_eval_amount,
                                   change_type, change_amount, asset_name, notes
                            FROM portfolio_history
                            WHERE user_id = %s
                        """
                        if start_date:
                            query += " AND timestamp >= %s"
                        if end_date:
                            query += " AND timestamp <= %s"
                        query += " ORDER BY timestamp DESC"

                    # 파라미터 설정
                    params = [user_id]
                    if start_date:
                        params.append(start_date)
                    if end_date:
                        params.append(end_date)

                    cur.execute(query, params)
                    results = cur.fetchall()

                    # 딕셔너리로 변환
                    history_data = []
                    for row in results:
                        history_data.append({
                            'timestamp': row['timestamp'].isoformat() if row['timestamp'] else None,
                            'total_assets': float(row['total_assets']) if row['total_assets'] else 0,
                            'total_principal': float(row['total_principal']) if row['total_principal'] else 0,
                            'total_eval_amount': float(row['total_eval_amount']) if row['total_eval_amount'] else 0,
                            'change_type': row['change_type'],
                            'change_amount': float(row['change_amount']) if row['change_amount'] else 0,
                            'asset_name': row['asset_name'],
                            'notes': row.get('notes', '')
                        })

                    return {
                        "status": "success",
                        "data": history_data,
                        "time_range": time_range,
                        "count": len(history_data)
                    }

        except Exception as e:
            print(f"Error getting portfolio history: {e}")
            return {"status": "error", "message": f"Failed to get history: {str(e)}"}

    def create_daily_summary(self, user_id: str) -> Dict[str, Any]:
        """일일 포트폴리오 요약 생성 (스마트 샘플링)"""
        try:
            # 현재 포트폴리오 총액 계산
            assets_data = self.get_all_assets(user_id)
            if assets_data.get("status") != "success":
                return {"status": "error", "message": "Failed to get current assets"}

            total_assets = sum(asset.get('amount', 0) for asset in assets_data.get('data', []))
            total_principal = sum(asset.get('principal', asset.get('amount', 0)) for asset in assets_data.get('data', []))
            total_eval_amount = sum(asset.get('eval_amount', asset.get('amount', 0)) for asset in assets_data.get('data', []))

            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # 일일 요약 저장
                    cur.execute("""
                        INSERT INTO portfolio_history
                        (user_id, change_type, total_assets, total_principal, total_eval_amount, is_daily_summary, notes)
                        VALUES (%s, 'daily_summary', %s, %s, %s, true, 'Auto-generated daily summary')
                    """, (user_id, total_assets, total_principal, total_eval_amount))

                    conn.commit()
                    return {"status": "success", "message": "Daily summary created"}

        except Exception as e:
            print(f"Error creating daily summary: {e}")
            return {"status": "error", "message": f"Failed to create summary: {str(e)}"}

    # ======== 가계부/지출관리 시스템 메서드들 ========

    def add_expense(self, user_id: int, expense_data: Dict[str, Any]) -> Dict[str, Any]:
        """거래내역 추가 (포트폴리오 save_asset 패턴과 동일)"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    sql = """
                    INSERT INTO expenses
                    (user_id, transaction_type, amount, currency, category, subcategory, name, memo, payment_method, payment_method_name, transaction_date)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """

                    cur.execute(sql, (
                        user_id,
                        expense_data['transaction_type'],
                        expense_data['amount'],
                        expense_data.get('currency', 'KRW'),
                        expense_data['category'],
                        expense_data['subcategory'],
                        expense_data.get('name', ''),
                        expense_data.get('memo', ''),
                        expense_data.get('payment_method', ''),
                        expense_data.get('payment_method_name', ''),
                        expense_data['transaction_date']
                    ))

                    result = cur.fetchone()
                    expense_id = result['id']
                    conn.commit()

                    print(f"Expense {expense_id} added successfully")
                    return {
                        "status": "success",
                        "message": "거래내역이 성공적으로 저장되었습니다.",
                        "expense_id": expense_id
                    }

        except Exception as e:
            print(f"PostgreSQL add_expense error: {e}")
            return {
                "status": "error",
                "message": f"거래내역 저장 중 오류가 발생했습니다: {str(e)}"
            }

    def get_all_expenses(self, user_id: int, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """모든 거래내역 조회 (포트폴리오 get_all_assets 패턴과 동일)"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # 기본 쿼리
                    base_sql = """
                    SELECT id, transaction_type, amount, currency, category, subcategory,
                           name, memo, payment_method, payment_method_name, transaction_date,
                           created_at, updated_at
                    FROM expenses
                    WHERE user_id = %s
                    """

                    params = [user_id]

                    # 필터링 조건 추가
                    if filters:
                        if filters.get('start_date'):
                            base_sql += " AND transaction_date >= %s"
                            params.append(filters['start_date'])
                        if filters.get('end_date'):
                            base_sql += " AND transaction_date <= %s"
                            params.append(filters['end_date'])
                        if filters.get('category'):
                            base_sql += " AND category = %s"
                            params.append(filters['category'])
                        if filters.get('transaction_type'):
                            base_sql += " AND transaction_type = %s"
                            params.append(filters['transaction_type'])

                    base_sql += " ORDER BY transaction_date DESC, id DESC"

                    cur.execute(base_sql, params)
                    expenses = [dict(row) for row in cur.fetchall()]

                    # 요약 통계 계산
                    summary_sql = """
                    SELECT
                        SUM(CASE WHEN transaction_type = '수입' THEN amount ELSE 0 END) as total_income,
                        SUM(CASE WHEN transaction_type = '지출' THEN amount ELSE 0 END) as total_expense,
                        COUNT(*) as total_transactions
                    FROM expenses
                    WHERE user_id = %s
                    """

                    summary_params = [user_id]

                    # 필터 조건을 요약에도 적용
                    if filters:
                        if filters.get('start_date'):
                            summary_sql += " AND transaction_date >= %s"
                            summary_params.append(filters['start_date'])
                        if filters.get('end_date'):
                            summary_sql += " AND transaction_date <= %s"
                            summary_params.append(filters['end_date'])

                    cur.execute(summary_sql, summary_params)
                    summary_row = cur.fetchone()

                    total_income = float(summary_row['total_income'] or 0)
                    total_expense = float(summary_row['total_expense'] or 0)
                    net_amount = total_income - total_expense

                    # 카테고리별 집계
                    category_sql = """
                    SELECT
                        category,
                        subcategory,
                        transaction_type,
                        SUM(amount) as total_amount,
                        COUNT(*) as transaction_count
                    FROM expenses
                    WHERE user_id = %s
                    """

                    category_params = [user_id]
                    if filters:
                        if filters.get('start_date'):
                            category_sql += " AND transaction_date >= %s"
                            category_params.append(filters['start_date'])
                        if filters.get('end_date'):
                            category_sql += " AND transaction_date <= %s"
                            category_params.append(filters['end_date'])

                    category_sql += " GROUP BY category, subcategory, transaction_type ORDER BY total_amount DESC"

                    cur.execute(category_sql, category_params)
                    categories = [dict(row) for row in cur.fetchall()]

                    return {
                        "status": "success",
                        "data": expenses,
                        "summary": {
                            "total_income": total_income,
                            "total_expense": total_expense,
                            "net_amount": net_amount,
                            "total_transactions": summary_row['total_transactions'] or 0
                        },
                        "by_category": categories
                    }

        except Exception as e:
            print(f"PostgreSQL get_all_expenses error: {e}")
            return {
                "status": "error",
                "message": f"거래내역 조회 중 오류가 발생했습니다: {str(e)}",
                "data": [],
                "summary": {},
                "by_category": []
            }

    def update_expense(self, expense_id: int, expense_data: Dict[str, Any], user_id: int = None) -> Dict[str, Any]:
        """거래내역 수정 (포트폴리오 update_asset 패턴과 동일)"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # 기존 거래내역 조회
                    cur.execute("SELECT * FROM expenses WHERE id = %s", (expense_id,))
                    expense = cur.fetchone()

                    if not expense:
                        return {
                            "status": "error",
                            "message": "해당 거래내역을 찾을 수 없습니다."
                        }

                    expense = dict(expense)

                    # 수정할 필드들 구성
                    update_fields = []
                    values = []

                    if 'transaction_type' in expense_data:
                        update_fields.append("transaction_type = %s")
                        values.append(expense_data['transaction_type'])

                    if 'amount' in expense_data:
                        update_fields.append("amount = %s")
                        values.append(expense_data['amount'])

                    if 'currency' in expense_data:
                        update_fields.append("currency = %s")
                        values.append(expense_data['currency'])

                    if 'category' in expense_data:
                        update_fields.append("category = %s")
                        values.append(expense_data['category'])

                    if 'subcategory' in expense_data:
                        update_fields.append("subcategory = %s")
                        values.append(expense_data['subcategory'])

                    if 'name' in expense_data:
                        update_fields.append("name = %s")
                        values.append(expense_data['name'])

                    if 'memo' in expense_data:
                        update_fields.append("memo = %s")
                        values.append(expense_data['memo'])

                    if 'payment_method' in expense_data:
                        update_fields.append("payment_method = %s")
                        values.append(expense_data['payment_method'])

                    if 'payment_method_name' in expense_data:
                        update_fields.append("payment_method_name = %s")
                        values.append(expense_data['payment_method_name'])

                    if 'transaction_date' in expense_data:
                        update_fields.append("transaction_date = %s")
                        values.append(expense_data['transaction_date'])

                    # updated_at 필드 추가
                    update_fields.append("updated_at = CURRENT_TIMESTAMP")

                    # expense_id를 values 마지막에 추가
                    values.append(expense_id)

                    # SQL 쿼리 실행 (user_id 조건 추가)
                    if user_id:
                        sql = f"UPDATE expenses SET {', '.join(update_fields)} WHERE id = %s AND user_id = %s"
                        values.append(user_id)
                    else:
                        sql = f"UPDATE expenses SET {', '.join(update_fields)} WHERE id = %s"

                    cur.execute(sql, values)

                    if cur.rowcount > 0:
                        conn.commit()
                        return {
                            "status": "success",
                            "message": "거래내역이 성공적으로 수정되었습니다.",
                            "updated_expense_id": expense_id
                        }
                    else:
                        return {
                            "status": "error",
                            "message": "거래내역 수정에 실패했습니다."
                        }

        except Exception as e:
            print(f"PostgreSQL update_expense error: {e}")
            return {
                "status": "error",
                "message": f"거래내역 수정 중 오류가 발생했습니다: {str(e)}"
            }

    def delete_expense(self, expense_id: int, user_id: int = None) -> Dict[str, Any]:
        """거래내역 삭제 (포트폴리오 delete_asset 패턴과 동일)"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # 기존 거래내역 조회
                    cur.execute("SELECT * FROM expenses WHERE id = %s", (expense_id,))
                    expense = cur.fetchone()

                    if not expense:
                        return {
                            "status": "error",
                            "message": "해당 거래내역을 찾을 수 없습니다."
                        }

                    expense = dict(expense)

                    # 삭제 쿼리 실행 (user_id 조건 추가)
                    if user_id:
                        cur.execute("DELETE FROM expenses WHERE id = %s AND user_id = %s", (expense_id, user_id))
                    else:
                        cur.execute("DELETE FROM expenses WHERE id = %s", (expense_id,))

                    if cur.rowcount > 0:
                        conn.commit()
                        return {
                            "status": "success",
                            "message": f"'{expense['name'] or '거래내역'}'이 성공적으로 삭제되었습니다."
                        }
                    else:
                        return {
                            "status": "error",
                            "message": "거래내역 삭제에 실패했습니다."
                        }

        except Exception as e:
            print(f"PostgreSQL delete_expense error: {e}")
            return {
                "status": "error",
                "message": f"거래내역 삭제 중 오류가 발생했습니다: {str(e)}"
            }

    def set_budget(self, user_id: int, budget_data: Dict[str, Any]) -> Dict[str, Any]:
        """예산 설정 (UPSERT 방식)"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    sql = """
                    INSERT INTO budgets
                    (user_id, category, subcategory, monthly_budget, year, month)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (user_id, category, subcategory, year, month)
                    DO UPDATE SET
                        monthly_budget = EXCLUDED.monthly_budget,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING id
                    """

                    cur.execute(sql, (
                        user_id,
                        budget_data['category'],
                        budget_data.get('subcategory', ''),
                        budget_data['monthly_budget'],
                        budget_data['year'],
                        budget_data['month']
                    ))

                    result = cur.fetchone()
                    budget_id = result['id']
                    conn.commit()

                    return {
                        "status": "success",
                        "message": "예산이 성공적으로 설정되었습니다.",
                        "budget_id": budget_id
                    }

        except Exception as e:
            print(f"PostgreSQL set_budget error: {e}")
            return {
                "status": "error",
                "message": f"예산 설정 중 오류가 발생했습니다: {str(e)}"
            }

    def get_budgets(self, user_id: int, year: int = None, month: int = None) -> Dict[str, Any]:
        """예산 조회"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    sql = "SELECT * FROM budgets WHERE user_id = %s"
                    params = [user_id]

                    if year:
                        sql += " AND year = %s"
                        params.append(year)

                    if month:
                        sql += " AND month = %s"
                        params.append(month)

                    sql += " ORDER BY category, subcategory"

                    cur.execute(sql, params)
                    budgets = [dict(row) for row in cur.fetchall()]

                    return {
                        "status": "success",
                        "data": budgets
                    }

        except Exception as e:
            print(f"PostgreSQL get_budgets error: {e}")
            return {
                "status": "error",
                "message": f"예산 조회 중 오류가 발생했습니다: {str(e)}",
                "data": []
            }

    def get_budget_progress(self, user_id: int, year: int, month: int) -> Dict[str, Any]:
        """예산 진행률 조회 (예산 vs 실제 지출 비교)"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # 예산과 실제 지출을 조인해서 조회
                    sql = """
                    SELECT
                        b.category,
                        b.subcategory,
                        b.monthly_budget,
                        COALESCE(e.actual_expense, 0) as actual_expense,
                        ROUND(
                            CASE
                                WHEN b.monthly_budget > 0
                                THEN (COALESCE(e.actual_expense, 0) / b.monthly_budget * 100)
                                ELSE 0
                            END, 2
                        ) as progress_percentage,
                        (b.monthly_budget - COALESCE(e.actual_expense, 0)) as remaining_budget
                    FROM budgets b
                    LEFT JOIN (
                        SELECT
                            category,
                            subcategory,
                            SUM(amount) as actual_expense
                        FROM expenses
                        WHERE user_id = %s
                        AND transaction_type = '지출'
                        AND EXTRACT(YEAR FROM transaction_date) = %s
                        AND EXTRACT(MONTH FROM transaction_date) = %s
                        GROUP BY category, subcategory
                    ) e ON b.category = e.category AND b.subcategory = e.subcategory
                    WHERE b.user_id = %s AND b.year = %s AND b.month = %s
                    ORDER BY progress_percentage DESC
                    """

                    cur.execute(sql, (user_id, year, month, user_id, year, month))
                    progress_data = [dict(row) for row in cur.fetchall()]

                    # 전체 예산 vs 전체 지출 요약
                    total_budget = sum(item['monthly_budget'] for item in progress_data)
                    total_expense = sum(item['actual_expense'] for item in progress_data)
                    total_progress = round((total_expense / total_budget * 100) if total_budget > 0 else 0, 2)

                    return {
                        "status": "success",
                        "data": progress_data,
                        "summary": {
                            "total_budget": total_budget,
                            "total_expense": total_expense,
                            "total_remaining": total_budget - total_expense,
                            "total_progress": total_progress
                        }
                    }

        except Exception as e:
            print(f"PostgreSQL get_budget_progress error: {e}")
            return {
                "status": "error",
                "message": f"예산 진행률 조회 중 오류가 발생했습니다: {str(e)}",
                "data": [],
                "summary": {}
            }

    def get_expense_budget_goals(self, user_id: str = 'default') -> Dict[str, Any]:
        """가계부 예산 목표를 데이터베이스에서 조회"""
        try:
            print(f"PostgreSQL get_expense_budget_goals called for user: {user_id}")
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                    # expense_budget_goals 테이블 존재 확인 및 생성
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS expense_budget_goals (
                            user_id VARCHAR(100) PRIMARY KEY,
                            expense_goals JSONB DEFAULT '{}'::jsonb,
                            income_goals JSONB DEFAULT '{}'::jsonb,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """)
                    conn.commit()

                    cur.execute("SELECT * FROM expense_budget_goals WHERE user_id = %s", (user_id,))
                    result = cur.fetchone()

                    if result:
                        return {
                            "status": "success",
                            "data": {
                                "expense_goals": result['expense_goals'] or {},
                                "income_goals": result['income_goals'] or {}
                            }
                        }
                    else:
                        # 기본값 반환
                        return {
                            "status": "success",
                            "data": {
                                "expense_goals": {},
                                "income_goals": {}
                            }
                        }

        except Exception as e:
            print(f"PostgreSQL get_expense_budget_goals error: {e}")
            return {
                "status": "error",
                "message": f"예산 목표 조회 중 오류가 발생했습니다: {str(e)}"
            }

    def save_expense_budget_goals(self, user_id: str, expense_goals: Dict, income_goals: Dict) -> Dict[str, Any]:
        """가계부 예산 목표를 데이터베이스에 저장"""
        try:
            print(f"PostgreSQL save_expense_budget_goals called for user: {user_id}")
            print(f"Data: expense_goals={expense_goals}, income_goals={income_goals}")

            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # 테이블 존재 확인 및 생성
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS expense_budget_goals (
                            user_id VARCHAR(100) PRIMARY KEY,
                            expense_goals JSONB DEFAULT '{}'::jsonb,
                            income_goals JSONB DEFAULT '{}'::jsonb,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """)

                    # UPSERT (INSERT ... ON CONFLICT UPDATE)
                    sql = """
                    INSERT INTO expense_budget_goals (user_id, expense_goals, income_goals, updated_at)
                    VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (user_id)
                    DO UPDATE SET
                        expense_goals = EXCLUDED.expense_goals,
                        income_goals = EXCLUDED.income_goals,
                        updated_at = CURRENT_TIMESTAMP
                    """

                    cur.execute(sql, (user_id, json.dumps(expense_goals), json.dumps(income_goals)))
                    conn.commit()

                    print(f"Expense budget goals saved successfully for user: {user_id}")
                    return {
                        "status": "success",
                        "message": "예산 목표가 저장되었습니다."
                    }

        except Exception as e:
            print(f"PostgreSQL save_expense_budget_goals error: {e}")
            return {
                "status": "error",
                "message": f"예산 목표 저장 중 오류가 발생했습니다: {str(e)}"
            }

    # ==================== 투자 철학 시스템 (MASTER_PLAN Page 1) ====================

    def get_investment_philosophy(self, user_id: int) -> Dict:
        """투자 철학 조회"""
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT goal, forbidden_assets, allocation_range, principles, methods,
                               created_at, updated_at
                        FROM investment_philosophy
                        WHERE user_id = %s
                    """, (user_id,))

                    result = cur.fetchone()

                    if result:
                        return {
                            "status": "success",
                            "data": dict(result)
                        }
                    else:
                        # 기본값 반환
                        return {
                            "status": "success",
                            "data": {
                                "goal": {
                                    "targetReturn": 10,
                                    "riskTolerance": {"volatility": 15, "maxDrawdown": 20, "maxLeverage": 1},
                                    "timeHorizon": {"start": "2025-01-01", "target": "2030-12-31", "years": 5}
                                },
                                "forbidden_assets": [],
                                "allocation_range": [],
                                "principles": [],
                                "methods": []
                            }
                        }

        except Exception as e:
            print(f"PostgreSQL get_investment_philosophy error: {e}")
            return {
                "status": "error",
                "message": f"투자 철학 조회 중 오류: {str(e)}"
            }

    def save_investment_philosophy(self, user_id: int, data: Dict) -> Dict:
        """투자 철학 저장 (UPSERT)"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    sql = """
                    INSERT INTO investment_philosophy
                        (user_id, goal, forbidden_assets, allocation_range, principles, methods, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (user_id)
                    DO UPDATE SET
                        goal = EXCLUDED.goal,
                        forbidden_assets = EXCLUDED.forbidden_assets,
                        allocation_range = EXCLUDED.allocation_range,
                        principles = EXCLUDED.principles,
                        methods = EXCLUDED.methods,
                        updated_at = CURRENT_TIMESTAMP
                    """

                    cur.execute(sql, (
                        user_id,
                        json.dumps(data.get('goal', {})),
                        json.dumps(data.get('forbidden_assets', [])),
                        json.dumps(data.get('allocation_range', [])),
                        json.dumps(data.get('principles', [])),
                        json.dumps(data.get('methods', []))
                    ))
                    conn.commit()

                    print(f"Investment philosophy saved successfully for user: {user_id}")
                    return {
                        "status": "success",
                        "message": "투자 철학이 저장되었습니다."
                    }

        except Exception as e:
            print(f"PostgreSQL save_investment_philosophy error: {e}")
            return {
                "status": "error",
                "message": f"투자 철학 저장 중 오류: {str(e)}"
            }

    # ==================== 거시경제 담론 시스템 (MASTER_PLAN Page 2) ====================

    def get_economic_narrative(self, user_id: int, date: str) -> Dict:
        """거시경제 담론 조회"""
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT articles, my_narrative, risks, created_at, updated_at
                        FROM economic_narrative
                        WHERE user_id = %s AND date = %s
                    """, (user_id, date))

                    result = cur.fetchone()

                    if result:
                        return {
                            "status": "success",
                            "data": dict(result)
                        }
                    else:
                        # 기본값 반환
                        return {
                            "status": "success",
                            "data": {
                                "articles": [],
                                "my_narrative": "",
                                "risks": []
                            }
                        }

        except Exception as e:
            print(f"PostgreSQL get_economic_narrative error: {e}")
            return {
                "status": "error",
                "message": f"거시경제 담론 조회 중 오류: {str(e)}"
            }

    def save_economic_narrative(self, user_id: int, date: str, data: Dict) -> Dict:
        """거시경제 담론 저장 (UPSERT)"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    sql = """
                    INSERT INTO economic_narrative
                        (user_id, date, articles, my_narrative, risks, updated_at)
                    VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (user_id, date)
                    DO UPDATE SET
                        articles = EXCLUDED.articles,
                        my_narrative = EXCLUDED.my_narrative,
                        risks = EXCLUDED.risks,
                        updated_at = CURRENT_TIMESTAMP
                    """

                    cur.execute(sql, (
                        user_id,
                        date,
                        json.dumps(data.get('articles', [])),
                        data.get('my_narrative', ''),
                        json.dumps(data.get('risks', []))
                    ))
                    conn.commit()

                    print(f"Economic narrative saved successfully for user: {user_id}, date: {date}")
                    return {
                        "status": "success",
                        "message": "거시경제 담론이 저장되었습니다."
                    }

        except Exception as e:
            print(f"PostgreSQL save_economic_narrative error: {e}")
            return {
                "status": "error",
                "message": f"거시경제 담론 저장 중 오류: {str(e)}"
            }

    def get_narrative_history(self, user_id: int, limit: int = 10) -> Dict:
        """과거 담론 히스토리 조회"""
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT date, my_narrative, articles
                        FROM economic_narrative
                        WHERE user_id = %s
                        ORDER BY date DESC
                        LIMIT %s
                    """, (user_id, limit))

                    results = cur.fetchall()

                    history = []
                    for row in results:
                        # articles JSON 파싱
                        articles = row['articles']
                        if isinstance(articles, str):
                            articles = json.loads(articles) if articles else []

                        history.append({
                            'date': row['date'].isoformat() if hasattr(row['date'], 'isoformat') else str(row['date']),
                            'narrative': row['my_narrative'] or '',
                            'articles_count': len(articles),
                            'articles': articles
                        })

                    return {
                        "status": "success",
                        "data": history
                    }

        except Exception as e:
            print(f"PostgreSQL get_narrative_history error: {e}")
            return {
                "status": "error",
                "message": f"담론 히스토리 조회 중 오류: {str(e)}"
            }

    def delete_economic_narrative(self, user_id: int, date: str) -> Dict:
        """거시경제 담론 삭제"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        DELETE FROM economic_narrative
                        WHERE user_id = %s AND date = %s
                    """, (user_id, date))
                    conn.commit()

                    if cur.rowcount == 0:
                        return {
                            "status": "error",
                            "message": "삭제할 담론이 없습니다."
                        }

                    print(f"Economic narrative deleted for user: {user_id}, date: {date}")
                    return {
                        "status": "success",
                        "message": "거시경제 담론이 삭제되었습니다."
                    }

        except Exception as e:
            print(f"PostgreSQL delete_economic_narrative error: {e}")
            return {
                "status": "error",
                "message": f"거시경제 담론 삭제 중 오류: {str(e)}"
            }

    # ========== Page 3: Industries (섹터 & 종목 분석) ==========

    def get_sector_performance(self, user_id: int, date: str) -> Dict:
        """섹터 성과 조회"""
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT sector, performance, relative_strength, notes, created_at, updated_at
                        FROM sector_performance
                        WHERE user_id = %s AND date = %s
                        ORDER BY sector
                    """, (user_id, date))

                    results = cur.fetchall()

                    if results:
                        sectors = []
                        for row in results:
                            sectors.append({
                                'sector': row['sector'],
                                'performance': float(row['performance']) if row['performance'] else None,
                                'relative_strength': float(row['relative_strength']) if row['relative_strength'] else None,
                                'notes': row['notes']
                            })

                        return {
                            "status": "success",
                            "data": sectors
                        }
                    else:
                        return {
                            "status": "success",
                            "data": []
                        }

        except Exception as e:
            print(f"PostgreSQL get_sector_performance error: {e}")
            return {
                "status": "error",
                "message": f"섹터 성과 조회 중 오류: {str(e)}"
            }

    def save_sector_performance(self, user_id: int, date: str, sectors: list) -> Dict:
        """섹터 성과 저장 (UPSERT)"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # 기존 데이터 삭제 후 새로 삽입
                    cur.execute("""
                        DELETE FROM sector_performance
                        WHERE user_id = %s AND date = %s
                    """, (user_id, date))

                    # 새 데이터 삽입
                    for sector_data in sectors:
                        cur.execute("""
                            INSERT INTO sector_performance
                                (user_id, date, sector, performance, relative_strength, notes, updated_at)
                            VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                        """, (
                            user_id,
                            date,
                            sector_data.get('sector'),
                            sector_data.get('performance'),
                            sector_data.get('relative_strength'),
                            sector_data.get('notes', '')
                        ))

                    conn.commit()

                    print(f"Sector performance saved successfully for user: {user_id}, date: {date}")
                    return {
                        "status": "success",
                        "message": "섹터 성과가 저장되었습니다."
                    }

        except Exception as e:
            print(f"PostgreSQL save_sector_performance error: {e}")
            return {
                "status": "error",
                "message": f"섹터 성과 저장 중 오류: {str(e)}"
            }

    def get_watchlist(self, user_id: int) -> Dict:
        """관심 종목 조회"""
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT id, symbol, name, sector, current_price, target_price,
                               notes, alert_enabled, alert_price, created_at, updated_at
                        FROM watchlist
                        WHERE user_id = %s
                        ORDER BY created_at DESC
                    """, (user_id,))

                    results = cur.fetchall()

                    if results:
                        stocks = []
                        for row in results:
                            stocks.append({
                                'id': row['id'],
                                'symbol': row['symbol'],
                                'name': row['name'],
                                'sector': row['sector'],
                                'current_price': float(row['current_price']) if row['current_price'] else None,
                                'target_price': float(row['target_price']) if row['target_price'] else None,
                                'notes': row['notes'],
                                'alert_enabled': row['alert_enabled'],
                                'alert_price': float(row['alert_price']) if row['alert_price'] else None
                            })

                        return {
                            "status": "success",
                            "data": stocks
                        }
                    else:
                        return {
                            "status": "success",
                            "data": []
                        }

        except Exception as e:
            print(f"PostgreSQL get_watchlist error: {e}")
            return {
                "status": "error",
                "message": f"관심 종목 조회 중 오류: {str(e)}"
            }

    def add_watchlist_item(self, user_id: int, data: Dict) -> Dict:
        """관심 종목 추가"""
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        INSERT INTO watchlist
                            (user_id, symbol, name, sector, current_price, target_price,
                             notes, alert_enabled, alert_price, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                        ON CONFLICT (user_id, symbol)
                        DO UPDATE SET
                            name = EXCLUDED.name,
                            sector = EXCLUDED.sector,
                            current_price = EXCLUDED.current_price,
                            target_price = EXCLUDED.target_price,
                            notes = EXCLUDED.notes,
                            alert_enabled = EXCLUDED.alert_enabled,
                            alert_price = EXCLUDED.alert_price,
                            updated_at = CURRENT_TIMESTAMP
                        RETURNING id
                    """, (
                        user_id,
                        data.get('symbol'),
                        data.get('name'),
                        data.get('sector'),
                        data.get('current_price'),
                        data.get('target_price'),
                        data.get('notes', ''),
                        data.get('alert_enabled', False),
                        data.get('alert_price')
                    ))

                    result = cur.fetchone()
                    conn.commit()

                    print(f"Watchlist item added successfully for user: {user_id}, symbol: {data.get('symbol')}")
                    return {
                        "status": "success",
                        "message": "관심 종목이 추가되었습니다.",
                        "id": result['id']
                    }

        except Exception as e:
            print(f"PostgreSQL add_watchlist_item error: {e}")
            return {
                "status": "error",
                "message": f"관심 종목 추가 중 오류: {str(e)}"
            }

    def update_watchlist_item(self, user_id: int, stock_id: int, data: Dict) -> Dict:
        """관심 종목 수정"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        UPDATE watchlist
                        SET name = %s,
                            sector = %s,
                            current_price = %s,
                            target_price = %s,
                            notes = %s,
                            alert_enabled = %s,
                            alert_price = %s,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s AND user_id = %s
                    """, (
                        data.get('name'),
                        data.get('sector'),
                        data.get('current_price'),
                        data.get('target_price'),
                        data.get('notes', ''),
                        data.get('alert_enabled', False),
                        data.get('alert_price'),
                        stock_id,
                        user_id
                    ))

                    conn.commit()

                    print(f"Watchlist item updated successfully: {stock_id}")
                    return {
                        "status": "success",
                        "message": "관심 종목이 수정되었습니다."
                    }

        except Exception as e:
            print(f"PostgreSQL update_watchlist_item error: {e}")
            return {
                "status": "error",
                "message": f"관심 종목 수정 중 오류: {str(e)}"
            }

    def delete_watchlist_item(self, user_id: int, stock_id: int) -> Dict:
        """관심 종목 삭제"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        DELETE FROM watchlist
                        WHERE id = %s AND user_id = %s
                    """, (stock_id, user_id))

                    conn.commit()

                    print(f"Watchlist item deleted successfully: {stock_id}")
                    return {
                        "status": "success",
                        "message": "관심 종목이 삭제되었습니다."
                    }

        except Exception as e:
            print(f"PostgreSQL delete_watchlist_item error: {e}")
            return {
                "status": "error",
                "message": f"관심 종목 삭제 중 오류: {str(e)}"
            }

    # ========================================
    # Cycle Engine Support Methods
    # ========================================

    def get_latest_indicator(self, indicator_id: str) -> Optional[Dict]:
        """
        특정 지표의 최신값 조회 (Cycle Engine용)

        Args:
            indicator_id: 지표 ID (예: 'ism-manufacturing', 'hy-spread')

        Returns:
            {
                'indicator_id': str,
                'actual': str/float,
                'forecast': str/float,
                'previous': str/float,
                'latest_release': str,
                'next_release': str
            } or None
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT
                            indicator_id,
                            actual,
                            forecast,
                            previous,
                            release_date,
                            time
                        FROM latest_releases
                        WHERE indicator_id = %s
                        ORDER BY created_at DESC
                        LIMIT 1
                    """, (indicator_id,))

                    result = cur.fetchone()

                    if result:
                        return dict(result)
                    else:
                        return None

        except Exception as e:
            print(f"PostgreSQL get_latest_indicator error for {indicator_id}: {e}")
            return None

    # ========================================
    # Industry Analysis Methods
    # ========================================

    def get_industry_analysis(self, user_id: int, major_category: str, sub_industry: str) -> Optional[Dict]:
        """
        특정 산업 분석 조회

        Args:
            user_id: 사용자 ID
            major_category: 6대 산업군 (예: '기술·데이터·인프라')
            sub_industry: 하위 산업명 (예: '반도체 & 반도체 장비')

        Returns:
            {
                'id': int,
                'user_id': int,
                'major_category': str,
                'sub_industry': str,
                'analysis_data': dict,
                'leading_stocks': list,
                'emerging_stocks': list,
                'updated_at': str
            } or None
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT *
                        FROM industry_analysis
                        WHERE user_id = %s
                          AND major_category = %s
                          AND sub_industry = %s
                    """, (user_id, major_category, sub_industry))

                    result = cur.fetchone()

                    if result:
                        return dict(result)
                    else:
                        return None

        except Exception as e:
            print(f"PostgreSQL get_industry_analysis error: {e}")
            return None

    def save_industry_analysis(
        self,
        user_id: int,
        major_category: str,
        sub_industry: str,
        analysis_data: dict,
        leading_stocks: list,
        emerging_stocks: list
    ) -> bool:
        """
        산업 분석 저장 (UPSERT)

        Args:
            user_id: 사용자 ID
            major_category: 6대 산업군
            sub_industry: 하위 산업명
            analysis_data: 분석 요소 JSONB 데이터
            leading_stocks: 대표 대형주 배열
            emerging_stocks: 중소형 유망주 배열

        Returns:
            성공 여부 (bool)
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO industry_analysis (
                            user_id,
                            major_category,
                            sub_industry,
                            analysis_data,
                            leading_stocks,
                            emerging_stocks,
                            updated_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                        ON CONFLICT (user_id, major_category, sub_industry)
                        DO UPDATE SET
                            analysis_data = EXCLUDED.analysis_data,
                            leading_stocks = EXCLUDED.leading_stocks,
                            emerging_stocks = EXCLUDED.emerging_stocks,
                            updated_at = CURRENT_TIMESTAMP
                    """, (
                        user_id,
                        major_category,
                        sub_industry,
                        json.dumps(analysis_data),
                        leading_stocks,
                        emerging_stocks
                    ))
                    conn.commit()
                    return True

        except Exception as e:
            print(f"PostgreSQL save_industry_analysis error: {e}")
            return False

    def get_all_industries_by_major(self, user_id: int, major_category: str) -> List[Dict]:
        """
        특정 산업군의 모든 하위 산업 목록 조회

        Args:
            user_id: 사용자 ID
            major_category: 6대 산업군

        Returns:
            [{
                'sub_industry': str,
                'leading_stocks': list,
                'emerging_stocks': list,
                'updated_at': str
            }, ...]
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT
                            sub_industry,
                            leading_stocks,
                            emerging_stocks,
                            updated_at
                        FROM industry_analysis
                        WHERE user_id = %s
                          AND major_category = %s
                        ORDER BY sub_industry ASC
                    """, (user_id, major_category))

                    results = cur.fetchall()
                    return [dict(row) for row in results]

        except Exception as e:
            print(f"PostgreSQL get_all_industries_by_major error: {e}")
            return []

    # ========================================
    # 경제지표 사용자 해석 관련 메서드
    # ========================================

    def get_indicator_interpretation(self, indicator_id: str) -> Optional[str]:
        """
        특정 지표의 사용자 해석 조회

        Args:
            indicator_id: 지표 ID (예: 'ism-manufacturing')

        Returns:
            user_interpretation 문자열 또는 None
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT user_interpretation
                        FROM indicator_interpretations
                        WHERE indicator_id = %s
                    """, (indicator_id,))

                    result = cur.fetchone()
                    if result:
                        return result['user_interpretation']
                    return None

        except Exception as e:
            print(f"PostgreSQL get_indicator_interpretation error: {e}")
            return None

    def save_indicator_interpretation(self, indicator_id: str, user_interpretation: str) -> bool:
        """
        경제지표 사용자 해석 저장 (UPSERT)

        Args:
            indicator_id: 지표 ID
            user_interpretation: 사용자가 작성한 해석

        Returns:
            성공 여부 (bool)
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO indicator_interpretations (
                            indicator_id,
                            user_interpretation,
                            updated_at
                        ) VALUES (%s, %s, CURRENT_TIMESTAMP)
                        ON CONFLICT (indicator_id)
                        DO UPDATE SET
                            user_interpretation = EXCLUDED.user_interpretation,
                            updated_at = CURRENT_TIMESTAMP
                    """, (indicator_id, user_interpretation))
                    conn.commit()
                    return True

        except Exception as e:
            print(f"PostgreSQL save_indicator_interpretation error: {e}")
            return False
