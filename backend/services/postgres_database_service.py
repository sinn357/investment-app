import psycopg2
import psycopg2.extras
import json
import os
import hashlib
import secrets
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
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );

                    CREATE TABLE IF NOT EXISTS goal_settings (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        total_goal NUMERIC NOT NULL DEFAULT 50000000,
                        target_date DATE NOT NULL DEFAULT '2024-12-31',
                        category_goals JSONB DEFAULT '{}',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(user_id)
                    );

                    -- 기존 테이블에 새 컬럼 추가 (테이블이 이미 존재하는 경우)
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS user_id INTEGER;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS sub_category VARCHAR(50);
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS principal NUMERIC;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS profit_loss NUMERIC DEFAULT 0;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS profit_rate NUMERIC DEFAULT 0;
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

                    -- 기존 assets 데이터에 기본 user_id 설정 (NULL인 경우에만)
                    UPDATE assets SET user_id = 1 WHERE user_id IS NULL;

                    -- 인덱스 생성
                    CREATE INDEX IF NOT EXISTS idx_latest_releases_indicator_id ON latest_releases(indicator_id);
                    CREATE INDEX IF NOT EXISTS idx_next_releases_indicator_id ON next_releases(indicator_id);
                    CREATE INDEX IF NOT EXISTS idx_history_data_indicator_id ON history_data(indicator_id);
                    CREATE INDEX IF NOT EXISTS idx_crawl_info_indicator_id ON crawl_info(indicator_id);
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
                        INSERT INTO assets (user_id, asset_type, sub_category, name, amount, quantity, avg_price, eval_amount, principal, profit_loss, profit_rate, date, note)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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

    def get_all_assets(self, user_id: int = None) -> Dict[str, Any]:
        """사용자별 자산 데이터 조회 (포트폴리오 대시보드용)"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    if user_id:
                        cur.execute("""
                            SELECT id, asset_type, sub_category, name, amount, quantity, avg_price, eval_amount, principal, profit_loss, profit_rate, date, note, created_at
                            FROM assets
                            WHERE user_id = %s
                            ORDER BY created_at DESC
                        """, (user_id,))
                    else:
                        # 하위 호환성을 위해 user_id가 없으면 모든 자산 조회 (기존 동작)
                        cur.execute("""
                            SELECT id, asset_type, sub_category, name, amount, quantity, avg_price, eval_amount, principal, profit_loss, profit_rate, date, note, created_at
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
                                "category_goals": result['category_goals'] or {}
                            }
                        }
                    else:
                        # 기본값 반환
                        return {
                            "status": "success",
                            "data": {
                                "total_goal": 50000000,
                                "target_date": "2024-12-31",
                                "category_goals": {}
                            }
                        }

        except Exception as e:
            print(f"PostgreSQL get_goal_settings error: {e}")
            return {
                "status": "error",
                "message": f"목표 설정 조회 실패: {str(e)}"
            }

    def save_goal_settings(self, user_id: str, total_goal: float, target_date: str, category_goals: Dict) -> Dict[str, Any]:
        """목표 설정을 데이터베이스에 저장"""
        try:
            print(f"PostgreSQL save_goal_settings called for user: {user_id}")
            print(f"Data: total_goal={total_goal}, target_date={target_date}, category_goals={category_goals}")

            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    # UPSERT (INSERT ... ON CONFLICT UPDATE)
                    sql = """
                    INSERT INTO goal_settings (user_id, total_goal, target_date, category_goals, updated_at)
                    VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (user_id)
                    DO UPDATE SET
                        total_goal = EXCLUDED.total_goal,
                        target_date = EXCLUDED.target_date,
                        category_goals = EXCLUDED.category_goals,
                        updated_at = CURRENT_TIMESTAMP
                    """

                    cur.execute(sql, (user_id, total_goal, target_date, json.dumps(category_goals)))
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
        """비밀번호를 해시화"""
        # Salt 생성
        salt = secrets.token_hex(16)
        # 비밀번호와 salt를 결합하여 해시화
        password_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        # salt와 hash를 결합하여 저장
        return salt + ':' + password_hash.hex()

    def _verify_password(self, password: str, password_hash: str) -> bool:
        """비밀번호 검증"""
        try:
            salt, stored_hash = password_hash.split(':')
            password_hash_check = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
            return stored_hash == password_hash_check.hex()
        except:
            return False

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
        """사용자 인증"""
        try:
            user = self.get_user_by_username(username)
            if not user:
                return {
                    "status": "error",
                    "message": "존재하지 않는 사용자명입니다."
                }

            if self._verify_password(password, user['password_hash']):
                return {
                    "status": "success",
                    "message": "로그인 성공",
                    "user_id": user['id'],
                    "username": user['username']
                }
            else:
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
                        "SELECT id, username, created_at FROM users WHERE id = %s",
                        (user_id,)
                    )
                    user = cur.fetchone()
                    return dict(user) if user else None

        except Exception as e:
            print(f"Error getting user by ID: {e}")
            return None