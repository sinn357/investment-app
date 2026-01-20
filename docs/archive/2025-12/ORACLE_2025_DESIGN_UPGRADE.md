# Oracle 2025 디자인 업그레이드 마스터플랜

> **프로젝트**: Investment App (Oracle) 전체 UX/UI 현대화
> **목표**: 어두운 기계적 디자인 → 밝고 빛나는 2025 최신 트렌드
> **버전**: v2.0
> **작성일**: 2025-12-29

---

## 📊 Executive Summary

### 핵심 목표
- ❌ **제거**: 어두운 배경, 정적인 UI, 기계적 느낌
- ✅ **추가**: 밝은 배경, 빛나는 효과, 부드러운 애니메이션, 긍정적 에너지

### 작업 규모
- **페이지**: 9개 (홈, 투자철학, 경제지표, 섹터/종목, 개별분석, 포트폴리오, 가계부, 계정설정, 암호화폐거래)
- **예상 기간**: 3주 (Phase 1-4)
- **우선순위**: Phase 1 홈페이지 → Phase 2 색상 시스템 → Phase 3 컴포넌트 → Phase 4 각 페이지

---

## 🎨 디자인 시스템 V2.0

### 1. 색상 팔레트 강화

#### 현재 (V1)
```css
--primary: oklch(0.68 0.17 88);       /* 골드 */
--secondary: oklch(0.65 0.16 158);    /* 에메랄드 */
--background: oklch(0.99 0.005 90);   /* 크림 */
```

#### 업그레이드 (V2)
```css
/* 메인 색상: 더 빛나는 골드 */
--primary: oklch(0.75 0.20 88);
--primary-shine: oklch(0.85 0.22 88);
--primary-glow: rgba(218, 165, 32, 0.3);

/* 사이드 색상: 더 생동감 있는 에메랄드 */
--secondary: oklch(0.70 0.19 158);
--secondary-shine: oklch(0.80 0.21 158);
--secondary-glow: rgba(80, 200, 120, 0.3);

/* 배경: 순백 + 미세한 골드 힌트 */
--background: oklch(1.0 0.002 90);
--background-gradient: linear-gradient(135deg,
  oklch(1.0 0.002 90) 0%,
  oklch(0.99 0.005 88) 50%,
  oklch(1.0 0.002 158) 100%);

/* 빛나는 효과용 색상 */
--shimmer-gold: linear-gradient(90deg,
  transparent 0%,
  rgba(218, 165, 32, 0.6) 50%,
  transparent 100%);
--shimmer-emerald: linear-gradient(90deg,
  transparent 0%,
  rgba(80, 200, 120, 0.6) 50%,
  transparent 100%);
```

### 2. 애니메이션 시스템

#### 빛나는 효과 (Shimmer)
```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.shimmer-effect {
  position: relative;
  overflow: hidden;
}

.shimmer-effect::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--shimmer-gold);
  animation: shimmer 3s infinite;
}
```

#### 빛 발산 효과 (Glow)
```css
@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 20px var(--primary-glow);
  }
  50% {
    box-shadow: 0 0 40px var(--primary-glow),
                0 0 60px var(--secondary-glow);
  }
}

.glow-effect {
  animation: glow-pulse 2s ease-in-out infinite;
}
```

#### 부드러운 등장 (Fade In)
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}
```

### 3. 글래스모피즘 (Glassmorphism)

```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(218, 165, 32, 0.2);
  box-shadow: 0 8px 32px rgba(218, 165, 32, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.glass-card:hover {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(218, 165, 32, 0.4);
  transform: translateY(-4px);
  box-shadow: 0 12px 48px rgba(218, 165, 32, 0.2);
}
```

### 4. 마이크로 인터랙션

#### 버튼 Ripple 효과
```typescript
const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
  const button = event.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
  circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
  circle.classList.add('ripple');

  button.appendChild(circle);
  setTimeout(() => circle.remove(), 600);
};
```

---

## 📄 Phase 1: 홈페이지 완전 재탄생 (Week 1)

### 현재 상태
- 어두운 배경 (bg-gray-950)
- 터미널 스타일 타이핑 효과
- 그리드 배경
- 정적인 느낌

### 목표 디자인
**"빛나는 히어로 섹션 + 파티클 배경 + 3D 효과"**

### 구현 계획

#### 1.1 배경 시스템
```typescript
// 그라디언트 메쉬 배경
<div className="fixed inset-0 bg-gradient-mesh">
  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10 animate-gradient" />
  <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
  <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float-delayed" />
</div>

