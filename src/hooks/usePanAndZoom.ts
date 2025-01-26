import { useState, useCallback, useEffect } from 'react';
import { useMochipadStore } from '../stores/mochipadStore';

// Canvas의 확대/축소와 이동을 관리하는 커스텀 훅
// 이 훅은 Mochipad 컴포넌트에서 사용되며 캔버스의 모든 Pan/Zoom 관련 기능을 제공합니다
export function usePanAndZoom() {
  // 스페이스바가 눌렸는지 여부를 추적
  // 스페이스바가 눌린 상태에서만 캔버스 이동이 가능합니다
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // 현재 드래그 중인지 여부를 추적
  const [isDragging, setIsDragging] = useState(false);

  // 드래그 시작 위치를 저장
  // 드래그 시작점을 기준으로 얼마나 이동했는지 계산하는데 사용됩니다
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Zustand 스토어에서 필요한 상태와 액션들을 가져옵니다
  const { scale, offset, setScale, setOffset } = useMochipadStore();

  // 마우스 휠 이벤트 핸들러
  // 캔버스의 확대/축소를 담당합니다
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();

    // 실제 그리기 영역의 DOM 요소와 위치 정보를 가져옵니다
    const drawableRect = (e.currentTarget.querySelector('.canvas-drawable-area') as HTMLElement)?.getBoundingClientRect();
    if (!drawableRect) return;

    // 마우스 포인터의 캔버스 내 상대적 위치를 계산 (0~1 사이의 값)
    const relativeX = (e.clientX - drawableRect.left) / drawableRect.width;
    const relativeY = (e.clientY - drawableRect.top) / drawableRect.height;

    // 휠 방향에 따라 확대/축소 방향 결정
    const delta = e.deltaY > 0 ? 1 : -1;
    // 확대/축소 비율 계산 (한 번에 10%씩 변화)
    const zoomFactor = 1 - delta * 0.1;
    // 최소 0.1배, 최대 5배로 제한된 새로운 scale 계산
    const newScale = Math.min(5, Math.max(0.1, scale * zoomFactor));

    // 확대/축소에 따른 캔버스 크기 변화량 계산
    const deltaWidth = drawableRect.width * (newScale / scale - 1);
    const deltaHeight = drawableRect.height * (newScale / scale - 1);

    // 마우스 포인터 위치를 기준으로 새로운 offset 계산
    // 이를 통해 마우스 포인터가 있는 지점을 중심으로 확대/축소가 이루어집니다
    const newOffset = {
      x: offset.x - (deltaWidth * relativeX),
      y: offset.y - (deltaHeight * relativeY)
    };

    // 계산된 새로운 scale과 offset을 스토어에 적용
    setScale(newScale);
    setOffset(newOffset);
  }, [scale, offset]);

  // 드래그 시작 핸들러
  const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // 스페이스바가 눌려있지 않으면 드래그 불가
    if (!isSpacePressed) return;

    e.preventDefault();
    setIsDragging(true);
    // 현재 마우스 위치와 offset의 차이를 저장
    // 이 값은 드래그 중에 새로운 offset을 계산하는데 사용됩니다
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }, [isSpacePressed, offset]);

  // 드래그 중 핸들러
  const handleDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // 드래그 중이 아니거나 시작점이 없으면 무시
    if (!isDragging || !dragStart) return;

    // 현재 마우스 위치에서 드래그 시작점을 뺀 값으로 새로운 offset 설정
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  // 드래그 종료 핸들러
  const handleDragEnd = useCallback(() => {
    // 드래그 상태와 시작점을 초기화
    setIsDragging(false);
    setDragStart(null);
  }, []);

  // 훅의 반환값들
  // 이 값들은 Mochipad 컴포넌트에서 캔버스의 이벤트 핸들러로 사용됩니다
  return {
    isSpacePressed,
    setIsSpacePressed,
    isDragging,
    handleWheel,
    handleDragStart,
    handleDrag,
    handleDragEnd,
  };
}