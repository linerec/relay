import React, { useEffect } from 'react';
import { MochipadToolbar } from './MochipadToolbar';
import { TabPanel } from './TabPanel';
import { useCanvasSetup } from '../../hooks/useCanvasSetup';
import { useDrawingHandlers } from '../../hooks/useDrawingHandlers';
import { usePanAndZoom } from '../../hooks/usePanAndZoom';
import { useMochipadStore } from '../../stores/mochipadStore';
import './mochipad.css';

interface MochipadProps {
  onSave?: () => void;
}

export function Mochipad({ onSave }: MochipadProps) {
  const containerRef = useCanvasSetup();
  const {
    isDrawing,
    isMouseInCanvas,
    setIsMouseInCanvas,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useDrawingHandlers();

  const {
    isSpacePressed,
    setIsSpacePressed,
    isDragging,
    handleWheel,
    handleDragStart,
    handleDrag,
    handleDragEnd,
  } = usePanAndZoom();

  const { layers, activeLayerId } = useMochipadStore();

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }

      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        useMochipadStore.getState().undo();
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        useMochipadStore.getState().redo();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="mochipad-container">
      <MochipadToolbar onSave={onSave} />
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
          </div>
        </div>
        <TabPanel />
      </div>
    </div>
  );
}