import React, { useEffect } from 'react';
import { MochipadToolbar } from './MochipadToolbar';
import { TabPanel } from './TabPanel';
import { useCanvasSetup } from '../../hooks/useCanvasSetup';
import { useDrawingHandlers } from '../../hooks/useDrawingHandlers';
import { usePanAndZoom } from '../../hooks/usePanAndZoom';
import { useMochipadStore } from '../../stores/mochipadStore';
import './mochipad.css';
import { saveCut } from '../../services/cutService';

interface MochipadProps {
  cutId?: string;
  comicId?: string;
}

export function Mochipad({ cutId, comicId }: MochipadProps) {
  const containerRef = useCanvasSetup();
  const {
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

  const handleSave = async () => {
    console.log('Starting save process...');
    console.log('Cut ID:', cutId);
    console.log('Comic ID:', comicId);
    
    const store = useMochipadStore.getState();
    console.log('Getting layer data...');
    const { layerData, mergedImage } = store.getLayerData();
    
    console.log('Layer data retrieved:', {
      layer01: layerData.layer01 ? 'exists' : 'null',
      layer02: layerData.layer02 ? 'exists' : 'null',
      layer03: layerData.layer03 ? 'exists' : 'null',
      layer04: layerData.layer04 ? 'exists' : 'null',
      layer05: layerData.layer05 ? 'exists' : 'null',
    });
    console.log('Merged image size:', mergedImage.length, 'bytes');
    
    try {
      console.log('Attempting to save to database...');
      const savedData = await saveCut({
        id: cutId,
        comic_id: comicId,
        layer01: layerData.layer01,
        layer02: layerData.layer02,
        layer03: layerData.layer03,
        layer04: layerData.layer04,
        layer05: layerData.layer05,
        drawing: mergedImage,
        background_color: store.backgroundColor
      });
      
      console.log('Save successful:', savedData);
    } catch (error) {
      console.error('Failed to save:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
  };

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