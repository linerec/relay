import React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { BsBrush, BsEraser } from 'react-icons/bs';
import { useMochipadStore } from '../../stores/mochipadStore';
import { OpacitySlider } from '../drawing/OpacitySlider';
import { SizeSlider } from '../drawing/SizeSlider';
import { ColorPicker } from '../drawing/ColorPicker';

export function MochipadToolbar() {
  const {
    brushSize,
    brushColor,
    brushOpacity,
    setBrushSize,
    setBrushColor,
    setBrushOpacity,
  } = useMochipadStore();

  return (
    <div className="mochipad-toolbar mb-3 d-flex align-items-center gap-3">
      <ButtonGroup>
        <Button
          variant="outline-primary"
          title="Brush"
        >
          <BsBrush />
        </Button>
        <Button
          variant="outline-primary"
          title="Eraser"
        >
          <BsEraser />
        </Button>
      </ButtonGroup>

      <div className="d-inline-block">
        <SizeSlider
          value={brushSize}
          onChange={setBrushSize}
        />
      </div>

      <div className="d-inline-block">
        <OpacitySlider
          value={brushOpacity}
          onChange={setBrushOpacity}
        />
      </div>

      <div className="d-inline-block">
        <ColorPicker
          color={brushColor}
          onChange={setBrushColor}
        />
      </div>
    </div>
  );
} 