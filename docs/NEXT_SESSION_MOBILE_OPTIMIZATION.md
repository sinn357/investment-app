# 다음 세션: 모바일 반응형 최적화 가이드

> **작성일**: 2025-12-30
> **우선순위**: 최우선 ⭐⭐⭐
> **예상 시간**: 3-4시간

---

## 📋 완료된 작업

✅ **Navigation 햄버거 메뉴** (2025-12-30)
- 모바일 슬라이드 사이드바 구현
- 오버레이 배경 + 자동 닫힘
- 사용자 정보 및 인증 UI 통합
- 반응형 로고 크기 조정

✅ **Excel 다운로드 기능** (2025-12-30)
- 포트폴리오 + 가계부 Excel 파일 다운로드
- 3개 시트 구조 (목록, 요약, 통계)

---

## 🎯 다음 세션에서 진행할 작업

### 1. 포트폴리오 페이지 모바일 레이아웃 (1-1.5시간)

**파일**: `frontend/src/app/portfolio/page.tsx`

**작업 내용**:

#### 1.1 헤더 최적화
```tsx
// 현재: 가로 배치 (사용자명 + Excel + 계정설정 + 로그아웃)
// 변경: 모바일에서 세로 스택 또는 간소화

<div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
  <div className="text-sm text-muted-foreground">
    <span className="font-medium text-foreground">{user.username}</span>님
  </div>
  <div className="flex space-x-2">
    <EnhancedButton variant="secondary" onClick={handleExportExcel} shimmer className="text-xs md:text-sm">
      📊 Excel
    </EnhancedButton>
    <button className="px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm ...">
      계정 설정
    </button>
  </div>
</div>
```

#### 1.2 요약 카드 그리드
```tsx
// 현재: 4열 그리드 (xl:grid-cols-4)
// 변경: 모바일 2열, 태블릿 2열, 데스크톱 4열

<div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4">
  {/* 요약 카드 */}
</div>
```

#### 1.3 입력 폼 최적화
```tsx
// 현재: 3칸 그리드
// 변경: 모바일 1열, 태블릿 2열, 데스크톱 3열

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 입력 폼 */}
</div>
```

#### 1.4 차트 반응형
```tsx
// 도넛차트, 막대차트 모바일에서 높이 조정
<ResponsiveContainer width="100%" height={250} className="md:h-300">
  {/* 차트 */}
</ResponsiveContainer>
```

#### 1.5 테이블 → 카드형 (모바일)
```tsx
// 모바일에서 테이블을 카드형으로 변환
<div className="hidden md:block">
  {/* 테이블 */}
</div>
<div className="md:hidden space-y-3">
  {assets.map(asset => (
    <GlassCard key={asset.id} className="p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold">{asset.name}</h3>
          <p className="text-xs text-muted-foreground">{asset.asset_type} · {asset.sub_category}</p>
        </div>
        <Badge>{asset.profit_rate}%</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">원금</span>
          <p className="font-medium">{asset.principal.toLocaleString()}원</p>
        </div>
        <div>
          <span className="text-muted-foreground">평가액</span>
          <p className="font-medium">{asset.eval_amount.toLocaleString()}원</p>
        </div>
      </div>
    </GlassCard>
  ))}
</div>
```

---

### 2. 가계부 페이지 모바일 레이아웃 (1-1.5시간)

**파일**: `frontend/src/app/expenses/page.tsx`

**작업 내용**:

#### 2.1 헤더 최적화
- 포트폴리오와 동일한 패턴 적용
- Excel 다운로드 버튼 크기 조정

#### 2.2 날짜 필터 최적화
```tsx
// 현재: 가로 배치
// 변경: 모바일에서 세로 스택

<div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
  <select className="w-full md:w-auto">연도</select>
  <select className="w-full md:w-auto">월</select>
  <button className="w-full md:w-auto">이전</button>
  <button className="w-full md:w-auto">다음</button>
</div>
```

#### 2.3 거래내역 입력 폼
```tsx
// 세로 스택으로 변경
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 입력 필드 */}
</div>
```

#### 2.4 게이지 시스템
```tsx
// 모바일에서 1열, 데스크톱 2열
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <ExpenseGoalGauge />
  <IncomeGoalGauge />
</div>
```

---

### 3. 경제지표 페이지 모바일 레이아웃 (30분-1시간)

**파일**: `frontend/src/app/indicators/page.tsx`

**작업 내용**:

