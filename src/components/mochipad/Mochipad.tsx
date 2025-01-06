import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MochipadToolbar } from './MochipadToolbar';
import { LayerPanel } from './LayerPanel';
import { useMochipadStore } from '../../stores/mochipadStore';
import './mochipad.css';

export function Mochipad() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [buttonsPressed, setButtonsPressed] = useState<Set<number>>(new Set());
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isMouseInCanvas, setIsMouseInCanvas] = useState(false);
  
  const {
    layers,
    activeLayerId,
    addLayer,
    brushSize,
    brushColor,
    brushOpacity,
    canvasWidth,
    canvasHeight,
    scale,
    offset,
    updateZoom,
    getActiveLayer
  } = useMochipadStore();

  useEffect(() => {
    if (layers.length === 0) {
      addLayer();
    }
  }, []);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };

    const containerRect = container.getBoundingClientRect();
    const drawableArea = container.querySelector('.canvas-drawable-area') as HTMLElement;
    if (!drawableArea) return { x: 0, y: 0 };

    const drawableRect = drawableArea.getBoundingClientRect();

    // 마우스 위치를 drawable area 기준으로 변환
    const relativeX = e.clientX - drawableRect.left;
    const relativeY = e.clientY - drawableRect.top;

    // 현재 표시 크기와 실제 캔버스 크기의 비율 계산
    const displayToCanvasRatio = canvasWidth / drawableRect.width;

    // 실제 캔버스 좌표로 변환
    const canvasX = relativeX * displayToCanvasRatio;
    const canvasY = relativeY * displayToCanvasRatio;

    return {
      x: Math.max(0, Math.min(canvasWidth, canvasX)),
      y: Math.max(0, Math.min(canvasHeight, canvasY))
    };
  };

  // 현재 활성 레이어의 색상만을 위한 메모이제이션
  const activeBorderColor = useMemo(() => {
    const currentLayer = layers.find(layer => layer.id === activeLayerId);
    return currentLayer?.color || '#ccc';
  }, [layers, activeLayerId]);

  const drawLine = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    // 그리기용 활성 레이어는 직접 가져오기
    const activeLayer = useMochipadStore.getState().getActiveLayer();
    if (!activeLayer?.context) return;

    const ctx = activeLayer.context;
    ctx.save();
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = brushOpacity;
    
    ctx.stroke();
    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 || isSpacePressed) return;
    
    setIsDrawing(true);
    const point = getCanvasPoint(e);
    setLastPoint(point);
    
    // 그리기용 활성 레이어는 직접 가져오기
    const activeLayer = useMochipadStore.getState().getActiveLayer();
    if (activeLayer?.context) {
      const ctx = activeLayer.context;
      ctx.save();
      ctx.beginPath();
      ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = brushColor;
      ctx.globalAlpha = brushOpacity;
      ctx.fill();
      ctx.restore();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint || isSpacePressed) return;
    if (!isMouseInCanvas) return;
    
    const currentPoint = getCanvasPoint(e);
    drawLine(lastPoint, currentPoint);
    setLastPoint(currentPoint);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsMouseInCanvas(true);
    if (isDrawing) {
      const point = getCanvasPoint(e as unknown as React.MouseEvent<HTMLCanvasElement>);
      setLastPoint(point);
    }
  };

  const handleMouseLeave = () => {
    setIsMouseInCanvas(false);
    setLastPoint(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const drawableArea = container.querySelector('.canvas-drawable-area') as HTMLElement;
    if (!drawableArea) return;

    const drawableRect = drawableArea.getBoundingClientRect();

    // 마우스의 캔버스 내 상대 위치 계산 (0~1 사이의 값)
    const relativeX = (e.clientX - drawableRect.left) / drawableRect.width;
    const relativeY = (e.clientY - drawableRect.top) / drawableRect.height;

    // 현재 크기
    const currentWidth = drawableRect.width;
    const currentHeight = drawableRect.height;

    // 새로운 스케일 계산
    const delta = e.deltaY > 0 ? 1 : -1;
    const zoomFactor = 1 - delta * 0.1;
    const newScale = Math.min(5, Math.max(0.1, scale * zoomFactor));

    // 기본 스케일 (컨테이너에 맞추기 위한 스케일)
    const baseScale = Math.min(
      containerRect.width / canvasWidth,
      containerRect.height / canvasHeight
    );

    // 새로운 크기
    const newWidth = canvasWidth * baseScale * newScale;
    const newHeight = canvasHeight * baseScale * newScale;

    // 크기 변화량
    const deltaWidth = newWidth - currentWidth;
    const deltaHeight = newHeight - currentHeight;

    // 새로운 오프셋 계산
    // 현재 오프셋에서 크기 변화량과 마우스 위치 비율을 고려하여 조정
    const newOffset = {
      x: offset.x - (deltaWidth * relativeX),
      y: offset.y - (deltaHeight * relativeY)
    };

    // 상태 업데이트
    useMochipadStore.getState().setScale(newScale);
    useMochipadStore.getState().setOffset(newOffset);
  };

  // 마우스 버튼 상태 추적
  const handleMouseButtonChange = (e: React.MouseEvent, isDown: boolean) => {
    const newButtons = new Set(buttonsPressed);
    if (isDown) {
      newButtons.add(e.button);
    } else {
      newButtons.delete(e.button);
    }
    setButtonsPressed(newButtons);
    return newButtons;
  };

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        setIsDragging(false);
        setDragStart(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 드래그 시작
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSpacePressed) return;

    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  // 드래그 중
  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart) return;

    const newOffset = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    };
    useMochipadStore.getState().setOffset(newOffset);
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // 컨텍스트 메뉴 방지
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // 기본 스케일 계산 (컨테이너에 맞추기 위한 최소 스케일)
      const baseScale = Math.min(
        containerWidth / canvasWidth,
        containerHeight / canvasHeight
      );

      // 최종 표시 크기 계산
      const displayWidth = canvasWidth * baseScale * scale;
      const displayHeight = canvasHeight * baseScale * scale;

      const drawableArea = container.querySelector('.canvas-drawable-area') as HTMLElement;
      const layersContainer = container.querySelector('.canvas-layers-container') as HTMLElement;

      if (drawableArea && layersContainer) {
        // drawable area와 레이어 컨테이너의 크기와 위치 설정
        const styles = {
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          transform: `translate(${offset.x}px, ${offset.y}px)`
        };

        Object.assign(drawableArea.style, styles);
        Object.assign(layersContainer.style, styles);

        // 각 캔버스 레이어의 크기 설정
        layers.forEach(layer => {
          if (layer.canvas) {
            layer.canvas.style.width = `${displayWidth}px`;
            layer.canvas.style.height = `${displayHeight}px`;
          }
        });
      }
    };

    const resizeObserver = new ResizeObserver(updateCanvasSize);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    updateCanvasSize();

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [layers, canvasWidth, canvasHeight, scale, offset]);

  return (
    <div className="mochipad-container">
      <MochipadToolbar />
      <div className="mochipad-workspace">
        <div 
          className={`mochipad-canvas-container ${isSpacePressed ? 'hand-tool' : ''} ${isDragging ? 'dragging' : ''}`}
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleDragStart}
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onContextMenu={handleContextMenu}
        >
          <div className="canvas-background">
            <div 
              className="canvas-drawable-area"
              style={{
                borderColor: activeBorderColor,
                boxShadow: activeBorderColor !== '#ccc' ? `0 0 10px ${activeBorderColor}40` : undefined
              }}
            />
          </div>
          <div 
            className="canvas-layers-container"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {layers.map((layer, index) => (
              <canvas
                key={layer.id}
                ref={(canvas) => {
                  if (canvas && !layer.canvas) {
                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;
                    
                    const context = canvas.getContext('2d');
                    if (context) {
                      // 맨 아래 레이어(index 0)만 흰색 배경으로 초기화
                      if (index === 0) {
                        context.fillStyle = '#ffffff';
                        context.fillRect(0, 0, canvasWidth, canvasHeight);
                      } else {
                        // 나머지 레이어는 투명하게 초기화
                        context.clearRect(0, 0, canvasWidth, canvasHeight);
                      }
                    }
                    
                    useMochipadStore.getState().initializeLayerCanvas(layer.id, canvas);
                  }
                }}
                className="mochipad-canvas-layer"
                style={{
                  opacity: layer.opacity,
                  display: layer.visible ? 'block' : 'none',
                  zIndex: index,
                  pointerEvents: layer.id === activeLayerId ? 'auto' : 'none'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              />
            ))}
          </div>
        </div>
        <LayerPanel />
      </div>
    </div>
  );
} 