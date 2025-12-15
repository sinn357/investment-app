# 개별분석 페이지 5개 탭 재설계 - Phase 1 완료 보고

**날짜**: 2025-12-15
**세션 목표**: 4개 탭 → 5개 탭 구조 완전 재설계
**완료 Phase**: Phase 1 - 데이터 인터페이스 재설계

---

## 📋 Phase 1 완료 내용

### ✅ 완료된 작업

#### 1. DeepDiveData 인터페이스 완전 재설계
**파일**: `frontend/src/app/analysis/page.tsx` (Line 34~175)

**기존 구조 (4개 탭)**:
```typescript
interface DeepDiveData {
  fundamental: { investment_reason, potential, basic_info, ... }
  technical: { chart_analysis, quant_analysis, sentiment_analysis }
  summary: { investment_considerations, risk_points, valuation, ... }
  updated_at: string | null
}
```

**새로운 구조 (5개 탭)**:
```typescript
interface DeepDiveData {
  // ① 투자 가설 (Investment Thesis)
  thesis: {
    main_reason: string;
    company_selection: string;
    industry_lifecycle: string;
    market_size: string;
    customer_base: string;
    main_products: string;
    one_line_thesis: string;
    alpha_type: string;
  };

  // ② 검증: 펀더멘털이 맞는가
  validation: {
    basic: { company_overview, business_type, ... }
    competition: { competitor_comparison, ip_patents, ... }
    distribution: { distribution_method, channel_structure, ... }
    financials: { recent_performance, cash_flow, ... }
    hypothesis_breakpoints: string;
  };

  // ③ 가격과 기대치
  pricing: {
    stock_price: number;
    market_cap: string;
    valuation_metrics: { per, pbr, roe, ... }
    market_expectation: string;
    intrinsic_value: string;
    scenarios: { base, bull, bear }
    expectation_gap: string;
  };

  // ④ 타이밍 & 리스크
  timing: {
    technical: { chart_analysis, bollinger_bands, ... }
    quant: { factor_filtering, backtest }
    sentiment: { short_interest, etf_flow, ... }
    external: { macro_variables, news_analysis, ... }
    entry_conditions: string;
    invalidation_signals: string;
  };

  // ⑤ 결정 & 관리
  decision: {
    summary: string;
    considerations: { positive_factors, negative_factors }
    risks: { macro_risk, industry_risk, company_risk }
    invalidation_condition: string;
    scenarios: { summary, sensitivity }
    checklist: { buy, wait }
    mitigation: string;
    target_price: number;
    investment_point: string;
    my_thoughts: string;
    action: 'BUY' | 'WAIT' | 'PASS';
    position_size: string;
    review_conditions: string;
  };

  updated_at: string | null;
}
```

#### 2. createEmptyDeepDive() 함수 업데이트
**위치**: Line 191~310

- 5개 탭 구조에 맞춰 초기값 설정
- 모든 필드 빈 문자열 또는 기본값으로 초기화
- alpha_type 기본값: '성장'
- action 기본값: 'WAIT'

#### 3. AssetAnalysis 인터페이스 간소화
**변경 전**:
```typescript
interface AssetAnalysis {
  myAnalysis: { quantitative, qualitative, decision }
  deepDive: DeepDiveData
  ...
}
```

**변경 후**:
```typescript
interface AssetAnalysis {
  deepDive: DeepDiveData  // myAnalysis 제거, deepDive만 사용
  ...
}
```

#### 4. 카드 리스트 UI 수정
**변경 내용**:
- `item.myAnalysis.decision.action` → `item.deepDive.decision.action`
- `item.myAnalysis.quantitative.valuation.targetPrice` → `item.deepDive.decision.target_price`
- ConvictionDots 컴포넌트 제거 (새 구조에서 미사용)
- 카드에 목표가/현재가 표시로 변경

#### 5. 5개 탭 버튼 추가
**위치**: Line 990~1006

```typescript
<Button onClick={() => setActiveTab('thesis')}>① 투자 가설</Button>
<Button onClick={() => setActiveTab('validation')}>② 검증: 펀더멘털</Button>
<Button onClick={() => setActiveTab('pricing')}>③ 가격과 기대치</Button>
<Button onClick={() => setActiveTab('timing')}>④ 타이밍 & 리스크</Button>
<Button onClick={() => setActiveTab('decision')}>⑤ 결정 & 관리</Button>
```

#### 6. 5개 탭 플레이스홀더 추가
**위치**: Line 1008~1061

각 탭마다 간단한 플레이스홀더 UI 생성:
- 제목 + 핵심 질문 표시
- "🚧 Phase N에서 구현 예정" 안내 메시지
- Phase 2~6에서 각각 구현 예정

---

## ⚠️ 남은 이슈

### 1. 빌드 에러 (우선 해결 필요)
**에러**: `Property 'fundamental' does not exist on type 'DeepDiveData'`

**원인**: 구 탭 코드(fundamental/technical/summary/refs)가 아직 파일에 남아있음
**해결 방법**: Line 353~739 (구 컴포넌트 함수들) 및 Line 1063~1374 (구 탭 렌더링) 완전 제거 필요

**임시 조치**:
- `false &&` 조건 추가로 구 탭 렌더링 방지
- activeTab 타입에 구 탭명 추가 (타입 에러 방지)

### 2. 사용하지 않는 컴포넌트 함수들
**제거 필요** (Line 353~739):
- `basicInfoItems` (배열)
- `BasicInfoAccordion` (370~407)
- `CompetitorComparison` (411~440)
- `FinancialAnalysis` (444~477)
- `ChartAnalysis` (481~504)
- `QuantAnalysis` (508~531)
- `SentimentAnalysis` (535~581)
- `InvestmentConsiderations` (585~628)
- `RiskPoints` (632~675)
- `Valuation` (679~735)