// 파티클 시스템 (particles-bg)
<Particles
  params={{
    particles: {
      number: { value: 50 },
      color: { value: ['#DAA520', '#50C878'] },
      opacity: { value: 0.3 },
      size: { value: 3 },
      move: { speed: 1 }
    }
  }}
/>
```

#### 1.2 히어로 섹션
```typescript
<section className="relative z-10 min-h-screen flex items-center justify-center">
  {/* 글래스모피즘 카드 */}
  <div className="glass-card max-w-5xl mx-auto p-12 rounded-3xl shimmer-effect">
    {/* 로고 + 타이틀 */}
    <div className="text-center mb-8">
      <h1 className="text-7xl font-bold mb-4">
        <span className="bg-gradient-to-r from-primary via-yellow-400 to-secondary bg-clip-text text-transparent animate-gradient">
          ORACLE
        </span>
      </h1>
      <p className="text-2xl text-muted-foreground">
        Market Intelligence Platform
      </p>
    </div>

    {/* 타이핑 효과 (유지하되 밝은 배경에 맞게) */}
    <div className="font-mono text-xl text-foreground/80">
      <TypeAnimation text="Connecting data. Empowering decisions." />
    </div>

    {/* CTA 버튼 */}
    <div className="flex gap-4 justify-center mt-12">
      <button className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:scale-105 transition-transform glow-effect">
        시작하기
      </button>
      <button className="px-8 py-4 glass-card hover:glass-card-hover transition-all">
        더 알아보기
      </button>
    </div>
  </div>

  {/* 3D 아이콘 (React Three Fiber) */}
  <Canvas className="absolute inset-0 -z-10">
    <FloatingCoins />
  </Canvas>
</section>
```

#### 1.3 퀵 네비게이션 카드
```typescript
const features = [
  { icon: '💎', title: '투자철학', color: 'primary' },
  { icon: '📊', title: '경제지표', color: 'secondary' },
  { icon: '🏭', title: '섹터분석', color: 'primary' },
  { icon: '💼', title: '포트폴리오', color: 'secondary' }
];

<div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 py-20">
  {features.map((feature, i) => (
    <Link href={`/${feature.path}`} key={i}>
      <div className="glass-card p-8 text-center group hover:scale-105 transition-all fade-in-up"
           style={{ animationDelay: `${i * 0.1}s` }}>
        <div className="text-6xl mb-4 group-hover:animate-bounce">{feature.icon}</div>
        <h3 className="text-xl font-bold text-foreground">{feature.title}</h3>
      </div>
    </Link>
  ))}
</div>
```

### 기술 스택
- **파티클**: particles-bg 또는 tsparticles
- **3D**: @react-three/fiber, @react-three/drei
- **애니메이션**: framer-motion
- **타이핑**: react-type-animation

---

## 🧩 Phase 2: 전체 색상 시스템 강화 (Week 1-2)

### 2.1 globals.css 업데이트

```css
/* 기존 골드-에메랄드 유지하되 밝기/채도 증가 */
:root {
  /* ... (위 V2 색상 팔레트 적용) ... */
}

/* 새로운 유틸리티 클래스 */
.shimmer { /* ... */ }
.glow { /* ... */ }
.glass-card { /* ... */ }
.fade-in-up { /* ... */ }
```

### 2.2 theme.ts 확장

```typescript
export const VISUAL_EFFECTS = {
  shimmer: {
    gold: 'shimmer-gold',
    emerald: 'shimmer-emerald'
  },
  glow: {
    primary: 'glow-primary',
    secondary: 'glow-secondary'
  },
  glass: {
    card: 'glass-card',
    cardHover: 'glass-card:hover'
  }
};

