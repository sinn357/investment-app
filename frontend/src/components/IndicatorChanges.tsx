interface IndicatorChange {
  indicator: string;
  from: number;
  to: number;
  change: number; // 변화율 (%)
  impact: 'low' | 'medium' | 'high';
}

interface IndicatorChangesProps {
  increases: IndicatorChange[];
  decreases: IndicatorChange[];
  unchanged: IndicatorChange[];
}

export default function IndicatorChanges({ increases, decreases, unchanged }: IndicatorChangesProps) {
  return (
    <div className="bg-card rounded-lg p-4 border border-primary/20">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <span className="mr-2">📈</span>
        주요 지표 변화 (전일 대비)
      </h3>

      {/* 증가 */}
      {increases.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-green-600 mb-2">↑ 상승</h4>
          <div className="space-y-2">
            {increases.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{item.indicator}</span>
                <span className="text-green-600 font-medium">
                  {item.from} → {item.to} (+{item.change.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 감소 */}
      {decreases.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-red-600 mb-2">↓ 하락</h4>
          <div className="space-y-2">
            {decreases.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{item.indicator}</span>
                <span className="text-red-600 font-medium">
                  {item.from} → {item.to} ({item.change.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 변화 없음 */}
      {unchanged.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">→ 변화 없음</h4>
          <div className="flex flex-wrap gap-2">
            {unchanged.map((item, idx) => (
              <span key={idx} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                {item.indicator}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 모두 비어있을 때 */}
      {increases.length === 0 && decreases.length === 0 && unchanged.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          데이터를 불러오는 중...
        </p>
      )}
    </div>
  );
}
