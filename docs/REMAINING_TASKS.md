# 남은 작업 목록 (Remaining Tasks)

> **작성일**: 2025-12-29
> **상태**: Oracle 2025 디자인 업그레이드 Phase 완료 후 남은 작업
> **우선순위**: 높음(⭐⭐⭐) / 중간(⭐⭐) / 낮음(⭐)

---

## 📊 완료된 페이지 (6개)

✅ **홈페이지** - 파티클 배경, 글래스모피즘, 애니메이션 시스템
✅ **투자철학** - 아이콘 배지, 섹션별 색상, shimmer 효과
✅ **포트폴리오** - GlassCard, 애니메이션, 차트 개선
✅ **가계부** - 게이지 시스템, 색상 테마, 반응형
✅ **섹터/종목** - 6대 산업군 탭, 8개 분석 섹션, 순차 애니메이션
✅ **경제지표** - LIVE 배지, GlassCard 통합, 골드-에메랄드 필터

---

## 🎯 남은 페이지 업그레이드 (3개)

### 1. 개별분석 페이지 Oracle 2025 업그레이드 ⭐⭐⭐

**현재 상태**: "가장 낫지만 어설픔", 26,179 tokens (매우 큼)

**작업 내용**:
- [ ] 상단 요약 카드 3열 그리드 (종목 정보, 주요 지표, 투자의견)
- [ ] 분석 섹션 탭 시스템 (재무분석, 밸류에이션, 리스크, 투자포인트)
- [ ] 차트 강화 (그라디언트 영역 차트, 3D 효과)
- [ ] 인쇄 최적화 (프로페셔널 리포트 레이아웃)
- [ ] GlassCard 적용 (전체 섹션 통일)

**예상 시간**: 2-3시간

**기술 스택**:
- GlassCard 컴포넌트
- Recharts V2 테마
- 반응형 그리드 시스템

---

### 2. 계정설정 페이지 Oracle 2025 업그레이드 ⭐⭐

**현재 상태**: "기능적으로 단순해서 좋음", 디자인 약간 개선 필요

**작업 내용**:
- [ ] 프로필 카드 홀로그램 효과
  - 프로필 이미지에 회전하는 빛 링
  - 골드-에메랄드 그라디언트 테두리
  - 회원 등급 뱃지 (⭐ Premium Member)

- [ ] 토글 스위치 애니메이션
  - 활성화 시 골드-에메랄드 그라디언트
  - 부드러운 슬라이드 전환 애니메이션

- [ ] 저장 성공 시 Confetti 효과
  - react-confetti 패키지 사용
  - 골드/에메랄드/옐로우 색상

**예상 시간**: 1-2시간

**패키지 추가 필요**:
```bash
npm install react-confetti
```

---

### 3. 암호화폐거래 페이지 개발 ⭐

**현재 상태**: 미개발 (선택적)

**작업 내용**:
- [ ] 실시간 암호화폐 가격 대시보드
- [ ] 거래 기록 관리
- [ ] 수익률 계산 및 차트
- [ ] Oracle 2025 디자인 적용

**예상 시간**: 4-5시간 (선택적)

**기술 스택**:
- CoinGecko API 또는 Binance API
- WebSocket 실시간 가격 업데이트
- GlassCard + 차트 시스템

---

## 📦 새로운 기능 추가 (2개)

### 4. 엑셀 파일 추출 기능 ⭐⭐⭐

**목적**: 포트폴리오와 가계부 데이터를 Excel 파일로 다운로드

**작업 내용**:

#### 4.1 포트폴리오 엑셀 추출
- [ ] **백엔드 API**: `/api/portfolio/export/excel`
  - 사용자별 전체 자산 데이터 조회
  - Excel 파일 생성 (openpyxl 또는 xlsxwriter)
  - 파일명: `portfolio_YYYYMMDD_HHMMSS.xlsx`

- [ ] **Excel 구조**:
  ```
  Sheet 1: 자산 목록
    - 대분류, 소분류, 자산명, 수량, 평균가, 원금, 평가금액, 수익률, 등록일

  Sheet 2: 자산군별 요약
    - 자산군, 총액, 비중(%), 수익률, 개수

  Sheet 3: 목표 달성 현황
    - 전체 목표, 현재 금액, 달성률, D-Day
  ```

- [ ] **프론트엔드 버튼**:
  - 포트폴리오 대시보드 우측 상단에 "📊 Excel 다운로드" 버튼 추가
  - EnhancedButton (secondary variant, shimmer 효과)
  - 다운로드 진행 중 로딩 상태 표시

