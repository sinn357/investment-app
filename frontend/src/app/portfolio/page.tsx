'use client';

import { useState, useEffect, useMemo } from 'react';
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

interface User {
  id: number;
  username: string;
  token?: string;
}

type AssetSelectValue = number | 'custom' | 'none';
type TradeSide = '매수' | '매도';
type EmotionState = '없음' | '개입';
type OXQStatus = 'O' | 'X' | '?';
type CatalystStatus = '진행' | '지연' | '무산';
type InvalidationStatus = '미발생' | '발생';
type RuleViolation = '미위반' | '위반';
type ActionStatus = '대기' | '실행완료';
type CheckStatus = '양호' | '주의' | '이탈';
type CheckType = '정기(분기)' | '이벤트';
type ComplianceStatus = '준수' | '위반' | '미점검';
type ReviewStatus = '작동' | '부분작동' | '미작동' | '미점검';
type StrategyDecision = '존속' | '수정' | '중단' | '미결정';

interface ExecutionLogEntry {
  id: string;
  date: string;
  assetId?: number;
  symbol: string;
  side: TradeSide;
  plannedPrice?: number;
  executedPrice: number;
  quantity?: number;
  splitPlanned?: number;
  splitExecuted?: number;
  emotion: EmotionState;
  factualNote?: string;
}

interface HypothesisBoard {
  id: string;
  company: string;
  updatedAt: string;
  kpis: [OXQStatus, OXQStatus, OXQStatus, OXQStatus, OXQStatus];
  catalysts: [CatalystStatus, CatalystStatus, CatalystStatus];
  invalidations: [InvalidationStatus, InvalidationStatus, InvalidationStatus];
}

interface RiskRuleRow {
  id: string;
  name: string;
  limitValue: string;
  currentValue: string;
  violation: RuleViolation;
  actionStatus: ActionStatus;
  updatedAt: string;
}

interface PortfolioCheckRow {
  id: string;
  date: string;
  checkType: CheckType;
  assetClassBalance: CheckStatus;
  concentration: CheckStatus;
  cashLevel: CheckStatus;
  volatilityDrawdown: CheckStatus;
  factualNote?: string;
}

interface StrategyReviewRow {
  periodType: 'month' | 'quarter' | 'year';
  periodKey: string;
  monthlyRuleCompliance?: ComplianceStatus;
  monthlyExecutionLogAudit?: ComplianceStatus;
  quarterHypothesisEngine?: ReviewStatus;
  quarterInvalidationTiming?: ReviewStatus;
  yearStrategyDecision?: StrategyDecision;
  yearFrameworkNeed?: StrategyDecision;
  factualNote?: string;
  updatedAt: string;
}

const DEFAULT_RISK_RULES: RiskRuleRow[] = [
  {
    id: 'risk-loss-limit',
    name: '손실 한도 초과 여부',
    limitValue: '',
    currentValue: '',
    violation: '미위반',
    actionStatus: '대기',
    updatedAt: '',
  },
  {
    id: 'risk-weight-limit',
    name: '비중 상한 초과 여부',
    limitValue: '',
    currentValue: '',
    violation: '미위반',
    actionStatus: '대기',
    updatedAt: '',
  },
  {
    id: 'risk-leverage',
    name: '레버리지 규칙 위반 여부',
    limitValue: '',
    currentValue: '',
    violation: '미위반',
    actionStatus: '대기',
    updatedAt: '',
  },
  {
    id: 'risk-correlation',
    name: '상관관계 급변 여부',
    limitValue: '',
    currentValue: '',
    violation: '미위반',
    actionStatus: '대기',
    updatedAt: '',
  },
];

