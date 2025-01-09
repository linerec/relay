import { useState, useCallback, useRef } from 'react';
import { useMochipadStore } from '../stores/mochipadStore';

interface DrawingHandlersProps {
  isSpacePressed?: boolean;
}

export function useDrawingHandlers({ isSpacePressed }: DrawingHandlersProps = {}) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [isMouseInCanvas, setIsMouseInCanvas] = useState(false);
  const drawingStarted = useRef(false);

  const {
    canvasWidth,
    canvasHeight,
    brushColor,
    brushSize,
    brushOpacity,
    offscreenContext,
  } = useMochipadStore();

  const getCanvasPoint = useCallback((clientX: number, clientY: number, drawableRect: DOMRect) => {
    const relativeX = clientX - drawableRect.left;
    const relativeY = clientY - drawableRect.top;
    const displayToCanvasRatio = canvasWidth / drawableRect.width;

    return {
      x: Math.max(0, Math.min(canvasWidth, relativeX * displayToCanvasRatio)),
      y: Math.max(0, Math.min(canvasHeight, relativeY * displayToCanvasRatio))
    };
  }, [canvasWidth, canvasHeight]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isSpacePressed) return;
    if (e.button !== 0) return;
    
    const store = useMochipadStore.getState();
    const activeLayer = store.getActiveLayer();
    if (!activeLayer?.visible || !store.offscreenContext) return;

    console.log('Started drawing on offscreen canvas');
    drawingStarted.current = true;
    
    const drawableRect = e.currentTarget.getBoundingClientRect();
    const point = getCanvasPoint(e.clientX, e.clientY, drawableRect);
    
    setIsDrawing(true);
    setLastPoint(point);

    // Offscreen Canvas와 화면의 canvas 모두에 그리기 시작
    const context = store.offscreenContext;
    const displayContext = (e.currentTarget.parentElement?.querySelector('.offscreen-canvas') as HTMLCanvasElement)?.getContext('2d');
    
    [context, displayContext].forEach(ctx => {
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 1;
    });
    
  }, [brushColor, brushSize, brushOpacity, isSpacePressed]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isSpacePressed) return;
    if (!isDrawing || !lastPoint || !isMouseInCanvas) return;

    const store = useMochipadStore.getState();
    const activeLayer = store.getActiveLayer();
    if (!activeLayer?.visible || !store.offscreenContext) return;

    if (drawingStarted.current) {
      drawingStarted.current = false;
    }

    const drawableRect = e.currentTarget.getBoundingClientRect();
    const point = getCanvasPoint(e.clientX, e.clientY, drawableRect);

    // Offscreen Canvas와 화면의 canvas 모두에 그리기
    const context = store.offscreenContext;
    const displayContext = (e.currentTarget.parentElement?.querySelector('.offscreen-canvas') as HTMLCanvasElement)?.getContext('2d');
    
    [context, displayContext].forEach(ctx => {
      if (!ctx) return;
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    });

    setLastPoint(point);
  }, [isDrawing, lastPoint, isMouseInCanvas, isSpacePressed]);

  const handleMouseUp = useCallback(() => {
    if (isSpacePressed) return;
    if (!isDrawing) return;

    const store = useMochipadStore.getState();
    const activeLayer = store.getActiveLayer();
    
    if (activeLayer?.context && store.offscreenCanvas) {
      activeLayer.context.globalAlpha = brushOpacity;
      activeLayer.context.drawImage(store.offscreenCanvas, 0, 0);
      console.log(`Copied drawing to layer: ${activeLayer.name}`);
      
      // Offscreen Canvas와 화면의 canvas 모두 비우기
      store.offscreenContext?.clearRect(0, 0, canvasWidth, canvasHeight);
      const displayCanvas = document.querySelector('.offscreen-canvas') as HTMLCanvasElement;
      const displayContext = displayCanvas?.getContext('2d');
      displayContext?.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // 히스토리 저장
      store.saveHistory();
    }

    drawingStarted.current = false;
    setIsDrawing(false);
    setLastPoint(null);
  }, [isDrawing, canvasWidth, canvasHeight, brushOpacity, isSpacePressed]);

  return {
    isDrawing,
    isMouseInCanvas,
    setIsMouseInCanvas,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}