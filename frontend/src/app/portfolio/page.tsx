'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import EnhancedPortfolioForm from '@/components/EnhancedPortfolioForm';
import PortfolioDashboard from '@/components/PortfolioDashboard';
import AuthForm from '@/components/AuthForm';
import { useAssets } from '@/lib/hooks/usePortfolio';
import GlassCard from '@/components/GlassCard';
import EnhancedButton from '@/components/EnhancedButton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export interface PortfolioItem {
  id: string;
  assetType: string;
  name: string;
  amount: number;
  quantity?: number;
  avgPrice?: number;
  principal?: number;
  evaluationAmount?: number;
  date: string;
  note?: string;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  token?: string;
}

type PlanStatus = '대기' | '부분체결' | '완료' | '취소';
type PlanType = '매수' | '매도';
type AssetSelectValue = number | 'custom' | 'none';

interface TradePlan {
  id: string;
  assetId?: number;
  symbol: string;
  type: PlanType;
  targetPrice?: number;
  quantity?: number;
  condition?: string;
  status: PlanStatus;
  note?: string;
  createdAt: string;
}

interface DailyTask {
  id: string;
  assetId?: number;
  text: string;
  done: boolean;
  date: string;
  note?: string;
}

interface MonthlyReview {
  performance?: number;
  winRate?: number;
  wins?: string;
  mistakes?: string;
  improvements?: string;
}

