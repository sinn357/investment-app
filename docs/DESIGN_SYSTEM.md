# Investment App Design System

> **완전한 투자 루틴 지원 시스템 - 디자인 비전 & 스타일 가이드**

---

## 📋 문서 정보

- **작성일**: 2025-11-26
- **버전**: 1.0.0
- **상태**: 설계 단계
- **관련 문서**: [MASTER_PLAN.md](./MASTER_PLAN.md)

---

## 🌟 브랜드 정체성

### 핵심 키워드

```
💼 전문성 (Professional)
🎯 신뢰성 (Trustworthy)
📊 데이터 중심 (Data-Driven)
✨ 세련됨 (Sophisticated)
🧠 지적인 (Intelligent)
```

### 무드보드 방향

#### 영감 소스

1. **Bloomberg Terminal의 세련됨**
   - 금융 전문가 느낌
   - 어두운 배경 + 정보 밀도 높음
   - 하지만 더 **모던하고 친근하게**

2. **Notion의 유연함**
   - 사용자가 자유롭게 커스터마이징
   - 접기/펼치기, 드래그앤드롭
   - 깔끔한 타이포그래피

3. **Linear의 미니멀리즘**
   - 불필요한 장식 제거
   - 기능에 집중
   - 애니메이션은 부드럽고 의미 있게

4. **Stripe Dashboard의 명료함**
   - 복잡한 데이터를 단순하게
   - 계층 구조 명확
   - 색상은 의미 전달 목적으로만

### 감성 키워드

#### ❌ 피해야 할 것
- 화려한 그라디언트 (2010년대 느낌)
- 너무 많은 애니메이션 (산만함)
- 강한 네온 컬러 (눈의 피로)
- 스큐어모피즘 (구시대적)

#### ✅ 추구해야 할 것
- 절제된 우아함 (Restrained Elegance)
- 기능적 아름다움 (Functional Beauty)
- 차분한 신뢰감 (Calm Confidence)
- 지적인 정교함 (Intellectual Sophistication)

---

## 🎨 색상 시스템

### Primary Palette

#### Gold - 번영, 재산, 성공

```css
/* Light Shades */
--gold-50:  oklch(0.98 0.02 88);   /* 매우 연한 크림 - 배경 */
--gold-100: oklch(0.95 0.05 88);   /* 연한 금색 - 호버 배경 */
--gold-200: oklch(0.90 0.08 88);   /* 부드러운 금색 - 보조 요소 */

/* Main Colors */
--gold-500: oklch(0.68 0.17 88);   /* 메인 금색 - Primary */

/* Dark Shades */
--gold-700: oklch(0.55 0.20 88);   /* 진한 금색 - 액센트 */
--gold-900: oklch(0.35 0.15 88);   /* 매우 진한 금색 - 테두리 */
```

#### Emerald - 성장, 호황, 긍정

```css
/* Light Shades */
--emerald-50:  oklch(0.98 0.02 158);  /* 매우 연한 민트 */
--emerald-100: oklch(0.92 0.08 158);  /* 연한 에메랄드 */

/* Main Colors */
--emerald-500: oklch(0.65 0.16 158);  /* 메인 에메랄드 - Secondary */

/* Dark Shades */
--emerald-700: oklch(0.50 0.18 158);  /* 진한 에메랄드 */
--emerald-900: oklch(0.30 0.12 158);  /* 매우 진한 에메랄드 */
```

### Semantic Colors

#### 수익/손실

```css
--profit-green:  oklch(0.65 0.16 158); /* 에메랄드 - 수익 */
--loss-red:      oklch(0.55 0.22 25);  /* 차분한 레드 - 손실 */
--neutral-gray:  oklch(0.60 0.00 0);   /* 중립 - 변동 없음 */
```

#### 경고/위험

```css
--warning-amber: oklch(0.70 0.18 75);  /* 호박색 - 주의 */
--danger-red:    oklch(0.50 0.25 25);  /* 위험 빨강 - 심각 */
--info-blue:     oklch(0.60 0.15 240); /* 정보 파랑 - 안내 */
--success-green: oklch(0.65 0.16 158); /* 성공 초록 - 완료 */
```

### Background Colors

#### 라이트 모드

