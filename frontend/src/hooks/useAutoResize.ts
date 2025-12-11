import { useEffect, useRef } from 'react';

/**
 * 텍스트 내용에 따라 textarea의 높이를 자동으로 조절하는 훅
 * @param value - textarea의 현재 값
 * @param minRows - 최소 줄 수 (기본값: 3)
 * @param maxRows - 최대 줄 수 (기본값: 30)
 */
export function useAutoResize(value: string, minRows = 3, maxRows = 30) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 높이를 초기화하여 scrollHeight를 정확히 계산
    textarea.style.height = 'auto';

    // 한 줄의 높이 계산 (line-height 기준)
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
    const minHeight = lineHeight * minRows;
    const maxHeight = lineHeight * maxRows;

    // 내용에 맞는 높이 계산
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));

    textarea.style.height = `${newHeight}px`;
  }, [value, minRows, maxRows]);

  return textareaRef;
}