export default function PortfolioPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const { data: assetsForPlans = [] } = useAssets(user?.id ?? 0);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const nowIso = () => new Date().toISOString();

  const [executionLogs, setExecutionLogs] = useState<ExecutionLogEntry[]>([]);
  const [hypothesisBoards, setHypothesisBoards] = useState<HypothesisBoard[]>([]);
  const [riskRules, setRiskRules] = useState<RiskRuleRow[]>(DEFAULT_RISK_RULES);
  const [portfolioChecks, setPortfolioChecks] = useState<PortfolioCheckRow[]>([]);
  const [strategyReviews, setStrategyReviews] = useState<StrategyReviewRow[]>([]);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedQuarter, setSelectedQuarter] = useState(() => {
    const d = new Date();
    const quarter = Math.floor(d.getMonth() / 3) + 1;
    return `${d.getFullYear()}-Q${quarter}`;
  });
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));

  const [executionForm, setExecutionForm] = useState({
    date: today,
    assetId: 'none' as AssetSelectValue,
    symbol: '',
    side: '매수' as TradeSide,
    plannedPrice: '',
    executedPrice: '',
    quantity: '',
    splitPlanned: '',
    splitExecuted: '',
    emotion: '없음' as EmotionState,
    factualNote: '',
  });

  const [newCompany, setNewCompany] = useState('');

  const [portfolioCheckForm, setPortfolioCheckForm] = useState({
    date: today,
    checkType: '정기(분기)' as CheckType,
    assetClassBalance: '양호' as CheckStatus,
    concentration: '양호' as CheckStatus,
    cashLevel: '양호' as CheckStatus,
    volatilityDrawdown: '양호' as CheckStatus,
    factualNote: '',
  });

  const storageKeys = useMemo(
    () => ({
      executionLogs: user ? `portfolio_execution_logs_v2_${user.id}` : '',
      hypothesisBoards: user ? `portfolio_hypothesis_boards_v2_${user.id}` : '',
      riskRules: user ? `portfolio_risk_rules_v2_${user.id}` : '',
      portfolioChecks: user ? `portfolio_portfolio_checks_v2_${user.id}` : '',
      strategyReviews: user ? `portfolio_strategy_reviews_v2_${user.id}` : '',
    }),
    [user]
  );

  useEffect(() => {
    const savedUser = localStorage.getItem('portfolio_user');
    const savedToken = localStorage.getItem('auth_token');

    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (savedToken) userData.token = savedToken;

        if (!userData.id) {
          localStorage.removeItem('portfolio_user');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('userId');
          return;
        }

        setUser(userData);
      } catch {
        localStorage.removeItem('portfolio_user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('userId');
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    try {
      const savedExecutionLogs = localStorage.getItem(storageKeys.executionLogs);
      const savedHypothesis = localStorage.getItem(storageKeys.hypothesisBoards);
      const savedRiskRules = localStorage.getItem(storageKeys.riskRules);
      const savedPortfolioChecks = localStorage.getItem(storageKeys.portfolioChecks);
      const savedStrategyReviews = localStorage.getItem(storageKeys.strategyReviews);

      if (savedExecutionLogs) setExecutionLogs(JSON.parse(savedExecutionLogs));
      if (savedHypothesis) setHypothesisBoards(JSON.parse(savedHypothesis));
      if (savedRiskRules) setRiskRules(JSON.parse(savedRiskRules));
      if (savedPortfolioChecks) setPortfolioChecks(JSON.parse(savedPortfolioChecks));
      if (savedStrategyReviews) setStrategyReviews(JSON.parse(savedStrategyReviews));
    } catch {
      setRiskRules(DEFAULT_RISK_RULES);
    }
  }, [storageKeys, user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(storageKeys.executionLogs, JSON.stringify(executionLogs));
  }, [executionLogs, storageKeys.executionLogs, user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(storageKeys.hypothesisBoards, JSON.stringify(hypothesisBoards));
  }, [hypothesisBoards, storageKeys.hypothesisBoards, user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(storageKeys.riskRules, JSON.stringify(riskRules));
  }, [riskRules, storageKeys.riskRules, user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(storageKeys.portfolioChecks, JSON.stringify(portfolioChecks));
  }, [portfolioChecks, storageKeys.portfolioChecks, user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(storageKeys.strategyReviews, JSON.stringify(strategyReviews));
  }, [storageKeys.strategyReviews, strategyReviews, user]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('portfolio_user', JSON.stringify(userData));
    if (userData.token) localStorage.setItem('auth_token', userData.token);
  };

  const resolveSymbol = (assetId?: number, fallback?: string) => {
    if (assetId) {
      const asset = assetsForPlans.find(a => a.id === assetId);
      if (asset) return asset.name || asset.sub_category || asset.asset_type || fallback || 'UNKNOWN';
    }
    return fallback || 'CUSTOM';
  };

  const handleAddExecutionLog = () => {
    const assetId =
      executionForm.assetId === 'none' || executionForm.assetId === 'custom'
        ? undefined
        : Number(executionForm.assetId);
    const symbol = executionForm.symbol.trim() || resolveSymbol(assetId, '');
    const executedPrice = Number(executionForm.executedPrice);

    if (!symbol || !Number.isFinite(executedPrice) || executedPrice <= 0) return;

    const entry: ExecutionLogEntry = {
      id: `exec-${Date.now()}`,
      date: executionForm.date || today,
      assetId,
      symbol,
      side: executionForm.side,
      plannedPrice: executionForm.plannedPrice ? Number(executionForm.plannedPrice) : undefined,
      executedPrice,
      quantity: executionForm.quantity ? Number(executionForm.quantity) : undefined,
      splitPlanned: executionForm.splitPlanned ? Number(executionForm.splitPlanned) : undefined,
      splitExecuted: executionForm.splitExecuted ? Number(executionForm.splitExecuted) : undefined,
      emotion: executionForm.emotion,
      factualNote: executionForm.factualNote.trim() || undefined,
    };

    setExecutionLogs(prev => [entry, ...prev]);
    setExecutionForm({
      date: today,
      assetId: 'none',
      symbol: '',
      side: '매수',
      plannedPrice: '',
      executedPrice: '',
      quantity: '',
      splitPlanned: '',
      splitExecuted: '',
      emotion: '없음',
      factualNote: '',
    });
  };

  const handleDeleteExecutionLog = (id: string) => {
    setExecutionLogs(prev => prev.filter(entry => entry.id !== id));
  };

  const handleAddHypothesisBoard = () => {
    const company = newCompany.trim();
    if (!company) return;

    const board: HypothesisBoard = {
      id: `hypo-${Date.now()}`,
      company,
      updatedAt: nowIso(),
      kpis: ['?', '?', '?', '?', '?'],
      catalysts: ['진행', '진행', '진행'],
      invalidations: ['미발생', '미발생', '미발생'],
    };

    setHypothesisBoards(prev => [board, ...prev]);
    setNewCompany('');
  };

  const updateHypothesisBoard = (id: string, updater: (board: HypothesisBoard) => HypothesisBoard) => {
    setHypothesisBoards(prev => prev.map(board => (board.id === id ? { ...updater(board), updatedAt: nowIso() } : board)));
  };

  const handleDeleteHypothesisBoard = (id: string) => {
    setHypothesisBoards(prev => prev.filter(board => board.id !== id));
  };

  const updateRiskRule = (id: string, patch: Partial<RiskRuleRow>) => {
    setRiskRules(prev => prev.map(rule => (rule.id === id ? { ...rule, ...patch, updatedAt: nowIso() } : rule)));
  };

  const handleAddPortfolioCheck = () => {
    const row: PortfolioCheckRow = {
      id: `check-${Date.now()}`,
      date: portfolioCheckForm.date || today,
      checkType: portfolioCheckForm.checkType,
      assetClassBalance: portfolioCheckForm.assetClassBalance,
      concentration: portfolioCheckForm.concentration,
      cashLevel: portfolioCheckForm.cashLevel,
      volatilityDrawdown: portfolioCheckForm.volatilityDrawdown,
      factualNote: portfolioCheckForm.factualNote.trim() || undefined,
    };

    setPortfolioChecks(prev => [row, ...prev]);
    setPortfolioCheckForm({
      date: today,
      checkType: '정기(분기)',
      assetClassBalance: '양호',
      concentration: '양호',
      cashLevel: '양호',
      volatilityDrawdown: '양호',
      factualNote: '',
    });
  };

  const handleDeletePortfolioCheck = (id: string) => {
    setPortfolioChecks(prev => prev.filter(row => row.id !== id));
  };

  const upsertStrategyReview = (periodType: 'month' | 'quarter' | 'year', periodKey: string, patch: Partial<StrategyReviewRow>) => {
    setStrategyReviews(prev => {
      const index = prev.findIndex(item => item.periodType === periodType && item.periodKey === periodKey);
      const updatedAt = nowIso();
      if (index >= 0) {
        const cloned = [...prev];
        cloned[index] = { ...cloned[index], ...patch, updatedAt };
        return cloned;
      }
      return [{ periodType, periodKey, ...patch, updatedAt }, ...prev];
    });
  };

  const monthlyReview = useMemo(
    () => strategyReviews.find(item => item.periodType === 'month' && item.periodKey === selectedMonth),
    [selectedMonth, strategyReviews]
  );

  const quarterlyReview = useMemo(
    () => strategyReviews.find(item => item.periodType === 'quarter' && item.periodKey === selectedQuarter),
    [selectedQuarter, strategyReviews]
  );

  const yearlyReview = useMemo(
    () => strategyReviews.find(item => item.periodType === 'year' && item.periodKey === selectedYear),
    [selectedYear, strategyReviews]
  );

  const assetOptions = useMemo(
    () =>
      assetsForPlans.map(a => ({
        id: a.id,
        label: `${a.name || a.sub_category || a.asset_type} (${a.asset_type})`,
      })),
    [assetsForPlans]
  );

  const triggeredRiskCount = useMemo(
    () => riskRules.filter(rule => rule.violation === '위반').length,
    [riskRules]
  );

  const failedHypothesisCount = useMemo(
    () =>
      hypothesisBoards.filter(
        board => board.kpis.includes('X') || board.invalidations.includes('발생') || board.catalysts.includes('무산')
      ).length,
    [hypothesisBoards]
  );

  const slippage = (plannedPrice?: number, executedPrice?: number) => {
    if (!plannedPrice || !executedPrice || plannedPrice <= 0) return null;
    return ((executedPrice - plannedPrice) / plannedPrice) * 100;
  };

  const statusBadgeVariant = (status: string) => {
    if (status === 'X' || status === '발생' || status === '무산' || status === '위반' || status === '이탈' || status === '중단') {
      return 'destructive' as const;
    }
    if (status === '?' || status === '지연' || status === '주의' || status === '부분작동' || status === '수정') {
      return 'secondary' as const;
    }
    return 'default' as const;
  };

  if (!user) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
        <div className="space-y-6">
          <GlassCard className="p-0 overflow-hidden">
            <button
              onClick={() => setIsFormExpanded(!isFormExpanded)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{isFormExpanded ? '📝' : '➕'}</span>
                <span className="text-lg font-semibold text-foreground">
                  {isFormExpanded ? '자산 추가 중...' : '새 자산 추가'}
                </span>
              </div>
              <span className={`text-muted-foreground transition-transform ${isFormExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            {isFormExpanded && (
              <div className="border-t border-primary/10 p-6">
                <EnhancedPortfolioForm user={user} />
              </div>
            )}
          </GlassCard>

          <PortfolioDashboard key={String(user.id)} user={user} showSideInfo />

          <GlassCard className="p-5 border border-primary/20 bg-primary/5" animate animationDelay={0}>
            <div className="grid gap-3 md:grid-cols-4 text-sm">
              <div className="rounded-md bg-background/80 p-3 border border-border/60">
                <p className="text-muted-foreground">가설 경고 기업</p>
                <p className="text-xl font-bold">{failedHypothesisCount}</p>
              </div>
              <div className="rounded-md bg-background/80 p-3 border border-border/60">
                <p className="text-muted-foreground">리스크 트리거</p>
                <p className="text-xl font-bold">{triggeredRiskCount}</p>
              </div>
              <div className="rounded-md bg-background/80 p-3 border border-border/60">
                <p className="text-muted-foreground">실행 로그 건수</p>
                <p className="text-xl font-bold">{executionLogs.length}</p>
              </div>
              <div className="rounded-md bg-background/80 p-3 border border-border/60">
                <p className="text-muted-foreground">구조 점검 기록</p>
                <p className="text-xl font-bold">{portfolioChecks.length}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6" animate animationDelay={80}>
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="text-3xl">🧾</span> 실행 로그 (Execution Log)
              </h2>
              <p className="text-sm text-muted-foreground">판단 없이 계획 대비 집행 사실만 기록합니다.</p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">체결일</p>
                  <Input
                    type="date"
                    value={executionForm.date}
                    onChange={e => setExecutionForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">자산 선택</p>
                  <Select
                    value={String(executionForm.assetId)}
                    onValueChange={val =>
                      setExecutionForm(prev => ({
                        ...prev,
                        assetId: val === 'custom' ? 'custom' : val === 'none' ? 'none' : Number(val),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="포트폴리오 자산" />
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
                  <p className="text-xs text-muted-foreground">종목/심볼</p>
                  <Input
                    placeholder="예: AAPL"
                    value={executionForm.symbol}
                    onChange={e => setExecutionForm(prev => ({ ...prev, symbol: e.target.value }))}
                    disabled={executionForm.assetId !== 'custom' && executionForm.assetId !== 'none'}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">매수/매도</p>
                  <Select
                    value={executionForm.side}
                    onValueChange={val => setExecutionForm(prev => ({ ...prev, side: val as TradeSide }))}
                  >
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
                  <p className="text-xs text-muted-foreground">계획가</p>
                  <Input
                    type="number"
                    placeholder="선택"
                    value={executionForm.plannedPrice}
                    onChange={e => setExecutionForm(prev => ({ ...prev, plannedPrice: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">실제 체결가*</p>
                  <Input
                    type="number"
                    placeholder="필수"
                    value={executionForm.executedPrice}
                    onChange={e => setExecutionForm(prev => ({ ...prev, executedPrice: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-5">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">수량</p>
                  <Input
                    type="number"
                    value={executionForm.quantity}
                    onChange={e => setExecutionForm(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">분할 계획 회차</p>
                  <Input
                    type="number"
                    value={executionForm.splitPlanned}
                    onChange={e => setExecutionForm(prev => ({ ...prev, splitPlanned: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">실행 회차</p>
                  <Input
                    type="number"
                    value={executionForm.splitExecuted}
                    onChange={e => setExecutionForm(prev => ({ ...prev, splitExecuted: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">감정 개입</p>
                  <Select
                    value={executionForm.emotion}
                    onValueChange={val => setExecutionForm(prev => ({ ...prev, emotion: val as EmotionState }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="없음">없음</SelectItem>
                      <SelectItem value="개입">개입</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end justify-end">
                  <EnhancedButton variant="primary" onClick={handleAddExecutionLog} shimmer>
                    로그 추가
                  </EnhancedButton>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">사실 메모</p>
                <Textarea
                  rows={2}
                  placeholder="예: 2차 분할 중 1차만 체결"
                  value={executionForm.factualNote}
                  onChange={e => setExecutionForm(prev => ({ ...prev, factualNote: e.target.value }))}
                />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="px-2 py-2">일자</th>
                      <th className="px-2 py-2">종목</th>
                      <th className="px-2 py-2">구분</th>
                      <th className="px-2 py-2">계획가</th>
                      <th className="px-2 py-2">체결가</th>
                      <th className="px-2 py-2">슬리피지</th>
                      <th className="px-2 py-2">분할</th>
                      <th className="px-2 py-2">감정</th>
                      <th className="px-2 py-2 text-right">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executionLogs.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-2 py-8 text-center text-muted-foreground">
                          실행 로그가 없습니다.
                        </td>
                      </tr>
                    )}
                    {executionLogs.map(entry => {
                      const s = slippage(entry.plannedPrice, entry.executedPrice);
                      return (
                        <tr key={entry.id} className="border-t border-border/60 align-top">
                          <td className="px-2 py-3">{entry.date}</td>
                          <td className="px-2 py-3">
                            <div className="font-medium">{entry.symbol}</div>
                            {entry.factualNote && <p className="text-xs text-muted-foreground">{entry.factualNote}</p>}
                          </td>
                          <td className="px-2 py-3">
                            <Badge variant={entry.side === '매수' ? 'default' : 'secondary'}>{entry.side}</Badge>
                          </td>
                          <td className="px-2 py-3">{entry.plannedPrice ?? '-'}</td>
                          <td className="px-2 py-3">{entry.executedPrice}</td>
                          <td className="px-2 py-3">
                            {s === null ? (
                              <span className="text-muted-foreground">-</span>
                            ) : (
                              <span className={s > 0 ? 'text-rose-600' : 'text-emerald-600'}>{s.toFixed(2)}%</span>
                            )}
                          </td>
                          <td className="px-2 py-3">
                            {entry.splitPlanned || entry.splitExecuted
                              ? `${entry.splitExecuted || 0}/${entry.splitPlanned || 0}`
                              : '-'}
                          </td>
                          <td className="px-2 py-3">{entry.emotion}</td>
                          <td className="px-2 py-3 text-right">
                            <EnhancedButton variant="ghost" size="sm" onClick={() => handleDeleteExecutionLog(entry.id)}>
                              삭제
                            </EnhancedButton>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6" animate animationDelay={140}>
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="text-3xl">🎯</span> 가설 체크 대시보드 (핵심)
              </h2>
              <p className="text-sm text-muted-foreground">상태값만 업데이트합니다. 해석 문장은 입력하지 않습니다.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto] mb-4">
              <Input
                placeholder="기업명 입력"
                value={newCompany}
                onChange={e => setNewCompany(e.target.value)}
              />
              <EnhancedButton variant="secondary" onClick={handleAddHypothesisBoard}>
                기업 추가
              </EnhancedButton>
            </div>

            <div className="space-y-4">
              {hypothesisBoards.length === 0 && (
                <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-muted-foreground">
                  가설 보드가 없습니다.
                </div>
              )}

              {hypothesisBoards.map(board => (
                <div key={board.id} className="rounded-lg border border-border/70 p-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{board.company}</h3>
                      <p className="text-xs text-muted-foreground">업데이트: {new Date(board.updatedAt).toLocaleString()}</p>
                    </div>
                    <EnhancedButton variant="ghost" size="sm" onClick={() => handleDeleteHypothesisBoard(board.id)}>
                      삭제
                    </EnhancedButton>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">1. 핵심 KPI</p>
                      {board.kpis.map((value, idx) => (
                        <div key={`kpi-${idx}`} className="flex items-center justify-between gap-2">
                          <span className="text-sm text-muted-foreground">KPI {idx + 1}</span>
                          <Select
                            value={value}
                            onValueChange={val =>
                              updateHypothesisBoard(board.id, current => {
                                const next = [...current.kpis] as HypothesisBoard['kpis'];
                                next[idx] = val as OXQStatus;
                                return { ...current, kpis: next };
                              })
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="O">O</SelectItem>
                              <SelectItem value="X">X</SelectItem>
                              <SelectItem value="?">?</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">2. 촉매 진행 상황</p>
                      {board.catalysts.map((value, idx) => (
                        <div key={`cat-${idx}`} className="flex items-center justify-between gap-2">
                          <span className="text-sm text-muted-foreground">촉매 {String.fromCharCode(65 + idx)}</span>
                          <Select
                            value={value}
                            onValueChange={val =>
                              updateHypothesisBoard(board.id, current => {
                                const next = [...current.catalysts] as HypothesisBoard['catalysts'];
                                next[idx] = val as CatalystStatus;
                                return { ...current, catalysts: next };
                              })
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="진행">진행</SelectItem>
                              <SelectItem value="지연">지연</SelectItem>
                              <SelectItem value="무산">무산</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">3. 무효화 조건</p>
                      {board.invalidations.map((value, idx) => (
                        <div key={`inv-${idx}`} className="flex items-center justify-between gap-2">
                          <span className="text-sm text-muted-foreground">조건 {idx + 1}</span>
                          <Select
                            value={value}
                            onValueChange={val =>
                              updateHypothesisBoard(board.id, current => {
                                const next = [...current.invalidations] as HypothesisBoard['invalidations'];
                                next[idx] = val as InvalidationStatus;
                                return { ...current, invalidations: next };
                              })
                            }
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="미발생">미발생</SelectItem>
                              <SelectItem value="발생">발생</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {board.kpis.map((value, idx) => (
                      <Badge key={`badge-kpi-${idx}`} variant={statusBadgeVariant(value)}>
                        KPI {idx + 1} {value}
                      </Badge>
                    ))}
                    {board.catalysts.map((value, idx) => (
                      <Badge key={`badge-cat-${idx}`} variant={statusBadgeVariant(value)}>
                        촉매 {String.fromCharCode(65 + idx)} {value}
                      </Badge>
                    ))}
                    {board.invalidations.map((value, idx) => (
                      <Badge key={`badge-inv-${idx}`} variant={statusBadgeVariant(value)}>
                        조건 {idx + 1} {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6" animate animationDelay={200}>
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="text-3xl">🚨</span> 리스크 규칙 감시 (Rule Monitoring)
              </h2>
              <p className="text-sm text-muted-foreground">트리거를 탐지하고 실행 상태만 기록합니다.</p>
            </div>

            <div className="space-y-3">
              {riskRules.map(rule => (
                <div key={rule.id} className="rounded-lg border border-border/70 p-4">
                  <div className="grid gap-3 md:grid-cols-6 items-end">
                    <div className="md:col-span-2">
                      <p className="text-sm font-semibold">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">업데이트: {rule.updatedAt ? new Date(rule.updatedAt).toLocaleString() : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">기준값</p>
                      <Input
                        value={rule.limitValue}
                        onChange={e => updateRiskRule(rule.id, { limitValue: e.target.value })}
                        placeholder="예: -8%"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">현재값</p>
                      <Input
                        value={rule.currentValue}
                        onChange={e => updateRiskRule(rule.id, { currentValue: e.target.value })}
                        placeholder="예: -10.2%"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">위반 여부</p>
                      <Select
                        value={rule.violation}
                        onValueChange={val => updateRiskRule(rule.id, { violation: val as RuleViolation })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="미위반">미위반</SelectItem>
                          <SelectItem value="위반">위반</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">행동 실행</p>
                      <Select
                        value={rule.actionStatus}
                        onValueChange={val => updateRiskRule(rule.id, { actionStatus: val as ActionStatus })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="대기">대기</SelectItem>
                          <SelectItem value="실행완료">실행완료</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6" animate animationDelay={260}>
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="text-3xl">🧭</span> 포트폴리오 구조 점검 (Portfolio Check)
              </h2>
              <p className="text-sm text-muted-foreground">시스템 레벨 왜곡만 점검합니다.</p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">점검일</p>
                  <Input
                    type="date"
                    value={portfolioCheckForm.date}
                    onChange={e => setPortfolioCheckForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">점검 타입</p>
                  <Select
                    value={portfolioCheckForm.checkType}
                    onValueChange={val => setPortfolioCheckForm(prev => ({ ...prev, checkType: val as CheckType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="정기(분기)">정기(분기)</SelectItem>
                      <SelectItem value="이벤트">이벤트</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">자산군 비중</p>
                  <Select
                    value={portfolioCheckForm.assetClassBalance}
                    onValueChange={val => setPortfolioCheckForm(prev => ({ ...prev, assetClassBalance: val as CheckStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="양호">양호</SelectItem>
                      <SelectItem value="주의">주의</SelectItem>
                      <SelectItem value="이탈">이탈</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">쏠림 점검</p>
                  <Select
                    value={portfolioCheckForm.concentration}
                    onValueChange={val => setPortfolioCheckForm(prev => ({ ...prev, concentration: val as CheckStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="양호">양호</SelectItem>
                      <SelectItem value="주의">주의</SelectItem>
                      <SelectItem value="이탈">이탈</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">현금 비중</p>
                  <Select
                    value={portfolioCheckForm.cashLevel}
                    onValueChange={val => setPortfolioCheckForm(prev => ({ ...prev, cashLevel: val as CheckStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="양호">양호</SelectItem>
                      <SelectItem value="주의">주의</SelectItem>
                      <SelectItem value="이탈">이탈</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">변동성/MDD</p>
                  <Select
                    value={portfolioCheckForm.volatilityDrawdown}
                    onValueChange={val => setPortfolioCheckForm(prev => ({ ...prev, volatilityDrawdown: val as CheckStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="양호">양호</SelectItem>
                      <SelectItem value="주의">주의</SelectItem>
                      <SelectItem value="이탈">이탈</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <Textarea
                  rows={2}
                  placeholder="사실 메모 (선택): 예, 특정 자산군 비중이 상단 범위 2% 초과"
                  value={portfolioCheckForm.factualNote}
                  onChange={e => setPortfolioCheckForm(prev => ({ ...prev, factualNote: e.target.value }))}
                />
                <div className="flex items-end justify-end">
                  <EnhancedButton variant="secondary" onClick={handleAddPortfolioCheck}>
                    점검 기록 추가
                  </EnhancedButton>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="px-2 py-2">일자</th>
                      <th className="px-2 py-2">타입</th>
                      <th className="px-2 py-2">자산군</th>
                      <th className="px-2 py-2">쏠림</th>
                      <th className="px-2 py-2">현금</th>
                      <th className="px-2 py-2">변동성/MDD</th>
                      <th className="px-2 py-2">메모</th>
                      <th className="px-2 py-2 text-right">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioChecks.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-2 py-8 text-center text-muted-foreground">
                          구조 점검 기록이 없습니다.
                        </td>
                      </tr>
                    )}
                    {portfolioChecks.map(row => (
                      <tr key={row.id} className="border-t border-border/60">
                        <td className="px-2 py-3">{row.date}</td>
                        <td className="px-2 py-3">{row.checkType}</td>
                        <td className="px-2 py-3">
                          <Badge variant={statusBadgeVariant(row.assetClassBalance)}>{row.assetClassBalance}</Badge>
                        </td>
                        <td className="px-2 py-3">
                          <Badge variant={statusBadgeVariant(row.concentration)}>{row.concentration}</Badge>
                        </td>
                        <td className="px-2 py-3">
                          <Badge variant={statusBadgeVariant(row.cashLevel)}>{row.cashLevel}</Badge>
                        </td>
                        <td className="px-2 py-3">
                          <Badge variant={statusBadgeVariant(row.volatilityDrawdown)}>{row.volatilityDrawdown}</Badge>
                        </td>
                        <td className="px-2 py-3">{row.factualNote || '-'}</td>
                        <td className="px-2 py-3 text-right">
                          <EnhancedButton variant="ghost" size="sm" onClick={() => handleDeletePortfolioCheck(row.id)}>
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

          <GlassCard className="p-6" animate animationDelay={320}>
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="text-3xl">📚</span> 성과 분석 & 전략 피드백 (Strategy Review)
              </h2>
              <p className="text-sm text-muted-foreground">결과가 아니라 의사결정 품질만 평가합니다.</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-lg border border-border/70 p-4 space-y-3">
                <p className="font-semibold">월간 점검</p>
                <Input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">규칙 위반 여부</p>
                  <Select
                    value={monthlyReview?.monthlyRuleCompliance ?? '미점검'}
                    onValueChange={val =>
                      upsertStrategyReview('month', selectedMonth, {
                        monthlyRuleCompliance: val as ComplianceStatus,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="준수">준수</SelectItem>
                      <SelectItem value="위반">위반</SelectItem>
                      <SelectItem value="미점검">미점검</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">실행 로그 점검</p>
                  <Select
                    value={monthlyReview?.monthlyExecutionLogAudit ?? '미점검'}
                    onValueChange={val =>
                      upsertStrategyReview('month', selectedMonth, {
                        monthlyExecutionLogAudit: val as ComplianceStatus,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="준수">준수</SelectItem>
                      <SelectItem value="위반">위반</SelectItem>
                      <SelectItem value="미점검">미점검</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-lg border border-border/70 p-4 space-y-3">
                <p className="font-semibold">분기 점검</p>
                <Input value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)} placeholder="예: 2026-Q1" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">가설 체크 시스템 작동</p>
                  <Select
                    value={quarterlyReview?.quarterHypothesisEngine ?? '미점검'}
                    onValueChange={val =>
                      upsertStrategyReview('quarter', selectedQuarter, {
                        quarterHypothesisEngine: val as ReviewStatus,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="작동">작동</SelectItem>
                      <SelectItem value="부분작동">부분작동</SelectItem>
                      <SelectItem value="미작동">미작동</SelectItem>
                      <SelectItem value="미점검">미점검</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">무효화 조건 타이밍</p>
                  <Select
                    value={quarterlyReview?.quarterInvalidationTiming ?? '미점검'}
                    onValueChange={val =>
                      upsertStrategyReview('quarter', selectedQuarter, {
                        quarterInvalidationTiming: val as ReviewStatus,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="작동">작동</SelectItem>
                      <SelectItem value="부분작동">부분작동</SelectItem>
                      <SelectItem value="미작동">미작동</SelectItem>
                      <SelectItem value="미점검">미점검</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-lg border border-border/70 p-4 space-y-3">
                <p className="font-semibold">연간 점검</p>
                <Input type="number" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">전략 존속 여부</p>
                  <Select
                    value={yearlyReview?.yearStrategyDecision ?? '미결정'}
                    onValueChange={val =>
                      upsertStrategyReview('year', selectedYear, {
                        yearStrategyDecision: val as StrategyDecision,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="존속">존속</SelectItem>
                      <SelectItem value="수정">수정</SelectItem>
                      <SelectItem value="중단">중단</SelectItem>
                      <SelectItem value="미결정">미결정</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">프레임워크 수정 필요성</p>
                  <Select
                    value={yearlyReview?.yearFrameworkNeed ?? '미결정'}
                    onValueChange={val =>
                      upsertStrategyReview('year', selectedYear, {
                        yearFrameworkNeed: val as StrategyDecision,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="존속">유지</SelectItem>
                      <SelectItem value="수정">수정</SelectItem>
                      <SelectItem value="중단">중단</SelectItem>
                      <SelectItem value="미결정">미결정</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-1">사실 기록 (선택)</p>
              <Textarea
                rows={2}
                placeholder="예: 월간 점검에서 실행 로그 누락 2건 확인"
                value={
                  monthlyReview?.factualNote || quarterlyReview?.factualNote || yearlyReview?.factualNote || ''
                }
                onChange={e => {
                  const value = e.target.value;
                  upsertStrategyReview('month', selectedMonth, { factualNote: value });
                }}
              />
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
