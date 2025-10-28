import sys
sys.path.insert(0, '/Users/woocheolshin/Documents/Vibecoding_1/investment-app/backend')

from crawlers.leading_indicators import get_leading_indicators

if __name__ == "__main__":
    print("선행지표 테스트 시작...")
    result = get_leading_indicators()

    if "error" in result:
        print(f"❌ 오류: {result['error']}")
    else:
        print("✅ 성공!")
        print(f"Latest Release: {result.get('latest_release', {})}")
        print(f"Next Release: {result.get('next_release', 'N/A')}")
