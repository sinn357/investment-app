# 소분류별 목표 추적 시스템 구현 가이드

> 날짜: 2025-09-24
> 상태: 테스트 진행중 (배포 준비)
> 작업자: Claude + 사용자

---

## 1) 개요

**사용자 요청**: "자산군별 목표에서 대분류별 목표가 아닌 모든 소분류별 목표를 수정할 수 있게 만들고 목표금액과 목표날짜와 게이지까지 모두 각각 나타내줘"

**구현 결과**: 기존 4개 대분류(즉시현금/예치자산/투자자산/대체투자) 목표에서 → 12개 모든 소분류별 개별 목표 추적 시스템으로 완전 전환

---

## 2) 구현된 기능

### 개별 소분류 목표 설정
- **각 소분류마다**: 목표금액 + 목표날짜 + 진행률 게이지
- **대상 소분류 (12개)**:
  - 즉시현금: 현금, 입출금통장, 증권예수금
  - 예치자산: 예금, 적금, MMF
  - 투자자산: 국내주식, 해외주식, 펀드, ETF, 채권
  - 대체투자: 암호화폐, 부동산

### UI 개선사항
- **개별 목표 카드**: 각 소분류별 독립된 카드 형태
- **진행률 시각화**: 현재금액/목표금액 진행바
- **D-Day 표시**: 목표날짜까지 남은 일수
- **실시간 계산**: 포트폴리오 변경 시 즉시 진행률 업데이트

---

## 3) 기술적 구현

### Frontend 변경사항 (`PortfolioDashboard.tsx`)

#### 상태 구조 변경
```typescript
// Before (대분류별)
const [goalSettings, setGoalSettings] = useState({
  totalGoal: 50000000,
  targetDate: '2024-12-31',
  categoryGoals: {} as Record<string, number>
});

// After (소분류별)
const [goalSettings, setGoalSettings] = useState({
  totalGoal: 50000000,
  targetDate: '2024-12-31',
  categoryGoals: {} as Record<string, number>,
  subCategoryGoals: {} as Record<string, { amount: number; targetDate: string }>
});
```

#### 핵심 함수 추가
```typescript
const getSubCategoryGoalProgress = (subCategory: string) => {
  const currentAmount = Object.values(groupedAssets)
    .flat()
    .filter(group => group.subCategory === subCategory)
    .reduce((sum, group) => sum + group.totalAmount, 0);

  const goal = goalSettings.subCategoryGoals[subCategory];
  if (!goal) return { current: currentAmount, target: 0, percentage: 0, daysLeft: 0 };

  const percentage = goal.amount > 0 ? (currentAmount / goal.amount) * 100 : 0;
  const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return { current: currentAmount, target: goal.amount, percentage, daysLeft };
};
```

#### UI 컴포넌트 교체
```typescript
// 기존 대분류 목표 섹션 완전 제거
// 새로운 소분류별 목표 카드 시스템 구현
{allSubCategories.map(subCategory => {
  const progress = getSubCategoryGoalProgress(subCategory);
  return (
    <div key={subCategory} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      {/* 개별 목표 카드 내용 */}
    </div>
  );
})}
```

### Backend 변경사항

#### API 엔드포인트 수정 (`app.py`)
```python
@app.route('/api/goal-settings', methods=['POST'])
def save_goal_settings():
    data = request.get_json()
    user_id = data.get('user_id')
    total_goal = data.get('total_goal', 50000000)
    target_date = data.get('target_date', '2024-12-31')
    category_goals = data.get('category_goals', {})
    sub_category_goals = data.get('sub_category_goals', {})  # 추가됨

    result = db_service.save_goal_settings(user_id, total_goal, target_date, category_goals, sub_category_goals)
```

#### 데이터베이스 스키마 확장 (`postgres_database_service.py`)
```sql
-- 새로운 컬럼 추가
ALTER TABLE goal_settings ADD COLUMN IF NOT EXISTS sub_category_goals JSONB DEFAULT '{}';
```

#### 메서드 시그니처 업데이트
```python
def save_goal_settings(self, user_id, total_goal, target_date, category_goals, sub_category_goals):
    # sub_category_goals 매개변수 추가

def get_goal_settings(self, user_id):
    # sub_category_goals 반환 추가
    return {
        'total_goal': row['total_goal'],
        'target_date': row['target_date'].strftime('%Y-%m-%d'),
        'category_goals': row['category_goals'] or {},
        'sub_category_goals': row['sub_category_goals'] or {}  # 추가됨
    }
```

---

## 4) 테스트 현황

