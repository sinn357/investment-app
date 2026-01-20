# 다음 세션 작업 목록 (2026-01-21)

## 완료된 작업 ✅ (이번 세션)

### 1. 뉴스담론 레이아웃 세련되게
- **파일**: `frontend/src/components/NewsNarrative.tsx`
- **내용**:
  - 2단 레이아웃 (좌: 담론 작성 / 우: 참고 뉴스)
  - 헤더 영역 분리, 깔끔한 간격
  - 뉴스 목록 스크롤 영역 (max-h-[320px])
  - 삭제 버튼 hover 시 표시
  - 둥근 모서리 (rounded-xl) 적용

### 2. 과거담론리뷰 GlassCard 적용
- **파일**: `frontend/src/components/NarrativeReview.tsx`
- **내용**:
  - GlassCard import 및 적용
  - 로딩 상태 스피너 애니메이션
  - 빈 상태 UI 개선
  - 날짜별 카드 디자인 개선 (아이콘, 둥근 모서리)
  - 버튼 스타일 통일

### 3. 리스크레이더 UI 개선
- **파일**: `frontend/src/components/RiskRadar.tsx`
- **내용**:
  - High 항목 하이라이트 (빨간 테두리, 경고 아이콘)
  - 상단 요약 GlassCard (High 개수, 종합 점수)
  - 각 그룹별 점수 표시
  - 다크모드 색상 지원

### 4. 실행/행동 리스크태그 개선
- **파일**: `frontend/src/components/RiskRadar.tsx`
- **내용**:
  - 추천 태그 버튼 8개 (감정, 판단, 루틴, 피로, 과신, 손실회피, 확증편향, FOMO)
  - 태그별 고유 색상 (TAG_COLORS)
  - 클릭하여 추가/제거 토글
  - 선택된 태그 하단 표시

---

## 남은 작업 목록 📋

### Phase 2: 경제지표 페이지 (남은 1개)
- [ ] **빅웨이브 트래커 입력 개선** (카테고리 자동완성)
  - 파일: `frontend/src/components/BigWaveSection.tsx`
  - 상태: imports와 SUGGESTED_CATEGORIES 상수만 추가됨 (return 부분 미완성)
  - 해야 할 것:
    - 추천 카테고리 버튼 UI 추가
    - GlassCard 적용
    - 카드 목록 디자인 개선

### Phase 3: 가계부 페이지
- [ ] 월별 비교 차트 추가 (연 가계부 리뷰)
  - 백엔드: `/api/expenses/yearly` 엔드포인트 필요
  - 프론트엔드: "월별" 탭 추가, OracleBarChart로 12개월 비교
- [ ] 디자인 다듬기 (스켈레톤 느낌 제거)

### Phase 4: 포트폴리오 페이지
- [ ] 새자산추가 버튼+탭 방식 변경
- [ ] 배치 개선 (대시보드 먼저, 요약→차트→목록 순서)
- [ ] 종목별 색깔 (소분류별 색상 매핑)
- [ ] 하단 메뉴 개선 (빈 상태 가이드)

### Phase 5: 섹터/종목 페이지
- [ ] 기술단계 텍스트박스로 변경
- [ ] 투자촉발요인 섹션 분리 (노란색 테마)
- [ ] 신규진입/대체제 위협 필드 추가 (빨간색 테마)
- [ ] ETF 필드 추가 (청록색 테마)
- [ ] 아이콘 제거, 메뉴버튼 세련되게
- [ ] 레이아웃 단순화

---

## 수정된 파일 (4개)

| 파일 | 변경 내용 |
|------|----------|
| `NewsNarrative.tsx` | 2단 레이아웃, UI 개선 |
| `NarrativeReview.tsx` | GlassCard 적용, 디자인 통일 |
| `RiskRadar.tsx` | High 하이라이트, 요약 점수, 추천 태그 |
| `BigWaveSection.tsx` | imports/상수만 추가 (미완성) |

---

## 다음 세션 시작 방법

```
"경제지표 페이지 Phase 2 마무리. docs/NEXT_SESSION_2026-01-21.md 읽고 진행해줘."
```

빅웨이브 트래커 return 부분 수정 필요 → Phase 3 가계부 페이지로 이동

---

**Last Updated**: 2026-01-21
