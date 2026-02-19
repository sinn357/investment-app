'use client';

import { useMemo, useState } from 'react';

interface HistoryRow {
  release_date: string;
}

interface ReleaseIndicator {
  id: string;
  name: string;
  nameKo?: string;
  category: string;
  data?: {
    latest_release?: {
      release_date?: string;
    };
    next_release?: {
      release_date?: string;
    };
    history_table?: HistoryRow[];
  };
}

interface ReleaseEvent {
  id: string;
  indicatorId: string;
  label: string;
  category: string;
  date: Date;
  source: 'crawler_next_release' | 'estimated_history';
}

interface IndicatorReleaseCalendarProps {
  indicators: ReleaseIndicator[];
}

const CATEGORY_LABELS: Record<string, string> = {
  business: '경기',
  employment: '고용',
  inflation: '물가',
  interest: '금리',
  trade: '무역',
  credit: '신용',
  sentiment: '심리',
};

const CADENCE_FALLBACK_DAYS: Record<string, number> = {
  'initial-jobless-claims': 7,
  'ism-manufacturing': 30,
  'ism-non-manufacturing': 30,
  'nonfarm-payrolls': 30,
  'unemployment-rate': 30,
  'core-cpi': 30,
  'pce': 30,
  'federal-funds-rate': 45,
};

function parseYmdDate(raw?: string | null): Date | null {
  if (!raw || raw === '미정') return null;
  const text = String(raw).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function estimateCadenceDays(indicator: ReleaseIndicator): number | null {
  const history = (indicator.data?.history_table || [])
    .map((row) => parseYmdDate(row.release_date))
    .filter((value): value is Date => value !== null)
    .sort((a, b) => b.getTime() - a.getTime());

  if (history.length >= 3) {
    const intervals: number[] = [];
    for (let i = 0; i < Math.min(5, history.length - 1); i += 1) {
      const diff = Math.round((history[i].getTime() - history[i + 1].getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 5 && diff <= 45) intervals.push(diff);
    }
    if (intervals.length > 0) {
      const avg = Math.round(intervals.reduce((sum, value) => sum + value, 0) / intervals.length);
      return Math.min(45, Math.max(5, avg));
    }
  }

  return CADENCE_FALLBACK_DAYS[indicator.id] || null;
}

function createEvents(indicators: ReleaseIndicator[]): ReleaseEvent[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 120);

  const events: ReleaseEvent[] = [];

  indicators.forEach((indicator) => {
    const label = indicator.nameKo || indicator.name;
    const nextReleaseDate = parseYmdDate(indicator.data?.next_release?.release_date);

    if (nextReleaseDate && nextReleaseDate >= now && nextReleaseDate <= horizon) {
      events.push({
        id: `${indicator.id}-${dateKey(nextReleaseDate)}-next`,
        indicatorId: indicator.id,
        label,
        category: indicator.category,
        date: nextReleaseDate,
        source: 'crawler_next_release',
      });
      return;
    }

    const latestDate = parseYmdDate(indicator.data?.latest_release?.release_date)
      || parseYmdDate(indicator.data?.history_table?.[0]?.release_date);
    const cadence = estimateCadenceDays(indicator);

    if (!latestDate || !cadence) return;

    const estimated = new Date(latestDate);
    while (estimated < now) {
      estimated.setDate(estimated.getDate() + cadence);
    }

    if (estimated <= horizon) {
      events.push({
        id: `${indicator.id}-${dateKey(estimated)}-est`,
        indicatorId: indicator.id,
        label,
        category: indicator.category,
        date: new Date(estimated),
        source: 'estimated_history',
      });
    }
  });

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export default function IndicatorReleaseCalendar({ indicators }: IndicatorReleaseCalendarProps) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const events = useMemo(() => createEvents(indicators), [indicators]);

  const eventsByDate = useMemo(() => {
    const grouped: Record<string, ReleaseEvent[]> = {};
    events.forEach((event) => {
      const key = dateKey(event.date);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(event);
    });
    return grouped;
  }, [events]);

  const days = useMemo(() => {
    const first = startOfMonth(cursor);
    const last = endOfMonth(cursor);
    const startWeekDay = first.getDay();

    const cells: Array<{ date: Date; inMonth: boolean }> = [];

    for (let i = 0; i < startWeekDay; i += 1) {
      const d = new Date(first);
      d.setDate(first.getDate() - (startWeekDay - i));
      cells.push({ date: d, inMonth: false });
    }

    for (let day = 1; day <= last.getDate(); day += 1) {
      cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), day), inMonth: true });
    }

    while (cells.length % 7 !== 0) {
      const d = new Date(last);
      d.setDate(last.getDate() + (cells.length % 7));
      cells.push({ date: d, inMonth: false });
    }

    return cells;
  }, [cursor]);

  const visibleMonthStart = startOfMonth(cursor);
  const visibleMonthEnd = endOfMonth(cursor);

  const monthlyEvents = events.filter(
    (event) => event.date >= visibleMonthStart && event.date <= visibleMonthEnd
  );

  const upcomingEvents = events.slice(0, 12);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">월별 캘린더</h4>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700"
          >
            이전
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
          </span>
          <button
            type="button"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-700"
          >
            다음
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400 mb-1">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {days.map(({ date, inMonth }) => {
          const key = dateKey(date);
          const dayEvents = eventsByDate[key] || [];

          return (
            <div
              key={`${key}-${inMonth ? 'in' : 'out'}`}
              className={[
                'min-h-[56px] rounded border p-1',
                inMonth
                  ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40'
                  : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20 text-gray-400',
              ].join(' ')}
            >
              <div className="text-xs font-medium">{date.getDate()}</div>
              {dayEvents.length > 0 && (
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={[
                        'truncate rounded px-1 py-0.5 text-[10px]',
                        event.source === 'crawler_next_release'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
                      ].join(' ')}
                    >
                      {event.label}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-gray-500">+{dayEvents.length - 2}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">이번 달 일정 ({monthlyEvents.length})</h5>
          <ul className="space-y-1 text-sm">
            {monthlyEvents.length > 0 ? (
              monthlyEvents.map((event) => (
                <li key={`month-${event.id}`} className="flex items-center justify-between gap-2">
                  <span className="truncate text-gray-700 dark:text-gray-300">{event.label}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(event.date)}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-gray-500">이번 달 예정 이벤트가 없습니다.</li>
            )}
          </ul>
        </div>

        <div>
          <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">다가오는 일정 Top 12</h5>
          <ul className="space-y-1 text-sm">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <li key={`upcoming-${event.id}`} className="flex items-center justify-between gap-2">
                  <span className="truncate text-gray-700 dark:text-gray-300">
                    [{CATEGORY_LABELS[event.category] || event.category}] {event.label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(event.date)} {event.source === 'crawler_next_release' ? '· 확정' : '· 예상'}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-sm text-gray-500">예정된 발표일 데이터가 없습니다.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
