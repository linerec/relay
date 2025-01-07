import { useState, useCallback } from 'react';
import { useMochipadStore } from '../stores/mochipadStore';

export function usePanAndZoom() {
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const { scale, offset, setScale, setOffset } = useMochipadStore();

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const drawableRect = (e.currentTarget.querySelector('.canvas-drawable-area') as HTMLElement)?.getBoundingClientRect();
    if (!drawableRect) return;

    const relativeX = (e.clientX - drawableRect.left) / drawableRect.width;
    const relativeY = (e.clientY - drawableRect.top) / drawableRect.height;

    const delta = e.deltaY > 0 ? 1 : -1;
    const zoomFactor = 1 - delta * 0.1;
    const newScale = Math.min(5, Math.max(0.1, scale * zoomFactor));

    const deltaWidth = drawableRect.width * (newScale / scale - 1);
    const deltaHeight = drawableRect.height * (newScale / scale - 1);

    const newOffset = {
      x: offset.x - (deltaWidth * relativeX),
      y: offset.y - (deltaHeight * relativeY)
    };

    setScale(newScale);
    setOffset(newOffset);
  }, [scale, offset]);

  const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSpacePressed) return;

    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }, [isSpacePressed, offset]);

  const handleDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart) return;

    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

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