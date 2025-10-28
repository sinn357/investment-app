#!/usr/bin/env python3
import os
import sys
sys.path.append('.')
from services.postgres_database_service import PostgresDatabaseService

def check_rent_type_data():
    try:
        db = PostgresDatabaseService()

        with db.get_connection() as conn:
            with conn.cursor() as cur:
                # 1. 컬럼 존재 여부 확인
                cur.execute("""
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_name = 'assets' AND column_name IN ('rent_type', 'jeonse_deposit')
                    ORDER BY column_name
                """)
                columns = cur.fetchall()
                print("=== 컬럼 정보 ===")
                for col in columns:
                    print(f"Column: {col['column_name']}, Type: {col['data_type']}, Nullable: {col['is_nullable']}, Default: {col['column_default']}")

                # 2. 부동산 자산 데이터 확인
                cur.execute("""
                    SELECT id, name, sub_category, rent_type, rental_income, jeonse_deposit
                    FROM assets
                    WHERE sub_category = 'real-estate' OR sub_category = '부동산'
                    ORDER BY id DESC
                """)
                assets = cur.fetchall()
                print("\n=== 부동산 자산 데이터 ===")
                for asset in assets:
                    print(f"ID: {asset['id']}, Name: {asset['name']}, Sub: {asset['sub_category']}")
                    print(f"  rent_type: {asset['rent_type']}, rental_income: {asset['rental_income']}, jeonse_deposit: {asset['jeonse_deposit']}")

                # 3. 전체 컬럼 목록 확인
                cur.execute("""
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name = 'assets'
                    ORDER BY ordinal_position
                """)
                all_columns = cur.fetchall()
                print("\n=== 전체 assets 테이블 컬럼 ===")
                for col in all_columns:
                    print(f"- {col['column_name']}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_rent_type_data()