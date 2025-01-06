import React, { useEffect, useRef, useCallback } from 'react';
import { useCanvasDrawingStore } from '../../stores/canvasDrawingStore';
import { CanvasDrawingToolbar } from './CanvasDrawingToolbar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useAutoSave } from '../../hooks/useAutoSave';
import { Button } from 'react-bootstrap';
import './styles.css';
import { ColorPicker } from './ColorPicker';

interface CanvasDrawingEditorProps {
  initialImage?: string;
  onSave: (imageData: string) => void;
}

export function CanvasDrawingEditor({ initialImage, onSave }: CanvasDrawingEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const {
    currentTool,
    brushColor,
    brushSettings,
    eraserSettings,
    setContext,
    isDrawing,
    setIsDrawing,
    addToHistory
  } = useCanvasDrawingStore();

  useKeyboardShortcuts();
  useAutoSave();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = 800;
    canvas.height = 600;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';
    setContext(context);

    // Set initial background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Load initial image if provided
    if (initialImage) {
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0);
        addToHistory(context.getImageData(0, 0, canvas.width, canvas.height));
      };
      img.src = initialImage;
    } else {
      addToHistory(context.getImageData(0, 0, canvas.width, canvas.height));
    }
  }, []);

  // 마우스 좌표를 Canvas 좌표로 변환하는 함수
  const getCanvasPoint = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Canvas의 실제 크기와 표시 크기의 비율 계산
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    return {
      x: x * scaleX,
      y: y * scaleY
    };
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // 기본 컨텍스트 메뉴 방지
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const point = getCanvasPoint(e.clientX, e.clientY);
    if (!point) return;

    const isRightClick = e.button === 2;

    if (currentTool === 'bucket' && !isRightClick) {
      floodFill(context, Math.round(point.x), Math.round(point.y), brushColor);
      addToHistory(context.getImageData(0, 0, canvas.width, canvas.height));
      return;
    }

    context.beginPath();
    context.moveTo(point.x, point.y);
    
    if (isRightClick || currentTool === 'eraser') {
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = eraserSettings.size;
      context.globalAlpha = eraserSettings.opacity;
    } else {
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = brushColor;
      context.lineWidth = brushSettings.size;
      context.globalAlpha = brushSettings.opacity;
    }

    setIsDrawing(true);
  };

  const draw = useCallback((clientX: number, clientY: number) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const point = getCanvasPoint(clientX, clientY);
    if (!point) return;

    context.lineTo(point.x, point.y);
    context.stroke();
  }, [isDrawing]);

  // 커서 미리보기 업데이트 함수
  const updateCursorPreview = useCallback((clientX: number, clientY: number) => {
    if (!cursorRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // 현재 도구의 크기 가져오기
    const size = currentTool === 'eraser' ? eraserSettings.size : brushSettings.size;
    const opacity = currentTool === 'eraser' ? eraserSettings.opacity : brushSettings.opacity;

    // 커서가 캔버스 영역 안에 있을 때만 보이도록
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      cursorRef.current.style.display = currentTool === 'bucket' ? 'none' : 'block';
      cursorRef.current.style.left = `${clientX}px`;
      cursorRef.current.style.top = `${clientY}px`;
      cursorRef.current.style.width = `${size}px`;
      cursorRef.current.style.height = `${size}px`;
      cursorRef.current.style.backgroundColor = currentTool === 'eraser' ? 'rgba(255,255,255,0.5)' : brushColor;
      cursorRef.current.style.opacity = String(opacity);
      cursorRef.current.style.border = '2px solid rgba(0,0,0,0.5)';
      cursorRef.current.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.5)';
    } else {
      cursorRef.current.style.display = 'none';
    }
  }, [currentTool, brushSettings.size, eraserSettings.size, brushColor, brushSettings.opacity, eraserSettings.opacity]);

  // 마우스 이동 이벤트 처리
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDrawing) {
        draw(e.clientX, e.clientY);
      }
      updateCursorPreview(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      if (!canvasRef.current || !isDrawing) return;

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      context.closePath();
      context.globalAlpha = 1.0;
      setIsDrawing(false);
      
      addToHistory(context.getImageData(0, 0, canvas.width, canvas.height));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDrawing, draw, updateCursorPreview]);

  const handleSave = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave(dataUrl);
  };

  const floodFill = (context: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string) => {
    const imageData = context.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    const pixels = imageData.data;
    
    // 시작 픽셀의 색상 가져오기
    const startPos = (startY * imageData.width + startX) * 4;
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];
    const startA = pixels[startPos + 3];

    // 채울 색상을 RGB로 변환
    const fillRGB = hexToRgb(fillColor);
    if (!fillRGB) return;

    // 방문한 픽셀을 추적하기 위한 배열
    const visited = new Set<number>();
    
    // 색상이 유사한지 확인하는 함수
    const isSimilarColor = (pos: number) => {
      return Math.abs(pixels[pos] - startR) < 5 &&
             Math.abs(pixels[pos + 1] - startG) < 5 &&
             Math.abs(pixels[pos + 2] - startB) < 5 &&
             Math.abs(pixels[pos + 3] - startA) < 5;
    };

    // flood fill 알고리즘
    const stack = [[startX, startY]];
    
    while (stack.length) {
      const [x, y] = stack.pop()!;
      const pos = (y * imageData.width + x) * 4;
      
      if (visited.has(pos)) continue;
      if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) continue;
      if (!isSimilarColor(pos)) continue;

      // 픽셀 색상 변경
      pixels[pos] = fillRGB.r;
      pixels[pos + 1] = fillRGB.g;
      pixels[pos + 2] = fillRGB.b;
      pixels[pos + 3] = 255;
      
      visited.add(pos);
      
      // 인접 픽셀 확인
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    
    context.putImageData(imageData, 0, 0);
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  return (
    <div className="drawing-editor">
      <CanvasDrawingToolbar />
      <div className="d-flex flex-column flex-lg-row gap-3">
        <div className="canvas-container border rounded position-relative" 
          style={{ borderColor: '#dee2e6' }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
          />
          <div
            ref={cursorRef}
            className="cursor-preview"
            style={{
              position: 'fixed',
              pointerEvents: 'none',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              display: 'none',
              border: '2px solid rgba(0,0,0,0.5)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.5)'
            }}
          />
        </div>
        <div className="drawing-tools" style={{ minWidth: '200px' }}>
          <ColorPicker />
        </div>
      </div>
      <div className="mt-3 d-flex justify-content-between align-items-center">
        <Button variant="primary" onClick={handleSave}>Save Drawing</Button>
        <div className="text-muted small">
          <div className="mb-1">단축키 안내:</div>
          <div className="d-flex gap-4">
            <div>
              <div>A: 브러시</div>
              <div>S: 지우개</div>
              <div>D: 페인트 버킷</div>
            </div>
            <div>
              <div>Ctrl+Z: 실행 취소</div>
              <div>Ctrl+Y: 다시 실행</div>
              <div>우클릭 드래그: 지우개</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}