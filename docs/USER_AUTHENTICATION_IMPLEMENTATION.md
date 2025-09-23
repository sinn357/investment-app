# 사용자 인증 시스템 구현 가이드

## 개요

포트폴리오 관리 페이지에 비밀번호 기반 사용자 인증 시스템을 구현하여 계정별로 독립적인 데이터를 관리할 수 있는 시스템 구축

### 구현일: 2025-09-23
### 상태: 🔄 진행중 (컴포넌트 연동 단계)
### 요청: "포트폴리오 관리 페이지에 비밀번호로 계정을 생성해서 계정별로 각자의 데이터를 가질 수 있게 만들자"

---

## 📋 구현 완료 기능

### 1. 백엔드 사용자 인증 시스템
- **PostgreSQL users 테이블 추가**
- **PBKDF2 암호화**: salt + hash 보안 저장
- **인증 API 구현**: `/api/auth/register`, `/api/auth/login`, `/api/auth/user/<id>`
- **기존 API 확장**: user_id 기반 데이터 필터링

### 2. 프론트엔드 인증 UI
- **AuthForm 컴포넌트**: 로그인/회원가입 통합 폼
- **세션 관리**: localStorage 기반 사용자 정보 저장
- **포트폴리오 페이지 통합**: 인증 상태에 따른 조건부 렌더링

---

## 🏗️ 백엔드 아키텍처

### PostgreSQL 스키마 변경
```sql
-- users 테이블 추가
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기존 테이블에 user_id 외래키 추가
ALTER TABLE assets ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE goal_settings ADD COLUMN user_id INTEGER REFERENCES users(id);
```

### 보안 시스템
```python
def _hash_password(self, password: str) -> str:
    salt = secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return salt + ':' + password_hash.hex()

def _verify_password(self, stored_password: str, provided_password: str) -> bool:
    salt, stored_hash = stored_password.split(':')
    password_hash = hashlib.pbkdf2_hmac('sha256', provided_password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return stored_hash == password_hash.hex()
```

### 인증 API 엔드포인트
```python
@app.route('/api/auth/register', methods=['POST'])
def register():
    # 사용자 생성 로직

@app.route('/api/auth/login', methods=['POST'])
def login():
    # 사용자 인증 로직

@app.route('/api/auth/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    # 사용자 정보 조회
```

---

## 🎨 프론트엔드 구조

### AuthForm 컴포넌트
```tsx
interface AuthFormProps {
  onLogin: (user: { id: number; username: string }) => void;
}

// 로그인/회원가입 토글
const [isLogin, setIsLogin] = useState(true);

// API 호출 및 사용자 정보 전달
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${endpoint}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData),
});
```

### 포트폴리오 페이지 통합
```tsx
// 사용자 상태 관리
const [user, setUser] = useState<User | null>(null);

// localStorage 세션 관리
useEffect(() => {
  const savedUser = localStorage.getItem('portfolio_user');
  if (savedUser) {
    setUser(JSON.parse(savedUser));
  }
}, []);

// 조건부 렌더링
if (!user) {
  return <AuthForm onLogin={handleLogin} />;
}
```

---

## 🔄 현재 진행 상황

### ✅ 완료된 작업
1. PostgreSQL 스키마 설계 및 구현
2. PBKDF2 기반 암호 해싱 시스템
3. 사용자 CRUD API (생성/인증/조회)
4. AuthForm 컴포넌트 구현
5. 포트폴리오 페이지 인증 통합
6. localStorage 기반 세션 관리

### 🔄 진행중인 작업
**컴포넌트 사용자 연동**: 기존 포트폴리오 컴포넌트들이 user prop을 받아 user_id 기반으로 데이터를 처리하도록 수정

#### 현재 위치: EnhancedPortfolioForm 수정 중
- **파일**: `frontend/src/components/EnhancedPortfolioForm.tsx`
- **작업**:
  1. 인터페이스에 user prop 추가
  2. API 호출 시 user_id 포함
  3. 폼 제출 데이터에 user_id 추가

#### 다음 작업: PortfolioDashboard 수정
- **파일**: `frontend/src/components/PortfolioDashboard.tsx`
- **작업**:
  1. user prop 인터페이스 추가
  2. 포트폴리오 데이터 조회 API에 user_id 쿼리 추가
  3. 목표 설정 API 호출에 user_id 포함

---

## 🚀 재시작 명령어

토큰 한계로 중단된 작업을 재시작하려면:

**"사용자 인증 시스템 컴포넌트 연동 작업을 계속해줘"**

또는

**"EnhancedPortfolioForm과 PortfolioDashboard에 user prop 추가하고 user_id 연동 완료해줘"**

---

## 📊 작업 진행률

- ✅ **백엔드 인증 시스템**: 100% 완료
- ✅ **프론트엔드 인증 UI**: 100% 완료
- ✅ **포트폴리오 페이지 통합**: 100% 완료
- 🔄 **컴포넌트 사용자 연동**: 30% 진행중
- ⏳ **엔드투엔드 테스트**: 대기중

---

## 🔧 기술 스택

### 백엔드
- **데이터베이스**: PostgreSQL (Neon.tech)
- **암호화**: PBKDF2 + 랜덤 salt
- **API**: Flask RESTful endpoints
- **보안**: 100,000 iterations PBKDF2

### 프론트엔드
- **인증 상태**: React useState + localStorage
- **API 통신**: fetch + JSON
- **UI**: Tailwind CSS + 다크모드 지원
- **폼 검증**: 클라이언트 사이드 validation

---

## 🎯 예상 결과

구현 완료 시:
1. **계정 생성**: 사용자명 + 비밀번호로 계정 생성
2. **로그인**: 기존 계정으로 로그인/로그아웃
3. **데이터 분리**: 각 사용자의 포트폴리오 데이터 완전 격리
4. **세션 관리**: 새로고침 후에도 로그인 상태 유지
5. **보안**: 해시된 비밀번호, 안전한 인증 플로우

---

## 📝 관련 문서

- [CLAUDE.md - Tasks 및 ADR](../CLAUDE.md)
- [포트폴리오 관리 구현 가이드](./PORTFOLIO_MANAGEMENT_IMPLEMENTATION.md)
- [2단계 카테고리 시스템 구현](./2TIER_CATEGORY_COMPLETE_IMPLEMENTATION.md)