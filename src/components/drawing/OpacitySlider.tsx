import React from 'react';
import { Form } from 'react-bootstrap';

interface OpacitySliderProps {
  value: number;
  onChange: (opacity: number) => void;
}

export function OpacitySlider({ value, onChange }: OpacitySliderProps) {
  return (
    <Form.Group className="d-flex align-items-center gap-2">
      <Form.Label className="mb-0 me-2" style={{ minWidth: '65px' }}>Opacity:</Form.Label>
      <Form.Range
        value={value * 100}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        min="1"
        max="100"
        style={{ width: '120px' }}
      />
      <span className="ms-2 text-muted" style={{ minWidth: '2.5rem' }}>
        {Math.round(value * 100)}%
      </span>
    </Form.Group>
  );
} 