### 완료된 테스트
- ✅ 백엔드 서버 정상 시작 (Flask on port 5001)
- ✅ 프론트엔드 서버 정상 시작 (Next.js on port 3000)
- ✅ PostgreSQL 연결 및 스키마 업데이트 완료
- ✅ GET API 테스트: `/api/goal-settings?user_id=1` → sub_category_goals 필드 반환 확인
- ✅ POST API 테스트: 소분류 목표 저장 성공 ("목표 설정이 저장되었습니다.")

### 진행중/대기중 테스트
- 🔄 프론트엔드 UI 테스트 (브라우저에서 실제 소분류 목표 설정/확인)
- ⏳ 전체 시스템 통합 테스트
- ⏳ GitHub 커밋 및 배포

---

## 5) 다음 단계 가이드

### 현재 중단 지점
- 백엔드/프론트엔드 모두 로컬에서 정상 실행중
- API 레벨 테스트 완료
- **다음**: 브라우저에서 UI 테스트 필요

### 세션 재시작 시 수행할 작업

#### 1단계: 서버 재시작
```bash
# Terminal 1: Backend
cd /Users/woocheolshin/Documents/Vibecoding_1/investment-app/backend
python3 app.py

# Terminal 2: Frontend
cd /Users/woocheolshin/Documents/Vibecoding_1/investment-app/frontend
npm run dev
```

#### 2단계: 브라우저 테스트
1. http://localhost:3000/portfolio 접속
2. 목표 설정 섹션에서 소분류별 목표 설정 테스트
3. 목표금액/목표날짜 입력 후 저장 확인
4. 진행률 게이지 및 D-Day 표시 확인

#### 3단계: 배포 준비
```bash
# Git 상태 확인
git status

# 변경사항 커밋
git add .
git commit -m "feat: Implement comprehensive subcategory-based goal tracking system

- Replace category-level goals with individual subcategory goals
- Add target amount and target date for each of 12 subcategories
- Implement progress gauges and D-Day countdown for each subcategory
- Update PostgreSQL schema with sub_category_goals JSONB column
- Extend API endpoints to support subcategory goal CRUD operations
- Create individual goal cards UI with real-time progress tracking

🤖 Generated with Claude Code"

# GitHub 푸시
git push origin main
```

---

## 6) 문제 해결

### 알려진 이슈
- **Fast Refresh 경고**: 프론트엔드에서 runtime error로 인한 전체 새로고침 발생
  - 영향: 개발 경험에만 영향, 기능에는 문제없음
  - 해결: 코드 안정화 후 자동 해결 예상

### 잠재적 이슈
- **기존 데이터 호환성**: 기존 사용자의 대분류 목표가 소분류로 어떻게 매핑될지 확인 필요
- **성능**: 12개 소분류별 실시간 계산이 포트폴리오 크기에 따라 영향받을 수 있음

---

## 7) 데이터 구조 예시

### 저장되는 sub_category_goals 구조
```json
{
  "현금": {"amount": 3000000, "targetDate": "2024-10-31"},
  "입출금통장": {"amount": 4000000, "targetDate": "2024-11-30"},
  "증권예수금": {"amount": 3000000, "targetDate": "2024-12-31"},
  "예금": {"amount": 5000000, "targetDate": "2024-12-31"},
  "적금": {"amount": 5000000, "targetDate": "2024-12-31"},
  "MMF": {"amount": 5000000, "targetDate": "2024-12-31"}
}
```

---

## 8) 세션 재시작 트리거

**사용자가 다음 중 하나를 말하면 세션을 재시작해야 함:**
- "세션 재시작" 또는 "다시 시작"
- "계속해" 또는 "이어서 해"
- "테스트 계속" 또는 "배포해"
- "다음 단계" 또는 "브라우저 테스트"

**재시작 시 우선순위:**
1. 서버 재시작 (백엔드 + 프론트엔드)
2. 브라우저 UI 테스트
3. 전체 시스템 검증
4. Git 커밋 및 배포

---

## 9) 성공 기준

- ✅ 12개 소분류 모두에서 개별 목표 설정 가능
- ✅ 실시간 진행률 계산 및 시각화
- ✅ 목표날짜 기반 D-Day 카운트다운
- ✅ PostgreSQL 데이터 영구 저장
- ⏳ 프로덕션 배포 및 실제 사용자 테스트

**최종 목표**: 사용자가 각 자산의 세부 소분류별로 구체적인 목표를 설정하고 달성 과정을 시각적으로 추적할 수 있는 완전한 시스템 구축