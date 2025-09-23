# 계정 관리 웹 UI 시스템 구현 가이드

## 개요

포트폴리오 관리 시스템에 완전한 웹 기반 계정 관리 인터페이스를 구현하여 사용자가 비밀번호 변경, 계정 삭제, 계정 설정 등을 웹사이트에서 직접 할 수 있는 시스템 구축

### 구현일: 2025-09-23
### 상태: ✅ 완료 (JWT 토큰 생성 버그 수정 포함)
### 요청: "그걸 웹사이트 상에서도 할수있게 해야지. 사용자가 자신의 계정을 삭제하거나 비밀번호를 변경하는 기능을 만들어야지."

---

## 📋 구현 완료 기능

### 1. 계정 설정 웹 페이지 (/settings)
- **인증 검증**: localStorage 기반 사용자 상태 확인
- **자동 리다이렉션**: 미인증 사용자 포트폴리오 페이지로 이동
- **세션 관리**: portfolio_user + auth_token 이중 확인

### 2. AccountSettings 컴포넌트 (280+ 라인)
- **탭 기반 UI**: 비밀번호 변경 / 계정 삭제 분리
- **비밀번호 변경**: 현재 비밀번호 검증 + 새 비밀번호 확인
- **계정 삭제**: 확인 문구 입력 + 3초 지연 로그아웃
- **성공 상태**: 비밀번호 변경 후 "포트폴리오로 돌아가기" 버튼

### 3. 네비게이션 통합
- **포트폴리오 헤더**: 계정 설정 버튼 추가
- **Next.js 라우팅**: useRouter 기반 SPA 네비게이션
- **일관된 디자인**: 기존 UI와 통합된 스타일

---

## 🏗️ 백엔드 API 확장

### 비밀번호 변경 API
```python
@app.route('/api/auth/change-password', methods=['PUT'])
def change_password():
    # JWT 토큰 검증
    # 현재 비밀번호 확인
    # 새 비밀번호 해싱 및 저장
    return jsonify({"status": "success", "message": "비밀번호가 변경되었습니다."})
```

### 계정 삭제 API
```python
@app.route('/api/auth/delete-account', methods=['DELETE'])
def delete_account():
    # JWT 토큰 검증
    # 비밀번호 확인
    # 사용자 데이터 완전 삭제
    return jsonify({"status": "success", "message": "계정이 삭제되었습니다."})
```

### CORS 설정 강화
```python
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = Response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        return response
```

---

## 🎨 프론트엔드 컴포넌트 구조

### AccountSettings.tsx 핵심 기능
```typescript
interface AccountSettingsProps {
  user: User;
  onLogout: () => void;
}

// 탭 상태 관리
const [activeTab, setActiveTab] = useState<'password' | 'delete'>('password');

// 비밀번호 변경 성공 상태
const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

// 비밀번호 변경 폼
const [passwordForm, setPasswordForm] = useState({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 계정 삭제 폼
const [deleteForm, setDeleteForm] = useState({
  password: '',
  confirmDelete: ''
});
```

### Settings 페이지 (/settings)
```typescript
export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('portfolio_user');
    const savedToken = localStorage.getItem('auth_token');

    if (!savedUser || !savedToken) {
      router.push('/portfolio');
      return;
    }
    // 사용자 정보 로드 및 설정
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AccountSettings user={user} onLogout={handleLogout} />
    </div>
  );
}
```

---

## 🔧 주요 버그 수정 과정

### 1. get_user_by_id password_hash 누락 버그
**증상**: 비밀번호 변경 시 500 Internal Server Error
```bash
PUT https://investment-app-backend-x166.onrender.com/api/auth/change-password 500 (Internal Server Error)
```

**원인**: PostgreSQL 쿼리에서 password_hash 필드 누락
```python
# 수정 전 (backend/services/postgres_database_service.py:1047)
cur.execute("SELECT id, username, created_at FROM users WHERE id = %s", (user_id,))

# 수정 후
cur.execute("SELECT id, username, password_hash, created_at FROM users WHERE id = %s", (user_id,))
```

### 2. Next.js 네비게이션 문제
**증상**: 계정 설정 링크 클릭 시 페이지 이동 실패
```html
<!-- 문제가 있던 코드 -->
<a href="/settings">계정 설정</a>

<!-- 수정된 코드 -->
<button onClick={() => router.push('/settings')}>계정 설정</button>
```

### 3. CORS Preflight 요청 처리
**증상**: OPTIONS 요청 시 CORS 정책 오류
```javascript
Access to fetch at 'https://investment-app-backend-x166.onrender.com/api/goal-settings?user_id=10'
from origin 'https://investment-app-rust-one.vercel.app' has been blocked by CORS policy
```

**해결**: OPTIONS 메서드 전용 핸들러 추가

### 4. JWT 토큰 생성 누락 (핵심 버그)
**증상**: 새 계정 생성 후 계정 설정 접근 불가
```javascript
Settings page - savedUser: {"id":12,"username":"신형석"}
Settings page - savedToken: null
```

**원인**: 회원가입 API에서 JWT 토큰 미생성
```python
# 수정 전: 로그인 API에만 토큰 생성
# 수정 후: 회원가입 API에도 토큰 생성 추가
if result.get('status') == 'success':
    user_id = result.get('user_id')
    username = result.get('username')
    if user_id and username:
        token = db_service.generate_jwt_token(user_id, username)
        result['token'] = token
```