#### 4.2 가계부 엑셀 추출
- [ ] **백엔드 API**: `/api/expenses/export/excel`
  - 선택한 연도/월의 거래내역 조회
  - Excel 파일 생성
  - 파일명: `expenses_YYYY_MM.xlsx`

- [ ] **Excel 구조**:
  ```
  Sheet 1: 거래내역
    - 날짜, 대분류, 소분류, 거래처, 금액, 메모

  Sheet 2: 카테고리별 요약
    - 대분류, 소분류, 총액, 건수, 비중(%)

  Sheet 3: 월간 요약
    - 총 지출, 총 수입, 순자산 변화
    - 예산 대비 실적 (목표 게이지 데이터)
  ```

- [ ] **프론트엔드 버튼**:
  - 가계부 대시보드 우측 상단에 "📊 Excel 다운로드" 버튼 추가
  - 연도/월 필터와 연동

**예상 시간**: 3-4시간

**기술 스택**:
- **백엔드 (Python)**:
  - `openpyxl` 또는 `xlsxwriter` (Excel 생성)
  - Flask send_file (파일 다운로드)

- **프론트엔드**:
  - fetch API로 파일 다운로드
  - Blob + URL.createObjectURL

**패키지 설치**:
```bash
# 백엔드
pip install openpyxl
# 또는
pip install xlsxwriter
```

**구현 예시 (백엔드)**:
```python
from openpyxl import Workbook
from flask import send_file
import io
from datetime import datetime

@app.route('/api/portfolio/export/excel', methods=['GET'])
def export_portfolio_excel():
    user_id = request.args.get('user_id')

    # 데이터 조회
    assets = db_service.get_all_assets(user_id)

    # Excel 생성
    wb = Workbook()
    ws1 = wb.active
    ws1.title = "자산 목록"

    # 헤더
    ws1.append(['대분류', '소분류', '자산명', '수량', '평균가', '원금', '평가금액', '수익률', '등록일'])

    # 데이터
    for asset in assets:
        ws1.append([
            asset['asset_type'],
            asset['sub_category'],
            asset['name'],
            asset['quantity'],
            asset['avg_price'],
            asset['principal'],
            asset['eval_amount'],
            f"{asset['profit_rate']}%",
            asset['date']
        ])

    # 파일 저장
    filename = f"portfolio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    return send_file(
        buffer,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    )
```

**구현 예시 (프론트엔드)**:
```typescript
const handleExportExcel = async () => {
  try {
    setExporting(true);
    const response = await fetch(
      `${API_BASE_URL}/api/portfolio/export/excel?user_id=${userId}`
    );

    if (!response.ok) throw new Error('Excel 생성 실패');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio_${new Date().toISOString().slice(0,10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Excel 파일이 다운로드되었습니다!');
  } catch (error) {
    toast.error('Excel 다운로드 실패');
  } finally {
    setExporting(false);
  }
};
```

---

### 5. 모바일 반응형 디자인 개선 ⭐⭐⭐

**목적**: 모바일 환경에서 더 나은 사용자 경험 제공

**작업 내용**:

#### 5.1 전체 공통 개선
- [ ] **Navigation 메뉴 모바일 최적화**
  - 햄버거 메뉴 (☰) 추가
  - 슬라이드 사이드바 네비게이션
  - 메뉴 닫기 제스처 지원

- [ ] **터치 제스처 지원**
  - 스와이프로 차트 전환
  - 롱프레스로 상세 정보 표시
  - 핀치 줌으로 차트 확대/축소

- [ ] **폰트 크기 최적화**
  - 제목: text-2xl → text-xl (모바일)
  - 본문: text-base → text-sm (모바일)
  - 버튼: py-3 → py-2 (모바일)

#### 5.2 페이지별 개선

**포트폴리오 페이지**:
- [ ] 테이블 → 카드형 레이아웃 (모바일)
- [ ] 가로 스크롤 차트
- [ ] 요약 카드 세로 스택 (4열 → 2열)
- [ ] 필터/정렬 버튼 아코디언 메뉴

**가계부 페이지**:
- [ ] 거래내역 입력 폼 세로 스택
- [ ] 차트 터치 인터랙션 개선
- [ ] 날짜 필터 바텀시트

