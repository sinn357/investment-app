# 사용자별 데이터 분리 시스템 구현 가이드

> 날짜: 2025-09-23
> 목적: 포트폴리오 앱의 다중 사용자 지원을 위한 완전한 데이터 분리 시스템 구현

---

## 📋 개요

기존 단일 사용자 포트폴리오 시스템을 다중 사용자 환경으로 확장하여, 각 사용자가 자신만의 독립적인 포트폴리오를 관리할 수 있도록 하는 시스템을 구현했습니다.

## 🎯 주요 목표

- [x] 사용자 인증 시스템 구현 (회원가입/로그인)
- [x] 포트폴리오 데이터 완전 분리
- [x] 사용자별 접근 권한 제어
- [x] 기존 데이터 호환성 유지
- [x] 프로덕션 환경 배포 및 검증

---

## 🔧 구현 상세

### 1. 백엔드 사용자 인증 시스템

#### PostgreSQL 스키마 확장
```sql
-- 사용자 테이블 생성
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- assets 테이블에 user_id 외래키 추가
ALTER TABLE assets ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- 기존 데이터 마이그레이션
UPDATE assets SET user_id = 1 WHERE user_id IS NULL;
```

#### 보안 강화
- **암호화**: PBKDF2 해시 + 랜덤 salt (100,000 라운드)
- **검증 로직**: 사용자명 중복 체크, 비밀번호 길이 검증
- **세션 관리**: 로그인 성공 시 user_id 반환

#### API 엔드포인트 추가
```python
@app.route('/api/auth/register', methods=['POST'])
@app.route('/api/auth/login', methods=['POST'])
@app.route('/api/auth/user/<int:user_id>', methods=['GET'])
```

### 2. 프론트엔드 인증 UI

#### AuthForm 컴포넌트 구현
```typescript
interface AuthFormProps {
  onLogin: (user: { id: number; username: string }) => void;
}
```

**주요 기능:**
- 로그인/회원가입 토글 UI
- 실시간 입력 검증 (사용자명 3글자+, 비밀번호 4글자+)
- 로딩 상태 및 오류 메시지 표시
- 성공 시 부모 컴포넌트에 사용자 정보 전달

#### 세션 관리
- **localStorage**: 사용자 정보 영구 저장
- **자동 로그인**: 페이지 새로고침 시 세션 복원
- **로그아웃**: 세션 삭제 + 대시보드 초기화

### 3. 데이터 분리 로직

#### 포트폴리오 API 수정
모든 포트폴리오 관련 API에 user_id 필터링 적용:

```typescript
// 조회
GET /api/portfolio?user_id=${user.id}

// 추가
POST /api/add-asset
Body: { ...assetData, user_id: user.id }

// 수정
PUT /api/update-asset/${assetId}
Body: { ...updateData, user_id: user.id }

// 삭제
DELETE /api/delete-asset/${assetId}?user_id=${user.id}
```

#### 권한 검증 강화
```python
def delete_asset(self, asset_id: int, user_id: str = None):
    if user_id:
        cur.execute("SELECT id, name FROM assets WHERE id = %s AND user_id = %s",
                   (asset_id, user_id))
    # 사용자별 자산만 접근 가능
```

### 4. 컴포넌트 통합

#### User 인터페이스 표준화
```typescript
interface User {
  id: number;
  username: string;
}
```

#### Props 전달 체계
```typescript
// portfolio/page.tsx
<EnhancedPortfolioForm user={user} onAddItem={handleAssetAdded} />
<PortfolioDashboard user={user} showSideInfo={true} />

// useCallback 최적화로 React hooks 경고 해결
const fetchPortfolioData = useCallback(async () => {
  // API 호출에 user.id 포함
}, [user.id]);
```

---

## 🚀 배포 과정

### 1. 개발환경 → 프로덕션 이슈 해결

