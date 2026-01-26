# 다음 세션 작업 목록 (2026-01-20)

## 완료된 작업 ✅

### 1. 도넛차트 라벨 오버플로우 수정
- **파일**: `frontend/src/components/charts/OraclePieChart.tsx`
- **내용**: 5% 미만 섹터 라벨 숨김 + 바깥쪽 배치
- **커스텀 라벨 렌더러**: `renderCustomLabel` 함수 추가

### 2. 경제지표 페이지 - 모든 섹션 접기 기능
- **파일**: `frontend/src/app/indicators/page.tsx`
- **내용**:
  - 6개 섹션별 접기/펼치기: Master Cycle, Health Check, 경제지표, 뉴스담론, 리스크레이더, 빅웨이브
  - `collapsedSections` 상태 객체로 관리
  - 전체 접기/펼치기 버튼 추가

### 3. 가계부 - 카드대금 제외 토글
- **파일**: `frontend/src/components/ExpenseManagementDashboard.tsx`
- **내용**:
  - `excludeCardPayment` 상태 추가
  - `expenseSummary` useMemo에서 카드대금 제외 계산
  - 토글 UI 추가

---

## 남은 작업 목록 📋

### Phase 2: 경제지표 페이지 (추가 개선)
- [ ] 뉴스담론 레이아웃 세련되게
- [ ] 과거담론리뷰 GlassCard 적용으로 통일
- [ ] 리스크레이더 UI 개선 (High 항목 하이라이트, 요약 점수)
- [ ] 실행/행동 리스크태그 개선 (추천 태그 버튼, 색상 구분)
- [ ] 빅웨이브 트래커 입력 개선 (카테고리 자동완성)

### Phase 3: 가계부 페이지
- [ ] 월별 비교 차트 추가 (연 가계부 리뷰)
  - 백엔드: `/api/expenses/yearly` 엔드포인트 필요
  - 프론트엔드: "월별" 탭 추가, OracleBarChart로 12개월 비교
- [ ] 디자인 다듬기 (스켈레톤 느낌 제거)

### Phase 4: 포트폴리오 페이지
- [ ] 새자산추가 버튼+탭 방식 변경
  - 현재: EnhancedPortfolioForm 접기/펼치기
  - 목표: "+ 자산 추가" 버튼 → 슬라이드 패널 + 4개 대분류 탭
- [ ] 배치 개선 (대시보드 먼저, 요약→차트→목록 순서)
- [ ] 종목별 색깔 (소분류별 색상 매핑)
- [ ] 하단 메뉴 개선 (빈 상태 가이드, 플레이스홀더)

### Phase 5: 섹터/종목 페이지
- [ ] 기술단계 텍스트박스로 변경 (Select → Input)
- [ ] 투자촉발요인 섹션 분리 (큰 Textarea, 노란색 테마)
- [ ] 신규진입/대체제 위협 필드 추가 (GlassCard, 빨간색 테마)
- [ ] ETF 필드 추가 (청록색 테마)
- [ ] 아이콘 제거, 메뉴버튼 세련되게
- [ ] 레이아웃 단순화

---

## 주요 파일 경로

| 페이지 | 파일 경로 |
|--------|----------|
| 경제지표 | `frontend/src/app/indicators/page.tsx` |
| 가계부 | `frontend/src/components/ExpenseManagementDashboard.tsx` |
| 포트폴리오 | `frontend/src/app/portfolio/page.tsx`, `PortfolioDashboard.tsx` |
| 섹터/종목 | `frontend/src/app/industries/page.tsx` |

---

## 커밋 정보

- **커밋 해시**: c502885
- **브랜치**: main
- **푸시 완료**: origin/main

---

**Last Updated**: 2026-01-20