export default function PortfolioPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const router = useRouter();
  const { data: assetsForPlans = [] } = useAssets(user?.id ?? 0);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [tradePlans, setTradePlans] = useState<TradePlan[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [dailyNote, setDailyNote] = useState('');
  const [targetWeights, setTargetWeights] = useState<Record<string, number>>({});
  const [monthlyReviews, setMonthlyReviews] = useState<Record<string, MonthlyReview>>({});
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const storageKey = (name: string) => (user ? `portfolio_${name}_v1_${user.id}` : '');

  // 로컬 스토리지에서 사용자 정보 로드 (토큰 포함)
  useEffect(() => {
    const savedUser = localStorage.getItem('portfolio_user');
    const savedToken = localStorage.getItem('auth_token');

    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // 저장된 토큰이 있으면 추가
        if (savedToken) {
          userData.token = savedToken;
        }
        // user.id가 없으면 잘못된 데이터로 간주하고 재로그인 요구
        if (!userData.id) {
          console.warn('Invalid user data (missing id), clearing localStorage');
          localStorage.removeItem('portfolio_user');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('userId'); // 레거시 키도 제거
          return;
        }
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('portfolio_user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('userId');
      }
    }
  }, []);

  // 보조 데이터 로드
  useEffect(() => {
    if (!user) return;
    try {
      const savedPlans = localStorage.getItem(storageKey('plans'));
      const savedTasks = localStorage.getItem(storageKey('daily'));
      const savedNote = localStorage.getItem(storageKey('daily_note'));
      const savedWeights = localStorage.getItem(storageKey('targets'));
      const savedReviews = localStorage.getItem(storageKey('reviews'));

      if (savedPlans) setTradePlans(JSON.parse(savedPlans));
      if (savedTasks) setDailyTasks(JSON.parse(savedTasks));
      if (savedNote) setDailyNote(savedNote);
      if (savedWeights) setTargetWeights(JSON.parse(savedWeights));
      if (savedReviews) setMonthlyReviews(JSON.parse(savedReviews));
    } catch (error) {
      console.warn('보조 데이터 로드 실패:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // 자산이 로드됐는데 목표 비중이 없으면 현재 비중을 기본값으로 설정
  useEffect(() => {
    if (!user || assetsForPlans.length === 0 || Object.keys(targetWeights).length > 0) return;
    const totals = assetsForPlans.reduce((acc, a) => acc + (a.evaluation_amount || a.principal || a.amount || 0), 0);
    if (totals <= 0) return;
    const defaults: Record<string, number> = {};
    assetsForPlans.forEach(a => {
      const key = a.asset_type || '기타';
      defaults[key] = (defaults[key] || 0) + ((a.evaluation_amount || a.principal || a.amount || 0) / totals) * 100;
    });
    setTargetWeights(defaults);
  }, [assetsForPlans, targetWeights, user]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    // 로컬 스토리지에 사용자 정보 저장
    localStorage.setItem('portfolio_user', JSON.stringify(userData));
    // 토큰이 있으면 별도 저장
    if (userData.token) {
      localStorage.setItem('auth_token', userData.token);
    }
  };

  const handleLogout = () => {
    setUser(null);
    // 모든 인증 관련 데이터 삭제
    localStorage.removeItem('portfolio_user');
    localStorage.removeItem('auth_token');
    setRefreshKey(prev => prev + 1); // 대시보드 초기화
  };

  const persistTradePlans = (plans: TradePlan[]) => {
    setTradePlans(plans);
    if (user) localStorage.setItem(storageKey('plans'), JSON.stringify(plans));
  };

  const persistDailyTasks = (tasks: DailyTask[], note = dailyNote) => {
    setDailyTasks(tasks);
    if (user) {
      localStorage.setItem(storageKey('daily'), JSON.stringify(tasks));
      localStorage.setItem(storageKey('daily_note'), note);
    }
  };

  const persistTargetWeights = (weights: Record<string, number>) => {
    setTargetWeights(weights);
    if (user) localStorage.setItem(storageKey('targets'), JSON.stringify(weights));
  };

  const persistMonthlyReviews = (reviews: Record<string, MonthlyReview>) => {
    setMonthlyReviews(reviews);
    if (user) localStorage.setItem(storageKey('reviews'), JSON.stringify(reviews));
  };

  // 입력 폼 상태
  const [planForm, setPlanForm] = useState({
    assetId: 'none' as AssetSelectValue,
    symbol: '',
    type: '매수' as PlanType,
    targetPrice: '',
    quantity: '',
    condition: '',
    note: ''
  });

  const [taskForm, setTaskForm] = useState({
    assetId: 'none' as AssetSelectValue,
    text: '',
    note: ''
  });

  const handleFormExpandedChange = (expanded: boolean) => {
    setIsFormExpanded(expanded);
  };

  const resolveSymbol = (assetId?: number, fallback?: string) => {
    if (assetId) {
      const asset = assetsForPlans.find(a => a.id === assetId);
      if (asset) return asset.name || asset.sub_category || asset.asset_type || fallback || 'UNKNOWN';
    }
    return fallback || 'CUSTOM';
  };

  const handleAddPlanEntry = () => {
    const assetId = planForm.assetId === 'none' || planForm.assetId === 'custom' ? undefined : Number(planForm.assetId);
    const symbol = planForm.symbol.trim() || resolveSymbol(assetId, '');
    if (!symbol) return;
    const newPlan: TradePlan = {
      id: `plan-${Date.now()}`,
      assetId,
      symbol,
      type: planForm.type,
      targetPrice: planForm.targetPrice ? Number(planForm.targetPrice) : undefined,
      quantity: planForm.quantity ? Number(planForm.quantity) : undefined,
      condition: planForm.condition.trim() || undefined,
      note: planForm.note.trim() || undefined,
      status: '대기',
      createdAt: today
    };
    const updated = [newPlan, ...tradePlans];
    persistTradePlans(updated);
    setPlanForm({ assetId: 'none', symbol: '', type: '매수', targetPrice: '', quantity: '', condition: '', note: '' });
  };

  const handleUpdatePlanStatus = (id: string, status: PlanStatus) => {
    const updated = tradePlans.map(p => (p.id === id ? { ...p, status } : p));
    persistTradePlans(updated);
  };

  const handleDeletePlan = (id: string) => {
    const updated = tradePlans.filter(p => p.id !== id);
    persistTradePlans(updated);
  };

  const handleAddTask = () => {
    if (!taskForm.text.trim()) return;
    const assetId = taskForm.assetId === 'none' || taskForm.assetId === 'custom' ? undefined : Number(taskForm.assetId);
    const newTask: DailyTask = {
      id: `task-${Date.now()}`,
      assetId,
      text: taskForm.text.trim(),
      note: taskForm.note.trim() || undefined,
      done: false,
      date: today
    };
    const updated = [newTask, ...dailyTasks];
    persistDailyTasks(updated);
    setTaskForm({ assetId: 'none', text: '', note: '' });
  };

  const handleToggleTask = (id: string) => {
    const updated = dailyTasks.map(t => (t.id === id ? { ...t, done: !t.done } : t));
    persistDailyTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = dailyTasks.filter(t => t.id !== id);
    persistDailyTasks(updated);
  };

  const handleUpdateDailyNote = (val: string) => {
    setDailyNote(val);
    if (user) localStorage.setItem(storageKey('daily_note'), val);
  };

  const handleUpdateTargetWeight = (category: string, value: number) => {
    const updated = { ...targetWeights, [category]: value };
    persistTargetWeights(updated);
  };

  const handleUpdateReview = (field: keyof MonthlyReview, value: string) => {
    const next = { ...monthlyReviews };
    const current = next[selectedMonth] || {};
    const parsedValue =
      field === 'performance' || field === 'winRate' ? (value === '' ? undefined : Number(value)) : value;
    next[selectedMonth] = { ...current, [field]: parsedValue };
    persistMonthlyReviews(next);
  };

  const assetOptions = useMemo(
    () =>
      assetsForPlans.map(a => ({
        id: a.id,
        label: `${a.name || a.sub_category || a.asset_type} (${a.asset_type})`,
        type: a.asset_type
      })),
    [assetsForPlans]
  );

  const todayTasks = useMemo(() => dailyTasks.filter(t => t.date === today), [dailyTasks, today]);

  const currentWeights = useMemo(() => {
    const totals = assetsForPlans.reduce((acc, a) => acc + (a.evaluation_amount || a.principal || a.amount || 0), 0);
    if (totals <= 0) return {};
    const map: Record<string, number> = {};
    assetsForPlans.forEach(a => {
      const key = a.asset_type || '기타';
      map[key] = (map[key] || 0) + ((a.evaluation_amount || a.principal || a.amount || 0) / totals) * 100;
    });
    return map;
  }, [assetsForPlans]);

  // 로그인하지 않은 경우 인증 폼 표시
  if (!user) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <header className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 animate-gradient shadow-sm border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="animate-fade-in-up">
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-yellow-400 to-secondary bg-clip-text text-transparent">
                💎 포트폴리오 관리
              </h1>
              <p className="mt-3 text-lg text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                보유 자산을 체계적으로 관리하세요 - Oracle 2025
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{user.username}</span>님
              </div>
              <button
                onClick={() => router.push('/settings')}
                className="px-4 py-2 text-sm font-medium text-secondary border border-secondary/30 rounded-md hover:bg-secondary/10 transition-colors"
              >
                계정 설정
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-md hover:bg-primary/10 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* 상단 섹션: 입력 폼 + 우측 정보 영역 */}
          <div className={`grid grid-cols-1 gap-6 ${
            isFormExpanded ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
          }`}>
            {/* 입력 폼 섹션 */}
            <div className={isFormExpanded ? 'lg:col-span-1' : 'lg:col-span-1'}>
              <EnhancedPortfolioForm
                user={user}
                onExpandedChange={handleFormExpandedChange}
              />
            </div>

            {/* 우측 정보 영역 */}
            <div className={isFormExpanded ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <PortfolioDashboard key={`${refreshKey}-${user.id}`} user={user} showSideInfo={true} />
            </div>
          </div>

          {/* 하단 섹션: 전체 대시보드 */}
          <div>
            <PortfolioDashboard key={`${refreshKey}-${user.id}`} user={user} showSideInfo={false} />
          </div>

          {/* 추가 섹션: 매수/매도 계획 */}
          <GlassCard className="p-6" animate animationDelay={0}>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="text-3xl">📈</span> 매수/매도 계획
              </h2>
              <p className="text-sm text-muted-foreground">
                포트폴리오 자산을 선택해 목표가·수량·조건을 기록하세요 (로컬 저장)
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-5">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">자산 선택</p>
                  <Select
                    value={String(planForm.assetId)}
                    onValueChange={val =>
                      setPlanForm(prev => ({
                        ...prev,
                        assetId: val === 'custom' ? 'custom' : val === 'none' ? 'none' : Number(val)
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="포트폴리오 자산 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">선택 안 함</SelectItem>
                      {assetOptions.map(opt => (
                        <SelectItem key={opt.id} value={String(opt.id)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">직접 입력</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">심볼/이름</p>
                  <Input
                    placeholder="AAPL / BTC / ETF 등"
                    value={planForm.symbol}
                    onChange={e => setPlanForm(prev => ({ ...prev, symbol: e.target.value }))}
                    disabled={planForm.assetId !== 'custom' && planForm.assetId !== 'none'}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">타입</p>
                  <Select value={planForm.type} onValueChange={val => setPlanForm(prev => ({ ...prev, type: val as PlanType }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="매수">매수</SelectItem>
                      <SelectItem value="매도">매도</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">목표가</p>
                  <Input
                    type="number"
                    placeholder="예: 120"
                    value={planForm.targetPrice}
                    onChange={e => setPlanForm(prev => ({ ...prev, targetPrice: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">수량/예산</p>
                  <Input
                    type="number"
                    placeholder="예: 10"
                    value={planForm.quantity}
                    onChange={e => setPlanForm(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="md:col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">조건</p>
                  <Textarea
                    placeholder="가격/이벤트/지표 조건을 적어주세요"
                    value={planForm.condition}
                    onChange={e => setPlanForm(prev => ({ ...prev, condition: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">메모</p>
                  <Textarea
                    placeholder="추가 메모"
                    value={planForm.note}
                    onChange={e => setPlanForm(prev => ({ ...prev, note: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <EnhancedButton variant="primary" onClick={handleAddPlanEntry} shimmer>
                  계획 추가
                </EnhancedButton>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="px-2 py-2">심볼</th>
                      <th className="px-2 py-2">타입</th>
                      <th className="px-2 py-2">목표가</th>
                      <th className="px-2 py-2">수량/예산</th>
                      <th className="px-2 py-2">조건</th>
                      <th className="px-2 py-2">상태</th>
                      <th className="px-2 py-2 text-right">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradePlans.length === 0 && (
                      <tr>
                        <td className="px-2 py-3 text-muted-foreground" colSpan={7}>
                          계획이 없습니다. 계획을 추가하세요.
                        </td>
                      </tr>
                    )}
                    {tradePlans.map(plan => (
                      <tr key={plan.id} className="border-t border-border/60">
                        <td className="px-2 py-3">{plan.symbol}</td>
                        <td className="px-2 py-3">
                          <Badge variant={plan.type === '매수' ? 'default' : 'secondary'}>{plan.type}</Badge>
                        </td>
                        <td className="px-2 py-3">{plan.targetPrice ? `$${plan.targetPrice}` : '-'}</td>
                        <td className="px-2 py-3">{plan.quantity ?? '-'}</td>
                        <td className="px-2 py-3 max-w-xs truncate" title={plan.condition}>
                          {plan.condition || '-'}
                        </td>
                        <td className="px-2 py-3">
                          <Select
                            value={plan.status}
                            onValueChange={val => handleUpdatePlanStatus(plan.id, val as PlanStatus)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="대기">대기</SelectItem>
                              <SelectItem value="부분체결">부분체결</SelectItem>
                              <SelectItem value="완료">완료</SelectItem>
                              <SelectItem value="취소">취소</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-3 text-right">
                          <EnhancedButton variant="ghost" size="sm" onClick={() => handleDeletePlan(plan.id)}>
                            삭제
                          </EnhancedButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </GlassCard>

          {/* 추가 섹션: 데일리 모니터링 */}
          <GlassCard className="p-6" animate animationDelay={100}>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="text-3xl">📝</span> 데일리 모니터링
              </h2>
              <p className="text-sm text-muted-foreground">
                오늘 체크리스트와 메모를 관리하세요 (날짜별 로컬 저장)
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-5">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">자산 선택 (선택)</p>
                  <Select
                    value={String(taskForm.assetId)}
                    onValueChange={val =>
                      setTaskForm(prev => ({
                        ...prev,
                        assetId: val === 'custom' ? 'custom' : val === 'none' ? 'none' : Number(val)
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택 안 함" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">선택 안 함</SelectItem>
                      {assetOptions.map(opt => (
                        <SelectItem key={opt.id} value={String(opt.id)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">직접 입력</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3 space-y-1">
                  <p className="text-xs text-muted-foreground">체크 항목</p>
                  <Input
                    placeholder="오늘 확인할 사항"
                    value={taskForm.text}
                    onChange={e => setTaskForm(prev => ({ ...prev, text: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">메모</p>
                  <Input
                    placeholder="간단 메모"
                    value={taskForm.note}
                    onChange={e => setTaskForm(prev => ({ ...prev, note: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <EnhancedButton variant="secondary" onClick={handleAddTask} shimmer>
                  오늘 항목 추가
                </EnhancedButton>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">오늘({today}) 체크리스트</p>
                {todayTasks.length === 0 && <p className="text-muted-foreground text-sm">오늘 항목이 없습니다.</p>}
                <div className="space-y-2">
                  {todayTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-md border border-dashed border-border bg-muted/30 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => handleToggleTask(task.id)}
                          className="h-4 w-4"
                        />
                        <div>
                          <p className={`font-medium ${task.done ? 'line-through text-muted-foreground' : ''}`}>
                            {task.text}
                          </p>
                          {task.note ? (
                            <p className="text-xs text-muted-foreground">메모: {task.note}</p>
                          ) : null}
                        </div>
                      </div>
                      <EnhancedButton variant="ghost" size="sm" onClick={() => handleDeleteTask(task.id)}>
                        삭제
                      </EnhancedButton>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">오늘 메모</p>
                <Textarea
                  placeholder="경제지표/뉴스/체크 결과를 기록하세요"
                  value={dailyNote}
                  onChange={e => handleUpdateDailyNote(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </GlassCard>

          {/* 추가 섹션: 리밸런싱 제안 */}
          <GlassCard className="p-6" animate animationDelay={200}>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="text-3xl">⚖️</span> 리밸런싱 제안
              </h2>
              <p className="text-sm text-muted-foreground">
                목표 비중을 설정하면 현재 비중과 차이를 보여줍니다 (보기용)
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                {Object.keys(currentWeights).length === 0 && (
                  <p className="text-muted-foreground text-sm md:col-span-3">
                    포트폴리오 자산이 없거나 금액이 0입니다. 자산을 추가하면 자동으로 계산됩니다.
                  </p>
                )}
                {Object.entries(currentWeights).map(([category, current]) => (
                  <div key={category} className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{category}</p>
                      <Badge variant="outline">{current.toFixed(1)}%</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">목표 비중</p>
                      <Input
                        type="number"
                        value={targetWeights[category]?.toFixed(1) ?? ''}
                        onChange={e => handleUpdateTargetWeight(category, Number(e.target.value))}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="px-2 py-2">카테고리</th>
                      <th className="px-2 py-2">현재</th>
                      <th className="px-2 py-2">목표</th>
                      <th className="px-2 py-2">Δ 제안</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(new Set([...Object.keys(currentWeights), ...Object.keys(targetWeights)])).map(cat => {
                      const current = currentWeights[cat] ?? 0;
                      const target = targetWeights[cat] ?? 0;
                      const delta = target - current;
                      return (
                        <tr key={cat} className="border-t border-border/60">
                          <td className="px-2 py-2">{cat}</td>
                          <td className="px-2 py-2">{current.toFixed(1)}%</td>
                          <td className="px-2 py-2">{target.toFixed(1)}%</td>
                          <td className="px-2 py-2">
                            {delta > 0 ? (
                              <span className="text-emerald-600">매수 +{delta.toFixed(1)}%</span>
                            ) : delta < 0 ? (
                              <span className="text-rose-600">매도 {delta.toFixed(1)}%</span>
                            ) : (
                              <span className="text-muted-foreground">적정</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </GlassCard>

          {/* 추가 섹션: 월간 피드백 */}
          <GlassCard className="p-6" animate animationDelay={300}>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="text-3xl">📊</span> 월간 피드백
              </h2>
              <p className="text-sm text-muted-foreground">
                월별로 성과와 잘한 점/실수/개선을 기록하세요 (로컬 저장)
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">월 선택</p>
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">수익률(%)</p>
                  <Input
                    type="number"
                    value={(monthlyReviews[selectedMonth]?.performance ?? '').toString()}
                    onChange={e => handleUpdateReview('performance', e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">승률(%)</p>
                  <Input
                    type="number"
                    value={(monthlyReviews[selectedMonth]?.winRate ?? '').toString()}
                    onChange={e => handleUpdateReview('winRate', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">잘한 점</p>
                  <Textarea
                    rows={3}
                    value={monthlyReviews[selectedMonth]?.wins ?? ''}
                    onChange={e => handleUpdateReview('wins', e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">실수</p>
                  <Textarea
                    rows={3}
                    value={monthlyReviews[selectedMonth]?.mistakes ?? ''}
                    onChange={e => handleUpdateReview('mistakes', e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">개선</p>
                  <Textarea
                    rows={3}
                    value={monthlyReviews[selectedMonth]?.improvements ?? ''}
                    onChange={e => handleUpdateReview('improvements', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
