from typing import List, Dict, Tuple
from datetime import datetime
from collections import defaultdict


class CryptoTradeAnalyzer:
    """코인 거래 분석기 - 사용자가 원하는 형식으로 분석"""

    @staticmethod
    def group_by_same_time(trades: List[Dict]) -> List[Dict]:
        """같은 시간대 거래를 하나로 합산

        예: 10.03 17:21에 4건의 매도 → 1건으로 합산
        """
        # 날짜+시간으로 그룹화
        grouped = defaultdict(lambda: {
            'volume': 0,
            'total_amount': 0,
            'total_fee': 0,
            'count': 0,
            'date': None,
            'side': None,
            'prices': []
        })

        for trade in trades:
            # 이미 변환된 형식(09.12 20:31)을 그대로 사용
            time_key = trade['date']

            grouped[time_key]['volume'] += trade['volume']
            grouped[time_key]['total_amount'] += trade['total']
            grouped[time_key]['total_fee'] += trade['fee']
            grouped[time_key]['count'] += 1
            grouped[time_key]['date'] = time_key
            grouped[time_key]['side'] = trade.get('side', 'unknown')
            grouped[time_key]['prices'].append(trade['price'])

        # 합산된 결과 생성
        result = []
        for time_key, data in sorted(grouped.items()):
            avg_price = sum(data['prices']) / len(data['prices']) if data['prices'] else 0
            result.append({
                'date': data['date'],
                'volume': data['volume'],
                'price': avg_price,
                'total': data['total_amount'],
                'fee': data['total_fee'],
                'side': data['side'],
                'count': data['count']  # 몇 건이 합쳐졌는지
            })

        return result

    @staticmethod
    def match_buy_sell_rounds(buys: List[Dict], sells: List[Dict]) -> List[Dict]:
        """매수-매도 라운드 매칭 (FIFO)

        Returns:
            [
                {
                    'buys': [{'date': '09.15 13:22', 'price': 390, 'total': 2501250}, ...],
                    'sell': {'date': '10.03 17:21', 'price': 360, 'total': 5007887},
                    'profit': 5387,
                    'profit_rate': 0.11
                }
            ]
        """
        rounds = []
        buy_queue = sorted(buys, key=lambda x: x['date'])
        sell_queue = sorted(sells, key=lambda x: x['date'])

        current_buys = []
        buy_volume_total = 0
        buy_amount_total = 0

        buy_idx = 0
        sell_idx = 0

        while sell_idx < len(sell_queue):
            current_sell = sell_queue[sell_idx]
            sell_volume = current_sell['volume']

            # 매수 물량 채우기
            while buy_volume_total < sell_volume and buy_idx < len(buy_queue):
                buy = buy_queue[buy_idx]
                current_buys.append(buy)
                buy_volume_total += buy['volume']
                buy_amount_total += buy['total']
                buy_idx += 1

            # 라운드 완성
            if buy_volume_total >= sell_volume:
                profit = current_sell['total'] - buy_amount_total
                profit_rate = (profit / buy_amount_total * 100) if buy_amount_total > 0 else 0

                round_data = {
                    'buys': current_buys.copy(),
                    'sell': current_sell,
                    'buy_total': buy_amount_total,
                    'sell_total': current_sell['total'],
                    'profit': profit,
                    'profit_rate': profit_rate
                }
                rounds.append(round_data)

                # 다음 라운드를 위해 초기화
                current_buys = []
                buy_volume_total = 0
                buy_amount_total = 0
                sell_idx += 1
            else:
                # 매수 물량이 부족하면 중단
                break

        return rounds

    @staticmethod
    def format_for_display(coin: str, rounds: List[Dict]) -> str:
        """사용자가 원하는 형식으로 출력

        도지
        09.15 13:22 390원에 2,501,250원 매수
        09.30 10:04 333원에 2,501,250원 매수
        10.03 17:21 360원에 5,007,887원 매도
        5,387원 수익
        """
        lines = [coin]

        for round_data in rounds:
            # 매수 내역
            for buy in round_data['buys']:
                lines.append(
                    f"{buy['date']} {buy['price']:,.0f}원에 {buy['total']:,.0f}원 매수"
                )

            # 매도 내역
            sell = round_data['sell']
            lines.append(
                f"{sell['date']} {sell['price']:,.0f}원에 {sell['total']:,.0f}원 매도"
            )

            # 수익
            profit = round_data['profit']
            lines.append(f"{profit:,.0f}원 수익\n")

        return '\n'.join(lines)


# 테스트 코드
if __name__ == "__main__":
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from upbit_service import UpbitService

    ACCESS_KEY = "Z3mZzfH1Bn61JqqenCyL77tnsvB7jSHQESAAbwN5"
    SECRET_KEY = "G1INpa7Ac1ewldqkAJLbG9hyUu2CEZIWFADJ9jc9"

    # 1. 업비트에서 거래내역 조회
    service = UpbitService(ACCESS_KEY, SECRET_KEY)
    print("거래내역 조회 중...\n")
    orders = service.get_all_trades(max_orders=300)

    # 2. 코인별로 분류
    coin_trades = {}
    for order in orders:
        market = order.get('market', '')
        if not market.startswith('KRW-'):
            continue

        coin = market.replace('KRW-', '')
        side = order.get('side')

        if coin not in coin_trades:
            coin_trades[coin] = {'buys': [], 'sells': []}

        # 날짜 변환
        dt = datetime.fromisoformat(order.get('created_at').replace('+09:00', ''))

        # 거래 금액 계산: executed_funds가 None이면 avg_price * volume으로 계산
        executed_funds = order.get('executed_funds')
        if executed_funds is None:
            volume = float(order.get('executed_volume', 0))
            avg_price = float(order.get('avg_price', 0)) if order.get('avg_price') else 0
            executed_funds = volume * avg_price
        else:
            executed_funds = float(executed_funds)

        paid_fee = float(order.get('paid_fee', 0))

        # 매수: 실제 지불 금액 = 거래금액 + 수수료
        # 매도: 실제 받은 금액 = 거래금액 - 수수료
        if side == 'bid':
            total_amount = executed_funds + paid_fee
        else:
            total_amount = executed_funds - paid_fee

        trade_info = {
            'date': dt.strftime('%m.%d %H:%M'),
            'volume': float(order.get('executed_volume', 0)),
            'price': float(order.get('avg_price', 0)) if order.get('avg_price') else 0,
            'total': total_amount,
            'fee': paid_fee,
            'side': side
        }

        if side == 'bid':
            coin_trades[coin]['buys'].append(trade_info)
        elif side == 'ask':
            coin_trades[coin]['sells'].append(trade_info)

    # 3. 각 코인별 분석
    analyzer = CryptoTradeAnalyzer()

    for coin, trades in coin_trades.items():
        if not trades['buys'] or not trades['sells']:
            continue

        print("=" * 60)
        # 같은 시간대 거래 합산
        buys_grouped = analyzer.group_by_same_time(trades['buys'])
        sells_grouped = analyzer.group_by_same_time(trades['sells'])

        # 라운드 매칭
        rounds = analyzer.match_buy_sell_rounds(buys_grouped, sells_grouped)

        # 출력
        print(analyzer.format_for_display(coin, rounds))