export const ANIMATIONS = {
  fadeInUp: 'fade-in-up',
  fadeInDown: 'fade-in-down',
  scaleIn: 'scale-in',
  slideInRight: 'slide-in-right'
};
```

---

## 🎯 Phase 3: 컴포넌트 현대화 (Week 2)

### 3.1 카드 컴포넌트 업그레이드

#### 기존 (theme.ts)
```typescript
export const CARD_CLASSES = {
  container: 'bg-white dark:bg-gray-800 rounded-lg shadow-md...'
};
```

#### 업그레이드
```typescript
export const CARD_CLASSES_V2 = {
  // 기본 카드 (글래스모피즘)
  glass: 'glass-card rounded-2xl p-6 transition-all hover:scale-[1.02]',

  // 빛나는 카드
  shimmer: 'glass-card shimmer-effect rounded-2xl p-6',

  // 발광 카드 (중요한 정보용)
  glow: 'glass-card glow-effect rounded-2xl p-6',

  // 3D 카드 (호버 시 떠오름)
  elevated: 'glass-card rounded-2xl p-6 hover:shadow-2xl hover:-translate-y-2 transition-all'
};
```

### 3.2 버튼 컴포넌트

```typescript
// components/ui/enhanced-button.tsx
export const EnhancedButton = ({ variant, children, ...props }) => {
  const variants = {
    primary: 'bg-gradient-to-r from-primary to-secondary text-white hover:scale-105 glow-effect',
    glass: 'glass-card hover:glass-card-hover',
    shimmer: 'glass-card shimmer-effect',
    outline: 'border-2 border-primary/30 hover:border-primary hover:bg-primary/10'
  };

  return (
    <button
      className={`px-6 py-3 rounded-lg font-semibold transition-all ${variants[variant]}`}
      onClick={(e) => createRipple(e)}
      {...props}
    >
      {children}
    </button>
  );
};
```

### 3.3 차트 업그레이드

```typescript
// Recharts 커스텀 테마
export const CHART_THEME_V2 = {
  colors: {
    bar: ['oklch(0.75 0.20 88)', 'oklch(0.70 0.19 158)', 'oklch(0.60 0.14 120)'],
    line: 'oklch(0.75 0.20 88)',
    gradient: {
      from: 'rgba(218, 165, 32, 0.8)',
      to: 'rgba(80, 200, 120, 0.8)'
    }
  },
  animation: {
    duration: 1000,
    easing: 'ease-out'
  }
};

// 그라디언트 영역 차트
<AreaChart>
  <defs>
    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.8}/>
      <stop offset="100%" stopColor="var(--secondary)" stopOpacity={0.2}/>
    </linearGradient>
  </defs>
  <Area fill="url(#colorValue)" stroke="var(--primary)" strokeWidth={2} />
</AreaChart>
```

---

## 📱 Phase 4: 페이지별 특화 디자인 (Week 3)

### 4.1 투자철학 페이지

#### 현재 상태
- ✅ 2단 그리드 레이아웃
- ✅ 5개 박스 (투자목표, 금지자산, 운용범위, 투자원칙, 투자방법)
- ⚠️ 기능적으로 완성되었으나 시각적 임팩트 부족

#### 개선 방향
**"비전 타임라인 + 인터랙티브 카드 + 애니메이션"**

##### 레이아웃 개선
```typescript
// 헤더: 스크롤 시 parallax 효과
<header className="relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 animate-gradient" />
  <div className="relative max-w-7xl mx-auto px-4 py-20">
    <h1 className="text-6xl font-bold mb-6 fade-in-up">
      <span className="bg-gradient-to-r from-primary via-yellow-400 to-secondary bg-clip-text text-transparent">
        💎 투자 철학 & 원칙
      </span>
    </h1>
    <p className="text-2xl text-muted-foreground fade-in-up" style={{ animationDelay: '0.2s' }}>
      모든 투자 결정의 기준점 - 나만의 투자 나침반
    </p>
  </div>
</header>
```

##### 카드 업그레이드
```typescript
// 기존 카드에 더 풍부한 효과 추가
const sections = [
  { component: InvestmentGoal, icon: '🎯', color: 'primary' },
  { component: ForbiddenAssets, icon: '🚫', color: 'destructive' },
  { component: AllocationRange, icon: '📊', color: 'secondary' },
  { component: InvestmentPrinciples, icon: '⚖️', color: 'primary' },
  { component: InvestmentMethods, icon: '🔄', color: 'secondary' }
];

<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {sections.map((section, i) => (
    <div
      key={i}
      className="glass-card p-8 rounded-3xl hover:scale-[1.02] transition-all fade-in-up"
      style={{ animationDelay: `${i * 0.1}s` }}
    >
      {/* 아이콘 배지 */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`text-5xl p-4 rounded-full bg-${section.color}/10 shimmer-effect`}>
          {section.icon}
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {/* 섹션 제목 */}
        </h2>
      </div>

      {/* 컴포넌트 렌더링 */}
      <section.component {...props} />
    </div>
  ))}
</div>
```

##### 저장 버튼 개선
```typescript
<button className="group relative px-12 py-5 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-bold text-lg hover:scale-105 transition-all glow-effect">
  <span className="relative z-10 flex items-center gap-3">
    💾 투자 철학 저장
  </span>
  {/* Shimmer 효과 */}
  <div className="absolute inset-0 shimmer-effect rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
