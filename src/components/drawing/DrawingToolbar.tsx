import React, { useState } from 'react';
import { Button, Form, ButtonGroup, Badge } from 'react-bootstrap';
import { Undo2, Redo2, Type, Eraser, Paintbrush, MousePointer, Trash2 } from 'lucide-react';
import { useDrawingStore } from '../../stores/drawingStore';
import { TextEditor } from './TextEditor';

export function DrawingToolbar() {
  const isDev = import.meta.env.VITE_DEV_MODE === 'true';
  const [showTextEditor, setShowTextEditor] = useState(false);
  const {
    canvas,
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
    canRedo,
    deleteSelectedObjects,
  } = useDrawingStore();

  const hasSelectedObjects = canvas?.getActiveObjects().length > 0;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === 'image/png' || file.type === 'image/jpeg') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        window.dispatchEvent(new CustomEvent('uploadImage', { detail: dataUrl }));
      };
      reader.readAsDataURL(file);
    } else {
      alert('PNG 또는 JPG 파일만 업로드할 수 있습니다.');
    }
  };

  const handleToolChange = (tool: 'select' | 'brush' | 'eraser') => {
    setCurrentTool(tool);

    if (tool === 'eraser' && canvas) {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = '#ffffff';
      canvas.freeDrawingBrush.width = eraserSettings.size;
    } else if (tool === 'brush' && canvas) {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushSettings.size;
    } else if (canvas) {
      canvas.isDrawingMode = false;
    }
  };

  const handleEraserSizeChange = (size: number) => {
    setEraserSize(size);
    if (canvas && currentTool === 'eraser') {
      canvas.freeDrawingBrush.width = size;
    }
  };

  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size);
    if (canvas && currentTool === 'brush') {
      canvas.freeDrawingBrush.width = size;
    }
  };

  return (
    <>
      <div className="drawing-toolbar d-flex gap-3 align-items-center mb-3">
        {isDev && (
          <Badge bg="info" className="me-2">
            Current Tool: {currentTool.charAt(0).toUpperCase() + currentTool.slice(1)}
          </Badge>
        )}
        <ButtonGroup>
          <Button
            variant={currentTool === 'select' ? 'primary' : 'outline-primary'}
            onClick={() => handleToolChange('select')}
            title="Select (V)"
            active={currentTool === 'select'}
          >
            <MousePointer size={16} />
          </Button>
          <Button
            variant={currentTool === 'brush' ? 'primary' : 'outline-primary'}
            onClick={() => handleToolChange('brush')}
            title="Brush (B)"
            active={currentTool === 'brush'}
          >
            <Paintbrush size={16} />
          </Button>
          <Button
            variant={currentTool === 'eraser' ? 'primary' : 'outline-primary'}
            onClick={() => handleToolChange('eraser')}
            title="Eraser (E)"
            active={currentTool === 'eraser'}
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

        {currentTool === 'brush' && (
          <Form.Group className="d-flex align-items-center gap-2">
            <Form.Label className="mb-0">Brush Size:</Form.Label>
            <Form.Range
              value={brushSettings.size}
              onChange={(e) => handleBrushSizeChange(Number(e.target.value))}
              min="1"
              max="50"
              className="w-auto"
            />
            <span className="ms-2">{brushSettings.size}px</span>
          </Form.Group>
        )}

        {currentTool === 'eraser' && (
          <Form.Group className="d-flex align-items-center gap-2">
            <Form.Label className="mb-0">Eraser Size:</Form.Label>
            <Form.Range
              value={eraserSettings.size}
              onChange={(e) => handleEraserSizeChange(Number(e.target.value))}
              min="1"
              max="100"
              className="w-auto"
            />
            <span className="ms-2">{eraserSettings.size}px</span>
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

        <Button variant="secondary" onClick={() => document.getElementById('image-upload')?.click()}>
          Upload Image
        </Button>
        <input
          type="file"
          id="image-upload"
          accept="image/png, image/jpeg"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
      </div>

      <TextEditor
        show={showTextEditor}
        onHide={() => setShowTextEditor(false)}
      />
    </>
  );
}