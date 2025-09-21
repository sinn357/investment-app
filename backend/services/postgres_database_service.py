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

                    CREATE TABLE IF NOT EXISTS assets (
                        id SERIAL PRIMARY KEY,
                        asset_type VARCHAR(50),
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
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    -- 기존 테이블에 새 컬럼 추가 (테이블이 이미 존재하는 경우)
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS principal NUMERIC;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS profit_loss NUMERIC DEFAULT 0;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS profit_rate NUMERIC DEFAULT 0;

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

    def save_asset(self, asset_data: Dict[str, Any]) -> Dict[str, Any]:
        """자산 데이터를 데이터베이스에 저장"""
        try:
            print(f"PostgreSQL save_asset called with: {asset_data}")
            with self.get_connection() as conn:
                print("PostgreSQL connection established")
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO assets (asset_type, name, amount, quantity, avg_price, eval_amount, principal, profit_loss, profit_rate, date, note)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """, (
                        asset_data.get('asset_type'),
                        asset_data.get('name'),
                        asset_data.get('amount'),
                        asset_data.get('quantity'),
                        asset_data.get('avg_price'),
                        asset_data.get('eval_amount'),
                        asset_data.get('principal'),
                        asset_data.get('profit_loss', 0),
                        asset_data.get('profit_rate', 0),
                        asset_data.get('date'),
                        asset_data.get('note')
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

    def get_all_assets(self) -> Dict[str, Any]:
        """모든 자산 데이터 조회 (포트폴리오 대시보드용)"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT id, asset_type, name, amount, quantity, avg_price, eval_amount, principal, profit_loss, profit_rate, date, note, created_at
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
                                "total_principal": 0,
                                "total_profit_loss": 0,
                                "profit_rate": 0
                            },
                            "by_category": {}
                        }

                    # 데이터 변환 및 계산
                    assets = []
                    total_amount = 0
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
                            "created_at": row['created_at'].isoformat() if row['created_at'] else None
                        }

                        assets.append(asset)
                        total_amount += asset["amount"]

                        # 원금과 손익 합계 계산
                        total_principal += asset["principal"]
                        total_profit_loss += asset["profit_loss"]

                        # 자산군별 합계
                        category = asset["asset_type"]
                        if category not in category_summary:
                            category_summary[category] = {
                                "total_amount": 0,
                                "count": 0,
                                "percentage": 0
                            }
                        category_summary[category]["total_amount"] += asset["amount"]
                        category_summary[category]["count"] += 1

                    # 자산군별 비중 계산
                    for category in category_summary:
                        if total_amount > 0:
                            category_summary[category]["percentage"] = round(
                                (category_summary[category]["total_amount"] / total_amount) * 100, 2
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

    def delete_asset(self, asset_id: int) -> Dict[str, Any]:
        """자산 데이터를 데이터베이스에서 삭제"""
        try:
            print(f"PostgreSQL delete_asset called with ID: {asset_id}")
            with self.get_connection() as conn:
                print("PostgreSQL connection established for deletion")
                with conn.cursor() as cur:
                    # 먼저 해당 자산이 존재하는지 확인
                    cur.execute("SELECT id, name FROM assets WHERE id = %s", (asset_id,))
                    asset = cur.fetchone()

                    if not asset:
                        return {
                            "status": "error",
                            "message": f"ID {asset_id}인 자산을 찾을 수 없습니다."
                        }

                    asset_name = asset['name']

                    # 자산 삭제
                    cur.execute("DELETE FROM assets WHERE id = %s", (asset_id,))
                    deleted_count = cur.rowcount
                    conn.commit()

                    if deleted_count > 0:
                        print(f"Asset '{asset_name}' (ID: {asset_id}) deleted successfully")
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