</button>
```

---

### 4.2 경제지표 페이지

#### 현재 상태
- ✅ MasterCycleCard (경제 사이클 판별)
- ✅ IndicatorGrid (47개 지표 그리드)
- ✅ NewsNarrative, NarrativeReview (뉴스 & 담론)
- ✅ RiskRadar (리스크 레이더)
- ✅ BigWaveSection (빅웨이브 트래커)
- ⚠️ 기능은 풍부하지만 시각적 통일성 부족

#### 개선 방향
**"실시간 대시보드 + 라이브 업데이트 효과 + 색상 코드 강화"**

##### 상단 마스터 사이클 카드
```typescript
<div className="glass-card p-8 rounded-3xl mb-8 shimmer-effect">
  <div className="flex items-center gap-4 mb-6">
    <div className="text-5xl animate-pulse">🌍</div>
    <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
      Master Economic Cycle
    </h2>
    {/* 라이브 배지 */}
    <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold animate-pulse">
      🔴 LIVE
    </span>
  </div>

  {/* 기존 MasterCycleCard 내용 */}
  <MasterCycleCard />
</div>
```

##### 지표 그리드 호버 효과
```typescript
// IndicatorGrid 개선
<div className="glass-card p-4 rounded-xl hover:scale-[1.03] hover:shadow-2xl transition-all group">
  {/* 지표 이름 */}
  <div className="flex items-center justify-between mb-2">
    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
      {indicator.name}
    </h3>
    {/* Surprise 배지 (색상 강화) */}
    <Badge className={`${indicator.surprise > 0 ? 'bg-green-500 glow-effect' : 'bg-red-500 glow-effect'}`}>
      {indicator.surprise > 0 ? '↗' : '↘'} {indicator.surprise}%
    </Badge>
  </div>

  {/* 미니 스파크라인 차트 */}
  <div className="h-12 opacity-60 group-hover:opacity-100 transition-opacity">
    <Sparklines data={indicator.history}>
      <SparklinesLine color="var(--primary)" strokeWidth={2} />
    </Sparklines>
  </div>
</div>
```

##### 뉴스 & 담론 섹션
```typescript
<div className="glass-card p-6 rounded-2xl">
  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
    <span className="text-4xl">📰</span>
    뉴스 & 담론
    <span className="text-sm text-muted-foreground">(AI 요약)</span>
  </h2>

  {/* 뉴스 카드 */}
  <div className="space-y-4">
    {news.map((item, i) => (
      <div
        key={i}
        className="p-4 border-l-4 border-primary/50 bg-background/50 rounded-r-xl hover:bg-primary/5 transition-colors fade-in-up"
        style={{ animationDelay: `${i * 0.1}s` }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.summary}</p>
          </div>
          <Badge>{item.sentiment === 'positive' ? '📈' : '📉'}</Badge>
        </div>
      </div>
    ))}
  </div>
</div>
```

##### 리스크 레이더 3D 효과
```typescript
// RiskRadar 컴포넌트에 3D 레이더 차트 적용
import { Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts';

<RadarChart width={400} height={400} data={riskData}>
  <defs>
    <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.8}/>
      <stop offset="100%" stopColor="var(--secondary)" stopOpacity={0.3}/>
    </linearGradient>
  </defs>
  <PolarGrid stroke="var(--border)" />
  <PolarAngleAxis dataKey="category" stroke="var(--foreground)" />
  <Radar
    dataKey="value"
    stroke="var(--primary)"
    fill="url(#radarGradient)"
    fillOpacity={0.6}
    strokeWidth={2}
  />
</RadarChart>
```

---

### 4.3 섹터/종목 페이지

#### 현재 상태
- ✅ 6대 산업군 탭
- ✅ 소분류 사이드바
- ✅ 분석 폼 (핵심기술, 거시경제, 성장동력 등)
- ⚠️ "너무 단촐하고 프로토타입 같음"

#### 개선 방향
**"산업별 색상 테마 + 인터랙티브 탭 + 풍부한 아이콘"**

##### 6대 산업군 탭 업그레이드
```typescript
const MAJOR_CATEGORIES_V2 = [
  {
    id: 'tech',
    name: '기술·데이터·인프라',
    icon: <Cpu className="w-6 h-6" />,  // lucide-react 아이콘
    gradient: 'from-blue-500 to-indigo-500',
    glow: 'rgba(59, 130, 246, 0.3)'
  },
  // ... 나머지 카테고리
];

