import React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { BsBrush, BsEraser, BsFillBucketFill, BsArrowCounterclockwise, BsArrowClockwise } from 'react-icons/bs';
import { useCanvasDrawingStore } from '../../stores/canvasDrawingStore';
import { SizeSlider } from './SizeSlider';
import { OpacitySlider } from './OpacitySlider';

export function CanvasDrawingToolbar() {
  const {
    currentTool,
    setCurrentTool,
    brushSettings,
    eraserSettings,
    setBrushSize,
    setEraserSize,
    setOpacity,
    setEraserOpacity,
    undo,
    redo,
    canUndo,
    canRedo
  } = useCanvasDrawingStore();

  return (
    <div className="drawing-toolbar mb-3 d-flex align-items-center gap-3">
      <ButtonGroup>
        <Button
          variant={currentTool === 'brush' ? 'primary' : 'outline-primary'}
          onClick={() => setCurrentTool('brush')}
          title="Brush"
        >
          <BsBrush />
        </Button>
        <Button
          variant={currentTool === 'eraser' ? 'primary' : 'outline-primary'}
          onClick={() => setCurrentTool('eraser')}
          title="Eraser"
        >
          <BsEraser />
        </Button>
        <Button
          variant={currentTool === 'bucket' ? 'primary' : 'outline-primary'}
          onClick={() => setCurrentTool('bucket')}
          title="Paint Bucket"
        >
          <BsFillBucketFill />
        </Button>
      </ButtonGroup>

      <div className="d-inline-block">
        <SizeSlider
          value={currentTool === 'eraser' ? eraserSettings.size : brushSettings.size}
          onChange={currentTool === 'eraser' ? setEraserSize : setBrushSize}
        />
      </div>

      <div className="d-inline-block">
        <OpacitySlider
          value={currentTool === 'eraser' ? eraserSettings.opacity : brushSettings.opacity}
          onChange={currentTool === 'eraser' ? setEraserOpacity : setOpacity}
        />
      </div>

      <ButtonGroup>
        <Button
          variant="outline-secondary"
          onClick={undo}
          disabled={!canUndo()}
          title="Undo (Ctrl+Z)"
        >
          <BsArrowCounterclockwise />
        </Button>
        <Button
          variant="outline-secondary"
          onClick={redo}
          disabled={!canRedo()}
          title="Redo (Ctrl+Y)"
        >
          <BsArrowClockwise />
        </Button>
      </ButtonGroup>
    </div>
  );
}