---

## 🛡️ 보안 강화 사항

### 클라이언트 검증
```typescript
// 비밀번호 일치 확인
if (passwordForm.newPassword !== passwordForm.confirmPassword) {
  setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
}

// 최소 길이 검증
if (passwordForm.newPassword.length < 6) {
  setMessage({ type: 'error', text: '새 비밀번호는 6자리 이상이어야 합니다.' });
}

// 계정 삭제 확인 문구 검증
if (deleteForm.confirmDelete !== '계정 삭제') {
  setMessage({ type: 'error', text: '"계정 삭제"라고 정확히 입력해주세요.' });
}
```

### 서버 사이드 검증
- JWT 토큰 기반 인증 확인
- 현재 비밀번호 해시 검증
- 사용자 권한 확인 후 작업 실행

---

## 🎯 사용자 경험 개선

### 비밀번호 변경 성공 플로우
1. **변경 완료**: 성공 메시지 + 체크마크 표시
2. **폼 숨김**: 입력 섹션 대신 성공 상태 표시
3. **돌아가기**: "포트폴리오로 돌아가기" 버튼 제공
4. **자동 이동**: 클릭 시 메인 대시보드로 이동

### 계정 삭제 안전장치
1. **경고 표시**: 영구 삭제 주의사항 명시
2. **이중 확인**: 비밀번호 + "계정 삭제" 문구 입력
3. **지연 처리**: 3초 후 자동 로그아웃으로 실수 방지

---

## 🔄 디버깅 과정 기록

### 단계별 문제 해결
1. **백엔드 먹통 현상**: Render 서버 30분 비활성화 슬립 → 서버 재시작
2. **GET 쿼리 오류**: password_hash 필드 누락 → SQL 쿼리 수정
3. **네비게이션 실패**: HTML anchor 태그 → Next.js useRouter
4. **CORS 정책 차단**: preflight 핸들러 누락 → OPTIONS 메서드 추가
5. **신규 계정 토큰 없음**: 회원가입 API 토큰 누락 → JWT 생성 로직 추가

### 사용자 피드백 기반 개선
- "비밀번호 변경해도 비밀번호 변경 실패라고 나오네" → 백엔드 500 오류 수정
- "계정을 만들어보니 계정설정페이지로 넘어가지지 않고 계속 대시보드에 머무네" → 네비게이션 방식 변경
- "새로운 계정을 만들고 계정설정에 들어가려니 여전히 안되지만" → JWT 토큰 생성 누락 발견
- "로그아웃을 했다가 다시 로그인한 경우에만 계정설정이 돼" → 회원가입/로그인 API 토큰 생성 차이 해결

---

## 🚀 배포 및 검증

### GitHub → Render 자동 배포
```bash
git add backend/app.py frontend/src/components/AccountSettings.tsx frontend/src/app/settings/page.tsx
git commit -m "fix: Generate JWT token in registration API for immediate account settings access"
git push origin main
```

### 배포 내용
- ✅ **백엔드 수정**: JWT 토큰 생성 버그 수정
- ✅ **프론트엔드 완성**: 계정 관리 전체 UI 구현
- ✅ **CORS 해결**: preflight 요청 처리 완료
- ✅ **네비게이션 정상화**: Next.js 라우팅 적용

---

## 📊 최종 결과

### ✅ 완료된 기능
1. **웹 기반 계정 관리**: 완전한 계정 설정 웹 인터페이스
2. **비밀번호 변경**: 안전한 비밀번호 변경 + 성공 피드백
3. **계정 삭제**: 확인 절차 + 안전장치 포함 계정 삭제
4. **네비게이션**: 포트폴리오 ↔ 계정설정 자유로운 이동
5. **인증 플로우**: 회원가입부터 계정관리까지 완전한 인증 시스템

### 🎯 사용자 경험
- 계정 생성 즉시 계정 설정 접근 가능
- 비밀번호 변경 후 명확한 성공 피드백
- 실수 방지를 위한 다중 확인 절차
- 일관된 UI/UX 디자인

### 🔧 기술적 성과
- React TypeScript 기반 견고한 컴포넌트
- JWT 인증 시스템 완전 구현
- PostgreSQL 기반 안전한 데이터 저장
- Next.js SPA 라우팅 최적화
- CORS 정책 완전 해결

---

## 📝 관련 문서

- [사용자 인증 시스템 구현 가이드](./USER_AUTHENTICATION_IMPLEMENTATION.md)
- [CLAUDE.md - Tasks 및 ADR](../CLAUDE.md)
- [포트폴리오 관리 구현 가이드](./PORTFOLIO_MANAGEMENT_IMPLEMENTATION.md)

---

## 🔮 향후 확장 가능성

### 추가 기능 아이디어
- 프로필 정보 수정 (이메일, 이름)
- 계정 비활성화 (소프트 삭제)
- 로그인 히스토리 조회
- 2단계 인증 (2FA) 설정
- 비밀번호 복구 (이메일 기반)

### 기술적 개선
- 실시간 알림 시스템
- 계정 활동 로그 추적
- 세션 관리 최적화
- 모바일 앱 연동 준비