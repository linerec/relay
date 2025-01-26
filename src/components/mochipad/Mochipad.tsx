import React, { useEffect } from 'react';
import { MochipadToolbar } from './MochipadToolbar';
import { TabPanel } from './TabPanel';
import { useCanvasSetup } from '../../hooks/useCanvasSetup';
import { useDrawingHandlers } from '../../hooks/useDrawingHandlers';
import { usePanAndZoom } from '../../hooks/usePanAndZoom';
import { useMochipadStore } from '../../stores/mochipadStore';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import './mochipad.css';

interface MochipadProps {
  cutId?: string;
  comicId?: string;
  cutData?: any;
}

export function Mochipad({ cutId, comicId, cutData }: MochipadProps) {
  const containerRef = useCanvasSetup();
  const store = useMochipadStore();

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

  const { layers, activeLayerId } = useMochipadStore();

  useKeyboardShortcuts({ setIsSpacePressed });

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
            {layers.map((layer, index) => (
              <canvas
                key={layer.id}
                ref={(canvas) => {
                  if (canvas && !layer.canvas) {
                    canvas.width = useMochipadStore.getState().canvasWidth;
                    canvas.height = useMochipadStore.getState().canvasHeight;
                    const context = canvas.getContext('2d');
                    if (context) {
                      useMochipadStore.getState().initializeLayerCanvas(layer.id, canvas);
                    }
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