<div className="flex flex-wrap gap-4 pb-6 border-b border-border">
  {MAJOR_CATEGORIES_V2.map((category, i) => (
    <button
      key={category.id}
      onClick={() => handleMajorClick(category.name)}
      className={`group relative px-6 py-4 rounded-2xl font-semibold transition-all ${
        expandedMajor === category.name
          ? `bg-gradient-to-br ${category.gradient} text-white shadow-2xl scale-105`
          : 'glass-card hover:scale-105'
      }`}
      style={{
        boxShadow: expandedMajor === category.name ? `0 0 40px ${category.glow}` : 'none'
      }}
    >
      <div className="flex items-center gap-3">
        {category.icon}
        <span>{category.name}</span>
      </div>

      {/* 선택된 탭에 빛나는 효과 */}
      {expandedMajor === category.name && (
        <div className="absolute inset-0 shimmer-effect rounded-2xl pointer-events-none" />
      )}
    </button>
  ))}
</div>
```

##### 소분류 사이드바 개선
```typescript
<aside className="w-64 shrink-0 space-y-3">
  {subIndustries.map((sub, i) => (
    <button
      key={i}
      onClick={() => handleSubIndustryClick(expandedMajor, sub)}
      className={`w-full p-4 rounded-xl text-left transition-all fade-in-up ${
        selectedSubIndustry?.sub === sub
          ? `bg-gradient-to-r ${currentCategory.gradient} text-white shadow-lg scale-105`
          : 'glass-card hover:scale-[1.02]'
      }`}
      style={{
        animationDelay: `${i * 0.05}s`,
        boxShadow: selectedSubIndustry?.sub === sub ? `0 0 20px ${currentCategory.glow}` : 'none'
      }}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">{getSubIndustryIcon(sub)}</div>
        <span className="font-medium">{sub}</span>
      </div>
    </button>
  ))}
</aside>
```

##### 분석 폼 섹션별 아이콘 & 색상
```typescript
const analysisSections = [
  { title: '🔬 핵심기술', color: 'blue', icon: <Microscope /> },
  { title: '💰 거시경제 영향', color: 'green', icon: <TrendingUp /> },
  { title: '📈 성장동력/KPI', color: 'purple', icon: <BarChart3 /> },
  { title: '🔗 가치사슬', color: 'orange', icon: <Link2 /> },
  { title: '📊 공급/수요 요인', color: 'red', icon: <Activity /> },
  { title: '🗺️ 시장 지도', color: 'teal', icon: <Map /> }
];

