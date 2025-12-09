'use client';

import { useState } from 'react';

interface NarrativeGuideProps {
  mmcScore: number;
  phase: string;
  topChanges: {
    increases: string[];
    decreases: string[];
  };
}

export default function NarrativeGuide({ mmcScore, phase, topChanges }: NarrativeGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const questions = [
    {
      category: "시장 상황",
      items: [
        `현재 MMC ${mmcScore}점 (${phase})을 어떻게 해석하나요?`,
        "3대 사이클 중 가장 주목해야 할 부분은?",
        "이번 주 가장 중요한 경제 이벤트는?"
      ]
    },
    {
      category: "지표 분석",
      items: [
        topChanges.increases.length > 0
          ? `${topChanges.increases.join(', ')} 상승의 의미는?`
          : "주요 지표 변화가 없는 이유는?",
        topChanges.decreases.length > 0
          ? `${topChanges.decreases.join(', ')} 하락이 시사하는 바는?`
          : null,
        "다음 달 주목해야 할 지표는?"
      ].filter(Boolean) as string[]
    },
    {
      category: "투자 전략",
      items: [
        "현재 포트폴리오 리밸런싱이 필요한가?",
        "향후 1개월 투자 전략은?",
        "리스크 관리 포인트는?"
      ]
    },
    {
      category: "가설 검증",
      items: [
        "지난달 담론의 예측이 맞았나?",
        "틀렸다면 어떤 변수를 놓쳤나?",
        "다음 달 검증할 가설은?"
      ]
    }
  ];

  return (
    <div className="mb-4 bg-primary/5 rounded-lg p-4 border border-primary/20">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h4 className="text-sm font-semibold text-primary flex items-center">
          <span className="mr-2">💡</span>
          담론 작성 가이드
        </h4>
        <span className="text-xs text-muted-foreground">
          {isExpanded ? '접기' : '펼치기'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {questions.map((section, idx) => (
            <div key={idx}>
              <h5 className="text-xs font-semibold text-muted-foreground mb-2">
                {section.category}
              </h5>
              <ul className="space-y-1">
                {section.items.map((q, qIdx) => (
                  <li key={qIdx} className="text-sm text-foreground pl-4 relative">
                    <span className="absolute left-0 text-primary">•</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="mt-4 p-3 bg-white/50 rounded border border-primary/20">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> 구체적인 숫자와 근거를 함께 기록하면
              나중에 검증할 때 더 유용합니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
