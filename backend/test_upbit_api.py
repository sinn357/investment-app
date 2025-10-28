import os
import jwt
import hashlib
import requests
import uuid
from urllib.parse import urlencode, unquote

# API 키 설정
ACCESS_KEY = "Z3mZzfH1Bn61JqqenCyL77tnsvB7jSHQESAAbwN5"
SECRET_KEY = "G1INpa7Ac1ewldqkAJLbG9hyUu2CEZIWFADJ9jc9"

def get_upbit_headers(query_params=None):
    """업비트 API 인증 헤더 생성"""
    payload = {
        'access_key': ACCESS_KEY,
        'nonce': str(uuid.uuid4())
    }

    if query_params:
        query_string = unquote(urlencode(query_params, doseq=True)).encode("utf-8")
        m = hashlib.sha512()
        m.update(query_string)
        query_hash = m.hexdigest()
        payload['query_hash'] = query_hash
        payload['query_hash_alg'] = 'SHA512'

    jwt_token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    return {'Authorization': f'Bearer {jwt_token}'}

# 1. 잔고 조회 테스트
print("=" * 50)
print("1. 잔고 조회")
print("=" * 50)
try:
    url = "https://api.upbit.com/v1/accounts"
    headers = get_upbit_headers()
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        accounts = response.json()
        print(f"보유 자산 개수: {len(accounts)}")
        for acc in accounts[:3]:  # 처음 3개만 출력
            print(f"  - {acc.get('currency')}: {acc.get('balance')} (평단가: {acc.get('avg_buy_price')})")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")

print("\n")

# 2. 종료된 주문 조회 (최근 거래내역)
print("=" * 50)
print("2. 종료된 주문 조회 (최근 100개)")
print("=" * 50)
try:
    url = "https://api.upbit.com/v1/orders"
    params = {
        'state': 'done',  # 종료된 주문
        'limit': 100,
        'order_by': 'desc'  # 최신순
    }
    headers = get_upbit_headers(params)
    response = requests.get(url, params=params, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        orders = response.json()
        print(f"종료된 주문 개수: {len(orders)}")
        for order in orders[:5]:  # 처음 5개만 출력
            print(f"  - {order.get('created_at')}: {order.get('market')} {order.get('side')} {order.get('volume')} @ {order.get('price')}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")

print("\n")

# 3. 전체 마켓 코드 조회
print("=" * 50)
print("3. 마켓 코드 조회")
print("=" * 50)
try:
    url = "https://api.upbit.com/v1/market/all"
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        markets = response.json()
        krw_markets = [m for m in markets if m['market'].startswith('KRW-')]
        print(f"KRW 마켓 개수: {len(krw_markets)}")
        print(f"예시: {krw_markets[:3]}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
