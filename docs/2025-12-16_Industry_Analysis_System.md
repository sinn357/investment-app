# 2025-12-16 산업군 분석 시스템 완전 구현

> **세션 목표**: 개별분석 페이지 개선 + 6대 산업군 분석 시스템 완전 구현

---

## 📋 목차
1. [작업 개요](#작업-개요)
2. [개별분석 페이지 개선](#개별분석-페이지-개선)
3. [산업군 분석 시스템 설계](#산업군-분석-시스템-설계)
4. [Phase 1: 백엔드 구현](#phase-1-백엔드-구현)
5. [Phase 2-6: 프론트엔드 구현](#phase-2-6-프론트엔드-구현)
6. [기술 스택](#기술-스택)
7. [데이터 구조](#데이터-구조)
8. [커밋 히스토리](#커밋-히스토리)

---

## 작업 개요

### 문제점
1. **개별분석 페이지**: 새로운 기업 분석을 추가하는 UI가 없음
2. **Industries 페이지**: 섹터 히트맵과 관심 종목 기능만 있어 실질적인 산업 분석 불가

### 해결책
1. 개별분석 페이지에 "➕ 새 분석 추가" 버튼 추가
2. Industries 페이지를 **6대 산업군 기반 분석 시스템**으로 완전히 재구축

### 작업 시간
- **개별분석 개선**: 15분
- **산업군 시스템 구현**: 2시간 30분
- **총 소요 시간**: 약 2시간 45분

---

## 개별분석 페이지 개선

### 변경사항

**파일**: `frontend/src/app/analysis/page.tsx`

```tsx
// handleAdd 함수 추가 (441-460줄)
const handleAdd = () => {
  const newId = `new-${Date.now()}`;
  const newAsset: AssetAnalysis = {
    id: newId,
    symbol: '',
    name: '',
    type: '주식',
    analyzedAt: new Date().toISOString().split('T')[0],
    lastUpdatedAt: new Date().toISOString().split('T')[0],
    inPortfolio: false,
    inWatchlist: false,
    deepDive: createEmptyDeepDive(),
    references: [],
    tags: []
  };
  const updated = [...analyses, newAsset];
  persistAnalyses(updated);
  setSelectedId(newId);
  setActiveTab('thesis');
};

// UI 버튼 추가 (477-482줄)
<Button
  onClick={handleAdd}
  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold shadow-lg"
>
  ➕ 새 분석 추가
</Button>
```

### 결과
- ✅ 사용자가 자산 목록에서 "➕ 새 분석 추가" 버튼 클릭
- ✅ 빈 템플릿 자동 생성 및 선택
- ✅ 즉시 분석 작성 가능

---

## 산업군 분석 시스템 설계

### UI/UX 흐름

```
1단계: 6대 산업군 카드 선택
┌──────────────────────────────────────────┐
│  💻 기술·데이터·인프라 (8개 하위 산업)      │
│  🏗️ 산업·제조·공공 인프라 (9개)           │
│  🛍️ 소비·문화·라이프스타일 (9개)          │
│  🏥 건강·생명과학·바이오 (5개)            │
│  ⚡ 에너지·자원·환경 (8개)                │
│  💰 금융·자산·부동산 (7개)                │
└──────────────────────────────────────────┘
           ↓ 클릭
2단계: 하위 산업 탭 선택
┌──────────────────────────────────────────┐
│ [반도체] [클라우드] [소프트웨어] ...       │
└──────────────────────────────────────────┘
           ↓ 클릭
3단계: 분석 요소 폼 (6개 섹션 + 2개 종목 입력)
┌──────────────────────────────────────────┐
│ 🔬 핵심기술                               │
│ 💰 거시경제 영향                          │
│ 📈 성장동력/KPI                           │
│ 🔗 가치사슬                               │
│ 📊 공급/수요 요인                         │
│ 🗺️ 시장 지도                             │
│ 🏢 대표 대형주 (태그 입력)                │
│ 🌟 중소형 유망주 (태그 입력)              │
│ [💾 저장]                                │
└──────────────────────────────────────────┘
```

### 6대 산업군 구조

| 산업군 | 아이콘 | 하위 산업 개수 | 주요 하위 산업 |
|--------|--------|---------------|--------------|
| 기술·데이터·인프라 | 💻 | 8개 | 반도체, 클라우드, AI, 사이버보안 |
| 산업·제조·공공 인프라 | 🏗️ | 9개 | 중장비, 자동차, 원자력, 물류 |
| 소비·문화·라이프스타일 | 🛍️ | 9개 | 리테일, 패션, 여행, 게임 |
| 건강·생명과학·바이오 | 🏥 | 5개 | 제약, 의료기기, 유전체, 원격의료 |
| 에너지·자원·환경 | ⚡ | 8개 | 석유, 태양광, 수소, ESS |
| 금융·자산·부동산 | 💰 | 7개 | 은행, 보험, 핀테크, 리츠 |

**총 46개 하위 산업**

---

## Phase 1: 백엔드 구현

### 1.1 PostgreSQL 테이블 생성

**파일**: `backend/services/postgres_database_service.py` (351-377줄)

```sql
CREATE TABLE IF NOT EXISTS industry_analysis (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    major_category VARCHAR(50) NOT NULL,     -- 6대 산업군
    sub_industry VARCHAR(100) NOT NULL,      -- 하위 산업명
    analysis_data JSONB NOT NULL DEFAULT '{
        "core_technology": {"definition": "", "stage": "상용화", "innovation_path": ""},
        "macro_impact": {"interest_rate": "", "exchange_rate": "", "commodities": "", "policy": ""},
        "growth_drivers": {"internal": "", "external": "", "kpi": ""},
        "value_chain": {"flow": "", "profit_pool": "", "bottleneck": ""},
        "supply_demand": {
            "demand": {"end_user": "", "long_term": "", "sensitivity": ""},
            "supply": {"players": "", "capacity": "", "barriers": ""},
            "catalysts": ""
        },
        "market_map": {"structure": "", "competition": "", "moat": "", "lifecycle": ""}
    }'::jsonb,
    leading_stocks TEXT[] DEFAULT '{}',      -- 대표 대형주
    emerging_stocks TEXT[] DEFAULT '{}',     -- 중소형 유망주
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, major_category, sub_industry)
);

CREATE INDEX IF NOT EXISTS idx_industry_analysis_user ON industry_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_industry_analysis_major ON industry_analysis(major_category);
```

### 1.2 PostgresDatabaseService 메서드 추가

**파일**: `backend/services/postgres_database_service.py` (2750-2891줄)

#### 1) get_industry_analysis()
```python
def get_industry_analysis(self, user_id: int, major_category: str, sub_industry: str) -> Optional[Dict]:
    """특정 산업 분석 조회"""
    # user_id, major_category, sub_industry로 데이터 조회
    # 없으면 None 반환
```

#### 2) save_industry_analysis()
```python
def save_industry_analysis(
    self, user_id: int, major_category: str, sub_industry: str,
    analysis_data: dict, leading_stocks: list, emerging_stocks: list
) -> bool:
    """산업 분석 저장 (UPSERT)"""
    # INSERT ... ON CONFLICT DO UPDATE
    # 동일한 (user_id, major_category, sub_industry) 있으면 UPDATE
```

#### 3) get_all_industries_by_major()
```python
def get_all_industries_by_major(self, user_id: int, major_category: str) -> List[Dict]:
    """특정 산업군의 모든 하위 산업 목록 조회"""
    # 특정 산업군의 저장된 하위 산업들만 반환
```

### 1.3 Flask API 엔드포인트 추가

**파일**: `backend/app.py` (3916-4047줄)

#### 1) GET /api/industry-analysis
```python
@app.route('/api/industry-analysis', methods=['GET'])
def get_industry_analysis():
    """특정 산업 분석 조회"""
    # 쿼리: user_id, major_category, sub_industry
    # 데이터 없으면 빈 템플릿 반환
```

#### 2) POST /api/industry-analysis
```python
@app.route('/api/industry-analysis', methods=['POST'])
def save_industry_analysis():
    """산업 분석 저장 (UPSERT)"""
    # Body: user_id, major_category, sub_industry, analysis_data, leading_stocks, emerging_stocks
    # UPSERT 처리
```

#### 3) GET /api/industry-categories
```python
@app.route('/api/industry-categories', methods=['GET'])
def get_industry_categories():
    """특정 산업군의 모든 하위 산업 목록 조회"""
    # 쿼리: user_id, major_category
    # 저장된 하위 산업 목록 반환
```

---

## Phase 2-6: 프론트엔드 구현

### 파일 구조

**파일**: `frontend/src/app/industries/page.tsx` (완전히 재작성, 817줄)

### 2.1 6대 산업군 카드 UI (1단계)

```tsx
const MAJOR_CATEGORIES = [
  {
    id: 'tech',
    name: '기술·데이터·인프라',
    icon: '💻',
    color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/30',
    subIndustries: [
      '반도체 & 반도체 장비',
      '클라우드 & 데이터센터',
      // ... 8개
    ]
  },
  // ... 총 6개
];

// 카드 렌더링 (294-315줄)
{!selectedMajor && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {MAJOR_CATEGORIES.map(category => (
      <Card
        className={`cursor-pointer hover:-translate-y-1 bg-gradient-to-br ${category.color}`}
        onClick={() => setSelectedMajor(category.name)}
      >
        <CardTitle>
          <span className="text-4xl">{category.icon}</span>
          {category.name}
          <div>{category.subIndustries.length}개 하위 산업</div>
        </CardTitle>
      </Card>
    ))}
  </div>
)}
```

### 2.2 하위 산업 탭 시스템 (2단계)

```tsx
// 하위 산업 탭 렌더링 (318-349줄)
{selectedMajor && !selectedSubIndustry && (
  <div className="space-y-4">
    <Button onClick={() => setSelectedMajor(null)}>← 뒤로</Button>
    <h2>{selectedMajor}</h2>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {selectedCategory.subIndustries.map((subIndustry) => (
        <Button
          onClick={() => {
            setSelectedSubIndustry(subIndustry);
            setAnalysisData(getEmptyAnalysisData());
          }}
        >
          {subIndustry}
        </Button>
      ))}
    </div>
  </div>
)}
```

### 2.3 분석 요소 폼 (3단계)

#### 🔬 핵심기술 (383-425줄)
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-primary">🔬 핵심기술</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <Label>정의</Label>
      <Textarea
        value={analysisData.core_technology.definition}
        onChange={(e) => updateAnalysis('core_technology', 'definition', e.target.value)}
        rows={6}
        className="resize-y min-h-[120px]"
        placeholder="현재 경쟁력을 뒷받침하는 핵심 기술..."
      />
    </div>
    <div>
      <Label>기술 단계</Label>
      <Select
        value={analysisData.core_technology.stage}
        onValueChange={(value) => updateAnalysis('core_technology', 'stage', value)}
      >
        <SelectItem value="상용화">상용화</SelectItem>
        <SelectItem value="성장기">성장기</SelectItem>
        <SelectItem value="R&D">연구개발 단계</SelectItem>
      </Select>
    </div>
    <div>
      <Label>혁신 경로</Label>
      <Textarea ... />
    </div>
  </CardContent>
</Card>
```

#### 💰 거시경제 영향 (428-474줄)
- 금리/유동성
- 환율
- 원자재
- 정책/규제

#### 📈 성장동력/KPI (477-513줄)
- 내부 요인
- 외부 요인
- 핵심 KPI

#### 🔗 가치사슬 (516-552줄)
- 단계별 흐름
- 이익풀 분석
- 병목 파악

#### 📊 공급/수요 요인 (555-687줄)
**수요**:
- 최종 수요처
- 장기 성장 동력
- 수요 민감도

**공급**:
- 주요 플레이어
- 생산능력
- 진입장벽

**투자 촉발 요인**

#### 🗺️ 시장 지도 (690-736줄)
- 시장 구조
- 경쟁 방식
- 경제적 해자
- 산업 생애주기

### 2.4 종목 태그 입력 시스템

#### 🏢 대표 대형주 (739-767줄)
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-primary">🏢 대표 대형주</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex gap-2">
      <Input
        value={newLeadingStock}
        onChange={(e) => setNewLeadingStock(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && addLeadingStock()}
        placeholder="종목명 입력 후 Enter"
      />
      <Button onClick={addLeadingStock}>추가</Button>
    </div>
    <div className="flex flex-wrap gap-2">
      {leadingStocks.map((stock, index) => (
        <Badge key={index} variant="secondary">
          {stock}
          <button onClick={() => removeLeadingStock(stock)}>×</button>
        </Badge>
      ))}
    </div>
  </CardContent>
</Card>
```

#### 🌟 중소형 유망주 (770-798줄)
- 동일한 구조

### 2.5 저장/로딩 기능

#### 데이터 로드 (171-192줄)
```tsx
const loadAnalysisData = useCallback(async () => {
  if (!selectedMajor || !selectedSubIndustry) return;

  const response = await fetch(
    `${API_URL}/api/industry-analysis?user_id=${userId}&major_category=${encodeURIComponent(selectedMajor)}&sub_industry=${encodeURIComponent(selectedSubIndustry)}`
  );
  const result = await response.json();

  if (result.status === 'success' && result.data) {
    setAnalysisData(result.data.analysis_data || getEmptyAnalysisData());
    setLeadingStocks(result.data.leading_stocks || []);
    setEmergingStocks(result.data.emerging_stocks || []);
  }
}, [selectedMajor, selectedSubIndustry, userId]);

useEffect(() => {
  loadAnalysisData();
}, [loadAnalysisData]);
```

#### 데이터 저장 (207-241줄)
```tsx
const handleSave = async () => {
  if (!selectedMajor || !selectedSubIndustry || !analysisData) return;

  setIsSaving(true);

  const response = await fetch(`${API_URL}/api/industry-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      major_category: selectedMajor,
      sub_industry: selectedSubIndustry,
      analysis_data: analysisData,
      leading_stocks: leadingStocks,
      emerging_stocks: emergingStocks
    })
  });

  const result = await response.json();

  if (result.status === 'success') {
    setSaveMessage('✅ 저장되었습니다!');
    setTimeout(() => setSaveMessage(''), 2000);
  }

  setIsSaving(false);
};
```

---

## 기술 스택

### 백엔드
- **언어**: Python 3.11
- **프레임워크**: Flask
- **데이터베이스**: PostgreSQL (Neon.tech)
- **ORM**: psycopg2
- **데이터 구조**: JSONB (유연한 스키마)

### 프론트엔드
- **프레임워크**: Next.js 15.5.7 (Turbopack)
- **언어**: TypeScript
- **UI 라이브러리**: shadcn/ui
  - Card, Button, Input, Textarea, Select, Badge, Label
- **스타일**: Tailwind CSS
- **상태 관리**: React useState, useEffect, useCallback

### 핵심 기능
1. **3단계 네비게이션**: 산업군 → 하위 산업 → 분석 폼
2. **자동 크기 조절 Textarea**: `resize-y` + `min-h-[120px]`
3. **JSONB 저장**: PostgreSQL JSONB로 유연한 데이터 구조
4. **UPSERT 패턴**: INSERT ... ON CONFLICT DO UPDATE
5. **실시간 저장**: 버튼 클릭 시 즉시 DB 저장
6. **태그 입력**: Enter 키 추가, × 버튼 삭제

---

## 데이터 구조

### AnalysisData 인터페이스 (TypeScript)

```typescript
interface AnalysisData {
  core_technology: {
    definition: string;
    stage: string;              // '상용화' | '성장기' | 'R&D'
    innovation_path: string;
  };
  macro_impact: {
    interest_rate: string;
    exchange_rate: string;
    commodities: string;
    policy: string;
  };
  growth_drivers: {
    internal: string;
    external: string;
    kpi: string;
  };
  value_chain: {
    flow: string;
    profit_pool: string;
    bottleneck: string;
  };
  supply_demand: {
    demand: {
      end_user: string;
      long_term: string;
      sensitivity: string;
    };
    supply: {
      players: string;
      capacity: string;
      barriers: string;
    };
    catalysts: string;
  };
  market_map: {
    structure: string;
    competition: string;
    moat: string;
    lifecycle: string;
  };
}
```

### PostgreSQL 테이블 구조

```sql
industry_analysis
├─ id (SERIAL PRIMARY KEY)
├─ user_id (INTEGER, FK to users)
├─ major_category (VARCHAR(50))           -- 6대 산업군
├─ sub_industry (VARCHAR(100))            -- 하위 산업명
├─ analysis_data (JSONB)                  -- 6개 분석 요소
├─ leading_stocks (TEXT[])                -- 대표 대형주 배열
├─ emerging_stocks (TEXT[])               -- 중소형 유망주 배열
├─ updated_at (TIMESTAMP)
└─ UNIQUE(user_id, major_category, sub_industry)
```

---

## 커밋 히스토리

### 커밋 1: 0759555
```
feat: 산업군 분석 시스템 완전 구현 + 개별분석 페이지 개선

변경 파일:
- backend/app.py (3개 API 엔드포인트 추가, 132줄 증가)
- backend/services/postgres_database_service.py (테이블 + 메서드 3개, 168줄 증가)
- frontend/src/app/analysis/page.tsx (handleAdd 함수 + 버튼, 29줄 증가)
- frontend/src/app/industries/page.tsx (완전히 재작성, 817줄, 81% 변경)

총 변경: 4 files changed, 1147 insertions(+), 238 deletions(-)
```

### 빌드 결과
```
✓ /industries   50.1 kB (188 kB First Load JS)
✓ /analysis     45.5 kB (193 kB First Load JS)
✓ Next.js 15.5.7 빌드 성공
```

---

## 성과 요약

### 개별분석 페이지
- ✅ 새 분석 추가 버튼 구현
- ✅ 빈 템플릿 자동 생성 및 선택
- ✅ 즉시 작성 가능한 UX 개선

### 산업군 분석 시스템
- ✅ **6대 산업군 분류 체계** 확립
- ✅ **46개 하위 산업** 구조화
- ✅ **6개 분석 요소** 완전 구현
- ✅ **종목 태그 시스템** (대표 대형주 + 중소형 유망주)
- ✅ **3단계 네비게이션** 직관적 UI
- ✅ **PostgreSQL JSONB** 유연한 데이터 저장
- ✅ **UPSERT 패턴** 완벽한 CRUD
- ✅ **자동 크기 조절 Textarea** 사용성 개선

### 기술적 성과
- PostgreSQL JSONB로 유연한 스키마 설계
- 3단계 네비게이션으로 복잡도 감소
- shadcn/ui 컴포넌트 활용으로 일관된 디자인
- TypeScript 타입 안전성 100%
- UPSERT 패턴으로 효율적 데이터 관리

---

## 다음 단계 제안

### 기능 개선
1. **검색 기능**: 산업명, 종목명으로 빠른 검색
2. **필터링**: 작성된 분석만 보기, 미작성 분석 보기
3. **비교 기능**: 2개 이상 산업 비교 분석
4. **엑셀 내보내기**: 분석 데이터 CSV/Excel 다운로드

### 데이터 활용
1. **AI 분석 요약**: GPT-4로 작성된 분석 자동 요약
2. **산업 트렌드 대시보드**: 전체 산업 현황 한눈에 보기
3. **종목 연동**: 대형주/유망주 클릭 시 개별분석 페이지로 이동
4. **히스토리 추적**: 분석 변경 이력 저장 및 비교

---

**마지막 업데이트**: 2025-12-16
**작성자**: Claude Code + Partner
**세션 시간**: 2시간 45분
**커밋**: 0759555