```css
--bg-primary:   oklch(0.99 0.005 90);  /* 크림/아이보리 - 메인 배경 */
--bg-secondary: oklch(0.97 0.008 90);  /* 약간 더 진한 크림 - 섹션 배경 */
--bg-tertiary:  oklch(0.95 0.01 90);   /* 카드 배경 */
```

#### 다크 모드

```css
--bg-dark-primary:   oklch(0.13 0.02 85);  /* 금색 힌트 - 메인 배경 */
--bg-dark-secondary: oklch(0.17 0.025 88); /* 카드 배경 */
--bg-dark-tertiary:  oklch(0.20 0.03 88);  /* 강조 영역 */
```

### Text Colors

```css
/* 라이트 모드 */
--text-primary:   oklch(0.20 0.00 0);  /* 거의 검정 - 제목/본문 */
--text-secondary: oklch(0.45 0.00 0);  /* 회색 - 설명 */
--text-tertiary:  oklch(0.60 0.00 0);  /* 연한 회색 - 라벨 */

/* 다크 모드 */
--text-inverse:   oklch(0.98 0.00 0);  /* 거의 흰색 */
```

### Chart Palette

#### 기본 5색 (조화로운 팔레트)

```css
--chart-1: oklch(0.68 0.17 88);   /* 골드 */
--chart-2: oklch(0.65 0.16 158);  /* 에메랄드 */
--chart-3: oklch(0.60 0.18 200);  /* 틸 */
--chart-4: oklch(0.55 0.15 280);  /* 퍼플 */
--chart-5: oklch(0.70 0.18 75);   /* 앰버 */
```

#### 확장 팔레트 (10색)

```css
--chart-6:  oklch(0.50 0.20 320);  /* 마젠타 */
--chart-7:  oklch(0.65 0.15 120);  /* 라임 */
--chart-8:  oklch(0.60 0.18 40);   /* 오렌지 */
--chart-9:  oklch(0.55 0.12 220);  /* 인디고 */
--chart-10: oklch(0.50 0.10 30);   /* 브라운 */
```

### 색상 사용 가이드

```tsx
// ✅ 좋은 예
<div className="bg-gold-500 text-white">Primary Button</div>
<div className="text-profit-green">+12.5%</div>
<div className="text-loss-red">-3.2%</div>

// ❌ 나쁜 예
<div className="bg-red-500">위험!</div>  // 시스템 색상 대신 커스텀 사용
<div className="text-green-700">수익</div>  // profit-green 사용 권장
```

---

## 🔤 타이포그래피 시스템

### 폰트 선택

#### Option 1: 모노스페이스 조합 (✅ 추천)

```css
/* 숫자/코드용 */
--font-mono: 'Fira Code', 'JetBrains Mono', 'SF Mono', monospace;

/* 제목/본문용 */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
```

**장점**:
- ✅ 숫자 정렬 완벽 (PER 28.5, 금액 $1,234.56)
- ✅ 코드 블록 일관성
- ✅ 전문가 느낌
- ✅ Nerd Font 아이콘 지원

**적용 규칙**:
- **Fira Code**: 숫자, 티커, 날짜, 코드
- **Inter**: 제목, 본문, 설명

#### Option 2: 금융 전통 (대안)

```css
/* 본문용 */
--font-primary: 'IBM Plex Sans', 'Helvetica Neue', sans-serif;

/* 숫자용 */
--font-numbers: 'Roboto Mono', monospace;
```

### 타입 스케일 (모듈러 스케일 1.25)

```css
/* Font Sizes */
--text-xs:   0.64rem;  /* 10px - 캡션, 라벨 */
--text-sm:   0.80rem;  /* 13px - 보조 정보 */
--text-base: 1.00rem;  /* 16px - 본문 */
--text-lg:   1.25rem;  /* 20px - 서브헤딩 */
--text-xl:   1.56rem;  /* 25px - 헤딩 3 */
--text-2xl:  1.95rem;  /* 31px - 헤딩 2 */
--text-3xl:  2.44rem;  /* 39px - 헤딩 1 */
--text-4xl:  3.05rem;  /* 49px - 히어로 */

/* Line Heights */
--leading-tight:   1.2;   /* 제목 */
--leading-normal:  1.5;   /* 본문 */
--leading-relaxed: 1.75;  /* 긴 텍스트 */

/* Font Weights */
--font-light:    300;
--font-regular:  400;
--font-medium:   500;
--font-semibold: 600;
--font-bold:     700;
```

