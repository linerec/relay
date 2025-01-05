import React, { useEffect, useRef } from 'react';
import { useCanvasDrawingStore } from '../../stores/canvasDrawingStore';
import { CanvasDrawingToolbar } from './CanvasDrawingToolbar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useAutoSave } from '../../hooks/useAutoSave';
import { Button } from 'react-bootstrap';
import './styles.css';

interface CanvasDrawingEditorProps {
  initialImage?: string;
  onSave: (imageData: string) => void;
}

export function CanvasDrawingEditor({ initialImage, onSave }: CanvasDrawingEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
    
    if (currentTool === 'eraser') {
      context.globalCompositeOperation = 'destination-out';
      context.lineWidth = eraserSettings.size;
    } else {
      context.globalCompositeOperation = 'source-over';
      context.strokeStyle = brushColor;
      context.lineWidth = brushSettings.size;
    }

    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!canvasRef.current || !isDrawing) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.closePath();
    setIsDrawing(false);
    
    // Add to history
    addToHistory(context.getImageData(0, 0, canvas.width, canvas.height));
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="drawing-editor">
      <CanvasDrawingToolbar />
      <div className="canvas-container border rounded">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
      <div className="mt-3">
        <Button variant="primary" onClick={handleSave}>Save Drawing</Button>
      </div>
    </div>
  );
}