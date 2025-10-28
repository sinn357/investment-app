import os
import jwt
import hashlib
import requests
import uuid
from urllib.parse import urlencode, unquote
from datetime import datetime
from typing import List, Dict, Optional

class UpbitService:
    """업비트 API 서비스"""

    def __init__(self, access_key: str, secret_key: str):
        self.access_key = access_key
        self.secret_key = secret_key
        self.base_url = "https://api.upbit.com/v1"

    def _get_headers(self, query_params: Optional[Dict] = None) -> Dict[str, str]:
        """인증 헤더 생성"""
        payload = {
            'access_key': self.access_key,
            'nonce': str(uuid.uuid4())
        }

        if query_params:
            query_string = unquote(urlencode(query_params, doseq=True)).encode("utf-8")
            m = hashlib.sha512()
            m.update(query_string)
            query_hash = m.hexdigest()
            payload['query_hash'] = query_hash
            payload['query_hash_alg'] = 'SHA512'

        jwt_token = jwt.encode(payload, self.secret_key, algorithm='HS256')
        return {'Authorization': f'Bearer {jwt_token}'}

    def get_accounts(self) -> List[Dict]:
        """잔고 조회"""
        url = f"{self.base_url}/accounts"
        headers = self._get_headers()
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()

    def get_orders(self, state: str = 'done', limit: int = 100, page: int = 1) -> List[Dict]:
        """주문 목록 조회

        Args:
            state: 주문 상태 (wait, watch, done, cancel)
            limit: 개수 제한 (최대 100)
            page: 페이지 수
        """
        url = f"{self.base_url}/orders"
        params = {
            'state': state,
            'limit': limit,
            'page': page,
            'order_by': 'desc'
        }
        headers = self._get_headers(params)
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        return response.json()

    def get_order_detail(self, uuid: str) -> Dict:
        """개별 주문 상세 조회"""
        url = f"{self.base_url}/order"
        params = {'uuid': uuid}
        headers = self._get_headers(params)
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        return response.json()

    def get_all_trades(self, max_orders: int = 500) -> List[Dict]:
        """전체 거래 내역 조회 (페이지네이션)

        업비트 API는 한 번에 100개씩만 조회 가능하므로 페이지네이션 처리
        """
        all_orders = []
        page = 1

        while len(all_orders) < max_orders:
            try:
                orders = self.get_orders(state='done', limit=100, page=page)
                if not orders:
                    break
                all_orders.extend(orders)
                page += 1
                print(f"페이지 {page-1}: {len(orders)}개 주문 조회 완료 (총 {len(all_orders)}개)")
            except Exception as e:
                print(f"페이지 {page} 조회 실패: {e}")
                break

        return all_orders

    def analyze_trades_by_coin(self, orders: List[Dict]) -> Dict:
        """코인별 거래 분석

        Returns:
            {
                'DOGE': {
                    'rounds': [
                        {
                            'buys': [...],
                            'sell': {...},
                            'profit': 5387
                        }
                    ]
                }
            }
        """
        # 코인별로 그룹화
        coin_trades = {}

        for order in orders:
            # KRW-DOGE → DOGE 추출
            market = order.get('market', '')
            if not market.startswith('KRW-'):
                continue

            coin = market.replace('KRW-', '')

            if coin not in coin_trades:
                coin_trades[coin] = {'buys': [], 'sells': []}

            # 매수/매도 분류
            side = order.get('side')  # 'bid' = 매수, 'ask' = 매도
            trade_info = {
                'date': order.get('created_at'),
                'uuid': order.get('uuid'),
                'volume': float(order.get('executed_volume', 0)),  # 체결 수량
                'price': float(order.get('avg_price', 0)) if order.get('avg_price') else 0,  # 평균 체결가
                'total': float(order.get('paid_fee', 0)) + float(order.get('executed_funds', 0)) if side == 'bid' else float(order.get('executed_funds', 0)),  # 총액
                'fee': float(order.get('paid_fee', 0)),  # 수수료
                'state': order.get('state')
            }

            if side == 'bid':
                coin_trades[coin]['buys'].append(trade_info)
            elif side == 'ask':
                coin_trades[coin]['sells'].append(trade_info)

        # 각 코인별로 라운드 매칭 (FIFO)
        results = {}
        for coin, trades in coin_trades.items():
            results[coin] = self._match_rounds(trades['buys'], trades['sells'])

        return results

    def _match_rounds(self, buys: List[Dict], sells: List[Dict]) -> List[Dict]:
        """FIFO 방식으로 매수-매도 라운드 매칭"""
        rounds = []
        buy_queue = sorted(buys, key=lambda x: x['date'])  # 날짜순 정렬
        sell_queue = sorted(sells, key=lambda x: x['date'])

        buy_idx = 0
        sell_idx = 0
        buy_remaining = 0

        while buy_idx < len(buy_queue) and sell_idx < len(sell_queue):
            current_buy = buy_queue[buy_idx]
            current_sell = sell_queue[sell_idx]

            if buy_remaining == 0:
                buy_remaining = current_buy['volume']

            sell_volume = current_sell['volume']

            # 현재 라운드
            if buy_remaining >= sell_volume:
                # 매도 물량이 더 작음 → 라운드 완성
                round_data = {
                    'buys': [current_buy],
                    'sell': current_sell,
                    'buy_total': current_buy['total'],
                    'sell_total': current_sell['total'],
                    'profit': current_sell['total'] - current_buy['total']
                }
                rounds.append(round_data)
                buy_remaining -= sell_volume
                sell_idx += 1

                if buy_remaining == 0:
                    buy_idx += 1
            else:
                # 매수 물량이 더 작음 → 다음 매수 필요
                buy_idx += 1

        return rounds


# 테스트 코드
if __name__ == "__main__":
    ACCESS_KEY = "Z3mZzfH1Bn61JqqenCyL77tnsvB7jSHQESAAbwN5"
    SECRET_KEY = "G1INpa7Ac1ewldqkAJLbG9hyUu2CEZIWFADJ9jc9"

    service = UpbitService(ACCESS_KEY, SECRET_KEY)

    print("=" * 60)
    print("전체 거래 내역 조회 중...")
    print("=" * 60)
    orders = service.get_all_trades(max_orders=200)
    print(f"\n총 {len(orders)}개 주문 조회 완료\n")

    print("=" * 60)
    print("코인별 거래 분석")
    print("=" * 60)
    analysis = service.analyze_trades_by_coin(orders)

    for coin, data in analysis.items():
        if data:
            print(f"\n{coin}:")
            print(f"  총 라운드: {len(data)}개")
            for i, round in enumerate(data[:3], 1):  # 처음 3개만
                print(f"  라운드 {i}:")
                print(f"    매수: {round['buys'][0]['date'][:10]} @ {round['buys'][0]['price']:,.0f}원")
                print(f"    매도: {round['sell']['date'][:10]} @ {round['sell']['price']:,.0f}원")
                print(f"    수익: {round['profit']:,.0f}원")
