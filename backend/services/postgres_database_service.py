import psycopg2
import psycopg2.extras
import json
import os
from datetime import datetime
from typing import List, Dict, Optional, Any
from urllib.parse import urlparse

class PostgresDatabaseService:
    """PostgreSQL 데이터베이스 서비스 클래스"""

    def __init__(self, database_url: str = None):
        self.database_url = database_url or os.getenv('DATABASE_URL')
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is required")

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

                    -- 인덱스 생성
                    CREATE INDEX IF NOT EXISTS idx_latest_releases_indicator_id ON latest_releases(indicator_id);
                    CREATE INDEX IF NOT EXISTS idx_next_releases_indicator_id ON next_releases(indicator_id);
                    CREATE INDEX IF NOT EXISTS idx_history_data_indicator_id ON history_data(indicator_id);
                    CREATE INDEX IF NOT EXISTS idx_crawl_info_indicator_id ON crawl_info(indicator_id);
                    """

                    cur.execute(schema_sql)
                    conn.commit()
                    print("PostgreSQL database initialized successfully")
        except Exception as e:
            print(f"Database initialization failed: {e}")
            raise e

    def get_connection(self):
        """데이터베이스 연결 반환"""
        try:
            conn = psycopg2.connect(
                self.database_url,
                cursor_factory=psycopg2.extras.RealDictCursor,
                connect_timeout=10
            )
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
                    if 'next_release' in crawled_data:
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
                    "last_updated": crawl_row['last_crawl_time'].isoformat() if crawl_row else None,
                    "timestamp": datetime.now().isoformat()
                }

                return result

        except Exception as e:
            print(f"Error getting indicator data for {indicator_id}: {e}")
            return {"error": f"Database error: {str(e)}"}

    def get_history_data(self, indicator_id: str) -> List[Dict[str, Any]]:
        """히스토리 데이터 조회"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT release_date, time, actual, forecast, previous
                        FROM history_data
                        WHERE indicator_id = %s
                        ORDER BY release_date DESC
                    """, (indicator_id,))
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