import { useState, useCallback, useRef } from 'react';
import { useMochipadStore } from '../stores/mochipadStore';

export function useDrawingHandlers() {
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
    if (e.button !== 0) return;
    
    const store = useMochipadStore.getState();
    const activeLayer = store.getActiveLayer();
    if (!activeLayer?.visible) return;

    drawingStarted.current = true;
    
    const drawableRect = e.currentTarget.getBoundingClientRect();
    const point = getCanvasPoint(e.clientX, e.clientY, drawableRect);
    
    setIsDrawing(true);
    setLastPoint(point);

    const context = activeLayer.context;
    if (context) {
      context.beginPath();
      context.moveTo(point.x, point.y);
      context.strokeStyle = brushColor;
      context.lineWidth = brushSize;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.globalAlpha = brushOpacity;

      context.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
      context.fill();
      
      //store.saveHistory();
    }
  }, [brushColor, brushSize, brushOpacity]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint || !isMouseInCanvas) return;

    const activeLayer = useMochipadStore.getState().getActiveLayer();
    if (!activeLayer?.visible || !activeLayer.context) return;

    if (drawingStarted.current) {
      drawingStarted.current = false;
    }

    const drawableRect = e.currentTarget.getBoundingClientRect();
    const point = getCanvasPoint(e.clientX, e.clientY, drawableRect);

    activeLayer.context.lineTo(point.x, point.y);
    activeLayer.context.stroke();
    activeLayer.context.beginPath();
    activeLayer.context.moveTo(point.x, point.y);

    setLastPoint(point);
  }, [isDrawing, lastPoint, isMouseInCanvas]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing) {
      useMochipadStore.getState().saveHistory();
    }
    drawingStarted.current = false;
    setIsDrawing(false);
    setLastPoint(null);
  }, [isDrawing]);

  return {
    isDrawing,
    isMouseInCanvas,
    setIsMouseInCanvas,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}