#### 3.1 카테고리 필터 가로 스크롤
```tsx
// 현재: flex-wrap
// 변경: 가로 스크롤

<div className="flex md:flex-wrap overflow-x-auto md:overflow-x-visible space-x-2 pb-2 md:pb-0">
  {categories.map(cat => (
    <button className="whitespace-nowrap flex-shrink-0 md:flex-shrink">
      {cat}
    </button>
  ))}
</div>
```

#### 3.2 지표 그리드
```tsx
// 현재: 4열
// 변경: 모바일 1열, 태블릿 2열, 데스크톱 3-4열

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* 지표 카드 */}
</div>
```

#### 3.3 Health Check 요약 카드
```tsx
// 세로 스택
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {/* 요약 카드 */}
</div>
```

---

### 4. 섹터/종목 페이지 모바일 레이아웃 (30분-1시간)

**파일**: `frontend/src/app/industries/page.tsx`

**작업 내용**:

#### 4.1 6대 산업군 탭 가로 스크롤
```tsx
<div className="flex md:flex-wrap overflow-x-auto md:overflow-x-visible space-x-2">
  {industries.map(ind => (
    <button className="whitespace-nowrap flex-shrink-0 md:flex-shrink">
      {ind}
    </button>
  ))}
</div>
```

#### 4.2 소분류 사이드바 → 상단 드롭다운 (모바일)
```tsx
// 모바일에서 사이드바를 드롭다운으로 변경
<div className="md:hidden mb-4">
  <select className="w-full p-2 border rounded">
    {subcategories.map(sub => (
      <option key={sub}>{sub}</option>
    ))}
  </select>
</div>

<div className="hidden md:block">
  {/* 기존 사이드바 */}
</div>
```

#### 4.3 분석 폼 필드 세로 스택
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 분석 입력 필드 */}
</div>
```

---

### 5. 폰트 크기 및 간격 전역 최적화 (30분)

**파일**: `frontend/src/styles/globals.css` 또는 개별 컴포넌트

**작업 내용**:

```css
/* 모바일 전용 폰트 크기 조정 */
@media (max-width: 768px) {
  h1 {
    @apply text-3xl; /* 기존 text-4xl에서 축소 */
  }
  h2 {
    @apply text-2xl; /* 기존 text-3xl에서 축소 */
  }
  .card-padding {
    @apply p-4; /* 기존 p-6에서 축소 */
  }
}
```

**또는 Tailwind 클래스 직접 수정**:
```tsx
<h1 className="text-3xl md:text-4xl lg:text-5xl">제목</h1>
<div className="p-4 md:p-6 lg:p-8">카드</div>
<button className="py-2 md:py-3 text-sm md:text-base">버튼</button>
```

---

## 📦 체크리스트

### 포트폴리오 페이지
- [ ] 헤더 버튼 반응형
- [ ] 요약 카드 그리드 (2열 → 4열)
- [ ] 입력 폼 세로 스택
- [ ] 차트 높이 조정
- [ ] 테이블 → 카드형 (모바일)

### 가계부 페이지
- [ ] 헤더 버튼 반응형
- [ ] 날짜 필터 세로 스택
- [ ] 입력 폼 세로 스택
- [ ] 게이지 1열 → 2열
- [ ] 차트 반응형

### 경제지표 페이지
- [ ] 카테고리 필터 가로 스크롤
- [ ] 지표 그리드 (1열 → 4열)
- [ ] Health Check 카드 반응형

### 섹터/종목 페이지
- [ ] 6대 산업군 탭 가로 스크롤
- [ ] 소분류 드롭다운 (모바일)
- [ ] 분석 폼 세로 스택

### 전역 최적화
- [ ] 폰트 크기 조정
- [ ] 간격/패딩 축소
- [ ] 버튼 크기 조정

---

## 🚀 다음 세션 시작 방법

```
"다음 작업 시작하자"
```

Claude가 자동으로:
1. `NEXT_SESSION_MOBILE_OPTIMIZATION.md` 읽기
2. 포트폴리오 페이지부터 순차적으로 작업 진행
3. 각 페이지 완료 후 TodoWrite 업데이트
4. 모든 작업 완료 후 커밋

---

## 📚 참고 문서

- `docs/REMAINING_TASKS.md` - 전체 남은 작업 목록
- `frontend/src/components/Navigation.tsx` - 모바일 반응형 참고 예시
- Tailwind 반응형: https://tailwindcss.com/docs/responsive-design

---

**예상 총 작업 시간**: 3-4시간
**세션 분할 가능**: 페이지별로 나누어 진행 가능 (각 페이지 30분-1.5시간)
