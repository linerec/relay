import React from 'react';
import { Button, ButtonGroup, Form } from 'react-bootstrap';
import { useCanvasDrawingStore } from '../../stores/canvasDrawingStore';
import { Paintbrush, Eraser, Undo2, Redo2 } from 'lucide-react';

export function CanvasDrawingToolbar() {
  const {
    currentTool,
    setCurrentTool,
    brushColor,
    setBrushColor,
    brushSettings,
    setBrushSize,
    eraserSettings,
    setEraserSize,
    undo,
    redo,
    canUndo,
    canRedo
  } = useCanvasDrawingStore();

  return (
    <div className="drawing-toolbar d-flex gap-3 align-items-center mb-3">
      <ButtonGroup>
        <Button
          variant={currentTool === 'brush' ? 'primary' : 'outline-primary'}
          onClick={() => setCurrentTool('brush')}
          title="Brush (B)"
        >
          <Paintbrush size={16} />
        </Button>
        <Button
          variant={currentTool === 'eraser' ? 'primary' : 'outline-primary'}
          onClick={() => setCurrentTool('eraser')}
          title="Eraser (E)"
        >
          <Eraser size={16} />
        </Button>
      </ButtonGroup>

      {currentTool === 'brush' && (
        <Form.Control
          type="color"
          value={brushColor}
          onChange={(e) => setBrushColor(e.target.value)}
          title="Choose brush color"
        />
      )}
      
      {(currentTool === 'brush' || currentTool === 'eraser') && (
        <Form.Group className="d-flex align-items-center gap-2">
          <Form.Label className="mb-0">Size:</Form.Label>
          <Form.Range
            value={currentTool === 'brush' ? brushSettings.size : eraserSettings.size}
            onChange={(e) => currentTool === 'brush' 
              ? setBrushSize(Number(e.target.value))
              : setEraserSize(Number(e.target.value))
            }
            min="1"
            max={currentTool === 'brush' ? "50" : "100"}
            className="w-auto"
          />
        </Form.Group>
      )}

      <ButtonGroup>
        <Button
          variant="outline-secondary"
          onClick={undo}
          disabled={!canUndo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </Button>
        <Button
          variant="outline-secondary"
          onClick={redo}
          disabled={!canRedo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </Button>
      </ButtonGroup>
    </div>
  );
}