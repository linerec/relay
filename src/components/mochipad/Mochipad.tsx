import React, { useEffect, useCallback } from 'react';
import { MochipadToolbar } from './MochipadToolbar';
import { TabPanel } from './TabPanel';
import { useCanvasSetup } from '../../hooks/useCanvasSetup';
import { useDrawingHandlers } from '../../hooks/useDrawingHandlers';
import { usePanAndZoom } from '../../hooks/usePanAndZoom';
import { useMochipadStore } from '../../stores/mochipadStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import './mochipad.css';
import { Layer } from '../../stores/mochipadStore';

interface MochipadProps {
  cutId?: string;
  comicId?: string;
  cutData?: any;
}

export function Mochipad({ cutId, comicId, cutData }: MochipadProps) {
  const containerRef = useCanvasSetup();

  const {
    isSpacePressed,
    setIsSpacePressed,
    isDragging,
    handleWheel,
    handleDragStart,
    handleDrag,
    handleDragEnd,
  } = usePanAndZoom();

  const {
    setIsMouseInCanvas,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useDrawingHandlers({ isSpacePressed });

  const {
    layers,
    activeLayerId,
    canvasWidth,
    canvasHeight,
    initializeLayerCanvas
  } = useMochipadStore();

  useKeyboardShortcuts({ setIsSpacePressed });

  const isDev = import.meta.env.VITE_DEV_MODE === 'true';

  const renderLayerName = useCallback((ctx: CanvasRenderingContext2D, layer: Layer) => {
    if (!isDev) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(5, 5, ctx.measureText(layer.name).width + 10, 20);

    ctx.font = '12px Arial';
    ctx.fillStyle = layer.color;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeText(layer.name, 10, 20);
    ctx.fillText(layer.name, 10, 20);
    ctx.restore();
  }, [isDev]);

  const handleCanvasRef = useCallback((canvas: HTMLCanvasElement | null, layer: Layer) => {
    if (!canvas || layer.canvas === canvas) return;

    initializeLayerCanvas(layer.id, canvas);

    if (layer.canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(layer.canvas, 0, 0);

        if (isDev) {
          renderLayerName(ctx, layer);
        }
      }
    }
  }, [initializeLayerCanvas, renderLayerName, isDev]);

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
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="canvas-background">
            <div className="canvas-drawable-area" />
          </div>
          <div
            className="canvas-layers-container"
            onMouseEnter={() => setIsMouseInCanvas(true)}
            onMouseLeave={() => setIsMouseInCanvas(false)}
          >
            {layers.map((layer) => (
              <canvas
                key={layer.id}
                ref={(canvas) => handleCanvasRef(canvas, layer)}
                width={canvasWidth}
                height={canvasHeight}
                className={`mochipad-layer ${layer.visible ? '' : 'hidden'} ${layer.id === activeLayerId ? 'active' : ''
                  }`}
                style={{
                  opacity: layer.opacity,
                  zIndex: layer.sequence
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              />
            ))}
            <canvas
              ref={(canvas) => {
                if (canvas && !useMochipadStore.getState().offscreenCanvas) {
                  canvas.width = useMochipadStore.getState().canvasWidth;
                  canvas.height = useMochipadStore.getState().canvasHeight;
                  useMochipadStore.getState().initializeOffscreenCanvas();
                }
              }}
              className="mochipad-canvas-layer offscreen-canvas"
              style={{
                zIndex: layers.length,
                pointerEvents: 'none',
                opacity: useMochipadStore.getState().brushOpacity
              }}
            />
          </div>
        </div>
        <TabPanel />
      </div>
    </div>
  );
}
