import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useDrawingStore } from '../../stores/drawingStore';
import { DrawingToolbar } from './DrawingToolbar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useAutoSave } from '../../hooks/useAutoSave';
import { Button } from 'react-bootstrap';
import './styles.css';

interface DrawingEditorProps {
  initialImage?: string;
  onSave: (imageData: string) => void;
}

export function DrawingEditor({ initialImage, onSave }: DrawingEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const {
    setCanvas,
    currentTool,
    brushColor,
    brushSettings,
    eraserSettings,
  } = useDrawingStore();

  useKeyboardShortcuts();
  useAutoSave();

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric canvas
    fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      isDrawingMode: true,
      backgroundColor: '#ffffff',
    });

    setCanvas(fabricCanvasRef.current);

    // Load initial image if provided
    if (initialImage) {
      fabric.Image.fromURL(initialImage, (img) => {
        if (!fabricCanvasRef.current) return;
        img.scaleToWidth(fabricCanvasRef.current.width!);
        fabricCanvasRef.current.add(img);
        fabricCanvasRef.current.renderAll();
      });
    }

    // Cleanup
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
        setCanvas(null);
      }
    };
  }, []);

  // Update brush settings
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const settings = currentTool === 'brush' ? brushSettings : eraserSettings;
    const color = currentTool === 'brush' ? brushColor : '#ffffff';

    fabricCanvasRef.current.freeDrawingBrush.color = color;
    fabricCanvasRef.current.freeDrawingBrush.width = settings.size;
    fabricCanvasRef.current.freeDrawingBrush.opacity = settings.opacity;
  }, [currentTool, brushColor, brushSettings, eraserSettings]);

  const handleSave = () => {
    if (!fabricCanvasRef.current) return;
    const dataUrl = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1
    });
    onSave(dataUrl);
  };

  return (
    <div className="drawing-editor">
      <DrawingToolbar />
      <div className="canvas-container border rounded">
        <canvas ref={canvasRef} />
      </div>
      <div className="mt-3">
        <Button variant="primary" onClick={handleSave}>Save Drawing</Button>
      </div>
    </div>
  );
}