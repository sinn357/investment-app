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
        # 데이터베이스 디렉토리 생성
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)

        # 스키마 파일 읽기 및 실행
        schema_path = "database/schema.sql"
        if os.path.exists(schema_path):
            with open(schema_path, 'r', encoding='utf-8') as f:
                schema_sql = f.read()

            with sqlite3.connect(self.db_path) as conn:
                conn.executescript(schema_sql)
                conn.commit()

    def get_connection(self):
        """데이터베이스 연결 반환"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # 딕셔너리 형태로 결과 반환
        return conn

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
                "timestamp": datetime.now().isoformat()
            }

            return result

    def get_history_data(self, indicator_id: str) -> List[Dict[str, Any]]:
        """히스토리 데이터 조회"""
        with self.get_connection() as conn:
            rows = conn.execute("""
                SELECT release_date, time, actual, forecast, previous
                FROM history_data
                WHERE indicator_id = ?
                ORDER BY release_date DESC
            """, (indicator_id,)).fetchall()

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

    def get_all_indicators(self) -> List[str]:
        """모든 지표 ID 목록 조회"""
        with self.get_connection() as conn:
            rows = conn.execute("SELECT indicator_id FROM indicators").fetchall()
            return [row['indicator_id'] for row in rows]

    def get_crawl_info(self, indicator_id: str) -> Optional[Dict[str, Any]]:
        """크롤링 정보 조회"""
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

    def update_crawl_info(self, indicator_id: str, status: str, data_count: int = 0, error_message: str = None):
        """크롤링 정보 업데이트"""
        with self.get_connection() as conn:
            # 기존 레코드 삭제 후 새로 삽입 (최신 상태만 유지)
            conn.execute("DELETE FROM crawl_info WHERE indicator_id = ?", (indicator_id,))
            conn.execute("""
                INSERT INTO crawl_info
                (indicator_id, status, data_count, error_message)
                VALUES (?, ?, ?, ?)
            """, (indicator_id, status, data_count, error_message))
            conn.commit()

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