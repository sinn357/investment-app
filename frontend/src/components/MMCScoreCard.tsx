interface MMCScoreCardProps {
  mmc_score: number;
  phase: string;
  macro: { score: number; phase: string };
  credit: { score: number; state: string };
  sentiment: { score: number; state: string };
  updated_at: string;
}

export default function MMCScoreCard({
  mmc_score,
  phase,
  macro,
  credit,
  sentiment,
  updated_at
}: MMCScoreCardProps) {
  return (
    <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border-2 border-primary/20">
      <h2 className="text-xl font-semibold mb-4">📊 오늘의 시장 점수</h2>

      {/* MMC 종합 점수 */}
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-primary mb-2">{mmc_score}</div>
        <div className="text-lg text-muted-foreground">{phase}</div>
      </div>

      {/* 3대 사이클 요약 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-white/50 rounded-lg">
          <div className="text-xs text-muted-foreground">거시경제</div>
          <div className="text-2xl font-bold text-foreground">{macro.score}</div>
          <div className="text-xs text-muted-foreground">{macro.phase}</div>
        </div>
        <div className="text-center p-3 bg-white/50 rounded-lg">
          <div className="text-xs text-muted-foreground">신용/유동성</div>
          <div className="text-2xl font-bold text-foreground">{credit.score}</div>
          <div className="text-xs text-muted-foreground">{credit.state}</div>
        </div>
        <div className="text-center p-3 bg-white/50 rounded-lg">
          <div className="text-xs text-muted-foreground">심리/밸류</div>
          <div className="text-2xl font-bold text-foreground">{sentiment.score}</div>
          <div className="text-xs text-muted-foreground">{sentiment.state}</div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-right mt-4">
        업데이트: {new Date(updated_at).toLocaleString('ko-KR')}
      </div>
    </div>
  );
}