### 3. 구 탭 렌더링 코드
**제거 필요** (Line 1063~1374):
- fundamental 탭 (Line 1064~1134)
- technical 탭 (Line 1136~1176)
- summary 탭 (Line 1178~1248)
- refs 탭 (Line 1250~1374)

---

## 📊 진행 현황

| Phase | 작업 | 상태 | 예상 시간 |
|-------|------|------|-----------|
| **Phase 1** | 데이터 인터페이스 재설계 | ✅ 95% 완료 | 1시간 |
| Phase 2 | 탭 1 - 투자 가설 | 🔜 대기 | 1.5시간 |
| Phase 3 | 탭 2 - 검증: 펀더멘털 | 🔜 대기 | 2시간 |
| Phase 4 | 탭 3 - 가격과 기대치 | 🔜 대기 | 1.5시간 |
| Phase 5 | 탭 4 - 타이밍 & 리스크 | 🔜 대기 | 1.5시간 |
| Phase 6 | 탭 5 - 결정 & 관리 | 🔜 대기 | 2시간 |
| Phase 7 | 백엔드 API (PostgreSQL) | 🔜 대기 | 1시간 |
| Phase 8 | 최종 테스트 및 문서화 | 🔜 대기 | 30분 |

**총 예상 시간**: 11.5시간 (Phase 1 포함)
**완료**: 1시간 (9%)

---

## 🚀 다음 세션 시작 방법

### 세션 시작 시 첫 작업

```bash
# 1. 이 문서 읽기
cat /Users/woocheolshin/Documents/Vibecoding/projects/investment-app/docs/2025-12-15_Analysis_5Tab_Redesign_Phase1.md

# 2. 빌드 에러 해결 (최우선)
# Line 353~739, 1063~1374 제거

# 3. 빌드 테스트
npm --prefix /Users/woocheolshin/Documents/Vibecoding/projects/investment-app/frontend run build
```

### Phase 1 마무리 (15분)

**빠른 수정 방법**:
1. Line 353~739 전체 삭제 (구 컴포넌트 함수들)
2. Line 1063~1374 전체 삭제 (구 탭 렌더링)
3. activeTab 타입에서 'fundamental' | 'technical' | 'summary' | 'refs' 제거
4. `npm run build` 성공 확인

**완료 후**: Phase 2 (투자 가설 탭 구현) 시작

---

## 📝 Phase 2 계획 (다음 세션)

### 투자 가설 탭 UI 구현 (1.5시간)

**구조**:
```
📌 투자 가설 (Investment Thesis)
├─ 원칙 안내 UI (Alert)
│   └─ "👉 디테일 금지. 이 기업이 이길 것 같다는 이야기까지만"
├─ 💡 가장 큰 투자이유 (Textarea, rows: 10)
├─ 🏢 기업 선택사유 (Textarea, rows: 8)
├─ 📈 산업 생애주기 (Textarea, rows: 8)
├─ 🌍 시장 규모 및 수요 (Textarea, rows: 8)
├─ 👥 고객군 (Textarea, rows: 6)
├─ 🎯 주요 제품/서비스 (Textarea, rows: 6)
└─ ✨ 산출물 섹션 (Card)
    ├─ 한 줄 투자 가설 (Input)
    └─ 노리는 알파 종류 (Select: 성장/리레이팅/사이클/이벤트)
```

**핵심 코드**:
```typescript
{activeTab === 'thesis' && (
  <div className="space-y-6">
    <Alert className="bg-primary/5 border-primary/20">
      <p>👉 디테일 금지. 이 기업이 이길 것 같다는 이야기까지만</p>
    </Alert>

    <section>
      <h3>💡 가장 큰 투자이유</h3>
      <Textarea
        value={deepDive.thesis.main_reason}
        onChange={e => updateDeepDive(prev => ({
          ...prev,
          thesis: { ...prev.thesis, main_reason: e.target.value }
        }))}
        rows={10}
        placeholder="이 자산에 투자하는 핵심 이유..."
      />
    </section>

    {/* 나머지 필드들... */}
  </div>
)}
```

---

## 🔑 핵심 변경 사항 요약

1. **인터페이스**: 4개 섹션 → 5개 탭 구조로 완전 재설계
2. **데이터 구조**: myAnalysis 제거, deepDive만 사용
3. **UI**: 5개 탭 버튼 + 플레이스홀더 추가
4. **카드**: deepDive.decision.action/target_price 사용
5. **저장 방식**: LocalStorage → PostgreSQL 마이그레이션 예정 (Phase 7)

---

## 📂 변경된 파일

- `frontend/src/app/analysis/page.tsx` (주요 변경)
  - DeepDiveData 인터페이스 재설계
  - AssetAnalysis 간소화
  - 5개 탭 시스템 추가
  - 카드 리스트 UI 수정

---

## 💡 다음 세션 팁

1. **빌드 에러 먼저 해결**: 구 코드 완전 제거 (15분)
2. **Phase 2 집중**: 투자 가설 탭 하나만 완성 (1.5시간)
3. **저장 테스트**: localStorage에 데이터 저장 확인
4. **점진적 구현**: 한 번에 하나씩 탭 완성하기

---

**작성일**: 2025-12-15
**다음 작업**: Phase 1 마무리 (빌드 에러 해결) → Phase 2 (투자 가설 탭)
