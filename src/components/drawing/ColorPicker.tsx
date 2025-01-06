import React, { useRef } from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { BsPalette } from 'react-icons/bs';
import { useCanvasDrawingStore } from '../../stores/canvasDrawingStore';

export function ColorPicker() {
  const { brushColor, setBrushColor, recentColors, defaultColors } = useCanvasDrawingStore();
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleColorButtonClick = () => {
    colorInputRef.current?.click();
  };

  return (
    <div className="color-picker-container d-flex flex-column gap-2">
      <div className="d-flex align-items-center gap-2">
        <Button
          variant="outline-secondary"
          className="d-flex align-items-center position-relative"
          onClick={handleColorButtonClick}
          style={{ 
            backgroundColor: brushColor,
            borderColor: '#dee2e6',
            width: '38px',
            height: '38px',
            padding: '6px'
          }}
        >
          <BsPalette style={{ 
            color: getContrastColor(brushColor),
            width: '100%',
            height: '100%'
          }} />
          <input
            ref={colorInputRef}
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            style={{
              position: 'absolute',
              opacity: 0,
              width: '100%',
              height: '100%',
              left: 0,
              top: 0,
              cursor: 'pointer'
            }}
          />
        </Button>
      </div>

      <div className="default-colors">
        <small className="text-muted d-block mb-1">Default Colors</small>
        <ButtonGroup className="d-flex flex-wrap gap-1">
          {defaultColors.map((color, index) => (
            <Button
              key={index}
              variant="outline-secondary"
              className="color-button"
              style={{
                backgroundColor: color,
                width: '24px',
                height: '24px',
                padding: 0,
                border: brushColor === color ? '2px solid #0d6efd' : '1px solid #dee2e6'
              }}
              onClick={() => setBrushColor(color)}
            />
          ))}
        </ButtonGroup>
      </div>

      {recentColors.length > 0 && (
        <div className="recent-colors">
          <small className="text-muted d-block mb-1">Recent Colors</small>
          <ButtonGroup className="d-flex flex-wrap gap-1">
            {recentColors.map((color, index) => (
              <Button
                key={index}
                variant="outline-secondary"
                className="color-button"
                style={{
                  backgroundColor: color,
                  width: '24px',
                  height: '24px',
                  padding: 0,
                  border: brushColor === color ? '2px solid #0d6efd' : '1px solid #dee2e6'
                }}
                onClick={() => setBrushColor(color)}
              />
            ))}
          </ButtonGroup>
        </div>
      )}
    </div>
  );
}

function getContrastColor(hexcolor: string) {
  const r = parseInt(hexcolor.slice(1, 3), 16);
  const g = parseInt(hexcolor.slice(3, 5), 16);
  const b = parseInt(hexcolor.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#ffffff';
} 