### 타이포그래피 사용 예시

```tsx
// 페이지 제목
<h1 className="text-3xl font-bold text-text-primary leading-tight">
  Portfolio Dashboard
</h1>

// 섹션 제목
<h2 className="text-2xl font-semibold text-text-primary leading-tight">
  Economic Cycle Analysis
</h2>

// 카드 제목
<h3 className="text-xl font-medium text-text-primary leading-normal">
  Investment Philosophy
</h3>

// 본문
<p className="text-base font-regular text-text-secondary leading-normal">
  현재 경기 회복기에 진입하여 성장주 비중 확대 권장...
</p>

// 숫자 (모노스페이스 + tabular-nums)
<span className="font-mono text-lg font-semibold tabular-nums">
  $52,345.67
</span>

// 작은 라벨 (대문자 + 자간)
<label className="text-sm font-medium text-text-tertiary uppercase tracking-wide">
  Target Return
</label>
```

---

## ✨ 최신 디자인 트렌드

### 1. Glassmorphism (유리형태주의)

**적용 위치**: 모달, 드롭다운, 호버 카드

```css
/* 라이트 모드 */
.glassmorphism {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 다크 모드 */
.glassmorphism-dark {
  background: rgba(23, 23, 23, 0.7);
  backdrop-filter: blur(10px) saturate(150%);
  -webkit-backdrop-filter: blur(10px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
```

**예시**:

```tsx
<div className="glassmorphism p-6">
  <h3 className="text-xl font-semibold mb-4">Investment Thesis</h3>
  <p className="text-text-secondary">
    AI 생태계 선점 + 안정적 캐시플로우로 장기 성장 전망...
  </p>
</div>
```

---

### 2. Neumorphism (뉴모피즘) - 제한적 사용

**적용 위치**: 중요 액션 버튼, 통계 카드

```css
/* 라이트 모드 */
.neumorphism-light {
  background: oklch(0.97 0.008 90);
  box-shadow:
    12px 12px 24px rgba(0, 0, 0, 0.05),
    -12px -12px 24px rgba(255, 255, 255, 0.7);
  border-radius: 16px;
}

/* 눌린 상태 */
.neumorphism-pressed {
  box-shadow:
    inset 6px 6px 12px rgba(0, 0, 0, 0.05),
    inset -6px -6px 12px rgba(255, 255, 255, 0.7);
}
```

**예시**: 포트폴리오 요약 카드

```tsx
<div className="neumorphism-light p-8 text-center">
  <div className="text-sm text-text-secondary mb-2">Total Assets</div>
  <div className="text-4xl font-bold font-mono mb-1">$52,345</div>
  <div className="text-emerald-500 font-medium">+12.5% ↑</div>
</div>
```

---

### 3. Bento Grid (벤토 박스 레이아웃)

**적용 위치**: Home 페이지, Portfolio 대시보드

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
}

/* 다양한 크기 카드 */
.bento-large {
  grid-column: span 8;
  grid-row: span 2;
}

.bento-medium {
  grid-column: span 4;
  grid-row: span 2;
}

.bento-small {
  grid-column: span 3;
  grid-row: span 1;
}

/* 반응형 */
@media (max-width: 1024px) {
  .bento-large,
  .bento-medium {
    grid-column: span 12;
  }

  .bento-small {
    grid-column: span 6;
  }
}
```

**예시**: Home 페이지

```tsx
<div className="bento-grid">
  {/* 투자 목표 - 큰 카드 */}
  <div className="bento-large bg-gradient-to-br from-gold-100 to-emerald-100 rounded-2xl p-8">
    <InvestmentGoals />
  </div>

  {/* 금지 자산 - 중간 카드 */}
  <div className="bento-medium bg-white rounded-2xl p-6 shadow-lg">
    <ForbiddenAssets />
  </div>

  {/* 통계 - 작은 카드들 */}
  <div className="bento-small bg-white rounded-xl p-4 shadow-md">
    <StatCard value="15%" label="Target Return" />
  </div>
  <div className="bento-small bg-white rounded-xl p-4 shadow-md">
    <StatCard value="-20%" label="Max Drawdown" />
  </div>