<div className="space-y-6">
  {analysisSections.map((section, i) => (
    <div
      key={i}
      className="glass-card p-6 rounded-2xl border-l-4 border-${section.color}-500 fade-in-up"
      style={{ animationDelay: `${i * 0.1}s` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-full bg-${section.color}-500/10`}>
          {section.icon}
        </div>
        <h3 className="text-xl font-bold text-foreground">{section.title}</h3>
      </div>

      {/* 폼 필드 */}
      <div className="space-y-3">
        {/* ... */}
      </div>
    </div>
  ))}
</div>
```

---

### 4.4 개별분석 페이지

#### 현재 상태
- ✅ "가장 낫지만 어설픔"
- ⚠️ 파일이 26,179 tokens로 매우 큼
- ⚠️ 디자인 완성도 향상 필요

#### 개선 방향
**"프로페셔널 리포트 레이아웃 + 차트 강화 + 인쇄 최적화"**

##### 상단 요약 카드
```typescript
<div className="glass-card p-8 rounded-3xl mb-8 shimmer-effect">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* 종목 정보 */}
    <div className="text-center">
      <div className="text-5xl mb-3">{stock.icon}</div>
      <h1 className="text-3xl font-bold text-foreground mb-2">{stock.name}</h1>
      <p className="text-muted-foreground">{stock.ticker}</p>
    </div>

    {/* 주요 지표 */}
    <div className="space-y-2">
      <MetricBadge label="현재가" value={stock.price} trend={stock.trend} />
      <MetricBadge label="시가총액" value={stock.marketCap} />
      <MetricBadge label="PER" value={stock.per} />
    </div>

    {/* 투자의견 */}
    <div className="text-center">
      <div className={`text-6xl mb-3 ${getOpinionColor(stock.opinion)}`}>
        {getOpinionIcon(stock.opinion)}
      </div>
      <p className="text-xl font-bold">{stock.opinion}</p>
    </div>
  </div>
</div>
```

##### 분석 섹션 탭
```typescript
const analysisTabs = ['재무분석', '밸류에이션', '리스크', '투자포인트'];

<div className="glass-card rounded-2xl overflow-hidden">
  {/* 탭 헤더 */}
  <div className="flex border-b border-border">
    {analysisTabs.map((tab, i) => (
      <button
        key={tab}
        className={`flex-1 px-6 py-4 font-semibold transition-all ${
          activeTab === i
            ? 'bg-gradient-to-r from-primary to-secondary text-white'
            : 'hover:bg-primary/5'
        }`}
        onClick={() => setActiveTab(i)}
      >
        {tab}
      </button>
    ))}
  </div>

  {/* 탭 내용 */}
  <div className="p-8">
    {renderTabContent(activeTab)}
  </div>
</div>
```

---

### 4.5 포트폴리오 페이지

#### 현재 상태
- ✅ EnhancedPortfolioForm (자산 추가 폼)
- ✅ PortfolioDashboard (대시보드)
- ✅ 거래 계획, 일일 할일 등 복잡한 기능
- ⚠️ "가장 먼저 만든 페이지답게 프로토타입 같음"

#### 개선 방향
**"3D 자산 시각화 + 게이미피케이션 + 실시간 애니메이션"**

##### 상단 요약 카드 3D
```typescript
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PieChart3D } from '@react-three/drei';

<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
  {/* 총 자산 카드 (3D 파이 차트) */}
  <div className="glass-card p-6 rounded-2xl col-span-2">
    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
      <TrendingUp className="text-primary" />
      총 자산
    </h2>
    <div className="h-64">
      <Canvas>
        <OrbitControls enableZoom={false} />
        <PieChart3D data={portfolioData} />
      </Canvas>
    </div>
  </div>

  {/* 수익률 카드 (애니메이션 카운터) */}
  <div className="glass-card p-6 rounded-2xl glow-effect">
    <h2 className="text-lg font-semibold mb-2 text-muted-foreground">수익률</h2>
    <CountUp
      end={totalReturn}
      duration={2}
      decimals={2}
      suffix="%"
      className="text-5xl font-bold text-primary"
    />
  </div>

  {/* 목표 달성률 (레벨업 효과) */}
  <div className="glass-card p-6 rounded-2xl">
    <h2 className="text-lg font-semibold mb-2 text-muted-foreground">목표 달성</h2>
    <div className="relative">
      <CircularProgress
        value={goalProgress}
        size={120}
        strokeWidth={12}
        color="primary"
      />
      {/* 레벨업 뱃지 */}
      {goalProgress >= 100 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl animate-bounce">🎉</span>
        </div>
      )}
    </div>
  </div>
</div>
```

##### 자산 테이블 호버 효과
```typescript
<table className="w-full">
  <tbody>
    {assets.map((asset, i) => (
      <tr
        key={asset.id}
        className="glass-card hover:scale-[1.02] hover:shadow-xl transition-all fade-in-up cursor-pointer"
        style={{ animationDelay: `${i * 0.05}s` }}
        onClick={() => router.push(`/portfolio/${asset.id}/analysis`)}
      >
        <td className="p-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{asset.icon}</div>
            <div>
              <p className="font-bold text-foreground">{asset.name}</p>
              <p className="text-sm text-muted-foreground">{asset.category}</p>
            </div>
          </div>
        </td>
        <td className="p-4 text-right">
          <p className="font-bold text-foreground">{formatCurrency(asset.amount)}</p>
          <p className={`text-sm ${asset.return > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {asset.return > 0 ? '↗' : '↘'} {Math.abs(asset.return)}%
          </p>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

##### 거래 계획 칸반 보드
```typescript
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  {['대기', '부분체결', '완료', '취소'].map((status) => (
    <div key={status} className="glass-card p-4 rounded-xl">
      <h3 className="font-bold mb-3 flex items-center gap-2">
        {getStatusIcon(status)}
        {status}
        <Badge>{getTradesByStatus(status).length}</Badge>
      </h3>

      {/* 드래그 앤 드롭 가능한 카드 */}
      <div className="space-y-2">
        {getTradesByStatus(status).map((trade) => (
          <div
            key={trade.id}
            className="p-3 bg-background/50 rounded-lg hover:bg-primary/5 transition-colors cursor-move"
            draggable
          >
            <p className="font-semibold text-foreground">{trade.symbol}</p>
            <p className="text-sm text-muted-foreground">{trade.condition}</p>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>
```

---

### 4.6 가계부 페이지

#### 현재 상태
- ✅ "디자인적으로 가장 나음"
- ✅ ExpenseManagementDashboard
- ⚠️ "약간의 개선 여지"

#### 개선 방향
**"예산 게이지 네온 효과 + 히트맵 캘린더 + 카테고리별 색상 스플래시"**

##### 예산 게이지 네온 효과
```typescript
<div className="glass-card p-6 rounded-2xl">
  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
    <Wallet className="text-primary" />
    월간 예산 현황
  </h2>

  <div className="space-y-4">
    {budgetCategories.map((category) => (
      <div key={category.name} className="fade-in-up">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold flex items-center gap-2">
            <span className="text-2xl">{category.icon}</span>
            {category.name}
          </span>
          <span className="text-sm text-muted-foreground">
            {category.spent} / {category.budget}
          </span>
        </div>

        {/* 네온 프로그레스 바 */}
        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
              category.progress > 90 ? 'bg-red-500 glow-effect' :
              category.progress > 70 ? 'bg-yellow-500 glow-effect' :
              'bg-green-500 glow-effect'
            }`}
            style={{
              width: `${category.progress}%`,
              boxShadow: `0 0 20px ${category.progress > 90 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)'}`
            }}
          />
        </div>
      </div>
    ))}
  </div>
</div>
```

##### 지출 히트맵 캘린더
```typescript
import CalendarHeatmap from 'react-calendar-heatmap';

<div className="glass-card p-6 rounded-2xl">
  <h2 className="text-2xl font-bold mb-6">지출 히트맵</h2>

  <CalendarHeatmap
    startDate={new Date('2025-01-01')}
    endDate={new Date('2025-12-31')}
    values={expenseHeatmapData}
    classForValue={(value) => {
      if (!value) return 'color-empty';
      if (value.count > 100000) return 'color-scale-high glow-effect';
      if (value.count > 50000) return 'color-scale-medium';
      return 'color-scale-low';
    }}
    tooltipDataAttrs={(value) => ({
      'data-tip': `${value.date}: ${formatCurrency(value.count)}`
    })}
  />

  <style jsx>{`
    .color-scale-high {
      fill: var(--primary);
      filter: drop-shadow(0 0 8px var(--primary-glow));
    }
    .color-scale-medium {
      fill: oklch(0.70 0.15 88);
    }
    .color-scale-low {
      fill: oklch(0.90 0.05 88);
    }
  `}</style>
</div>
```

##### 카테고리별 색상 스플래시
```typescript
const expenseColors = {
  '생활': { gradient: 'from-blue-500 to-cyan-500', icon: '🏠' },
  '건강': { gradient: 'from-green-500 to-emerald-500', icon: '💊' },
  '사회': { gradient: 'from-purple-500 to-pink-500', icon: '👥' },
  '여가': { gradient: 'from-orange-500 to-red-500', icon: '🎮' },
  '쇼핑': { gradient: 'from-yellow-500 to-amber-500', icon: '🛍️' }
};

<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
  {Object.entries(expenseColors).map(([category, style]) => (
    <div
      key={category}
      className={`glass-card p-6 rounded-2xl text-center hover:scale-105 transition-all cursor-pointer bg-gradient-to-br ${style.gradient} text-white`}
      onClick={() => filterByCategory(category)}
    >
      <div className="text-5xl mb-3">{style.icon}</div>
      <p className="font-bold text-lg">{category}</p>
      <p className="text-sm opacity-90">{getCategoryTotal(category)}</p>
    </div>
  ))}
</div>
```

---

### 4.7 계정설정 페이지

#### 현재 상태
- ✅ "기능적으로 단순해서 좋음"
- ⚠️ "디자인 약간 개선"

#### 개선 방향
**"프로필 카드 홀로그램 효과 + 토글 스위치 애니메이션 + Confetti"**

##### 프로필 카드
```typescript
<div className="glass-card p-8 rounded-3xl text-center shimmer-effect mb-8">
  {/* 프로필 이미지 (홀로그램 효과) */}
  <div className="relative inline-block mb-6">
    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary p-1">
      <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
        <User className="w-16 h-16 text-primary" />
      </div>
    </div>
    {/* 홀로그램 링 */}
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary opacity-20 blur-xl animate-spin-slow" />
  </div>

  <h2 className="text-3xl font-bold text-foreground mb-2">{user.username}</h2>
  <p className="text-muted-foreground">{user.email}</p>

  {/* 회원 등급 뱃지 */}
  <div className="mt-4">
    <Badge className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white text-lg">
      ⭐ Premium Member
    </Badge>
  </div>
</div>
```

##### 설정 토글 스위치
```typescript
const SettingToggle = ({ label, enabled, onChange }) => (
  <div className="glass-card p-6 rounded-xl flex items-center justify-between hover:scale-[1.02] transition-all">
    <div>
      <h3 className="font-semibold text-foreground">{label}</h3>
      <p className="text-sm text-muted-foreground mt-1">
        {enabled ? '활성화됨' : '비활성화됨'}
      </p>
    </div>

    {/* 애니메이션 토글 */}
    <button
      onClick={onChange}
      className={`relative w-14 h-8 rounded-full transition-all ${
        enabled ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-muted'
      }`}
    >
      <div
        className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);
```

##### 저장 성공 시 Confetti
```typescript
import Confetti from 'react-confetti';

const handleSaveSettings = async () => {
  // 저장 로직
  setShowConfetti(true);
  setTimeout(() => setShowConfetti(false), 3000);
};

{showConfetti && (
  <Confetti
    width={window.innerWidth}
    height={window.innerHeight}
    colors={['var(--primary)', 'var(--secondary)', '#FFD700', '#50C878']}
    recycle={false}
  />
)}
```

---

## 🚀 기술 스택 추가 패키지

### 필수 설치
```bash
# 애니메이션
npm install framer-motion
npm install react-spring
npm install @react-spring/web

# 파티클 배경
npm install particles-bg
# 또는
npm install tsparticles @tsparticles/react

# 3D 효과
npm install @react-three/fiber @react-three/drei three

# 타이핑 애니메이션
npm install react-type-animation

# 카운터 애니메이션
npm install react-countup

# 히트맵
npm install react-calendar-heatmap

# Confetti
npm install react-confetti

# 아이콘
npm install lucide-react

# 스파크라인
npm install react-sparklines

# Drag and Drop
npm install @dnd-kit/core @dnd-kit/sortable
```

---

## 📅 구현 타임라인

### Week 1 (Phase 1 + Phase 2)
**Day 1-2: 홈페이지**
- 파티클 배경 구현
- 글래스모피즘 히어로 섹션
- 3D 효과 (선택적)
- 퀵 네비게이션 카드

**Day 3-4: 색상 시스템**
- globals.css V2 업데이트
- theme.ts 확장
- 유틸리티 클래스 추가

**Day 5: 테스트 & 피드백**
- 홈페이지 + 색상 시스템 통합 테스트
- 반응형 확인

### Week 2 (Phase 3)
**Day 1-2: 컴포넌트 현대화**
- EnhancedButton, GlassCard 컴포넌트
- 차트 V2 테마
- Shimmer/Glow 효과

**Day 3-5: 페이지 적용 시작**
- 투자철학 페이지 업그레이드
- 경제지표 페이지 업그레이드

### Week 3 (Phase 4)
**Day 1-2: 나머지 페이지**
- 섹터/종목 페이지
- 개별분석 페이지

**Day 3-4: 포트폴리오 & 가계부**
- 포트폴리오 3D 시각화
- 가계부 히트맵

**Day 5: 최종 마무리**
- 계정설정 페이지
- 전체 QA
- 성능 최적화

---

## ✅ 체크리스트

### Phase 1 완료 기준
- [ ] 홈페이지 파티클 배경 작동
- [ ] 글래스모피즘 히어로 섹션 구현
- [ ] 타이핑 애니메이션 유지
- [ ] 퀵 네비게이션 카드 4개 작동
- [ ] 반응형 확인 (모바일/태블릿/데스크톱)

### Phase 2 완료 기준
- [ ] globals.css V2 색상 변수 적용
- [ ] theme.ts VISUAL_EFFECTS 추가
- [ ] Shimmer 애니메이션 작동
- [ ] Glow 효과 작동
- [ ] 다크모드 호환성 확인

### Phase 3 완료 기준
- [ ] GlassCard 컴포넌트 생성
- [ ] EnhancedButton 컴포넌트 생성
- [ ] Ripple 효과 작동
- [ ] 차트 V2 테마 적용
- [ ] 모든 페이지에 적용

### Phase 4 완료 기준
- [ ] 투자철학 페이지 업그레이드
- [ ] 경제지표 페이지 업그레이드
- [ ] 섹터/종목 페이지 업그레이드
- [ ] 개별분석 페이지 업그레이드
- [ ] 포트폴리오 페이지 업그레이드
- [ ] 가계부 페이지 업그레이드
- [ ] 계정설정 페이지 업그레이드

---

## 🎓 참고 자료

### 디자인 트렌드 (2025)
- **Glassmorphism**: https://glassmorphism.com
- **Neumorphism**: https://neumorphism.io
- **Color Gradients**: https://uigradients.com
- **Animation Inspiration**: https://animista.net

### 기술 문서
- **Framer Motion**: https://www.framer.com/motion/
- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Recharts**: https://recharts.org/en-US

### 내부 문서
- `projects/investment-app/CLAUDE.md` - 프로젝트 컨텍스트
- `projects/investment-app/docs/` - 기술 가이드

---

**문서 버전**: 1.0
**최종 업데이트**: 2025-12-29
**작성자**: Claude Code Assistant
**승인 대기**: Partner
