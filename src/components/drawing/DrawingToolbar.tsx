import React, { useState } from 'react';
import { Button, Form, ButtonGroup } from 'react-bootstrap';
import { Undo2, Redo2, Type, Eraser, Paintbrush, MousePointer, Trash2 } from 'lucide-react';
import { useDrawingStore } from '../../stores/drawingStore';
import { TextEditor } from './TextEditor';

export function DrawingToolbar() {
  const [showTextEditor, setShowTextEditor] = useState(false);
  const {
    canvas,
    currentTool,
    setCurrentTool,
    brushColor,
    setBrushColor,
    brushSettings,
    setBrushSize,
    setBrushOpacity,
    eraserSettings,
    setEraserSize,
    setEraserOpacity,
    undo,
    redo,
    canUndo,
    canRedo,
    deleteSelectedObjects,
  } = useDrawingStore();

  const hasSelectedObjects = canvas?.getActiveObjects().length > 0;

  return (
    <>
      <div className="drawing-toolbar d-flex gap-3 align-items-center mb-3">
        <ButtonGroup>
          <Button
            variant={currentTool === 'select' ? 'primary' : 'outline-primary'}
            onClick={() => setCurrentTool('select')}
            title="Select (V)"
          >
            <MousePointer size={16} />
          </Button>
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
          <>
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

            <Form.Group className="d-flex align-items-center gap-2">
              <Form.Label className="mb-0">Opacity:</Form.Label>
              <Form.Range
                value={(currentTool === 'brush' ? brushSettings.opacity : eraserSettings.opacity) * 100}
                onChange={(e) => currentTool === 'brush'
                  ? setBrushOpacity(Number(e.target.value) / 100)
                  : setEraserOpacity(Number(e.target.value) / 100)
                }
                min="1"
                max="100"
                className="w-auto"
              />
            </Form.Group>
          </>
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

        <Button
          variant="outline-secondary"
          onClick={() => setShowTextEditor(true)}
          title="Add Text (T)"
        >
          <Type size={16} />
        </Button>

        {currentTool === 'select' && (
          <Button
            variant="outline-danger"
            onClick={deleteSelectedObjects}
            disabled={!hasSelectedObjects}
            title="Delete Selected (Delete)"
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>

      <TextEditor 
        show={showTextEditor}
        onHide={() => setShowTextEditor(false)}
      />
    </>
  );
}