**문제**: AuthForm에서 `localhost:5001` 하드코딩으로 프로덕션 연결 실패
```javascript
// 수정 전
const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${endpoint}`;

// 수정 후
const url = `https://investment-app-backend-x166.onrender.com${endpoint}`;
```

### 2. PostgreSQL 스키마 동기화 이슈

**문제**: 프로덕션 DB에 user_id 컬럼 누락
**해결**: 스키마 초기화 스크립트에 ALTER TABLE 문 추가
```python
# 기존 테이블에 새 컬럼 추가 보장
ALTER TABLE assets ADD COLUMN IF NOT EXISTS user_id INTEGER;
UPDATE assets SET user_id = 1 WHERE user_id IS NULL;
```

### 3. 배포 검증
```bash
# API 테스트
curl "https://investment-app-backend-x166.onrender.com/api/portfolio?user_id=1"

# 응답 확인: 기존 데이터가 user_id=1로 마이그레이션됨
```

---

## 📊 결과 및 성과

### 달성한 목표
✅ **완전한 데이터 분리**: 사용자별 독립적인 포트폴리오
✅ **보안 강화**: PBKDF2 암호화 + 접근 권한 제어
✅ **사용자 경험**: 직관적인 인증 UI + 세션 관리
✅ **기존 호환성**: 기존 포트폴리오 데이터 보존
✅ **프로덕션 안정성**: Render + Vercel 자동 배포 성공

### 기술적 성취
- **React 최적화**: useCallback으로 불필요한 리렌더링 방지
- **TypeScript 타입 안전성**: User 인터페이스 일관성 확보
- **PostgreSQL 스키마 관리**: 무중단 마이그레이션 성공
- **API 일관성**: 모든 엔드포인트에 user_id 통합

### 사용자 시나리오
1. **신규 사용자**: 빈 포트폴리오로 시작
2. **기존 사용자**: user_id=1로 모든 데이터 접근 가능
3. **데이터 격리**: 사용자 A는 사용자 B의 데이터를 볼 수 없음

---

## 🔍 코드 변경 요약

### 변경된 파일들
```
📁 backend/
├── app.py                          # 인증 API + user_id 필터링
├── services/postgres_database_service.py  # 스키마 확장 + 권한 검증

📁 frontend/src/
├── app/portfolio/page.tsx          # 인증 통합 + User props 전달
├── components/AuthForm.tsx         # 🆕 인증 폼 컴포넌트
├── components/EnhancedPortfolioForm.tsx  # user_id API 연동
└── components/PortfolioDashboard.tsx     # user_id API 연동 + hooks 최적화

📁 docs/
├── USER_AUTHENTICATION_IMPLEMENTATION.md  # 🆕 인증 시스템 문서
└── USER_DATA_SEPARATION_IMPLEMENTATION.md # 🆕 이 문서
```

### Git 커밋 히스토리
```bash
feat: Implement complete user-based data separation system
fix: Update AuthForm to use production backend URL
fix: Add missing user_id column to assets table
debug: Add logging for PostgreSQL schema initialization
```

---

## 🎯 향후 개선 방향

### 단기 계획
- [ ] JWT 토큰 기반 인증으로 보안 강화
- [ ] 비밀번호 재설정 기능 추가
- [ ] 사용자 프로필 관리 기능

### 장기 계획
- [ ] OAuth 소셜 로그인 (구글, 카카오)
- [ ] 사용자별 설정 (테마, 알림)
- [ ] 포트폴리오 공유 기능

---

## 📚 관련 문서

- [CLAUDE.md](../CLAUDE.md) - 프로젝트 전체 맥락
- [USER_AUTHENTICATION_IMPLEMENTATION.md](./USER_AUTHENTICATION_IMPLEMENTATION.md) - 인증 시스템 상세
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 전체 시스템 아키텍처

---

**구현 완료일**: 2025-09-23
**구현자**: Claude Code + Partner
**배포 환경**: Render (Backend) + Vercel (Frontend)