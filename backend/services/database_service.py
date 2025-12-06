import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Optional, Any

class DatabaseService:
    """SQLite 데이터베이스 서비스 클래스"""

    def __init__(self, db_path: str = "database/indicators.db"):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """데이터베이스 초기화 및 스키마 생성"""
        try:
            # 데이터베이스 디렉토리 생성
            db_dir = os.path.dirname(self.db_path)
            if db_dir:
                os.makedirs(db_dir, exist_ok=True)

            # 스키마 파일 읽기 및 실행
            schema_path = "database/schema.sql"
            if os.path.exists(schema_path):
                with open(schema_path, 'r', encoding='utf-8') as f:
                    schema_sql = f.read()

                with sqlite3.connect(self.db_path, timeout=30.0) as conn:
                    conn.execute("PRAGMA journal_mode=WAL")
                    conn.executescript(schema_sql)
                    conn.commit()
                    print("Database initialized successfully")
            else:
                print(f"Schema file not found: {schema_path}")
        except Exception as e:
            print(f"Database initialization failed: {e}")
            # 기본 테이블만이라도 생성
            self._create_basic_tables()

    def get_connection(self):
        """데이터베이스 연결 반환"""
        conn = sqlite3.connect(self.db_path, timeout=30.0, check_same_thread=False)
        conn.row_factory = sqlite3.Row  # 딕셔너리 형태로 결과 반환
        # SQLite 설정 최적화
        conn.execute("PRAGMA journal_mode=WAL")  # Write-Ahead Logging 활성화
        conn.execute("PRAGMA synchronous=NORMAL")  # 동기화 수준 조정
        conn.execute("PRAGMA cache_size=1000")  # 캐시 크기 증가
        conn.execute("PRAGMA temp_store=MEMORY")  # 메모리에 임시 데이터 저장
        return conn

    def _create_basic_tables(self):
        """기본 테이블 생성 (스키마 파일이 없을 때 사용)"""
        try:
            with sqlite3.connect(self.db_path, timeout=30.0) as conn:
                conn.execute("PRAGMA journal_mode=WAL")

                # 기본 테이블 생성
                basic_schema = """
                CREATE TABLE IF NOT EXISTS indicators (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    indicator_id TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    url TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS latest_releases (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    indicator_id TEXT NOT NULL,
                    release_date TEXT NOT NULL,
                    time TEXT,
                    actual TEXT,
                    forecast TEXT,
                    previous TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS next_releases (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    indicator_id TEXT NOT NULL,
                    release_date TEXT NOT NULL,
                    time TEXT,
                    forecast TEXT,
                    previous TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS history_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    indicator_id TEXT NOT NULL,
                    release_date TEXT NOT NULL,
                    time TEXT,
                    actual TEXT,
                    forecast TEXT,
                    previous TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS crawl_info (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    indicator_id TEXT NOT NULL,
                    last_crawl_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status TEXT DEFAULT 'success',
                    error_message TEXT,
                    data_count INTEGER DEFAULT 0
                );
                """

                conn.executescript(basic_schema)
                conn.commit()
                print("Basic tables created successfully")
        except Exception as e:
            print(f"Failed to create basic tables: {e}")

    def save_indicator_data(self, indicator_id: str, crawled_data: Dict[str, Any]):
        """크롤링된 데이터를 데이터베이스에 저장"""
        with self.get_connection() as conn:
            try:
                # 기존 데이터 삭제 (최신 데이터로 교체)
                conn.execute("DELETE FROM latest_releases WHERE indicator_id = ?", (indicator_id,))
                conn.execute("DELETE FROM next_releases WHERE indicator_id = ?", (indicator_id,))
                conn.execute("DELETE FROM history_data WHERE indicator_id = ?", (indicator_id,))

                # 최신 릴리즈 데이터 저장
                if 'latest_release' in crawled_data:
                    latest = crawled_data['latest_release']
                    conn.execute("""
                        INSERT INTO latest_releases
                        (indicator_id, release_date, time, actual, forecast, previous)
                        VALUES (?, ?, ?, ?, ?, ?)
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
                    conn.execute("""
                        INSERT INTO next_releases
                        (indicator_id, release_date, time, forecast, previous)
                        VALUES (?, ?, ?, ?, ?)
                    """, (
                        indicator_id,
                        next_rel.get('release_date'),
                        next_rel.get('time'),
                        str(next_rel.get('forecast')) if next_rel.get('forecast') is not None else None,
                        str(next_rel.get('previous')) if next_rel.get('previous') is not None else None
                    ))

                # 히스토리 데이터 저장 (history_table에서)
                if 'history_table' in crawled_data:
                    for row in crawled_data['history_table']:
                        conn.execute("""
                            INSERT INTO history_data
                            (indicator_id, release_date, time, actual, forecast, previous)
                            VALUES (?, ?, ?, ?, ?, ?)
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
                conn.rollback()
                self.update_crawl_info(indicator_id, 'error', 0, str(e))
                raise e

    def get_indicator_data(self, indicator_id: str) -> Dict[str, Any]:
        """지표 데이터 조회 (API 응답 형태로 반환)"""
        try:
            with self.get_connection() as conn:
                # 최신 릴리즈 데이터 조회
                latest_row = conn.execute("""
                    SELECT * FROM latest_releases WHERE indicator_id = ?
                    ORDER BY created_at DESC LIMIT 1
                """, (indicator_id,)).fetchone()

                # 다음 릴리즈 데이터 조회
                next_row = conn.execute("""
                    SELECT * FROM next_releases WHERE indicator_id = ?
                    ORDER BY created_at DESC LIMIT 1
                """, (indicator_id,)).fetchone()

                # 마지막 크롤링 시간 조회
                crawl_row = conn.execute("""
                    SELECT last_crawl_time FROM crawl_info WHERE indicator_id = ?
                    ORDER BY last_crawl_time DESC LIMIT 1
                """, (indicator_id,)).fetchone()

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
                "last_updated": crawl_row['last_crawl_time'] if crawl_row else None,
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
                query = """
                    SELECT release_date, time, actual, forecast, previous
                    FROM history_data
                    WHERE indicator_id = ?
                    ORDER BY release_date DESC
                """
                params = [indicator_id]

                if limit and limit > 0:
                    query += " LIMIT ?"
                    params.append(limit)

                rows = conn.execute(query, tuple(params)).fetchall()

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
                rows = conn.execute("SELECT indicator_id FROM indicators").fetchall()
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
                row = conn.execute("""
                    SELECT * FROM crawl_info
                    WHERE indicator_id = ?
                    ORDER BY last_crawl_time DESC LIMIT 1
                """, (indicator_id,)).fetchone()

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
                # 기존 레코드 삭제 후 새로 삽입 (최신 상태만 유지)
                conn.execute("DELETE FROM crawl_info WHERE indicator_id = ?", (indicator_id,))
                conn.execute("""
                    INSERT INTO crawl_info
                    (indicator_id, status, data_count, error_message)
                    VALUES (?, ?, ?, ?)
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
        """자산 데이터를 SQLite 데이터베이스에 저장"""
        try:
            # SQLite에는 assets 테이블이 없으므로 먼저 생성
            with self.get_connection() as conn:
                # assets 테이블 생성 (없으면)
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS assets (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        asset_type TEXT,
                        name TEXT,
                        amount REAL,
                        quantity REAL,
                        avg_price REAL,
                        eval_amount REAL,
                        date TEXT,
                        note TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)

                # 자산 데이터 삽입
                cursor = conn.execute("""
                    INSERT INTO assets (asset_type, name, amount, quantity, avg_price, eval_amount, date, note)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    asset_data.get('asset_type'),
                    asset_data.get('name'),
                    asset_data.get('amount'),
                    asset_data.get('quantity'),
                    asset_data.get('avg_price'),
                    asset_data.get('eval_amount'),
                    asset_data.get('date'),
                    asset_data.get('note')
                ))

                asset_id = cursor.lastrowid
                conn.commit()

                return {
                    "status": "success",
                    "message": "자산 저장 완료 (SQLite)",
                    "asset_id": asset_id
                }

        except Exception as e:
            print(f"Error saving asset to SQLite: {e}")
            return {
                "status": "error",
                "message": f"자산 저장 실패: {str(e)}"
            }

    def get_all_assets(self) -> Dict[str, Any]:
        """모든 자산 데이터 조회 (포트폴리오 대시보드용) - SQLite"""
        try:
            with self.get_connection() as conn:
                rows = conn.execute("""
                    SELECT id, asset_type, name, amount, quantity, avg_price, eval_amount, date, note, created_at
                    FROM assets
                    ORDER BY created_at DESC
                """).fetchall()

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
                category_summary = {}

                for row in rows:
                    asset = {
                        "id": row['id'],
                        "asset_type": row['asset_type'],
                        "name": row['name'],
                        "amount": float(row['amount']) if row['amount'] else 0,
                        "quantity": float(row['quantity']) if row['quantity'] else None,
                        "avg_price": float(row['avg_price']) if row['avg_price'] else None,
                        "eval_amount": float(row['eval_amount']) if row['eval_amount'] else None,
                        "date": row['date'],
                        "note": row['note'],
                        "created_at": row['created_at'] if row['created_at'] else None
                    }

                    # 손익 계산 (현재는 평가금액 = 매수금액으로 가정)
                    asset["profit_loss"] = 0  # 실시간 시세 연동 시 구현
                    asset["profit_rate"] = 0   # 실시간 시세 연동 시 구현

                    assets.append(asset)
                    total_amount += asset["amount"]

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

                return {
                    "status": "success",
                    "data": assets,
                    "summary": {
                        "total_assets": total_amount,
                        "total_principal": total_amount,  # 실시간 시세 연동 시 구분
                        "total_profit_loss": 0,           # 실시간 시세 연동 시 구현
                        "profit_rate": 0                  # 실시간 시세 연동 시 구현
                    },
                    "by_category": category_summary
                }

        except Exception as e:
            print(f"Error getting all assets from SQLite: {e}")
            return {
                "status": "error",
                "message": f"자산 조회 실패: {str(e)}"
            }