**경제지표 페이지**:
- [ ] 카테고리 필터 가로 스크롤
- [ ] 지표 그리드 2열 → 1열 (모바일)
- [ ] Health Check 요약 카드 세로 스택

**섹터/종목 페이지**:
- [ ] 6대 산업군 탭 가로 스크롤
- [ ] 소분류 사이드바 → 상단 드롭다운
- [ ] 분석 폼 필드 세로 스택

#### 5.3 성능 최적화
- [ ] **이미지 레이지 로딩**
- [ ] **차트 데이터 페이지네이션** (모바일에서 100개 → 20개씩)
- [ ] **Virtual Scrolling** (긴 리스트)
- [ ] **PWA 지원** (오프라인 캐싱)

**예상 시간**: 4-5시간

**기술 스택**:
- Tailwind CSS 반응형 브레이크포인트 (sm, md, lg, xl)
- react-swipeable (스와이프 제스처)
- react-window (Virtual Scrolling)
- Next.js PWA (선택적)

**반응형 브레이크포인트 전략**:
```tsx
// 모바일 우선 (Mobile First)
<div className="
  px-4 py-2                    // 모바일 (기본)
  sm:px-6 sm:py-3              // 640px+
  md:px-8 md:py-4              // 768px+
  lg:px-12 lg:py-6             // 1024px+
  xl:px-16 xl:py-8             // 1280px+
">

// 그리드 시스템
<div className="
  grid grid-cols-1             // 모바일: 1열
  sm:grid-cols-2               // 640px+: 2열
  md:grid-cols-3               // 768px+: 3열
  lg:grid-cols-4               // 1024px+: 4열
">

// 조건부 표시
<div className="
  hidden                       // 모바일: 숨김
  md:block                     // 768px+: 표시
">

<div className="
  block                        // 모바일: 표시
  md:hidden                    // 768px+: 숨김
">
```

---

## 📅 우선순위별 작업 순서

### 🔴 최우선 (즉시 작업)
1. **엑셀 파일 추출 기능** (포트폴리오 + 가계부)
2. **모바일 반응형 개선** (전체 페이지)

### 🟡 중간 우선순위 (여유 있을 때)
3. **개별분석 페이지** Oracle 업그레이드
4. **계정설정 페이지** Oracle 업그레이드

### 🟢 낮은 우선순위 (선택적)
5. **암호화폐거래 페이지** 개발 (완전히 새로운 기능)

---

## 📊 예상 총 작업 시간

| 작업 | 시간 | 우선순위 |
|------|------|----------|
| 엑셀 파일 추출 | 3-4h | ⭐⭐⭐ |
| 모바일 반응형 개선 | 4-5h | ⭐⭐⭐ |
| 개별분석 페이지 | 2-3h | ⭐⭐ |
| 계정설정 페이지 | 1-2h | ⭐⭐ |
| 암호화폐거래 페이지 | 4-5h | ⭐ |
| **합계** | **14-19h** | |

---

## 🛠️ 구현 가이드

### 엑셀 파일 추출 구현 순서
1. 백엔드 openpyxl 패키지 설치
2. `/api/portfolio/export/excel` 엔드포인트 구현
3. `/api/expenses/export/excel` 엔드포인트 구현
4. 프론트엔드 다운로드 버튼 추가
5. 로딩 상태 + 에러 핸들링
6. 테스트 (다양한 데이터 케이스)

### 모바일 반응형 개선 구현 순서
1. Navigation 햄버거 메뉴 구현
2. 각 페이지별 모바일 레이아웃 수정
   - 포트폴리오 (카드형)
   - 가계부 (세로 스택)
   - 경제지표 (1열 그리드)
   - 섹터/종목 (드롭다운)
3. 터치 제스처 추가
4. 폰트/간격 최적화
5. 테스트 (실제 모바일 기기)

---

## 📝 참고 문서

- **Oracle 2025 디자인 마스터플랜**: `docs/ORACLE_2025_DESIGN_UPGRADE.md`
- **프로젝트 컨텍스트**: `CLAUDE.md`
- **테마 시스템**: `frontend/src/styles/theme.ts`
- **GlassCard 컴포넌트**: `frontend/src/components/GlassCard.tsx`
- **EnhancedButton 컴포넌트**: `frontend/src/components/EnhancedButton.tsx`

---

**문서 버전**: 1.0
**최종 업데이트**: 2025-12-29
**작성자**: Claude Code Assistant
**다음 세션 시작 방법**: 이 문서를 읽고 우선순위가 가장 높은 작업부터 시작