</div>
```

---

### 4. Micro-Interactions (미세 상호작용)

#### A. 호버 효과

```css
.card-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  border-color: var(--gold-500);
}

/* 숫자 카운터 애니메이션 */
@keyframes countUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-number {
  animation: countUp 0.6s ease-out;
}
```

#### B. 버튼 피드백

```tsx
<button className="group relative overflow-hidden px-6 py-3 rounded-lg font-medium transition-all">
  <span className="relative z-10 text-white">Add Analysis</span>
  <span className="absolute inset-0 bg-gradient-to-r from-gold-500 to-emerald-500
                   transform scale-x-0 group-hover:scale-x-100
                   transition-transform origin-left duration-300" />
</button>
```

#### C. 로딩 스켈레톤

```css
.skeleton {
  background: linear-gradient(
    90deg,
    oklch(0.95 0.01 90) 25%,
    oklch(0.97 0.005 90) 50%,
    oklch(0.95 0.01 90) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

```tsx
// 사용 예시
<div className="skeleton h-24 w-full mb-4" />
<div className="skeleton h-8 w-3/4 mb-2" />
<div className="skeleton h-8 w-1/2" />
```

---

### 5. Data Visualization Trends

#### A. 그라데이션 차트

```tsx
import { AreaChart, Area, defs, linearGradient, stop } from 'recharts';

<AreaChart data={data}>
  <defs>
    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="var(--gold-500)" stopOpacity={0.8}/>
      <stop offset="95%" stopColor="var(--gold-500)" stopOpacity={0.1}/>
    </linearGradient>
  </defs>

  <Area
    type="monotone"
    dataKey="value"
    stroke="var(--gold-500)"
    fill="url(#goldGradient)"
    strokeWidth={2}
  />
</AreaChart>
```

#### B. 애니메이션 차트

```tsx
<AreaChart data={data}>
  <Area
    type="monotone"
    dataKey="value"
    animationDuration={1000}
    animationEasing="ease-in-out"
  />
</AreaChart>
```

#### C. 인터랙티브 툴팁

```tsx
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;

  return (
    <div className="glassmorphism p-4 min-w-[200px]">
      <p className="text-sm text-text-secondary mb-2">
        {new Date(data.date).toLocaleDateString()}
      </p>
      <p className="text-2xl font-mono font-bold mb-1">
        ${data.value.toLocaleString()}
      </p>
      <p className={`text-sm font-medium ${
        data.change > 0 ? 'text-profit-green' : 'text-loss-red'
      }`}>
        {data.change > 0 ? '↑' : '↓'} {Math.abs(data.change).toFixed(2)}%
      </p>
    </div>
  );
};

<Tooltip content={<CustomTooltip />} />
```

---

### 6. Dark Mode 전환 애니메이션

```tsx
import { motion } from 'framer-motion';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  return (
    <motion.button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-lg"
      animate={{
        rotate: isDark ? 180 : 0,
        backgroundColor: isDark
          ? 'oklch(0.13 0.02 85)'
          : 'oklch(0.99 0.005 90)',
      }}
      transition={{ duration: 0.3 }}
    >
      {isDark ? '🌙' : '☀️'}
    </motion.button>
  );
};
```

---

### 7. Scroll-Driven Animations

```css
/* 스크롤 시 페이드 인 */
.fade-in-on-scroll {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

.fade-in-on-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}
```

```tsx
// Intersection Observer로 구현
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.fade-in-on-scroll').forEach((el) => {
    observer.observe(el);
  });

  return () => observer.disconnect();
}, []);
```

---

## 📐 레이아웃 시스템

### 스페이싱 스케일 (8px 기반)

```css
--space-0:  0;
--space-1:  0.25rem;  /* 4px */
--space-2:  0.5rem;   /* 8px */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px */
--space-5:  1.5rem;   /* 24px */
--space-6:  2rem;     /* 32px */
--space-8:  3rem;     /* 48px */
--space-10: 4rem;     /* 64px */
--space-12: 6rem;     /* 96px */
--space-16: 8rem;     /* 128px */
```

### 컨테이너 너비

```css
--container-sm:  640px;   /* 모바일 */
--container-md:  768px;   /* 태블릿 */
--container-lg:  1024px;  /* 데스크톱 */
--container-xl:  1280px;  /* 대형 */
--container-2xl: 1536px;  /* 초대형 */
```

### 그리드 시스템

```css
/* 12칼럼 그리드 */
.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6);
}

/* 반응형 */
@media (max-width: 1024px) {
  .grid-12 {
    grid-template-columns: repeat(6, 1fr);
    gap: var(--space-4);
  }
}

@media (max-width: 768px) {
  .grid-12 {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-3);
  }
}
```

### 보더 반경

```css
--radius-sm:  0.25rem;  /* 4px - 작은 요소 */
--radius-md:  0.5rem;   /* 8px - 버튼, 입력 */
--radius-lg:  0.75rem;  /* 12px - 카드 */
--radius-xl:  1rem;     /* 16px - 모달 */
--radius-2xl: 1.5rem;   /* 24px - 큰 카드 */
--radius-full: 9999px;  /* 완전한 원 */
```

### 그림자

```css
/* 엘리베이션 시스템 */
--shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md:  0 4px 6px rgba(0, 0, 0, 0.07);
--shadow-lg:  0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl:  0 20px 25px rgba(0, 0, 0, 0.15);
--shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25);

/* 내부 그림자 */
--shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.06);

/* 골드 글로우 */
--shadow-gold: 0 0 20px rgba(var(--gold-500-rgb), 0.3);
```

---

## 🎭 페이지별 디자인 컨셉

### Page 1: Home (투자 철학)

#### 분위기
```
🏛️ 위엄 있는 (Majestic)
📜 고전적인 (Classical)
🎯 명확한 (Clear)
```

#### 레이아웃 구조

```
┌─────────────────────────────────────────┐
│  Hero Section                           │
│  "My Investment Philosophy"             │
│  큰 제목 + 부드러운 그라디언트 배경      │
└─────────────────────────────────────────┘

[Bento Grid - 5개 섹션]
┌──────────┬──────────┬──────────┐
│ 투자 목표 │ 금지자산  │ 운용범위 │
│ (Large)  │ (Medium) │ (Medium) │
│  8칸     │  4칸     │  4칸     │
│          ├──────────┴──────────┤
│          │ 투자 원칙 (Wide)    │
│          │  8칸                │
├──────────┴─────────────────────┤
│ 투자 방법 (Full Width)         │
│  12칸 - 타임라인 형태           │
└────────────────────────────────┘
```

#### 디자인 요소
- **배경**: 크림색 + 미묘한 골드 그라디언트
- **카드**: Neumorphism (부드러운 그림자)
- **아이콘**: Lucide Icons (간결한 라인 아이콘)
- **애니메이션**: 페이드 인 (섹션별 순차 등장)

---

### Page 2: Macro (거시경제)

#### 분위기
```
📊 분석적인 (Analytical)
🌐 글로벌한 (Global)
⚡ 역동적인 (Dynamic)
```

#### 레이아웃 구조

```
┌─────────────────────────────────────────┐
│  Economic Cycle Compass                 │
│  [3개 사이클 레이더 차트]               │
│  중앙에 큰 원형 차트, 주변에 상태 표시  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Indicators Grid                        │
│  [기존 그리드 유지, 카드 스타일 강화]   │
└─────────────────────────────────────────┘

┌──────────────┬──────────────────────────┐
│ 뉴스 & 담론   │  리스크 레이더            │
│ (60%)        │  (40%)                   │
│ 타임라인     │  레이더 차트             │
└──────────────┴──────────────────────────┘

┌─────────────────────────────────────────┐
│  Big Wave Tracker                       │
│  [수평 스크롤 카드]                     │
└─────────────────────────────────────────┘
```

#### 디자인 요소
- **배경**: 다크 모드 권장 (금융 전문가 느낌)
- **차트**: 그라데이션 + 애니메이션
- **카드**: Glassmorphism (반투명)
- **색상**: 리스크 레벨에 따라 색상 구분 (🔴 🟡 🟢)

---

### Page 3: Industries (산업 분석)

#### 분위기
```
🏭 산업적인 (Industrial)
🔍 탐구적인 (Exploratory)
📚 지식 중심 (Knowledge-Based)
```

#### 레이아웃 구조

```
┌─────────────────────────────────────────┐
│  [검색 바]  [필터: 성장|정체|쇠퇴]      │
└─────────────────────────────────────────┘

[산업 카드 그리드 - Masonry Layout]
┌────────┬────────┬────────┐
│ 반도체  │ AI     │바이오   │
│ 🟢     │ 🟢     │🟢       │
│ 15%    │ 10%    │ 8%      │
│ 대형 3 │ 대형 5 │ 대형 2  │
│ 성장 5 │ 성장 8 │ 성장 4  │
├────────┼────────┼────────┤
│자동차   │에너지  │금융     │
│🟡      │🔴     │🟡       │
└────────┴────────┴────────┘

[클릭 시 모달 - 풀스크린]
┌─────────────────────────────────────────┐
│  [← 뒤로]  반도체 산업                  │
├─────────────────────────────────────────┤
│  [탭] 산업분석 | 대표대형주 | 숨은성장주 │
│                                         │
│  [내용 - 스크롤 가능]                   │
└─────────────────────────────────────────┘
```

#### 디자인 요소
- **카드**: 상태별 색상 테두리 (🟢 성장, 🟡 정체, 🔴 쇠퇴)
- **모달**: 슬라이드 인 애니메이션 (우측에서 좌측으로)
- **리스트**: 호버 시 확장 (아코디언 효과)
- **검색**: Fuzzy search + 하이라이트

---

### Page 4: Analysis (개별 분석)

#### 분위기
```
🔬 과학적인 (Scientific)
📝 문서 중심 (Document-Centric)
💡 통찰적인 (Insightful)
```

#### 레이아웃 구조

```
┌─────────────────────────────────────────┐
│  [탭] 주식(15) | 암호화폐(5) | ETF(8)   │
└─────────────────────────────────────────┘

[리스트 뷰 - 카드 형태]
┌─────────────────────────────────────────┐
│ ⭐⭐⭐⭐⭐ AAPL - Apple Inc.           │
│                                         │
│ ✅ 매수 (확신도 5/5)                     │
│ 목표가 $195 (현재 $185) → +5.4%         │
│                                         │
│ 📊 밸류 4 | 성장 5 | 퀄리티 5            │
│ 🏷️ #AI #생태계 #안정성                  │
│                                         │
│ 💼 보유 중 (4.8%)                       │
│                                         │
│ [상세보기] [수정] [삭제]                 │
└─────────────────────────────────────────┘

[상세 뷰 - 사이드바 슬라이드]
┌──────────┬──────────────────────────────┐
│ 리스트   │  AAPL 분석                   │
│ (30%)    │  [탭] 정량|정성|의견|참고    │
│          │                              │
│ (축소됨) │  [내용 영역 - 스크롤]        │
│          │                              │
│          │  [하단 버튼]                 │
│          │  [저장] [취소]               │
└──────────┴──────────────────────────────┘
```

#### 디자인 요소
- **별점**: 시각적 평가 (⭐⭐⭐⭐⭐)
- **배지**: 태그 시스템 (#AI, #성장주, #안정성)
- **진행 바**: 목표가 대비 현재가 시각화
- **사이드바**: 슬라이드 인 (모바일은 풀스크린 모달)
- **점수 표시**: 5점 척도 (●●●●○)

---

### Page 5: Portfolio (트레이드)

#### 분위기
```
💼 실용적인 (Pragmatic)
📈 성과 중심 (Performance-Driven)
🎛️ 제어 가능한 (Controllable)
```

#### 레이아웃 구조

```
┌─────────────────────────────────────────┐
│  Quick Stats (Sticky Header)            │
│  💰 $52,345  📈 +12.5%  🎯 87% 달성     │
└─────────────────────────────────────────┘

[아코디언 섹션들]
▼ 포트폴리오 현황 (기본 펼쳐짐)
  ┌───────────────────────────────────────┐
  │ [차트 간소화 50%] + [테이블 대분류만] │
  └───────────────────────────────────────┘

▶ 예산 구성 (기본 접힘)
▶ 매수/매도 계획 (기본 접힘)
▶ 리밸런싱 제안 (기본 접힘)
▶ 피드백 & 복기 (기본 접힘)
▶ 백테스팅 (기본 접힘)

[플로팅 액션 버튼 - 우하단]
  + 자산 추가
```

#### 디자인 요소
- **아코디언**: 부드러운 확장/축소 (height transition)
- **Quick Stats**: 상단 고정 (position: sticky)
- **차트**: 인터랙티브 (드래그 가능, 확대/축소)
- **플로팅 버튼**: 항상 보이는 "자산 추가" (우하단 고정)
- **색상 시스템**: 수익(초록) / 손실(빨강) 명확히 구분

---

### Page 6: Budget (가계부)

#### 분위기
```
📒 일지 느낌 (Journal-Like)
💳 실용적인 (Practical)
📊 명료한 (Clear)
```

#### 디자인 전략
- ✅ **기존 디자인 유지** (이미 우수함)
- 다른 페이지와 **색상 통일**만 적용
- 골드-에메랄드 테마 적용
- 폰트 시스템 통일 (Inter + Fira Code)

---

## 🧩 컴포넌트 라이브러리

### 디렉토리 구조

```
components/
├── ui/                    # shadcn/ui 기반 기본 컴포넌트
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Tabs.tsx
│   ├── Accordion.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   └── Badge.tsx
│
├── charts/                # Recharts 래퍼
│   ├── DonutChart.tsx
│   ├── AreaChart.tsx
│   ├── BarChart.tsx
│   ├── RadarChart.tsx
│   ├── LineChart.tsx
│   └── Sparkline.tsx
│
├── layout/                # 레이아웃 컴포넌트
│   ├── Navigation.tsx
│   ├── Sidebar.tsx
│   ├── Container.tsx
│   ├── BentoGrid.tsx
│   └── Section.tsx
│
├── feedback/              # 피드백 컴포넌트
│   ├── Skeleton.tsx
│   ├── Toast.tsx
│   ├── Alert.tsx
│   └── ErrorBoundary.tsx
│
└── domain/                # 도메인 전용 컴포넌트
    ├── StatCard.tsx       # 통계 카드
    ├── AssetCard.tsx      # 자산 카드
    ├── AnalysisCard.tsx   # 분석 카드
    ├── IndustryCard.tsx   # 산업 카드
    ├── RiskBadge.tsx      # 리스크 배지
    └── CycleGauge.tsx     # 사이클 게이지
```

### 주요 컴포넌트 명세

#### StatCard (통계 카드)

```tsx
interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

<StatCard
  label="Total Assets"
  value="$52,345"
  change={12.5}
  trend="up"
  icon={<TrendingUp />}
  size="lg"
/>
```

#### AssetCard (자산 카드)

```tsx
interface AssetCardProps {
  symbol: string;
  name: string;
  category: string;
  quantity: number;
  currentValue: number;
  profitLoss: number;
  profitRate: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

<AssetCard
  symbol="AAPL"
  name="Apple Inc."
  category="국내주식"
  quantity={10}
  currentValue={1850}
  profitLoss={85}
  profitRate={4.8}
/>
```

---

## 🎬 애니메이션 시스템

### Framer Motion 활용

#### 페이지 전환

```tsx
const pageVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

<motion.div
  variants={pageVariants}
  initial="initial"
  animate="animate"
  exit="exit"
  transition={{ duration: 0.3, ease: 'easeInOut' }}
>
  <PageContent />
</motion.div>
```

#### 리스트 아이템 (Stagger Children)

```tsx
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

<motion.ul variants={listVariants} initial="hidden" animate="visible">
  {items.map((item) => (
    <motion.li key={item.id} variants={itemVariants}>
      {item.name}
    </motion.li>
  ))}
</motion.ul>
```

#### 호버 애니메이션

```tsx
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 300 }}
>
  <Card />
</motion.div>
```

---

## 📱 반응형 전략

### 브레이크포인트

```css
/* Mobile First Approach */
/* xs: 0-639px (기본) */

@media (min-width: 640px)  { /* sm - 태블릿 세로 */ }
@media (min-width: 768px)  { /* md - 태블릿 가로 */ }
@media (min-width: 1024px) { /* lg - 데스크톱 */ }
@media (min-width: 1280px) { /* xl - 대형 데스크톱 */ }
@media (min-width: 1536px) { /* 2xl - 초대형 */ }
```

### 반응형 패턴

#### 모바일: 요약 뷰, 데스크톱: 상세 뷰

```tsx
// 모바일: 간단한 요약
<div className="lg:hidden">
  <SummaryView
    totalAssets={52345}
    profitRate={12.5}
  />
</div>

// 데스크톱: 상세 차트
<div className="hidden lg:block">
  <DetailedChartView />
</div>
```

#### 그리드 시스템

```tsx
// 반응형 그리드
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

#### 네비게이션

```tsx
// 모바일: 햄버거 메뉴
<div className="lg:hidden">
  <MobileMenu />
</div>

// 데스크톱: 사이드바
<div className="hidden lg:block">
  <Sidebar />
</div>
```

---

## 🎨 Tailwind CSS 설정

### tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: 'oklch(0.98 0.02 88)',
          100: 'oklch(0.95 0.05 88)',
          200: 'oklch(0.90 0.08 88)',
          500: 'oklch(0.68 0.17 88)',
          700: 'oklch(0.55 0.20 88)',
          900: 'oklch(0.35 0.15 88)',
        },
        emerald: {
          50: 'oklch(0.98 0.02 158)',
          100: 'oklch(0.92 0.08 158)',
          500: 'oklch(0.65 0.16 158)',
          700: 'oklch(0.50 0.18 158)',
          900: 'oklch(0.30 0.12 158)',
        },
        profit: 'oklch(0.65 0.16 158)',
        loss: 'oklch(0.55 0.22 25)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'gold': '0 0 20px rgba(168, 142, 68, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'count-up': 'countUp 0.6s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

---

## 🔧 구현 체크리스트

### Phase 1: 기본 설정
- [ ] Tailwind CSS 설정 파일 작성
- [ ] CSS 변수 정의 (colors, fonts, spacing)
- [ ] 폰트 설치 (Inter, Fira Code)
- [ ] shadcn/ui 컴포넌트 설치
- [ ] Framer Motion 설치

### Phase 2: 공통 컴포넌트
- [ ] Button (5가지 variant)
- [ ] Card (glassmorphism, neumorphism)
- [ ] Modal (슬라이드 애니메이션)
- [ ] Tabs (부드러운 전환)
- [ ] Accordion (아이콘 회전)

### Phase 3: 차트 시스템
- [ ] 그라데이션 정의 (5색)
- [ ] CustomTooltip 컴포넌트
- [ ] 애니메이션 설정
- [ ] 반응형 차트 크기

### Phase 4: 레이아웃
- [ ] Navigation 컴포넌트
- [ ] BentoGrid 컴포넌트
- [ ] Container 래퍼
- [ ] Section 구분선

### Phase 5: 페이지별 적용
- [ ] Home: Bento Grid + Hero
- [ ] Macro: 다크 모드 최적화
- [ ] Industries: Masonry Layout
- [ ] Analysis: 사이드바 슬라이드
- [ ] Portfolio: Sticky Header

---

## 📚 참고 자료

### 디자인 영감
- [Bloomberg Terminal](https://www.bloomberg.com/professional/solution/bloomberg-terminal/)
- [Notion](https://notion.so)
- [Linear](https://linear.app)
- [Stripe Dashboard](https://dashboard.stripe.com)

### 기술 문서
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Recharts](https://recharts.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)

### 색상 도구
- [OKLCH Color Picker](https://oklch.com/)
- [Coolors](https://coolors.co/)
- [Adobe Color](https://color.adobe.com/)

---

## 📝 변경 이력

### v1.0.0 (2025-11-26)
- 초기 디자인 시스템 수립
- 색상 팔레트 정의 (Gold + Emerald)
- 타이포그래피 시스템 정의 (Inter + Fira Code)
- 6개 최신 디자인 트렌드 적용
- 페이지별 디자인 컨셉 정립
- 컴포넌트 라이브러리 구조 설계

---

**Last Updated**: 2025-11-26
**Version**: 1.0.0
**Status**: 🟡 설계 완료 (구현 대기 중)
